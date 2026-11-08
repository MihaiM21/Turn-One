import { afterEach, describe, expect, it } from "vitest";
import {
    clearAuthIntent,
    currentAuthIntent,
    intentQuery,
    parseAuthIntent,
    postAuthPath,
    rememberAuthIntent,
} from "@/lib/auth-utils";

describe("auth intent", () => {
    afterEach(() => clearAuthIntent());

    it("only accepts known intents", () => {
        expect(parseAuthIntent("beta")).toBe("beta");
        expect(parseAuthIntent("toString")).toBeNull();
        expect(parseAuthIntent("admin")).toBeNull();
        expect(parseAuthIntent(null)).toBeNull();
    });

    it("sends a beta sign-up to the beta form, but an explicit next still wins", () => {
        expect(postAuthPath(null, "beta")).toBe("/simracing/beta");
        expect(postAuthPath("/link?code=K7QF-2M9D", "beta")).toBe("/link?code=K7QF-2M9D");
        expect(postAuthPath("https://evil.example", "beta")).toBe("/simracing/beta");
        expect(postAuthPath(null, null)).toBe("/dashboard");
    });

    it("carries the intent between auth pages", () => {
        expect(intentQuery("beta")).toBe("?intent=beta");
        expect(intentQuery(null)).toBe("");
    });

    it("reads the URL first, then the remembered intent", () => {
        expect(currentAuthIntent("?intent=beta")).toBe("beta");
        if (typeof window === "undefined") return; // node environment: no storage to remember in
        expect(currentAuthIntent("")).toBeNull();
        rememberAuthIntent("beta");
        expect(currentAuthIntent("")).toBe("beta");
        clearAuthIntent();
        expect(currentAuthIntent("")).toBeNull();
    });
});
