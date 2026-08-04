"use client"

import { ChartLine, History, Radar as RadarIcon, Target } from "lucide-react"
import {
  fetchCareerDriverRadar,
  fetchFormGuide,
  fetchSeasonDriverRadar,
  fetchSessionDriverRadar,
} from "@/lib/dataAcquisition"
import { FormGuideGraph } from "@/components/dashboard/telemetry generator/plots/form-guide"
import { DriverRadarGraph } from "@/components/dashboard/telemetry generator/plots/driver-radar"
import type { DriverRadarData, FormGuideData } from "@/types/plot-types-v2"
import type { PlotDefinition, YearRangeValue } from "../types"

const CATEGORY = "Season & Career"

const isRadarEmpty = (data: unknown) => {
  const d = data as DriverRadarData | null
  return !d || !d.drivers || d.drivers.length === 0
}

export const SEASON_CAREER_PLOTS: PlotDefinition[] = [
  {
    key: "form_guide",
    title: "Season Form Guide",
    shortTitle: "Form Guide",
    description: "Rolling-average race/quali finish positions across the season",
    icon: ChartLine,
    category: CATEGORY,
    isPro: true,
    scope: "season",
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: { kind: "multi", optional: true, emptyMeansAll: true },
    options: [
      {
        id: "window",
        label: "Rolling window (races)",
        type: "number",
        defaultValue: "3",
        min: 2,
        max: 10,
      },
    ],
    emptyMessage: "No form guide data returned for the selected season",
    fetch: async ({ year, multiDrivers, options }) =>
      (await fetchFormGuide(
        year,
        Number(options.window) || 3,
        multiDrivers && multiDrivers.length > 0 ? multiDrivers : undefined
      )) as FormGuideData,
    render: (data, settings) => (
      <FormGuideGraph data={data as FormGuideData} advancedSettings={settings} />
    ),
    isEmpty: (data) => {
      const d = data as FormGuideData | null
      return !d || !d.drivers || d.drivers.length === 0
    },
  },
  {
    key: "driver_radar_season",
    title: "Season Driver Radar",
    shortTitle: "Season Radar",
    description: "Multi-dimension performance radar for a full season",
    icon: RadarIcon,
    category: CATEGORY,
    isPro: true,
    scope: "season",
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: {
      kind: "multi",
      max: 3,
      optional: true,
      emptyHint: "Leave empty to let the API pick the best 3 by race pace.",
    },
    emptyMessage: "No season driver radar data returned",
    fetch: async ({ year, multiDrivers }) =>
      (await fetchSeasonDriverRadar(
        year,
        multiDrivers && multiDrivers.length > 0 ? multiDrivers : undefined
      )) as DriverRadarData,
    render: (data, settings, ctx) => (
      <DriverRadarGraph
        data={data as DriverRadarData}
        title="Season Driver Radar"
        subtitle={ctx ? String(ctx.year) : undefined}
        advancedSettings={settings}
      />
    ),
    isEmpty: isRadarEmpty,
  },
  {
    key: "driver_radar_career",
    title: "Career Driver Radar",
    shortTitle: "Career Radar",
    description: "Multi-season career performance radar",
    icon: History,
    category: CATEGORY,
    isPro: true,
    scope: "career",
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: {
      kind: "multi",
      max: 3,
      optional: true,
      emptyHint: "Leave empty to let the API pick the best 3 by race pace.",
    },
    options: [
      {
        id: "careerYears",
        label: "Years",
        type: "year-range",
        defaultValue: { mode: "span", start: "2022", end: "2025" } satisfies YearRangeValue,
      },
    ],
    emptyMessage: "No career driver radar data returned",
    validate: ({ options }) => {
      const years = options.careerYears as YearRangeValue | undefined
      if (years?.mode === "list" && years.years.length === 0) {
        return "Select at least one year for the career radar"
      }
      return null
    },
    fetch: async ({ multiDrivers, options }) => {
      const years = (options.careerYears as YearRangeValue) ?? {
        mode: "span",
        start: "2022",
        end: "2025",
      }
      const yearsParam =
        years.mode === "span" ? `${years.start}-${years.end}` : years.years.join(",")
      return (await fetchCareerDriverRadar(
        yearsParam,
        multiDrivers && multiDrivers.length > 0 ? multiDrivers : undefined
      )) as DriverRadarData
    },
    render: (data, settings) => {
      const d = data as DriverRadarData
      return (
        <DriverRadarGraph
          data={d}
          title="Career Driver Radar"
          subtitle={d.years ? d.years.join(", ") : undefined}
          advancedSettings={settings}
        />
      )
    },
    isEmpty: isRadarEmpty,
  },
  {
    key: "driver_radar_session",
    title: "Session Driver Radar",
    shortTitle: "Session Radar",
    description: "Single-session performance radar",
    icon: Target,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: {
      kind: "multi",
      max: 3,
      optional: true,
      emptyHint: "Leave empty to let the API pick the best 3 by race pace.",
    },
    emptyMessage: "No session driver radar data returned",
    fetch: async ({ year, eventName, sessionName, multiDrivers }) =>
      (await fetchSessionDriverRadar(
        year,
        eventName,
        sessionName,
        multiDrivers && multiDrivers.length > 0 ? multiDrivers : undefined
      )) as DriverRadarData,
    render: (data, settings, ctx) => (
      <DriverRadarGraph
        data={data as DriverRadarData}
        title="Session Driver Radar"
        subtitle={ctx ? `${ctx.eventName} — ${ctx.sessionCode}` : undefined}
        advancedSettings={settings}
      />
    ),
    isEmpty: isRadarEmpty,
  },
]
