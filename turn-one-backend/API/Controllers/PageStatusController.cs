using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PageStatusController : ControllerBase
    {
        private readonly IPageStatusService _pageStatusService;

        public PageStatusController(IPageStatusService pageStatusService)
        {
            _pageStatusService = pageStatusService;
        }

        [HttpGet]
        public async Task<ActionResult<List<PageStatus>>> GetAll()
        {
            try
            {
                var statuses = await _pageStatusService.GetAllPageStatusesAsync();
                return Ok(statuses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get page statuses", error = ex.Message });
            }
        }

        [HttpGet("{pageName}")]
        public async Task<ActionResult<PageStatus>> Get(string pageName)
        {
            try
            {
                // Accept URL-encoded page names, e.g. %2Flive -> /live
                var decodedName = Uri.UnescapeDataString(pageName);
                if (!decodedName.StartsWith("/"))
                {
                    decodedName = "/" + decodedName;
                }
                
                var status = await _pageStatusService.GetPageStatusAsync(decodedName);
                if (status == null)
                {
                    // Return a default "open" state if not found
                    return Ok(new PageStatus { PageName = decodedName, IsClosed = false, MaintenanceMessage = "" });
                }
                return Ok(status);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to get page status", error = ex.Message });
            }
        }

        [HttpPut("{pageName}")]
        [Authorize(Roles = "ADMIN")]
        public async Task<ActionResult<PageStatus>> Update(string pageName, [FromBody] UpdatePageStatusRequest request)
        {
            try
            {
                var decodedName = Uri.UnescapeDataString(pageName);
                if (!decodedName.StartsWith("/"))
                {
                    decodedName = "/" + decodedName;
                }
                
                var status = await _pageStatusService.UpdatePageStatusAsync(decodedName, request.IsClosed, request.MaintenanceMessage);
                return Ok(status);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to update page status", error = ex.Message });
            }
        }
    }

    public class UpdatePageStatusRequest
    {
        public bool IsClosed { get; set; }
        public string MaintenanceMessage { get; set; } = string.Empty;
    }
}
