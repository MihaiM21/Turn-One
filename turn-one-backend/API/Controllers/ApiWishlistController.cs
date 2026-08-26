using Application.DTOs;
using Domain.Entities;
using Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApiWishlistController : ControllerBase
{
    private readonly TurnOneDbContext _context;
    private readonly ILogger<ApiWishlistController> _logger;

    public ApiWishlistController(
        TurnOneDbContext context,
        ILogger<ApiWishlistController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> SubscribeToWishlist([FromBody] ApiWishlistDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            // Check if email already exists
            var existingEntry = await _context.ApiWishlists
                .FirstOrDefaultAsync(w => w.Email.ToLower() == dto.Email.ToLower());

            if (existingEntry != null)
            {
                return Ok(new { success = true, message = "You're already on the wishlist!" });
            }

            // Create new wishlist entry
            var wishlistEntry = new ApiWishlist
            {
                Id = Guid.NewGuid(),
                Email = dto.Email,
                SubscribedAt = DateTime.UtcNow,
                IsNotified = false,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
            };

            _context.ApiWishlists.Add(wishlistEntry);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"New API wishlist subscription: {dto.Email}");

            return Ok(new { success = true, message = "Successfully subscribed to wishlist" });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error processing API wishlist subscription: {ex.Message}");
            return StatusCode(500, new { success = false, message = "Failed to process subscription" });
        }
    }

    // Returns the full subscriber email list, so it must never be public.
    [Authorize(Roles = "ADMIN")]
    [HttpGet]
    public async Task<IActionResult> GetWishlistSubscribers()
    {
        try
        {
            var subscribers = await _context.ApiWishlists
                .OrderByDescending(w => w.SubscribedAt)
                .Select(w => new 
                {
                    w.Id,
                    w.Email,
                    w.SubscribedAt,
                    w.IsNotified
                })
                .ToListAsync();

            return Ok(subscribers);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error retrieving wishlist subscribers: {ex.Message}");
            return StatusCode(500, new { success = false, message = "Failed to retrieve subscribers" });
        }
    }
}
