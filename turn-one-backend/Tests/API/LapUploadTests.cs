using System.IO.Compression;
using System.Text;
using System.Threading.Channels;
using API.Controllers;
using API.Hubs;
using API.Services;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure;
using Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Tests.API;

/// <summary>HCR-007 acceptance criteria: parse, queue, idempotency, ownership, end + missing laps, size limits.</summary>
public class LapUploadTests
{
    private static readonly Guid SessionId = Guid.NewGuid();

    /// <summary>An upload body as Link builds it: session_start, ticks of lap 3 (with a couple from laps 2 and 4), lap_complete.</summary>
    private static byte[] Body(Guid? sessionId = null, int lap = 3, bool withStart = true, bool withComplete = true)
    {
        var sid = (sessionId ?? SessionId).ToString("N");
        var sb = new StringBuilder();
        if (withStart)
            sb.AppendLine($$$"""{"v":2,"type":"session_start","timestamp":1000,"sessionId":"{{{sid}}}","data":{"source":"acc","trackId":"spa","trackName":"Spa","trackLengthM":7004,"car":{"id":"ferrari_296_gt3","name":"Ferrari 296 GT3"},"sessionType":"practice"}}""");
        sb.AppendLine($$$"""{"v":2,"type":"tick","timestamp":2000,"sessionId":"{{{sid}}}","data":{"lap":{{{lap - 1}}},"lapTimeMs":139900,"lapDistM":6990,"speed":200}}""");
        for (int i = 0; i < 50; i++)
            sb.AppendLine($$$"""{"v":2,"type":"tick","timestamp":{{{3000 + i * 50}}},"sessionId":"{{{sid}}}","data":{"lap":{{{lap}}},"lapTimeMs":{{{i * 50}}},"lapDistM":{{{i * 140}}},"speed":{{{150 + i}}}}}""");
        sb.AppendLine($$$"""{"v":2,"type":"tick","timestamp":9000,"sessionId":"{{{sid}}}","data":{"lap":{{{lap + 1}}},"lapTimeMs":10,"lapDistM":5,"speed":220}}""");
        if (withComplete)
            sb.AppendLine($$$"""{"v":2,"type":"lap_complete","timestamp":9001,"sessionId":"{{{sid}}}","data":{"lap":{{{lap}}},"lapTimeMs":139512,"sectorsMs":[42000,51000,46512],"valid":true,"pit":false}}""");
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    // ── Parser ────────────────────────────────────────────────────────────────

    [Fact]
    public void Parser_Keeps_Only_The_Completed_Laps_Ticks()
    {
        var parsed = LapUploadParser.Parse(Body());

        parsed.SessionId.Should().Be(SessionId);
        parsed.Complete.Lap.Should().Be(3);
        parsed.Complete.LapTimeMs.Should().Be(139512);
        parsed.Ticks.Should().HaveCount(50).And.OnlyContain(t => t.Lap == 3);
    }

    [Theory]
    [InlineData(false, true, "session_start")]
    [InlineData(true, false, "lap_complete")]
    public void Parser_Requires_Session_Start_And_Lap_Complete(bool withStart, bool withComplete, string mention)
    {
        var act = () => LapUploadParser.Parse(Body(withStart: withStart, withComplete: withComplete));
        act.Should().Throw<LapUploadParser.UploadFormatException>().WithMessage($"*{mention}*");
    }

    [Fact]
    public void Parser_Rejects_Frames_From_Two_Sessions_And_Garbage()
    {
        var mixed = Body().Concat(Body(Guid.NewGuid())).ToArray();
        ((Action)(() => LapUploadParser.Parse(mixed))).Should().Throw<LapUploadParser.UploadFormatException>();
        ((Action)(() => LapUploadParser.Parse("not json\n"u8))).Should().Throw<LapUploadParser.UploadFormatException>();
    }

    // ── Service ───────────────────────────────────────────────────────────────

    private sealed class NullHub : IHubContext<SimTelemetryHub>
    {
        public IHubClients Clients => throw new NotSupportedException();
        public IGroupManager Groups => throw new NotSupportedException();
    }

    private static (LapUploadService svc, TurnOneDbContext db, Channel<LapJob> jobs, User user) Setup(string name)
    {
        var services = new ServiceCollection();
        services.AddDbContext<TurnOneDbContext>(o => o.UseInMemoryDatabase(name));
        services.AddScoped<ITelemetrySessionService, TelemetrySessionService>();
        var sp = services.BuildServiceProvider();

        var jobs = Channel.CreateUnbounded<LapJob>();
        var ingestion = new TelemetryIngestionService(new NullHub(), sp.GetRequiredService<IServiceScopeFactory>(),
            Channel.CreateUnbounded<TickItem>(), jobs, new LapBufferRegistry(new ConfigurationBuilder().Build()),
            NullLogger<TelemetryIngestionService>.Instance);

        var db = sp.CreateScope().ServiceProvider.GetRequiredService<TurnOneDbContext>();
        var user = new User { Id = Guid.NewGuid(), Email = "u@t.t", Username = "driver", Password = "x" };
        db.Users.Add(user);
        db.SaveChanges();

        var svc = new LapUploadService(db, new TelemetrySessionService(db), ingestion, NullLogger<LapUploadService>.Instance);
        return (svc, db, jobs, user);
    }

    [Fact]
    public async Task Upload_Queues_The_Lap_For_The_Processor_With_Its_Timing()
    {
        var (svc, db, jobs, user) = Setup(nameof(Upload_Queues_The_Lap_For_The_Processor_With_Its_Timing));
        var sid = Guid.NewGuid();

        var result = await svc.UploadLapAsync(user.Id, PlanType.BASIC, null, $"{sid:N}:3:abc", Body(sid));

        result.Outcome.Should().Be(LapUploadOutcome.Queued);
        jobs.Reader.TryRead(out var job).Should().BeTrue();
        job!.LapNumber.Should().Be(3);
        job.Complete!.LapTimeMs.Should().Be(139512);
        job.Ticks.Should().HaveCount(50);
        job.Track.Source.Should().Be(SimSource.Acc);
        (await db.TelemetrySessions.SingleAsync(s => s.Id == sid)).UserId.Should().Be(user.Id);
    }

    [Fact]
    public async Task Same_Idempotency_Key_Is_Answered_Without_Processing_Again()
    {
        var (svc, _, jobs, user) = Setup(nameof(Same_Idempotency_Key_Is_Answered_Without_Processing_Again));
        var sid = Guid.NewGuid();
        var key = $"{sid:N}:3:abc";

        var first = await svc.UploadLapAsync(user.Id, PlanType.BASIC, null, key, Body(sid));
        var second = await svc.UploadLapAsync(user.Id, PlanType.BASIC, null, key, Body(sid));

        second.Outcome.Should().Be(LapUploadOutcome.Duplicate);
        second.UploadId.Should().Be(first.UploadId!.Value);
        jobs.Reader.Count.Should().Be(1);
    }

    [Fact]
    public async Task Another_Users_Session_Is_Refused()
    {
        var (svc, db, jobs, user) = Setup(nameof(Another_Users_Session_Is_Refused));
        var sid = Guid.NewGuid();
        var other = new User { Id = Guid.NewGuid(), Email = "o@t.t", Username = "other", Password = "x" };
        db.Users.Add(other);
        db.TelemetrySessions.Add(new TelemetrySession { Id = sid, UserId = other.Id, CarModel = "c", Track = "t", DriverName = "d", SessionType = "race" });
        await db.SaveChangesAsync();

        var result = await svc.UploadLapAsync(user.Id, PlanType.ELITE, null, "k", Body(sid));

        result.Outcome.Should().Be(LapUploadOutcome.Conflict);
        jobs.Reader.Count.Should().Be(0);
        (await db.LapUploads.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Lap_Already_Processed_From_The_Live_Stream_Is_Kept()
    {
        var (svc, db, jobs, user) = Setup(nameof(Lap_Already_Processed_From_The_Live_Stream_Is_Kept));
        var sid = Guid.NewGuid();
        db.TelemetrySessions.Add(new TelemetrySession { Id = sid, UserId = user.Id, CarModel = "c", Track = "t", DriverName = "d", SessionType = "race" });
        db.TelemetryLaps.Add(new TelemetryLap { Id = Guid.NewGuid(), SessionId = sid, LapNumber = 3, ProcessingStatus = LapProcessingStatus.Processed });
        await db.SaveChangesAsync();

        var result = await svc.UploadLapAsync(user.Id, PlanType.BASIC, null, "k3", Body(sid));

        result.Outcome.Should().Be(LapUploadOutcome.Duplicate);
        jobs.Reader.Count.Should().Be(0);
    }

    [Fact]
    public async Task Ending_A_Session_Reports_The_Laps_The_Server_Is_Missing()
    {
        var (svc, db, _, user) = Setup(nameof(Ending_A_Session_Reports_The_Laps_The_Server_Is_Missing));
        var sid = Guid.NewGuid();
        await svc.UploadLapAsync(user.Id, PlanType.BASIC, null, "k3", Body(sid, lap: 3));

        var (outcome, missing) = await svc.EndSessionAsync(user.Id, sid, DateTime.UtcNow, 4, 139512, new[] { 1, 2, 3 });

        outcome.Should().Be(LapUploadOutcome.Queued);
        missing.Should().Equal(1, 2);
        (await db.TelemetrySessions.SingleAsync(s => s.Id == sid)).IsActive.Should().BeFalse();

        (await svc.EndSessionAsync(Guid.NewGuid(), sid, DateTime.UtcNow, 0, 0, Array.Empty<int>())).Outcome
            .Should().Be(LapUploadOutcome.Conflict);
    }

    // ── Body limits ───────────────────────────────────────────────────────────

    private static HttpRequest Request(byte[] content, string? encoding)
    {
        var ctx = new DefaultHttpContext();
        ctx.Request.Body = new MemoryStream(content);
        if (encoding != null) ctx.Request.Headers.ContentEncoding = encoding;
        return ctx.Request;
    }

    private static byte[] Brotli(byte[] data)
    {
        using var ms = new MemoryStream();
        using (var br = new BrotliStream(ms, CompressionLevel.Fastest)) br.Write(data);
        return ms.ToArray();
    }

    [Theory]
    [InlineData("1.2.0", null, false)]      // no minimum configured
    [InlineData("1.2.0", "1.2.0", false)]
    [InlineData("1.2.1", "1.2.0", false)]
    [InlineData("1.1.9", "1.2.0", true)]
    [InlineData("", "1.2.0", true)]          // a client that doesn't say which build it is
    [InlineData("garbage", "1.2.0", true)]
    public void Uploads_From_Builds_Below_The_Minimum_Are_Refused(string client, string? minimum, bool refused) =>
        UploadsController.IsBelowMinUploadVersion(client, minimum).Should().Be(refused);

    [Fact]
    public async Task Brotli_Bodies_Are_Inflated()
    {
        var body = Body();
        (await UploadsController.ReadBodyAsync(Request(Brotli(body), "br"))).Should().Equal(body);
    }

    [Fact]
    public async Task Decompression_Bomb_Is_Refused()
    {
        var bomb = Brotli(new byte[UploadsController.MaxUncompressedBytes + 1024]);
        bomb.Length.Should().BeLessThan(UploadsController.MaxCompressedBytes);

        var act = () => UploadsController.ReadBodyAsync(Request(bomb, "br"));
        await act.Should().ThrowAsync<InvalidDataException>();
    }
}
