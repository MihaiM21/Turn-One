using System.Text.Json;
using Domain.Entities;
using FluentAssertions;

namespace Tests.Domain;

public class UserSerializationTests
{
    [Fact]
    public void Serialized_User_Never_Contains_Credential_Fields()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "driver@example.com",
            Username = "driver",
            Password = "$2a$11$hash",
            EmailConfirmationToken = "confirm-token",
            EmailConfirmationTokenExpires = DateTime.UtcNow,
            PasswordResetToken = "reset-token",
            PasswordResetTokenExpires = DateTime.UtcNow,
        };

        var json = JsonSerializer.Serialize(user, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        var keys = JsonDocument.Parse(json).RootElement.EnumerateObject().Select(p => p.Name).ToList();

        keys.Should().NotContain(new[]
        {
            "password", "emailConfirmationToken", "emailConfirmationTokenExpires",
            "passwordResetToken", "passwordResetTokenExpires",
        });
        keys.Should().Contain(new[] { "id", "email", "username", "tokens" });
        json.Should().NotContain("$2a$11$hash").And.NotContain("reset-token").And.NotContain("confirm-token");
    }
}
