using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class F1LiveTimingController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<F1LiveTimingController> _logger;
    private readonly string _baseUrl;

    public F1LiveTimingController(
        IHttpClientFactory httpClientFactory,
        ILogger<F1LiveTimingController> logger,
        IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _baseUrl = (configuration["F1:LiveTimingUrl"]
            ?? "https://f1-proxy.YOUR-WORKER.workers.dev").TrimEnd('/');
    }

    [HttpGet("negotiate")]
    public async Task<IActionResult> ProxyNegotiate()
    {
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Add("User-Agent", "Turn-One-F1-Client/1.0");
            httpClient.Timeout = TimeSpan.FromSeconds(30);

            var negotiationUrl = $"{_baseUrl}/negotiate?negotiateVersion=1";
            _logger.LogInformation("Proxying F1 negotiation to {Url}", negotiationUrl);

            HttpResponseMessage response;
            using (var postReq = new HttpRequestMessage(HttpMethod.Post, negotiationUrl))
            {
                postReq.Content = new StringContent(string.Empty);
                response = await httpClient.SendAsync(postReq);
                if (response.StatusCode == System.Net.HttpStatusCode.MethodNotAllowed)
                {
                    response.Dispose();
                    response = await httpClient.GetAsync(negotiationUrl);
                }
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("F1 negotiation failed with status: {StatusCode}", response.StatusCode);
                return StatusCode((int)response.StatusCode, new { error = "F1 live timing not available" });
            }

            var content = await response.Content.ReadAsStringAsync();

            Response.Headers["Access-Control-Allow-Origin"] = "http://localhost:3000";
            Response.Headers["Access-Control-Allow-Credentials"] = "true";

            if (response.Headers.TryGetValues("Set-Cookie", out var cookieValues))
            {
                var cookies = string.Join("; ", cookieValues);
                if (!string.IsNullOrEmpty(cookies))
                    Response.Headers["X-F1-Cookies"] = cookies;
            }

            return Content(content, "application/json");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error during F1 negotiation");
            return StatusCode(503, new { error = "F1 live timing service unavailable" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during F1 negotiation proxy");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    [HttpGet("status")]
    public async Task<IActionResult> CheckF1Status()
    {
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(10);
            httpClient.DefaultRequestHeaders.Add("User-Agent", "Turn-One-F1-Client/1.0");

            var testUrl = $"{_baseUrl}/negotiate?negotiateVersion=1";

            HttpResponseMessage response;
            using (var postReq = new HttpRequestMessage(HttpMethod.Post, testUrl))
            {
                postReq.Content = new StringContent(string.Empty);
                response = await httpClient.SendAsync(postReq);
                if (response.StatusCode == System.Net.HttpStatusCode.MethodNotAllowed)
                {
                    response.Dispose();
                    response = await httpClient.GetAsync(testUrl);
                }
            }

            return Ok(new
            {
                available = response.IsSuccessStatusCode,
                statusCode = (int)response.StatusCode,
                hasActiveSession = response.IsSuccessStatusCode,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking F1 status");
            return Ok(new
            {
                available = false,
                statusCode = 0,
                hasActiveSession = false,
                timestamp = DateTime.UtcNow,
                error = ex.Message
            });
        }
    }

    [HttpOptions("negotiate")]
    public IActionResult OptionsNegotiate()
    {
        Response.Headers["Access-Control-Allow-Origin"] = "http://localhost:3000";
        Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
        Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
        Response.Headers["Access-Control-Allow-Credentials"] = "true";
        return Ok();
    }
}
