export type ExportSessionType = "PRACTICE" | "QUALIFYING" | "RACE"

export type OutputSizeKey =
  | "ig_square"
  | "story"
  | "x_landscape"
  | "hires"
  | "og"
  | "social"
  | "yt_thumb"
  | "overlay_4k"

export interface OutputSize {
  key: OutputSizeKey
  label: string
  shortLabel: string
  width: number
  height: number
  chartHeight: number
  lineThickness: number
  /** Font-size multiplier applied to all chart text in the exported image. */
  textScale: number
  description: string
  /** True for creator-tier presets that render with a transparent background. */
  transparent?: boolean
}

export interface ExportPreset {
  id: string
  name: string
  sessionType: ExportSessionType
  chartKeys: string[]
  outputSizes: OutputSizeKey[]
  createdAt: string
  updatedAt: string
  createdByUsername: string
}

export interface CreateExportPresetInput {
  name: string
  sessionType: ExportSessionType
  chartKeys: string[]
  outputSizes: OutputSizeKey[]
}

export interface UpdateExportPresetInput {
  name?: string
  sessionType?: ExportSessionType
  chartKeys?: string[]
  outputSizes?: OutputSizeKey[]
}

export interface ExportBrandingMeta {
  eventName: string
  year: number
  sessionLabel: string
  siteUrl: string
}
