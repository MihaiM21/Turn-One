import type { PlotDefinition, PlotFetchContext } from "./types"

function driversForConfig(def: PlotDefinition, ctx: PlotFetchContext): string | undefined {
  const req = def.driverRequirement
  let list: string[] = []
  if (req.kind === "single") list = ctx.driver1 ? [ctx.driver1] : []
  else if (req.kind === "single-optional") list = ctx.driver1 ? [ctx.driver1] : []
  else if (req.kind === "pair") list = [ctx.driver1, ctx.driver2].filter((d): d is string => Boolean(d))
  else if (req.kind === "multi") list = ctx.multiDrivers ?? []
  return list.length > 0 ? list.join(", ") : undefined
}

export function buildPlotTitle(def: PlotDefinition, ctx: PlotFetchContext): string {
  const drivers = driversForConfig(def, ctx)
  return drivers ? `${drivers} — ${def.title}` : def.title
}

export function buildPlotSummary(def: PlotDefinition, ctx: PlotFetchContext): string {
  return `${ctx.eventName} ${ctx.year} · ${ctx.sessionName}. Generated on TurnOne.`
}

export function buildGeneratorPrefillUrl(plotKey: string): string {
  return `/generator?plot=${encodeURIComponent(plotKey)}`
}
