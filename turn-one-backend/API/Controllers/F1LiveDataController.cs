using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using API.Services;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class F1LiveDataController : ControllerBase
{
    private readonly F1LiveTimingService _f1Service;
    private readonly ILogger<F1LiveDataController> _logger;

    public F1LiveDataController(F1LiveTimingService f1Service, ILogger<F1LiveDataController> logger)
    {
        _f1Service = f1Service;
        _logger = logger;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        try
        {
            var status = await _f1Service.GetConnectionStatusAsync();
            var isConnected = _f1Service.IsConnected;

            return Ok(new
            {
                Status = status,
                IsConnected = isConnected,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting F1 service status");
            return StatusCode(500, new { Error = "Failed to get service status" });
        }
    }

    // Restarting the upstream feed affects every connected client, so it is not
    // something an ordinary authenticated user should be able to trigger.
    [Authorize(Roles = "ADMIN")]
    [HttpPost("restart")]
    public async Task<IActionResult> RestartService()
    {
        try
        {
            await _f1Service.StopAsync();
            await _f1Service.StartAsync();

            return Ok(new
            {
                Message = "F1 service restarted successfully",
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restarting F1 service");
            return StatusCode(500, new { Error = "Failed to restart service" });
        }
    }
    
    [HttpGet("data")]
    public IActionResult GetCurrentData()
    {
        try
        {
            var data = _f1Service.GetCurrentData();
            var timestamp = _f1Service.GetLastDataTimestamp();
            
            return Ok(new
            {
                Data = data,
                Timestamp = timestamp,
                IsLive = _f1Service.IsConnected
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting F1 current data");
            return StatusCode(500, new { Error = "Failed to get current data" });
        }
    }
    
    [HttpGet("persisted-data")]
    public IActionResult GetPersistedData()
    {
        try
        {
            var data = _f1Service.GetLastReceivedData();
            var timestamp = _f1Service.GetLastDataTimestamp();
            
            return Ok(new
            {
                Data = data,
                Timestamp = timestamp
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting F1 persisted data");
            return StatusCode(500, new { Error = "Failed to get persisted data" });
        }
    }
    
    [Authorize(Roles = "ADMIN")]
    [HttpPost("clear-persisted-data")]
    public IActionResult ClearPersistedData()
    {
        try
        {
            _f1Service.ClearPersistedData();
            
            return Ok(new
            {
                Message = "Persisted F1 data cleared successfully",
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing F1 persisted data");
            return StatusCode(500, new { Error = "Failed to clear persisted data" });
        }
    }
}