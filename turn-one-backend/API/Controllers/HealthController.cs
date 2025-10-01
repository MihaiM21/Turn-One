using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace API.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;

    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Get()
    {
        try
        {
            // Add any additional health checks here
            // e.g., database connectivity, external services, etc.
            
            var healthStatus = new
            {
                status = "Healthy",
                timestamp = DateTime.UtcNow,
                version = GetType().Assembly.GetName().Version?.ToString(),
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                uptime = DateTime.UtcNow.Subtract(Process.GetCurrentProcess().StartTime).ToString(@"dd\.hh\:mm\:ss")
            };

            return Ok(healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(503, new { status = "Unhealthy", error = ex.Message });
        }
    }

    [HttpGet("ready")]
    public IActionResult Ready()
    {
        // Add readiness checks here (database, dependencies, etc.)
        return Ok(new { status = "Ready", timestamp = DateTime.UtcNow });
    }

    [HttpGet("live")]
    public IActionResult Live()
    {
        // Basic liveness check
        return Ok(new { status = "Alive", timestamp = DateTime.UtcNow });
    }
}