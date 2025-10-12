using System.Threading.Tasks;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class LevelSystemService : ILevelSystemService
    {
        private readonly TurnOneDbContext _context;

        public LevelSystemService(TurnOneDbContext context)
        {
            _context = context;
        }
        
        public async Task<int> AddExperienceAsync(Guid userId, int experience)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }

            // Add experience
            user.Experience += experience;
            
            // Check for level ups
            bool leveledUp = false;
            int levelsGained = 0;
            
            do
            {
                int experienceRequiredForNextLevel = CalculateExperienceRequiredForNextLevel(user.Level);
                
                if (user.Experience >= experienceRequiredForNextLevel)
                {
                    // Level up
                    user.Level++;
                    user.Experience -= experienceRequiredForNextLevel;
                    leveledUp = true;
                    levelsGained++;
                }
                else
                {
                    leveledUp = false;
                }
            } while (leveledUp);
            
            await _context.SaveChangesAsync();
            return levelsGained;
        }
        
        public async Task<(int CurrentLevel, int CurrentExperience, int ExperienceToNextLevel)> GetUserProgressAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }
            
            int experienceToNextLevel = CalculateExperienceRequiredForNextLevel(user.Level);
            
            return (user.Level, user.Experience, experienceToNextLevel);
        }
        
        public int CalculateExperienceRequiredForNextLevel(int currentLevel)
        {
            // Formula: 100 * currentLevel + 100
            // Level 1 -> 2: 200 XP
            // Level 2 -> 3: 300 XP
            // Level 3 -> 4: 400 XP, etc.
            return 100 * currentLevel + 100;
        }
    }
}