import { describe, expect, it } from "vitest";
import { analyze } from "./MatrixMap";

describe("MatrixMap analysis", () => {
  it("matches hand calculations for a symmetric matrix", () => {
    const r = analyze([2, 1, 1, 2]);
    expect(r.det).toBeCloseTo(3);
    expect(r.eig.real && [r.eig.l1, r.eig.l2]).toEqual([3, 1]);
    expect(r.s1).toBeCloseTo(3); // symmetric PSD: singular values are the eigenvalues
    expect(r.s2).toBeCloseTo(1);
    expect(r.kappa).toBeCloseTo(3);
    expect(r.rank).toBe(2);
  });
  it("finds complex eigenvalues for a rotation and rank 1 for dependent columns", () => {
    const rot = analyze([0, -1, 1, 0]);
    expect(rot.eig.real).toBe(false);
    expect(rot.s1).toBeCloseTo(1);
    expect(rot.s2).toBeCloseTo(1);
    const r1 = analyze([1, 2, 0.5, 1]);
    expect(r1.rank).toBe(1);
    expect(r1.kappa).toBe(Infinity);
  });
  it("shows that a small determinant isn't the same as ill-conditioning", () => {
    const scaled = analyze([0.1, 0, 0, 0.1]);
    expect(scaled.det).toBeCloseTo(0.01);
    expect(scaled.kappa).toBeCloseTo(1);
  });
});

describe("ProjectionViz maths", () => {
  it("projects b onto a with a perpendicular residual", async () => {
    const { project } = await import("./ProjectionViz");
    const r = project([3, 4], [2, 1]);
    expect(r.dot).toBeCloseTo(10);
    expect(r.p[0]).toBeCloseTo(1.2);
    expect(r.p[1]).toBeCloseTo(1.6);
    expect(3 * r.r[0] + 4 * r.r[1]).toBeCloseTo(0);
    expect(r.cos).toBeCloseTo(10 / (5 * Math.sqrt(5)));
  });
  it("leaves cos undefined for a zero vector", async () => {
    const { project } = await import("./ProjectionViz");
    expect(Number.isNaN(project([0, 0], [1, 1]).cos)).toBe(true);
  });
});
