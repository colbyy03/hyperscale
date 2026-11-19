/**
 * A synthetic rack-inlet temperature field for one pod: 2 rows × 12 racks × 3 sensor heights,
 * sampled hourly for 20 days. Three physical effects drive it (supply-air temperature, top-of-rack
 * recirculation strongest at the row ends, and airflow starvation at the far end from the CRAH),
 * plus fixed per-sensor offsets and 0.08 °C of sensor noise. The same recipe generates the data in
 * Module 2's PCA exercises (with NumPy's generator, so the numbers differ slightly).
 */
export const ROWS = 2;
export const RACKS = 12;
export const HEIGHTS = 3;
export const SENSORS = ROWS * RACKS * HEIGHTS;
export const HOURS = 480;

/** Sensor index for (row, rack, height), heights 0 = low, 1 = mid, 2 = top. */
export const sensorIndex = (row: number, rack: number, height: number) => (row * RACKS + rack) * HEIGHTS + height;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalSource(seed: number) {
  const u = mulberry32(seed);
  return (sd = 1) => {
    const r = Math.sqrt(-2 * Math.log(1 - u()));
    return sd * r * Math.cos(2 * Math.PI * u());
  };
}

export function patterns() {
  const uniform = new Float64Array(SENSORS);
  const recirc = new Float64Array(SENSORS);
  const starve = new Float64Array(SENSORS);
  for (let r = 0; r < ROWS; r++)
    for (let k = 0; k < RACKS; k++)
      for (let h = 0; h < HEIGHTS; h++) {
        const i = sensorIndex(r, k, h);
        const edge = Math.exp(-Math.min(k, RACKS - 1 - k) / 1.5);
        uniform[i] = h === 2 ? 0.9 : 1;
        recirc[i] = [0, 0.3, 1][h]! * (1 + 1.2 * edge);
        starve[i] = (k / (RACKS - 1)) ** 2 * [0.6, 0.8, 1][h]!;
      }
  return { uniform, recirc, starve };
}

/** Rows are hours, columns are sensors (°C). */
export function makeField(seed = 7, noise = 0.08): Float64Array[] {
  const n = normalSource(seed);
  const { uniform, recirc, starve } = patterns();
  const base = Array.from({ length: SENSORS }, (_, i) => 1 + (i % HEIGHTS === 2 ? 0.8 : 0) + n(0.3));
  let drift = 0;
  const rows: Float64Array[] = [];
  for (let t = 0; t < HOURS; t++) {
    const hour = t % 24;
    const day = t / 24;
    drift += n(0.05);
    const supply = 18 + 0.6 * Math.sin((2 * Math.PI * (hour - 9)) / 24) + (day >= 6 && day < 9 ? 2 : 0) - (day >= 14 && day < 16 ? 1 : 0) + drift;
    const load = 0.5 + 0.3 * Math.sin((2 * Math.PI * (hour - 10)) / 24) + n(0.08);
    const rec = Math.max(load + n(0.25), 0);
    const night = hour < 6 || hour >= 22 ? 0.8 : 0;
    const st = Math.max(night + n(0.3), 0);
    const x = new Float64Array(SENSORS);
    for (let i = 0; i < SENSORS; i++) x[i] = supply * uniform[i]! + base[i]! + 2.5 * rec * recirc[i]! + 2 * st * starve[i]! + n(noise);
    rows.push(x);
  }
  return rows;
}

/** Eigen-decomposition of a symmetric n×n matrix (row-major) by cyclic Jacobi rotations, largest first. */
export function symmetricEigen(input: Float64Array, n: number): { values: number[]; vectors: Float64Array[] } {
  const A = Float64Array.from(input);
  const V = new Float64Array(n * n);
  for (let i = 0; i < n; i++) V[i * n + i] = 1;
  const total = A.reduce((s, x) => s + x * x, 0);
  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p * n + q]! ** 2;
    if (off <= 1e-26 * total) break;
    for (let p = 0; p < n - 1; p++)
      for (let q = p + 1; q < n; q++) {
        const apq = A[p * n + q]!;
        if (Math.abs(apq) < 1e-300) continue;
        const theta = (A[q * n + q]! - A[p * n + p]!) / (2 * apq);
        const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = A[k * n + p]!;
          const akq = A[k * n + q]!;
          A[k * n + p] = c * akp - s * akq;
          A[k * n + q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = A[p * n + k]!;
          const aqk = A[q * n + k]!;
          A[p * n + k] = c * apk - s * aqk;
          A[q * n + k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = V[k * n + p]!;
          const vkq = V[k * n + q]!;
          V[k * n + p] = c * vkp - s * vkq;
          V[k * n + q] = s * vkp + c * vkq;
        }
      }
  }
  const order = Array.from({ length: n }, (_, i) => i).sort((i, j) => A[j * n + j]! - A[i * n + i]!);
  return {
    values: order.map((i) => A[i * n + i]!),
    vectors: order.map((i) => {
      const v = Float64Array.from({ length: n }, (_, k) => V[k * n + i]!);
      // Sign convention: the entry with the largest magnitude is positive.
      let big = 0;
      for (let k = 1; k < n; k++) if (Math.abs(v[k]!) > Math.abs(v[big]!)) big = k;
      if (v[big]! < 0) for (let k = 0; k < n; k++) v[k] = -v[k]!;
      return v;
    }),
  };
}

/** PCA/POD of snapshots (rows): the mean field, modes (unit vectors) and each mode's share of the energy. */
export function pod(rows: Float64Array[], center = true) {
  const p = rows[0]!.length;
  const mean = new Float64Array(p);
  if (center) {
    for (const x of rows) for (let i = 0; i < p; i++) mean[i]! += x[i]!;
    for (let i = 0; i < p; i++) mean[i]! /= rows.length;
  }
  const G = new Float64Array(p * p);
  const d = new Float64Array(p);
  for (const x of rows) {
    for (let i = 0; i < p; i++) d[i] = x[i]! - mean[i]!;
    for (let i = 0; i < p; i++) {
      const di = d[i]!;
      for (let j = i; j < p; j++) G[i * p + j]! += di * d[j]!;
    }
  }
  for (let i = 0; i < p; i++) for (let j = 0; j < i; j++) G[i * p + j] = G[j * p + i]!;
  const { values, vectors } = symmetricEigen(G, p);
  const total = values.reduce((s, v) => s + Math.max(v, 0), 0);
  return { mean, modes: vectors, energy: values.map((v) => Math.max(v, 0) / total) };
}

/** Reconstruct a snapshot from the mean and the first k modes. */
export function reconstruct(x: Float64Array, mean: Float64Array, modes: Float64Array[], k: number): Float64Array {
  const out = Float64Array.from(mean);
  for (let m = 0; m < k; m++) {
    const phi = modes[m]!;
    let a = 0;
    for (let i = 0; i < x.length; i++) a += phi[i]! * (x[i]! - mean[i]!);
    for (let i = 0; i < x.length; i++) out[i]! += a * phi[i]!;
  }
  return out;
}
