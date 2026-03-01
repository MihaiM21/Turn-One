using Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace API.Services;

/// <summary>
/// Background service that automatically refills user tokens based on their plan type.
/// Runs every hour to check if any users are eligible for token refills or plan renewals.
/// </summary>
public class TokenRefillBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TokenRefillBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1);

    /// <summary>
    /// Refill period in days — the same for every plan.
    /// </summary>
    public const int RefillPeriodDays = 30;

    public TokenRefillBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<TokenRefillBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Token Refill Background Service is starting");

        // Initial delay to let the application start properly
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessTokenRefillsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing token refills");
            }

            try
            {
                await ProcessPlanRenewalsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing plan renewals");
            }

            // Wait for the next check interval
            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("Token Refill Background Service is stopping");
    }

    private async Task ProcessTokenRefillsAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting token refill check");

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<Infrastructure.TurnOneDbContext>();

        var cutoffDate = DateTime.UtcNow.AddDays(-RefillPeriodDays);

        // Filter eligible users in SQL instead of loading every user into memory
        var usersNeedingRefill = await dbContext.Users
            .Where(u => u.LastTokenRefillDate <= cutoffDate)
            .ToListAsync(cancellationToken);

        if (usersNeedingRefill.Count == 0)
        {
            _logger.LogInformation("No users require token refill at this time");
            return;
        }

        _logger.LogInformation("Found {Count} users eligible for token refill", usersNeedingRefill.Count);

        var refillCount = 0;
        var subscriptionService = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();

        foreach (var user in usersNeedingRefill)
        {
            try
            {
                await subscriptionService.RefillTokensAsync(user.Id);
                refillCount++;
                _logger.LogInformation(
                    "Successfully refilled tokens for user {UserId} ({Username}). Plan: {Plan}",
                    user.Id,
                    user.Username,
                    user.Plan);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to refill tokens for user {UserId} ({Username})",
                    user.Id,
                    user.Username);
            }
        }

        _logger.LogInformation(
            "Token refill process completed. Successfully refilled {RefillCount} out of {TotalCount} users",
            refillCount,
            usersNeedingRefill.Count);
    }

    private async Task ProcessPlanRenewalsAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting plan renewal check");

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<Infrastructure.TurnOneDbContext>();

        var now = DateTime.UtcNow;

        // Find users whose plan has expired and have auto-renew enabled (non-BASIC only)
        var usersNeedingRenewal = await dbContext.Users
            .Where(u => u.AutoRenew
                && u.Plan != Domain.Enums.PlanType.BASIC
                && u.PlanEndDate.HasValue
                && u.PlanEndDate.Value <= now)
            .ToListAsync(cancellationToken);

        if (usersNeedingRenewal.Count == 0)
        {
            _logger.LogInformation("No users require plan renewal at this time");
            return;
        }

        _logger.LogInformation("Found {Count} users eligible for plan renewal", usersNeedingRenewal.Count);

        var renewalCount = 0;
        var subscriptionService = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();

        foreach (var user in usersNeedingRenewal)
        {
            try
            {
                var renewed = await subscriptionService.CheckAndRenewPlanAsync(user.Id);
                if (renewed)
                {
                    renewalCount++;
                    _logger.LogInformation(
                        "Successfully renewed plan for user {UserId} ({Username}). Plan: {Plan}",
                        user.Id,
                        user.Username,
                        user.Plan);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to renew plan for user {UserId} ({Username})",
                    user.Id,
                    user.Username);
            }
        }

        _logger.LogInformation(
            "Plan renewal process completed. Successfully renewed {RenewalCount} out of {TotalCount} users",
            renewalCount,
            usersNeedingRenewal.Count);
    }
}
