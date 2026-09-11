"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DriverRequirement } from "@/lib/plots/types"

/** Sentinel Select value meaning "no specific driver" for single-optional plots. */
export const ALL_DRIVERS_VALUE = "all"

type DriverSelectionPanelProps = {
  requirement: DriverRequirement
  allDrivers: string[]
  driver1: string
  driver2: string
  multiDrivers: string[]
  onDriver1Change: (driver: string) => void
  onDriver2Change: (driver: string) => void
  onMultiDriversChange: (drivers: string[]) => void
}

function DriverSelect({
  label,
  value,
  onChange,
  drivers,
  extraItem,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  drivers: string[]
  extraItem?: { value: string; label: string }
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-zinc-900/60 border-zinc-800">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {extraItem && <SelectItem value={extraItem.value}>{extraItem.label}</SelectItem>}
          {drivers.map((driver) => (
            <SelectItem key={driver} value={driver}>
              {driver}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/**
 * Renders the driver picker(s) matching a plot's DriverRequirement.
 * Selection state is owned by the caller: driver1/driver2 for single & pair
 * (driver1 === ALL_DRIVERS_VALUE for the "all" choice of single-optional),
 * multiDrivers for multi.
 */
export function DriverSelectionPanel({
  requirement,
  allDrivers,
  driver1,
  driver2,
  multiDrivers,
  onDriver1Change,
  onDriver2Change,
  onMultiDriversChange,
}: DriverSelectionPanelProps) {
  if (requirement.kind === "none") return null

  if (requirement.kind === "single" || requirement.kind === "single-optional") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DriverSelect
          label="Driver"
          value={driver1}
          onChange={onDriver1Change}
          drivers={allDrivers}
          extraItem={
            requirement.kind === "single-optional"
              ? { value: ALL_DRIVERS_VALUE, label: requirement.allLabel ?? "All drivers" }
              : undefined
          }
        />
      </div>
    )
  }

  if (requirement.kind === "pair") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DriverSelect label="Driver 1" value={driver1} onChange={onDriver1Change} drivers={allDrivers} />
        <DriverSelect label="Driver 2" value={driver2} onChange={onDriver2Change} drivers={allDrivers} />
      </div>
    )
  }

  // multi
  const { max, optional, emptyMeansAll, emptyHint } = requirement
  const hint =
    emptyHint ?? (optional ? (emptyMeansAll ? "Leave empty to include all drivers." : undefined) : undefined)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">
          Drivers ({multiDrivers.length} selected)
          {max != null && <span className="text-zinc-500 font-normal"> (max {max})</span>}
        </Label>
        <div className="flex gap-2">
          {max == null && (
            <button
              type="button"
              onClick={() => onMultiDriversChange([...allDrivers])}
              className="text-[10px] uppercase tracking-wider text-primary hover:underline"
            >
              Select all
            </button>
          )}
          <span className="text-zinc-700">·</span>
          <button
            type="button"
            onClick={() => onMultiDriversChange([])}
            className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-foreground hover:underline"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
        {allDrivers.map((driver) => {
          const checked = multiDrivers.includes(driver)
          const disabled = max != null && !checked && multiDrivers.length >= max
          return (
            <button
              key={driver}
              type="button"
              disabled={disabled}
              onClick={() =>
                onMultiDriversChange(
                  checked ? multiDrivers.filter((d) => d !== driver) : [...multiDrivers, driver]
                )
              }
              className={`px-2 py-1.5 text-xs font-mono font-semibold border transition-colors ${
                checked
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : disabled
                  ? "border-zinc-900 bg-zinc-900/30 text-zinc-700 cursor-not-allowed"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
              }`}
            >
              {driver}
            </button>
          )
        })}
      </div>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}
