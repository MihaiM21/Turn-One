import { describe, expect, it } from "vitest";
import { parseBetaStatus } from "@/hooks/use-beta-status";

describe("parseBetaStatus", () => {
    it.each([
        [{ status: "Accepted" }, "accepted"],
        [{ status: "PENDING" }, "pending"],
        [{ status: "declined" }, "declined"],
        [{ status: "something-new" }, "unknown"],
        [{}, "unknown"],
        [null, "none"],
    ] as const)("%j → %s", (payload, expected) => {
        expect(parseBetaStatus(payload)).toBe(expected);
    });
});
