import { describe, expect, it } from "vitest";
import { HOURS, SENSORS, makeField, pod, reconstruct, symmetricEigen } from "./fieldData";

describe("symmetricEigen (Jacobi)", () => {
  it("diagonalizes a symmetric matrix: A v = λ v, largest first, orthonormal vectors", () => {
    const A = Float64Array.from([4, 1, 2, 1, 3, 0.5, 2, 0.5, 5]);
    const { values, vectors } = symmetricEigen(A, 3);
    expect(values[0]).toBeGreaterThan(values[1]!);
    expect(values[1]).toBeGreaterThan(values[2]!);
    expect(values.reduce((s, v) => s + v, 0)).toBeCloseTo(12, 10); // trace
    vectors.forEach((v, m) => {
      for (let i = 0; i < 3; i++) {
        const Av = A[i * 3]! * v[0]! + A[i * 3 + 1]! * v[1]! + A[i * 3 + 2]! * v[2]!;
        expect(Av).toBeCloseTo(values[m]! * v[i]!, 10);
      }
      expect(Math.hypot(...v)).toBeCloseTo(1, 12);
    });
    expect(vectors[0]![0]! * vectors[1]![0]! + vectors[0]![1]! * vectors[1]![1]! + vectors[0]![2]! * vectors[1]![2]!).toBeCloseTo(0, 10);
  });
});

describe("the synthetic inlet field", () => {
  const X = makeField();
  it("has the expected size and plausible temperatures", () => {
    expect(X.length).toBe(HOURS);
    expect(X[0]!.length).toBe(SENSORS);
    const all = X.flatMap((x) => [...x]);
    expect(Math.min(...all)).toBeGreaterThan(14);
    expect(Math.max(...all)).toBeLessThan(30);
  });
  it("is three modes plus noise once centered, and one trivial mode if not", () => {
    const { energy, mean, modes } = pod(X, true);
    expect(energy[0]).toBeGreaterThan(0.8);
    expect(energy[0]).toBeLessThan(0.93);
    expect(energy[0]! + energy[1]! + energy[2]!).toBeGreaterThan(0.99);
    expect(energy[3]).toBeLessThan(0.001);
    const raw = pod(X, false);
    expect(raw.energy[0]).toBeGreaterThan(0.998);
    // Three modes reconstruct a snapshot to about the sensor noise.
    let se = 0;
    for (const x of X.slice(0, 100)) {
      const r = reconstruct(x, mean, modes, 3);
      for (let i = 0; i < SENSORS; i++) se += (r[i]! - x[i]!) ** 2;
    }
    expect(Math.sqrt(se / (100 * SENSORS))).toBeLessThan(0.09);
  });
});
