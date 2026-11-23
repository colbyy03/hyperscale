/**
 * Optimizers racing across a loss surface: gradient descent, heavy-ball momentum, Adam and pure
 * Newton on a narrow valley (aligned or tilted), a banana-shaped valley and a saddle. Click the
 * plot to choose a starting point; step sizes are set as multiples of 1/L.
 */
import clsx from "clsx";
import { useEffect, useMemo, useState, type PointerEvent } from "react";
import { contourSegments, runOptimizer, surface, type OptimizerId, type Params, type SurfaceId, type Vec } from "./optim2d";

const OPTIMIZERS: Array<{ id: OptimizerId; label: string; color: string }> = [
  { id: "gd", label: "Gradient descent", color: "var(--cat-1)" },
  { id: "momentum", label: "Momentum", color: "var(--cat-2)" },
  { id: "adam", label: "Adam", color: "var(--cat-3)" },
  { id: "newton", label: "Newton", color: "var(--cat-4)" },
];
const SURFACES: Array<{ id: SurfaceId; label: string }> = [
  { id: "valley", label: "Narrow valley" },
  { id: "tilted", label: "Tilted valley" },
  { id: "banana", label: "Banana" },
  { id: "saddle", label: "Saddle" },
];
const W = 360;
const H = 280;
const N = 81;

interface Props {
  surface?: SurfaceId;
  optimizers?: OptimizerId[];
  kappa?: number;
  steps?: number;
  /** Initial step size, as a multiple of 1/L. */
  step?: number;
  beta?: number;
  adamLr?: number;
}

const sci = (x: number) => (x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1000 ? x.toPrecision(3) : x.toExponential(1));

export default function OptimizerRace({ surface: initialSurface = "valley", optimizers = ["gd"], kappa: initialKappa = 20, steps: initialSteps = 100, step = 1, beta = 0.9, adamLr = 0.1 }: Props) {
  const [sid, setSid] = useState<SurfaceId>(initialSurface);
  const [kappa, setKappa] = useState(initialKappa);
  const [enabled, setEnabled] = useState<OptimizerId[]>(optimizers);
  const [params, setParams] = useState<Params>({ s: step, beta, adamLr });
  const [steps, setSteps] = useState(initialSteps);
  const surf = useMemo(() => surface(sid, kappa), [sid, kappa]);
  const [start, setStart] = useState<Vec>(surf.start);
  const [hover, setHover] = useState<Vec | null>(null);
  useEffect(() => setStart(surface(sid).start), [sid]);

  // Map the domain onto the plot with equal scales on both axes, so angles are true.
  const { x: dx, y: dy } = surf.domain;
  const scale = Math.min((W - 8) / (dx[1] - dx[0]), (H - 8) / (dy[1] - dy[0]));
  const ox = (W - scale * (dx[1] - dx[0])) / 2;
  const oy = (H - scale * (dy[1] - dy[0])) / 2;
  const px = (p: Vec): Vec => [ox + scale * (p[0] - dx[0]), H - oy - scale * (p[1] - dy[0])];
  const fromPx = (x: number, y: number): Vec => [dx[0] + (x - ox) / scale, dy[0] + (H - oy - y) / scale];

  const contours = useMemo(() => {
    const grid = Array.from({ length: N }, (_, j) =>
      Array.from({ length: N }, (_, i) => surf.f([dx[0] + ((dx[1] - dx[0]) * i) / (N - 1), dy[1] - ((dy[1] - dy[0]) * j) / (N - 1)]) - surf.fmin),
    );
    const top = Math.max(...grid.flat());
    const levels = Array.from({ length: 13 }, (_, k) => Math.exp(Math.log(top * 1e-4) + (k / 12) * (Math.log(top * 0.8) - Math.log(top * 1e-4))));
    return levels.map((lv) =>
      contourSegments(grid, lv)
        .map(([a, b]) => {
          const toPlot = ([i, j]: Vec): Vec => px([dx[0] + ((dx[1] - dx[0]) * i) / (N - 1), dy[1] - ((dy[1] - dy[0]) * j) / (N - 1)]);
          const [p, q] = [toPlot(a), toPlot(b)];
          return `M${p[0].toFixed(1)},${p[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`;
        })
        .join(""),
    );
  }, [surf]); // px depends only on the surface's domain, which is part of surf

  const runs = useMemo(() => OPTIMIZERS.filter((o) => enabled.includes(o.id)).map((o) => ({ ...o, run: runOptimizer(o.id, surf, start, steps, params) })), [enabled, surf, start, steps, params]);

  const toSvg = (e: PointerEvent<SVGSVGElement>): Vec | null => {
    const ctm = e.currentTarget.getScreenCTM();
    if (!ctm) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return fromPx(pt.x, pt.y);
  };
  const inDomain = (p: Vec) => p[0] >= dx[0] && p[0] <= dx[1] && p[1] >= dy[0] && p[1] <= dy[1];
  const toggle = (id: OptimizerId) => setEnabled((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const usesValley = sid === "valley" || sid === "tilted";

  return (
    <div className="rounded-2xl border border-line bg-surface p-4" data-testid="viz-optimizer-race">
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Loss surface">
        {SURFACES.map((s) => (
          <button key={s.id} onClick={() => setSid(s.id)} aria-pressed={sid === s.id} className={clsx("rounded-lg border px-2 py-1 text-xs", sid === s.id ? "border-accent/50 bg-accent-soft text-accent" : "border-line text-muted hover:text-ink")}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full max-w-[22rem] cursor-crosshair rounded-xl border border-line bg-surface-2"
            role="img"
            aria-label={`Optimizer paths on the ${surf.label.toLowerCase()} surface`}
            onPointerDown={(e) => {
              const p = toSvg(e);
              if (p && inDomain(p)) setStart(p);
            }}
            onPointerMove={(e) => setHover(toSvg(e))}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <clipPath id="race-clip">
                <rect x={0} y={0} width={W} height={H} rx={12} />
              </clipPath>
            </defs>
            <g clipPath="url(#race-clip)">
              {contours.map((d, k) => (
                <path key={k} d={d} stroke="var(--border-strong)" strokeWidth={1} fill="none" opacity={0.9} />
              ))}
              {surf.minima.map((m, k) => {
                const [x, y] = px(m);
                return <path key={k} d={`M${x - 5},${y}L${x + 5},${y}M${x},${y - 5}L${x},${y + 5}`} stroke="var(--muted)" strokeWidth={1.5} />;
              })}
              {runs.map((r) => (
                <g key={r.id}>
                  <polyline points={r.run.path.map((p) => px(p).map((v) => v.toFixed(1)).join(",")).join(" ")} fill="none" stroke={r.color} strokeWidth={2} strokeLinejoin="round" />
                  {(() => {
                    const end = px(r.run.path.at(-1)!);
                    const inside = end[0] > 0 && end[0] < W && end[1] > 0 && end[1] < H;
                    return inside ? <circle cx={end[0]} cy={end[1]} r={3.5} fill={r.color} stroke="var(--surface-2)" strokeWidth={1.5} /> : null;
                  })()}
                </g>
              ))}
              <circle cx={px(start)[0]} cy={px(start)[1]} r={5} fill="var(--surface)" stroke="var(--text)" strokeWidth={1.5} />
              {runs.map((r, k) => {
                const end = px(r.run.path.at(-1)!);
                const x = Math.max(4, Math.min(W - 70, end[0] + 6));
                const y = Math.max(12, Math.min(H - 4, end[1] - 6 - 12 * k));
                return (
                  <text key={r.id} x={x} y={y} fontSize={11} fill="var(--text)" style={{ paintOrder: "stroke" }} stroke="var(--surface-2)" strokeWidth={3}>
                    {r.label.split(" ")[0]}
                  </text>
                );
              })}
            </g>
          </svg>
          <div className="mt-1 flex justify-between text-[11px] text-faint">
            <span>Click to set the start point.</span>
            <span className="tabular-nums">{hover && inDomain(hover) ? `(${hover[0].toFixed(2)}, ${hover[1].toFixed(2)})  f = ${sci(surf.f(hover))}` : ""}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 text-xs">
          {usesValley && (
            <label>
              <span className="flex justify-between text-faint">
                <span>Condition number κ</span>
                <span className="tabular-nums text-ink">{kappa}</span>
              </span>
              <input type="range" min={1} max={100} value={kappa} onChange={(e) => setKappa(Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Condition number" />
            </label>
          )}
          <div className="flex flex-col gap-2">
            {OPTIMIZERS.map((o) => (
              <div key={o.id} className="rounded-lg border border-line p-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={enabled.includes(o.id)} onChange={() => toggle(o.id)} aria-label={o.label} />
                  <span className="inline-block h-0.5 w-4 rounded" style={{ background: o.color }} aria-hidden="true" />
                  <span className="text-ink">{o.label}</span>
                </label>
                {o.id === "gd" && (
                  <label className="mt-1 block">
                    <span className="flex justify-between text-faint">
                      <span>step = s / L (also used by momentum)</span>
                      <span className="tabular-nums text-ink">s = {params.s.toFixed(2)}</span>
                    </span>
                    <input type="range" min={0.05} max={2.2} step={0.05} value={params.s} onChange={(e) => setParams((p) => ({ ...p, s: Number(e.target.value) }))} className="w-full accent-[var(--accent)]" aria-label="Step size as a multiple of 1/L" />
                  </label>
                )}
                {o.id === "momentum" && (
                  <label className="mt-1 block">
                    <span className="flex justify-between text-faint">
                      <span>momentum β</span>
                      <span className="tabular-nums text-ink">{params.beta.toFixed(2)}</span>
                    </span>
                    <input type="range" min={0} max={0.99} step={0.01} value={params.beta} onChange={(e) => setParams((p) => ({ ...p, beta: Number(e.target.value) }))} className="w-full accent-[var(--accent)]" aria-label="Momentum" />
                  </label>
                )}
                {o.id === "adam" && (
                  <label className="mt-1 block">
                    <span className="flex justify-between text-faint">
                      <span>learning rate</span>
                      <span className="tabular-nums text-ink">{params.adamLr.toPrecision(2)}</span>
                    </span>
                    <input type="range" min={-2.5} max={0} step={0.05} value={Math.log10(params.adamLr)} onChange={(e) => setParams((p) => ({ ...p, adamLr: 10 ** Number(e.target.value) }))} className="w-full accent-[var(--accent)]" aria-label="Adam learning rate (log scale)" />
                  </label>
                )}
                {o.id === "newton" && <p className="mt-1 text-faint">Full steps, solving H d = −g.</p>}
              </div>
            ))}
          </div>
          <label>
            <span className="flex justify-between text-faint">
              <span>Iterations</span>
              <span className="tabular-nums text-ink">{steps}</span>
            </span>
            <input type="range" min={10} max={500} step={10} value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Number of iterations" />
          </label>
        </div>
      </div>

      <table className="mt-3 w-full text-left text-xs" aria-label="Results">
        <thead>
          <tr className="text-faint">
            <th className="py-1 font-normal">Optimizer</th>
            <th className="py-1 font-normal">f − f* after {steps} steps</th>
            <th className="py-1 font-normal">Reached f − f* &lt; 10⁻⁶</th>
          </tr>
        </thead>
        <tbody>
          {runs.length === 0 && (
            <tr>
              <td colSpan={3} className="py-1 text-faint">Tick an optimizer above.</td>
            </tr>
          )}
          {runs.map((r) => {
            const end = r.run.path.at(-1)!;
            const gap = surf.f(end) - surf.fmin;
            return (
              <tr key={r.id} className="border-t border-line" data-testid={`race-result-${r.id}`}>
                <td className="py-1">
                  <span className="mr-1.5 inline-block h-0.5 w-3 align-middle" style={{ background: r.color }} aria-hidden="true" />
                  {r.label}
                </td>
                <td className="py-1 tabular-nums">{r.run.diverged ? "diverged" : sci(gap)}</td>
                <td className="py-1 tabular-nums">{r.run.diverged ? "no" : r.run.converged === null ? "not yet" : `step ${r.run.converged}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sid === "saddle" && enabled.includes("newton") && <p className="mt-2 text-xs text-faint">Newton jumps to the nearest point where the gradient vanishes, and here that's the saddle.</p>}
    </div>
  );
}
