using System.Net.Http.Headers;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace API.Services;

/// <summary>
/// Clock for publishing finished F1 sessions to the frontend's SEO pages.
/// Every few minutes it POSTs to the Next.js app's <c>/api/revalidate/sessions</c>,
/// which checks recent Qualifying/Race sessions against the F1 data API and
/// refreshes the static pages (the session page, the landing page, /f1) the
/// moment a session's data exists — instead of leaving a cached 404 for a day.
/// All the calendar and data logic lives in the frontend (turn-one-client/lib/f1/publish.ts);
/// this service only keeps time.
///
/// Disabled unless both <c>Revalidation:FrontendUrl</c> and <c>Revalidation:Secret</c> are set.
/// </summary>
public class SessionPublishSweepService : BackgroundService
{
    public const string HttpClientName = "frontend-revalidate";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SessionPublishSweepService> _logger;
    private readonly string? _frontendUrl;
    private readonly string? _secret;
    private readonly TimeSpan _interval;

    public SessionPublishSweepService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<SessionPublishSweepService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _frontendUrl = configuration["Revalidation:FrontendUrl"]?.TrimEnd('/');
        _secret = configuration["Revalidation:Secret"];
        var minutes = configuration.GetValue("Revalidation:IntervalMinutes", 10);
        _interval = TimeSpan.FromMinutes(Math.Clamp(minutes, 1, 120));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (string.IsNullOrWhiteSpace(_frontendUrl) || string.IsNullOrWhiteSpace(_secret))
        {
            _logger.LogInformation("Session publish sweep disabled: Revalidation:FrontendUrl / Revalidation:Secret not configured");
            return;
        }

        _logger.LogInformation("Session publish sweep starting: every {Interval} against {FrontendUrl}", _interval, _frontendUrl);

        // Let the frontend come up first (it starts after the API in docker-compose)
        await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

        using var timer = new PeriodicTimer(_interval);
        do
        {
            try
            {
                await SweepAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                // A missed sweep only delays publishing to the next tick; never let it kill the loop.
                _logger.LogWarning(ex, "Session publish sweep failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task SweepAsync(CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient(HttpClientName);
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{_frontendUrl}/api/revalidate/sessions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _secret);

        using var response = await client.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Session publish sweep returned {Status}: {Body}", (int)response.StatusCode, body);
            return;
        }

        // Only worth an info line when something was actually published
        if (body.Contains("\"published\"", StringComparison.Ordinal))
            _logger.LogInformation("Session publish sweep published sessions: {Body}", body);
        else
            _logger.LogDebug("Session publish sweep: {Body}", body);
    }
}
