export const TRADEMARK_DISCLAIMER =
  "TurnOne is an unofficial, independent project. Not associated with, endorsed by, or affiliated with Formula 1. F1, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trademarks of Formula One Licensing BV."

interface LegalDisclaimerProps {
  variant?: "full" | "minimal"
  className?: string
}

// Deliberately excluded from /overlay/* (OBS browser sources composited onto
// live streams) and /embed/*: a legal paragraph over someone's stream or
// embedded article is aggressive placement, not compliance. Both surfaces
// already carry TurnOne attribution linking back to a page that shows this.
export function LegalDisclaimer({ variant = "full", className }: LegalDisclaimerProps) {
  if (variant === "minimal") {
    return (
      <p className={`text-[10px] leading-relaxed text-muted-foreground/70 ${className ?? ""}`}>
        {TRADEMARK_DISCLAIMER}
      </p>
    )
  }

  return (
    <p className={`text-xs leading-relaxed text-muted-foreground ${className ?? ""}`}>
      {TRADEMARK_DISCLAIMER}
    </p>
  )
}
