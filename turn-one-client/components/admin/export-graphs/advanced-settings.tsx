"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

export interface ExportAdvancedSettings {
  showGrid: boolean
  showLegend: boolean
  animateChart: boolean
  showDataLabels: boolean
  /** Overrides the per-size default chart height when > 0. */
  chartHeightOverride: number
  lineThickness: number
}

export const DEFAULT_EXPORT_SETTINGS: ExportAdvancedSettings = {
  showGrid: true,
  showLegend: true,
  animateChart: false,
  showDataLabels: true,
  chartHeightOverride: 0,
  lineThickness: 0,
}

interface AdvancedSettingsProps {
  value: ExportAdvancedSettings
  onChange: (next: ExportAdvancedSettings) => void
}

export function AdvancedSettings({ value, onChange }: AdvancedSettingsProps) {
  const set = <K extends keyof ExportAdvancedSettings>(k: K, v: ExportAdvancedSettings[K]) =>
    onChange({ ...value, [k]: v })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ToggleRow label="Show grid" checked={value.showGrid} onChange={(v) => set("showGrid", v)} />
      <ToggleRow label="Show legend" checked={value.showLegend} onChange={(v) => set("showLegend", v)} />
      <ToggleRow label="Animate chart" checked={value.animateChart} onChange={(v) => set("animateChart", v)} />
      <ToggleRow label="Data labels" checked={value.showDataLabels} onChange={(v) => set("showDataLabels", v)} />
      <div className="space-y-1">
        <Label className="text-xs">Chart height override (px, 0 = auto)</Label>
        <Input
          type="number"
          min={0}
          value={value.chartHeightOverride}
          onChange={(e) => set("chartHeightOverride", Number(e.target.value) || 0)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Line thickness override (0 = auto)</Label>
        <Input
          type="number"
          min={0}
          max={10}
          value={value.lineThickness}
          onChange={(e) => set("lineThickness", Number(e.target.value) || 0)}
        />
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between border border-zinc-800 bg-zinc-950 px-3 py-2 rounded-md">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
