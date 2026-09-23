using System.Security.Claims;
using API.Filters;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;

namespace Tests.API;

public class RequiresSimFeatureTests
{
    private static ActionExecutingContext NewContext(string? plan)
    {
        var httpContext = new DefaultHttpContext();
        if (plan != null)
        {
            var identity = new ClaimsIdentity(new[] { new Claim("Plan", plan) }, "TestAuth");
            httpContext.User = new ClaimsPrincipal(identity);
        }

        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        return new ActionExecutingContext(
            actionContext,
            new List<IFilterMetadata>(),
            new Dictionary<string, object?>(),
            controller: new object());
    }

    [Fact]
    public void Basic_Plan_Is_Rejected_With_403()
    {
        var attribute = new RequiresSimFeatureAttribute("Comparison");
        var context = NewContext("BASIC");

        attribute.OnActionExecuting(context);

        context.Result.Should().BeOfType<ObjectResult>();
        ((ObjectResult)context.Result!).StatusCode.Should().Be(403);
    }

    [Theory]
    [InlineData("PRO")]
    [InlineData("ELITE")]
    public void Pro_And_Elite_Plans_Pass_Through(string plan)
    {
        var attribute = new RequiresSimFeatureAttribute("Comparison");
        var context = NewContext(plan);

        attribute.OnActionExecuting(context);

        context.Result.Should().BeNull();
    }

    [Fact]
    public void Missing_Plan_Claim_Defaults_To_Basic_And_Is_Rejected()
    {
        var attribute = new RequiresSimFeatureAttribute("Comparison");
        var context = NewContext(plan: null);

        attribute.OnActionExecuting(context);

        context.Result.Should().NotBeNull();
        ((ObjectResult)context.Result!).StatusCode.Should().Be(403);
    }

    [Fact]
    public void Unknown_Feature_Name_Is_Treated_As_Not_Allowed()
    {
        var attribute = new RequiresSimFeatureAttribute("NotARealFeature");
        var context = NewContext("ELITE");

        attribute.OnActionExecuting(context);

        context.Result.Should().NotBeNull();
    }
}
