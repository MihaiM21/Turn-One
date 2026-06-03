using Domain.Entities;

namespace Application.Interfaces;

public interface IOverlayTokenService
{
    Task<OverlayShareToken> CreateAsync(Guid userId, string? label, string? scopes, TimeSpan? lifetime = null);
    Task<List<OverlayShareToken>> ListAsync(Guid userId);
    Task RevokeAsync(Guid tokenId, Guid userId);
    Task<OverlayShareToken?> ResolveAsync(string token);
    string IssueShortLivedJwt(OverlayShareToken token);
}
