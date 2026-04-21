using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;
using Application.DTOs;

namespace API.Hubs;

[Authorize]
public class SimTelemetryHub : Hub
{
    // The ingestion service will call this client method: ReceiveTelemetry(string type, JsonElement data, long timestamp)
    
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public async Task SubscribeToOwnTelemetry()
    {
        var userId = Context.UserIdentifier;
        if (userId != null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"telemetry_{userId}");
        }
    }

    public async Task SpectateSession(Guid sessionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"spectate_{sessionId}");
    }

    public async Task StopSpectating(Guid sessionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"spectate_{sessionId}");
    }
}
