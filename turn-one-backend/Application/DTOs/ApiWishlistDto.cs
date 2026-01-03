using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public class ApiWishlistDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
