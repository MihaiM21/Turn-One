using System.Reflection;
using System.Security.Claims;
using API.Controllers;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using FluentAssertions;
using Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Tests.API;

/// <summary>Closed-beta applications: driver upsert, status is admin-only, admin list/filter.</summary>
public class BetaApplicationTests
{
    private static TurnOneDbContext Db(string name, params User[] users)
    {
        var db = new TurnOneDbContext(new DbContextOptionsBuilder<TurnOneDbContext>().UseInMemoryDatabase(name).Options);
        db.Users.AddRange(users);
        db.SaveChanges();
        return db;
    }

    private static User NewUser(string name, Role role = Role.USER) => new()
    {
        Id = Guid.NewGuid(), Email = $"{name}@t.t", Username = name, Password = "x", Role = role,
    };

    private static ClaimsPrincipal Token(User user) => new(new ClaimsIdentity(new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Role, user.Role.ToString()),
    }, "test"));

    private static BetaController Api(TurnOneDbContext db, User user) => new(db)
    {
        ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = Token(user) } },
    };

    private static BetaApplicationRequest Answers(params string[] sims) => new()
    {
        Sims = sims.ToList(), Platform = "pc", Input = "wheel", Note = "  league racer  ",
    };

    private static T Body<T>(IActionResult result) => (T)((OkObjectResult)result).Value!;

    [Fact]
    public async Task Put_Creates_A_Pending_Application_Then_Updates_It_In_Place()
    {
        var driver = NewUser("d");
        await using var db = Db(nameof(Put_Creates_A_Pending_Application_Then_Updates_It_In_Place), driver);
        var api = Api(db, driver);

        (await api.GetMine()).Should().BeOfType<NotFoundObjectResult>();

        var created = Body<BetaApplicationDto>(await api.PutMine(Answers("acc", "iracing", "acc")));
        created.Status.Should().Be("pending");
        created.Sims.Should().Equal("acc", "iracing"); // de-duplicated, wire names
        created.Note.Should().Be("league racer");

        var updated = Body<BetaApplicationDto>(await api.PutMine(new BetaApplicationRequest
        {
            Sims = new() { "f1_25" }, Platform = "ps5", Input = "pad", Note = "",
        }));
        updated.Id.Should().Be(created.Id);
        updated.Platform.Should().Be("ps5");
        updated.Input.Should().Be("pad");
        updated.Note.Should().BeNull();

        (await db.BetaApplications.CountAsync()).Should().Be(1);
        Body<BetaApplicationDto>(await api.GetMine()).Sims.Should().Equal("f1_25");
    }

    [Theory]
    [InlineData(new string[0], "pc", "wheel")]
    [InlineData(new[] { "gran_turismo" }, "pc", "wheel")]
    [InlineData(new[] { "unknown" }, "pc", "wheel")]
    [InlineData(new[] { "acc" }, "switch", "wheel")]
    [InlineData(new[] { "acc" }, "pc", "keyboard")]
    public async Task Put_Rejects_Bad_Answers(string[] sims, string platform, string input)
    {
        var driver = NewUser("d");
        await using var db = Db(nameof(Put_Rejects_Bad_Answers) + string.Join(",", sims) + platform + input, driver);

        var result = await Api(db, driver).PutMine(new BetaApplicationRequest { Sims = sims.ToList(), Platform = platform, Input = input });

        result.Should().BeOfType<BadRequestObjectResult>();
        (await db.BetaApplications.AnyAsync()).Should().BeFalse();
    }

    [Fact]
    public async Task Put_Rejects_A_Note_Over_500_Characters()
    {
        var driver = NewUser("d");
        await using var db = Db(nameof(Put_Rejects_A_Note_Over_500_Characters), driver);
        var body = Answers("acc");
        body.Note = new string('x', BetaApplication.NoteMaxLength + 1);

        (await Api(db, driver).PutMine(body)).Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task A_Driver_Cannot_Change_Their_Own_Status()
    {
        var driver = NewUser("d");
        await using var db = Db(nameof(A_Driver_Cannot_Change_Their_Own_Status), driver);
        var api = Api(db, driver);

        // The request type has no status field at all.
        typeof(BetaApplicationRequest).GetProperty("Status").Should().BeNull();

        await api.PutMine(Answers("acc"));
        var row = await db.BetaApplications.SingleAsync();
        row.Status = BetaApplicationStatus.Declined;
        row.ReviewedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Editing answers after a decision keeps the admin's decision.
        var edited = Body<BetaApplicationDto>(await api.PutMine(Answers("acc", "f1_26")));
        edited.Status.Should().Be("declined");
        edited.ReviewedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task Admin_Lists_With_Filter_Counts_And_Only_Username_And_Email()
    {
        var admin = NewUser("admin", Role.ADMIN);
        var a = NewUser("alice");
        var b = NewUser("bob");
        var c = NewUser("carol");
        await using var db = Db(nameof(Admin_Lists_With_Filter_Counts_And_Only_Username_And_Email), admin, a, b, c);
        foreach (var u in new[] { a, b, c }) await Api(db, u).PutMine(Answers("acc"));

        var adminApi = Api(db, admin);
        var bobsId = (await db.BetaApplications.SingleAsync(x => x.UserId == b.Id)).Id;
        var reviewed = Body<AdminBetaApplicationDto>(await adminApi.SetStatus(bobsId, new BetaStatusRequest { Status = "accepted" }));
        reviewed.Status.Should().Be("accepted");
        reviewed.ReviewedAt.Should().NotBeNull();
        reviewed.Username.Should().Be("bob");

        var all = Body<AdminBetaApplicationListDto>(await adminApi.List());
        all.Items.Should().HaveCount(3);
        (all.Pending, all.Accepted, all.Declined).Should().Be((2, 1, 0));
        all.Items.Single(i => i.Username == "alice").Email.Should().Be("alice@t.t");

        var accepted = Body<AdminBetaApplicationListDto>(await adminApi.List("accepted"));
        accepted.Items.Should().ContainSingle().Which.Username.Should().Be("bob");
        accepted.Accepted.Should().Be(1, "counts cover every status, not just the filter");

        (await adminApi.List("maybe")).Should().BeOfType<BadRequestObjectResult>();

        // Back to pending clears the review time.
        Body<AdminBetaApplicationDto>(await adminApi.SetStatus(bobsId, new BetaStatusRequest { Status = "pending" }))
            .ReviewedAt.Should().BeNull();
        (await adminApi.SetStatus(bobsId, new BetaStatusRequest { Status = "approved" })).Should().BeOfType<BadRequestObjectResult>();
        (await adminApi.SetStatus(Guid.NewGuid(), new BetaStatusRequest { Status = "accepted" })).Should().BeOfType<NotFoundObjectResult>();

        // DTOs only: nothing from the User entity beyond username/email leaks.
        typeof(AdminBetaApplicationDto).GetProperties().Select(p => p.Name)
            .Should().NotContain(new[] { "User", "Password", "Role", "Plan" });
    }

    private static async Task<bool> Allowed(string action, ClaimsPrincipal user)
    {
        var method = typeof(BetaController).GetMethod(action)!;
        var attributes = typeof(BetaController).GetCustomAttributes<AuthorizeAttribute>()
            .Concat(method.GetCustomAttributes<AuthorizeAttribute>());
        var provider = new DefaultAuthorizationPolicyProvider(Options.Create(new AuthorizationOptions()));
        var policy = (await AuthorizationPolicy.CombineAsync(provider, attributes))!;
        var auth = new DefaultAuthorizationService(
            provider,
            new DefaultAuthorizationHandlerProvider(new IAuthorizationHandler[] { new PassThroughAuthorizationHandler() }),
            NullLogger<DefaultAuthorizationService>.Instance,
            new DefaultAuthorizationHandlerContextFactory(),
            new DefaultAuthorizationEvaluator(),
            Options.Create(new AuthorizationOptions()));
        return (await auth.AuthorizeAsync(user, null, policy)).Succeeded;
    }

    [Theory]
    [InlineData(nameof(BetaController.List))]
    [InlineData(nameof(BetaController.SetStatus))]
    public async Task Admin_Endpoints_Forbid_Non_Admins(string action)
    {
        (await Allowed(action, Token(NewUser("u")))).Should().BeFalse();
        (await Allowed(action, Token(NewUser("creator", Role.CONTENT_CREATOR)))).Should().BeFalse();
        (await Allowed(action, Token(NewUser("admin", Role.ADMIN)))).Should().BeTrue();
    }

    [Theory]
    [InlineData(nameof(BetaController.GetMine))]
    [InlineData(nameof(BetaController.PutMine))]
    public async Task Own_Application_Endpoints_Need_Sign_In_But_No_Role(string action)
    {
        (await Allowed(action, Token(NewUser("u")))).Should().BeTrue();
        (await Allowed(action, new ClaimsPrincipal(new ClaimsIdentity()))).Should().BeFalse();
    }
}
