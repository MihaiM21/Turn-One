import { AnalysisFragment } from "@/components/landing/ui-fragments"

/** The login panel's product slice: the real sample lap the landing uses, on a dark plate. */
export function LapPreview() {
  return (
    <div className="rounded-lg border border-border bg-card/80 p-4 backdrop-blur-sm">
      <AnalysisFragment />
      <p className="mt-3 text-[10px] text-muted-foreground">Real lap recorded with Turn One Link.</p>
    </div>
  )
}
