import { Check } from "lucide-react"

// Free-plan features only; keep in step with the Enthusiast plan on /pricing.
const features = [
  "Every lap recorded with Turn One Link",
  "Sessions, lap and sector times, track maps",
  "Verified leaderboards and your driver page",
  "ACC, EA SPORTS F1 25 and iRacing",
  "No credit card",
]

export function FeatureList() {
  return (
    <ul className="space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Check className="size-3" strokeWidth={3} />
          </span>
          {feature}
        </li>
      ))}
    </ul>
  )
}
