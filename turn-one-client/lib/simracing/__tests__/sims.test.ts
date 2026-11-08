import { describe, expect, it } from "vitest";
import { boardSimForFilter, matchesSimFilter, simLabel, simMeta } from "@/lib/simracing/sims";
import { readInitialSimFilter } from "@/lib/simracing/sim-filter";
import { formatLastSeen, summariseDevices } from "@/components/dashboard/shell/link-status-pill";

describe("simMeta", () => {
    it.each([
        ["Acc", "ACC"],
        ["acc", "ACC"],
        ["IRacing", "iRacing"],
        ["iracing", "iRacing"],
        ["F1_25", "F1 25"],
        ["f1_26", "F1 26"],
    ])("%s → %s", (source, short) => {
        expect(simMeta(source)?.short).toBe(short);
    });

    it("marks Assetto Corsa experimental and keeps it out of the filters", () => {
        expect(simMeta("Ac")?.experimental).toBe(true);
        expect(simMeta("Ac")?.filter).toBeNull();
    });

    it("falls back to the raw value for unknown sims", () => {
        expect(simLabel("Unknown")).toBe("Unknown");
        expect(simLabel(null)).toBe("Unknown");
    });
});

describe("matchesSimFilter", () => {
    it("groups F1 25 and F1 26 under f1", () => {
        expect(matchesSimFilter("F1_25", "f1")).toBe(true);
        expect(matchesSimFilter("f1_26", "f1")).toBe(true);
        expect(matchesSimFilter("Acc", "f1")).toBe(false);
    });

    it("shows AC only under all", () => {
        expect(matchesSimFilter("Ac", "all")).toBe(true);
        expect(matchesSimFilter("Ac", "acc")).toBe(false);
    });
});

describe("boardSimForFilter", () => {
    it("keeps the current board when it fits", () => {
        expect(boardSimForFilter("f1", "f1_26")).toBe("f1_26");
        expect(boardSimForFilter("all", "iracing")).toBe("iracing");
    });

    it("switches to the filter's first sim otherwise", () => {
        expect(boardSimForFilter("f1", "acc")).toBe("f1_25");
        expect(boardSimForFilter("iracing", "acc")).toBe("iracing");
    });
});

describe("readInitialSimFilter", () => {
    it("prefers a valid ?sim= over storage", () => {
        expect(readInitialSimFilter("?sim=iracing", "acc")).toBe("iracing");
    });

    it("ignores junk in both places", () => {
        expect(readInitialSimFilter("?sim=gt7", "nope")).toBe("all");
        expect(readInitialSimFilter("", null)).toBe("all");
    });

    it("uses storage when the URL has nothing", () => {
        expect(readInitialSimFilter("", "f1")).toBe("f1");
    });
});

describe("Link status", () => {
    const now = Date.parse("2026-11-08T12:00:00Z");
    const device = (id: string, lastSeenAt: string | null) => ({
        id, name: id, platform: "windows", appVersion: null, createdAt: "2026-11-01T00:00:00Z", lastSeenAt,
    });

    it("is none without devices", () => {
        expect(summariseDevices([], now).kind).toBe("none");
    });

    it("is online when the freshest device reported in the last 5 minutes", () => {
        const s = summariseDevices([device("old", "2026-11-07T12:00:00Z"), device("rig", "2026-11-08T11:58:00Z")], now);
        expect(s).toMatchObject({ kind: "online", device: { id: "rig" } });
    });

    it("is offline otherwise", () => {
        expect(summariseDevices([device("rig", "2026-11-08T10:00:00Z")], now).kind).toBe("offline");
        expect(summariseDevices([device("rig", null)], now).kind).toBe("offline");
    });

    it("formats last seen", () => {
        expect(formatLastSeen("2026-11-08T11:40:00Z", now)).toBe("20 min ago");
        expect(formatLastSeen("2026-11-08T09:00:00Z", now)).toBe("3 h ago");
        expect(formatLastSeen(null, now)).toBe("never seen");
    });
});
