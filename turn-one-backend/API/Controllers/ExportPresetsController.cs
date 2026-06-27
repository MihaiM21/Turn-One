using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers
{
    [Authorize(Roles = "ADMIN")]
    [ApiController]
    [Route("api/export-presets")]
    public class ExportPresetsController : ControllerBase
    {
        private readonly IExportPresetService _service;
        private readonly ILogger<ExportPresetsController> _logger;

        public ExportPresetsController(IExportPresetService service, ILogger<ExportPresetsController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] string? sessionType = null)
        {
            try
            {
                var presets = await _service.GetPresetsAsync(sessionType);
                return Ok(new { success = true, data = presets });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing export presets");
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var preset = await _service.GetPresetAsync(id);
            if (preset == null) return NotFound(new { success = false, message = "Preset not found" });
            return Ok(new { success = true, data = preset });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateExportPresetDto dto)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var preset = await _service.CreatePresetAsync(userId, dto);
                return Ok(new { success = true, data = preset });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating export preset");
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateExportPresetDto dto)
        {
            try
            {
                var preset = await _service.UpdatePresetAsync(id, dto);
                if (preset == null) return NotFound(new { success = false, message = "Preset not found" });
                return Ok(new { success = true, data = preset });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating export preset {Id}", id);
                return StatusCode(500, new { success = false, message = "An error occurred", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var ok = await _service.DeletePresetAsync(id);
            if (!ok) return NotFound(new { success = false, message = "Preset not found" });
            return Ok(new { success = true, message = "Preset deleted" });
        }
    }
}
