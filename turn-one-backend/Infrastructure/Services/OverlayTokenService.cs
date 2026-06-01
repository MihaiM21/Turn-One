using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Infrastructure.Services;

public class OverlayTokenService : IOverlayTokenService
{
    private readonly TurnOneDbContext _context;
    private readonly IConfiguration _config;

    public OverlayTokenService(TurnOneDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<OverlayShareToken> CreateAsync(Guid userId, string? label, string? scopes, TimeSpan? lifetime = null)
    {
        var raw = GenerateRandomToken();
        var token = new OverlayShareToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = raw,
            Label = string.IsNullOrWhiteSpace(label) ? "Overlay" : label.Trim(),
            Scopes = string.IsNullOrWhiteSpace(scopes) ? "cockpit,lap,leaderboard" : scopes.Trim(),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = lifetime.HasValue ? DateTime.UtcNow.Add(lifetime.Value) : null,
        };

        _context.OverlayShareTokens.Add(token);
        await _context.SaveChangesAsync();
        return token;
    }

    public async Task<List<OverlayShareToken>> ListAsync(Guid userId)
    {
        return await _context.OverlayShareTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task RevokeAsync(Guid tokenId, Guid userId)
    {
        var token = await _context.OverlayShareTokens.FirstOrDefaultAsync(t => t.Id == tokenId && t.UserId == userId);
        if (token == null) return;
        token.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task<OverlayShareToken?> ResolveAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        var record = await _context.OverlayShareTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token);
        if (record == null) return null;
        if (record.RevokedAt != null) return null;
        if (record.ExpiresAt.HasValue && record.ExpiresAt.Value < DateTime.UtcNow) return null;
        return record;
    }

    public string IssueShortLivedJwt(OverlayShareToken token)
    {
        var jwtKey = _config["JWT:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, token.UserId.ToString()),
            new Claim("Plan", token.User.Plan.ToString()),
            new Claim("Scope", "overlay"),
            new Claim("OverlayTokenId", token.Id.ToString()),
        };

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(30),
            SigningCredentials = credentials,
            Issuer = _config["JWT:Issuer"],
            Audience = _config["JWT:Audience"],
        };

        var handler = new JwtSecurityTokenHandler();
        return handler.WriteToken(handler.CreateToken(descriptor));
    }

    private static string GenerateRandomToken()
    {
        var bytes = new byte[48];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }
}
