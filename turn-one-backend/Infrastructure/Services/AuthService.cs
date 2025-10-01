using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Application.DTOs;
using Domain.Entities;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Application.Interfaces;

namespace Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly TurnOneDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(TurnOneDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<AuthResponseDto> Login(LoginDto loginDto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == loginDto.Email.ToLower());
            
            if (user == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "User not found."
                };
            }
            
            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.Password))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Invalid credentials."
                };
            }

            // Update last login timestamp
            user.LastLogin = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            // Generate JWT token
            var token = GenerateJwtToken(user);
            
            return new AuthResponseDto
            {
                Success = true,
                Message = "Login successful",
                Token = token,
                Username = user.Username,
                Expiration = DateTime.UtcNow.AddDays(7) // Token expiration date
            };
        }

        public async Task<AuthResponseDto> Register(RegisterDto registerDto)
        {
            // Check if email is already taken
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == registerDto.Email.ToLower()))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Email is already registered."
                };
            }
            
            // Check if username is already taken
            if (await _context.Users.AnyAsync(u => u.Username.ToLower() == registerDto.Username.ToLower()))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Username is already taken."
                };
            }
            
            // Hash the password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);
            
            // Create new user
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = registerDto.Email,
                Username = registerDto.Username,
                Password = passwordHash,
                Role = registerDto.Email == "mihai@t1f1.com" ? Domain.Enums.Role.ADMIN : Domain.Enums.Role.USER,
                CreatedAt = DateTime.UtcNow
            };
            
            // Save to database
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
            // Generate JWT token
            var token = GenerateJwtToken(user);
            
            return new AuthResponseDto
            {
                Success = true,
                Message = "Registration successful",
                Token = token,
                Username = user.Username,
                Expiration = DateTime.UtcNow.AddDays(7) // Token expiration date
            };
        }
        
        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["JWT:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("Plan", user.Plan.ToString()),
                new Claim("CreatedAt", user.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"))
            };
            
            // Add avatar URL claim if it exists
            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                claims.Add(new Claim("AvatarUrl", user.AvatarUrl));
            }
            
            // Use HMAC-SHA256 instead of HMAC-SHA512 which requires a shorter key length
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
            
            // Use ExpiryInDays from configuration if available, otherwise default to 7 days
            int expiryInDays = 7;
            if (int.TryParse(_configuration["JWT:ExpiryInDays"], out int configuredDays))
            {
                expiryInDays = configuredDays;
            }
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(expiryInDays),
                SigningCredentials = credentials,
                Issuer = _configuration["JWT:Issuer"],
                Audience = _configuration["JWT:Audience"]
            };
            
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            
            return tokenHandler.WriteToken(token);
        }
    }
}