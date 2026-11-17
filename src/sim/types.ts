/** Shapes returned by hyperscale_sim.bridge (python/sim/hyperscale_sim/bridge.py). */
export interface SimControls {
  t_sa_sp: number;
  fan_speed: number | null;
  dp_sp: number;
  chws_sp: number;
  economizer: "auto" | "off";
}

export interface PodOut {
  inlet: number;
  inlet_top: number;
  hot_aisle: number;
  supply_air: number;
  server: number;
  it_kw: number;
  fan_speed: number;
  fan_kw: number;
  valve: number;
  dp: number;
  recirculation: number;
  coil_kw: number;
  crah_units: number;
}

export interface ChillerOut {
  on: boolean;
  available: boolean;
  plr: number;
  restart_s: number;
}

export interface SimOut {
  t: number;
  hour: number;
  t_db: number;
  t_wb: number;
  pods: PodOut[];
  plant: { chws: number; chwr: number; chws_sp: number; m_chw: number; economizer: boolean; q_hx_kw: number; q_ch_kw: number; cws: number; tower_fan: number; chillers: ChillerOut[] };
  power: { it_kw: number; chillers_kw: number; fans_kw: number; pumps_kw: number; towers_kw: number; cooling_kw: number; electrical_kw: number; misc_kw: number; facility_kw: number; pue: number };
  outage: boolean;
}

export interface Kpis {
  hours: number;
  it_mwh: number;
  facility_mwh: number;
  cooling_mwh: number;
  pue: number | null;
  water_m3: number;
  wue: number | null;
  cost: number;
  carbon_t: number;
  violation_min: number;
  allowable_min: number;
  max_inlet: number | null;
  economizer_h: number;
}

export interface SimEvent {
  t: number;
  kind: string;
  [key: string]: unknown;
}

export interface Snapshot {
  id?: number;
  t: number;
  done: boolean;
  duration: number;
  out: SimOut;
  kpis: Kpis;
  controls: SimControls;
  events: SimEvent[];
  points?: SeriesPoint[];
}

export interface SeriesPoint {
  t: number;
  pue: number;
  inlet_max: number;
  t_wb: number;
  facility_kw: number;
  chws: number;
}

export interface ScenarioInfo {
  id: string;
  title: string;
  summary: string;
  tags: string[];
}

export const DEFAULT_CONTROLS: SimControls = { t_sa_sp: 24, fan_speed: null, dp_sp: 3, chws_sp: 16, economizer: "auto" };
