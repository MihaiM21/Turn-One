using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class AdminService : IAdminService
    {
        private readonly TurnOneDbContext _context;

        public AdminService(TurnOneDbContext context)
        {
            _context = context;
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _context.Users
                .OrderBy(u => u.CreatedAt)
                .ToListAsync();
        }

        public async Task<User?> GetUserByIdAsync(Guid userId)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        public async Task<bool> UpdateUserPlanAsync(Guid userId, PlanType planType)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.Plan = planType;
            user.PlanStartDate = DateTime.UtcNow;
            
            // Set appropriate tokens based on plan
            var planDetails = PlanDetails.GetPlanDetails(planType);
            user.Tokens = planDetails.MonthlyTokens;
            user.LastTokenRefillDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateUserRoleAsync(Guid userId, Role role)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.Role = role;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateUserTokensAsync(Guid userId, int tokens)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.Tokens = tokens;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateUserCoinsAsync(Guid userId, int coins)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.Coins = coins;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteUserAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IsUserAdminAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            return user?.Role == Role.ADMIN;
        }
    }
}