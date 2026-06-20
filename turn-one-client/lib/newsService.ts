import {
  SessionDashboardData,
  DriverStanding,
  ConstructorStanding,
  LapTimeDistributionPoint,
  TireStrategy,
  NewsPageData,
} from "@/types/news-types";
import { fetchFromExternalAPI } from "@/lib/data-fetcher";

export async function getLatestSessionData(): Promise<SessionDashboardData> {
  return fetchFromExternalAPI(`v2/dashboard`);
}

export async function getLatestSessionDataClient(): Promise<SessionDashboardData> {
  return fetchFromExternalAPI(`v2/dashboard`);
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
// Response shape is upstream-dependent; we normalize to LapTimeDistributionPoint[].
// -----------------------------------------------------------------

export async function getLapTimeDistribution(
  year: number,
  round: number,
  session: string,
): Promise<LapTimeDistributionPoint[]> {
  const query = `year=${year}&round=${round}&session=${encodeURIComponent(session)}`;
  const raw = (await fetchFromExternalAPI(`v2/laptimes-distribution-data?${query}`)) as unknown;

  if (!raw || typeof raw !== "object") return [];

  // Try a few common shapes: { data: [...] }, [...], { drivers: { CODE: [...lapTimes] } }
  if (Array.isArray(raw)) return raw as LapTimeDistributionPoint[];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as LapTimeDistributionPoint[];
  if (Array.isArray(obj.points)) return obj.points as LapTimeDistributionPoint[];
  return [];
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
// Aggregator — resilient to partial failures via Promise.allSettled.
// -----------------------------------------------------------------

export async function getNewsPageData(): Promise<NewsPageData> {
  const errors: NewsPageData["errors"] = {};

  const session = await getLatestSessionDataClient().catch((e) => {
    errors.session = e instanceof Error ? e.message : String(e);
    return null;
  });

  const year = session?.year ?? new Date().getFullYear();
  const round = session?.round ?? 1;
  const sessionName = session?.session_name ?? "Race";

  const [standingsResult, lapDistResult, tireResult] = await Promise.allSettled([
    getSeasonStandings(),
    getLapTimeDistribution(year, round, sessionName),
    getTireStrategy(year, round),
  ]);

  const driverStandings =
    standingsResult.status === "fulfilled" ? standingsResult.value.drivers : null;
  const constructorStandings =
    standingsResult.status === "fulfilled" ? standingsResult.value.constructors : null;
  if (standingsResult.status === "rejected") {
    errors.driverStandings = String(standingsResult.reason);
    errors.constructorStandings = String(standingsResult.reason);
  }

  const lapDistribution = lapDistResult.status === "fulfilled" ? lapDistResult.value : null;
  if (lapDistResult.status === "rejected") {
    errors.lapDistribution = String(lapDistResult.reason);
  }

  const tireStrategy = tireResult.status === "fulfilled" ? tireResult.value : null;
  if (tireResult.status === "rejected") {
    errors.tireStrategy = String(tireResult.reason);
  }

  return {
    session,
    driverStandings,
    constructorStandings,
    lapDistribution,
    tireStrategy,
    errors,
  };
}
