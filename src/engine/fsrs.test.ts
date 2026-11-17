import { describe, expect, it } from "vitest";
import { formatInterval, newCardState, previewIntervals, retentionFor, retrievability, reviewCard } from "./fsrs";

const now = new Date("2026-11-17T10:00:00.000Z");

describe("FSRS scheduling", () => {
  it("creates new cards that are due immediately and survive a JSON round trip", async () => {
    const card = await newCardState(now, 0.9);
    expect(card.dueAt).toBe(now.toISOString());
    const stored = JSON.parse(JSON.stringify(card));
    const r = await reviewCard(stored, 3, now, 0.9, false);
    expect(new Date(r.dueAt).getTime()).toBeGreaterThan(now.getTime());
  });

  it("orders intervals Again < Hard < Good < Easy", async () => {
    const card = await newCardState(now, 0.9);
    const p = await previewIntervals(card, now, 0.9);
    expect(p[1]).toBeLessThan(p[2]);
    expect(p[2]).toBeLessThan(p[3]);
    expect(p[3]).toBeLessThan(p[4]);
    expect(p[1]).toBeLessThan(1 / 24); // Again → back within the hour (learning step)
  });

  it("schedules critical cards sooner and grows intervals with successful reviews", async () => {
    expect(retentionFor(true, 0.9)).toBe(0.93);
    expect(retentionFor(false, 0.9)).toBe(0.9);
    const base = await newCardState(now, 0.9);
    const normal = await reviewCard(base, 3, now, 0.9, false);
    const critical = await reviewCard(base, 3, now, 0.93, false);
    expect(new Date(critical.dueAt).getTime()).toBeLessThan(new Date(normal.dueAt).getTime());
    const second = await reviewCard(normal.state, 3, new Date(normal.dueAt), 0.9, false);
    const gap1 = new Date(normal.dueAt).getTime() - now.getTime();
    const gap2 = new Date(second.dueAt).getTime() - new Date(normal.dueAt).getTime();
    expect(gap2).toBeGreaterThan(gap1);
  });

  it("estimates recall probability that decays over time", async () => {
    const r = await reviewCard(await newCardState(now, 0.9), 3, now, 0.9, false);
    const soon = await retrievability(r.state, new Date(now.getTime() + 86_400_000), 0.9);
    const later = await retrievability(r.state, new Date(now.getTime() + 30 * 86_400_000), 0.9);
    expect(soon).toBeGreaterThan(later);
    expect(soon).toBeLessThanOrEqual(1);
  });

  it("formats intervals for buttons", () => {
    expect(formatInterval(1 / 1440)).toBe("1m");
    expect(formatInterval(10 / 1440)).toBe("10m");
    expect(formatInterval(0.6)).toBe("14h");
    expect(formatInterval(4.8)).toBe("5d");
    expect(formatInterval(54)).toBe("2mo");
  });
});
