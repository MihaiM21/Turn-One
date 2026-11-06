import { describe, expect, it } from "vitest";
import { boardQuery, classesOf } from "@/lib/simracing/leaderboards";

describe("boardQuery", () => {
    it("prefers a car over a class", () => {
        const q = new URLSearchParams(boardQuery({ sim: "acc", track: "spa", car: "acc:ferrari_296_gt3", carClass: "gt3", period: "all" }));
        expect(q.get("car")).toBe("acc:ferrari_296_gt3");
        expect(q.has("class")).toBe(false);
    });

    it("uses the class when no car is chosen and adds the page only past 1", () => {
        const q = new URLSearchParams(boardQuery({ sim: "f1_25", track: "monza", carClass: "f1", period: "week", page: 2 }));
        expect(q.get("class")).toBe("f1");
        expect(q.get("period")).toBe("week");
        expect(q.get("page")).toBe("2");
        expect(new URLSearchParams(boardQuery({ sim: "acc", track: "spa", period: "all", page: 1 })).has("page")).toBe(false);
    });
});

describe("classesOf", () => {
    it("lists each class once, sorted, skipping unknown ones", () => {
        expect(
            classesOf([
                { slug: "a", name: "A", class: "gt3" },
                { slug: "b", name: "B", class: "gt4" },
                { slug: "c", name: "C", class: "gt3" },
                { slug: "d", name: "D", class: null },
            ])
        ).toEqual(["gt3", "gt4"]);
    });
});
