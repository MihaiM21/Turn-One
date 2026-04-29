import { SessionDashboardData } from "@/types/news-types";
import { fetchFromExternalAPI } from "@/lib/data-fetcher";

export async function getLatestSessionData(): Promise<SessionDashboardData> {
  return fetchFromExternalAPI(`v1/dashboard`);
}

export async function getLatestSessionDataClient(): Promise<SessionDashboardData> {
  return fetchFromExternalAPI(`v1/dashboard`);
}
