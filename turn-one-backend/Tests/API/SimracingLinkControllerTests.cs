using API.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Tests.API;

/// <summary>HCR-014: release channels, minimum versions, unchanged default response.</summary>
public class SimracingLinkControllerTests
{
    private static SimracingLinkController Controller(Dictionary<string, string?> settings) =>
        new(new ConfigurationBuilder().AddInMemoryCollection(settings).Build());

    private static readonly Dictionary<string, string?> Legacy = new()
    {
        ["TurnOneLink:Version"] = "1.2.0",
        ["TurnOneLink:DownloadUrl"] = "https://example.test/TurnOneLink-win-Setup.exe",
        ["TurnOneLink:Sha256"] = "abc",
        ["TurnOneLink:ReleasedAt"] = "2026-11-06",
    };

    private static T Ok<T>(ActionResult<T> result) => (T)((OkObjectResult)result.Result!).Value!;

    [Fact]
    public void Default_Request_Still_Returns_The_Flat_Stable_Release()
    {
        var dto = Ok(Controller(Legacy).GetRelease());

        dto.Available.Should().BeTrue();
        dto.Version.Should().Be("1.2.0");
        dto.DownloadUrl.Should().EndWith("Setup.exe");
        dto.Channel.Should().Be("stable");
        dto.VelopackFeedUrl.Should().Contain("Turn-One-Link");
    }

    [Fact]
    public void Beta_Channel_Uses_Its_Own_Section_Or_Falls_Back_To_Stable()
    {
        Ok(Controller(Legacy).GetRelease("beta")).Channel.Should().Be("stable");

        var withBeta = new Dictionary<string, string?>(Legacy)
        {
            ["TurnOneLink:Channels:beta:Version"] = "1.3.0",
            ["TurnOneLink:Channels:beta:DownloadUrl"] = "https://example.test/beta.exe",
        };
        var dto = Ok(Controller(withBeta).GetRelease("beta"));
        dto.Channel.Should().Be("beta");
        dto.Version.Should().Be("1.3.0");
    }

    [Theory]
    [InlineData("1.1.0", false, false)]
    [InlineData("1.2.0", true, false)]
    [InlineData("1.2.1", true, true)]
    [InlineData("v1.3.0-beta", true, true)]
    public void Compat_Applies_Minimum_Versions(string version, bool supported, bool uploads)
    {
        var settings = new Dictionary<string, string?>(Legacy)
        {
            ["TurnOneLink:MinSupportedVersion"] = "1.2.0",
            ["TurnOneLink:MinUploadVersion"] = "1.2.1",
        };
        var dto = Ok(Controller(settings).Compat(version));

        dto.Supported.Should().Be(supported);
        dto.UploadsAccepted.Should().Be(uploads);
    }

    [Fact]
    public void Compat_Accepts_Everything_When_No_Minimum_Is_Configured()
    {
        var dto = Ok(Controller(Legacy).Compat("0.0.1"));
        dto.Supported.Should().BeTrue();
        dto.UploadsAccepted.Should().BeTrue();
    }

    [Fact]
    public void Compat_Rejects_A_Malformed_Version()
    {
        Controller(Legacy).Compat("latest").Result.Should().BeOfType<BadRequestObjectResult>();
    }
}
