import type { OutputSize, OutputSizeKey } from "@/types/export-types"

export const FOOTER_HEIGHT = 100

// Corner-branded sizes (small watermark, no reserved bar) use near-full height,
// leaving a small margin so the watermark never sits over the last data point.
const CORNER_MARGIN = 40

export const OUTPUT_SIZES: Record<OutputSizeKey, OutputSize> = {
  ig_square: {
    key: "ig_square",
    label: "Instagram Square",
    shortLabel: "IG 1:1",
    width: 1080,
    height: 1080,
    chartHeight: 880,
    lineThickness: 3,
    textScale: 1.7,
    description: "1080×1080 — Instagram feed post",
  },
  story: {
    key: "story",
    label: "Story / Reel",
    shortLabel: "Story 9:16",
    width: 1080,
    height: 1920,
    chartHeight: 1500,
    lineThickness: 3,
    textScale: 1.7,
    description: "1080×1920 — Instagram / TikTok story",
  },
  x_landscape: {
    key: "x_landscape",
    label: "X / Twitter Landscape",
    shortLabel: "X 16:9",
    width: 1600,
    height: 900,
    chartHeight: 720,
    lineThickness: 3,
    textScale: 2.0,
    description: "1600×900 — Twitter/X in-feed",
  },
  hires: {
    key: "hires",
    label: "High-Res Original",
    shortLabel: "HD 16:9",
    width: 2400,
    height: 1350,
    chartHeight: 1170,
    lineThickness: 4,
    textScale: 2.4,
    description: "2400×1350 — press-quality original",
  },
  og: {
    key: "og",
    label: "Open Graph Card",
    shortLabel: "OG 1200×630",
    width: 1200,
    height: 630,
    chartHeight: 630 - FOOTER_HEIGHT,
    lineThickness: 3,
    textScale: 1.6,
    description: "1200×630 — social unfurl card",
  },
  social: {
    key: "social",
    label: "Social Share",
    shortLabel: "Social 1200×675",
    width: 1200,
    height: 675,
    chartHeight: 675 - CORNER_MARGIN,
    lineThickness: 3,
    textScale: 1.6,
    description: "1200×675 — share-controls download, corner watermark",
  },
  yt_thumb: {
    key: "yt_thumb",
    label: "YouTube Thumbnail",
    shortLabel: "YT 1280×720",
    width: 1280,
    height: 720,
    chartHeight: 720 - FOOTER_HEIGHT,
    lineThickness: 3,
    textScale: 1.8,
    description: "1280×720 — YouTube thumbnail",
  },
  overlay_4k: {
    key: "overlay_4k",
    label: "Video Overlay 4K",
    shortLabel: "4K Transparent",
    width: 3840,
    height: 2160,
    chartHeight: 2160,
    lineThickness: 5,
    textScale: 3.2,
    description: "3840×2160 — transparent, for video compositing",
    transparent: true,
  },
}

export const OUTPUT_SIZE_ORDER: OutputSizeKey[] = [
  "ig_square",
  "story",
  "x_landscape",
  "hires",
]

/** Sizes used by the user-facing share controls (not the admin exporter's set above). */
export const SHARE_SIZES: OutputSizeKey[] = ["social"]

/** Creator-tier export preset menu, in display order. */
export const CREATOR_SIZES: OutputSizeKey[] = ["social", "yt_thumb", "overlay_4k"]
