import { describe, expect, it } from "vitest";
import { describePoles, poles, polyRoots, simulate } from "./pi-loop-engine";

const KP = 90 / (8 * 60); // SIMC with τc = θ = 30 s
const TI = 90;

describe("PI loop explainer engine", () => {
  it("finds polynomial roots", () => {
    const r = polyRoots([1, -3, 2]).map(([re]) => re).sort();
    expect(r[0]).toBeCloseTo(1, 9);
    expect(r[1]).toBeCloseTo(2, 9);
  });
  it("reproduces the incident's poles (same numbers as the Python exercise)", () => {
    const good = describePoles(poles(KP, TI, 30));
    expect(good.radius).toBeCloseTo(0.8827, 3);
    expect(good.period).toBe(Infinity);
    const bad = describePoles(poles(KP, TI / 4, 30));
    expect(bad.radius).toBeCloseTo(1.0165, 3);
    expect(bad.period).toBeCloseTo(236, -1);
  });
  it("settles with commissioning tuning and recovers from the surge only with anti-windup", () => {
    const aw = simulate({ kp: KP, ti: TI, deadtime: 30, antiWindup: true });
    const wu = simulate({ kp: KP, ti: TI, deadtime: 30, antiWindup: false });
    const i18 = aw.t.findIndex((t) => t >= 18);
    expect(Math.abs(aw.temp[i18 - 1]! - 17)).toBeGreaterThan(0.5); // the surge exceeds the coil's capacity
    expect(Math.abs(aw.temp.at(-1)! - 17)).toBeLessThan(0.05);
    expect(Math.min(...aw.temp.slice(i18))).toBeGreaterThan(Math.min(...wu.temp.slice(i18)) + 0.5);
    expect(Math.max(...aw.valve)).toBeLessThanOrEqual(1);
  });
});
