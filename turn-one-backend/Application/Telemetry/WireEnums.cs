using Domain.Enums;

namespace Application.Telemetry;

/// <summary>Wire string ↔ enum mapping for protocol-v2 <c>session_start</c> fields (<c>source</c>, <c>sessionType</c>).</summary>
public static class WireEnums
{
    public static SimSource ParseSource(string? source) => source?.Trim().ToLowerInvariant() switch
    {
        "acc" => SimSource.Acc,
        "ac" => SimSource.Ac,
        "iracing" => SimSource.IRacing,
        "f1_25" => SimSource.F1_25,
        "f1_26" => SimSource.F1_26,
        _ => SimSource.Unknown
    };

    public static string SourceName(SimSource source) => source switch
    {
        SimSource.Acc => "acc",
        SimSource.Ac => "ac",
        SimSource.IRacing => "iracing",
        SimSource.F1_25 => "f1_25",
        SimSource.F1_26 => "f1_26",
        _ => "unknown"
    };

    public static NormalizedSessionType ParseSessionType(string? sessionType) => sessionType?.Trim().ToLowerInvariant() switch
    {
        "practice" => NormalizedSessionType.Practice,
        "qualifying" => NormalizedSessionType.Qualifying,
        "race" => NormalizedSessionType.Race,
        "hotlap" => NormalizedSessionType.Hotlap,
        "hotstint" => NormalizedSessionType.Hotstint,
        "timeattack" => NormalizedSessionType.TimeAttack,
        _ => NormalizedSessionType.Other
    };

    public static string SessionTypeName(NormalizedSessionType type) => type switch
    {
        NormalizedSessionType.Practice => "practice",
        NormalizedSessionType.Qualifying => "qualifying",
        NormalizedSessionType.Race => "race",
        NormalizedSessionType.Hotlap => "hotlap",
        NormalizedSessionType.Hotstint => "hotstint",
        NormalizedSessionType.TimeAttack => "timeattack",
        _ => "other"
    };
}
