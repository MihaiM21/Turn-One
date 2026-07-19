"use client"

import { useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronDown, ChevronUp, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type PlotType = {
  id: string
  name: string
  icon: LucideIcon
  description: string
  isPro: boolean
  category?: string
}

type PlotTypePickerProps = {
  plotTypes: PlotType[]
  value: string
  onChange: (id: string) => void
}

// Roughly two rows of tiles (min-h-[84px] + gap-2) before the "show all" toggle kicks in.
const COLLAPSED_MAX_HEIGHT = "184px"

function matchesQuery(type: PlotType, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return type.name.toLowerCase().includes(q) || type.description.toLowerCase().includes(q)
}

function Tile({
  type,
  active,
  onSelect,
}: {
  type: PlotType
  active: boolean
  onSelect: (id: string, isPro: boolean) => void
}) {
  const Icon = type.icon
  const button = (
    <button
      type="button"
      onClick={() => onSelect(type.id, type.isPro)}
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

function SearchBox({
  query,
  onQueryChange,
  className,
}: {
  query: string
  onQueryChange: (value: string) => void
  className?: string
}) {
  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/70" />
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search plot types..."
        className="pl-9 pr-9 h-10 bg-muted/20 border-border focus-visible:border-primary/60 focus-visible:ring-primary/30"
      />
      {query && (
        <button
          type="button"
          onClick={() => onQueryChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function PlotTypePicker({ plotTypes, value, onChange }: PlotTypePickerProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState(false)
  const selected = plotTypes.find((t) => t.id === value) ?? plotTypes[0]
  const SelectedIcon = selected.icon

  const handleSelect = (id: string, isPro: boolean) => {
    if (isPro) return
    onChange(id)
    setMobileOpen(false)
  }

  const isSearching = query.trim().length > 0
  const filteredTypes = useMemo(
    () => plotTypes.filter((t) => matchesQuery(t, query)),
    [plotTypes, query]
  )

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
            <div className="px-4 pt-2 pb-4">
              <SearchBox query={query} onQueryChange={setQuery} className="mb-3" />
              <div className="grid grid-cols-2 gap-2">
                {filteredTypes.map((type) => (
                  <Tile key={type.id} type={type} active={type.id === value} onSelect={handleSelect} />
                ))}
              </div>
              {filteredTypes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No plot type found.</p>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop picker */}
      <div className="hidden md:block">
        <SearchBox query={query} onQueryChange={setQuery} className="mb-3 max-w-sm" />
        <div className="relative">
          <div
            className="grid gap-2 grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 overflow-hidden transition-[max-height] duration-300"
            style={{ maxHeight: expanded || isSearching ? "2000px" : COLLAPSED_MAX_HEIGHT }}
          >
            {filteredTypes.map((type) => (
              <Tile key={type.id} type={type} active={type.id === value} onSelect={handleSelect} />
            ))}
          </div>
          {!expanded && !isSearching && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent" />
          )}
        </div>
        {filteredTypes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No plot type found.</p>
        )}
        {!isSearching && plotTypes.length > 0 && (
          <div className="flex justify-center mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExpanded((prev) => !prev)}
              className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show all {plotTypes.length} plot types
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
