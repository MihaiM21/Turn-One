using System.Net.WebSockets;
using API.Services;

namespace API.Middleware;

public class WebSocketMiddleware
{
    private readonly RequestDelegate _next;
    private readonly F1WebSocketService _webSocketService;
    private readonly ILogger<WebSocketMiddleware> _logger;

    public WebSocketMiddleware(
        RequestDelegate next,
        F1WebSocketService webSocketService,
        ILogger<WebSocketMiddleware> logger)
    {
        _next = next;
        _webSocketService = webSocketService;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path == "/ws")
        {
            if (context.WebSockets.IsWebSocketRequest)
            {
                using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                _logger.LogInformation("WebSocket connection established");
                await _webSocketService.HandleWebSocket(context, webSocket);
            }
            else
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsync("WebSocket connection expected");
            }
        }
        else
        {
            await _next(context);
        }
    }
}