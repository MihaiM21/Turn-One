using System;
using Application.Interfaces;
using Domain.Entities;
using Application.DTOs;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly TurnOneDbContext _context;

        public UserService(TurnOneDbContext context)
        {
            _context = context;
        }

        public async Task<bool> UpdateUserProfile(string userId, UpdatedUserDto updatedUserDto)
        {
            if (string.IsNullOrEmpty(userId) || updatedUserDto == null)
            {
                Console.WriteLine("Invalid userId or updatedUserDto is null.");
                return false;
            }

            // Try parse the incoming userId (claims usually contain a Guid string)
            if (!Guid.TryParse(userId, out var requestingUserId))
            {
                Console.WriteLine("Invalid userId format.");
                return false;
            }

            // Normalize inputs for comparisons (trim + lower) to make checks case-insensitive
            var newUsername = (updatedUserDto.username ?? string.Empty).Trim();
            var newEmail = (updatedUserDto.email ?? string.Empty).Trim();

            // Check username/email are not used by another account (exclude requesting user)
            if (!string.IsNullOrEmpty(newUsername))
            {
                var normalizedUsername = newUsername.ToLower();
                if (await _context.Users.AnyAsync(u => u.Id != requestingUserId && u.Username.ToLower() == normalizedUsername))
                {
                    Console.WriteLine("Username already taken by another user.");
                    return false;
                }
            }

            if (!string.IsNullOrEmpty(newEmail))
            {
                var normalizedEmail = newEmail.ToLower();
                if (await _context.Users.AnyAsync(u => u.Id != requestingUserId && u.Email.ToLower() == normalizedEmail))
                {
                    Console.WriteLine("Email already taken by another user.");
                    return false;
                }
            }

            var user = await _context.Users.FindAsync(requestingUserId);
            if (user == null)
            {
                Console.WriteLine("Requesting user not found.");
                return false;
            }

            // Update fields. Allow avatarUrl to be null/omitted.
            user.Username = newUsername;
            user.Email = newEmail;
            user.AvatarUrl = updatedUserDto.avatarUrl;

            await _context.SaveChangesAsync();
            return true;
        }
    }
}