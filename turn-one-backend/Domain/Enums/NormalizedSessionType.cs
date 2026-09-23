namespace Domain.Enums;

/// <summary>Sim-neutral session type (protocol v2 <c>sessionType</c>). The raw sim string is kept alongside.</summary>
public enum NormalizedSessionType
{
    Other = 0,
    Practice = 1,
    Qualifying = 2,
    Race = 3,
    Hotlap = 4,
    Hotstint = 5,
    TimeAttack = 6
}
