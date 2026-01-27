using Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace API.Services;

/// <summary>
/// Background service that automatically refills user tokens based on their plan type
/// Runs every hour to check if any users are eligible for token refills
/// </summary>
public class TokenRefillBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TokenRefillBackgroundService> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1); // Check every hour

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

        var now = DateTime.UtcNow;
        var usersNeedingRefill = new List<Domain.Entities.User>();

        // Get all users from the database
        var allUsers = dbContext.Users.ToList();

        foreach (var user in allUsers)
        {
            var daysSinceLastRefill = (now - user.LastTokenRefillDate).Days;
            var refillPeriod = GetRefillPeriod(user.Plan);

            // Check if user is eligible for refill
            if (daysSinceLastRefill >= refillPeriod)
            {
                usersNeedingRefill.Add(user);
            }
        }

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

    private static int GetRefillPeriod(Domain.Enums.PlanType plan) => plan switch
    {
        Domain.Enums.PlanType.BASIC => 30,  // Monthly
        Domain.Enums.PlanType.PRO => 15,    // Bi-weekly
        Domain.Enums.PlanType.ELITE => 7,   // Weekly
        _ => 30 // Default to monthly
    };
}
