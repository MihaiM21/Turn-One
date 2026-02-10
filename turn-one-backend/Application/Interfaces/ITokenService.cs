namespace Application.Interfaces
{
    public interface ITokenService
    {
        Task<int> GetTokenBalanceAsync(Guid userId);
        Task<int> AddTokensAsync(Guid userId, int amount);
        Task<bool> DeductTokensAsync(Guid userId, int amount);
        Task<bool> HasClaimedStarterPackAsync(Guid userId);
        Task MarkStarterPackClaimedAsync(Guid userId);
    }
}
