using Application.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Infrastructure.Services;

/// <summary>
/// HCR-006: Link shows a short user code, the signed-in user approves it on the website, Link polls
/// with its secret device code and receives a 15-minute <c>scope=link</c> access token plus a
/// rotating 180-day device token. Codes and tokens are stored as SHA-256 hashes only.
/// </summary>
public class DeviceAuthService : IDeviceAuthService
{
    public const string LinkScope = "link";

    // No 0/O, 1/I/L, vowels (avoids words) — easy to read off a screen and type.
    private const string UserCodeAlphabet = "BCDFGHJKMNPQRSTVWXZ23456789";

    private readonly TurnOneDbContext _context;
    private readonly IConfiguration _config;
    private readonly Func<DateTime> _now;

    public DeviceAuthService(TurnOneDbContext context, IConfiguration config)
        : this(context, config, () => DateTime.UtcNow) { }

    public DeviceAuthService(TurnOneDbContext context, IConfiguration config, Func<DateTime> clock)
    {
        _context = context;
        _config = config;
        _now = clock;
    }

    private TimeSpan PairingTtl => TimeSpan.FromSeconds(Setting("Devices:PairingTtlSeconds", 600));
    private TimeSpan AccessTokenLifetime => TimeSpan.FromMinutes(Setting("Devices:AccessTokenMinutes", 15));
    private TimeSpan RefreshLifetime => TimeSpan.FromDays(Setting("Devices:RefreshDays", 180));
    private int PollIntervalSeconds => Setting("Devices:PollIntervalSeconds", 5);

    private int Setting(string key, int fallback) => int.TryParse(_config[key], out var v) && v > 0 ? v : fallback;

    public async Task<PairingStarted> StartPairingAsync(string deviceName, string platform, string? appVersion)
    {
        var deviceCode = RandomToken();
        string userCode;
        do { userCode = RandomUserCode(); }
        while (await _context.DevicePairings.AnyAsync(p => p.UserCode == userCode && p.ExpiresAt > _now()));

        var pairing = new DevicePairing
        {
            Id = Guid.NewGuid(),
            DeviceCodeHash = Hash(deviceCode),
            UserCode = userCode,
            DeviceName = Trim(deviceName, 100, "Turn One Link"),
            Platform = Trim(platform, 20, "windows"),
            AppVersion = string.IsNullOrWhiteSpace(appVersion) ? null : Trim(appVersion, 40, ""),
            CreatedAt = _now(),
            ExpiresAt = _now() + PairingTtl,
        };
        _context.DevicePairings.Add(pairing);
        await _context.SaveChangesAsync();

        return new PairingStarted(deviceCode, userCode, pairing.ExpiresAt, PollIntervalSeconds);
    }

    public async Task<DevicePairing?> FindPairingAsync(string userCode)
    {
        var code = NormalizeUserCode(userCode);
        if (code == null) return null;
        return await _context.DevicePairings.FirstOrDefaultAsync(p =>
            p.UserCode == code && p.ExpiresAt > _now() && p.DeviceId == null);
    }

    public async Task<ApproveResult> ApproveAsync(string userCode, Guid userId)
    {
        var pairing = await FindPairingAsync(userCode);
        if (pairing == null) return ApproveResult.NotFound;
        if (pairing.ApprovedByUserId != null) return ApproveResult.AlreadyApproved;

        pairing.ApprovedByUserId = userId;
        pairing.ApprovedAt = _now();
        await _context.SaveChangesAsync();
        return ApproveResult.Approved;
    }

    public async Task<PollResult> PollAsync(string deviceCode)
    {
        if (string.IsNullOrWhiteSpace(deviceCode)) return new PollResult(PollStatus.Expired);
        var hash = Hash(deviceCode);
        var pairing = await _context.DevicePairings.FirstOrDefaultAsync(p => p.DeviceCodeHash == hash);
        if (pairing == null || pairing.ExpiresAt <= _now() || pairing.DeviceId != null)
            return new PollResult(PollStatus.Expired);

        var now = _now();
        var tooSoon = pairing.LastPolledAt is { } last && now - last < TimeSpan.FromSeconds(PollIntervalSeconds - 1);
        pairing.LastPolledAt = now;

        if (pairing.ApprovedByUserId is not { } userId)
        {
            await _context.SaveChangesAsync();
            return new PollResult(tooSoon ? PollStatus.SlowDown : PollStatus.Pending);
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return new PollResult(PollStatus.Expired);

        var device = new Device
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = pairing.DeviceName,
            Platform = pairing.Platform,
            AppVersion = pairing.AppVersion,
            CreatedAt = now,
            LastSeenAt = now,
        };
        _context.Devices.Add(device);
        pairing.DeviceId = device.Id;

        var (refresh, _) = AddRefreshToken(device.Id);
        await _context.SaveChangesAsync();

        return new PollResult(PollStatus.Approved, IssueTokens(user, device, refresh));
    }

    public async Task<DeviceTokens?> RefreshAsync(string deviceToken)
    {
        if (string.IsNullOrWhiteSpace(deviceToken)) return null;
        var hash = Hash(deviceToken);
        var token = await _context.DeviceRefreshTokens
            .Include(t => t.Device).ThenInclude(d => d.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (token == null) return null;

        var device = token.Device;
        if (device.RevokedAt != null) return null;

        if (token.RevokedAt != null || token.ReplacedById != null)
        {
            // A rotated token presented again means it leaked: revoke the device entirely.
            await RevokeDeviceAsync(device);
            return null;
        }
        if (token.ExpiresAt <= _now()) return null;

        var (refresh, newToken) = AddRefreshToken(device.Id);
        token.RevokedAt = _now();
        token.ReplacedById = newToken.Id;
        device.LastSeenAt = _now();
        await _context.SaveChangesAsync();

        return IssueTokens(device.User, device, refresh);
    }

    public async Task<List<Device>> ListAsync(Guid userId) =>
        await _context.Devices
            .Where(d => d.UserId == userId && d.RevokedAt == null)
            .OrderByDescending(d => d.LastSeenAt)
            .ToListAsync();

    public async Task<bool> RevokeAsync(Guid deviceId, Guid userId)
    {
        var device = await _context.Devices.FirstOrDefaultAsync(d => d.Id == deviceId && d.UserId == userId && d.RevokedAt == null);
        if (device == null) return false;
        await RevokeDeviceAsync(device);
        return true;
    }

    private async Task RevokeDeviceAsync(Device device)
    {
        device.RevokedAt ??= _now();
        var tokens = await _context.DeviceRefreshTokens.Where(t => t.DeviceId == device.Id && t.RevokedAt == null).ToListAsync();
        foreach (var t in tokens) t.RevokedAt = _now();
        await _context.SaveChangesAsync();
    }

    private (string Raw, DeviceRefreshToken Entity) AddRefreshToken(Guid deviceId)
    {
        var raw = RandomToken();
        var entity = new DeviceRefreshToken
        {
            Id = Guid.NewGuid(),
            DeviceId = deviceId,
            TokenHash = Hash(raw),
            CreatedAt = _now(),
            ExpiresAt = _now() + RefreshLifetime,
        };
        _context.DeviceRefreshTokens.Add(entity);
        return (raw, entity);
    }

    private DeviceTokens IssueTokens(User user, Device device, string refreshToken)
    {
        var jwtKey = _config["JWT:Key"] ?? throw new InvalidOperationException("JWT Key not configured");
        var expires = _now() + AccessTokenLifetime;
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new("Plan", user.Plan.ToString()),
            new("Scope", LinkScope),
            new("DeviceId", device.Id.ToString()),
        };
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            NotBefore = _now(),
            Expires = expires,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)), SecurityAlgorithms.HmacSha256Signature),
            Issuer = _config["JWT:Issuer"],
            Audience = _config["JWT:Audience"],
        };
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.WriteToken(handler.CreateToken(descriptor));
        return new DeviceTokens(device.Id, jwt, expires, refreshToken);
    }

    /// <summary>"k7qf2m9d", "K7QF-2M9D " → "K7QF-2M9D"; null when it can't be a user code.</summary>
    public static string? NormalizeUserCode(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        var chars = input.ToUpperInvariant().Where(char.IsLetterOrDigit).ToArray();
        if (chars.Length != 8) return null;
        return $"{new string(chars, 0, 4)}-{new string(chars, 4, 4)}";
    }

    private static string RandomUserCode()
    {
        var c = new char[8];
        for (int i = 0; i < c.Length; i++) c[i] = UserCodeAlphabet[RandomNumberGenerator.GetInt32(UserCodeAlphabet.Length)];
        return $"{new string(c, 0, 4)}-{new string(c, 4, 4)}";
    }

    private static string RandomToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).Replace('+', '-').Replace('/', '_').TrimEnd('=');

    private static string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private static string Trim(string value, int max, string fallback)
    {
        if (string.IsNullOrWhiteSpace(value)) return fallback;
        value = value.Trim();
        return value.Length > max ? value[..max] : value;
    }
}
