using System.Security.Claims;
using API.Controllers;
using API.Security;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Tests.API;

/// <summary>H-12 plan from the database, HCR-015 consent, H-17 Turnstile switch.</summary>
public class PhaseOneHubTests
{
    private static (IServiceProvider sp, Guid userId) Db(string name, PlanType plan)
    {
        var services = new ServiceCollection();
        services.AddDbContext<TurnOneDbContext>(o => o.UseInMemoryDatabase(name));
        var sp = services.BuildServiceProvider();
        var userId = Guid.NewGuid();
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();
        db.Users.Add(new User { Id = userId, Email = "p@t.t", Username = "p", Password = "x", Plan = plan });
        db.SaveChanges();
        return (sp, userId);
    }

    private static ClaimsPrincipal Token(Guid userId, string plan) => new(new ClaimsIdentity(new[]
    {
        new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
        new Claim("Plan", plan),
    }, "test"));

    [Fact]
    public async Task Requests_Use_The_Plan_In_The_Database_Not_The_Token()
    {
        var (sp, userId) = Db(nameof(Requests_Use_The_Plan_In_The_Database_Not_The_Token), PlanType.PRO);
        var lookup = new PlanLookup(new MemoryCache(new MemoryCacheOptions()), sp.GetRequiredService<IServiceScopeFactory>());
        var transform = new PlanClaimsTransformation(lookup);

        // Token still says BASIC (issued before the upgrade).
        var principal = await transform.TransformAsync(Token(userId, "BASIC"));

        principal.FindAll("Plan").Select(c => c.Value).Should().Equal("PRO");
        (await transform.TransformAsync(principal)).FindAll("Plan").Should().ContainSingle(); // idempotent
    }

    [Fact]
    public async Task A_Plan_Change_Shows_Up_After_Forget()
    {
        var (sp, userId) = Db(nameof(A_Plan_Change_Shows_Up_After_Forget), PlanType.BASIC);
        var lookup = new PlanLookup(new MemoryCache(new MemoryCacheOptions()), sp.GetRequiredService<IServiceScopeFactory>());
        (await lookup.GetAsync(userId)).Should().Be(PlanType.BASIC);

        using (var scope = sp.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();
            (await db.Users.SingleAsync()).Plan = PlanType.ELITE;
            await db.SaveChangesAsync();
        }

        (await lookup.GetAsync(userId)).Should().Be(PlanType.BASIC); // cached
        lookup.Forget(userId);
        (await lookup.GetAsync(userId)).Should().Be(PlanType.ELITE);
        (await lookup.GetAsync(Guid.NewGuid())).Should().BeNull();
    }

    private static AiConsentController Consent(TurnOneDbContext db, Guid userId) => new(db)
    {
        ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = Token(userId, "BASIC") },
        },
    };

    [Fact]
    public async Task Ai_Consent_Is_Off_Until_Granted_And_Can_Be_Withdrawn()
    {
        var (sp, userId) = Db(nameof(Ai_Consent_Is_Off_Until_Granted_And_Can_Be_Withdrawn), PlanType.BASIC);
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TurnOneDbContext>();
        var api = Consent(db, userId);

        object Body(IActionResult r) => ((OkObjectResult)r).Value!;
        bool Granted(object body) => (bool)body.GetType().GetProperty("granted")!.GetValue(body)!;

        Granted(Body(await api.Get())).Should().BeFalse();

        (await api.Put(new AiConsentController.ConsentRequest { Granted = true, Version = "2020-01" }))
            .Should().BeOfType<BadRequestObjectResult>("an old consent text can't be agreed to");

        await api.Put(new AiConsentController.ConsentRequest { Granted = true, Version = AiConsent.CurrentVersion });
        Granted(Body(await api.Get())).Should().BeTrue();

        await api.Put(new AiConsentController.ConsentRequest { Granted = false, Version = AiConsent.CurrentVersion });
        var row = await db.AiConsents.SingleAsync();
        row.Granted.Should().BeFalse();
        row.WithdrawnAt.Should().NotBeNull();
    }

    private static TurnstileVerifier Turnstile(string? secret) => new(
        new ServiceCollection().AddHttpClient().BuildServiceProvider().GetRequiredService<IHttpClientFactory>(),
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Turnstile:SecretKey"] = secret }).Build(),
        NullLogger<TurnstileVerifier>.Instance);

    [Fact]
    public async Task Turnstile_Is_Skipped_Without_A_Secret_And_Requires_A_Token_With_One()
    {
        (await Turnstile(null).VerifyAsync(null, null)).Should().BeTrue();
        (await Turnstile("secret").VerifyAsync(null, "1.2.3.4")).Should().BeFalse();
        (await Turnstile("secret").VerifyAsync("", "1.2.3.4")).Should().BeFalse();
    }
}
