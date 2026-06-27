"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DriverPickersProps {
  allDrivers: string[]
  driver1: string
  driver2: string
  multiDrivers: string[]
  needSingle: boolean
  needPair: boolean
  needMulti: boolean
  onDriver1: (v: string) => void
  onDriver2: (v: string) => void
  onMultiDrivers: (v: string[]) => void
}

export function DriverPickers({
  allDrivers,
  driver1,
  driver2,
  multiDrivers,
  needSingle,
  needPair,
  needMulti,
  onDriver1,
  onDriver2,
  onMultiDrivers,
}: DriverPickersProps) {
  if (!needSingle && !needPair && !needMulti) return null

  return (
    <div className="space-y-4">
      {(needSingle || needPair) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(needSingle || needPair) && (
            <div>
              <Label className="text-xs">{needPair ? "Driver 1" : "Driver"}</Label>
              <Select value={driver1} onValueChange={onDriver1}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick driver" />
                </SelectTrigger>
                <SelectContent>
                  {allDrivers.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {needPair && (
            <div>
              <Label className="text-xs">Driver 2</Label>
              <Select value={driver2} onValueChange={onDriver2}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick driver" />
                </SelectTrigger>
                <SelectContent>
                  {allDrivers.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
      {needMulti && (
        <div>
          <Label className="text-xs">Drivers (click to toggle — empty = all)</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {allDrivers.map((d) => {
              const active = multiDrivers.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    onMultiDrivers(
                      active ? multiDrivers.filter((x) => x !== d) : [...multiDrivers, d]
                    )
                  }
                  className={cn(
                    "px-2 py-1 text-xs rounded border transition",
                    active
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-zinc-800 bg-zinc-950 text-muted-foreground hover:border-zinc-700"
                  )}
                >
                  <Badge variant={active ? "default" : "outline"} className="text-[10px]">
                    {d}
                  </Badge>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
