using Domain.Entities;
using Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticleController : ControllerBase
{
    private readonly TurnOneDbContext _context;

    public ArticleController(TurnOneDbContext context)
    {
        _context = context;
    }

    // GET: api/article - Get all published articles
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Article>>> GetArticles(
        [FromQuery] bool? featured = null,
        [FromQuery] string? category = null,
        [FromQuery] int? limit = null)
    {
        var query = _context.Articles
            .Where(a => a.IsPublished)
            .OrderByDescending(a => a.PublishDate)
            .AsQueryable();

        if (featured.HasValue)
        {
            query = query.Where(a => a.Featured == featured.Value);
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(a => a.Category == category);
        }

        if (limit.HasValue)
        {
            query = query.Take(limit.Value);
        }

        var articles = await query.ToListAsync();
        return Ok(articles);
    }

    // GET: api/article/{slug} - Get single article by slug
    [HttpGet("{slug}")]
    public async Task<ActionResult<Article>> GetArticle(string slug)
    {
        var article = await _context.Articles
            .FirstOrDefaultAsync(a => a.Slug == slug && a.IsPublished);

        if (article == null)
        {
            return NotFound(new { message = "Article not found" });
        }

        return Ok(article);
    }

    // POST: api/article - Create new article (Admin only)
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<Article>> CreateArticle([FromBody] ArticleDto articleDto)
    {
        // Check if user is admin
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "ADMIN" && userRole != "CONTENT_CREATOR")
        {
            return Forbid();
        }

        // Check if slug already exists
        if (await _context.Articles.AnyAsync(a => a.Slug == articleDto.Slug))
        {
            return BadRequest(new { message = "Article with this slug already exists" });
        }

        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new Exception("User ID not found"));

        var article = new Article
        {
            Id = Guid.NewGuid(),
            Slug = articleDto.Slug,
            Title = articleDto.Title,
            Excerpt = articleDto.Excerpt,
            Content = articleDto.Content,
            Category = articleDto.Category,
            Author = articleDto.Author,
            Tags = articleDto.Tags ?? new List<string>(),
            Featured = articleDto.Featured,
            PublishDate = DateTime.SpecifyKind(articleDto.PublishDate, DateTimeKind.Utc),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedByUserId = userId,
            IsPublished = true
        };

        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetArticle), new { slug = article.Slug }, article);
    }

    // PUT: api/article/{slug} - Update article (Admin only)
    [Authorize]
    [HttpPut("{slug}")]
    public async Task<IActionResult> UpdateArticle(string slug, [FromBody] ArticleDto articleDto)
    {
        // Check if user is admin
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "ADMIN" && userRole != "CONTENT_CREATOR")
        {
            return Forbid();
        }

        var article = await _context.Articles.FirstOrDefaultAsync(a => a.Slug == slug);
        if (article == null)
        {
            return NotFound(new { message = "Article not found" });
        }

        // If slug is changing, check if new slug already exists
        if (articleDto.Slug != slug && await _context.Articles.AnyAsync(a => a.Slug == articleDto.Slug))
        {
            return BadRequest(new { message = "Article with this slug already exists" });
        }

        article.Slug = articleDto.Slug;
        article.Title = articleDto.Title;
        article.Excerpt = articleDto.Excerpt;
        article.Content = articleDto.Content;
        article.Category = articleDto.Category;
        article.Author = articleDto.Author;
        article.Tags = articleDto.Tags ?? new List<string>();
        article.Featured = articleDto.Featured;
        article.PublishDate = DateTime.SpecifyKind(articleDto.PublishDate, DateTimeKind.Utc);
        article.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(article);
    }

    // DELETE: api/article/{slug} - Delete article (Admin only)
    [Authorize]
    [HttpDelete("{slug}")]
    public async Task<IActionResult> DeleteArticle(string slug)
    {
        // Check if user is admin
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "ADMIN" && userRole != "CONTENT_CREATOR")
        {
            return Forbid();
        }

        var article = await _context.Articles.FirstOrDefaultAsync(a => a.Slug == slug);
        if (article == null)
        {
            return NotFound(new { message = "Article not found" });
        }

        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Article deleted successfully" });
    }

    // GET: api/article/admin/all - Get all articles including unpublished (Admin only)
    [Authorize]
    [HttpGet("admin/all")]
    public async Task<ActionResult<IEnumerable<Article>>> GetAllArticlesAdmin()
    {
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "ADMIN" && userRole != "CONTENT_CREATOR")
        {
            return Forbid();
        }

        var articles = await _context.Articles
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(articles);
    }
}

public class ArticleDto
{
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public List<string>? Tags { get; set; }
    public bool Featured { get; set; }
    public DateTime PublishDate { get; set; }
}
