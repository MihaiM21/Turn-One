using System.Text.Json;

namespace API.Security;

/// <summary>
/// H-17 — Cloudflare Turnstile check for sign-up and password reset. With no
/// <c>Turnstile:SecretKey</c> configured (local development) every request passes.
/// </summary>
public sealed class TurnstileVerifier
{
    private const string VerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private readonly IHttpClientFactory _http;
    private readonly IConfiguration _config;
    private readonly ILogger<TurnstileVerifier> _logger;

    public TurnstileVerifier(IHttpClientFactory http, IConfiguration config, ILogger<TurnstileVerifier> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public bool Enabled => !string.IsNullOrWhiteSpace(_config["Turnstile:SecretKey"]);

    public async Task<bool> VerifyAsync(string? token, string? remoteIp)
    {
        var secret = _config["Turnstile:SecretKey"];
        if (string.IsNullOrWhiteSpace(secret)) return true;
        if (string.IsNullOrWhiteSpace(token)) return false;

        try
        {
            var form = new Dictionary<string, string> { ["secret"] = secret, ["response"] = token };
            if (!string.IsNullOrWhiteSpace(remoteIp)) form["remoteip"] = remoteIp;

            using var client = _http.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);
            using var response = await client.PostAsync(VerifyUrl, new FormUrlEncodedContent(form));
            using var json = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
            return json.RootElement.TryGetProperty("success", out var ok) && ok.GetBoolean();
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            // Cloudflare unreachable: fail closed for these two forms (rate limits still apply), but log it.
            _logger.LogWarning(ex, "Turnstile verification unavailable");
            return false;
        }
    }
}
