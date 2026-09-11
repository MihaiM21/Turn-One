namespace Domain.Entities;

/// <summary>
/// Server-side catalog of purchasable token packs.
///
/// The coin cost lives here, never on the request. The client used to send both
/// the token amount and the coin cost, and the controller charged whatever it was
/// told — so a caller could buy the largest pack for a single coin. The client's
/// copy of this catalog (turn-one-client/lib/constants/store_items.ts) is now
/// presentation only: icons, colours and copy. Ids must stay in sync with it.
/// </summary>
public class TokenPack
{
    public string Id { get; init; } = string.Empty;
    public int TokenAmount { get; init; }
    public int CoinCost { get; init; }

    public static readonly TokenPack Small = new()
    {
        Id = "tokens-small",
        TokenAmount = 10,
        CoinCost = 500
    };

    public static readonly TokenPack Medium = new()
    {
        Id = "tokens-medium",
        TokenAmount = 25,
        CoinCost = 1000
    };

    public static readonly TokenPack Large = new()
    {
        Id = "tokens-large",
        TokenAmount = 60,
        CoinCost = 2000
    };

    public static readonly TokenPack Mega = new()
    {
        Id = "tokens-mega",
        TokenAmount = 150,
        CoinCost = 4000
    };

    public static readonly IReadOnlyList<TokenPack> All = new[]
    {
        Small, Medium, Large, Mega
    };

    /// <summary>Returns the pack with the given id, or null when the id is unknown.</summary>
    public static TokenPack? FindById(string? id) =>
        string.IsNullOrWhiteSpace(id)
            ? null
            : All.FirstOrDefault(p => string.Equals(p.Id, id, StringComparison.OrdinalIgnoreCase));
}
