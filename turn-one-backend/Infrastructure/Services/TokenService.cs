using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services
{
    public class TokenService : ITokenService
    {
        private readonly TurnOneDbContext _context;

        public TokenService(TurnOneDbContext context)
        {
            _context = context;
        }

        public async Task<int> GetTokenBalanceAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }
            return user.Tokens;
        }

        public async Task<int> AddTokensAsync(Guid userId, int amount)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            user.Tokens += amount;
            await _context.SaveChangesAsync();

            return user.Tokens;
        }

        public async Task<bool> DeductTokensAsync(Guid userId, int amount)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            if (user.Tokens < amount)
            {
                return false;
            }

            user.Tokens -= amount;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> HasClaimedStarterPackAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            return user.HasClaimedStarterPack;
        }

        public async Task MarkStarterPackClaimedAsync(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found");
            }

            user.HasClaimedStarterPack = true;
            await _context.SaveChangesAsync();
        }
    }
}
