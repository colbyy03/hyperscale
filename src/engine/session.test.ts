import { describe, expect, it } from "vitest";
import { planSessionOutline } from "./session";

describe("session outline", () => {
  it("fills exactly the available minutes", () => {
    for (const m of [30, 45, 75, 90, 150, 180]) {
      const o = planSessionOutline(m, 12);
      expect(o.blocks.reduce((s, b) => s + b.minutes, 0)).toBe(m);
      expect(o.blocks.every((b) => b.minutes > 0)).toBe(true);
    }
  });

  it("caps reviews at 15 minutes and skips them when nothing is due", () => {
    expect(planSessionOutline(150, 60).blocks.find((b) => b.kind === "reviews")?.minutes).toBe(15);
    expect(planSessionOutline(75, 0).blocks.some((b) => b.kind === "reviews")).toBe(false);
  });

  it("uses a lite day under 30 minutes and a lab session at 90+", () => {
    expect(planSessionOutline(15, 8).variant).toBe("lite");
    expect(planSessionOutline(150, 8).variant).toBe("lab");
    expect(planSessionOutline(75, 8).blocks.map((b) => b.kind)).toEqual(["warmup", "reviews", "lesson", "practice", "challenge", "exit"]);
  });

  it("returns nothing on a zero-minute day", () => {
    expect(planSessionOutline(0, 10).blocks).toEqual([]);
  });
});
