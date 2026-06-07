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
    private const char RecordSeparator = '';

    private readonly ILogger<F1LiveTimingService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IHubContext<F1LiveDataHub> _hubContext;
    private readonly string _baseUrl;
    private ClientWebSocket? _clientWebSocket;
    private bool _isConnected;
    private CancellationTokenSource? _cancellationTokenSource;
    private string _subscribeInvocationId = string.Empty;

    private readonly string _dataStoragePath;
    private ConcurrentDictionary<string, object> _currentState = new();
    private ConcurrentDictionary<string, object> _lastReceivedData = new();
    private DateTime _lastDataTimestamp = DateTime.MinValue;

    public event Action<string>? OnDataReceived;

    public F1LiveTimingService(
        ILogger<F1LiveTimingService> logger,
        IHttpClientFactory httpClientFactory,
        IHubContext<F1LiveDataHub> hubContext,
        IConfiguration configuration)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _hubContext = hubContext;
        _baseUrl = (configuration["F1:LiveTimingUrl"]
            ?? "https://f1-proxy.YOUR-WORKER.workers.dev").TrimEnd('/');

        var appDataPath = Path.Combine(AppContext.BaseDirectory, "Data", "F1LiveData");
        Directory.CreateDirectory(appDataPath);
        _dataStoragePath = Path.Combine(appDataPath, "f1-state.json");

        LoadPersistedData();
    }

    public async Task StartAsync()
    {
        if (_isConnected)
        {
            _logger.LogWarning("F1 live timing service is already connected");
            return;
        }

        _cancellationTokenSource = new CancellationTokenSource();

        try
        {
            var (connectionToken, cookies) = await NegotiateConnectionAsync();

            _clientWebSocket = new ClientWebSocket();
            _clientWebSocket.Options.SetRequestHeader("User-Agent", "Turn-One-F1-Client/1.0");
            if (!string.IsNullOrEmpty(cookies))
                _clientWebSocket.Options.SetRequestHeader("Cookie", cookies);

            var wsBase = _baseUrl.Replace("https://", "wss://").Replace("http://", "ws://");
            var wsUrl = $"{wsBase}?id={Uri.EscapeDataString(connectionToken)}";

            await _clientWebSocket.ConnectAsync(new Uri(wsUrl), _cancellationTokenSource.Token);
            _isConnected = true;

            await SendHandshakeAsync();
            await SubscribeToFeeds();

            _ = ReceiveMessagesAsync(_cancellationTokenSource.Token);

            _logger.LogInformation("F1 live timing service started successfully (SignalR Core via {BaseUrl})", _baseUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start F1 live timing service");
            await StopAsync();
            throw;
        }
    }

    public async Task StopAsync()
    {
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

    private async Task<(string connectionToken, string cookies)> NegotiateConnectionAsync()
    {
        var httpClient = _httpClientFactory.CreateClient();
        httpClient.DefaultRequestHeaders.Add("User-Agent", "Turn-One-F1-Client/1.0");

        var negotiationUrl = $"{_baseUrl}/negotiate?negotiateVersion=1";

        HttpResponseMessage response;
        using (var postReq = new HttpRequestMessage(HttpMethod.Post, negotiationUrl))
        {
            postReq.Content = new StringContent(string.Empty);
            response = await httpClient.SendAsync(postReq);
            if (response.StatusCode == System.Net.HttpStatusCode.MethodNotAllowed)
            {
                response.Dispose();
                response = await httpClient.GetAsync(negotiationUrl);
            }
        }
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var negotiationData = JsonSerializer.Deserialize<JsonElement>(content);

        string? connectionToken = null;
        if (negotiationData.TryGetProperty("connectionToken", out var ct))
            connectionToken = ct.GetString();
        else if (negotiationData.TryGetProperty("ConnectionToken", out var ctOld))
            connectionToken = ctOld.GetString();

        if (string.IsNullOrEmpty(connectionToken))
            throw new InvalidOperationException("No connection token in negotiation response");

        var cookies = response.Headers.TryGetValues("Set-Cookie", out var cookieValues)
            ? string.Join("; ", cookieValues)
            : string.Empty;

        return (connectionToken, cookies);
    }

    private async Task SendHandshakeAsync()
    {
        if (_clientWebSocket?.State != WebSocketState.Open)
            throw new InvalidOperationException("WebSocket not connected");

        var handshake = "{\"protocol\":\"json\",\"version\":1}" + RecordSeparator;
        var buffer = Encoding.UTF8.GetBytes(handshake);
        await _clientWebSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
    }

    private async Task SubscribeToFeeds()
    {
        if (_clientWebSocket?.State != WebSocketState.Open)
            throw new InvalidOperationException("WebSocket not connected");

        _subscribeInvocationId = Guid.NewGuid().ToString();

        var subscriptionMessage = new
        {
            type = 1,
            invocationId = _subscribeInvocationId,
            target = "Subscribe",
            arguments = new[]
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
            }
        };

        var json = JsonSerializer.Serialize(subscriptionMessage) + RecordSeparator;
        var buffer = Encoding.UTF8.GetBytes(json);
        await _clientWebSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
    }

    private async Task ReceiveMessagesAsync(CancellationToken cancellationToken)
    {
        var buffer = new byte[32768];
        var pending = new StringBuilder();

        try
        {
            while (!cancellationToken.IsCancellationRequested && _clientWebSocket?.State == WebSocketState.Open)
            {
                var result = await _clientWebSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    _logger.LogInformation("WebSocket close message received");
                    await StopAsync();
                    return;
                }

                pending.Append(Encoding.UTF8.GetString(buffer, 0, result.Count));

                if (!result.EndOfMessage) continue;

                var text = pending.ToString();
                pending.Clear();

                foreach (var fragment in text.Split(RecordSeparator))
                {
                    if (string.IsNullOrWhiteSpace(fragment)) continue;
                    OnDataReceived?.Invoke(fragment);
                    await ProcessAndBroadcastF1Data(fragment);
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
    }

    private async Task ProcessAndBroadcastF1Data(string rawMessage)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(rawMessage)) return;

            JsonDocument? document = null;

            try
            {
                document = JsonDocument.Parse(rawMessage);
                var root = document.RootElement;

                if (root.TryGetProperty("type", out var typeElement))
                {
                    var msgType = typeElement.GetInt32();
                    switch (msgType)
                    {
                        case 1:
                            if (root.TryGetProperty("target", out var target)
                                && target.GetString() == "feed"
                                && root.TryGetProperty("arguments", out var args)
                                && args.ValueKind == JsonValueKind.Array)
                            {
                                var argArr = args.EnumerateArray().ToArray();
                                if (argArr.Length >= 2)
                                {
                                    var field = argArr[0].GetString();
                                    var value = argArr[1];
                                    if (!string.IsNullOrEmpty(field))
                                    {
                                        if (field == "CarData.z" || field == "Position.z")
                                            UpdateState(field.Split('.')[0], value);
                                        else
                                            UpdateState(field, value);
                                    }
                                }
                            }
                            break;

                        case 3:
                            if (root.TryGetProperty("invocationId", out var invId)
                                && invId.GetString() == _subscribeInvocationId
                                && root.TryGetProperty("result", out var resultElement)
                                && resultElement.ValueKind == JsonValueKind.Object)
                            {
                                foreach (var property in resultElement.EnumerateObject())
                                {
                                    var field = property.Name;
                                    var value = property.Value;
                                    if (field == "CarData.z" || field == "Position.z")
                                        UpdateState(field.Split('.')[0], value);
                                    else
                                        UpdateState(field, value);
                                }
                            }
                            break;

                        case 6:
                            return;

                        case 7:
                            _logger.LogWarning("Server sent Close message: {Raw}", rawMessage);
                            break;
                    }
                }

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

            var rawData = new
            {
                Type = "RawF1Data",
                Data = rawMessage,
                Timestamp = DateTime.UtcNow
            };

            await _hubContext.Clients.Group("F1LiveData").SendAsync("ReceiveRawData", rawData);
            await _hubContext.Clients.Group("F1LiveData").SendAsync("ReceiveStateData", GetCurrentData());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing or broadcasting F1 data");
        }
    }

    private void UpdateState(string field, JsonElement value)
    {
        if (string.IsNullOrEmpty(field)) return;
        try
        {
            object? typedValue = ExtractValue(value);
            if (typedValue != null)
            {
                _currentState[field] = typedValue;
                _lastReceivedData[field] = typedValue;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to update state for field {Field}", field);
        }
    }

    private static object? ExtractValue(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.String: return element.GetString();
            case JsonValueKind.Number:
                if (element.TryGetInt32(out int intValue)) return intValue;
                if (element.TryGetInt64(out long longValue)) return longValue;
                if (element.TryGetDouble(out double doubleValue)) return doubleValue;
                return null;
            case JsonValueKind.True: return true;
            case JsonValueKind.False: return false;
            case JsonValueKind.Object:
                var obj = new Dictionary<string, object?>();
                foreach (var property in element.EnumerateObject())
                    obj[property.Name] = ExtractValue(property.Value);
                return obj;
            case JsonValueKind.Array:
                return element.EnumerateArray().Select(ExtractValue).ToArray();
            default: return null;
        }
    }

    public bool IsConnected => _isConnected && _clientWebSocket?.State == WebSocketState.Open;

    public Task<string> GetConnectionStatusAsync()
        => Task.FromResult(IsConnected ? "Connected" : "Disconnected");

    private void LoadPersistedData()
    {
        try
        {
            if (!File.Exists(_dataStoragePath)) return;
            var jsonData = File.ReadAllText(_dataStoragePath);
            var persistedData = JsonSerializer.Deserialize<F1PersistedData>(jsonData);
            if (persistedData != null)
            {
                _lastReceivedData = new ConcurrentDictionary<string, object>(
                    persistedData.LastReceivedData ?? new Dictionary<string, object>());
                _lastDataTimestamp = persistedData.LastUpdated;
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
            var jsonData = JsonSerializer.Serialize(persistedData, new JsonSerializerOptions { WriteIndented = false });
            File.WriteAllText(_dataStoragePath, jsonData);
            _lastDataTimestamp = persistedData.LastUpdated;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to persist F1 data");
        }
    }

    public Dictionary<string, object> GetCurrentData()
        => _currentState.Count > 0
            ? new Dictionary<string, object>(_currentState)
            : new Dictionary<string, object>(_lastReceivedData);

    public Dictionary<string, object> GetLastReceivedData() => new(_lastReceivedData);
    public DateTime GetLastDataTimestamp() => _lastDataTimestamp;

    public void ClearPersistedData()
    {
        try
        {
            if (File.Exists(_dataStoragePath)) File.Delete(_dataStoragePath);
            _lastReceivedData.Clear();
            _lastDataTimestamp = DateTime.MinValue;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to clear persisted data");
        }
    }

    private class F1PersistedData
    {
        public Dictionary<string, object> LastReceivedData { get; set; } = new();
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}
