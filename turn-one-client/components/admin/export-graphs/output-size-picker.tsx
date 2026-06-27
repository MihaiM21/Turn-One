"use client"

import { Badge } from "@/components/ui/badge"
import { OUTPUT_SIZES, OUTPUT_SIZE_ORDER } from "@/lib/export/output-sizes"
import type { OutputSizeKey } from "@/types/export-types"
import { cn } from "@/lib/utils"

interface OutputSizePickerProps {
  selected: OutputSizeKey[]
  onChange: (next: OutputSizeKey[]) => void
}

export function OutputSizePicker({ selected, onChange }: OutputSizePickerProps) {
  const toggle = (key: OutputSizeKey) => {
    const has = selected.includes(key)
    onChange(has ? selected.filter((k) => k !== key) : [...selected, key])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {OUTPUT_SIZE_ORDER.map((key) => {
        const size = OUTPUT_SIZES[key]
        const active = selected.includes(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={cn(
              "flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left transition",
              active
                ? "border-primary bg-primary/10"
                : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
            )}
          >
            <div className="flex items-center gap-2">
              <Badge variant={active ? "default" : "outline"}>{size.shortLabel}</Badge>
              <span className="text-sm font-medium">{size.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">{size.description}</span>
          </button>
        )
      })}
    </div>
  )
}
