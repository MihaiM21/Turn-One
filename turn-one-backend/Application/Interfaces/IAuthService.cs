
using Application.DTOs;

namespace TurnOne.Application.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponseDto> Login(LoginDto loginDto);

        Task<AuthResponseDto> Register(RegisterDto registerDto);

        // JWT token-based authentication doesn't typically require a server-side logout
        // Client simply discards the token
    }
}