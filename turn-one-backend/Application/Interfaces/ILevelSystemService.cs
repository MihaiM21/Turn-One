using Domain.Entities;

namespace Application.Interfaces
{
    public interface ILevelSystemService
    {
        Task<int> AddExperienceAsync(Guid userId, int experience);
        Task<(int CurrentLevel, int CurrentExperience, int ExperienceToNextLevel)> GetUserProgressAsync(Guid userId);
        int CalculateExperienceRequiredForNextLevel(int currentLevel);
    }
}