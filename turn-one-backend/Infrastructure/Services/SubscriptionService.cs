using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly TurnOneDbContext _context;

    public SubscriptionService(TurnOneDbContext context)
    {
        _context = context;
    }

    public async Task<User> UpgradePlanAsync(Guid userId, PlanType newPlan)
    {
        var user = await GetUserOrThrowAsync(userId);
        
        if (user.Plan >= newPlan)
            throw new InvalidOperationException($"Cannot upgrade from {user.Plan} to {newPlan}");

        // Keep remaining days from current plan if any
        var remainingDays = user.PlanEndDate.HasValue 
            ? (user.PlanEndDate.Value - DateTime.UtcNow).Days 
            : 0;

        user.Plan = newPlan;
        user.PlanStartDate = DateTime.UtcNow;
        user.PlanEndDate = DateTime.UtcNow.AddMonths(1).AddDays(remainingDays);
        
        // Add bonus tokens for upgrading
        user.Tokens += GetPlanTokenBonus(newPlan);
        
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> DowngradePlanAsync(Guid userId, PlanType newPlan)
    {
        var user = await GetUserOrThrowAsync(userId);
        
        if (user.Plan <= newPlan)
            throw new InvalidOperationException($"Cannot downgrade from {user.Plan} to {newPlan}");

        // Downgrade takes effect at the end of current period
        user.Plan = newPlan;
        
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> RefillTokensAsync(Guid userId)
    {
        var user = await GetUserOrThrowAsync(userId);

        var daysSinceLastRefill = (DateTime.UtcNow - user.LastTokenRefillDate).Days;
        var refillPeriod = GetRefillPeriod(user.Plan);
        
        if (daysSinceLastRefill < refillPeriod)
            throw new InvalidOperationException($"Too soon for token refill. Last refill was {daysSinceLastRefill} days ago, next refill in {refillPeriod - daysSinceLastRefill} days");
        
        // If user has the ammount already, just update the date to prevent abuse of the refill system
        if(user.Tokens < GetMonthlyTokens(user)){
            user.Tokens += GetMonthlyTokens(user);
        }
        
        user.LastTokenRefillDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<bool> CheckAndRenewPlanAsync(Guid userId)
    {
        var user = await GetUserOrThrowAsync(userId);

        if (!user.PlanEndDate.HasValue || user.Plan == PlanType.BASIC || !user.AutoRenew)
            return false;

        if (DateTime.UtcNow >= user.PlanEndDate.Value)
        {
            user.PlanStartDate = DateTime.UtcNow;
            user.PlanEndDate = DateTime.UtcNow.AddMonths(1);
            user.Tokens += GetMonthlyTokens(user);
            user.LastTokenRefillDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        return false;
    }

    public async Task<(int tokensRemaining, int daysUntilRefill)> GetTokenStatusAsync(Guid userId)
    {
        var user = await GetUserOrThrowAsync(userId);

        var daysUntilRefill = GetRefillPeriod(user.Plan) - 
            (DateTime.UtcNow - user.LastTokenRefillDate).Days;

        return (user.Tokens, Math.Max(0, daysUntilRefill));
    }

    public async Task<User> PurchaseTokensAsync(Guid userId, int amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive", nameof(amount));

        var user = await GetUserOrThrowAsync(userId);

        var discount = GetTokenDiscount(user.Plan);
        var effectiveAmount = (int)(amount * (1 + discount));

        user.Tokens += effectiveAmount;
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> ConsumeTokenAsync(Guid userId)
    {

        var user = await GetUserOrThrowAsync(userId);

        if (user.Tokens < 1)
            throw new InvalidOperationException($"Insufficient tokens. Required: 1, Available: {user.Tokens}");

        user.Tokens -= 1;
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User> ConsumeTokensAsync(Guid userId, int amount)
    {
        if (amount <= 0)
            throw new ArgumentException("Amount must be positive", nameof(amount));

        var user = await GetUserOrThrowAsync(userId);

        if (user.Tokens < amount)
            throw new InvalidOperationException($"Insufficient tokens. Required: {amount}, Available: {user.Tokens}");

        user.Tokens -= amount;
        await _context.SaveChangesAsync();
        return user;
    }

    private async Task<User> GetUserOrThrowAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new KeyNotFoundException($"User {userId} not found");
        return user;
    }

    /// <summary>
    /// Refill period is 30 days for every plan.
    /// Kept in sync with <see cref="API.Services.TokenRefillBackgroundService.RefillPeriodDays"/>.
    /// </summary>
    private const int RefillPeriodDays = 30;

    // Delegates to PlanDetails so refills, admin plan-assignment, and pricing
    // display share one number instead of three that could silently drift —
    // this table previously said ELITE=300 while PlanDetails/AdminService said 250.
    // CreatorTokenAllowance only applies to CONTENT_CREATOR accounts (set via
    // the existing role assignment, not a separate creator flag).
    private static int GetMonthlyTokens(User user) =>
        user.Role == Role.CONTENT_CREATOR && user.CreatorTokenAllowance.HasValue
            ? user.CreatorTokenAllowance.Value
            : PlanDetails.GetPlanDetails(user.Plan).MonthlyTokens;

    private static int GetPlanTokenBonus(PlanType plan) => plan switch
    {
        PlanType.BASIC => 0,
        PlanType.PRO => 20,
        PlanType.ELITE => 50,
        _ => throw new ArgumentOutOfRangeException(nameof(plan))
    };

    private static int GetRefillPeriod(PlanType _plan) => RefillPeriodDays;

    private static decimal GetTokenDiscount(PlanType plan) => PlanDetails.GetPlanDetails(plan).TokenPurchaseDiscount;
}