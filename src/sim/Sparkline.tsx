/** A small, dependency-free SVG line chart over one simulated day (x in hours, 0-24). */
import { useId } from "react";

export function Sparkline({
  points,
  label,
  format,
  threshold,
  thresholdLabel,
  tone = "accent",
  height = 72,
}: {
  points: Array<{ x: number; y: number }>;
  label: string;
  format: (y: number) => string;
  threshold?: number;
  thresholdLabel?: string;
  tone?: "accent" | "heat" | "info";
  height?: number;
}) {
  const id = useId();
  const W = 320;
  const H = height;
  const pad = { l: 4, r: 4, t: 8, b: 14 };
  const ys = points.map((p) => p.y);
  if (threshold !== undefined) ys.push(threshold);
  let lo = ys.length ? Math.min(...ys) : 0;
  let hi = ys.length ? Math.max(...ys) : 1;
  if (hi - lo < 1e-6) {
    lo -= 0.5;
    hi += 0.5;
  }
  const span = hi - lo;
  lo -= span * 0.1;
  hi += span * 0.1;
  const x = (h: number) => pad.l + (h / 24) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const step = Math.max(1, Math.floor(points.length / 300));
  const path = points
    .filter((_, i) => i % step === 0 || i === points.length - 1)
    .map((p, i) => `${i ? "L" : "M"}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`)
    .join(" ");
  const last = points.at(-1);
  const stroke = tone === "heat" ? "var(--heat)" : tone === "info" ? "var(--info)" : "var(--accent)";
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1 flex items-baseline justify-between gap-2 text-xs text-faint">
        <span id={id}>{label}</span>
        {last && <span className="font-medium text-ink tabular-nums">{format(last.y)}</span>}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-labelledby={id} preserveAspectRatio="none">
        {[0, 6, 12, 18, 24].map((h) => (
          <g key={h}>
            <line x1={x(h)} x2={x(h)} y1={pad.t} y2={H - pad.b} stroke="var(--border)" strokeWidth={1} />
            <text x={x(h)} y={H - 2} fontSize={9} fill="var(--faint)" textAnchor={h === 0 ? "start" : h === 24 ? "end" : "middle"}>
              {String(h).padStart(2, "0")}:00
            </text>
          </g>
        ))}
        {threshold !== undefined && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={y(threshold)} y2={y(threshold)} stroke="var(--danger)" strokeDasharray="4 3" strokeWidth={1} />
            {thresholdLabel && (
              <text x={W - pad.r} y={y(threshold) - 3} fontSize={9} fill="var(--danger)" textAnchor="end">
                {thresholdLabel}
              </text>
            )}
          </g>
        )}
        {path && <path d={path} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
      </svg>
    </figure>
  );
}
