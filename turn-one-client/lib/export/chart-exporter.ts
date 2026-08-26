import { toPng } from "html-to-image"
import type { ExportBrandingMeta, OutputSize } from "@/types/export-types"
import { FOOTER_HEIGHT } from "./output-sizes"

const LOGO_SRC = "/logo.png"
let cachedLogo: HTMLImageElement | null = null

async function loadLogo(): Promise<HTMLImageElement | null> {
  if (cachedLogo) return cachedLogo
  try {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = LOGO_SRC
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("logo load failed"))
    })
    cachedLogo = img
    return img
  } catch {
    return null
  }
}

/** "footer" = full-width branded bar (today's behaviour). "corner" = small
 *  bottom-right watermark that never sits over data. "none" = unbranded. */
export type BrandingMode = "footer" | "corner" | "none"

interface ExportArgs {
  node: HTMLElement
  size: OutputSize
  branding: BrandingMode
  chartTitle: string
  /** Chart/session context, required for "footer" branding, ignored otherwise. */
  brandingMeta?: ExportBrandingMeta
  /** Renders on a transparent background instead of a solid fill. Needed for the 4K overlay export. */
  transparent?: boolean
}

export async function exportChartAsBlob({
  node,
  size,
  branding,
  chartTitle,
  brandingMeta,
  transparent = false,
}: ExportArgs): Promise<Blob> {
  // Wait one frame so Recharts ResponsiveContainer can settle to the new size.
  await new Promise<void>((r) => requestAnimationFrame(() => r()))
  await new Promise<void>((r) => setTimeout(r, 50))

  const bgColor = transparent ? undefined : "#09090b"
  const chartAreaHeight = branding === "footer" ? size.height - FOOTER_HEIGHT : size.height

  const chartPng = await toPng(node, {
    width: size.width,
    height: chartAreaHeight,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor: bgColor,
  })

  const chartImg = await loadDataUrl(chartPng)

  const canvas = document.createElement("canvas")
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext("2d")!

  if (!transparent) {
    ctx.fillStyle = "#09090b"
    ctx.fillRect(0, 0, size.width, size.height)
  }
  ctx.drawImage(chartImg, 0, 0, size.width, chartAreaHeight)

  if (branding === "footer") {
    await drawBrandedFooter(ctx, size, brandingMeta, chartTitle)
  } else if (branding === "corner") {
    drawCornerWatermark(ctx, size)
  }

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
  )
}

async function drawBrandedFooter(
  ctx: CanvasRenderingContext2D,
  size: OutputSize,
  branding: ExportBrandingMeta | undefined,
  chartTitle: string
) {
  const logo = await loadLogo()
  const footerTop = size.height - FOOTER_HEIGHT

  ctx.fillStyle = "#0a0a0a"
  ctx.fillRect(0, footerTop, size.width, FOOTER_HEIGHT)
  ctx.fillStyle = "#e11d48"
  ctx.fillRect(0, footerTop, size.width, 3)

  const logoSize = FOOTER_HEIGHT - 36
  let cursorX = 28
  if (logo) {
    const aspect = logo.width / logo.height
    const logoH = logoSize
    const logoW = logoH * aspect
    ctx.drawImage(logo, cursorX, footerTop + (FOOTER_HEIGHT - logoH) / 2, logoW, logoH)
    cursorX += logoW + 20
  }

  ctx.fillStyle = "#ffffff"
  ctx.font = "600 26px system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
  ctx.textBaseline = "middle"
  ctx.fillText(chartTitle, cursorX, footerTop + FOOTER_HEIGHT / 2 - 12)

  if (branding) {
    ctx.fillStyle = "#a1a1aa"
    ctx.font = "400 20px system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    const subtitle = `${branding.eventName} • ${branding.year} • ${branding.sessionLabel}`
    ctx.fillText(subtitle, cursorX, footerTop + FOOTER_HEIGHT / 2 + 16)

    ctx.fillStyle = "#e11d48"
    ctx.font = "600 22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    ctx.textAlign = "right"
    const url = branding.siteUrl.replace(/^https?:\/\//, "")
    ctx.fillText(url, size.width - 28, footerTop + FOOTER_HEIGHT / 2)
    ctx.textAlign = "left"
  }
}

// Small bottom-right wordmark, inset so it never overlaps the last data point.
// A soft shadow keeps it legible over both bright and dark chart backgrounds.
function drawCornerWatermark(ctx: CanvasRenderingContext2D, size: OutputSize) {
  const fontSize = Math.max(14, Math.round(size.height * 0.02))
  const inset = fontSize

  ctx.save()
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
  ctx.textAlign = "right"
  ctx.textBaseline = "bottom"
  ctx.shadowColor = "rgba(0,0,0,0.85)"
  ctx.shadowBlur = fontSize * 0.4
  ctx.shadowOffsetY = 1
  ctx.fillStyle = "#f4f4f5"
  ctx.fillText("turnonehub.com", size.width - inset, size.height - inset)
  ctx.restore()
}

function loadDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("data url image failed"))
    img.src = dataUrl
  })
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function sanitizeFilenamePart(s: string): string {
  return s.replace(/[^a-z0-9-]+/gi, "_").replace(/^_|_$/g, "").toLowerCase()
}
