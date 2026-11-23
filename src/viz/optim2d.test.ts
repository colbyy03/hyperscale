import { describe, expect, it } from "vitest";
import { contourSegments, runOptimizer, surface } from "./optim2d";

const P = { s: 1, beta: 0.9, adamLr: 0.1 };

describe("optimizer race engine", () => {
  it("gradient descent converges below 2/L and diverges above it", () => {
    const v = surface("valley", 10);
    expect(runOptimizer("gd", v, v.start, 400, { ...P, s: 1 }).converged).not.toBeNull();
    expect(runOptimizer("gd", v, v.start, 400, { ...P, s: 2.1 }).diverged).toBe(true);
    expect(runOptimizer("gd", v, v.start, 400, { ...P, s: 1.9 }).diverged).toBe(false);
  });
  it("momentum beats plain gradient descent in a narrow valley", () => {
    const v = surface("tilted", 50);
    const gd = runOptimizer("gd", v, v.start, 2000, P).converged!;
    const mom = runOptimizer("momentum", v, v.start, 2000, P).converged!;
    expect(mom).toBeLessThan(gd / 2); // about 2.4× fewer steps with β = 0.9 at κ = 50
  });
  it("Newton solves a quadratic in one step, the banana in a few, and gets stuck on the saddle", () => {
    const v = surface("tilted", 50);
    expect(runOptimizer("newton", v, v.start, 5, P).converged).toBe(1);
    const b = surface("banana");
    const nb = runOptimizer("newton", b, b.start, 30, P);
    expect(nb.converged).not.toBeNull();
    expect(nb.converged!).toBeLessThanOrEqual(10);
    const s = surface("saddle");
    const ns = runOptimizer("newton", s, s.start, 30, P);
    const end = ns.path.at(-1)!;
    expect(Math.hypot(end[0], end[1])).toBeLessThan(1e-6); // the saddle point, not a minimum
    expect(ns.converged).toBeNull();
    expect(runOptimizer("gd", s, s.start, 400, P).converged).not.toBeNull(); // GD escapes, slowly
  });
  it("Adam's first step moves each coordinate by about the learning rate", () => {
    const v = surface("valley", 20);
    const r = runOptimizer("adam", v, v.start, 1, P);
    expect(Math.abs(r.path[1]![0] - v.start[0])).toBeCloseTo(0.1, 6);
    expect(Math.abs(r.path[1]![1] - v.start[1])).toBeCloseTo(0.1, 6);
  });
  it("contours of a radial bowl are circles", () => {
    const n = 41;
    const grid = Array.from({ length: n }, (_, j) => Array.from({ length: n }, (_, i) => (i - 20) ** 2 + (j - 20) ** 2));
    const segs = contourSegments(grid, 100);
    expect(segs.length).toBeGreaterThan(30);
    for (const [a, b] of segs) for (const [x, y] of [a, b]) expect(Math.abs(Math.hypot(x - 20, y - 20) - 10)).toBeLessThan(0.3);
  });
});
