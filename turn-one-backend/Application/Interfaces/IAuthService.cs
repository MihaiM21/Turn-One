
using Application.DTOs;

namespace Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> Login(LoginDto loginDto);
        
        Task<AuthResponseDto> Register(RegisterDto registerDto);
        
        Task<bool> ConfirmEmailAsync(string token);
        
        Task<bool> RequestPasswordResetAsync(string email);
        
        Task<bool> ResetPasswordAsync(string token, string newPassword);
        
        // JWT token-based authentication doesn't typically require a server-side logout
        // Client simply discards the token
    }
}