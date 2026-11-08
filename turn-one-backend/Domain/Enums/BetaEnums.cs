namespace Domain.Enums;

/// <summary>Where a beta applicant drives. EA F1 runs on consoles; ACC/iRacing/AC are PC (Link needs a PC for those).</summary>
public enum BetaPlatform
{
    Pc = 0,
    Ps5 = 1,
    Xbox = 2,
}

public enum BetaInput
{
    Wheel = 0,
    Pad = 1,
}

public enum BetaApplicationStatus
{
    Pending = 0,
    Accepted = 1,
    Declined = 2,
}
