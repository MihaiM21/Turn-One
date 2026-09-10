"use client"

import { CircleGauge, Gauge, TrendingUp } from "lucide-react"
import {
  fetchSpeedDistributionData,
  fetchThrottleAverages,
  fetchTopSpeeds,
} from "@/lib/dataAcquisition"
import { TopSpeedGraph } from "@/components/dashboard/telemetry generator/plots/top-speed"
import { ThrottleAverageGraph } from "@/components/dashboard/telemetry generator/plots/throttle_average_comparison"
import { SpeedDistributionGraph } from "@/components/dashboard/telemetry generator/plots/speed-distribution"
import type {
  SpeedDistributionPoint,
  SpeedDistributionRawPoint,
  ThrottleAverageData,
  TopSpeedData,
} from "@/types/plot-types"
import { getDriverColors } from "../helpers"
import type { PlotDefinition } from "../types"

const CATEGORY = "Speed & Pace"

type SpeedDistributionResult = { drivers: string[]; points: SpeedDistributionPoint[] }

export const SPEED_PACE_PLOTS: PlotDefinition[] = [
  {
    key: "topspeeds",
    explainer: {
      whatItShows: "The highest speed each team's car reached anywhere on the lap.",
      howToRead: [
        "Each bar is one team — longer means faster.",
        "Speeds come from the car's own telemetry, sampled all the way around the lap, not just at the finish line.",
      ],
      whatToLookFor:
        "A wide spread usually means teams have chosen very different wing levels. A low-downforce car is quick in a straight line but gives that time back through the corners, so the fastest bar here is rarely the fastest car overall.",
      glossary: [
        { term: "Telemetry", definition: "Live measurements sent from the car — speed, throttle, brake, gear and more, many times a second." },
        { term: "Speed trap", definition: "A fixed point on the track where speed is measured, usually at the end of the longest straight." },
      ],
    },
    title: "Top Speeds",
    shortTitle: "Top Speed",
    description: "Compare top speeds across teams",
    icon: Gauge,
    category: CATEGORY,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: { kind: "none" },
    shareable: true,
    options: [
      {
        id: "topSpeedType",
        label: "Speed Source",
        type: "select",
        choices: [
          { value: "telemetry", label: "Track Telemetry" },
          { value: "st", label: "Speed Trap" },
        ],
        defaultValue: "telemetry",
        help: "Track Telemetry uses per-lap car telemetry. Speed Trap uses sector speed-trap readings.",
      },
    ],
    emptyMessage: "No top speed data returned for the selected session",
    fetch: async ({ token, year, eventName, sessionName, options }) => {
      const raw = await fetchTopSpeeds(
        token,
        year,
        eventName,
        sessionName,
        "v2",
        (options.topSpeedType as string) || "telemetry"
      )
      let processed: TopSpeedData[] = []
      if (
        raw &&
        typeof raw === "object" &&
        "Color" in raw &&
        "Team" in raw &&
        "Top Speed (km/h)" in raw
      ) {
        const colors = (raw as Record<string, Record<string, string>>).Color
        const teams = (raw as Record<string, Record<string, string>>).Team
        const speeds = (raw as Record<string, Record<string, number>>)["Top Speed (km/h)"]
        processed = Object.keys(teams).map((key) => ({
          team: teams[key],
          speed: speeds[key],
          color: colors[key],
        }))
      } else if (raw && typeof raw === "object") {
        processed = Object.values(
          raw as Record<string, { Team: string; "Top Speed (km/h)": number; Color: string }>
        ).map((item) => ({
          team: item.Team,
          speed: item["Top Speed (km/h)"],
          color: item.Color,
        }))
      }
      return processed
        .filter((d) => Number.isFinite(d.speed))
        .sort((a, b) => b.speed - a.speed)
    },
    render: (data, settings) => {
      const d = data as TopSpeedData[]
      const speeds = d.map((x) => x.speed)
      const domain: [number, number] = d.length
        ? [Math.floor(Math.min(...speeds) - 5), Math.ceil(Math.max(...speeds) + 5)]
        : [320, 335]
      return <TopSpeedGraph data={d} speedDomain={domain} advancedSettings={settings} />
    },
    stats: (data) => {
      const d = data as TopSpeedData[]
      if (!d.length) return null
      const first = d[0]
      const last = d[d.length - 1]
      return [
        { label: "Fastest Team", value: first?.speed ? `${first.speed} km/h` : "-", sub: first?.team || "-" },
        { label: "Slowest Team", value: last?.speed ? `${last.speed} km/h` : "-", sub: last?.team || "-" },
        { label: "Average Speed", value: `${(d.reduce((a, c) => a + c.speed, 0) / d.length).toFixed(1)} km/h` },
        { label: "Speed Delta", value: `${(first.speed - last.speed).toFixed(1)} km/h` },
      ]
    },
  },
  {
    key: "throttle_average",
    explainer: {
      whatItShows: "How much of the lap each driver spent on the throttle, averaged across the session.",
      howToRead: [
        "Higher means more time at full power.",
        "The values sit close together, so a couple of percent is a real difference rather than noise.",
      ],
      whatToLookFor:
        "Circuits with long straights push everyone high. On twistier tracks the gaps open up, and they tend to reflect how much confidence a driver has in the car's rear end on corner exit.",
      glossary: [
        { term: "Throttle", definition: "How far the accelerator is pressed, from 0% (off) to 100% (flat out)." },
      ],
    },
    title: "Throttle Average",
    shortTitle: "Throttle Avg",
    description: "Compare average throttle across drivers",
    icon: CircleGauge,
    category: CATEGORY,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: { kind: "none" },
    shareable: true,
    emptyMessage: "No throttle data returned for the selected session",
    fetch: async ({ token, year, eventName, sessionName }) => {
      const raw = await fetchThrottleAverages(token, year, eventName, sessionName, "v2")
      const dict = raw as
        | Record<string, { Driver: string; "Average Throttle (%)": number; Color: string }>
        | unknown[]
      const list = Array.isArray(dict)
        ? (dict as Array<{ Driver: string; "Average Throttle (%)": number; Color: string }>)
        : Object.values(dict)
      return list
        .map((item) => ({
          driver: item.Driver,
          throttle: item["Average Throttle (%)"],
          color: item.Color,
        }))
        .filter((d) => Number.isFinite(d.throttle))
        .sort((a, b) => b.throttle - a.throttle)
    },
    render: (data, settings) => {
      const d = data as ThrottleAverageData[]
      const throttles = d.map((x) => x.throttle)
      const domain: [number, number] = d.length
        ? [Math.floor(Math.min(...throttles) - 5), Math.ceil(Math.max(...throttles) + 5)]
        : [85, 100]
      return <ThrottleAverageGraph data={d} throttleDomain={domain} advancedSettings={settings} />
    },
    stats: (data) => {
      const d = data as ThrottleAverageData[]
      if (!d.length) return null
      const first = d[0]
      const last = d[d.length - 1]
      return [
        { label: "Highest Throttle", value: first?.throttle != null ? `${first.throttle.toFixed(1)}%` : "-", sub: first?.driver || "-" },
        { label: "Lowest Throttle", value: last?.throttle != null ? `${last.throttle.toFixed(1)}%` : "-", sub: last?.driver || "-" },
        { label: "Average Throttle", value: `${(d.reduce((a, c) => a + (c.throttle || 0), 0) / d.length).toFixed(1)}%` },
        { label: "Throttle Delta", value: first?.throttle && last?.throttle ? `${(first.throttle - last.throttle).toFixed(1)}%` : "-" },
      ]
    },
  },
  {
    key: "speed_distribution",
    explainer: {
      whatItShows: "Each selected driver's speed across a single lap, drawn as a line.",
      howToRead: [
        "Left to right is time through the lap: the peaks are straights and the dips are corners.",
        "Where one line sits above another, that driver was carrying more speed at that moment.",
        "Drag across the chart to zoom into a single corner, then press reset to zoom back out.",
      ],
      whatToLookFor:
        "Watch how sharply a line falls into a corner and how early it climbs again. Braking later and getting back on the power sooner is where most lap time is actually found — often worth more than raw top speed.",
      glossary: [
        { term: "Speed trace", definition: "A line showing how a car's speed changes over a lap." },
        { term: "Apex", definition: "The slowest point of a corner, where the car is closest to the inside edge — normally the bottom of each dip." },
      ],
    },
    domainZoomable: true,
    title: "Speed Trace",
    shortTitle: "Speed Trace",
    description: "Overlay up to 3 drivers by speed over time",
    icon: TrendingUp,
    category: CATEGORY,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: {
      kind: "multi",
      max: 3,
      optional: true,
      emptyHint: "Leave empty to use the first three drivers.",
    },
    options: [
      {
        id: "distinctColors",
        label: "Distinct Line Colors",
        type: "toggle",
        defaultValue: false,
        help: "Use easily distinguishable colors instead of team colors",
      },
    ],
    emptyMessage: "No Speed vs Time data available for selected driver(s)",
    fetch: async ({ token, year, eventName, sessionName, multiDrivers, allDrivers }) => {
      const drivers = multiDrivers && multiDrivers.length ? multiDrivers : allDrivers.slice(0, 3)
      if (!drivers.length) return { drivers: [], points: [] as SpeedDistributionPoint[] }
      const [colorMap, ...rawResponses] = await Promise.all([
        getDriverColors(),
        ...drivers.map((d) =>
          fetchSpeedDistributionData(token, year, eventName, sessionName, d, "v2").catch(() => [])
        ),
      ])
      const merged = rawResponses.flatMap((raw) =>
        Array.isArray(raw) ? raw : Object.values((raw as object) || {})
      )
      const points: SpeedDistributionPoint[] = merged
        .map((item) => {
          const row = item as SpeedDistributionRawPoint & Partial<SpeedDistributionPoint>
          const driverCode = String(row.Driver ?? row.driver ?? "")
          return {
            time: Number(row["Time (s)"] ?? row.time),
            speed: Number(row["Speed (km/h)"] ?? row.speed),
            driver: driverCode,
            color: String(row.Color ?? row.color ?? colorMap.get(driverCode) ?? "#F9FAFB"),
          }
        })
        .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.speed) && p.driver)
      return { drivers, points: points.filter((p) => drivers.includes(p.driver)) }
    },
    render: (data, settings, ctx) => {
      const d = data as SpeedDistributionResult
      return (
        <SpeedDistributionGraph
          data={d.points}
          selectedDrivers={d.drivers}
          advancedSettings={settings}
          useDistinctColors={Boolean(ctx?.options?.distinctColors)}
        />
      )
    },
    isEmpty: (data) => {
      const d = data as SpeedDistributionResult | null
      return !d?.points || d.points.length === 0
    },
    stats: (data) => {
      const d = data as SpeedDistributionResult
      return [
        { label: "Selected Drivers", value: d.drivers.length || 0 },
        { label: "Peak Speed", value: d.points.length > 0 ? `${Math.max(...d.points.map((p) => p.speed)).toFixed(1)} km/h` : "-" },
        { label: "Average Speed", value: d.points.length > 0 ? `${(d.points.reduce((a, p) => a + p.speed, 0) / d.points.length).toFixed(1)} km/h` : "-" },
        { label: "Data Points", value: d.points.length || 0 },
      ]
    },
  },
]

// Mock-data plots kept for reference — re-enable by porting them into real
// catalog entries when live data sources exist.
// {
//   key: "speed",  name: "Speed Trace (mock)", icon: TrendingUp,
//   render: <SpeedTraceGraph speedData={speedData} ... /> (from @/lib/constants/mockup-data)
// }
// {
//   key: "tire",   name: "Tire Temperature",   icon: TrendingUp,
//   render: <TireTempGraph tireTempData={tireData} ... />
// }
// {
//   key: "gforce", name: "G-Force Analysis",   icon: Zap,
//   render: <GForceGraph gForceData={gForceData} ... />
// }
