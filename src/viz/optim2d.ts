/**
 * Two-dimensional loss surfaces, the optimizers that race across them, and marching-squares
 * contours: the pure parts of the optimizer-race explainer (unit-tested separately).
 */
export type Vec = [number, number];
export type SurfaceId = "valley" | "tilted" | "banana" | "saddle";
export type OptimizerId = "gd" | "momentum" | "adam" | "newton";

export interface Surface {
  id: SurfaceId;
  label: string;
  domain: { x: Vec; y: Vec };
  start: Vec;
  minima: Vec[];
  /** A curvature scale for choosing step sizes: steps are given as s / L. */
  L: number;
  f: (p: Vec) => number;
  grad: (p: Vec) => Vec;
  hess: (p: Vec) => [number, number, number]; // [fxx, fxy, fyy]
  fmin: number;
}

/** An ill-conditioned bowl ½(u² + κv²), with (u, v) the coordinates rotated by `tiltDeg`. */
function valley(kappa: number, tiltDeg: number, id: SurfaceId, label: string): Surface {
  const t = (tiltDeg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  // A = Rᵀ diag(1, κ) R with R rotating by t.
  const a = c * c + kappa * s * s;
  const b = (1 - kappa) * c * s;
  const d = s * s + kappa * c * c;
  return {
    id,
    label,
    domain: { x: [-3, 3], y: [-2, 2] },
    start: [-2.6, 1.4],
    minima: [[0, 0]],
    L: Math.max(1, kappa),
    f: ([x, y]) => 0.5 * (a * x * x + 2 * b * x * y + d * y * y),
    grad: ([x, y]) => [a * x + b * y, b * x + d * y],
    hess: () => [a, b, d],
    fmin: 0,
  };
}

export function surface(id: SurfaceId, kappa = 20): Surface {
  if (id === "valley") return valley(kappa, 0, id, "Narrow valley");
  if (id === "tilted") return valley(kappa, 35, id, "Tilted valley");
  if (id === "banana")
    return {
      id,
      label: "Banana",
      domain: { x: [-2, 2], y: [-1, 3] },
      start: [-1.5, 2.2],
      minima: [[1, 1]],
      L: 100,
      f: ([x, y]) => (1 - x) ** 2 + 10 * (y - x * x) ** 2,
      grad: ([x, y]) => [-2 * (1 - x) - 40 * x * (y - x * x), 20 * (y - x * x)],
      hess: ([x, y]) => [2 - 40 * y + 120 * x * x, -40 * x, 20],
      fmin: 0,
    };
  return {
    id: "saddle",
    label: "Saddle",
    domain: { x: [-2, 2], y: [-2, 2] },
    start: [1.6, 0.02],
    minima: [
      [0, 1],
      [0, -1],
    ],
    L: 4,
    f: ([x, y]) => 0.5 * x * x - 0.5 * y * y + 0.25 * y ** 4,
    grad: ([x, y]) => [x, -y + y ** 3],
    hess: ([, y]) => [1, 0, -1 + 3 * y * y],
    fmin: -0.25,
  };
}

export interface Params {
  s: number; // GD and momentum step, as a multiple of 1/L
  beta: number; // momentum
  adamLr: number;
}

export interface Run {
  path: Vec[];
  diverged: boolean;
  /** First step at which f − fmin < 1e-6, or null. */
  converged: number | null;
}

export function runOptimizer(opt: OptimizerId, surf: Surface, start: Vec, steps: number, p: Params): Run {
  const path: Vec[] = [start];
  let w: Vec = [...start];
  let v: Vec = [0, 0];
  let m: Vec = [0, 0];
  let r: Vec = [0, 0];
  const eta = p.s / surf.L;
  const span = Math.max(surf.domain.x[1] - surf.domain.x[0], surf.domain.y[1] - surf.domain.y[0]);
  let converged: number | null = surf.f(w) - surf.fmin < 1e-6 ? 0 : null;
  for (let k = 1; k <= steps; k++) {
    const g = surf.grad(w);
    if (opt === "gd") w = [w[0] - eta * g[0], w[1] - eta * g[1]];
    else if (opt === "momentum") {
      v = [p.beta * v[0] - eta * g[0], p.beta * v[1] - eta * g[1]];
      w = [w[0] + v[0], w[1] + v[1]];
    } else if (opt === "adam") {
      const b1 = 0.9;
      const b2 = 0.999;
      m = [b1 * m[0] + (1 - b1) * g[0], b1 * m[1] + (1 - b1) * g[1]];
      r = [b2 * r[0] + (1 - b2) * g[0] ** 2, b2 * r[1] + (1 - b2) * g[1] ** 2];
      const mh: Vec = [m[0] / (1 - b1 ** k), m[1] / (1 - b1 ** k)];
      const rh: Vec = [r[0] / (1 - b2 ** k), r[1] / (1 - b2 ** k)];
      w = [w[0] - (p.adamLr * mh[0]) / (Math.sqrt(rh[0]) + 1e-8), w[1] - (p.adamLr * mh[1]) / (Math.sqrt(rh[1]) + 1e-8)];
    } else {
      // Pure Newton: solve H d = −g. It heads for the nearest critical point, minimum or not.
      const [a, b, d] = surf.hess(w);
      const det = a * d - b * b;
      if (Math.abs(det) < 1e-12) break;
      w = [w[0] - (d * g[0] - b * g[1]) / det, w[1] - (-b * g[0] + a * g[1]) / det];
    }
    if (!Number.isFinite(w[0]) || !Number.isFinite(w[1]) || Math.abs(w[0]) > 4 * span || Math.abs(w[1]) > 4 * span) {
      path.push(w);
      return { path, diverged: true, converged };
    }
    path.push(w);
    if (converged === null && surf.f(w) - surf.fmin < 1e-6) converged = k;
  }
  return { path, diverged: false, converged };
}

/** Contour segments of a grid of values (rows are y, columns are x) at one level, in grid units. */
export function contourSegments(grid: number[][], level: number): Array<[Vec, Vec]> {
  const segs: Array<[Vec, Vec]> = [];
  const ny = grid.length;
  const nx = grid[0]!.length;
  const lerp = (a: number, b: number) => (level - a) / (b - a);
  for (let j = 0; j < ny - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const tl = grid[j]![i]!;
      const tr = grid[j]![i + 1]!;
      const br = grid[j + 1]![i + 1]!;
      const bl = grid[j + 1]![i]!;
      const idx = (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const top: Vec = [i + lerp(tl, tr), j];
      const right: Vec = [i + 1, j + lerp(tr, br)];
      const bottom: Vec = [i + lerp(bl, br), j + 1];
      const left: Vec = [i, j + lerp(tl, bl)];
      const center = (tl + tr + br + bl) / 4 > level;
      switch (idx) {
        case 1: case 14: segs.push([left, bottom]); break;
        case 2: case 13: segs.push([bottom, right]); break;
        case 3: case 12: segs.push([left, right]); break;
        case 4: case 11: segs.push([top, right]); break;
        case 6: case 9: segs.push([top, bottom]); break;
        case 7: case 8: segs.push([left, top]); break;
        case 5: if (center) { segs.push([left, top], [bottom, right]); } else { segs.push([left, bottom], [top, right]); } break;
        case 10: if (center) { segs.push([left, bottom], [top, right]); } else { segs.push([left, top], [bottom, right]); } break;
      }
    }
  return segs;
}
