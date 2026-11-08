namespace Application.DTOs;

// Closed-beta applications. Enum values travel as lowercase wire strings:
//   sims:     acc | ac | iracing | f1_25 | f1_26   (same names as protocol v2 `source`)
//   platform: pc | ps5 | xbox
//   input:    wheel | pad
//   status:   pending | accepted | declined

/// <summary>Body of <c>PUT api/simracing/beta/me</c>. Has no status: only an admin can change that.</summary>
public sealed class BetaApplicationRequest
{
    public List<string> Sims { get; set; } = new();
    public string Platform { get; set; } = "";
    public string Input { get; set; } = "";
    public string? Note { get; set; }
}

/// <summary>The caller's own application.</summary>
public class BetaApplicationDto
{
    public Guid Id { get; set; }
    public List<string> Sims { get; set; } = new();
    public string Platform { get; set; } = "";
    public string Input { get; set; } = "";
    public string? Note { get; set; }
    public string Status { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}

/// <summary>Admin view: the application plus who sent it (username + email only).</summary>
public sealed class AdminBetaApplicationDto : BetaApplicationDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
}

/// <summary>Admin list response: the page plus counts per status (the "accepted" count is the beta-size milestone).</summary>
public sealed class AdminBetaApplicationListDto
{
    public List<AdminBetaApplicationDto> Items { get; set; } = new();
    public int Pending { get; set; }
    public int Accepted { get; set; }
    public int Declined { get; set; }
}

/// <summary>Body of <c>PATCH api/simracing/beta/{id}/status</c>.</summary>
public sealed class BetaStatusRequest
{
    public string Status { get; set; } = "";
}
