using Domain.Entities;
using Domain.Enums;

namespace Application.Interfaces;

public interface ISubscriptionService
{
    /// <summary>
    /// Upgrades a user's subscription plan
    /// </summary>
    Task<User> UpgradePlanAsync(Guid userId, PlanType newPlan);
    
    /// <summary>
    /// Downgrades a user's subscription plan
    /// </summary>
    Task<User> DowngradePlanAsync(Guid userId, PlanType newPlan);
    
    /// <summary>
    /// Performs automatic token refill based on user's plan
    /// </summary>
    Task<User> RefillTokensAsync(Guid userId);
    
    /// <summary>
    /// Checks if user's plan needs renewal and handles it if auto-renew is enabled
    /// </summary>
    Task<bool> CheckAndRenewPlanAsync(Guid userId);
    
    /// <summary>
    /// Gets the number of tokens remaining and days until next refill
    /// </summary>
    Task<(int tokensRemaining, int daysUntilRefill)> GetTokenStatusAsync(Guid userId);
    
    /// <summary>
    /// Purchases additional tokens for the user with any applicable plan discounts
    /// </summary>
    Task<User> PurchaseTokensAsync(Guid userId, int amount);
    
    /// <summary>
    /// Consumes tokens for an action, throws if insufficient tokens
    /// </summary>
    Task<User> ConsumeTokensAsync(Guid userId, int amount);
}