using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Infrastructure;
using System.Diagnostics;

namespace API.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;
    private readonly TurnOneDbContext _dbContext;

    public HealthController(ILogger<HealthController> logger, TurnOneDbContext dbContext)
    {
        _logger = logger;
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        try
        {
            var checks = new Dictionary<string, object>();
            
            // Database check
            var dbHealthy = await CheckDatabaseHealth();
            checks["database"] = new { status = dbHealthy ? "healthy" : "unhealthy" };
            
            // Memory check
            var process = Process.GetCurrentProcess();
            var memoryMB = process.WorkingSet64 / 1024 / 1024;
            checks["memory"] = new { usageMB = memoryMB, status = memoryMB < 1024 ? "healthy" : "warning" };
            
            // Uptime
            var uptime = DateTime.UtcNow.Subtract(process.StartTime).ToString(@"dd\.hh\:mm\:ss");
            
            var healthStatus = new
            {
                status = dbHealthy ? "Healthy" : "Degraded",
                timestamp = DateTime.UtcNow,
                version = GetType().Assembly.GetName().Version?.ToString(),
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                uptime = uptime,
                checks = checks
            };

            return dbHealthy ? Ok(healthStatus) : StatusCode(503, healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(503, new { 
                status = "Unhealthy", 
                error = ex.Message,
                timestamp = DateTime.UtcNow 
            });
        }
    }

    [HttpGet("ready")]
    public async Task<IActionResult> Ready()
    {
        try
        {
            // Check if database is accessible
            var canConnect = await _dbContext.Database.CanConnectAsync();
            
            if (!canConnect)
            {
                return StatusCode(503, new { 
                    status = "NotReady", 
                    reason = "Database not accessible",
                    timestamp = DateTime.UtcNow 
                });
            }
            
            return Ok(new { 
                status = "Ready", 
                timestamp = DateTime.UtcNow,
                database = "connected"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Readiness check failed");
            return StatusCode(503, new { 
                status = "NotReady", 
                error = ex.Message,
                timestamp = DateTime.UtcNow 
            });
        }
    }

    [HttpGet("live")]
    public IActionResult Live()
    {
        // Liveness check - just confirms the app is running
        return Ok(new { 
            status = "Live", 
            timestamp = DateTime.UtcNow 
        });
    }
    
    [HttpGet("metrics")]
    public IActionResult Metrics()
    {
        try
        {
            var process = Process.GetCurrentProcess();
            
            var metrics = new
            {
                timestamp = DateTime.UtcNow,
                process = new
                {
                    memoryMB = process.WorkingSet64 / 1024 / 1024,
                    cpuTimeSeconds = process.TotalProcessorTime.TotalSeconds,
                    threadCount = process.Threads.Count,
                    handleCount = process.HandleCount
                },
                runtime = new
                {
                    uptime = DateTime.UtcNow.Subtract(process.StartTime).ToString(@"dd\.hh\:mm\:ss"),
                    startTime = process.StartTime,
                    gcTotalMemoryMB = GC.GetTotalMemory(false) / 1024 / 1024,
                    gen0Collections = GC.CollectionCount(0),
                    gen1Collections = GC.CollectionCount(1),
                    gen2Collections = GC.CollectionCount(2)
                }
            };
            
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Metrics collection failed");
            return StatusCode(500, new { error = ex.Message });
        }
    }
    
    private async Task<bool> CheckDatabaseHealth()
    {
        try
        {
            return await _dbContext.Database.CanConnectAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Database health check failed");
            return false;
        }
    }
}