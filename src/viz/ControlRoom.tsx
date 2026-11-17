/**
 * The Plant Control Room: Hall A's simulator (python/sim, hyperscale_sim) running in its own
 * Pyodide worker. Manual mode: you set the setpoints; the building's own loops (valves,
 * staging, towers, economizer) do the rest. A full simulated day scores your settings.
 */
import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { AlertTriangle, Fan, Pause, Play, Power, RotateCcw, Save, Snowflake, Trophy, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Badge, Button } from "@/components/ui";
import { db } from "@/db";
import { simPython, usePythonStatus } from "@/runtime/python";
import { Sparkline } from "@/sim/Sparkline";
import { DEFAULT_CONTROLS, type Kpis, type ScenarioInfo, type SeriesPoint, type SimControls, type Snapshot } from "@/sim/types";

const SPEEDS = [
  { id: "1", label: "1 h/s", seconds: 720, intervalMs: 200 },
  { id: "3", label: "3 h/s", seconds: 2160, intervalMs: 200 },
  { id: "max", label: "Max", seconds: 3 * 3600, intervalMs: 0 },
] as const;

const SCENARIO_FALLBACK: ScenarioInfo[] = [
  { id: "summer-day", title: "Summer day", summary: "", tags: [] },
  { id: "shoulder-day", title: "Spring day", summary: "", tags: [] },
  { id: "heat-wave", title: "Heat-wave day", summary: "", tags: [] },
  { id: "winter-day", title: "Winter day", summary: "", tags: [] },
];

const referenceCache = new Map<string, Promise<Kpis>>();
function referenceFor(scenario: string): Promise<Kpis> {
  let p = referenceCache.get(scenario);
  if (!p) {
    p = simPython.sim<{ kpis: Kpis }>({ op: "reference", scenario }).then((r) => r.kpis);
    referenceCache.set(scenario, p);
  }
  return p;
}

/** Inlet-temperature colour: cool teal at 18 °C, amber at 27 °C, red past 32 °C. */
function heatColor(t: number, alpha = 1): string {
  const stops: Array<[number, [number, number, number]]> = [
    [18, [56, 189, 248]],
    [24, [45, 212, 191]],
    [27, [245, 165, 36]],
    [32, [248, 113, 113]],
  ];
  if (t <= stops[0]![0]) return `rgb(${stops[0]![1].join(" ")} / ${alpha})`;
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i]!;
    const [t0, c0] = stops[i - 1]!;
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return `rgb(${c0.map((c, k) => Math.round(c + (c1[k]! - c) * f)).join(" ")} / ${alpha})`;
    }
  }
  return `rgb(${stops.at(-1)![1].join(" ")} / ${alpha})`;
}

const clock = (t: number) => {
  const h = Math.floor(t / 3600) % 24;
  const m = Math.floor((t % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fmt = (x: number | null | undefined, d = 1) => (x === null || x === undefined || !Number.isFinite(x) ? "–" : x.toFixed(d));

function Slider({ label, value, min, max, step, unit, onChange, hint, disabled }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void; hint?: string; disabled?: boolean }) {
  return (
    <label className={clsx("block", disabled && "opacity-50")}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <input type="range" className="mt-1.5 w-full accent-[var(--accent)]" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} />
      {hint && <div className="mt-0.5 text-xs text-faint">{hint}</div>}
    </label>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ id: T; label: string }>; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={clsx("rounded-md px-2.5 py-1 text-xs whitespace-nowrap transition-colors", value === o.id ? "bg-surface-3 font-semibold text-ink" : "text-muted hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "danger" | "accent" }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface p-3">
      <div className="truncate text-xs text-faint">{label}</div>
      <div className={clsx("mt-0.5 text-lg font-semibold tabular-nums", tone === "danger" && "text-danger", tone === "accent" && "text-accent")}>{value}</div>
      {sub && <div className="truncate text-xs text-muted">{sub}</div>}
    </div>
  );
}

type Phase = "off" | "starting" | "ready" | "running" | "done" | "error";

export default function ControlRoom({ scenario: initialScenario = "summer-day" }: { scenario?: string }) {
  const status = usePythonStatus(simPython);
  const [phase, setPhase] = useState<Phase>("off");
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>(SCENARIO_FALLBACK);
  const [scenario, setScenario] = useState(initialScenario);
  const [controls, setControls] = useState<SimControls>(DEFAULT_CONTROLS);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]["id"]>("1");
  const [simId, setSimId] = useState<number | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [series, setSeries] = useState<SeriesPoint[]>([]);
  const [faults, setFaults] = useState(false);
  const [adjusted, setAdjusted] = useState(false);
  const [reference, setReference] = useState<Kpis | null>(null);
  const [saved, setSaved] = useState(false);
  const simRef = useRef<number | null>(null);

  const create = useCallback(async (scenarioId: string, ctl: SimControls) => {
    if (simRef.current !== null) void simPython.sim({ op: "dispose", id: simRef.current }).catch(() => undefined);
    const s = await simPython.sim<Snapshot>({ op: "create", scenario: scenarioId, controls: ctl });
    simRef.current = s.id ?? null;
    setSimId(s.id ?? null);
    setSnap(s);
    setSeries([]);
    setFaults(false);
    setAdjusted(false);
    setSaved(false);
    setReference(null);
    setPhase("ready");
  }, []);

  const powerOn = async () => {
    setPhase("starting");
    setError(null);
    try {
      await simPython.warm();
      const list = await simPython.sim<{ scenarios: ScenarioInfo[] }>({ op: "scenarios" });
      setScenarios(list.scenarios);
      await create(scenario, controls);
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  };

  useEffect(
    () => () => {
      if (simRef.current !== null) void simPython.sim({ op: "dispose", id: simRef.current }).catch(() => undefined);
    },
    [],
  );

  // The run loop: advance a slice, draw it, repeat until the day ends or you pause.
  useEffect(() => {
    if (phase !== "running" || simId === null) return;
    let alive = true;
    const sp = SPEEDS.find((s) => s.id === speed)!;
    const loop = async () => {
      while (alive) {
        const t0 = performance.now();
        const r = await simPython.sim<Snapshot>({ op: "advance", id: simId, seconds: sp.seconds });
        setSnap(r);
        setSeries((s) => s.concat(r.points ?? []));
        if (r.done) {
          setPhase("done");
          return;
        }
        if (!alive) return;
        const wait = sp.intervalMs - (performance.now() - t0);
        if (wait > 0) await new Promise((res) => setTimeout(res, wait));
      }
    };
    loop().catch((e: Error) => {
      setError(e.message);
      setPhase("error");
    });
    return () => {
      alive = false;
    };
  }, [phase, simId, speed]);

  useEffect(() => {
    if (phase === "done") void referenceFor(scenario).then(setReference);
  }, [phase, scenario]);

  const applyControls = (patch: Partial<SimControls>) => {
    const next = { ...controls, ...patch };
    setControls(next);
    if (snap && snap.t > 0) setAdjusted(true);
    if (simId !== null) void simPython.sim<Snapshot>({ op: "controls", id: simId, controls: next }).then((r) => setSnap((s) => (s ? { ...s, controls: r.controls } : r)));
  };

  const inject = (kind: string, args: Record<string, unknown> = {}) => {
    if (simId === null) return;
    setFaults(true);
    void simPython.sim<Snapshot>({ op: "fault", id: simId, kind, args }).then((r) => setSnap(r));
  };

  const runs = useLiveQuery(() => db.simRuns.where("scenario").equals(scenario).toArray(), [scenario], []);
  const board = useMemo(() => runs.filter((r) => r.valid && r.controller === "manual").sort((a, b) => (a.kpis.facility_mwh ?? 0) - (b.kpis.facility_mwh ?? 0)), [runs]);

  const k = snap?.kpis;
  const valid = !!snap?.done && !faults && (k?.violation_min ?? 1) === 0;
  const save = async () => {
    if (!snap || !k) return;
    const kpis: Record<string, number> = {};
    for (const [key, v] of Object.entries(k)) if (typeof v === "number") kpis[key] = v;
    await db.simRuns.add({ controller: "manual", scenario, kpis, createdAt: new Date().toISOString(), settings: { ...controls, adjusted }, valid });
    setSaved(true);
  };

  if (phase === "off" || phase === "starting" || phase === "error") {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5" data-testid="control-room">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-faint uppercase">
          <Zap size={14} /> Plant Control Room · Hall A
        </div>
        <p className="mt-2 max-w-xl text-sm text-muted">
          A live model of Hall A: 4.8 MW of servers in four contained pods, sixteen fan walls, three chillers, a waterside economizer and four cooling towers. It runs in your browser; the first start downloads the Python runtime (about 10 MB, cached afterwards).
        </p>
        {error && <p className="mt-3 text-sm text-danger">Couldn't start the simulator: {error}</p>}
        <Button variant="primary" className="mt-4" onClick={() => void powerOn()} disabled={phase === "starting"} data-testid="power-on">
          <Power size={16} /> {phase === "starting" ? status.message : "Start the simulator"}
        </Button>
      </div>
    );
  }

  const out = snap?.out;
  const pods = out?.pods ?? [];
  const pl = out?.plant;
  const pw = out?.power;
  const hourly = series.map((p) => ({ x: p.t / 3600, pue: p.pue, inlet: p.inlet_max, wb: p.t_wb }));
  const current = scenarios.find((s) => s.id === scenario);
  const progress = snap ? snap.t / snap.duration : 0;

  return (
    <div className="@container rounded-2xl border border-line bg-surface p-3 sm:p-4" data-testid="control-room">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-faint uppercase">
          <Zap size={14} /> Control Room
        </div>
        <select
          className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-sm"
          value={scenario}
          disabled={phase === "running"}
          onChange={(e) => {
            setScenario(e.target.value);
            void create(e.target.value, controls);
          }}
          aria-label="Scenario"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="font-mono text-lg font-semibold tabular-nums" data-testid="sim-clock">
            {snap?.done ? "24:00" : clock(snap?.t ?? 0)}
          </span>
          <Segmented label="Speed" value={speed} options={SPEEDS.map((s) => ({ id: s.id, label: s.label }))} onChange={setSpeed} />
          {phase === "running" ? (
            <Button className="whitespace-nowrap" onClick={() => setPhase("ready")} aria-label="Pause">
              <Pause size={15} /> Pause
            </Button>
          ) : phase === "done" ? (
            <Button variant="primary" className="whitespace-nowrap" onClick={() => void create(scenario, controls).then(() => setPhase("running"))} data-testid="run-day">
              <RotateCcw size={15} /> Run again
            </Button>
          ) : (
            <Button variant="primary" className="whitespace-nowrap" onClick={() => setPhase("running")} data-testid="run-day">
              <Play size={15} /> {snap && snap.t > 0 ? "Resume" : "Run the day"}
            </Button>
          )}
          <Button variant="ghost" onClick={() => void create(scenario, controls)} aria-label="Restart the day" title="Restart the day">
            <RotateCcw size={15} />
          </Button>
        </div>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${progress * 100}%` }} />
      </div>
      {current?.summary && <p className="mt-2 text-xs text-muted">{current.summary}</p>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <div className="mt-4 grid grid-cols-1 gap-4 @3xl:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        {/* Controls */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
            <div className="mb-3 text-xs font-semibold tracking-wider text-faint uppercase">Your setpoints</div>
            <div className="flex flex-col gap-4">
              <Slider label="Supply air" value={controls.t_sa_sp} min={18} max={27} step={0.5} unit="°C" onChange={(v) => applyControls({ t_sa_sp: v })} hint="Air leaving the fan walls toward the racks" />
              <Slider label="Chilled water" value={controls.chws_sp} min={7} max={20} step={0.5} unit="°C" onChange={(v) => applyControls({ chws_sp: v })} hint="Water leaving the plant for the coils" />
              <div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>Fan walls</span>
                  <Segmented
                    label="Fan control"
                    value={controls.fan_speed === null ? "auto" : "manual"}
                    options={[
                      { id: "auto", label: "Auto" },
                      { id: "manual", label: "Manual" },
                    ]}
                    onChange={(v) => applyControls({ fan_speed: v === "auto" ? null : Math.round((pods[0]?.fan_speed ?? 0.8) * 20) / 20 })}
                  />
                </div>
                {controls.fan_speed === null ? (
                  <div className="mt-1 text-xs text-faint">Auto holds the cold aisle 3 Pa above the hot aisle, so exhaust can't leak back.</div>
                ) : (
                  <Slider label="Fan speed" value={Math.round(controls.fan_speed * 100)} min={30} max={100} step={5} unit="%" onChange={(v) => applyControls({ fan_speed: v / 100 })} />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>Economizer</span>
                <Segmented
                  label="Economizer"
                  value={controls.economizer}
                  options={[
                    { id: "auto", label: "Auto" },
                    { id: "off", label: "Off" },
                  ]}
                  onChange={(v) => applyControls({ economizer: v })}
                />
              </div>
            </div>
          </div>

          <details className="rounded-xl border border-line p-3.5 text-sm">
            <summary className="cursor-pointer font-medium">Inject a fault</summary>
            <p className="mt-2 text-xs text-faint">A run with faults is practice: it isn't saved as your baseline.</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Button onClick={() => inject("chiller_trip")} disabled={phase === "done"}>
                Trip a chiller
              </Button>
              <Button onClick={() => inject("crah_failure", { pod: 1 })} disabled={phase === "done"}>
                Fail a fan wall in Pod 2
              </Button>
              <Button onClick={() => inject("containment", { pod: 2, r0: 0.2 })} disabled={phase === "done"}>
                Prop a door open in Pod 3
              </Button>
              <Button onClick={() => inject("outage")} disabled={phase === "done"}>
                Utility outage
              </Button>
            </div>
          </details>
        </div>

        {/* Hall, plant, KPIs */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 @lg:grid-cols-4" data-testid="pods">
            {pods.map((p, z) => (
              <div key={z} className="min-w-0 rounded-xl border p-3" style={{ borderColor: heatColor(p.inlet_top, 0.6), background: heatColor(p.inlet_top, 0.1) }}>
                <div className="flex items-center justify-between gap-1 text-xs text-muted">
                  <span className="font-semibold text-ink">Pod {z + 1}</span>
                  {p.recirculation > 0.02 && (
                    <span className="inline-flex items-center gap-0.5 text-heat" title="Fans move less air than the servers pull: hot exhaust recirculates">
                      <AlertTriangle size={12} /> recirc {Math.round(p.recirculation * 100)}%
                    </span>
                  )}
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color: heatColor(p.inlet_top) }}>
                  {fmt(p.inlet_top)}°
                </div>
                <div className="text-[11px] text-faint">hottest rack inlet</div>
                <div className="mt-1.5 grid grid-cols-2 gap-x-2 text-[11px] whitespace-nowrap text-muted tabular-nums">
                  <span className="truncate" title="Hot-aisle temperature">hot {fmt(p.hot_aisle, 0)}°</span>
                  <span className="truncate">{fmt(p.it_kw / 1000, 2)} MW</span>
                  <span className="truncate" title="Fan speed and working fan walls">
                    <Fan size={10} className="mr-0.5 inline" />
                    {Math.round(p.fan_speed * 100)}% · {p.crah_units}/4
                  </span>
                  <span className="truncate" title="Chilled-water valve opening">valve {Math.round(p.valve * 100)}%</span>
                </div>
              </div>
            ))}
          </div>

          {pl && pw && out && (
            <div className="grid grid-cols-2 gap-2 text-xs @lg:grid-cols-3" data-testid="plant">
              <div className={clsx("min-w-0 rounded-xl border p-2.5", pl.economizer ? "border-accent/50 bg-accent-soft" : "border-line")}>
                <div className="flex items-center gap-1 font-semibold">
                  <Snowflake size={12} /> Economizer {pl.economizer ? "on" : "off"}
                </div>
                <div className="mt-0.5 text-muted tabular-nums">{pl.economizer ? `${fmt(pl.q_hx_kw / 1000, 2)} MW free cooling` : "towers too warm or switched off"}</div>
              </div>
              {pl.chillers.map((c, j) => (
                <div key={j} className={clsx("min-w-0 rounded-xl border p-2.5", !c.available ? "border-danger/50 bg-danger-soft" : c.on ? "border-info/40" : "border-line")}>
                  <div className="font-semibold">Chiller {j + 1}</div>
                  <div className="mt-0.5 text-muted tabular-nums">{!c.available ? `tripped · restart ${mmss(c.restart_s)}` : c.on ? `${Math.round(c.plr * 100)}% load` : "off"}</div>
                  {c.on && (
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full bg-info" style={{ width: `${c.plr * 100}%` }} />
                    </div>
                  )}
                </div>
              ))}
              <div className="min-w-0 rounded-xl border border-line p-2.5">
                <div className="font-semibold">Chilled water</div>
                <div className="mt-0.5 text-muted tabular-nums">
                  {fmt(pl.chws)}° out · {fmt(pl.chwr)}° back
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-line p-2.5">
                <div className="font-semibold">Towers</div>
                <div className="mt-0.5 text-muted tabular-nums">
                  fans {Math.round(pl.tower_fan * 100)}% · water {fmt(pl.cws)}°
                </div>
              </div>
              <div className="min-w-0 rounded-xl border border-line p-2.5">
                <div className="font-semibold">Outside</div>
                <div className="mt-0.5 text-muted tabular-nums">
                  {fmt(out.t_db)}° · wet-bulb {fmt(out.t_wb)}°
                </div>
              </div>
            </div>
          )}

          {pw && k && (
            <div className="grid grid-cols-2 gap-2 @lg:grid-cols-3" data-testid="kpis">
              <Tile label="PUE now" value={fmt(pw.pue, 3)} sub={`${fmt(pw.facility_kw / 1000, 2)} MW total`} />
              <Tile label="PUE today" value={fmt(k.pue, 3)} sub={`${fmt(k.facility_mwh, 1)} MWh so far`} />
              <Tile label="Hottest inlet today" value={`${fmt(k.max_inlet)} °C`} tone={(k.max_inlet ?? 0) > 27 ? "danger" : undefined} sub="27 °C recommended limit" />
              <Tile label="Minutes over 27 °C" value={fmt(k.violation_min, 0)} tone={k.violation_min > 0 ? "danger" : "accent"} sub="pod-minutes" />
              <Tile label="Cooling power" value={`${fmt(pw.cooling_kw, 0)} kW`} sub={`chillers ${fmt(pw.chillers_kw, 0)} · fans ${fmt(pw.fans_kw, 0)}`} />
              <Tile label="Tower water" value={`${fmt(k.water_m3, 0)} m³`} sub={k.wue ? `${fmt(k.wue, 2)} L per IT kWh` : undefined} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
            <Sparkline label="PUE" points={hourly.map((p) => ({ x: p.x, y: p.pue }))} format={(y) => y.toFixed(3)} />
            <Sparkline label="Hottest rack inlet" points={hourly.map((p) => ({ x: p.x, y: p.inlet }))} format={(y) => `${y.toFixed(1)} °C`} threshold={27} thresholdLabel="27 °C" tone="heat" />
          </div>

          {snap && snap.events.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs text-muted">
              {snap.events.slice(-4).map((e, i) => (
                <li key={`${e.t}-${i}`}>
                  <span className="font-mono text-faint">{clock(e.t)}</span> {e.kind.replace(/_/g, " ")}
                  {typeof e.pod === "number" ? ` (pod ${e.pod})` : typeof e.chiller === "number" ? ` (chiller ${e.chiller})` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {phase === "done" && k && (
        <div className="mt-5 rounded-xl border border-line bg-surface-2/60 p-4" data-testid="day-summary">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-lg font-semibold">Day complete</div>
            {valid ? <Badge tone="success">valid run</Badge> : <Badge tone="heat">{faults ? "practice: faults injected" : "inlets left the envelope"}</Badge>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 @2xl:grid-cols-4">
            <Tile label="Facility energy" value={`${fmt(k.facility_mwh, 2)} MWh`} sub={reference ? `default settings ${fmt(reference.facility_mwh, 2)}` : "default settings…"} />
            <Tile
              label="Versus default"
              value={reference ? (Math.abs(k.facility_mwh / reference.facility_mwh - 1) < 0.0005 ? "same" : `${k.facility_mwh < reference.facility_mwh ? "−" : "+"}${fmt(Math.abs((k.facility_mwh / reference.facility_mwh - 1) * 100), 1)}%`) : "…"}
              tone={reference && k.facility_mwh < reference.facility_mwh ? "accent" : undefined}
              sub="total energy, lower is better"
            />
            <Tile label="PUE" value={fmt(k.pue, 3)} sub={reference ? `default ${fmt(reference.pue, 3)}` : undefined} />
            <Tile label="Minutes over 27 °C" value={fmt(k.violation_min, 0)} tone={k.violation_min > 0 ? "danger" : "accent"} sub={`hottest ${fmt(k.max_inlet)} °C`} />
          </div>
          <p className="mt-3 text-xs text-muted">The score is total facility energy for the day with zero minutes over 27 °C at any rack inlet. PUE alone can improve while total energy rises, so it isn't the score.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {valid && !saved && (
              <Button variant="primary" onClick={() => void save()} data-testid="save-baseline">
                <Save size={15} /> Save as my baseline
              </Button>
            )}
            {saved && <span className="text-sm text-accent">Saved. Your controllers will race this number later in the course.</span>}
            <Button variant="ghost" onClick={() => void create(scenario, controls)}>
              <RotateCcw size={15} /> Try again
            </Button>
          </div>
        </div>
      )}

      {board.length > 0 && (
        <div className="mt-4 rounded-xl border border-line p-3.5" data-testid="leaderboard">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-faint uppercase">
            <Trophy size={13} /> Your best manual runs · {current?.title ?? scenario}
          </div>
          <ol className="flex flex-col gap-1 text-sm">
            {board.slice(0, 5).map((r, i) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <span className="text-muted">
                  {i + 1}. {new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · supply {String(r.settings?.t_sa_sp ?? "–")}°, water {String(r.settings?.chws_sp ?? "–")}°
                </span>
                <span className="font-medium tabular-nums">{fmt(r.kpis.facility_mwh, 2)} MWh</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
