"use client"

import type { ReactNode } from "react"
import { ChevronDown, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export interface ChartSettingsState {
  showGrid: boolean
  showLegend: boolean
  animateChart: boolean
  showDataLabels: boolean
  chartHeight: string
  lineThickness: string
}

export const DEFAULT_CHART_SETTINGS: ChartSettingsState = {
  showGrid: true,
  showLegend: true,
  animateChart: true,
  showDataLabels: false,
  chartHeight: "700",
  lineThickness: "2",
}

type AdvancedSettingsPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ChartSettingsState
  onChange: (patch: Partial<ChartSettingsState>) => void
  /** Extra note under the appearance inputs (e.g. export auto-tuning). */
  appearanceFootnote?: string
  /** Extra content at the bottom (e.g. quick presets). */
  children?: ReactNode
  dataTour?: string
}

export function AdvancedSettingsPanel({
  open,
  onOpenChange,
  settings,
  onChange,
  appearanceFootnote,
  children,
  dataTour,
}: AdvancedSettingsPanelProps) {
  const toggles = [
    { id: "show-grid", label: "Show Grid Lines", help: "Display grid lines on the chart", key: "showGrid" as const },
    { id: "show-legend", label: "Show Legend", help: "Display chart legend", key: "showLegend" as const },
    { id: "show-labels", label: "Show Data Labels", help: "Display values on data points", key: "showDataLabels" as const },
    { id: "animate", label: "Animate Chart", help: "Enable chart animations", key: "animateChart" as const },
  ]

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      data-tour={dataTour}
      className="border border-zinc-800"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/10 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            Advanced chart settings
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 pt-2 space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Display Options</h4>
          <div className="space-y-3">
            {toggles.map((row) => (
              <div key={row.id} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={row.id}>{row.label}</Label>
                  <p className="text-xs text-muted-foreground">{row.help}</p>
                </div>
                <Switch
                  id={row.id}
                  checked={settings[row.key]}
                  onCheckedChange={(v) => onChange({ [row.key]: v })}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Appearance</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="chart-height">Chart Height (px)</Label>
              <Input
                id="chart-height"
                type="number"
                min="400"
                max="1200"
                value={settings.chartHeight}
                onChange={(e) => onChange({ chartHeight: e.target.value })}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-thickness">Line Thickness</Label>
              <Input
                id="line-thickness"
                type="number"
                min="1"
                max="5"
                value={settings.lineThickness}
                onChange={(e) => onChange({ lineThickness: e.target.value })}
                className="bg-background/50 border-border/50"
              />
            </div>
          </div>
          {appearanceFootnote && <p className="text-xs text-zinc-500">{appearanceFootnote}</p>}
        </div>

        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
