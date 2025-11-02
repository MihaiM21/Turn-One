using Application.DTOs;

namespace Application.Interfaces
{
    public interface IUserService
    {
        Task<bool> UpdateUserProfile(string userId, UpdatedUserDto updatedUserDto);
    }
}