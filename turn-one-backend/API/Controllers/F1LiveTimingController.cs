using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class F1LiveTimingController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<F1LiveTimingController> _logger;

    public F1LiveTimingController(IHttpClientFactory httpClientFactory, ILogger<F1LiveTimingController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    private static void AddBrowserHeaders(HttpClient httpClient)
    {
        httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
        httpClient.DefaultRequestHeaders.Add("Accept", "application/json, text/plain, */*");
        httpClient.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.9");
        httpClient.DefaultRequestHeaders.Add("Referer", "https://www.formula1.com/");
        httpClient.DefaultRequestHeaders.Add("Origin", "https://www.formula1.com");
    }

    [HttpGet("negotiate")]
    public async Task<IActionResult> ProxyNegotiate([FromQuery] string connectionData, [FromQuery] string clientProtocol = "1.5")
    {
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30);
            AddBrowserHeaders(httpClient);
            
            var negotiationUrl = $"https://livetiming.formula1.com/signalr/negotiate?connectionData={connectionData}&clientProtocol={clientProtocol}";
            
            _logger.LogInformation("Proxying F1 negotiation request to: {Url}", negotiationUrl);
            
            var response = await httpClient.GetAsync(negotiationUrl);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("F1 negotiation failed with status: {StatusCode}", response.StatusCode);
                return StatusCode((int)response.StatusCode, new { error = "F1 live timing not available" });
            }

            var content = await response.Content.ReadAsStringAsync();
            
            // Parse and modify the response to extend timeouts
            try 
            {
                var negotiationResponse = JsonSerializer.Deserialize<JsonElement>(content);
                var modifiedResponse = new Dictionary<string, object>();
                
                foreach (var property in negotiationResponse.EnumerateObject())
                {
                    if (property.Name == "KeepAliveTimeout")
                    {
                        modifiedResponse[property.Name] = 300.0; // 5 minutes instead of default
                    }
                    else if (property.Name == "DisconnectTimeout")
                    {
                        modifiedResponse[property.Name] = 600.0; // 10 minutes instead of default
                    }
                    else if (property.Name == "ConnectionTimeout")
                    {
                        modifiedResponse[property.Name] = 1800.0; // 30 minutes instead of default
                    }
                    else
                    {
                        modifiedResponse[property.Name] = property.Value;
                    }
                }
                
                content = JsonSerializer.Serialize(modifiedResponse);
                _logger.LogInformation("Modified F1 negotiation response with extended timeouts");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not modify negotiation response, using original");
            }
            
            var cookies = response.Headers.GetValues("Set-Cookie").FirstOrDefault();
            
            // Add CORS headers explicitly
            Response.Headers["Access-Control-Allow-Origin"] = "http://localhost:3000";
            Response.Headers["Access-Control-Allow-Credentials"] = "true";
            
            if (!string.IsNullOrEmpty(cookies))
            {
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
            AddBrowserHeaders(httpClient);
            
            // Try to access F1 live timing to check if there's an active session
            var hub = Uri.EscapeDataString(JsonSerializer.Serialize(new[] { new { name = "Streaming" } }));
            var testUrl = $"https://livetiming.formula1.com/signalr/negotiate?connectionData={hub}&clientProtocol=1.5";
            
            var response = await httpClient.GetAsync(testUrl);
            
            var status = new
            {
                available = response.IsSuccessStatusCode,
                statusCode = (int)response.StatusCode,
                hasActiveSession = response.IsSuccessStatusCode,
                timestamp = DateTime.UtcNow
            };
            
            return Ok(status);
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
        Response.Headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
        Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
        Response.Headers["Access-Control-Allow-Credentials"] = "true";
        return Ok();
    }
}