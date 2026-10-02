using Domain.Enums;

namespace Application.Interfaces;

public interface ICoachingService
{
    Task<List<CoachingTip>> GenerateTipsAsync(PlanType plan, Guid sessionId, int? lapNumber = null);
    Task<CoachingChatReply> ChatAsync(PlanType plan, Guid sessionId, string message, IEnumerable<CoachingChatMessage>? history = null);
}

public enum CoachingSeverity
{
    Info = 0,
    Suggestion = 1,
    Warning = 2,
    Critical = 3
}

public class CoachingTip
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = "";
    public string Detail { get; set; } = "";
    public string Category { get; set; } = "";
    public CoachingSeverity Severity { get; set; } = CoachingSeverity.Suggestion;
    public int? LapNumber { get; set; }

    /// <summary>Reference corner index (0-based) this tip is about, when it's corner-specific.</summary>
    public int? CornerIndex { get; set; }
    /// <summary>Display name for <see cref="CornerIndex"/> — the track profile's reference corner name, or "T{n}".</summary>
    public string? CornerName { get; set; }
    /// <summary>Distance (m) along the lap the UI should jump the cursor to, when this tip is corner-specific.</summary>
    public float? DistanceM { get; set; }
}

public class CoachingChatMessage
{
    public string Role { get; set; } = "user"; // user | assistant
    public string Content { get; set; } = "";
}

public class CoachingChatReply
{
    public string Content { get; set; } = "";
    public string Provider { get; set; } = "stub";
}
