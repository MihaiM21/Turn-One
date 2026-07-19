// OpenF1 (https://openf1.org) is a free public F1 data API. Its /drivers
// endpoint returns a `headshot_url` pointing at Formula 1's own media CDN,
// which serves a generic silhouette fallback if a driver has no photo — so
// callers never need to handle a broken image, only a missing map entry.
export interface OpenF1Driver {
  name_acronym: string
  headshot_url: string | null
  team_name: string
  team_colour: string
}

let cachedHeadshots: Promise<Map<string, string>> | null = null

export function fetchDriverHeadshots(): Promise<Map<string, string>> {
  if (!cachedHeadshots) {
    cachedHeadshots = fetch('https://api.openf1.org/v1/drivers?session_key=latest')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('openf1 request failed'))))
      .then((drivers: OpenF1Driver[]) => {
        const map = new Map<string, string>()
        for (const d of drivers) {
          if (d.name_acronym && d.headshot_url) map.set(d.name_acronym, d.headshot_url)
        }
        return map
      })
      .catch(() => new Map<string, string>())
  }
  return cachedHeadshots
}
