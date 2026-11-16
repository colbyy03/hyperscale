/**
 * The heat path from chip to atmosphere, with an economizer toggle.
 * Temperatures are the reference hall's design values (research/domain-datacenter.md §3.2).
 */
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

interface Stage {
  key: string;
  name: string;
  temp: string;
  medium: "air" | "water" | "refrigerant" | "solid";
  detail: string;
  economizerSkips?: boolean;
}

const STAGES: Stage[] = [
  { key: "chip", name: "Chips", temp: "≈60–85 °C", medium: "solid", detail: "Every watt the servers draw ends up as heat; there is no other place for it to go (first law). Chips run hottest; servers move that heat into air or, in liquid-cooled racks, into a cold plate." },
  { key: "aisles", name: "Cold → hot aisle", temp: "24 → ≈36 °C", medium: "air", detail: "Servers pull supply air from the contained cold aisle and exhaust it about 10–15 K hotter into the hot aisle. ASHRAE recommends 18–27 °C at the server inlet." },
  { key: "crah", name: "CRAH coil", temp: "air ≈36 → 24 °C", medium: "air", detail: "Fan-wall air handlers push hot-aisle air across a chilled-water coil. Fan power follows the cube of speed, so small speed cuts save a lot of energy." },
  { key: "chw", name: "Chilled water", temp: "16 → 26 °C", medium: "water", detail: "Warm modern designs supply water around 16 °C and return it around 26 °C. Warmer water means more free-cooling hours and less chiller lift." },
  { key: "chiller", name: "Chillers", temp: "lift ≈10–20 K", medium: "refrigerant", economizerSkips: true, detail: "A vapour-compression cycle pumps heat 'uphill' from the chilled-water loop to the condenser loop. Its power grows with lift: the temperature difference it must overcome." },
  { key: "cw", name: "Condenser water", temp: "25 → 30 °C", medium: "water", detail: "The condenser loop carries the chiller's heat (the IT heat plus the compressor's own work) out to the towers." },
  { key: "tower", name: "Cooling towers", temp: "≈3–4 K above wet-bulb", medium: "water", detail: "Evaporating a little water cools the rest toward the outdoor wet-bulb temperature. This is where most of a site's water use (WUE) comes from." },
  { key: "air", name: "Atmosphere", temp: "design wet-bulb ≈20 °C", medium: "air", detail: "Ultimately all of the heat goes to the outdoors. Dry, cool climates make the job easy, which is why so many hyperscale campuses sit inland." },
];

const MEDIUM_COLOR: Record<Stage["medium"], string> = {
  solid: "var(--heat)",
  air: "var(--violet)",
  water: "var(--info)",
  refrigerant: "var(--accent)",
};

export default function HeatPath() {
  const [economizer, setEconomizer] = useState(false);
  const [selected, setSelected] = useState<string>("chip");
  const sel = STAGES.find((s) => s.key === selected)!;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5" data-testid="viz-heatpath">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold tracking-wider text-faint uppercase">The heat path, chip to sky</div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={economizer} onChange={(e) => setEconomizer(e.target.checked)} className="accent-[var(--accent)]" />
          Waterside economizer (free cooling)
        </label>
      </div>
      <ol className="flex flex-wrap items-stretch gap-y-3">
        {STAGES.map((s, i) => {
          const skipped = economizer && s.economizerSkips;
          return (
            <li key={s.key} className="flex items-center">
              <button
                onClick={() => setSelected(s.key)}
                className={clsx(
                  "w-28 rounded-xl border p-2.5 text-left transition-colors sm:w-32",
                  selected === s.key ? "border-line-strong bg-surface-3" : "border-line hover:border-line-strong",
                  skipped && "opacity-35",
                )}
                aria-pressed={selected === s.key}
              >
                <div className="mb-1 h-1 w-8 rounded-full" style={{ background: MEDIUM_COLOR[s.medium] }} />
                <div className="text-sm font-medium">{s.name}</div>
                <div className="text-[11px] text-muted">{skipped ? "bypassed" : s.temp}</div>
              </button>
              {i < STAGES.length - 1 && <ArrowRight size={14} className="mx-1 shrink-0 text-faint" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 rounded-xl bg-surface-2 p-3 text-sm leading-relaxed">
        <span className="font-semibold">{sel.name}. </span>
        {sel.detail}
        {economizer && sel.economizerSkips && (
          <span className="mt-1 block text-accent">
            With the economizer on, a plate heat exchanger lets the tower water cool the chilled-water loop directly whenever the outdoor wet-bulb is low enough, so the chillers can switch off.
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-faint">
        {(Object.keys(MEDIUM_COLOR) as Stage["medium"][]).map((m) => (
          <span key={m} className="flex items-center gap-1.5">
            <span className="h-1.5 w-4 rounded-full" style={{ background: MEDIUM_COLOR[m] }} /> {m}
          </span>
        ))}
      </div>
    </div>
  );
}
