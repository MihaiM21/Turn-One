/**
 * Latest uploads from the Turn One YouTube channel, read from the public channel
 * RSS feed (no API key). Used by the dashboard hub and the landing page.
 * Returns [] when the channel id isn't configured or the feed is unreachable,
 * so callers simply hide their section.
 */

export interface ChannelVideo {
  id: string
  title: string
  publishedAt: string
  url: string
  thumbnail: string
}

const FEED_URL = "https://www.youtube.com/feeds/videos.xml?channel_id="

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
}

/** Pulls `<entry>` blocks out of the Atom feed. Exported for tests. */
export function parseChannelFeed(xml: string, limit: number): ChannelVideo[] {
  const videos: ChannelVideo[] = []
  for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const entry = match[1]
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]
    const title = entry.match(/<title>([^<]*)<\/title>/)?.[1]
    const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1]
    if (!id || !title || !publishedAt) continue
    videos.push({
      id,
      title: decodeXml(title),
      publishedAt,
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    })
    if (videos.length >= limit) break
  }
  return videos
}

export function channelUrl(): string | null {
  const id = process.env.YOUTUBE_CHANNEL_ID
  return id ? `https://www.youtube.com/channel/${encodeURIComponent(id)}` : null
}

export async function getLatestChannelVideos(limit = 3): Promise<ChannelVideo[]> {
  const channelId = process.env.YOUTUBE_CHANNEL_ID
  if (!channelId) return []
  try {
    const res = await fetch(FEED_URL + encodeURIComponent(channelId), { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return parseChannelFeed(await res.text(), limit)
  } catch {
    return []
  }
}
