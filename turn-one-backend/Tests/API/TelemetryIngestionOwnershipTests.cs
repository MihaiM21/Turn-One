using System.Text.Json;
using System.Threading.Channels;
using API.Hubs;
using API.Services;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Tests.API;

/// <summary>H-03: a client-chosen sessionId must never let one user write into another user's session.</summary>
public class TelemetryIngestionOwnershipTests
{
    private sealed class RecordingHub : IHubContext<SimTelemetryHub>, IHubClients, IGroupManager
    {
        public List<string> Groups_ { get; } = new();
        public IHubClients Clients => this;
        public IGroupManager Groups => this;

        private IClientProxy Proxy(string name) { Groups_.Add(name); return new NullProxy(); }
        public IClientProxy All => Proxy("all");
        public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => Proxy("all");
        public IClientProxy Client(string connectionId) => Proxy(connectionId);
        IClientProxy IHubClients<IClientProxy>.Clients(IReadOnlyList<string> connectionIds) => Proxy("clients");
        public IClientProxy Group(string groupName) => Proxy(groupName);
        public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => Proxy(groupName);
        IClientProxy IHubClients<IClientProxy>.Groups(IReadOnlyList<string> groupNames) => Proxy("groups");
        public IClientProxy User(string userId) => Proxy(userId);
        public IClientProxy Users(IReadOnlyList<string> userIds) => Proxy("users");
        public Task AddToGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task RemoveFromGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken = default) => Task.CompletedTask;

        private sealed class NullProxy : IClientProxy
        {
            public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default) => Task.CompletedTask;
        }
    }

    private static (TelemetryIngestionService ingestion, RecordingHub hub, IServiceProvider sp) Build(string dbName)
    {
        var services = new ServiceCollection();
        services.AddDbContext<TurnOneDbContext>(o => o.UseInMemoryDatabase(dbName));
        services.AddScoped<ITelemetrySessionService, TelemetrySessionService>();
        var sp = services.BuildServiceProvider();

        var hub = new RecordingHub();
        var ingestion = new TelemetryIngestionService(
            hub,
            sp.GetRequiredService<IServiceScopeFactory>(),
            Channel.CreateUnbounded<TickItem>(),
            Channel.CreateUnbounded<LapJob>(),
            new LapBufferRegistry(new ConfigurationBuilder().Build()),
            NullLogger<TelemetryIngestionService>.Instance);
        return (ingestion, hub, sp);
    }

    private static JsonElement Json(string json) => JsonDocument.Parse(json).RootElement.Clone();

    private static readonly JsonElement StartPayload = Json("""{"source":"acc","trackId":"spa","trackName":"Spa","car":{"id":"c","name":"Car"},"sessionType":"practice"}""");
    private static readonly JsonElement TickPayload = Json("""{"lap":1,"lapDistM":10,"lapTimeMs":1000,"speed":100}""");

    private static async Task SeedUserAsync(IServiceProvider sp, Guid id)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();
        db.Users.Add(new User { Id = id, Email = $"{id}@t.t", Username = id.ToString("N")[..8], Password = "x" });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Frames_For_A_Live_Session_Of_Another_User_Are_Rejected()
    {
        var (ingestion, hub, sp) = Build(nameof(Frames_For_A_Live_Session_Of_Another_User_Are_Rejected));
        var owner = Guid.NewGuid();
        var attacker = Guid.NewGuid();
        await SeedUserAsync(sp, owner);
        var sessionId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        (await ingestion.ProcessFrameAsync(owner, PlanType.PRO, TelemetryMode.Normal, sessionId, "session_start", StartPayload, now, 2))
            .Should().BeTrue();

        foreach (var type in new[] { "session_start", "tick", "lap_complete", "session_pause", "session_end", "client_heartbeat" })
        {
            (await ingestion.ProcessFrameAsync(attacker, PlanType.ELITE, TelemetryMode.Normal, sessionId, type, TickPayload, now, 2))
                .Should().BeFalse($"{type} from another user must be rejected");
        }

        hub.Groups_.Should().NotContain($"spectate_{sessionId}");
        hub.Groups_.Should().NotContain($"telemetry_{attacker}");

        using var scope = sp.CreateScope();
        var session = await scope.ServiceProvider.GetRequiredService<TurnOneDbContext>().TelemetrySessions.SingleAsync();
        session.UserId.Should().Be(owner);
        session.IsActive.Should().BeTrue();
        session.Status.Should().Be(TelemetrySessionStatus.Active);
    }

    [Fact]
    public async Task Frames_For_A_Stored_Session_Of_Another_User_Are_Rejected()
    {
        var (ingestion, _, sp) = Build(nameof(Frames_For_A_Stored_Session_Of_Another_User_Are_Rejected));
        var owner = Guid.NewGuid();
        await SeedUserAsync(sp, owner);
        var sessionId = Guid.NewGuid();
        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();
            db.TelemetrySessions.Add(new TelemetrySession
            {
                Id = sessionId, UserId = owner, CarModel = "c", Track = "Spa", DriverName = "o", SessionType = "practice",
                Status = TelemetrySessionStatus.Ended, IsActive = false, Visibility = TelemetryVisibility.Public,
            });
            await db.SaveChangesAsync();
        }

        var accepted = await ingestion.ProcessFrameAsync(Guid.NewGuid(), PlanType.ELITE, TelemetryMode.Normal, sessionId,
            "session_start", StartPayload, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), 2);

        accepted.Should().BeFalse();
        using var check = sp.CreateScope();
        (await check.ServiceProvider.GetRequiredService<TurnOneDbContext>().TelemetrySessions.SingleAsync()).IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task Owner_Frames_Are_Accepted()
    {
        var (ingestion, hub, sp) = Build(nameof(Owner_Frames_Are_Accepted));
        var owner = Guid.NewGuid();
        await SeedUserAsync(sp, owner);
        var sessionId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        (await ingestion.ProcessFrameAsync(owner, PlanType.PRO, TelemetryMode.Normal, sessionId, "session_start", StartPayload, now, 2)).Should().BeTrue();
        (await ingestion.ProcessFrameAsync(owner, PlanType.PRO, TelemetryMode.Normal, sessionId, "tick", TickPayload, now + 50, 2)).Should().BeTrue();

        hub.Groups_.Should().Contain($"telemetry_{owner}");
    }
}
