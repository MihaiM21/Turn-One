"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { triggerDownload, sanitizeFilenamePart } from "@/lib/export/chart-exporter"
import { OUTPUT_SIZES, CREATOR_SIZES } from "@/lib/export/output-sizes"
import type { OutputSizeKey } from "@/types/export-types"
import { buildPlotSummary, buildPlotTitle, buildGeneratorPrefillUrl } from "@/lib/plots/plot-share"
import { SITE_CONFIG } from "@/lib/seo"
import { usePlan } from "@/hooks/use-plan"
import type { BrandingMode } from "@/lib/export/chart-exporter"
import type { PlotDefinition, PlotFetchContext } from "@/lib/plots/types"
import type { AdvancedPlotSettings } from "@/types/plot-types"
import type { OutputSize } from "@/types/export-types"

// X's brand mark — kept inline since lucide-react has no official X/Twitter icon.
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

interface ShareControlsProps {
  def: PlotDefinition
  ctx: PlotFetchContext
  settings: AdvancedPlotSettings
  captureAt: (
    def: PlotDefinition,
    data: unknown,
    ctx: PlotFetchContext,
    settings: AdvancedPlotSettings,
    size: OutputSize,
    branding: BrandingMode
  ) => Promise<Blob>
  data: unknown
}

/**
 * Export PNG / Share to X — shown only for plots flagged `shareable`.
 * There is no permanent /plot/[slug] link (removed); Share to X points at
 * the generator, prefilled with this plot type, instead of a saved result.
 * Always-visible, touch-sized buttons; nothing here is hover-gated.
 * Watermark-free export is a soft, client-side gate — the server never
 * enforces it since there's no server-rendered copy of the chart anymore.
 */
export function ShareControls({ def, ctx, settings, captureAt, data }: ShareControlsProps) {
  const [exporting, setExporting] = useState(false)
  const [presetKey, setPresetKey] = useState<OutputSizeKey>("social")
  const { watermarkFree, isCreator } = usePlan()

  const handleExportPng = async () => {
    const size = OUTPUT_SIZES[isCreator ? presetKey : "social"]

    // 3840x2160 RGBA is ~33MB uncompressed — comfortable on desktop, risks
    // OOMing a mobile Safari tab. Fall back to the next tier down rather than
    // letting the capture crash silently.
    if (size.transparent && typeof window !== "undefined" && window.innerWidth < 1024) {
      toast.warning("4K export needs a larger screen", { description: "Try this on a desktop browser." })
      return
    }

    setExporting(true)
    try {
      const branding: BrandingMode = size.transparent ? "corner" : watermarkFree ? "none" : "corner"
      const blob = await captureAt(def, data, ctx, settings, size, branding)
      triggerDownload(blob, `turnone_${sanitizeFilenamePart(def.key)}_${size.key}.png`)
    } catch {
      toast.error("Export failed", { description: "Try again in a moment." })
    } finally {
      setExporting(false)
    }
  }

  const handleShareToX = () => {
    const text = `${buildPlotTitle(def, ctx)} — ${buildPlotSummary(def, ctx)}`
    const link = `${SITE_CONFIG.url}${buildGeneratorPrefillUrl(def.key)}?utm_source=x&utm_medium=social&utm_campaign=plot-share`
    const intentUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`
    window.open(intentUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isCreator && (
        <Select value={presetKey} onValueChange={(v) => setPresetKey(v as OutputSizeKey)}>
          <SelectTrigger className="min-h-11 w-[190px] border-zinc-800 bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CREATOR_SIZES.map((key) => (
              <SelectItem key={key} value={key}>
                {OUTPUT_SIZES[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button
        variant="outline"
        size="sm"
        className="min-h-11 border-zinc-800 bg-transparent hover:bg-zinc-900"
        disabled={exporting}
        onClick={handleExportPng}
      >
        {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
        Export PNG
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="min-h-11 border-zinc-800 bg-transparent hover:bg-zinc-900"
        onClick={handleShareToX}
      >
        <XIcon className="h-4 w-4 mr-2" />
        Share to X
      </Button>
    </div>
  )
}
