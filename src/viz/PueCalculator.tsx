/**
 * PUE explainer: slide the facility's loads and watch Power Usage Effectiveness respond.
 * PUE = total facility energy / IT energy (The Green Grid; ISO/IEC 30134-2).
 */
import { useState } from "react";

interface Load {
  key: string;
  label: string;
  color: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  initial: number;
}

const LOADS: Load[] = [
  { key: "it", label: "IT equipment", color: "var(--accent)", min: 1, max: 10, step: 0.1, unit: "MW", initial: 4.8 },
  { key: "plant", label: "Chillers, towers, pumps", color: "var(--info)", min: 0, max: 3, step: 0.05, unit: "MW", initial: 0.85 },
  { key: "fans", label: "Air-handler fans", color: "var(--violet)", min: 0, max: 1, step: 0.01, unit: "MW", initial: 0.24 },
  { key: "losses", label: "Power-chain losses", color: "var(--heat)", min: 1, max: 12, step: 0.5, unit: "% of IT", initial: 6 },
  { key: "other", label: "Lighting and offices", color: "var(--faint)", min: 0, max: 0.3, step: 0.01, unit: "MW", initial: 0.04 },
];

export default function PueCalculator() {
  const [v, setV] = useState<Record<string, number>>(() => Object.fromEntries(LOADS.map((l) => [l.key, l.initial])));
  const it = v.it!;
  const parts = [
    { key: "it", mw: it },
    { key: "plant", mw: v.plant! },
    { key: "fans", mw: v.fans! },
    { key: "losses", mw: (v.losses! / 100) * it },
    { key: "other", mw: v.other! },
  ];
  const total = parts.reduce((s, p) => s + p.mw, 0);
  const pue = total / it;
  const band = pue <= 1.15 ? "var(--accent)" : pue <= 1.4 ? "var(--info)" : "var(--heat)";
  const scaleMax = 2.0;
  const pos = (x: number) => `${Math.min(100, Math.max(0, ((x - 1) / (scaleMax - 1)) * 100))}%`;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5" data-testid="viz-pue">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wider text-faint uppercase">Power usage effectiveness</div>
          <div className="text-4xl font-semibold tabular-nums" style={{ color: band }} data-testid="pue-value">
            {pue.toFixed(2)}
          </div>
        </div>
        <div className="text-right text-sm text-muted">
          Of every 100 kWh drawn, <span className="font-semibold text-ink tabular-nums">{((it / total) * 100).toFixed(0)}</span> reach the servers.
          <div className="text-xs text-faint tabular-nums">
            Facility {total.toFixed(2)} MW · overhead {((total - it) * 8.76).toFixed(1)} GWh/yr
          </div>
        </div>
      </div>

      {/* PUE scale with reference markers */}
      <div className="relative mt-4 h-8">
        <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-gradient-to-r from-[var(--accent)] via-[var(--info)] to-[var(--heat)] opacity-40" />
        <div className="absolute top-1.5 h-5 w-1 -translate-x-1/2 rounded bg-ink" style={{ left: pos(pue) }} aria-hidden="true" />
        <div className="absolute top-6 -translate-x-1/2 text-[10px] text-faint" style={{ left: pos(1.09) }}>
          hyperscale ≈1.09
        </div>
        <div className="absolute top-6 -translate-x-1/2 text-[10px] text-faint" style={{ left: pos(1.52) }}>
          industry avg 1.52
        </div>
      </div>

      {/* Stacked bar of facility power */}
      <div className="mt-6 flex h-4 overflow-hidden rounded-full" aria-label="Facility power breakdown">
        {parts.map((p) => {
          const l = LOADS.find((x) => x.key === p.key)!;
          return <div key={p.key} style={{ width: `${(p.mw / total) * 100}%`, background: l.color }} title={`${l.label}: ${p.mw.toFixed(2)} MW`} />;
        })}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {LOADS.map((l) => (
          <label key={l.key} className="text-sm">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                {l.label}
              </span>
              <span className="text-muted tabular-nums">
                {v[l.key]!.toFixed(l.step < 0.1 ? 2 : 1)} {l.unit}
              </span>
            </div>
            <input
              type="range"
              min={l.min}
              max={l.max}
              step={l.step}
              value={v[l.key]}
              onChange={(e) => setV((s) => ({ ...s, [l.key]: Number(e.target.value) }))}
              className="w-full accent-[var(--accent)]"
              aria-label={l.label}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
