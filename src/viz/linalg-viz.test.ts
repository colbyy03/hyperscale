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

describe("svd2", () => {
  it("rebuilds A from U Σ Vᵀ with orthonormal U and V", async () => {
    const { svd2 } = await import("./MatrixMap");
    for (const m of [[1.5, 0.6, 0.6, 0.8], [1, 1, 0, 1], [0.87, -0.5, 0.5, 0.87], [1, 2, 0.5, 1], [-1, 0.3, 0.2, 1.4]] as Array<[number, number, number, number]>) {
      const { U, S, V } = svd2(m);
      // A = Σ_i s_i u_i v_iᵀ
      const rebuilt = ([0, 1] as const).map((r) => ([0, 1] as const).map((c) => S[0] * U[0][r] * V[0][c] + S[1] * U[1][r] * V[1][c]));
      expect(rebuilt[0]![0]).toBeCloseTo(m[0], 9);
      expect(rebuilt[0]![1]).toBeCloseTo(m[1], 9);
      expect(rebuilt[1]![0]).toBeCloseTo(m[2], 9);
      expect(rebuilt[1]![1]).toBeCloseTo(m[3], 9);
      expect(U[0][0] * U[1][0] + U[0][1] * U[1][1]).toBeCloseTo(0, 9);
      expect(Math.hypot(...U[1])).toBeCloseTo(1, 9);
      expect(V[0][0] * V[1][0] + V[0][1] * V[1][1]).toBeCloseTo(0, 12);
    }
  });
});
