export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { initializeNewsDashboardScheduler } = await import("@/lib/news-dashboard-scheduler");
  initializeNewsDashboardScheduler();
}
