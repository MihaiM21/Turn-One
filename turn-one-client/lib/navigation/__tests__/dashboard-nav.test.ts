import { describe, expect, it } from "vitest";
import {
    ADMIN_NAV_GROUP,
    DASHBOARD_NAV,
    alwaysVisibleBadges,
    findActiveNav,
    isNavItemActive,
    pathMatches,
    resolveNavItems,
} from "@/lib/navigation/dashboard-nav";

const item = (title: string) => DASHBOARD_NAV.flatMap(g => g.items).find(i => i.title === title)!;

describe("pathMatches", () => {
    it.each([
        ["/live", "/live", true],
        ["/live/x", "/live", true],
        ["/live2", "/live", false],
        ["/", "/", true],
        ["/dashboard", "/", false],
    ])("%s vs %s → %s", (path, prefix, expected) => {
        expect(pathMatches(path, prefix)).toBe(expected);
    });
});

describe("isNavItemActive", () => {
    it("keeps Sessions active on a session detail page", () => {
        expect(isNavItemActive(item("Sessions"), "/simracing/sessions/abc/compare")).toBe(true);
    });

    it("marks the driver page active for any driver via match", () => {
        const [resolved] = resolveNavItems(DASHBOARD_NAV, "mihai")
            .flatMap(g => g.items)
            .filter(i => i.title === "My driver page");
        expect(resolved.url).toBe("/simracing/drivers/mihai");
        expect(isNavItemActive(resolved, "/simracing/drivers/someone-else")).toBe(true);
    });
});

describe("admin group", () => {
    it("lights only the specific admin page, not the panel too", () => {
        const [panel, beta] = ADMIN_NAV_GROUP.items;
        expect(isNavItemActive(beta, "/admin/beta")).toBe(true);
        expect(isNavItemActive(panel, "/admin/beta")).toBe(false);
        expect(isNavItemActive(panel, "/admin/trivia")).toBe(true);
    });
});

describe("resolveNavItems", () => {
    it("drops items that need a username when signed out", () => {
        const titles = resolveNavItems(DASHBOARD_NAV, null).flatMap(g => g.items).map(i => i.title);
        expect(titles).not.toContain("My driver page");
        expect(titles).toContain("Leaderboards");
    });

    it("encodes the username", () => {
        const url = resolveNavItems(DASHBOARD_NAV, "a b").flatMap(g => g.items).find(i => i.title === "My driver page")!.url;
        expect(url).toBe("/simracing/drivers/a%20b");
    });
});

describe("findActiveNav", () => {
    it("returns the group and item for the breadcrumb", () => {
        const hit = findActiveNav(DASHBOARD_NAV, "/simracing/leaderboards");
        expect(hit?.group.label).toBe("Compete");
        expect(hit?.item.title).toBe("Leaderboards");
    });

    it("returns null for routes outside the sidebar", () => {
        expect(findActiveNav(DASHBOARD_NAV, "/account")).toBeNull();
    });

    it("has no two items claiming the same route", () => {
        const urls = DASHBOARD_NAV.flatMap(g => g.items).map(i => i.url);
        expect(new Set(urls).size).toBe(urls.length);
    });
});

describe("sidebar groups (PBI-066)", () => {
    it("has four sim groups, then More", () => {
        expect(DASHBOARD_NAV.map(g => g.label)).toEqual(["Drive", "Improve", "Compete", "Turn One Link", "More"]);
        expect(DASHBOARD_NAV.find(g => g.id === "drive")!.items.map(i => i.title)).toEqual(["Home", "Live cockpit", "Sessions"]);
    });

    it("has no Overview item now that /simracing redirects to Home", () => {
        const titles = DASHBOARD_NAV.flatMap(g => g.items).map(i => i.title);
        expect(titles).not.toContain("Overview");
        expect(DASHBOARD_NAV.flatMap(g => g.items).some(i => i.url === "/simracing")).toBe(false);
    });

    it("keeps community and the F1 Archive in one closed More group", () => {
        const more = DASHBOARD_NAV.find(g => g.id === "more")!;
        expect(more.collapsible).toBe(true);
        expect(more.items.map(i => i.url)).toEqual(["/rewards", "/store", "/f1", "/generator", "/docs"]);
        expect(findActiveNav(DASHBOARD_NAV, "/rewards")?.group.label).toBe("More");
    });

    it("drops the closed-beta item once the driver is accepted", () => {
        const urls = (accepted: boolean) =>
            resolveNavItems(DASHBOARD_NAV, "mihai", { betaAccepted: accepted }).flatMap(g => g.items).map(i => i.url);
        expect(urls(false)).toContain("/simracing/beta");
        expect(urls(true)).not.toContain("/simracing/beta");
    });

    it("shows at most one plan badge per group", () => {
        for (const group of DASHBOARD_NAV) {
            expect(alwaysVisibleBadges(group).size).toBeLessThanOrEqual(1);
        }
        const compete = DASHBOARD_NAV.find(g => g.id === "compete")!;
        expect([...alwaysVisibleBadges(compete)]).toEqual(["/simracing/spectate"]);
    });
});
