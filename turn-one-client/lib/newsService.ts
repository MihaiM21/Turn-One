import {
  SessionDashboardData,
  DriverStanding,
  ConstructorStanding,
  LapTimeDistributionPoint,
  TireStrategy,
  TyreStintEntry,
  NewsPageData,
  SessionFetchStatus,
} from "@/types/news-types";
import { fetchFromExternalAPI, ExternalApiError } from "@/lib/data-fetcher";

export async function getLatestSessionData(): Promise<SessionDashboardData> {
  return fetchFromExternalAPI(`v2/dashboard`);
}

export async function getLatestSessionDataClient(): Promise<SessionDashboardData> {
  return fetchFromExternalAPI(`v2/dashboard`);
}

// Classifies a session-fetch failure so UI can distinguish "the data pipeline
// just hasn't published this session yet" (transient, worth a friendly
// message + retry) from a genuine error (network failure, unexpected 5xx).
//
// The upstream stats API doesn't only signal this via the explicit
// "data_not_available" error code — per its docs, a plain 404 also means
// "session/data not available" (e.g. session just finished, results not
// uploaded yet), and a 503 is used for other transient upstream states.
// Only 400/429/5xx-other are treated as genuine errors.
export function classifySessionFetchError(e: unknown): SessionFetchStatus {
  if (e instanceof ExternalApiError) {
    const isNotReady =
      e.code === "data_not_available" || e.status === 404 || e.status === 503;
    if (isNotReady) {
      return { kind: "not_ready", retryAfterSeconds: e.retryAfterSeconds };
    }
  }
  return { kind: "error", message: e instanceof Error ? e.message : String(e) };
}

// -----------------------------------------------------------------
// Season standings — fetched from dedicated v2 standings endpoints.
// -----------------------------------------------------------------

const toStandingsList = (raw: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(raw)) return raw as Array<Record<string, unknown>>;
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj?.standings)) return obj.standings as Array<Record<string, unknown>>;
  if (Array.isArray(obj?.data)) return obj.data as Array<Record<string, unknown>>;
  return [];
};

export async function getSeasonStandings(): Promise<{
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
}> {
  const [rawDrivers, rawConstructors, rawStaticDrivers, rawStaticTeams] = await Promise.all([
    fetchFromExternalAPI(`v2/standings/drivers`) as Promise<unknown>,
    fetchFromExternalAPI(`v2/standings/constructors`) as Promise<unknown>,
    fetchFromExternalAPI(`static/drivers`) as Promise<unknown>,
    fetchFromExternalAPI(`static/teams`) as Promise<unknown>,
  ]);

  // Build color lookups from static endpoints
  const staticDrivers = (
    ((rawStaticDrivers as Record<string, unknown>)?.drivers ?? []) as Array<{
      code: string;
      color?: string;
    }>
  );
  const staticTeams = (
    ((rawStaticTeams as Record<string, unknown>)?.teams ?? []) as Array<{
      name: string;
      color?: string;
    }>
  );

  const driverColorByCode = new Map(staticDrivers.map((d) => [d.code, d.color]));
  const teamColorByStaticName = new Map(staticTeams.map((t) => [t.name.toLowerCase(), t.color]));

  // Build standings-team-name → first driver code, so we can resolve team colors via driver code
  // when static team names don't match standings team names (e.g. "RB F1 Team" vs "Racing Bulls")
  const firstDriverCodeByStandingsTeam = new Map<string, string>();
  for (const d of toStandingsList(rawDrivers)) {
    const team = (d.team ?? "") as string;
    const code = (d.driver_code ?? d.code) as string;
    if (team && code && !firstDriverCodeByStandingsTeam.has(team)) {
      firstDriverCodeByStandingsTeam.set(team, code);
    }
  }

  const resolveTeamColor = (teamName: string): string | undefined => {
    const lower = teamName.toLowerCase();
    if (teamColorByStaticName.has(lower)) return teamColorByStaticName.get(lower);
    for (const [key, color] of teamColorByStaticName) {
      if (lower.includes(key) || key.includes(lower)) return color;
    }
    // Fallback: look up a driver from this team and use their color
    const code = firstDriverCodeByStandingsTeam.get(teamName);
    return code ? driverColorByCode.get(code) : undefined;
  };

  const drivers: DriverStanding[] = toStandingsList(rawDrivers).map((d, i) => {
    const code = (d.driver_code ?? d.code) as string | undefined;
    const team = (d.team ?? d.constructor ?? d.team_name ?? "") as string;
    return {
      position: (d.position as number) ?? i + 1,
      driver: (d.driver_name ?? d.driver ?? d.name ?? d.full_name ?? "") as string,
      code,
      team,
      points: d.points as number | undefined,
      wins: d.wins as number | undefined,
      color: code ? (driverColorByCode.get(code) ?? resolveTeamColor(team)) : resolveTeamColor(team),
    };
  });

  const constructors: ConstructorStanding[] = toStandingsList(rawConstructors).map((c, i) => {
    const team = (c.team ?? c.name ?? c.constructor ?? c.team_name ?? "") as string;
    return {
      position: (c.position as number) ?? i + 1,
      team,
      points: c.points as number | undefined,
      wins: c.wins as number | undefined,
      color: resolveTeamColor(team),
    };
  });

  return { drivers, constructors };
}

// -----------------------------------------------------------------
// Lap-time distribution from v2/laptimes-distribution-data.
// The API requires a per-driver request; we fan out across drivers in parallel.
// Response may be a JSON array or a pandas columnar dict — both are normalized.
// -----------------------------------------------------------------

const normalizeToRows = (raw: unknown): Record<string, unknown>[] => {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
  if (Array.isArray(obj.points)) return obj.points as Record<string, unknown>[];
  // Pandas columnar: { LapNumber: { "0": 1, "1": 2 }, LapTime: { "0": 83.4 }, ... }
  const keys = Object.keys(obj);
  if (keys.length === 0) return [];
  const firstVal = obj[keys[0]];
  if (firstVal && typeof firstVal === "object" && !Array.isArray(firstVal)) {
    const indices = Object.keys(firstVal as Record<string, unknown>);
    return indices.map((i) => {
      const row: Record<string, unknown> = {};
      keys.forEach((k) => { row[k] = (obj[k] as Record<string, unknown>)[i]; });
      return row;
    });
  }
  return [];
};

export async function getLapTimeDistribution(
  year: number,
  round: number,
  session: string,
  drivers: Array<{ code: string; color?: string }>,
): Promise<LapTimeDistributionPoint[]> {
  if (drivers.length === 0) return [];

  const results = await Promise.allSettled(
    drivers.map(({ code, color }) =>
      fetchFromExternalAPI(
        `v2/laptimes-distribution-data?year=${year}&gp=${round}&session=${encodeURIComponent(session)}&driver=${encodeURIComponent(code)}`,
      ).then((raw) => {
        const rows = normalizeToRows(raw);
        return rows
          .map((row) => {
            const lap = Number(row.LapNumber ?? row.lap_number ?? row.lap_numbers ?? 0);
            const rawTime = Number(row.LapTime ?? row.lap_time ?? row.lap_times_seconds ?? 0);
            const lapTime = rawTime > 1_000_000 ? rawTime / 1_000_000_000 : rawTime;
            return {
              driver: String(row.Driver ?? row.driver ?? code),
              lap,
              lapTime,
              compound: String(row.Compound ?? row.compound ?? "UNKNOWN").toUpperCase(),
              color,
            } satisfies LapTimeDistributionPoint;
          })
          .filter((d) => d.lap > 0 && d.lapTime > 0);
      }),
    ),
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

// -----------------------------------------------------------------
// Tire strategy — not yet exposed by a public REST endpoint for anonymous users.
// Returns null so the UI can fall back to a styled placeholder behind the paywall gate.
// -----------------------------------------------------------------

export async function getTireStrategy(_year: number, _round: number): Promise<TireStrategy | null> {
  void _year;
  void _round;
  return null;
}

// -----------------------------------------------------------------
// Tyre stint data — from v2/tyre-stint-usage-data.
// Only meaningful for Race and Sprint sessions.
// -----------------------------------------------------------------

export async function getTyreStintData(
  year: number,
  round: number,
  session: string,
): Promise<TyreStintEntry[]> {
  const query = `year=${year}&gp=${round}&session=${encodeURIComponent(session)}`;
  const raw = (await fetchFromExternalAPI(`v2/tyre-stint-usage-data?${query}`)) as unknown;
  if (Array.isArray(raw)) return raw as TyreStintEntry[];
  return [];
}

// -----------------------------------------------------------------
// Aggregator — resilient to partial failures via Promise.allSettled.
// -----------------------------------------------------------------

export async function getNewsPageData(): Promise<NewsPageData> {
  const errors: NewsPageData["errors"] = {};
  let sessionStatus: SessionFetchStatus | undefined;

  // Phase 1: fetch session + standings in parallel — both needed before we can
  // build the driver list for the lap-distribution fan-out.
  const [session, standingsSettled] = await Promise.all([
    getLatestSessionDataClient().catch((e) => {
      errors.session = e instanceof Error ? e.message : String(e);
      sessionStatus = classifySessionFetchError(e);
      return null;
    }),
    getSeasonStandings().then((v) => ({ status: "fulfilled" as const, value: v })).catch((e) => ({
      status: "rejected" as const,
      reason: e,
    })),
  ]);

  const year = session?.year ?? new Date().getFullYear();
  const round = session?.round ?? 1;
  // session_name arrives as a code ("R", "Q", "S", "FP1" …) from the dashboard.
  // The v2 data endpoints expect the raw code, not the full name.
  const sessionName = session?.session_name ?? "R";

  const isRaceOrSprint =
    sessionName === "R" || sessionName === "S" ||
    session?.session_type === "race";

  const driverStandings =
    standingsSettled.status === "fulfilled" ? standingsSettled.value.drivers : null;
  const constructorStandings =
    standingsSettled.status === "fulfilled" ? standingsSettled.value.constructors : null;
  if (standingsSettled.status === "rejected") {
    errors.driverStandings = String(standingsSettled.reason);
    errors.constructorStandings = String(standingsSettled.reason);
  }

  // Build driver list: prefer session results (have race-day order + colors),
  // fall back to top-5 from standings (always have verified 3-letter codes).
  const sessionDrivers: Array<{ code: string; color?: string }> = (
    session?.qualifying_results ?? session?.race_results ?? []
  )
    .slice(0, 5)
    .map((r) => ({ code: r.Driver, color: r.Color }));

  const lapDrivers =
    sessionDrivers.length > 0
      ? sessionDrivers
      : (driverStandings ?? [])
          .slice(0, 5)
          .filter((d) => !!d.code)
          .map((d) => ({ code: d.code!, color: d.color }));

  // Phase 2: fan out to per-driver lap distribution + other data.
  const [lapDistResult, tireResult, tyreStintResult] = await Promise.allSettled([
    getLapTimeDistribution(year, round, sessionName, lapDrivers),
    getTireStrategy(year, round),
    isRaceOrSprint ? getTyreStintData(year, round, sessionName) : Promise.resolve(null),
  ]);

  const lapDistribution = lapDistResult.status === "fulfilled" ? lapDistResult.value : null;
  if (lapDistResult.status === "rejected") {
    errors.lapDistribution = String(lapDistResult.reason);
  }

  const tireStrategy = tireResult.status === "fulfilled" ? tireResult.value : null;
  if (tireResult.status === "rejected") {
    errors.tireStrategy = String(tireResult.reason);
  }

  const tyreStintData = tyreStintResult.status === "fulfilled" ? tyreStintResult.value : null;
  if (tyreStintResult.status === "rejected") {
    errors.tyreStintData = String(tyreStintResult.reason);
  }

  return {
    session,
    driverStandings,
    constructorStandings,
    lapDistribution,
    tireStrategy,
    tyreStintData,
    errors,
    sessionStatus,
  };
}
