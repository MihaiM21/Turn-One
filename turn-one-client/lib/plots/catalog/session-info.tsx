"use client"

import { CloudRain, MapPin, MonitorCog } from "lucide-react"
import {
  fetchSessionResults,
  fetchSessionWeather,
  fetchTrackMap,
} from "@/lib/dataAcquisition"
import { SessionResultsGraph } from "@/components/dashboard/telemetry generator/plots/session-results"
import { SessionWeatherGraph } from "@/components/dashboard/telemetry generator/plots/session-weather"
import { TrackMapGraph } from "@/components/dashboard/telemetry generator/plots/track-map"
import type { SessionResultsData } from "@/types/plot-types"
import type { SessionWeatherData, TrackMapData } from "@/types/plot-types-v2"
import { pickArray } from "../helpers"
import type { PlotDefinition } from "../types"

const CATEGORY = "Session Info"

export const SESSION_INFO_PLOTS: PlotDefinition[] = [
  {
    key: "session_results",
    title: "Optimal Qualifying Time",
    shortTitle: "Results",
    description: "Visualize session results and lap time deltas",
    icon: MonitorCog,
    category: CATEGORY,
    sessionTypes: ["RACE", "QUALIFYING"],
    driverRequirement: { kind: "none" },
    emptyMessage: "No session results returned for the selected session",
    fetch: async ({ token, year, eventName, sessionName }) => {
      const raw = await fetchSessionResults(token, year, eventName, sessionName, "v2")
      return pickArray<SessionResultsData>(raw)
    },
    render: (data, settings) => {
      const d = data as SessionResultsData[]
      const maxDelta = d.length ? Math.max(...d.map((x) => x.LapTimeDelta)) : 2.5
      const domain: [number, number] = [0, Math.ceil(maxDelta + 0.5)]
      return <SessionResultsGraph data={d} deltaDomain={domain} advancedSettings={settings} />
    },
    stats: (data) => {
      const d = data as SessionResultsData[]
      if (!d.length) return null
      const last = d[d.length - 1]
      return [
        { label: "Fastest Lap", value: d[0]?.LapTime || "-", sub: d[0]?.Driver || "-" },
        { label: "Largest Gap", value: last?.LapTimeDelta != null ? `+${last.LapTimeDelta.toFixed(3)}s` : "-", sub: last?.Driver || "-" },
        { label: "Avg. Gap", value: `${(d.reduce((a, c) => a + (c.LapTimeDelta || 0), 0) / d.length).toFixed(3)}s` },
        { label: "Total Drivers", value: d.length },
      ]
    },
  },
  {
    key: "session_weather",
    title: "Session Weather",
    shortTitle: "Weather",
    description: "Weather timeline, track status, and race control messages",
    icon: CloudRain,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: { kind: "none" },
    emptyMessage: "No session weather data returned for the selected session",
    fetch: async ({ year, eventName, sessionName }) =>
      (await fetchSessionWeather(year, eventName, sessionName)) as SessionWeatherData,
    render: (data, settings) => (
      <SessionWeatherGraph data={data as SessionWeatherData} advancedSettings={settings} />
    ),
    isEmpty: (data) => {
      const d = data as SessionWeatherData | null
      return !d || !d.weather || d.weather.length === 0
    },
  },
  {
    key: "track_map",
    title: "Track Map",
    shortTitle: "Track Map",
    description: "Fastest-lap telemetry with speed/gear overlay and braking zones",
    icon: MapPin,
    category: CATEGORY,
    isPro: true,
    sessionTypes: ["RACE", "QUALIFYING", "PRACTICE"],
    driverRequirement: { kind: "single" },
    options: [
      {
        id: "colorBy",
        label: "Color by",
        type: "select",
        choices: [
          { value: "speed", label: "Speed" },
          { value: "gear", label: "Gear" },
        ],
        defaultValue: "speed",
      },
    ],
    emptyMessage: "No track map data returned for the selected driver/session",
    fetch: async ({ year, eventName, sessionName, driver1, options }) =>
      (await fetchTrackMap(
        year,
        eventName,
        sessionName,
        driver1 ?? "",
        (options.colorBy as "speed" | "gear") || "speed"
      )) as TrackMapData,
    render: (data, settings) => (
      <TrackMapGraph data={data as TrackMapData} advancedSettings={settings} />
    ),
    isEmpty: (data) => {
      const d = data as TrackMapData | null
      return !d || !d.points || d.points.length === 0
    },
  },
]
