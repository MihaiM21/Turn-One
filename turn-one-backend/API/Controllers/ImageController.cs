using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Infrastructure;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImageController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ImageController> _logger;
    private readonly TurnOneDbContext _context;

    public ImageController(IWebHostEnvironment environment, ILogger<ImageController> logger, TurnOneDbContext context)
    {
        _environment = environment;
        _logger = logger;
        _context = context;
    }

    // POST: api/image/upload - Upload image (Admin only)
    [Authorize]
    [HttpPost("upload")]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file provided" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Invalid file type. Only images are allowed." });
            }

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "File size must be less than 5MB" });
            }

            // Get web root path or use a default
            var webRootPath = _environment.WebRootPath;
            if (string.IsNullOrEmpty(webRootPath))
            {
                // If WebRootPath is not set, use a directory relative to content root
                webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(webRootPath, "uploads");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Get user ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userId = Guid.TryParse(userIdClaim, out var parsedUserId) ? parsedUserId : Guid.Empty;

            // Save to database
            var media = new Media
            {
                Id = Guid.NewGuid(),
                FileName = fileName,
                OriginalFileName = file.FileName,
                AltText = "",
                FilePath = $"/uploads/{fileName}",
                FileType = extension,
                FileSize = file.Length,
                UploadedAt = DateTime.UtcNow,
                UploadedByUserId = userId
            };

            _context.Media.Add(media);
            await _context.SaveChangesAsync();

            // Return media info
            return Ok(new { 
                id = media.Id,
                url = media.FilePath,
                fileName = media.FileName,
                originalFileName = media.OriginalFileName,
                altText = media.AltText,
                size = media.FileSize,
                uploadedAt = media.UploadedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image");
            return StatusCode(500, new { message = "Error uploading image" });
        }
    }

    // GET: api/image - Get all uploaded images (Admin only)
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetImages()
    {
        try
        {
            var media = await _context.Media
                .OrderByDescending(m => m.UploadedAt)
                .Select(m => new
                {
                    id = m.Id,
                    url = m.FilePath,
                    fileName = m.FileName,
                    originalFileName = m.OriginalFileName,
                    altText = m.AltText,
                    size = m.FileSize,
                    uploadedAt = m.UploadedAt
                })
                .ToListAsync();

            return Ok(media);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting images");
            return StatusCode(500, new { message = "Error retrieving images" });
        }
    }

    // DELETE: api/image/{id} - Delete image (Admin only)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteImage(Guid id)
    {
        try
        {
            var media = await _context.Media.FindAsync(id);
            if (media == null)
            {
                return NotFound(new { message = "Image not found" });
            }

            // Delete physical file
            var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads");
            var filePath = Path.Combine(uploadsPath, media.FileName);

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }

            // Delete from database
            _context.Media.Remove(media);
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Image deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image");
            return StatusCode(500, new { message = "Error deleting image" });
        }
    }

    // PUT: api/image/{id} - Update image metadata (Admin only)
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMedia(Guid id, [FromBody] UpdateMediaDto dto)
    {
        try
        {
            var media = await _context.Media.FindAsync(id);
            if (media == null)
            {
                return NotFound(new { message = "Image not found" });
            }

            // Update alt text
            if (dto.AltText != null)
            {
                media.AltText = dto.AltText;
            }

            // Update original file name (for display purposes)
            if (dto.OriginalFileName != null && !string.IsNullOrWhiteSpace(dto.OriginalFileName))
            {
                media.OriginalFileName = dto.OriginalFileName;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = media.Id,
                url = media.FilePath,
                fileName = media.FileName,
                originalFileName = media.OriginalFileName,
                altText = media.AltText,
                size = media.FileSize,
                uploadedAt = media.UploadedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating image metadata");
            return StatusCode(500, new { message = "Error updating image" });
        }
    }
}

public class UpdateMediaDto
{
    public string? AltText { get; set; }
    public string? OriginalFileName { get; set; }
}
