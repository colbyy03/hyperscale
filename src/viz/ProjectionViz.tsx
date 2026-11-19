/**
 * Projection of b onto the line through a: drag either arrow tip and watch the dot product, the
 * angle, the projection and the residual (always perpendicular to a) update.
 */
import { useRef, useState, type PointerEvent } from "react";

type V = [number, number];

export function project(a: V, b: V) {
  const aa = a[0] * a[0] + a[1] * a[1];
  const dot = a[0] * b[0] + a[1] * b[1];
  const na = Math.sqrt(aa);
  const nb = Math.hypot(b[0], b[1]);
  const t = aa > 0 ? dot / aa : 0;
  const p: V = [t * a[0], t * a[1]];
  const r: V = [b[0] - p[0], b[1] - p[1]];
  const cos = na > 0 && nb > 0 ? dot / (na * nb) : NaN;
  return { dot, na, nb, cos, p, r, scalar: na > 0 ? dot / na : NaN, residual: Math.hypot(r[0], r[1]) };
}

const PRESETS: Array<{ name: string; a: V; b: V }> = [
  { name: "acute", a: [3, 1], b: [1.5, 2.5] },
  { name: "orthogonal", a: [3, 1], b: [-1, 3] },
  { name: "parallel", a: [3, 1], b: [1.5, 0.5] },
  { name: "obtuse", a: [3, 1], b: [-2.5, 1] },
];

const W = 340;
const H = 260;
const S = 40; // pixels per unit
const O: V = [W / 2, H / 2 + 20];
const toPx = (v: V): V => [O[0] + S * v[0], O[1] - S * v[1]];
const f2 = (x: number) => (Number.isFinite(x) ? (Math.abs(x) < 5e-3 ? "0.00" : x.toFixed(2)) : "undefined");

function Arrow({ to, color, width = 2.5, from = [0, 0] as V }: { to: V; color: string; width?: number; from?: V }) {
  const [x1, y1] = toPx(from);
  const [x2, y2] = toPx(to);
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 1) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const hx = x2 - 9 * ux;
  const hy = y2 - 9 * uy;
  return (
    <g stroke={color} fill={color}>
      <line x1={x1} y1={y1} x2={hx} y2={hy} strokeWidth={width} />
      <polygon points={`${x2},${y2} ${hx - 4.5 * uy},${hy + 4.5 * ux} ${hx + 4.5 * uy},${hy - 4.5 * ux}`} stroke="none" />
    </g>
  );
}

export default function ProjectionViz() {
  const [a, setA] = useState<V>([3, 1]);
  const [b, setB] = useState<V>([1.5, 2.5]);
  const drag = useRef<"a" | "b" | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const info = project(a, b);

  const move = (e: PointerEvent<SVGSVGElement>) => {
    if (!drag.current || !svg.current) return;
    const ctm = svg.current.getScreenCTM();
    if (!ctm) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const v: V = [Math.round(((pt.x - O[0]) / S) * 10) / 10, Math.round(((O[1] - pt.y) / S) * 10) / 10];
    const clamped: V = [Math.max(-4, Math.min(4, v[0])), Math.max(-3, Math.min(3, v[1]))];
    (drag.current === "a" ? setA : setB)(clamped);
  };

  // The line through a, extended across the plot.
  const na = info.na || 1;
  const line: [V, V] = [
    [(-6 * a[0]) / na, (-6 * a[1]) / na],
    [(6 * a[0]) / na, (6 * a[1]) / na],
  ];
  // Right-angle marker at the foot of the perpendicular.
  const ua: V = [a[0] / na, a[1] / na];
  const ur: V = info.residual > 1e-6 ? [info.r[0] / info.residual, info.r[1] / info.residual] : [0, 0];
  const m = 0.22;
  const corner = [info.p, [info.p[0] - m * ua[0], info.p[1] - m * ua[1]], [info.p[0] - m * ua[0] + m * ur[0], info.p[1] - m * ua[1] + m * ur[1]], [info.p[0] + m * ur[0], info.p[1] + m * ur[1]]] as V[];
  const showCorner = info.residual > 0.3 && Math.hypot(info.p[0], info.p[1]) > 0.3;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4" data-testid="viz-projection">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full max-w-[21rem] touch-none rounded-xl border border-line bg-surface-2 select-none"
          role="img"
          aria-label="Vector b projected onto the line through vector a"
          onPointerMove={move}
          onPointerUp={() => (drag.current = null)}
          onPointerLeave={() => (drag.current = null)}
        >
          {Array.from({ length: 9 }, (_, i) => i - 4).map((k) => (
            <g key={k} stroke="var(--border)" opacity={0.5}>
              <line x1={toPx([k, -4])[0]} y1={0} x2={toPx([k, -4])[0]} y2={H} />
              <line x1={0} y1={toPx([0, k])[1]} x2={W} y2={toPx([0, k])[1]} />
            </g>
          ))}
          <line x1={toPx(line[0])[0]} y1={toPx(line[0])[1]} x2={toPx(line[1])[0]} y2={toPx(line[1])[1]} stroke="var(--faint)" strokeDasharray="4 4" />
          {showCorner && <polyline points={corner.map((c) => toPx(c).join(",")).join(" ")} fill="none" stroke="var(--muted)" strokeWidth={1} />}
          <line x1={toPx(info.p)[0]} y1={toPx(info.p)[1]} x2={toPx(b)[0]} y2={toPx(b)[1]} stroke="var(--muted)" strokeWidth={1.5} strokeDasharray="5 4" />
          <Arrow to={info.p} color="var(--violet)" width={5} />
          <Arrow to={a} color="var(--accent)" />
          <Arrow to={b} color="var(--heat)" />
          {(["a", "b"] as const).map((k) => {
            const [x, y] = toPx(k === "a" ? a : b);
            return (
              <g key={k} onPointerDown={(e) => { drag.current = k; (e.currentTarget.ownerSVGElement ?? e.currentTarget).setPointerCapture?.(e.pointerId); }} className="cursor-grab">
                <circle cx={x} cy={y} r={14} fill="transparent" />
                <circle cx={x} cy={y} r={5} fill={k === "a" ? "var(--accent)" : "var(--heat)"} stroke="var(--surface)" strokeWidth={2} />
                <text x={x + 9} y={y - 9} fontSize={13} fill={k === "a" ? "var(--accent)" : "var(--heat)"} fontWeight={600}>{k}</text>
              </g>
            );
          })}
        </svg>
        <div className="flex min-w-0 flex-col gap-3 text-sm">
          <div className="font-mono text-xs text-muted">
            a = ({a[0].toFixed(1)}, {a[1].toFixed(1)}) · b = ({b[0].toFixed(1)}, {b[1].toFixed(1)})
          </div>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
            <dt className="text-faint">a · b</dt>
            <dd className="tabular-nums" data-testid="dot-value">{f2(info.dot)}</dd>
            <dt className="text-faint">‖a‖, ‖b‖</dt>
            <dd className="tabular-nums">{f2(info.na)}, {f2(info.nb)}</dd>
            <dt className="text-faint">cos θ</dt>
            <dd className="tabular-nums" data-testid="cos-value">{f2(info.cos)}{Number.isFinite(info.cos) && <span className="text-xs text-faint"> (θ = {((Math.acos(Math.max(-1, Math.min(1, info.cos))) * 180) / Math.PI).toFixed(0)}°)</span>}</dd>
            <dt className="text-violet">projection</dt>
            <dd className="tabular-nums">({f2(info.p[0])}, {f2(info.p[1])}) <span className="text-xs text-faint">= (a·b / a·a) a</span></dd>
            <dt className="text-faint">residual ‖b − p‖</dt>
            <dd className="tabular-nums">{f2(info.residual)} <span className="text-xs text-faint">(⟂ a: a · r = {f2(a[0] * info.r[0] + a[1] * info.r[1])})</span></dd>
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((pr) => (
              <button key={pr.name} onClick={() => { setA(pr.a); setB(pr.b); }} className="rounded-lg border border-line px-2 py-1 text-xs text-muted hover:border-line-strong hover:text-ink">
                {pr.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-faint">
            Drag the tips of <span className="text-accent">a</span> and <span className="text-heat">b</span>. The <span className="text-violet">projection</span> is the closest point to b on the dashed line through a, so the residual meets that line at a right angle. When a · b is negative, the projection points backwards.
          </p>
        </div>
      </div>
    </div>
  );
}
