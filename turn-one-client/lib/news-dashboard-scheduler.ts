import "server-only";

import { SessionDashboardData } from "@/types/news-types";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

type SchedulerState = {
  initialized: boolean;
  cache: SessionDashboardData | null;
  cacheFetchedAt: number | null;
  activeSessionKey: string | null;
  baselineSessionKey: string | null;
  inFlight: Promise<SessionDashboardData> | null;
  startTimer: ReturnType<typeof setTimeout> | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
};

declare global {
  var __newsDashboardSchedulerState: SchedulerState | undefined;
}

const state: SchedulerState =
  globalThis.__newsDashboardSchedulerState ??
  (globalThis.__newsDashboardSchedulerState = {
    initialized: false,
    cache: null,
    cacheFetchedAt: null,
    activeSessionKey: null,
    baselineSessionKey: null,
    inFlight: null,
    startTimer: null,
    retryTimer: null,
  });

function clearTimer(timer: ReturnType<typeof setTimeout> | null) {
  if (timer) {
    clearTimeout(timer);
  }
}

function stopRetryLoop() {
  clearTimer(state.retryTimer);
  state.retryTimer = null;
  state.baselineSessionKey = null;
}

function buildSessionKey(data: SessionDashboardData): string {
  return `${data.year}-${data.round}-${data.session_type}-${data.session_name}`;
}

function parseCompletionEpochMs(data: SessionDashboardData): number | null {
  const source = data as unknown as Record<string, unknown>;

  const directCandidates = [
    source.session_completed_at,
    source.session_end_at,
    source.session_end_time,
    source.session_end,
    source.completed_at,
    source.end_time,
    source.end_at,
    source.session_date,
    source.date,
    source.timestamp,
  ];

  const nestedSession =
    source.session && typeof source.session === "object"
      ? (source.session as Record<string, unknown>)
      : null;

  const nestedCandidates = nestedSession
    ? [
        nestedSession.completed_at,
        nestedSession.end_time,
        nestedSession.end_at,
        nestedSession.date,
      ]
    : [];

  const allCandidates = [...directCandidates, ...nestedCandidates];

  for (const candidate of allCandidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate > 10_000_000_000 ? candidate : candidate * 1000;
    }

    if (typeof candidate === "string" && candidate.trim().length > 0) {
      const parsed = Date.parse(candidate);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function scheduleRetryStart(data: SessionDashboardData, fallbackStartMs: number) {
  clearTimer(state.startTimer);
  state.startTimer = null;

  const completionEpochMs = parseCompletionEpochMs(data) ?? fallbackStartMs;
  const firstRetryEpochMs = completionEpochMs + FIVE_MINUTES_MS;
  const delayMs = Math.max(0, firstRetryEpochMs - Date.now());

  state.startTimer = setTimeout(() => {
    state.startTimer = null;
    startRetryLoop();
  }, delayMs);
}

function startRetryLoop() {
  stopRetryLoop();
  state.baselineSessionKey = state.activeSessionKey;

  const runRetry = async () => {
    try {
      const latest = await refreshDashboardData();
      const latestSessionKey = buildSessionKey(latest);

      // Stop polling once a new session appears.
      if (state.baselineSessionKey && latestSessionKey !== state.baselineSessionKey) {
        stopRetryLoop();
        return;
      }
    } catch (error) {
      console.error("[News Scheduler] Background refresh failed:", error);
    }

    state.retryTimer = setTimeout(runRetry, FIVE_MINUTES_MS);
  };

  void runRetry();
}

async function fetchDashboardFromExternalApi(): Promise<SessionDashboardData> {
  const externalApiUrl = process.env.F1_API_URL;
  const externalApiKey = process.env.F1_API_KEY;

  if (!externalApiUrl || !externalApiKey) {
    throw new Error("Missing F1_API_URL or F1_API_KEY for news scheduler");
  }

  const apiUrl = `${externalApiUrl.replace(/\/$/, "")}/v1/dashboard`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "X-API-Key": externalApiKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    let errorMessage = `External API request failed with status ${response.status}`;
    try {
      const errorData = (await response.json()) as { error?: string; message?: string };
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Ignore parse failure and keep fallback message.
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as SessionDashboardData;
  return data;
}

async function refreshDashboardData(): Promise<SessionDashboardData> {
  if (state.inFlight) {
    return state.inFlight;
  }

  state.inFlight = (async () => {
    const latestData = await fetchDashboardFromExternalApi();
    const fetchedAt = Date.now();
    const previousSessionKey = state.activeSessionKey;
    const latestSessionKey = buildSessionKey(latestData);

    state.cache = latestData;
    state.cacheFetchedAt = fetchedAt;
    state.activeSessionKey = latestSessionKey;

    if (previousSessionKey !== latestSessionKey || (!state.startTimer && !state.retryTimer)) {
      scheduleRetryStart(latestData, fetchedAt);
    }

    return latestData;
  })();

  try {
    return await state.inFlight;
  } finally {
    state.inFlight = null;
  }
}

export function initializeNewsDashboardScheduler() {
  if (state.initialized) {
    return;
  }

  state.initialized = true;

  void refreshDashboardData().catch((error) => {
    console.error("[News Scheduler] Initial warmup fetch failed:", error);
  });
}

export async function getLatestNewsDashboardData(): Promise<SessionDashboardData> {
  try {
    return await refreshDashboardData();
  } catch (error) {
    if (state.cache) {
      console.error("[News Scheduler] Returning stale cache after fetch failure:", error);
      return state.cache;
    }

    throw error;
  }
}

export async function forceRefreshNewsDashboardData(): Promise<SessionDashboardData> {
  return refreshDashboardData();
}
