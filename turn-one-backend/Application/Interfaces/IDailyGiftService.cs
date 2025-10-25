using Domain.Entities;

namespace Application.Interfaces
{
    public interface IDailyGiftService
    {
        Task<(bool Awarded, int Coins, int Experience)> ClaimDailyGiftAsync(Guid userId);
        Task<bool> CanClaimDailyGiftAsync(Guid userId);
    }
}