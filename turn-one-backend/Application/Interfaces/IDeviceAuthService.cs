using Domain.Entities;

namespace Application.Interfaces;

/// <summary>Device pairing and scoped device tokens for Turn One Link (HCR-006).</summary>
public interface IDeviceAuthService
{
    Task<PairingStarted> StartPairingAsync(string deviceName, string platform, string? appVersion);

    /// <summary>The open pairing behind a user code, or null if unknown / expired / already used.</summary>
    Task<DevicePairing?> FindPairingAsync(string userCode);

    Task<ApproveResult> ApproveAsync(string userCode, Guid userId);

    Task<PollResult> PollAsync(string deviceCode);

    /// <summary>Rotates the refresh token. Null when the token is unknown, expired, revoked or reused.</summary>
    Task<DeviceTokens?> RefreshAsync(string deviceToken);

    Task<List<Device>> ListAsync(Guid userId);

    Task<bool> RevokeAsync(Guid deviceId, Guid userId);
}

public sealed record PairingStarted(string DeviceCode, string UserCode, DateTime ExpiresAt, int IntervalSeconds);

public enum ApproveResult { Approved, NotFound, AlreadyApproved }

public enum PollStatus { Pending, SlowDown, Expired, Approved }

public sealed record PollResult(PollStatus Status, DeviceTokens? Tokens = null);

public sealed record DeviceTokens(Guid DeviceId, string AccessToken, DateTime AccessTokenExpiresAt, string DeviceToken);
