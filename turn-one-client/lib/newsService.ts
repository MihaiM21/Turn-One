import { SessionDashboardData } from "@/types/news-types";

const NEWS_LATEST_SESSION_ENDPOINT = "/api/news/latest-session";

async function fetchLatestSessionFromInternalApi(): Promise<SessionDashboardData> {
  const response = await fetch(NEWS_LATEST_SESSION_ENDPOINT, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Failed to fetch latest session data (${response.status})`;
    try {
      const errorData = (await response.json()) as { error?: string };
      message = errorData.error || message;
    } catch {
      // Keep fallback message when body is not JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as SessionDashboardData;
}

export async function getLatestSessionData(): Promise<SessionDashboardData> {
  return fetchLatestSessionFromInternalApi();
}

export async function getLatestSessionDataClient(): Promise<SessionDashboardData> {
  return fetchLatestSessionFromInternalApi();
}
