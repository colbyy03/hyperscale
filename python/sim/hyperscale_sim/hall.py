"""Hall A, Level 1: a lumped-parameter data hall with its chilled-water plant.

States (about 23): per pod, cold-aisle, hot-aisle, server-mass and coil leaving-air temperatures;
the building structure; chilled-water supply and return headers; chiller loading; the tower basin.
Equations follow research/domain-datacenter.md, section 3.5. Integration uses an exponential
update per node with frozen inputs, which is exact for linear nodes and stable at 5-60 s steps.

The baseline building controls ("BMS v1") are idealized and close inside the step:
  L1 valve holds supply air at its setpoint while the coil has capacity (using the measured
     supply-air temperature, so a biased sensor mis-controls the real one);
  L2 fans hold containment over-pressure, unless a manual speed is set;
  L5 chiller staging with timers; L6 tower fans hold the condenser-water target;
  L7 economizer with hysteresis.
The learner adjusts setpoints by hand; later modules replace these loops with their own.

The measurement layer (read()) is separate: sensor bias, drift and stuck faults change what a
controller or operator sees, never the physics.
"""
from __future__ import annotations

import math
import random
from dataclasses import asdict, dataclass

from .params import Params
from .scenarios import Env, Scenario, get_scenario

KELVIN = 273.15
GRAVITY = 9.81


def clamp(x: float, lo: float, hi: float) -> float:
    return lo if x < lo else hi if x > hi else x


def counterflow_effectiveness(ntu: float, cr: float) -> float:
    if ntu <= 0.0:
        return 0.0
    if abs(1.0 - cr) < 1e-9:
        return ntu / (1.0 + ntu)
    e = math.exp(-ntu * (1.0 - cr))
    return (1.0 - e) / (1.0 - cr * e)


def eir_part_load(plr: float) -> float:
    """Electric input ratio vs part-load ratio for a variable-speed centrifugal chiller (1.0 at full load)."""
    return 0.20 + 0.20 * plr + 0.60 * plr * plr


def chiller_power(p: Params, q: float, n_running: int, t_chw_out: float, t_cw_leave: float) -> float:
    """Electric power of the running chillers sharing cooling duty q (W) equally.

    Level 1 model: COP at full load = η_C · T_evap / (T_cond − T_evap), scaled by a part-load curve.
    """
    if q <= 0.0 or n_running <= 0:
        return 0.0
    t_evap = t_chw_out - p.approach_evap + KELVIN
    t_cond = t_cw_leave + p.approach_cond + KELVIN
    lift = max(t_cond - t_evap, 3.0)
    cop_full = p.eta_carnot * t_evap / lift
    plr = max(q / (n_running * p.q_ch), p.plr_min)
    return n_running * p.q_ch / cop_full * eir_part_load(plr)


def fan_power(p: Params, units: int, speed: float) -> float:
    return units * p.p_fan_d * speed**p.n_fan


@dataclass
class Controls:
    """What the operator (or a controller) sets."""

    t_sa_sp: float = 24.0  # supply-air setpoint, °C
    fan_speed: float | None = None  # manual CRAH fan speed (0.3-1); None holds containment pressure
    dp_sp: float = 3.0  # containment over-pressure setpoint for automatic fans, Pa
    chws_sp: float = 16.0  # chilled-water supply setpoint, °C
    economizer: str = "auto"  # "auto" or "off"

    def validated(self, p: Params) -> "Controls":
        return Controls(
            t_sa_sp=clamp(float(self.t_sa_sp), 15.0, 30.0),
            fan_speed=None if self.fan_speed is None else clamp(float(self.fan_speed), p.s_min, 1.0),
            dp_sp=clamp(float(self.dp_sp), 0.5, 10.0),
            chws_sp=clamp(float(self.chws_sp), 5.0, 22.0),
            economizer="off" if self.economizer == "off" else "auto",
        )


@dataclass
class Metrics:
    """Running totals since the scenario started."""

    seconds: float = 0.0
    e_it: float = 0.0  # J
    e_fac: float = 0.0  # J
    e_cool: float = 0.0  # J
    water_kg: float = 0.0  # tower makeup
    cost: float = 0.0  # $
    carbon_kg: float = 0.0
    viol_s: float = 0.0  # pod-seconds with top-of-rack inlet above the recommended limit
    allow_s: float = 0.0  # pod-seconds above the allowable limit
    max_inlet: float = -1e9
    wse_s: float = 0.0  # seconds with the economizer on

    def summary(self) -> dict:
        kwh = lambda j: j / 3.6e6  # noqa: E731
        it = kwh(self.e_it)
        return {
            "hours": self.seconds / 3600.0,
            "it_mwh": it / 1000.0,
            "facility_mwh": kwh(self.e_fac) / 1000.0,
            "cooling_mwh": kwh(self.e_cool) / 1000.0,
            "pue": self.e_fac / self.e_it if self.e_it > 0 else None,
            "water_m3": self.water_kg / 998.0,
            "wue": self.water_kg / it if it > 0 else None,  # L per IT kWh
            "cost": self.cost,
            "carbon_t": self.carbon_kg / 1000.0,
            "violation_min": self.viol_s / 60.0,
            "allowable_min": self.allow_s / 60.0,
            "max_inlet": None if self.max_inlet < -1e8 else self.max_inlet,
            "economizer_h": self.wse_s / 3600.0,
        }


class Hall:
    def __init__(self, scenario: str | Scenario = "summer-day", params: Params | None = None, controls: Controls | None = None, dt: float = 5.0, seed: int = 0, warmup: bool = True):
        self.p = params or Params()
        self.scenario = scenario if isinstance(scenario, Scenario) else get_scenario(scenario)
        self.controls = (controls or Controls()).validated(self.p)
        self.dt = dt
        self.rng = random.Random(seed)
        p, n = self.p, self.p.n_pods
        self.t = 0.0
        # Plant states
        self.T_ca = [self.controls.t_sa_sp] * n
        self.T_ha = [self.controls.t_sa_sp + 11.0] * n
        self.T_it = [self.controls.t_sa_sp + 18.0] * n
        self.T_la = [self.controls.t_sa_sp - 0.5] * n
        self.T_s = self.controls.t_sa_sp + 2.0
        self.T_chws = self.controls.chws_sp
        self.T_chwr = self.controls.chws_sp + 10.0
        self.T_cws = 22.0
        self.plr = [0.0] * p.n_ch
        self.ch_on = [j < 2 for j in range(p.n_ch)]
        self.ch_restart = [0.0] * p.n_ch
        self.stage_timer = 0.0
        self.wse_on = False
        self.outage_t: float | None = None
        self._p_ch_prev = 0.0
        self._valve = [0.7] * n
        # Plant faults
        self.crah_avail = [p.crah_per_pod] * n
        self.foul = [1.0] * n
        self.r0 = [p.r0] * n
        self.tower_degrade = 0.0
        self.it_offset = [0.0] * n
        self.events: list[dict] = []
        # Measurement layer
        self.sensor_bias: dict[str, float] = {}
        self.sensor_drift: dict[str, tuple[float, float]] = {}  # name -> (rate per s, start time)
        self.sensor_stuck: dict[str, float] = {}
        self.noise = 0.0
        self.metrics = Metrics()
        self.out: dict = {}
        if warmup:
            self.warm_up()

    # ------------------------------------------------------------------ running
    def warm_up(self, hours: float = 10.0) -> None:
        """Settle every state at the scenario's start conditions, then reset clock and totals."""
        for _ in range(int(hours * 3600 / 60)):
            self.step(60.0, frozen=True)
        self.t = 0.0
        self.metrics = Metrics()
        self.events = []

    def run(self, seconds: float, dt: float | None = None) -> dict:
        dt = dt or self.dt
        end = self.t + seconds
        while self.t < end - 1e-9:
            self.step(min(dt, end - self.t))
        return self.out

    @property
    def done(self) -> bool:
        return self.t >= self.scenario.duration - 1e-9

    def env(self, frozen: bool = False) -> Env:
        return self.scenario.at(0.0 if frozen else self.t, self.p.n_pods)

    # ------------------------------------------------------------------ physics
    def step(self, dt: float | None = None, frozen: bool = False) -> None:
        dt = dt or self.dt
        p, c, n = self.p, self.controls, self.p.n_pods
        env = self.env(frozen)
        rc = p.rho_a * p.cp_a
        cpw = p.cp_w
        if self.outage_t is not None:
            self.outage_t += dt
        mech = self.outage_t is None or self.outage_t >= p.t_gen  # fans and pumps have power

        P_it, V_sup_l, P_fan_l, Q_coil, m_w_l, T_lw_l, T_top_l, dp_l, speed_l, T_sa_l, rec_l = ([0.0] * n for _ in range(11))
        T_s = self.T_s
        for z in range(n):
            # IT load: server fans speed up with inlet temperature (inside the IT boundary).
            u = clamp(env.util[z] + self.it_offset[z], 0.0, 1.0)
            g = 1.0 + p.k_g * max(0.0, self.T_ca[z] - p.t_ramp)
            p_it = p.p_cap * (p.p_idle + (1.0 - p.p_idle) * u) + p.f_sfan * p.p_cap * g**3
            V_srv = p.v_per_w * p_it * g
            P_it[z] = p_it

            # CRAH fans (L2): hold containment over-pressure, or the manual speed.
            units = self.crah_avail[z] if mech else 0
            if units > 0:
                if c.fan_speed is None:
                    v_net_sp = p.cda_leak * math.sqrt(2.0 * c.dp_sp / p.rho_a)
                    s = (V_srv + v_net_sp) / (units * p.v_crah)
                else:
                    s = c.fan_speed
                s = clamp(s, p.s_min, 1.0)
            else:
                s = 0.0
            V_sup = units * s * p.v_crah
            P_fan = fan_power(p, units, s)

            # Airflow balance through the containment.
            V_net = V_sup - V_srv
            V_byp, V_rec = max(V_net, 0.0), max(-V_net, 0.0)
            V_x = self.r0[z] * V_srv
            dp_l[z] = math.copysign(0.5 * p.rho_a * (V_net / p.cda_leak) ** 2, V_net)

            # CRAH coil (L1): valve holds supply air at setpoint while capacity allows (ε-NTU, dry coil).
            q, m_w, fan_rise = 0.0, 0.0, 0.0
            T_la_ss = self.T_ha[z]
            if units > 0 and mech:
                C_a = rc * V_sup
                fan_rise = P_fan / C_a
                target_la = c.t_sa_sp - self._bias(f"pod{z + 1}.supply_air") - fan_rise
                q_target = C_a * (self.T_ha[z] - target_la)
                dT_in = self.T_ha[z] - self.T_chws
                m_full = units * p.m_w_crah
                if q_target > 0.0 and dT_in > 0.0:
                    q_full = self._coil_q(1.0, units, s, C_a, m_full, z, dT_in)
                    if q_target >= q_full:
                        frac, q = 1.0, q_full
                    else:
                        frac, q = self._valve_for(q_target, units, s, C_a, m_full, z, dT_in), q_target
                    m_w = frac * m_full
                    self._valve[z] = frac
                else:
                    self._valve[z] = 0.0
                T_la_ss = self.T_ha[z] - q / C_a
            else:
                self._valve[z] = 0.0
            T_la = T_la_ss + (self.T_la[z] - T_la_ss) * math.exp(-dt / p.tau_coil)
            # The air actually leaving the coil sets the duty; the water side carries the same heat.
            q_air = rc * V_sup * (self.T_ha[z] - T_la) if V_sup > 0 else 0.0
            if m_w <= 0.0 and q_air > 0.0:
                q_air = 0.0
                T_la = self.T_ha[z]
            T_sa = T_la + fan_rise
            Q_coil[z] = q_air
            m_w_l[z] = m_w
            T_lw_l[z] = self.T_chws + q_air / (m_w * cpw) if m_w > 0 else self.T_chws

            # Air nodes, exponential update with frozen inputs (cold aisle, servers, hot aisle).
            k_sup, k_rec, k_s = rc * V_sup, rc * (V_rec + V_x), p.ha_ca
            C_ca = p.air_mult * rc * p.vol_ca
            k = k_sup + k_rec + k_s
            T_eq = (k_sup * T_sa + k_rec * self.T_ha[z] + k_s * T_s) / k
            T_ca = T_eq + (self.T_ca[z] - T_eq) * math.exp(-dt * k / C_ca)

            k_it = p.eps_srv * rc * V_srv
            C_it = p.c_it_per_w * p.p_cap
            T_eq = T_ca + p_it / k_it
            T_it = T_eq + (self.T_it[z] - T_eq) * math.exp(-dt * k_it / C_it)
            T_out = T_ca + k_it * (T_it - T_ca) / (rc * V_srv)

            k_srv, k_byp, k_s = rc * V_srv, rc * (V_byp + V_x), p.ha_ha
            C_ha = p.air_mult * rc * p.vol_ha
            k = k_srv + k_byp + k_s
            T_eq = (k_srv * T_out + k_byp * T_ca + k_s * T_s) / k
            T_ha = T_eq + (self.T_ha[z] - T_eq) * math.exp(-dt * k / C_ha)

            self.T_ca[z], self.T_it[z], self.T_ha[z], self.T_la[z] = T_ca, T_it, T_ha, T_la
            # Top-of-rack inlet: recirculated and leaked exhaust collects near the top of the racks.
            T_top_l[z] = T_ca + p.hotspot_beta * (T_ha - T_ca) * (V_rec + V_x) / V_srv
            V_sup_l[z], P_fan_l[z], speed_l[z], T_sa_l[z], rec_l[z] = V_sup, P_fan, s, T_sa, V_rec / V_srv

        # Structure (hours-scale), exchanging with every aisle and the outdoors through the envelope.
        k_tot = n * (p.ha_ca + p.ha_ha) + p.ua_env
        T_eq = (p.ha_ca * sum(self.T_ca) + p.ha_ha * sum(self.T_ha) + p.ua_env * env.t_db) / k_tot
        self.T_s = T_eq + (self.T_s - T_eq) * math.exp(-dt * k_tot / p.c_struct)
        q_env = p.ua_env * (env.t_db - self.T_s)

        # Chilled-water loop: coils → return header → economizer → chillers → supply header.
        m_coils = sum(m_w_l)
        if mech:
            m_chw = max(m_coils, p.m_chw_min_frac * p.m_chw_d)
            m_byp = m_chw - m_coils
            T_ret_in = (sum(m * t for m, t in zip(m_w_l, T_lw_l)) + m_byp * self.T_chws) / m_chw
            C_r = p.rho_w * cpw * p.vol_chwr
            self.T_chwr = T_ret_in + (self.T_chwr - T_ret_in) * math.exp(-dt * m_chw * cpw / C_r)
        else:
            m_chw = 0.0  # no circulation during the outage gap

        # L7 economizer with hysteresis: worth running only if tower water is colder than the return.
        if c.economizer == "off" or not mech:
            self.wse_on = False
        elif self.wse_on:
            self.wse_on = self.T_cws < self.T_chwr - 0.5
        else:
            self.wse_on = self.T_cws < self.T_chwr - 1.5
        T_hx = self.T_chwr - p.eps_hx * (self.T_chwr - self.T_cws) if self.wse_on else self.T_chwr
        Q_hx = m_chw * cpw * (self.T_chwr - T_hx)

        # L5 chillers: trim to the setpoint, staged with timers; trips and outages need a restart delay.
        q_req = m_chw * cpw * max(0.0, T_hx - c.chws_sp)
        for j in range(p.n_ch):
            if self.ch_restart[j] > 0.0:
                self.ch_restart[j] = max(0.0, self.ch_restart[j] - dt)
        available = [j for j in range(p.n_ch) if self.ch_restart[j] <= 0.0 and mech]
        for j in range(p.n_ch):
            if self.ch_on[j] and j not in available:
                self.ch_on[j] = False
                self.plr[j] = 0.0
        running = [j for j in range(p.n_ch) if self.ch_on[j]]
        cap = len(running) * p.q_ch
        if q_req > 0.12 * p.q_ch and not running and available:
            # First chiller starts once the trim is worth it (it stops below 0.10: a deadband, no cycling).
            self.ch_on[available[0]] = True
            self.stage_timer = 0.0
        elif running and q_req > 0.9 * cap and len(running) < len(available):
            self.stage_timer = max(self.stage_timer, 0.0) + dt
            if self.stage_timer >= p.stage_up_s:
                self.ch_on[next(j for j in available if not self.ch_on[j])] = True
                self.stage_timer = 0.0
        elif running and q_req < 0.8 * (len(running) - 1) * p.q_ch + (0.1 * p.q_ch if len(running) == 1 else 0.0):
            self.stage_timer = min(self.stage_timer, 0.0) - dt
            if -self.stage_timer >= p.stage_down_s:
                last = running[-1]
                self.ch_on[last] = False
                self.plr[last] = 0.0
                self.stage_timer = 0.0
        else:
            self.stage_timer = 0.0
        running = [j for j in range(p.n_ch) if self.ch_on[j]]
        cap = len(running) * p.q_ch
        target = q_req / cap if cap > 0 else 0.0
        for j in range(p.n_ch):
            if j in running:
                self.plr[j] = min(min(target, 1.0), self.plr[j] + p.ramp_per_s * dt) if target > self.plr[j] else min(target, 1.0)
            else:
                self.plr[j] = 0.0
        Q_ch = min(q_req, sum(self.plr) * p.q_ch)
        T_plant = T_hx - Q_ch / (m_chw * cpw) if m_chw > 0 else T_hx
        if m_chw > 0:
            C_sup = p.rho_w * cpw * p.vol_chws
            self.T_chws = T_plant + (self.T_chws - T_plant) * math.exp(-dt * m_chw * cpw / C_sup)

        # Chiller power, using the previous step's compressor power for the condenser rise.
        m_cw = p.m_cw if mech else 0.0
        t_cw_leave = self.T_cws + (Q_ch + self._p_ch_prev + Q_hx) / (p.m_cw * cpw)
        P_ch = chiller_power(p, Q_ch, len(running), T_plant, t_cw_leave)
        self._p_ch_prev = P_ch

        # L6 towers: approach curve; fans hold the condenser-water target, a bypass holds its minimum.
        Q_rej = Q_ch + P_ch + Q_hx
        P_ct, s_ct, evap = 0.0, 0.0, 0.0
        if m_cw > 0:
            load = max(Q_rej / p.q_rej_d, 0.05)
            a_full = (p.approach_d + self.tower_degrade) * load**0.7
            floor = p.t_cws_freeze if self.wse_on else (p.t_cws_min if running else p.t_cws_freeze)
            target_cw = max(env.t_wb + a_full, floor)
            s_ct = clamp((a_full / max(target_cw - env.t_wb, 1e-6)) ** (1 / 0.7), 0.2, 1.0)
            T_ct = max(env.t_wb + a_full * s_ct**-0.7, target_cw)
            C_b = p.rho_w * cpw * p.vol_basin
            self.T_cws = T_ct + (self.T_cws - T_ct) * math.exp(-dt * m_cw * cpw / C_b)
            P_ct = p.n_cells * p.p_ct_d * s_ct**3
            evap = p.f_lat * Q_rej / p.h_fg
        makeup = evap + evap / (p.coc - 1.0) + 2e-5 * m_cw if m_cw > 0 else 0.0

        # Pumps: chilled water on a system curve held at a differential-pressure setpoint.
        H = p.h_chw_sp + (p.h_chw - p.h_chw_sp) * (m_chw / p.m_chw_d) ** 2
        P_chwp = p.rho_w * GRAVITY * H * (m_chw / p.rho_w) / p.eta_pump
        P_cwp = p.rho_w * GRAVITY * p.h_cw * (m_cw / p.rho_w) / p.eta_pump

        # Electrical chain: 2N UPS, distribution, transformers, miscellaneous.
        P_IT = sum(P_it)
        ell = P_IT / p.ups_modules / p.ups_module_rating
        a0, a1, a2 = p.ups_a
        L_ups = p.ups_modules * p.ups_module_rating * (a0 + a1 * ell + a2 * ell * ell)
        L_dist = p.c_dist * P_IT
        P_misc = p.f_misc * p.design_it
        P_fans = sum(P_fan_l)
        P_cool = P_ch + P_chwp + P_cwp + P_ct + P_fans
        S = P_IT + L_ups + L_dist + P_cool + P_misc
        L_tx = p.tx_rating * (p.tx_nl + p.tx_ll * (S / p.tx_rating) ** 2)
        P_fac = S + L_tx

        # Totals.
        if not frozen:
            m = self.metrics
            m.seconds += dt
            m.e_it += P_IT * dt
            m.e_fac += P_fac * dt
            m.e_cool += P_cool * dt
            m.water_kg += makeup * dt
            kwh = P_fac * dt / 3.6e6
            m.cost += env.price * kwh
            m.carbon_kg += env.carbon * kwh
            for t_top in T_top_l:
                if t_top > p.inlet_recommended:
                    m.viol_s += dt
                if t_top > p.inlet_allowable:
                    m.allow_s += dt
                m.max_inlet = max(m.max_inlet, t_top)
            if self.wse_on:
                m.wse_s += dt
            self.t += dt

        self.out = {
            "t": self.t,
            "hour": env.hour,
            "t_db": env.t_db,
            "t_wb": env.t_wb,
            "pods": [
                {
                    "inlet": self.T_ca[z],
                    "inlet_top": T_top_l[z],
                    "hot_aisle": self.T_ha[z],
                    "supply_air": T_sa_l[z],
                    "server": self.T_it[z],
                    "it_kw": P_it[z] / 1e3,
                    "fan_speed": speed_l[z],
                    "fan_kw": P_fan_l[z] / 1e3,
                    "valve": self._valve[z],
                    "dp": dp_l[z],
                    "recirculation": rec_l[z],
                    "coil_kw": Q_coil[z] / 1e3,
                    "crah_units": self.crah_avail[z] if mech else 0,
                }
                for z in range(n)
            ],
            "plant": {
                "chws": self.T_chws,
                "chwr": self.T_chwr,
                "chws_sp": c.chws_sp,
                "m_chw": m_chw,
                "economizer": self.wse_on,
                "q_hx_kw": Q_hx / 1e3,
                "q_ch_kw": Q_ch / 1e3,
                "cws": self.T_cws,
                "tower_fan": s_ct,
                "chillers": [
                    {"on": self.ch_on[j], "available": self.ch_restart[j] <= 0.0 and mech, "plr": self.plr[j], "restart_s": self.ch_restart[j]}
                    for j in range(p.n_ch)
                ],
            },
            "power": {
                "it_kw": P_IT / 1e3,
                "chillers_kw": P_ch / 1e3,
                "fans_kw": P_fans / 1e3,
                "pumps_kw": (P_chwp + P_cwp) / 1e3,
                "towers_kw": P_ct / 1e3,
                "cooling_kw": P_cool / 1e3,
                "electrical_kw": (L_ups + L_dist + L_tx) / 1e3,
                "misc_kw": P_misc / 1e3,
                "facility_kw": P_fac / 1e3,
                "pue": P_fac / P_IT,
            },
            "balance": {"coils_kw": sum(Q_coil) / 1e3, "envelope_kw": q_env / 1e3, "rejected_kw": Q_rej / 1e3, "makeup_kg_s": makeup},
            "outage": self.outage_t is not None and self.outage_t < p.t_gen,
        }

    def _coil_q(self, frac: float, units: int, s: float, C_a: float, m_full: float, z: int, dT_in: float) -> float:
        p = self.p
        frac = max(frac, 1e-4)
        C_w = frac * m_full * p.cp_w
        ua = units * self.foul[z] * p.ua_coil / (p.x_air * s**-0.6 + (1.0 - p.x_air) * frac**-0.8)
        c_min, c_max = (C_a, C_w) if C_a < C_w else (C_w, C_a)
        return counterflow_effectiveness(ua / c_min, c_min / c_max) * c_min * dT_in

    def _valve_for(self, q_target: float, units: int, s: float, C_a: float, m_full: float, z: int, dT_in: float) -> float:
        """Valve opening (share of full flow) that delivers q_target: bisection, warm-started."""
        lo, hi = 0.0, 1.0
        guess = self._valve[z]
        if 0.02 < guess < 0.98:
            a, b = max(0.0, guess - 0.05), min(1.0, guess + 0.05)
            if self._coil_q(a, units, s, C_a, m_full, z, dT_in) < q_target <= self._coil_q(b, units, s, C_a, m_full, z, dT_in):
                lo, hi = a, b
        for _ in range(14 if hi - lo > 0.2 else 9):
            mid = 0.5 * (lo + hi)
            if self._coil_q(mid, units, s, C_a, m_full, z, dT_in) < q_target:
                lo = mid
            else:
                hi = mid
        return hi

    # ------------------------------------------------------------------ controls and faults
    def set_controls(self, **kw) -> None:
        merged = asdict(self.controls) | {k: v for k, v in kw.items() if k in Controls.__dataclass_fields__}
        self.controls = Controls(**merged).validated(self.p)

    def _log(self, kind: str, **detail) -> None:
        self.events.append({"t": self.t, "kind": kind, **detail})

    def trip_chiller(self, j: int | None = None) -> None:
        """Trip a running chiller (the most loaded one by default); it can restart after t_restart."""
        if j is None:
            running = [k for k in range(self.p.n_ch) if self.ch_on[k]]
            j = running[0] if running else 0
        self.ch_on[j] = False
        self.plr[j] = 0.0
        self.ch_restart[j] = self.p.t_restart
        self._log("chiller_trip", chiller=j + 1)

    def fail_crah(self, pod: int, units: int = 1) -> None:
        self.crah_avail[pod] = max(0, self.crah_avail[pod] - units)
        self._log("crah_failure", pod=pod + 1, available=self.crah_avail[pod])

    def restore_crah(self, pod: int) -> None:
        self.crah_avail[pod] = self.p.crah_per_pod
        self._log("crah_restored", pod=pod + 1)

    def set_containment(self, pod: int, r0: float) -> None:
        self.r0[pod] = clamp(r0, 0.0, 0.5)
        self._log("containment", pod=pod + 1, r0=self.r0[pod])

    def set_fouling(self, pod: int, factor: float) -> None:
        self.foul[pod] = clamp(factor, 0.2, 1.0)
        self._log("coil_fouling", pod=pod + 1, factor=self.foul[pod])

    def degrade_tower(self, extra_approach: float) -> None:
        self.tower_degrade = max(0.0, extra_approach)
        self._log("tower_degradation", extra_approach=self.tower_degrade)

    def it_step(self, pod: int, delta_util: float) -> None:
        self.it_offset[pod] = clamp(self.it_offset[pod] + delta_util, -1.0, 1.0)
        self._log("it_step", pod=pod + 1, delta=delta_util)

    def utility_outage(self) -> None:
        """Grid loss with mechanical loads not on UPS: fans and pumps stop until the generators
        pick up (t_gen); chillers need t_restart before they run again. IT rides on the UPS."""
        self.outage_t = 0.0
        for j in range(self.p.n_ch):
            self.ch_on[j] = False
            self.plr[j] = 0.0
            self.ch_restart[j] = self.p.t_restart
        self._log("utility_outage")

    # ------------------------------------------------------------------ measurement layer
    def set_sensor_fault(self, name: str, bias: float | None = None, drift_per_hour: float | None = None, stuck: bool = False) -> None:
        if bias is not None:
            self.sensor_bias[name] = bias
        if drift_per_hour is not None:
            self.sensor_drift[name] = (drift_per_hour / 3600.0, self.t)
        if stuck:
            self.sensor_stuck[name] = self.read().get(name, float("nan"))
        self._log("sensor_fault", sensor=name, bias=bias, drift_per_hour=drift_per_hour, stuck=stuck)

    def clear_sensor_faults(self) -> None:
        self.sensor_bias.clear()
        self.sensor_drift.clear()
        self.sensor_stuck.clear()

    def _bias(self, name: str) -> float:
        b = self.sensor_bias.get(name, 0.0)
        if name in self.sensor_drift:
            rate, t0 = self.sensor_drift[name]
            b += rate * (self.t - t0)
        return b

    def truth(self) -> dict[str, float]:
        """True values of every sensor point (what perfect instruments would read)."""
        o = self.out
        pts: dict[str, float] = {"weather.t_db": o["t_db"], "weather.t_wb": o["t_wb"]}
        for z, pod in enumerate(o["pods"]):
            for key in ("inlet", "inlet_top", "hot_aisle", "supply_air", "dp", "fan_speed", "valve", "it_kw"):
                pts[f"pod{z + 1}.{key}"] = pod[key]
        pl = o["plant"]
        pts.update({"plant.chws": pl["chws"], "plant.chwr": pl["chwr"], "plant.cws": pl["cws"], "tower.fan": pl["tower_fan"]})
        for j, ch in enumerate(pl["chillers"]):
            pts[f"chiller{j + 1}.plr"] = ch["plr"]
        pw = o["power"]
        pts.update({"power.it_kw": pw["it_kw"], "power.cooling_kw": pw["cooling_kw"], "power.facility_kw": pw["facility_kw"]})
        return pts

    def read(self) -> dict[str, float]:
        """What the instruments report: truth plus bias, drift, noise; stuck sensors repeat."""
        out = {}
        for name, value in self.truth().items():
            if name in self.sensor_stuck:
                out[name] = self.sensor_stuck[name]
                continue
            v = value + self._bias(name)
            if self.noise > 0:
                v += self.rng.gauss(0.0, self.noise)
            out[name] = v
        return out
