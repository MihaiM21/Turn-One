export type ExportSessionType = "PRACTICE" | "QUALIFYING" | "RACE"

export type OutputSizeKey = "ig_square" | "story" | "x_landscape" | "hires"

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
