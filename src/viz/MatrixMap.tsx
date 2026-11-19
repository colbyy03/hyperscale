/**
 * A 2×2 matrix as a map of the plane: the grid, the basis vectors (the columns), the unit circle
 * (which becomes an ellipse whose semi-axes are the singular values), real eigenvector directions,
 * and the numbers that describe the map: determinant, rank, eigenvalues, singular values, κ.
 */
import clsx from "clsx";
import { useMemo, useState } from "react";

type M = [number, number, number, number]; // [a, b, c, d] for [[a, b], [c, d]]

const PRESETS: Array<{ name: string; m: M }> = [
  { name: "identity", m: [1, 0, 0, 1] },
  { name: "rotate 30°", m: [0.87, -0.5, 0.5, 0.87] },
  { name: "shear", m: [1, 1, 0, 1] },
  { name: "stretch", m: [1.8, 0, 0, 0.6] },
  { name: "symmetric", m: [1.5, 0.6, 0.6, 0.8] },
  { name: "nearly singular", m: [1, 0.95, 1, 1] },
  { name: "rank 1", m: [1, 2, 0.5, 1] },
];

export function analyze([a, b, c, d]: M) {
  const det = a * d - b * c;
  const tr = a + d;
  const disc = tr * tr - 4 * det;
  const eig = disc >= 0 ? { real: true as const, l1: (tr + Math.sqrt(disc)) / 2, l2: (tr - Math.sqrt(disc)) / 2 } : { real: false as const, re: tr / 2, im: Math.sqrt(-disc) / 2 };
  // Singular values: square roots of the eigenvalues of AᵀA = [[p, q], [q, r]].
  const p = a * a + c * c;
  const q = a * b + c * d;
  const r = b * b + d * d;
  const mid = (p + r) / 2;
  const rad = Math.sqrt(((p - r) / 2) ** 2 + q * q);
  const s1 = Math.sqrt(Math.max(mid + rad, 0));
  const s2 = Math.sqrt(Math.max(mid - rad, 0));
  // Right singular vector for s1 (eigenvector of AᵀA), then the ellipse axis direction A v1.
  const theta = 0.5 * Math.atan2(2 * q, p - r);
  const v1: [number, number] = [Math.cos(theta), Math.sin(theta)];
  const rank = s1 < 1e-9 ? 0 : s2 / s1 < 1e-9 ? 1 : 2;
  return { det, eig, s1, s2, v1, rank, kappa: s2 > 1e-12 ? s1 / s2 : Infinity };
}

function eigvec(m: M, l: number): [number, number] {
  const [a, b, c, d] = m;
  const v: [number, number] = Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : l === a ? [1, 0] : [0, 1];
  const n = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / n, v[1] / n];
}

const fmt = (x: number) => (Math.abs(x) < 5e-3 ? "0" : x.toFixed(2));

export default function MatrixMap() {
  const [m, setM] = useState<M>([1.5, 0.6, 0.6, 0.8]);
  const info = useMemo(() => analyze(m), [m]);
  const [a, b, c, d] = m;
  const S = 46; // pixels per unit
  const W = 320;
  const H = 320;
  const tx = (x: number, y: number): [number, number] => [W / 2 + S * (a * x + b * y), H / 2 - S * (c * x + d * y)];
  const raw = (x: number, y: number): [number, number] => [W / 2 + S * x, H / 2 - S * y];
  const grid: string[] = [];
  for (let k = -3; k <= 3; k++) {
    grid.push(`M${tx(k, -3).join(",")}L${tx(k, 3).join(",")}`);
    grid.push(`M${tx(-3, k).join(",")}L${tx(3, k).join(",")}`);
  }
  const circle = Array.from({ length: 73 }, (_, i) => {
    const t = (i / 72) * 2 * Math.PI;
    return tx(Math.cos(t), Math.sin(t));
  });
  const ellipse = circle.map((pt, i) => `${i ? "L" : "M"}${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join("");
  const set = (i: number, v: number) => setM((old) => old.map((x, j) => (j === i ? v : x)) as M);
  const eigLines =
    info.eig.real && info.rank > 0
      ? [info.eig.l1, info.eig.l2].map((l) => {
          const v = eigvec(m, l);
          return { l, from: raw(-3.2 * v[0], -3.2 * v[1]), to: raw(3.2 * v[0], 3.2 * v[1]) };
        })
      : [];

  return (
    <div className="rounded-2xl border border-line bg-surface p-4" data-testid="viz-matrixmap">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-80 rounded-xl border border-line bg-surface-2" role="img" aria-label="The plane transformed by the matrix">
          {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
            <g key={k} stroke="var(--border)" strokeWidth={1} opacity={0.6}>
              <line x1={raw(k, -3.5)[0]} y1={raw(k, -3.5)[1]} x2={raw(k, 3.5)[0]} y2={raw(k, 3.5)[1]} />
              <line x1={raw(-3.5, k)[0]} y1={raw(-3.5, k)[1]} x2={raw(3.5, k)[0]} y2={raw(3.5, k)[1]} />
            </g>
          ))}
          <path d={grid.join("")} stroke="var(--info)" strokeWidth={1} opacity={0.35} fill="none" />
          <circle cx={W / 2} cy={H / 2} r={S} fill="none" stroke="var(--faint)" strokeDasharray="3 3" />
          <path d={ellipse} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.5} />
          {eigLines.map((e, i) => (
            <line key={i} x1={e.from[0]} y1={e.from[1]} x2={e.to[0]} y2={e.to[1]} stroke="var(--violet)" strokeWidth={1.2} strokeDasharray="6 4" />
          ))}
          <line x1={W / 2} y1={H / 2} x2={tx(1, 0)[0]} y2={tx(1, 0)[1]} stroke="var(--accent)" strokeWidth={2.5} />
          <line x1={W / 2} y1={H / 2} x2={tx(0, 1)[0]} y2={tx(0, 1)[1]} stroke="var(--heat)" strokeWidth={2.5} />
          <circle cx={tx(1, 0)[0]} cy={tx(1, 0)[1]} r={3.5} fill="var(--accent)" />
          <circle cx={tx(0, 1)[0]} cy={tx(0, 1)[1]} r={3.5} fill="var(--heat)" />
        </svg>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2" aria-label="Matrix entries">
            {(["a", "b", "c", "d"] as const).map((name, i) => (
              <label key={name} className="text-xs">
                <span className="flex justify-between text-faint">
                  <span className="font-mono">{name}</span>
                  <span className="font-mono text-ink tabular-nums">{m[i]!.toFixed(2)}</span>
                </span>
                <input type="range" min={-2} max={2} step={0.05} value={m[i]} onChange={(e) => set(i, Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label={`Entry ${name}`} />
              </label>
            ))}
          </div>
          <div className="font-mono text-sm">
            A = [[{fmt(a)}, {fmt(b)}], [{fmt(c)}, {fmt(d)}]]
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
            <dt className="text-faint">determinant</dt>
            <dd className="tabular-nums" data-testid="det-value">{fmt(info.det)} <span className="text-xs text-faint">(area scale{info.det < 0 ? ", flips orientation" : ""})</span></dd>
            <dt className="text-faint">rank</dt>
            <dd className={clsx("tabular-nums", info.rank < 2 && "text-heat")}>{info.rank}</dd>
            <dt className="text-faint">eigenvalues</dt>
            <dd className="tabular-nums">{info.eig.real ? `${fmt(info.eig.l1)}, ${fmt(info.eig.l2)}` : `${fmt(info.eig.re)} ± ${fmt(info.eig.im)}i (no real eigenvectors)`}</dd>
            <dt className="text-faint">singular values</dt>
            <dd className="tabular-nums">{fmt(info.s1)}, {fmt(info.s2)} <span className="text-xs text-faint">(ellipse semi-axes)</span></dd>
            <dt className="text-faint">condition κ</dt>
            <dd className={clsx("tabular-nums", info.kappa > 20 && "text-heat")}>{Number.isFinite(info.kappa) ? info.kappa.toFixed(1) : "∞"}</dd>
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((pr) => (
              <button key={pr.name} onClick={() => setM(pr.m)} className="rounded-lg border border-line px-2 py-1 text-xs text-muted hover:border-line-strong hover:text-ink">
                {pr.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-faint">
            <span className="text-accent">Green</span> and <span className="text-heat">orange</span> arrows are where e₁ and e₂ land, the matrix's columns. The dashed circle becomes the shaded ellipse; <span className="text-violet">purple dashes</span> are eigenvector directions, lines that map onto themselves.
          </p>
        </div>
      </div>
    </div>
  );
}
