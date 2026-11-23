/**
 * A CRAH supply-air loop: a first-order coil with dead time, sampled every 10 s, under PI control
 * with valve limits. Pure functions for the PI-loop explainer: simulation and closed-loop poles.
 */
export const TS = 10; // s
export const TAU = 90; // coil time constant, s
export const GAIN = 8; // °C of cooling per unit of valve
export const RETURN_AIR = 22; // °C
export const A = Math.exp(-TS / TAU);
export const B = GAIN * (1 - A);

export interface Tuning {
  kp: number;
  ti: number; // integral time, s (ki = kp / ti)
  deadtime: number; // s, a multiple of TS
  antiWindup: boolean;
}

export interface Trace {
  t: number[]; // minutes
  temp: number[];
  setpoint: number[];
  valve: number[];
}

/** Setpoint 18 → 17 °C at 1 min; return air +6 °C (more than the coil can handle) from 10 to 18 min. */
export function simulate(tuning: Tuning, minutes = 30): Trace {
  const steps = Math.round((minutes * 60) / TS);
  const d = Math.round(tuning.deadtime / TS);
  const ki = tuning.kp / tuning.ti;
  const queue: number[] = Array(d).fill(0.5);
  let T = 18;
  let s = 0;
  const out: Trace = { t: [], temp: [], setpoint: [], valve: [] };
  for (let k = 0; k < steps; k++) {
    const tmin = (k * TS) / 60;
    const sp = tmin >= 1 ? 17 : 18;
    const ret = RETURN_AIR + (tmin >= 10 && tmin < 18 ? 6 : 0);
    const e = T - sp; // cooling valve: too warm opens it
    const cand = s + TS * e;
    let u = 0.5 + tuning.kp * e + ki * cand;
    if (tuning.antiWindup && ((u > 1 && e > 0) || (u < 0 && e < 0))) u = 0.5 + tuning.kp * e + ki * s;
    else s = cand;
    u = Math.min(1, Math.max(0, u));
    queue.push(u);
    const applied = queue.shift()!;
    out.t.push(tmin);
    out.temp.push(T);
    out.setpoint.push(sp);
    out.valve.push(u);
    T = A * T + (1 - A) * (ret - GAIN * applied);
  }
  return out;
}

type C = [number, number];
const mul = (p: C, q: C): C => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
const sub = (p: C, q: C): C => [p[0] - q[0], p[1] - q[1]];
const div = (p: C, q: C): C => {
  const den = q[0] * q[0] + q[1] * q[1];
  return [(p[0] * q[0] + p[1] * q[1]) / den, (p[1] * q[0] - p[0] * q[1]) / den];
};

/** Roots of a monic-normalizable polynomial (coefficients highest power first), by Durand–Kerner. */
export function polyRoots(coef: number[]): C[] {
  const c = coef.map((x) => x / coef[0]!);
  const n = c.length - 1;
  let z: C[] = Array.from({ length: n }, (_, k) => {
    let w: C = [1, 0];
    for (let j = 0; j < k; j++) w = mul(w, [0.4, 0.9]);
    return w;
  });
  const evalAt = (x: C): C => c.reduce<C>((acc, ck) => [mul(acc, x)[0] + ck, mul(acc, x)[1]], [0, 0]);
  for (let it = 0; it < 500; it++) {
    z = z.map((zi, i) => {
      let den: C = [1, 0];
      z.forEach((zj, j) => {
        if (j !== i) den = mul(den, sub(zi, zj));
      });
      return sub(zi, div(evalAt(zi), den));
    });
  }
  return z;
}

/** Closed-loop poles of the linear loop: roots of (z − a)(z − 1) z^d + b (kp (z − 1) + ki·ts). */
export function poles(kp: number, ti: number, deadtime: number): C[] {
  const d = Math.round(deadtime / TS);
  const coef = [1, -(1 + A), A, ...Array(d).fill(0)];
  const n = coef.length - 1;
  coef[n - 1]! += B * kp;
  coef[n]! += B * ((kp / ti) * TS - kp);
  return polyRoots(coef);
}

export function describePoles(ps: C[]) {
  let dom = ps[0]!;
  for (const p of ps) if (Math.hypot(p[0], p[1]) > Math.hypot(dom[0], dom[1])) dom = p;
  const radius = Math.hypot(dom[0], dom[1]);
  const angle = Math.abs(Math.atan2(dom[1], dom[0]));
  return { radius, period: angle > 1e-9 ? ((2 * Math.PI) / angle) * TS : Infinity };
}
