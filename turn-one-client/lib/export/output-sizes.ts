import type { OutputSize, OutputSizeKey } from "@/types/export-types"

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
}

export const OUTPUT_SIZE_ORDER: OutputSizeKey[] = [
  "ig_square",
  "story",
  "x_landscape",
  "hires",
]

export const FOOTER_HEIGHT = 100
