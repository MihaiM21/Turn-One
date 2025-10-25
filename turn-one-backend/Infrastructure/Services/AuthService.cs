using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Application.DTOs;
using Domain.Entities;
using Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Application.Interfaces;

namespace Infrastructure.Services
{
    public class AuthService : IAuthService
    {
    private readonly TurnOneDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IDailyGiftService _dailyGiftService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthService> _logger;
    private readonly string _appBaseUrl;

        public AuthService(
            TurnOneDbContext context, 
            IConfiguration configuration, 
            IDailyGiftService dailyGiftService,
            IEmailService emailService,
            ILogger<AuthService> logger)
        {
            _context = context;
            _configuration = configuration;
            _dailyGiftService = dailyGiftService;
            _emailService = emailService;
            _logger = logger;
            _appBaseUrl = configuration["AppSettings:BaseUrl"] ?? "https://turnonehub.com";
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

            // Check if email is confirmed (skip for admin users)
            if (!user.IsEmailConfirmed && user.Role != Domain.Enums.Role.ADMIN)
            {
                // Generate a new confirmation token if needed
                if (string.IsNullOrEmpty(user.EmailConfirmationToken) || 
                    user.EmailConfirmationTokenExpires < DateTime.UtcNow)
                {
                    user.EmailConfirmationToken = GenerateRandomToken();
                    user.EmailConfirmationTokenExpires = DateTime.UtcNow.AddDays(1);
                    await _context.SaveChangesAsync();
                    
                    // Resend confirmation email
                    try
                    {
                        var confirmationLink = $"{_appBaseUrl}/auth/confirm-email?token={user.EmailConfirmationToken}";
                        await _emailService.SendEmailConfirmationAsync(user.Email, confirmationLink);
                    }
                    catch (Exception ex)
                    {
                        _logger?.LogError(ex, "Failed to resend confirmation email to {email}", user.Email);
                    }
                }

                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Please confirm your email address to login. We've sent a new confirmation link to your email.",
                    EmailConfirmed = false
                };
            }

            // Update last login timestamp
            user.LastLogin = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            // Check and award daily gifts
            var canClaimGift = await _dailyGiftService.CanClaimDailyGiftAsync(user.Id);
            bool giftClaimed = false;
            int coinsAwarded = 0;
            int experienceAwarded = 0;
            
            if (canClaimGift)
            {
                var (awarded, coins, experience) = await _dailyGiftService.ClaimDailyGiftAsync(user.Id);
                giftClaimed = awarded;
                coinsAwarded = coins;
                experienceAwarded = experience;
            }
            
            // Generate JWT token
            var token = GenerateJwtToken(user);
            
            return new AuthResponseDto
            {
                Success = true,
                Message = giftClaimed 
                    ? $"Login successful! Daily gift claimed: {coinsAwarded} coins and {experienceAwarded} XP" 
                    : "Login successful",
                Token = token,
                Username = user.Username,
                Expiration = DateTime.UtcNow.AddDays(7), // Token expiration date
                DailyGiftClaimed = giftClaimed,
                EmailConfirmed = user.IsEmailConfirmed
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
            
            // Generate email confirmation token
            var emailConfirmationToken = GenerateRandomToken();
            
            // Create new user
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = registerDto.Email,
                Username = registerDto.Username,
                Password = passwordHash,
                Role = registerDto.Email == "mihai@t1f1.com" ? Domain.Enums.Role.ADMIN : Domain.Enums.Role.USER,
                CreatedAt = DateTime.UtcNow,
                IsEmailConfirmed = false,
                EmailConfirmationToken = emailConfirmationToken,
                EmailConfirmationTokenExpires = DateTime.UtcNow.AddDays(1) // Token valid for 1 day
            };
            
            // For admin user, auto-confirm email
            if (user.Role == Domain.Enums.Role.ADMIN)
            {
                user.IsEmailConfirmed = true;
                user.EmailConfirmationToken = null;
                user.EmailConfirmationTokenExpires = null;
            }
            
            // Save to database
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
            // Generate JWT token
            var token = GenerateJwtToken(user);
            
            // Send confirmation email for non-admin users
            if (user.Role != Domain.Enums.Role.ADMIN)
            {
                try
                {
                    var confirmationLink = $"{_appBaseUrl}/auth/confirm-email?token={emailConfirmationToken}";
                    await _emailService.SendEmailConfirmationAsync(user.Email, confirmationLink);
                }
                catch (Exception)
                {
                    // Log email sending failure, but continue with registration
                    // Consider adding a retry mechanism or notifying admins
                }
            }
            
            return new AuthResponseDto
            {
                Success = true,
                Message = user.Role == Domain.Enums.Role.ADMIN 
                    ? "Registration successful" 
                    : "Registration successful. Please check your email to confirm your account.",
                Token = token,
                Username = user.Username,
                Expiration = DateTime.UtcNow.AddDays(7), // Token expiration date
                EmailConfirmed = user.IsEmailConfirmed
            };
        }
        
        public async Task<bool> ConfirmEmailAsync(string token)
        {
            if (string.IsNullOrEmpty(token))
                return false;

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.EmailConfirmationToken == token && 
                                        u.EmailConfirmationTokenExpires > DateTime.UtcNow);

            if (user == null)
                return false;

            user.IsEmailConfirmed = true;
            user.EmailConfirmationToken = null;
            user.EmailConfirmationTokenExpires = null;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RequestPasswordResetAsync(string email)
        {
            if (string.IsNullOrEmpty(email))
                return false;

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

            if (user == null)
                return false;

            // Generate password reset token
            var resetToken = GenerateRandomToken();
            user.PasswordResetToken = resetToken;
            user.PasswordResetTokenExpires = DateTime.UtcNow.AddHours(1); // Token valid for 1 hour

            await _context.SaveChangesAsync();

            try
            {
                var resetLink = $"{_appBaseUrl}/auth/reset-password?token={resetToken}";
                await _emailService.SendPasswordResetEmailAsync(user.Email, resetLink);
                return true;
            }
            catch
            {
                // Log email sending failure
                return false;
            }
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            if (string.IsNullOrEmpty(token) || string.IsNullOrEmpty(newPassword))
                return false;

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.PasswordResetToken == token && 
                                        u.PasswordResetTokenExpires > DateTime.UtcNow);

            if (user == null)
                return false;

            // Hash the new password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.Password = passwordHash;
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpires = null;

            await _context.SaveChangesAsync();
            return true;
        }
        
        private string GenerateRandomToken()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[32]; // 256 bits
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .Replace("=", "");
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
                new Claim("CreatedAt", user.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")),
                new Claim("Level", user.Level.ToString()),
                new Claim("Experience", user.Experience.ToString()),
                new Claim("EmailConfirmed", user.IsEmailConfirmed.ToString())
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