/**
 * PI control of a CRAH's supply air: tune Kp, the integral time and the dead time, toggle
 * anti-windup, and watch a setpoint step and a load surge that saturates the valve. The closed-loop
 * poles sit beside the unit circle, with the spectral radius and the oscillation period.
 */
import clsx from "clsx";
import { useMemo, useState, type PointerEvent } from "react";
import { describePoles, poles, simulate, type Tuning } from "./pi-loop-engine";

const PRESETS: Array<{ name: string; tuning: Tuning }> = [
  { name: "Commissioning", tuning: { kp: 0.1875, ti: 90, deadtime: 30, antiWindup: true } },
  { name: "BMS upgrade (Ti ÷ 4)", tuning: { kp: 0.1875, ti: 22.5, deadtime: 30, antiWindup: true } },
  { name: "No anti-windup", tuning: { kp: 0.1875, ti: 90, deadtime: 30, antiWindup: false } },
  { name: "Long dead time", tuning: { kp: 0.1875, ti: 90, deadtime: 60, antiWindup: true } },
];

const W = 360;
const L = 34; // left margin
const R = 8;
const MINUTES = 30;
const x = (t: number) => L + ((W - L - R) * t) / MINUTES;

function LineChart({ title, height, t, series, yRange, ticks, unit, hover, onHover, testId }: {
  title: string;
  height: number;
  t: number[];
  series: Array<{ values: number[]; color: string; dashed?: boolean }>;
  yRange: [number, number];
  ticks: number[];
  unit: string;
  hover: number | null;
  onHover: (i: number | null) => void;
  testId: string;
}) {
  const top = 6;
  const bottom = height - 16;
  const y = (v: number) => bottom - ((bottom - top) * (Math.min(yRange[1], Math.max(yRange[0], v)) - yRange[0])) / (yRange[1] - yRange[0]);
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const ctm = e.currentTarget.getScreenCTM();
    if (!ctm) return;
    const px = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()).x;
    const tm = ((px - L) / (W - L - R)) * MINUTES;
    if (tm < 0 || tm > MINUTES) return onHover(null);
    onHover(Math.max(0, Math.min(t.length - 1, Math.round((tm / MINUTES) * (t.length - 1)))));
  };
  return (
    <figure className="min-w-0">
      <figcaption className="mb-0.5 text-xs text-faint">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={title} onPointerMove={move} onPointerLeave={() => onHover(null)} data-testid={testId}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
            <text x={L - 4} y={y(v) + 3} fontSize={9} textAnchor="end" fill="var(--faint)">
              {v}
              {unit}
            </text>
          </g>
        ))}
        {[0, 10, 20, 30].map((m) => (
          <text key={m} x={x(m)} y={height - 3} fontSize={9} textAnchor={m === 0 ? "start" : m === MINUTES ? "end" : "middle"} fill="var(--faint)">
            {m} min
          </text>
        ))}
        {series.map((s, k) => (
          <polyline key={k} points={s.values.map((v, i) => `${x(t[i]!).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} fill="none" stroke={s.color} strokeWidth={s.dashed ? 1.2 : 2} strokeDasharray={s.dashed ? "4 3" : undefined} />
        ))}
        {hover !== null && <line x1={x(t[hover]!)} x2={x(t[hover]!)} y1={top} y2={bottom} stroke="var(--muted)" strokeWidth={1} />}
      </svg>
    </figure>
  );
}

export default function PILoop() {
  const [tuning, setTuning] = useState<Tuning>(PRESETS[0]!.tuning);
  const [hover, setHover] = useState<number | null>(null);
  const trace = useMemo(() => simulate(tuning, MINUTES), [tuning]);
  const ps = useMemo(() => poles(tuning.kp, tuning.ti, tuning.deadtime), [tuning.kp, tuning.ti, tuning.deadtime]);
  const { radius, period } = describePoles(ps);
  const set = (patch: Partial<Tuning>) => setTuning((cur) => ({ ...cur, ...patch }));
  const verdict =
    radius < 0.995
      ? `stable: disturbances shrink by ${((1 - radius) * 100).toFixed(1)}% per 10 s step${Number.isFinite(period) ? `, ringing with a ${Math.round(period)} s period` : ""}`
      : radius <= 1.005
        ? `on the edge: a sustained oscillation${Number.isFinite(period) ? ` every ${Math.round(period)} s` : ""}`
        : `unstable: oscillations grow${Number.isFinite(period) ? ` with a ${Math.round(period)} s period` : ""} until the valve limits cap them`;
  const S = 120;
  const c = S / 2;
  const sc = S / 2.6;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4" data-testid="viz-piloop">
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="Presets">
        {PRESETS.map((p) => {
          const active = JSON.stringify(p.tuning) === JSON.stringify(tuning);
          return (
            <button key={p.name} onClick={() => setTuning(p.tuning)} aria-pressed={active} className={clsx("rounded-lg border px-2 py-1 text-xs", active ? "border-accent/50 bg-accent-soft text-accent" : "border-line text-muted hover:text-ink")}>
              {p.name}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
        <div className="flex min-w-0 flex-col gap-2">
          <LineChart title="Supply air (°C) and its setpoint (dashed)" height={130} t={trace.t} series={[{ values: trace.setpoint, color: "var(--muted)", dashed: true }, { values: trace.temp, color: "var(--cat-1)" }]} yRange={[14, 22]} ticks={[14, 16, 18, 20, 22]} unit="" hover={hover} onHover={setHover} testId="piloop-temp" />
          <LineChart title="Chilled-water valve (%)" height={90} t={trace.t} series={[{ values: trace.valve.map((v) => v * 100), color: "var(--cat-2)" }]} yRange={[0, 100]} ticks={[0, 50, 100]} unit="" hover={hover} onHover={setHover} testId="piloop-valve" />
          <p className="min-h-4 text-xs text-muted tabular-nums" aria-live="polite">
            {hover !== null ? `t = ${trace.t[hover]!.toFixed(1)} min · supply air ${trace.temp[hover]!.toFixed(2)} °C (setpoint ${trace.setpoint[hover]}) · valve ${(trace.valve[hover]! * 100).toFixed(0)}%` : "Setpoint 18 → 17 °C at 1 min; a load surge the coil can't fully meet from 10 to 18 min."}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-3 text-xs">
          <label>
            <span className="flex justify-between text-faint">
              <span>Kp</span>
              <span className="tabular-nums text-ink">{tuning.kp.toFixed(3)}</span>
            </span>
            <input type="range" min={0.02} max={0.6} step={0.005} value={tuning.kp} onChange={(e) => set({ kp: Number(e.target.value) })} className="w-full accent-[var(--accent)]" aria-label="Proportional gain" />
          </label>
          <label>
            <span className="flex justify-between text-faint">
              <span>Integral time Ti</span>
              <span className="tabular-nums text-ink">{tuning.ti.toFixed(0)} s</span>
            </span>
            <input type="range" min={10} max={200} step={2.5} value={tuning.ti} onChange={(e) => set({ ti: Number(e.target.value) })} className="w-full accent-[var(--accent)]" aria-label="Integral time" />
          </label>
          <label>
            <span className="flex justify-between text-faint">
              <span>Dead time</span>
              <span className="tabular-nums text-ink">{tuning.deadtime} s</span>
            </span>
            <input type="range" min={0} max={60} step={10} value={tuning.deadtime} onChange={(e) => set({ deadtime: Number(e.target.value) })} className="w-full accent-[var(--accent)]" aria-label="Dead time" />
          </label>
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" checked={tuning.antiWindup} onChange={(e) => set({ antiWindup: e.target.checked })} />
            Anti-windup
          </label>
          <figure>
            <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-32" role="img" aria-label={`Closed-loop poles; spectral radius ${radius.toFixed(3)}`}>
              <line x1={0} x2={S} y1={c} y2={c} stroke="var(--border)" />
              <line x1={c} x2={c} y1={0} y2={S} stroke="var(--border)" />
              <circle cx={c} cy={c} r={sc} fill="none" stroke="var(--muted)" strokeDasharray="3 3" />
              {ps.map(([re, im], k) => (
                <circle key={k} cx={c + sc * re} cy={c - sc * im} r={4} fill={Math.hypot(re, im) > 1 ? "var(--danger)" : "var(--cat-1)"} stroke="var(--surface)" strokeWidth={1.5} />
              ))}
            </svg>
            <figcaption className="text-faint">Poles and the unit circle</figcaption>
          </figure>
          <p className="text-muted" data-testid="piloop-verdict">
            Spectral radius <span className="tabular-nums text-ink">{radius.toFixed(3)}</span>: {verdict}.
          </p>
        </div>
      </div>
    </div>
  );
}
