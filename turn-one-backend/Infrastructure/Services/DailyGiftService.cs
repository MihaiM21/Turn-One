using System;
using System.Threading.Tasks;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class DailyGiftService : IDailyGiftService
    {
        private readonly TurnOneDbContext _context;
        private readonly ILevelSystemService _levelSystemService;

        // Constants for daily gift rewards
        private const int DAILY_GIFT_COINS = 50;
        private const int DAILY_GIFT_XP = 25;

        public DailyGiftService(TurnOneDbContext context, ILevelSystemService levelSystemService)
        {
            _context = context;
            _levelSystemService = levelSystemService;
        }

        public async Task<bool> CanClaimDailyGiftAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            // If user has never claimed a gift or the last claim was before today (UTC)
            return user.LastDailyGiftDate == null || 
                   user.LastDailyGiftDate.Value.Date < DateTime.UtcNow.Date;
        }

        public async Task<(bool Awarded, int Coins, int Experience)> ClaimDailyGiftAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }

            // Check if user can claim daily gift
            if (!await CanClaimDailyGiftAsync(userId))
            {
                return (false, 0, 0);
            }

            // Award the gifts
            user.Coins += DAILY_GIFT_COINS;
            user.LastDailyGiftDate = DateTime.UtcNow;

            // Save changes to update the user's coins and last gift date
            await _context.SaveChangesAsync();

            // Add experience points using the level system service
            await _levelSystemService.AddExperienceAsync(userId, DAILY_GIFT_XP);

            return (true, DAILY_GIFT_COINS, DAILY_GIFT_XP);
        }
    }
}