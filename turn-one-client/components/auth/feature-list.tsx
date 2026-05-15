import { Check } from "lucide-react"

const features = [
  "Save and sync custom multiviewer layouts",
  "Track your favourite drivers",
  "Full live timing with deltas",
  "Access to all free public F1 data",
  "Link F1 TV Pro for premium streams",
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
