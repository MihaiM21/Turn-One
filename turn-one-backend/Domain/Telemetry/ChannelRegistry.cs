using Domain.Enums;

namespace Domain.Telemetry;

/// <summary>Shape of a channel's signal — decides how it is aggregated, interpolated and displayed.</summary>
public enum ChannelKind
{
    /// <summary>Smooth physical quantity (speed, throttle, temperature). Averaged over a window, linearly interpolated on the distance grid.</summary>
    Continuous,
    /// <summary>Integer state (gear, sector, lap, pit status). Sample-and-hold; averaging produces nonsense.</summary>
    Discrete,
    /// <summary>Boolean-ish 0/1 (valid lap, DRS, TC active). Sample-and-hold.</summary>
    Flag,
    /// <summary>Angle in radians that wraps at ±π (heading). Sample-and-hold when aggregating; unwrap before interpolating.</summary>
    Angle
}

/// <summary>How a channel should be collapsed inside an aggregation window (Flux <c>aggregateWindow fn</c>).</summary>
public enum ChannelAggregation
{
    Mean,
    Last
}

/// <summary>
/// One telemetry channel as stored in the tick archive and in per-lap records.
/// </summary>
/// <param name="Key">Field name on the wire, in InfluxDB and in the lap container (camelCase, corner arrays flattened as <c>_fl/_fr/_rl/_rr</c>).</param>
/// <param name="MsgType">Influx <c>msgType</c> tag the field lives under: <c>tick</c> for protocol v2, <c>physics</c>/<c>graphics</c> for v1.</param>
/// <param name="Unit">Display unit, empty for dimensionless.</param>
/// <param name="Kind">Signal shape.</param>
/// <param name="MinPlan">Lowest plan allowed to read (and, for lap records, store) this channel.</param>
/// <param name="Sources">Sims known to provide it; <c>null</c> = all.</param>
public sealed record ChannelDef(
    string Key,
    string MsgType,
    string Unit,
    ChannelKind Kind,
    PlanType MinPlan,
    IReadOnlyList<SimSource>? Sources = null)
{
    public ChannelAggregation Agg => Kind == ChannelKind.Continuous ? ChannelAggregation.Mean : ChannelAggregation.Last;

    /// <summary>True for protocol-v2 channels (stored under <c>msgType == "tick"</c>).</summary>
    public bool IsV2 => MsgType == ChannelRegistry.Tick;
}

/// <summary>
/// Single source of truth for telemetry channels: what exists, what unit it has, how it aggregates,
/// which plan may read it, and how legacy (protocol v1, ACC-shaped) names map onto the sim-neutral v2 names.
/// Used by ingestion validation, InfluxDB flattening/queries, the lap container codec and the API.
/// The client mirrors the v2 key list in <c>lib/simracing/protocol.ts</c>.
/// </summary>
public static class ChannelRegistry
{
    // Influx msgType tags
    public const string Tick = "tick";
    public const string Physics = "physics";
    public const string Graphics = "graphics";

    // ---- v2 keys (sim-neutral) -------------------------------------------------------------
    public const string Lap = "lap";
    public const string LapTimeMs = "lapTimeMs";
    public const string LapDistM = "lapDistM";
    public const string Sector = "sector";
    public const string Speed = "speed";
    public const string Rpm = "rpm";
    public const string Gear = "gear";
    public const string Throttle = "throttle";
    public const string Brake = "brake";
    public const string Clutch = "clutch";
    public const string Steer = "steer";
    public const string SteerDeg = "steerDeg";
    public const string GLat = "gLat";
    public const string GLong = "gLong";
    public const string GVert = "gVert";
    public const string PosX = "posX";
    public const string PosY = "posY";
    public const string PosZ = "posZ";
    public const string Heading = "heading";
    public const string Valid = "valid";
    public const string Pit = "pit";
    public const string DriverStatus = "driverStatus";
    public const string Fuel = "fuel";
    public const string Tc = "tc";
    public const string Abs = "abs";
    public const string BrakeBias = "brakeBias";
    public const string Drs = "drs";
    public const string Ers = "ers";
    public const string ErsMode = "ersMode";
    public const string TyreCompound = "tyreCompound";
    public const string TyreAgeLaps = "tyreAgeLaps";
    public const string Frame = "frame";
    /// <summary>Derived by the lap processor (lap time at each grid point); never on the wire.</summary>
    public const string TimeMs = "timeMs";

    // v2 per-corner array bases (flattened with CornerSuffixes)
    public const string TyreTemp = "tyreTemp";
    public const string TyrePress = "tyrePress";
    public const string TyreWear = "tyreWear";
    public const string BrakeTemp = "brakeTemp";
    public const string Slip = "slip";
    public const string Surface = "surface";

    // ---- v1 keys (ACC shared-memory names, kept for legacy sessions) -----------------------
    public const string V1SpeedKmh = "speedKmh";
    public const string V1Rpms = "rpms";
    public const string V1Gas = "gas";
    public const string V1Brake = "brake";
    public const string V1Clutch = "clutch";
    public const string V1Gear = "gear";
    public const string V1SteerAngle = "steerAngle";
    public const string V1AccG_X = "accG_x";
    public const string V1AccG_Y = "accG_y";
    public const string V1AccG_Z = "accG_z";
    public const string V1Fuel = "fuel";
    public const string V1BrakeBias = "brakeBias";
    public const string V1Tc = "tc";
    public const string V1Abs = "abs";
    public const string V1Heading = "heading";
    public const string V1NormalizedCarPosition = "normalizedCarPosition";
    public const string V1DistanceTraveled = "distanceTraveled";
    public const string V1CurrentTimeMs = "iCurrentTime";
    public const string V1DeltaLapTimeMs = "iDeltaLapTime";
    public const string V1IsValidLap = "isValidLap";
    public const string V1CurrentSectorIndex = "currentSectorIndex";
    public const string V1IsInPitLane = "isInPitLane";
    public const string V1FuelPerLap = "fuelXLap";
    public const string V1SurfaceGrip = "surfaceGrip";
    public const string V1CompletedLaps = "completedLaps";

    /// <summary>Per-corner suffixes for 4-element [FL, FR, RL, RR] arrays.</summary>
    public static readonly IReadOnlyList<string> CornerSuffixes = new[] { "_fl", "_fr", "_rl", "_rr" };

    /// <summary>Per-axis suffixes for 3-element [X, Y, Z] vectors.</summary>
    public static readonly IReadOnlyList<string> AxisSuffixes = new[] { "_x", "_y", "_z" };

    /// <summary>Array fields (v1 and v2) that are flattened per corner on write.</summary>
    public static readonly IReadOnlyList<string> CornerArrayFields = new[]
    {
        // v1
        "tyreCoreTemperature", "tyreWear", "wheelSlip", "brakeTemp", "wheelsPressure",
        // v2
        TyreTemp, TyrePress, TyreWear, BrakeTemp, Slip, Surface
    };

    /// <summary>Vector fields that are flattened per axis on write (v1 only — v2 sends gLat/gLong/gVert flat).</summary>
    public static readonly IReadOnlyList<string> VectorArrayFields = new[] { "accG" };

    private static readonly SimSource[] F1Only = { SimSource.F1_25, SimSource.F1_26 };
    private static readonly SimSource[] AcFamily = { SimSource.Acc, SimSource.Ac };

    private static ChannelDef T(string key, string unit, ChannelKind kind, PlanType min = PlanType.PRO, IReadOnlyList<SimSource>? sources = null)
        => new(key, Tick, unit, kind, min, sources);

    private static IEnumerable<ChannelDef> TCorners(string field, string unit, PlanType min = PlanType.PRO, IReadOnlyList<SimSource>? sources = null)
        => CornerSuffixes.Select(s => T(field + s, unit, ChannelKind.Continuous, min, sources));

    private static ChannelDef P(string key, string unit, ChannelKind kind, PlanType min = PlanType.PRO)
        => new(key, Physics, unit, kind, min, AcFamily);

    private static ChannelDef G(string key, string unit, ChannelKind kind, PlanType min = PlanType.PRO)
        => new(key, Graphics, unit, kind, min, AcFamily);

    private static IEnumerable<ChannelDef> PCorners(string field, string unit, PlanType min = PlanType.PRO)
        => CornerSuffixes.Select(s => P(field + s, unit, ChannelKind.Continuous, min));

    /// <summary>Protocol v2 channels. BASIC gets enough for a two-lap speed/pedal overlay on a map; everything else is PRO+.</summary>
    public static readonly IReadOnlyList<ChannelDef> V2 = new List<ChannelDef>
    {
        T(Lap, "", ChannelKind.Discrete, PlanType.BASIC),
        T(LapTimeMs, "ms", ChannelKind.Discrete, PlanType.BASIC),
        T(LapDistM, "m", ChannelKind.Continuous, PlanType.BASIC),
        T(Sector, "", ChannelKind.Discrete, PlanType.BASIC),
        T(Speed, "km/h", ChannelKind.Continuous, PlanType.BASIC),
        T(Rpm, "rpm", ChannelKind.Continuous, PlanType.BASIC),
        T(Gear, "", ChannelKind.Discrete, PlanType.BASIC),
        T(Throttle, "", ChannelKind.Continuous, PlanType.BASIC),
        T(Brake, "", ChannelKind.Continuous, PlanType.BASIC),
        T(PosX, "m", ChannelKind.Continuous, PlanType.BASIC),
        T(PosY, "m", ChannelKind.Continuous, PlanType.BASIC),
        T(Heading, "rad", ChannelKind.Angle, PlanType.BASIC),
        T(Valid, "", ChannelKind.Flag, PlanType.BASIC),
        T(Pit, "", ChannelKind.Discrete, PlanType.BASIC),
        T(TimeMs, "ms", ChannelKind.Continuous, PlanType.BASIC),

        T(Clutch, "", ChannelKind.Continuous),
        T(Steer, "", ChannelKind.Continuous),
        T(SteerDeg, "°", ChannelKind.Continuous),
        T(GLat, "g", ChannelKind.Continuous),
        T(GLong, "g", ChannelKind.Continuous),
        T(GVert, "g", ChannelKind.Continuous),
        T(PosZ, "m", ChannelKind.Continuous),
        T(DriverStatus, "", ChannelKind.Discrete),
        T(Fuel, "L", ChannelKind.Continuous),
        T(Tc, "", ChannelKind.Discrete),
        T(Abs, "", ChannelKind.Discrete),
        T(BrakeBias, "%", ChannelKind.Continuous),
        T(Frame, "", ChannelKind.Discrete),

        T(Drs, "", ChannelKind.Flag, PlanType.PRO, F1Only),
        T(Ers, "J", ChannelKind.Continuous, PlanType.PRO, F1Only),
        T(ErsMode, "", ChannelKind.Discrete, PlanType.PRO, F1Only),
        T(TyreCompound, "", ChannelKind.Discrete, PlanType.PRO, F1Only),
        T(TyreAgeLaps, "laps", ChannelKind.Discrete, PlanType.PRO, F1Only),
    }
    .Concat(TCorners(TyreTemp, "°C"))
    .Concat(TCorners(TyrePress, "psi"))
    .Concat(TCorners(TyreWear, ""))
    .Concat(TCorners(BrakeTemp, "°C"))
    .Concat(TCorners(Slip, ""))
    .Concat(TCorners(Surface, "", PlanType.PRO, F1Only))
    .ToList();

    /// <summary>Protocol v1 channels (ACC shared-memory field names, physics/graphics message types).</summary>
    public static readonly IReadOnlyList<ChannelDef> V1 = new List<ChannelDef>
    {
        P(V1SpeedKmh, "km/h", ChannelKind.Continuous, PlanType.BASIC),
        P(V1Rpms, "rpm", ChannelKind.Continuous, PlanType.BASIC),
        // The 0..1 spline position wraps at the line, so it must be sampled, not averaged.
        G(V1NormalizedCarPosition, "", ChannelKind.Discrete, PlanType.BASIC),
        P(V1Heading, "rad", ChannelKind.Angle, PlanType.BASIC),

        P(V1Gas, "", ChannelKind.Continuous),
        P(V1Brake, "", ChannelKind.Continuous),
        P(V1Clutch, "", ChannelKind.Continuous),
        P(V1Gear, "", ChannelKind.Discrete),
        P(V1SteerAngle, "", ChannelKind.Continuous),
        P(V1AccG_X, "g", ChannelKind.Continuous),
        P(V1AccG_Y, "g", ChannelKind.Continuous),
        P(V1AccG_Z, "g", ChannelKind.Continuous),
        P(V1Fuel, "L", ChannelKind.Continuous),
        P(V1BrakeBias, "%", ChannelKind.Continuous),
        P(V1Tc, "", ChannelKind.Discrete),
        P(V1Abs, "", ChannelKind.Discrete),

        G(V1DistanceTraveled, "m", ChannelKind.Continuous),
        G(V1CurrentTimeMs, "ms", ChannelKind.Discrete),
        G(V1DeltaLapTimeMs, "ms", ChannelKind.Discrete),
        G(V1IsValidLap, "", ChannelKind.Flag),
        G(V1CurrentSectorIndex, "", ChannelKind.Discrete),
        G(V1IsInPitLane, "", ChannelKind.Flag),
        G(V1FuelPerLap, "L", ChannelKind.Continuous),
        G(V1SurfaceGrip, "", ChannelKind.Continuous),
    }
    .Concat(PCorners("tyreCoreTemperature", "°C"))
    .Concat(PCorners("tyreWear", ""))
    .Concat(PCorners("wheelSlip", ""))
    .Concat(PCorners("brakeTemp", "°C"))
    .Concat(PCorners("wheelsPressure", "psi"))
    .ToList();

    /// <summary>
    /// All channels, v2 first. Keys are unique across both lists except where the v1 and v2 names coincide
    /// (<c>gear</c>, <c>brake</c>, <c>clutch</c>, <c>fuel</c>, <c>heading</c>, <c>tc</c>, <c>abs</c>, <c>brakeBias</c>,
    /// <c>tyreWear_*</c>, <c>brakeTemp_*</c>) — those resolve to the v2 definition via <see cref="Find"/>.
    /// </summary>
    public static readonly IReadOnlyList<ChannelDef> All = V2.Concat(V1).ToList();

    private static readonly Dictionary<string, ChannelDef> ByKey = BuildIndex();

    private static Dictionary<string, ChannelDef> BuildIndex()
    {
        var dict = new Dictionary<string, ChannelDef>(StringComparer.Ordinal);
        foreach (var def in All)
            dict.TryAdd(def.Key, def); // v2 wins on collision
        return dict;
    }

    /// <summary>
    /// v1 → v2 key aliases. Legacy ticks are re-labelled through this map when read into the lap
    /// pipeline; <c>normalizedCarPosition → lapDistM</c> also needs the track length, which the caller supplies.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, string> V1ToV2 = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        [V1SpeedKmh] = Speed,
        [V1Rpms] = Rpm,
        [V1Gas] = Throttle,
        [V1SteerAngle] = Steer,
        [V1AccG_X] = GLat,
        [V1AccG_Z] = GLong,
        [V1AccG_Y] = GVert,
        [V1CurrentTimeMs] = LapTimeMs,
        [V1IsValidLap] = Valid,
        [V1CurrentSectorIndex] = Sector,
        [V1IsInPitLane] = Pit,
        [V1NormalizedCarPosition] = LapDistM,
        ["tyreCoreTemperature"] = TyreTemp,
        ["wheelsPressure"] = TyrePress,
        ["wheelSlip"] = Slip,
        // identical names need no alias: gear, brake, clutch, fuel, heading, tc, abs, brakeBias, tyreWear_*, brakeTemp_*
    };

    /// <summary>v2 key for a v1 key (corner-suffixed keys are handled), or the key itself when it is already canonical.</summary>
    public static string Canonical(string key)
    {
        if (V1ToV2.TryGetValue(key, out var v2)) return v2;
        foreach (var suffix in CornerSuffixes)
        {
            if (key.EndsWith(suffix, StringComparison.Ordinal))
            {
                var stem = key[..^suffix.Length];
                if (V1ToV2.TryGetValue(stem, out var stem2)) return stem2 + suffix;
            }
        }
        return key;
    }

    public static ChannelDef? Find(string key) => ByKey.TryGetValue(key, out var def) ? def : null;

    public static bool Exists(string key) => ByKey.ContainsKey(key);

    /// <summary>Keys readable by <paramref name="plan"/> across both protocol versions.</summary>
    public static IReadOnlyList<string> AllowedFor(PlanType plan) =>
        All.Where(d => plan >= d.MinPlan).Select(d => d.Key).Distinct(StringComparer.Ordinal).ToList();

    /// <summary>v2 keys readable by <paramref name="plan"/> — the set a processed lap record stores for that plan.</summary>
    public static IReadOnlyList<string> V2AllowedFor(PlanType plan) =>
        V2.Where(d => plan >= d.MinPlan).Select(d => d.Key).ToList();

    /// <summary>Filters <paramref name="requested"/> to known channels the plan may read; unknown keys are dropped silently.</summary>
    public static IReadOnlyList<ChannelDef> ResolveAllowed(PlanType plan, IEnumerable<string> requested) =>
        requested
            .Distinct(StringComparer.Ordinal)
            .Select(Find)
            .Where(d => d != null && plan >= d!.MinPlan)
            .Select(d => d!)
            .ToList();

    public static int SampleWindowSeconds(PlanType plan) => plan switch
    {
        PlanType.BASIC => 2,
        PlanType.PRO => 1,
        PlanType.ELITE => 1,
        _ => 2
    };

    /// <summary>
    /// Aggregation window in milliseconds for time-series reads of the raw archive. A 1 s window is
    /// ~55 m of track at 200 km/h — far too coarse for a delta trace — so bounded (single-lap) queries
    /// get a much finer window. Processed lap records don't use this: they sit on a fixed distance grid.
    /// </summary>
    public static int SampleWindowMs(PlanType plan, DateTime? from, DateTime? to)
    {
        var bounded = from.HasValue && to.HasValue && (to.Value - from.Value) <= TimeSpan.FromMinutes(10);
        if (!bounded) return SampleWindowSeconds(plan) * 1000;
        return plan == PlanType.BASIC ? 250 : 100;
    }
}
