import { DashboardHub } from "@/components/dashboard/hub/dashboard-hub"
import { getLatestChannelVideos } from "@/lib/server/youtube-feed"

export default async function DashboardPage() {
  // Server-side so the feed is cached (revalidate 1 h) and the channel id stays out of the bundle.
  const videos = await getLatestChannelVideos(3)
  return <DashboardHub videos={videos} />
}
