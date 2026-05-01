using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.SignalR;
using API.Hubs;
using System.IO;
using System.Collections.Concurrent;

namespace API.Services;

public class F1LiveTimingService
{
    private readonly ILogger<F1LiveTimingService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IHubContext<F1LiveDataHub> _hubContext;
    private ClientWebSocket? _clientWebSocket;
    private bool _isConnected;
    private CancellationTokenSource? _cancellationTokenSource;
    private CancellationTokenSource? _retryCts;
    
    // Data persistence
    private readonly string _dataStoragePath;
    private ConcurrentDictionary<string, object> _currentState = new();
    private ConcurrentDictionary<string, object> _lastReceivedData = new();
    private DateTime _lastDataTimestamp = DateTime.MinValue;

    // Event for when data is received (keeping for backward compatibility)
    public event Action<string>? OnDataReceived;

    public F1LiveTimingService(ILogger<F1LiveTimingService> logger, IHttpClientFactory httpClientFactory, IHubContext<F1LiveDataHub> hubContext)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _hubContext = hubContext;
        
        // Set up data storage path in the app directory
        var appDataPath = Path.Combine(AppContext.BaseDirectory, "Data", "F1LiveData");
        Directory.CreateDirectory(appDataPath); // Ensure directory exists
        _dataStoragePath = Path.Combine(appDataPath, "f1-state.json");
        
        // Load any persisted data when service starts
        LoadPersistedData();
    }

    public async Task StartAsync()
    {
        _retryCts = new CancellationTokenSource();
        await TryConnectAsync();
        if (!_isConnected)
            _ = RetryLoopAsync(_retryCts.Token);
    }

    private async Task TryConnectAsync()
    {
        if (_isConnected) return;

        _cancellationTokenSource = new CancellationTokenSource();

        try
        {
            var (connectionToken, cookies) = await NegotiateConnectionAsync();

            _clientWebSocket = new ClientWebSocket();
            var warpProxy = Environment.GetEnvironmentVariable("F1_WARP_PROXY");
            if (warpProxy != null)
                _clientWebSocket.Options.Proxy = new System.Net.WebProxy(warpProxy);
            _clientWebSocket.Options.SetRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
            _clientWebSocket.Options.SetRequestHeader("Accept-Language", "en-US,en;q=0.9");
            _clientWebSocket.Options.SetRequestHeader("Referer", "https://www.formula1.com/");
            _clientWebSocket.Options.SetRequestHeader("Origin", "https://www.formula1.com");
            _clientWebSocket.Options.SetRequestHeader("Cookie", cookies);

            var hub = Uri.EscapeDataString("[{\"name\":\"Streaming\"}]");
            var wsUrl = $"wss://livetiming.formula1.com/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionToken={Uri.EscapeDataString(connectionToken)}&connectionData={hub}";

            await _clientWebSocket.ConnectAsync(new Uri(wsUrl), _cancellationTokenSource.Token);
            _isConnected = true;

            await SubscribeToFeeds();
            _ = ReceiveMessagesAsync(_cancellationTokenSource.Token);

            _logger.LogInformation("F1 live timing service started successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start F1 live timing service");
            await StopAsync();
        }
    }

    private async Task RetryLoopAsync(CancellationToken ct)
    {
        // Retry every 5 minutes — F1 timing API is only up during active sessions
        var retryInterval = TimeSpan.FromMinutes(5);
        while (!ct.IsCancellationRequested)
        {
            try { await Task.Delay(retryInterval, ct); } catch (OperationCanceledException) { return; }
            if (_isConnected || ct.IsCancellationRequested) continue;
            _logger.LogInformation("Retrying F1 live timing connection...");
            await TryConnectAsync();
        }
    }

    public async Task StopAsync(bool permanent = false)
    {
        if (permanent && _retryCts != null)
        {
            _retryCts.Cancel();
            _retryCts.Dispose();
            _retryCts = null;
        }

        if (_cancellationTokenSource != null)
        {
            _cancellationTokenSource.Cancel();
            _cancellationTokenSource.Dispose();
            _cancellationTokenSource = null;
        }

        if (_clientWebSocket != null)
        {
            if (_clientWebSocket.State == WebSocketState.Open)
            {
                try
                {
                    await _clientWebSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Stopping service", CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error closing WebSocket connection");
                }
            }
            _clientWebSocket.Dispose();
            _clientWebSocket = null;
        }

        _isConnected = false;
        _logger.LogInformation("F1 live timing service stopped");
    }

    private static void AddBrowserHeaders(HttpClient httpClient)
    {
        httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        httpClient.DefaultRequestHeaders.Add("Accept", "application/json, text/plain, */*");
        httpClient.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
        httpClient.DefaultRequestHeaders.Add("Referer", "https://www.formula1.com/");
        httpClient.DefaultRequestHeaders.Add("Origin", "https://www.formula1.com");
    }

    private async Task<(string connectionToken, string cookies)> NegotiateConnectionAsync()
    {
        var httpClient = _httpClientFactory.CreateClient("F1");
        AddBrowserHeaders(httpClient);

        var hub = Uri.EscapeDataString("[{\"name\":\"Streaming\"}]");
        var negotiationUrl = $"https://livetiming.formula1.com/signalr/negotiate?connectionData={hub}&clientProtocol=1.5";

        var response = await httpClient.GetAsync(negotiationUrl);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var negotiationData = JsonSerializer.Deserialize<JsonElement>(content);
        var connectionToken = negotiationData.GetProperty("ConnectionToken").GetString()
            ?? throw new InvalidOperationException("No connection token in negotiation response");

        var cookies = string.Join("; ", response.Headers.GetValues("Set-Cookie"));

        return (connectionToken, cookies);
    }

    private async Task SubscribeToFeeds()
    {
        if (_clientWebSocket?.State != WebSocketState.Open)
            throw new InvalidOperationException("WebSocket not connected");

        var subscriptionMessage = new
        {
            H = "Streaming",
            M = "Subscribe",
            A = new[]
            {
                new[]
                {
                    "Heartbeat",
                    "CarData.z",
                    "Position.z",
                    "ExtrapolatedClock",
                    "TimingStats",
                    "TimingAppData",
                    "WeatherData",
                    "TrackStatus",
                    "DriverList",
                    "RaceControlMessages",
                    "SessionInfo",
                    "SessionData",
                    "LapCount",
                    "TimingData",
                    "TeamRadio",
                }
            },
            I = 1
        };

        var subscriptionJson = JsonSerializer.Serialize(subscriptionMessage);
        var buffer = Encoding.UTF8.GetBytes(subscriptionJson);
        await _clientWebSocket.SendAsync(
            new ArraySegment<byte>(buffer),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None);
    }

    private async Task ReceiveMessagesAsync(CancellationToken cancellationToken)
    {
        var buffer = new byte[32768]; // 32KB buffer
        var message = new StringBuilder();

        try
        {
            while (!cancellationToken.IsCancellationRequested && _clientWebSocket?.State == WebSocketState.Open)
            {
                var result = await _clientWebSocket.ReceiveAsync(
                    new ArraySegment<byte>(buffer),
                    cancellationToken);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    _logger.LogInformation("WebSocket close message received");
                    await StopAsync();
                    return;
                }

                var receivedChunk = Encoding.UTF8.GetString(buffer, 0, result.Count);
                _logger.LogDebug($"Received WebSocket chunk: {result.Count} bytes");
                message.Append(receivedChunk);

                if (result.EndOfMessage)
                {
                    var fullMessage = message.ToString();
                    _logger.LogInformation($"Received complete F1 message: {fullMessage.Length} bytes");
                    
                    // Log the first 200 characters to avoid overwhelming the console
                    var previewMessage = fullMessage.Length <= 200 
                        ? fullMessage 
                        : fullMessage.Substring(0, 200) + "...";
                    _logger.LogInformation($"F1 message preview: {previewMessage}");
                    
                    message.Clear();

                    // Process and broadcast the message
                    OnDataReceived?.Invoke(fullMessage);
                    
                    // Broadcast to SignalR clients
                    await ProcessAndBroadcastF1Data(fullMessage);
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("WebSocket receive operation cancelled");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error receiving WebSocket messages");
            await StopAsync();
        }

        // Connection ended — restart retry loop if app is still running
        if (_retryCts != null && !_retryCts.IsCancellationRequested)
        {
            _logger.LogInformation("F1 connection lost, scheduling reconnect...");
            _ = RetryLoopAsync(_retryCts.Token);
        }
    }

    private async Task ProcessAndBroadcastF1Data(string rawMessage)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(rawMessage))
            {
                _logger.LogWarning("Received empty F1 data message");
                return;
            }
            
            // Try to identify the message type for better logging
            string messageType = "Unknown";
            JsonDocument? document = null;
            JsonElement root;
            
            try
            {
                document = JsonDocument.Parse(rawMessage);
                root = document.RootElement;

                if (root.TryGetProperty("M", out var messagesElement))
                {
                    messageType = "SignalR Hub Message";
                    
                    // Process messages and update state - similar to TypeScript version
                    if (messagesElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var messageElement in messagesElement.EnumerateArray())
                        {
                            if (messageElement.TryGetProperty("M", out var methodElement) && 
                                methodElement.GetString() == "feed" && 
                                messageElement.TryGetProperty("A", out var argsElement) &&
                                argsElement.ValueKind == JsonValueKind.Array)
                            {
                                var args = argsElement.EnumerateArray().ToArray();
                                if (args.Length >= 2)
                                {
                                    var field = args[0].GetString();
                                    var value = args[1];
                                    
                                    if (!string.IsNullOrEmpty(field))
                                    {
                                        // Handle compressed data fields (same as TypeScript version)
                                        if (field == "CarData.z" || field == "Position.z")
                                        {
                                            var parsedField = field.Split('.')[0];
                                            
                                            // We'll store the compressed data for now
                                            // In a future update, we could add decompression like the TS version
                                            UpdateState(parsedField, value);
                                        }
                                        else
                                        {
                                            // Update state with regular fields
                                            UpdateState(field, value);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else if (root.TryGetProperty("R", out var responseElement))
                {
                    messageType = "SignalR Response";
                    
                    // Initial data load from subscription
                    if (root.TryGetProperty("I", out var invocationId) && invocationId.GetString() == "1")
                    {
                        foreach (var property in responseElement.EnumerateObject())
                        {
                            var field = property.Name;
                            var value = property.Value;
                            
                            // Similar handling as in message loop
                            if (field == "CarData.z" || field == "Position.z")
                            {
                                var parsedField = field.Split('.')[0];
                                UpdateState(parsedField, value);
                            }
                            else
                            {
                                UpdateState(field, value);
                            }
                        }
                    }
                }
                else if (root.TryGetProperty("S", out _))
                {
                    messageType = "SignalR System Message";
                }
                
                _logger.LogInformation($"F1 Data Message Type: {messageType}");
                
                // After processing, persist state if we have new data
                PersistData();
            }
            catch (JsonException)
            {
                _logger.LogInformation("F1 Data is not valid JSON");
            }
            finally
            {
                document?.Dispose();
            }
                
            // Send raw data directly without parsing (original behavior preserved)
            var rawData = new
            {
                Type = "RawF1Data",
                Data = rawMessage,
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation($"Broadcasting F1 data: {rawMessage.Length} bytes, type: {messageType}");
            
            // Broadcast to all clients in the F1LiveData group
            await _hubContext.Clients.Group("F1LiveData")
                .SendAsync("ReceiveRawData", rawData);
            
            // Also broadcast processed state data for clients that want structured data
            await _hubContext.Clients.Group("F1LiveData")
                .SendAsync("ReceiveStateData", GetCurrentData());
                
            _logger.LogInformation($"Broadcasted F1 data to clients at {DateTime.UtcNow:HH:mm:ss.fff}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing or broadcasting F1 data");
        }
    }
    
    private void UpdateState(string field, JsonElement value)
    {
        if (string.IsNullOrEmpty(field))
            return;
            
        try
        {
            // Convert JsonElement to appropriate .NET type
            object? typedValue = ExtractValue(value);
            
            if (typedValue != null)
            {
                // Real-time critical data gets immediate updates
                if (field == "TimingData" || field == "CarData" || field == "Position")
                {
                    _currentState[field] = typedValue;
                    _lastReceivedData[field] = typedValue;
                }
                else
                {
                    // Other fields update normally
                    _currentState[field] = typedValue;
                    _lastReceivedData[field] = typedValue;
                }
                
                _logger.LogDebug($"Updated state field: {field}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, $"Failed to update state for field {field}");
        }
    }
    
    private static object? ExtractValue(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.String:
                return element.GetString();
                
            case JsonValueKind.Number:
                if (element.TryGetInt32(out int intValue))
                    return intValue;
                if (element.TryGetInt64(out long longValue))
                    return longValue;
                if (element.TryGetDouble(out double doubleValue))
                    return doubleValue;
                return null;
                
            case JsonValueKind.True:
                return true;
                
            case JsonValueKind.False:
                return false;
                
            case JsonValueKind.Object:
                var obj = new Dictionary<string, object?>();
                foreach (var property in element.EnumerateObject())
                {
                    obj[property.Name] = ExtractValue(property.Value);
                }
                return obj;
                
            case JsonValueKind.Array:
                var array = element.EnumerateArray()
                    .Select(e => ExtractValue(e))
                    .ToArray();
                return array;
                
            default:
                return null;
        }
    }

    public bool IsConnected => _isConnected && _clientWebSocket?.State == WebSocketState.Open;

    public Task<string> GetConnectionStatusAsync()
    {
        if (!_isConnected || _clientWebSocket?.State != WebSocketState.Open)
            return Task.FromResult("Disconnected");

        return Task.FromResult("Connected");
    }
    
    #region Data Persistence Methods
    
    private void LoadPersistedData()
    {
        try
        {
            if (File.Exists(_dataStoragePath))
            {
                var jsonData = File.ReadAllText(_dataStoragePath);
                var persistedData = JsonSerializer.Deserialize<F1PersistedData>(jsonData);
                
                if (persistedData != null)
                {
                    _lastReceivedData = new ConcurrentDictionary<string, object>(
                        persistedData.LastReceivedData ?? new Dictionary<string, object>());
                    _lastDataTimestamp = persistedData.LastUpdated;
                    
                    _logger.LogInformation($"Loaded persisted F1 data from {_dataStoragePath}");
                    _logger.LogInformation($"Last data timestamp: {_lastDataTimestamp}");
                }
            }
            else
            {
                _logger.LogInformation("No persisted F1 data found");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load persisted F1 data");
        }
    }
    
    private void PersistData()
    {
        try
        {
            var persistedData = new F1PersistedData
            {
                LastReceivedData = new Dictionary<string, object>(_lastReceivedData),
                LastUpdated = DateTime.UtcNow
            };
            
            var jsonOptions = new JsonSerializerOptions
            {
                WriteIndented = false
            };
            
            var jsonData = JsonSerializer.Serialize(persistedData, jsonOptions);
            File.WriteAllText(_dataStoragePath, jsonData);
            
            _lastDataTimestamp = persistedData.LastUpdated;
            _logger.LogDebug($"Persisted F1 data to {_dataStoragePath}");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to persist F1 data");
        }
    }
    
    public Dictionary<string, object> GetCurrentData()
    {
        // Return current state if connected, otherwise return last received data
        return _currentState.Count > 0 
            ? new Dictionary<string, object>(_currentState) 
            : new Dictionary<string, object>(_lastReceivedData);
    }
    
    public Dictionary<string, object> GetLastReceivedData()
    {
        return new Dictionary<string, object>(_lastReceivedData);
    }
    
    public DateTime GetLastDataTimestamp()
    {
        return _lastDataTimestamp;
    }
    
    public void ClearPersistedData()
    {
        try
        {
            if (File.Exists(_dataStoragePath))
            {
                File.Delete(_dataStoragePath);
            }
            
            _lastReceivedData.Clear();
            _lastDataTimestamp = DateTime.MinValue;
            _logger.LogInformation("Cleared persisted F1 data");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to clear persisted data");
        }
    }
    
    #endregion
    
    // Data structure for persisting state to disk
    private class F1PersistedData
    {
        public Dictionary<string, object> LastReceivedData { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}