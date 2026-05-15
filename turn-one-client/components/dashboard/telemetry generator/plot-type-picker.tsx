"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type PlotType = {
  id: string
  name: string
  icon: LucideIcon
  description: string
  isPro: boolean
}

type PlotTypePickerProps = {
  plotTypes: PlotType[]
  value: string
  onChange: (id: string) => void
}

export function PlotTypePicker({ plotTypes, value, onChange }: PlotTypePickerProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const selected = plotTypes.find((t) => t.id === value) ?? plotTypes[0]
  const SelectedIcon = selected.icon

  const handleSelect = (id: string, isPro: boolean) => {
    if (isPro) return
    onChange(id)
    setMobileOpen(false)
  }

  const Tile = ({ type, active }: { type: PlotType; active: boolean }) => {
    const Icon = type.icon
    const button = (
      <button
        type="button"
        onClick={() => handleSelect(type.id, type.isPro)}
        disabled={type.isPro}
        className={[
          "relative flex flex-col items-center justify-start gap-1 p-3 rounded-md border text-center transition-all duration-200",
          "min-h-[84px]",
          active
            ? "bg-primary text-primary-foreground border-primary shadow-md"
            : "bg-muted/10 border-border/50 hover:bg-primary/15 hover:border-primary/40",
          type.isPro ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs font-medium leading-tight">{type.name}</span>
        {type.isPro && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 text-[8px] px-1 py-0 h-4 bg-primary/90 text-primary-foreground font-bold accent-glow border border-primary/50"
          >
            PRO
          </Badge>
        )}
      </button>
    )

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[220px] text-center">
          {type.isPro ? "PRO plan required" : type.description}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div data-tour="plotTypes">
      {/* Mobile trigger */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-background/50 border-border/60"
            >
              <span className="flex items-center gap-2">
                <SelectedIcon className="h-4 w-4" />
                <span className="text-sm">{selected.name}</span>
              </span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Pick a plot type</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 p-4">
              {plotTypes.map((type) => (
                <Tile key={type.id} type={type} active={type.id === value} />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid gap-2 grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {plotTypes.map((type) => (
          <Tile key={type.id} type={type} active={type.id === value} />
        ))}
      </div>
    </div>
  )
}
