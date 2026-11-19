/**
 * POD of a pod's rack-inlet temperature field: snapshots, the mean field, the dominant modes, a
 * k-mode reconstruction and its error, with each mode's share of the energy. Toggle centering off
 * to see the classic pitfall: the first "mode" becomes the mean field and claims 99.9%.
 */
import clsx from "clsx";
import { useMemo, useState } from "react";
import { HEIGHTS, HOURS, RACKS, ROWS, makeField, pod, reconstruct, sensorIndex } from "./fieldData";

type View = "snapshot" | "mean" | "mode0" | "mode1" | "mode2" | "fit" | "error";
const VIEWS: Array<{ id: View; label: string }> = [
  { id: "snapshot", label: "Snapshot" },
  { id: "mean", label: "Mean field" },
  { id: "mode0", label: "Mode 1" },
  { id: "mode1", label: "Mode 2" },
  { id: "mode2", label: "Mode 3" },
  { id: "fit", label: "k-mode fit" },
  { id: "error", label: "Fit error" },
];
const HEIGHT_NAMES = ["low", "mid", "top"];
const T_RANGE: [number, number] = [16, 26];
const ERR_RANGE = 0.5;

const seq = (v: number) => {
  const t = Math.max(0, Math.min(1, (v - T_RANGE[0]) / (T_RANGE[1] - T_RANGE[0])));
  return `color-mix(in oklab, var(--seq-hi) ${(t * 100).toFixed(1)}%, var(--seq-lo))`;
};
const div = (v: number, max: number) => {
  const t = Math.max(-1, Math.min(1, v / max));
  return `color-mix(in oklab, var(${t >= 0 ? "--div-pos" : "--div-neg"}) ${(Math.abs(t) * 100).toFixed(1)}%, var(--div-mid))`;
};
const when = (hour: number) => `day ${Math.floor(hour / 24) + 1}, ${String(hour % 24).padStart(2, "0")}:00`;

// Heatmap geometry (viewBox units).
const W = 640;
const LABEL = 52;
const CW = (W - LABEL - 4) / RACKS;
const CH = 20;
const STRIP = HEIGHTS * CH;
const GAP = 18;
const H = 14 + ROWS * STRIP + (ROWS - 1) * GAP + 22;
const cellXY = (row: number, rack: number, height: number) => [LABEL + rack * CW, 14 + row * (STRIP + GAP) + (HEIGHTS - 1 - height) * CH] as const;

// Energy chart geometry.
const EW = 300;
const EH = 128;
const EL = 40;
const LOG_MIN = -5; // 0.001%
const ey = (frac: number) => {
  const l = Math.log10(Math.max(frac, 10 ** LOG_MIN));
  return 16 + ((0 - l) / (0 - LOG_MIN)) * (EH - 34);
};

export default function FieldModes() {
  const data = useMemo(() => makeField(), []);
  const [centered, setCentered] = useState(true);
  const model = useMemo(() => pod(data, centered), [data, centered]);
  const [view, setView] = useState<View>("snapshot");
  const [hour, setHour] = useState(7 * 24 + 15);
  const [k, setK] = useState(3);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const [table, setTable] = useState(false);

  const x = data[hour]!;
  const fit = useMemo(() => reconstruct(x, model.mean, model.modes, k), [x, model, k]);
  const modeIdx = view.startsWith("mode") ? Number(view.slice(4)) : -1;
  const modeMax = modeIdx >= 0 ? Math.max(...model.modes[modeIdx]!.map(Math.abs)) : 1;
  const values: Float64Array =
    view === "snapshot" ? x : view === "mean" ? model.mean : modeIdx >= 0 ? model.modes[modeIdx]! : view === "fit" ? fit : fit.map((v, i) => v - x[i]!);
  const color = (v: number) => (modeIdx >= 0 ? div(v, modeMax) : view === "error" ? div(v, ERR_RANGE) : seq(v));
  const fmt = (v: number) => (modeIdx >= 0 ? v.toFixed(3) : view === "error" ? `${v >= 0 ? "+" : ""}${v.toFixed(2)} °C` : `${v.toFixed(1)} °C`);
  let se = 0;
  for (let i = 0; i < x.length; i++) se += (fit[i]! - x[i]!) ** 2;
  const rms = Math.sqrt(se / x.length);
  const captured = model.energy.slice(0, k).reduce((s, e) => s + e, 0);
  const usesHour = view === "snapshot" || view === "fit" || view === "error";

  const caption =
    view === "snapshot"
      ? `Measured field at ${when(hour)}`
      : view === "mean"
        ? centered
          ? "Average of all 480 snapshots: the fixed part of the field"
          : "No mean was subtracted, so there is no separate mean field"
        : modeIdx >= 0
          ? `Mode ${modeIdx + 1}: ${(100 * model.energy[modeIdx]!).toFixed(modeIdx === 0 ? 2 : 1)}% of the energy (signs are arbitrary)`
          : view === "fit"
            ? `${centered ? "Mean + " : ""}${k} mode${k > 1 ? "s" : ""} at ${when(hour)}`
            : `Fit minus measurement at ${when(hour)} (RMS ${rms.toFixed(2)} °C)`;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4" data-testid="viz-fieldmodes">
      <div className="mb-3 flex flex-wrap gap-1.5" role="group" aria-label="What to show">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            aria-pressed={view === v.id}
            disabled={v.id === "mean" && !centered}
            className={clsx("rounded-lg border px-2 py-1 text-xs disabled:opacity-40", view === v.id ? "border-accent/50 bg-accent-soft text-accent" : "border-line text-muted hover:text-ink")}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="text-sm font-medium" data-testid="field-caption">{caption}</div>
      <div className="relative mt-2" onPointerLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${caption}: a heat map of 72 inlet sensors, two rows of 12 racks with sensors at three heights`}>
          {Array.from({ length: ROWS }, (_, r) => (
            <g key={r}>
              <text x={0} y={14 + r * (STRIP + GAP) + STRIP / 2 + 4} fontSize={12} fill="var(--muted)">Row {"AB"[r]}</text>
              {Array.from({ length: RACKS }, (_, rack) =>
                Array.from({ length: HEIGHTS }, (_, h) => {
                  const i = sensorIndex(r, rack, h);
                  const [cx, cy] = cellXY(r, rack, h);
                  const v = values[i]!;
                  return (
                    <rect
                      key={`${rack}-${h}`}
                      x={cx + 1}
                      y={cy + 1}
                      width={CW - 2}
                      height={CH - 2}
                      rx={3}
                      style={{ fill: color(v) }}
                      onPointerEnter={() => setHover({ x: (cx + CW / 2) / W, y: cy / H, text: `Row ${"AB"[r]} · rack ${rack + 1} · ${HEIGHT_NAMES[h]}: ${fmt(v)}` })}
                    />
                  );
                }),
              )}
            </g>
          ))}
          {Array.from({ length: RACKS }, (_, rack) => (
            <text key={rack} x={LABEL + rack * CW + CW / 2} y={H - 6} fontSize={10} textAnchor="middle" fill="var(--faint)">
              {rack + 1}
            </text>
          ))}
          <text x={LABEL} y={10} fontSize={10} fill="var(--faint)">← CRAH end</text>
          <text x={W - 4} y={10} fontSize={10} textAnchor="end" fill="var(--faint)">far end →</text>
        </svg>
        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border border-line bg-surface-3 px-2 py-1 text-xs whitespace-nowrap shadow"
            // Anchor the tip's left or right edge near the sides so it never spills past the card.
            style={{ left: `${hover.x * 100}%`, top: `${hover.y * 100}%`, transform: `translate(${hover.x < 0.3 ? "-10%" : hover.x > 0.7 ? "-90%" : "-50%"}, -100%)` }}
            role="status"
          >
            {hover.text}
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 text-[11px] text-faint">
        <span>{modeIdx >= 0 ? `−${modeMax.toFixed(2)}` : view === "error" ? `−${ERR_RANGE} °C` : `${T_RANGE[0]} °C`}</span>
        <span
          className="h-2 w-32 rounded-full"
          style={{
            background:
              modeIdx >= 0 || view === "error"
                ? "linear-gradient(to right in oklab, var(--div-neg), var(--div-mid), var(--div-pos))"
                : "linear-gradient(to right in oklab, var(--seq-lo), var(--seq-hi))",
          }}
          aria-hidden="true"
        />
        <span>{modeIdx >= 0 ? `+${modeMax.toFixed(2)}` : view === "error" ? `+${ERR_RANGE} °C` : `${T_RANGE[1]} °C`}</span>
        <button onClick={() => setTable((t) => !t)} className="ml-auto rounded-md border border-line px-2 py-0.5 text-muted hover:text-ink" aria-pressed={table}>
          {table ? "Hide table" : "Table"}
        </button>
      </div>

      {table && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-right text-[11px] tabular-nums">
            <thead>
              <tr className="text-faint">
                <th className="pr-2 text-left font-normal">sensor</th>
                {Array.from({ length: RACKS }, (_, r) => (
                  <th key={r} className="px-1 font-normal">{r + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, r) =>
                [2, 1, 0].map((h) => (
                  <tr key={`${r}-${h}`}>
                    <td className="pr-2 text-left text-faint">{"AB"[r]} {HEIGHT_NAMES[h]}</td>
                    {Array.from({ length: RACKS }, (_, rack) => (
                      <td key={rack} className="px-1">{modeIdx >= 0 ? values[sensorIndex(r, rack, h)]!.toFixed(2) : values[sensorIndex(r, rack, h)]!.toFixed(view === "error" ? 2 : 1)}</td>
                    ))}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
        <div className="flex min-w-0 flex-col gap-3 text-xs">
          <label className={clsx(!usesHour && "opacity-50")}>
            <span className="flex justify-between text-faint">
              <span>Hour</span>
              <span className="tabular-nums text-ink">{when(hour)}</span>
            </span>
            <input type="range" min={0} max={HOURS - 1} value={hour} onChange={(e) => setHour(Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Hour of the snapshot" disabled={!usesHour} />
          </label>
          <label>
            <span className="flex justify-between text-faint">
              <span>Modes kept, k</span>
              <span className="tabular-nums text-ink">{k}</span>
            </span>
            <input type="range" min={1} max={8} value={k} onChange={(e) => setK(Number(e.target.value))} className="w-full accent-[var(--accent)]" aria-label="Number of modes kept" />
          </label>
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" checked={centered} onChange={(e) => { setCentered(e.target.checked); if (!e.target.checked && view === "mean") setView("mode0"); }} />
            Subtract the mean field first
          </label>
          <p className="text-muted" data-testid="field-summary">
            {k} mode{k > 1 ? "s" : ""} capture <span className="text-ink tabular-nums">{(100 * captured).toFixed(2)}%</span> of the energy; at this hour the fit is off by <span className="text-ink tabular-nums">{rms.toFixed(2)} °C</span> RMS (sensor noise is 0.08 °C).
          </p>
          <p className="text-faint">Days 7–9: supply setpoint raised 2 °C. Days 15–16: lowered 1 °C. Loads peak in the afternoon; CRAH fans slow down at night.</p>
        </div>
        <figure className="min-w-0">
          <figcaption className="mb-1 text-xs text-faint">Energy per mode (log scale)</figcaption>
          <svg viewBox={`0 0 ${EW} ${EH}`} className="w-full" role="img" aria-label={`Energy captured by modes 1 to 8: ${model.energy.slice(0, 8).map((e) => `${(100 * e).toFixed(3)}%`).join(", ")}`}>
            {[0, -1, -2, -3, -4, -5].map((l) => (
              <g key={l}>
                <line x1={EL} x2={EW} y1={ey(10 ** l)} y2={ey(10 ** l)} stroke="var(--border)" strokeWidth={1} />
                <text x={EL - 4} y={ey(10 ** l) + 3} fontSize={9} textAnchor="end" fill="var(--faint)">
                  {l >= -2 ? `${10 ** (l + 2)}%` : `${(10 ** (l + 2)).toFixed(-l - 2)}%`}
                </text>
              </g>
            ))}
            {model.energy.slice(0, 8).map((e, m) => {
              const bw = (EW - EL) / 8;
              const x0 = EL + m * bw + 3;
              const y0 = ey(e);
              const base = ey(10 ** LOG_MIN);
              const cum = model.energy.slice(0, m + 1).reduce((s, v) => s + v, 0);
              return (
                <g key={m} onPointerEnter={() => setHover(null)}>
                  <path d={`M${x0},${base} V${y0 + 4} q0,-4 4,-4 h${bw - 14} q4,0 4,4 V${base} Z`} fill={m < k ? "var(--info)" : "var(--surface-3)"} stroke={m < k ? "none" : "var(--border-strong)"}>
                    <title>{`Mode ${m + 1}: ${(100 * e).toFixed(3)}% (cumulative ${(100 * cum).toFixed(2)}%)`}</title>
                  </path>
                  {m < 4 && (
                    <text x={x0 + (bw - 6) / 2} y={y0 - 3} fontSize={9} textAnchor="middle" fill="var(--muted)">
                      {e >= 0.01 ? `${(100 * e).toFixed(1)}%` : `${(100 * e).toFixed(2)}%`}
                    </text>
                  )}
                  <text x={x0 + (bw - 6) / 2} y={EH - 4} fontSize={9} textAnchor="middle" fill="var(--faint)">{m + 1}</text>
                </g>
              );
            })}
          </svg>
        </figure>
      </div>
    </div>
  );
}
