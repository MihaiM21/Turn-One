using Application.Interfaces;
using Domain;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace API.Hubs;

[Authorize]
public class SimTelemetryHub : Hub
{
    // Tracks viewer counts per spectated session. Owner heartbeats are excluded.
    private static readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, byte>> _spectators = new();
    private static readonly ConcurrentDictionary<string, HashSet<Guid>> _connectionSessions = new();

    private readonly ITelemetrySessionService _sessionService;

    public SimTelemetryHub(ITelemetrySessionService sessionService)
    {
        _sessionService = sessionService;
    }

    public override Task OnConnectedAsync() => base.OnConnectedAsync();

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connectionSessions.TryRemove(Context.ConnectionId, out var sessions))
        {
            foreach (var sessionId in sessions)
            {
                if (_spectators.TryGetValue(sessionId, out var set))
                {
                    set.TryRemove(Context.ConnectionId, out _);
                    await BroadcastViewerCount(sessionId, set.Count);
                }
            }
        }
        await base.OnDisconnectedAsync(exception);
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
        RejectScopedToken();
        await EnsureCanSpectateAsync(sessionId);
        await Groups.AddToGroupAsync(Context.ConnectionId, $"spectate_{sessionId}");

        var set = _spectators.GetOrAdd(sessionId, _ => new ConcurrentDictionary<string, byte>());
        set.TryAdd(Context.ConnectionId, 0);

        _connectionSessions.AddOrUpdate(
            Context.ConnectionId,
            _ => new HashSet<Guid> { sessionId },
            (_, existing) =>
            {
                existing.Add(sessionId);
                return existing;
            });

        await BroadcastViewerCount(sessionId, set.Count);
    }

    public async Task StopSpectating(Guid sessionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"spectate_{sessionId}");

        if (_spectators.TryGetValue(sessionId, out var set))
        {
            set.TryRemove(Context.ConnectionId, out _);
            await BroadcastViewerCount(sessionId, set.Count);
        }

        if (_connectionSessions.TryGetValue(Context.ConnectionId, out var sessions))
        {
            sessions.Remove(sessionId);
        }
    }

    public Task<int> GetViewerCount(Guid sessionId)
    {
        return Task.FromResult(_spectators.TryGetValue(sessionId, out var set) ? set.Count : 0);
    }

    // An overlay token may only follow its owner's own feed (SubscribeToOwnTelemetry).
    private void RejectScopedToken()
    {
        if (Context.User != null && API.Security.TokenScopes.IsScoped(Context.User))
            throw new HubException("This token can't spectate sessions.");
    }

    // The owner can always watch their own session; anyone else needs a public session and a plan
    // that includes spectating.
    private async Task EnsureCanSpectateAsync(Guid sessionId)
    {
        if (!Guid.TryParse(Context.UserIdentifier, out var userId))
            throw new HubException("Not signed in.");

        var session = await _sessionService.GetSessionDetailAsync(sessionId, userId);
        if (session == null)
            throw new HubException("Session not found.");
        if (session.UserId == userId)
            return;

        if (session.Visibility != TelemetryVisibility.Public)
            throw new HubException("Session not found.");

        var planClaim = Context.User?.FindFirstValue("Plan");
        var plan = Enum.TryParse<PlanType>(planClaim, out var p) ? p : PlanType.BASIC;
        if (!PlanFeatures.SimRacing(plan).SpectatePublic)
            throw new HubException("Spectating requires PRO or ELITE plan.");
    }

    private Task BroadcastViewerCount(Guid sessionId, int count)
    {
        return Clients.Group($"spectate_{sessionId}").SendAsync("ViewerCountChanged", sessionId, count);
    }
}
