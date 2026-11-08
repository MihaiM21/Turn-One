import { describe, expect, it } from "vitest";
import { parseChannelFeed } from "@/lib/server/youtube-feed";

const entry = (id: string, title: string) => `
  <entry>
    <id>yt:video:${id}</id>
    <yt:videoId>${id}</yt:videoId>
    <title>${title}</title>
    <published>2026-11-01T10:00:00+00:00</published>
  </entry>`;

describe("parseChannelFeed", () => {
    it("reads id, title and date, decoding entities", () => {
        const [v] = parseChannelFeed(`<feed>${entry("abc123", "Spa &amp; the 0.2s at Pouhon")}</feed>`, 3);
        expect(v).toMatchObject({
            id: "abc123",
            title: "Spa & the 0.2s at Pouhon",
            publishedAt: "2026-11-01T10:00:00+00:00",
            url: "https://www.youtube.com/watch?v=abc123",
        });
    });

    it("stops at the limit and skips broken entries", () => {
        const xml = `<feed>${entry("a", "A")}<entry><title>no id</title></entry>${entry("b", "B")}${entry("c", "C")}</feed>`;
        expect(parseChannelFeed(xml, 2).map(v => v.id)).toEqual(["a", "b"]);
    });

    it("returns nothing for an empty feed", () => {
        expect(parseChannelFeed("<feed></feed>", 3)).toEqual([]);
    });
});
