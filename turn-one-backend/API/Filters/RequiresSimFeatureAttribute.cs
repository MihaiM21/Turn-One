using System.Collections.Concurrent;
using System.Reflection;
using Domain;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc.Filters;

namespace API.Filters;

/// <summary>
/// Gates an action on a named boolean property of <see cref="PlanFeatures.SimRacing"/> for the caller's
/// <c>Plan</c> claim — e.g. <c>[RequiresSimFeature("Comparison")]</c> checks
/// <c>PlanFeatures.SimRacing(plan).Comparison</c>. Returns 403 with a friendly message when the
/// property is false or missing, rather than baking the check into every action by hand.
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class RequiresSimFeatureAttribute : Attribute, IActionFilter
{
    private static readonly ConcurrentDictionary<string, PropertyInfo?> PropertyCache = new();

    private readonly string _featureName;

    public RequiresSimFeatureAttribute(string featureName)
    {
        _featureName = featureName;
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var planStr = context.HttpContext.User.FindFirst("Plan")?.Value;
        if (!Enum.TryParse<PlanType>(planStr, out var plan)) plan = PlanType.BASIC;

        var features = PlanFeatures.SimRacing(plan);
        var property = PropertyCache.GetOrAdd(_featureName, name => typeof(SimRacingPlanFeatures).GetProperty(name));

        var allowed = property != null && property.PropertyType == typeof(bool) && (bool)(property.GetValue(features) ?? false);
        if (!allowed)
        {
            context.Result = new Microsoft.AspNetCore.Mvc.ObjectResult(new { message = "This feature requires PRO" })
            {
                StatusCode = 403,
            };
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
    }
}
