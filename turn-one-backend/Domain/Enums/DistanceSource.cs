namespace Domain.Enums;

/// <summary>Where the distance axis of a processed lap came from — affects how much to trust braking-point comparisons.</summary>
public enum DistanceSource
{
    /// <summary>Sim-reported lap distance in metres (v2 <c>lapDistM</c>).</summary>
    LapDistance = 0,
    /// <summary>ACC's 0..1 spline position scaled by a known track length.</summary>
    NormalizedPosition = 1,
    /// <summary>Integrated from speed; accurate to a few percent over a lap and rescaled to the track length when one is known.</summary>
    SpeedIntegrated = 2
}
