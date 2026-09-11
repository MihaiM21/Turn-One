"use client"

import { useCallback, useRef, useState, type ReactNode } from "react"
import { OffscreenRenderer } from "@/components/admin/export-graphs/offscreen-renderer"
import { exportChartAsBlob, type BrandingMode } from "@/lib/export/chart-exporter"
import { SITE_CONFIG } from "@/lib/seo"
import type { PlotDefinition, PlotFetchContext } from "@/lib/plots/types"
import type { AdvancedPlotSettings } from "@/types/plot-types"
import type { OutputSize } from "@/types/export-types"

interface CaptureJob {
  def: PlotDefinition
  data: unknown
  ctx: PlotFetchContext
  settings: AdvancedPlotSettings
  size: OutputSize
  branding: BrandingMode
  resolve: (blob: Blob) => void
  reject: (err: Error) => void
}

/**
 * Owns the off-screen capture used by the "Export PNG" share control (and the
 * creator export preset menu). Render `captureNode` anywhere in the tree —
 * it's positioned off-screen (see OffscreenRenderer) so placement doesn't
 * matter and there is never a visible flash. Only one capture runs at a
 * time; concurrent calls queue behind the current job and run in order.
 */
export function usePlotSharing() {
  const [job, setJob] = useState<CaptureJob | null>(null)
  const queueRef = useRef<CaptureJob[]>([])
  const nodeRef = useRef<HTMLDivElement>(null)

  const runNext = useCallback(() => {
    setJob(queueRef.current.shift() ?? null)
  }, [])

  const captureAt = useCallback(
    (
      def: PlotDefinition,
      data: unknown,
      ctx: PlotFetchContext,
      settings: AdvancedPlotSettings,
      size: OutputSize,
      branding: BrandingMode
    ) => {
      return new Promise<Blob>((resolve, reject) => {
        const newJob: CaptureJob = { def, data, ctx, settings, size, branding, resolve, reject }
        setJob((current) => {
          if (current) {
            queueRef.current.push(newJob)
            return current
          }
          return newJob
        })
      })
    },
    []
  )

  const captureNode: ReactNode = job ? (
    <OffscreenRenderer ref={nodeRef} width={job.size.width} height={job.size.height} transparent={job.size.transparent}>
      <CaptureRunner job={job} nodeRef={nodeRef} onDone={runNext} />
    </OffscreenRenderer>
  ) : null

  return { captureAt, captureNode }
}

function CaptureRunner({
  job,
  nodeRef,
  onDone,
}: {
  job: CaptureJob
  nodeRef: React.RefObject<HTMLDivElement | null>
  onDone: () => void
}) {
  const startedRef = useRef(false)
  if (!startedRef.current) {
    startedRef.current = true
    void (async () => {
      try {
        // Two frames + a short delay so Recharts' ResponsiveContainer settles
        // to the offscreen container's real dimensions before capture.
        await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
        await new Promise<void>((r) => setTimeout(r, 250))

        const node = nodeRef.current
        if (!node) throw new Error("capture node not mounted")

        const blob = await exportChartAsBlob({
          node,
          size: job.size,
          branding: job.branding,
          brandingMeta: {
            eventName: job.ctx.eventName,
            year: job.ctx.year,
            sessionLabel: job.ctx.sessionName,
            siteUrl: SITE_CONFIG.url,
          },
          chartTitle: job.def.title,
          transparent: job.size.transparent,
        })
        job.resolve(blob)
      } catch (err) {
        job.reject(err as Error)
      } finally {
        onDone()
      }
    })()
  }

  const exportSettings: AdvancedPlotSettings = {
    ...job.settings,
    chartHeight: job.size.chartHeight,
    animateChart: false,
    isExport: true,
    textScale: job.size.textScale,
    lineThickness: job.size.lineThickness,
  }

  return <>{job.def.render(job.data, exportSettings, job.ctx)}</>
}
