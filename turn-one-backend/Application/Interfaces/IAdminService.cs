using Domain.Entities;
using Domain.Enums;

namespace Application.Interfaces
{
    public interface IAdminService
    {
        Task<List<User>> GetAllUsersAsync();
        Task<User?> GetUserByIdAsync(Guid userId);
        Task<bool> UpdateUserPlanAsync(Guid userId, PlanType planType);
        Task<bool> UpdateUserRoleAsync(Guid userId, Role role);
        Task<bool> UpdateUserTokensAsync(Guid userId, int tokens);
        Task<bool> UpdateUserCoinsAsync(Guid userId, int coins);
        Task<bool> DeleteUserAsync(Guid userId);
        Task<bool> IsUserAdminAsync(Guid userId);
        Task<List<User>> GetOnlineUsersAsync(int minutes = 30);
    }
}