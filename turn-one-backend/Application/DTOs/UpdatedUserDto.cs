using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public class UpdatedUserDto
{
    public string username { get; set; } = string.Empty;

    public string email { get; set; } = string.Empty;

    // Make avatarUrl nullable so it's optional in requests. If omitted by the client,
    // model validation won't treat it as required (implicit required inference).
    public string? avatarUrl { get; set; }

}