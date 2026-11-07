import { describe, expect, it } from "vitest";
import { normalizeUserCode } from "@/lib/simracing/devices";
import { safeNextPath } from "@/lib/auth-utils";

describe("normalizeUserCode", () => {
    it.each([
        ["k7qf2m9d", "K7QF-2M9D"],
        [" K7QF-2M9D ", "K7QF-2M9D"],
        ["k7qf 2m9d", "K7QF-2M9D"],
        ["K7QF", null],
        ["K7QF-2M9D-X", null],
    ])("%s → %s", (input, expected) => {
        expect(normalizeUserCode(input)).toBe(expected);
    });
});

describe("safeNextPath", () => {
    it("keeps same-site paths with their query", () => {
        expect(safeNextPath("/link?code=K7QF-2M9D")).toBe("/link?code=K7QF-2M9D");
    });

    it.each(["https://evil.example", "//evil.example", "/\\evil.example", "", null])(
        "falls back to the dashboard for %s",
        next => {
            expect(safeNextPath(next)).toBe("/dashboard");
        }
    );
});
