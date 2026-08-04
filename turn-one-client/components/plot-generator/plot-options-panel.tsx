"use client"

import { Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { PlotOptionDef, YearRangeValue } from "@/lib/plots/types"

const YEAR_RANGE_YEARS = Array.from({ length: 13 }, (_, i) => String(2018 + i))

type PlotOptionsPanelProps = {
  options: PlotOptionDef[]
  values: Record<string, unknown>
  onChange: (id: string, value: unknown) => void
}

function YearRangeOption({
  opt,
  value,
  onChange,
}: {
  opt: PlotOptionDef
  value: YearRangeValue
  onChange: (value: YearRangeValue) => void
}) {
  const spanValue = value.mode === "span" ? value : { mode: "span" as const, start: "2022", end: "2025" }
  const listValue = value.mode === "list" ? value : { mode: "list" as const, years: [] }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm">{opt.label}</Label>
        <div className="flex gap-2 text-[10px] uppercase tracking-wider">
          <button
            type="button"
            onClick={() => onChange(spanValue)}
            className={value.mode === "span" ? "text-primary underline" : "text-zinc-500 hover:underline"}
          >
            Span
          </button>
          <span className="text-zinc-700">·</span>
          <button
            type="button"
            onClick={() => onChange(listValue)}
            className={value.mode === "list" ? "text-primary underline" : "text-zinc-500 hover:underline"}
          >
            List
          </button>
        </div>
      </div>
      {value.mode === "span" ? (
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div className="space-y-2">
            <Label className="text-xs">Start year</Label>
            <Select
              value={spanValue.start}
              onValueChange={(start) => onChange({ ...spanValue, start })}
            >
              <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                <SelectValue placeholder="Start" />
              </SelectTrigger>
              <SelectContent>
                {YEAR_RANGE_YEARS.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">End year</Label>
            <Select
              value={spanValue.end}
              onValueChange={(end) => onChange({ ...spanValue, end })}
            >
              <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                <SelectValue placeholder="End" />
              </SelectTrigger>
              <SelectContent>
                {YEAR_RANGE_YEARS.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {YEAR_RANGE_YEARS.map((year) => {
            const checked = listValue.years.includes(year)
            return (
              <button
                key={year}
                type="button"
                onClick={() =>
                  onChange({
                    ...listValue,
                    years: checked
                      ? listValue.years.filter((y) => y !== year)
                      : [...listValue.years, year],
                  })
                }
                className={`px-2 py-1.5 text-xs font-mono font-semibold border transition-colors ${
                  checked
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                }`}
              >
                {year}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Renders a plot's PlotOptionDefs generically; values are owned by the caller. */
export function PlotOptionsPanel({ options, values, onChange }: PlotOptionsPanelProps) {
  if (!options.length) return null

  return (
    <>
      {options.map((opt) => {
        const value = values[opt.id] ?? opt.defaultValue

        if (opt.type === "select") {
          return (
            <div key={opt.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor={`opt-${opt.id}`}>{opt.label}</Label>
                  {opt.help && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        {opt.help}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <Select value={String(value)} onValueChange={(v) => onChange(opt.id, v)}>
                  <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
                    <SelectValue placeholder={`Select ${opt.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(opt.choices ?? []).map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        }

        if (opt.type === "toggle") {
          return (
            <div
              key={opt.id}
              className="flex items-center justify-between rounded-md border border-zinc-800 px-3 py-2"
            >
              <div className="space-y-0.5">
                <Label htmlFor={`opt-${opt.id}`}>{opt.label}</Label>
                {opt.help && <p className="text-xs text-muted-foreground">{opt.help}</p>}
              </div>
              <Switch
                id={`opt-${opt.id}`}
                checked={Boolean(value)}
                onCheckedChange={(v) => onChange(opt.id, v)}
              />
            </div>
          )
        }

        if (opt.type === "number") {
          return (
            <div key={opt.id} className="space-y-2 max-w-[200px]">
              <Label htmlFor={`opt-${opt.id}`}>{opt.label}</Label>
              <Input
                id={`opt-${opt.id}`}
                type="number"
                min={opt.min}
                max={opt.max}
                value={String(value)}
                onChange={(e) => onChange(opt.id, e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
          )
        }

        // year-range
        return (
          <YearRangeOption
            key={opt.id}
            opt={opt}
            value={(value as YearRangeValue) ?? { mode: "span", start: "2022", end: "2025" }}
            onChange={(v) => onChange(opt.id, v)}
          />
        )
      })}
    </>
  )
}
