import { SessionDashboardData } from "@/types/news-types";
import { fetchFromExternalAPI } from "@/lib/data-fetcher";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apidev.t1f1.com";

export async function getLatestSessionData(): Promise<SessionDashboardData> {
  return fetchFromExternalAPI(`v1/dashboard`);
}

export async function getLatestSessionDataClient(): Promise<SessionDashboardData> {
  return fetchFromExternalAPI(`v1/dashboard`);
}
