import { describe, expect, it } from "vitest";
import {
    ADMIN_NAV_GROUP,
    DASHBOARD_NAV,
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
    it("lights Overview only on the /simracing index and pages without their own item", () => {
        const overview = item("Overview");
        expect(isNavItemActive(overview, "/simracing")).toBe(true);
        expect(isNavItemActive(overview, "/simracing/sessions")).toBe(false);
        expect(isNavItemActive(overview, "/simracing/sessions/abc")).toBe(false);
    });

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
