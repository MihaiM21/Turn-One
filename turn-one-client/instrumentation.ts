// Runs once when the server starts. Builds the F1 session catalog in the
// background so the first visitor (or crawler) after a deploy doesn't pay for a
// cold, rate-limited build. Deliberately not awaited: register() must finish
// before the server accepts requests, and the catalog can take minutes.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.F1_API_URL) return
  if (process.env.NEXT_PHASE === "phase-production-build") return
  const { warmCatalogs } = await import("@/lib/f1/catalog")
  const { supportedYears } = await import("@/lib/f1/session-manifest")
  void warmCatalogs(supportedYears())
}
