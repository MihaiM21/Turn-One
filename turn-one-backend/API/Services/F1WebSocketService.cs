using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;

namespace API.Services;

public class F1WebSocketService
{
    private readonly ILogger<F1WebSocketService> _logger;
    private readonly ConcurrentDictionary<string, WebSocket> _sockets = new();
    private readonly F1LiveTimingService _f1Service;

    public F1WebSocketService(ILogger<F1WebSocketService> logger, F1LiveTimingService f1Service)
    {
        _logger = logger;
        _f1Service = f1Service;

        // Subscribe to F1 data updates
        _f1Service.OnDataReceived += BroadcastData;
    }

    public async Task HandleWebSocket(HttpContext context, WebSocket webSocket)
    {
        var socketId = Guid.NewGuid().ToString();
        _sockets.TryAdd(socketId, webSocket);

        try
        {
            _logger.LogInformation("WebSocket client connected: {SocketId}", socketId);

            // Keep connection alive until closed
            var buffer = new byte[1024 * 4];
            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(
                    new ArraySegment<byte>(buffer), CancellationToken.None);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await webSocket.CloseAsync(
                        WebSocketCloseStatus.NormalClosure,
                        "Client requested close",
                        CancellationToken.None);
                    break;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling WebSocket connection for {SocketId}", socketId);
        }
        finally
        {
            _sockets.TryRemove(socketId, out _);
            if (webSocket.State == WebSocketState.Open)
            {
                await webSocket.CloseAsync(
                    WebSocketCloseStatus.InternalServerError,
                    "Server error",
                    CancellationToken.None);
            }
            _logger.LogInformation("WebSocket client disconnected: {SocketId}", socketId);
        }
    }

    private async void BroadcastData(string data)
    {
        var deadSockets = new List<string>();
        var bytes = Encoding.UTF8.GetBytes(data);
        var arraySegment = new ArraySegment<byte>(bytes);

        foreach (var socket in _sockets)
        {
            try
            {
                if (socket.Value.State == WebSocketState.Open)
                {
                    await socket.Value.SendAsync(
                        arraySegment,
                        WebSocketMessageType.Text,
                        true,
                        CancellationToken.None);
                }
                else
                {
                    deadSockets.Add(socket.Key);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending data to WebSocket {SocketId}", socket.Key);
                deadSockets.Add(socket.Key);
            }
        }

        // Clean up dead sockets
        foreach (var socketId in deadSockets)
        {
            _sockets.TryRemove(socketId, out _);
        }
    }
}