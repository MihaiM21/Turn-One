using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace API.Hubs;

// Temporarily disable authorization for debugging
// [Authorize]
public class F1LiveDataHub : Hub
{
    private readonly ILogger<F1LiveDataHub> _logger;

    public F1LiveDataHub(ILogger<F1LiveDataHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"Client connected: {Context.ConnectionId}");
        
        // Log detailed connection information for debugging
        var httpContext = Context.GetHttpContext();
        _logger.LogInformation($"Client IP: {httpContext?.Connection?.RemoteIpAddress}");
        _logger.LogInformation($"User: {Context.User?.Identity?.Name ?? "Anonymous"}");
        _logger.LogInformation($"Headers: {string.Join(", ", httpContext?.Request.Headers.Select(h => $"{h.Key}={h.Value}") ?? Array.Empty<string>())}");
        
        // Add to F1 data group
        await Groups.AddToGroupAsync(Context.ConnectionId, "F1LiveData");
        
        // Send a welcome message to confirm connection
        await Clients.Caller.SendAsync("ReceiveFeedData", new { 
            FeedName = "ConnectionStatus", 
            Data = new { Status = "Connected", ConnectionId = Context.ConnectionId }, 
            Timestamp = DateTime.UtcNow 
        });
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
        
        // Remove from F1 data group
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "F1LiveData");
        
        await base.OnDisconnectedAsync(exception);
    }

    // Method for clients to join specific data feeds
    public async Task SubscribeToFeed(string feedName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"F1_{feedName}");
        //_logger.LogInformation($"Client {Context.ConnectionId} subscribed to feed: {feedName}");
    }

    // Method for clients to leave specific data feeds
    public async Task UnsubscribeFromFeed(string feedName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"F1_{feedName}");
        //_logger.LogInformation($"Client {Context.ConnectionId} unsubscribed from feed: {feedName}");
    }

    // Method to request current session status
    public async Task RequestSessionStatus()
    {
        // This could trigger sending the latest session info to the requesting client
        await Clients.Caller.SendAsync("SessionStatus", new { Status = "Live", SessionType = "Race" });
    }
    
    // Methods for joining/leaving the main F1 data group
    public async Task JoinF1DataGroup()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "F1LiveData");
        _logger.LogInformation($"Client {Context.ConnectionId} manually joined F1LiveData group");
    }
    
    public async Task LeaveF1DataGroup()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "F1LiveData");
        _logger.LogInformation($"Client {Context.ConnectionId} manually left F1LiveData group");
    }
}