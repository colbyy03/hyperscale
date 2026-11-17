"""Parameters of the reference facility, Hall A (research/domain-datacenter.md, section 3.6).

Values marked [U] in the research notes are engineering estimates; they are plausible for a
modern warm-water design and are calibrated against published references before later levels.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Params:
    # --- IT load (EnergyPlus ITE structure) ---
    n_pods: int = 4
    p_cap: float = 1.2e6  # design IT power per pod, W
    p_idle: float = 0.35  # idle share of server power
    f_sfan: float = 0.04  # server fan share of design power at nominal speed
    t_ramp: float = 25.0  # inlet temperature where server fans start to speed up, °C
    k_g: float = 0.033  # server fan speed-up per K above t_ramp
    v_per_w: float = 0.075e-3  # server airflow, m³/s per W of IT power
    eps_srv: float = 0.8  # server internal heat-transfer effectiveness
    c_it_per_w: float = 13.6  # server thermal mass, J/K per W of design IT
    hotspot_beta: float = 1.5  # top-of-rack inlet amplification of recirculated air

    # --- Air and containment ---
    rho_a: float = 1.13  # kg/m³ (about 400 m elevation, 30 °C)
    cp_a: float = 1006.0  # J/(kg·K)
    vol_ca: float = 1000.0  # cold-aisle air volume per pod, m³
    vol_ha: float = 2000.0  # hot-aisle and return-plenum volume per pod, m³
    air_mult: float = 2.0  # capacity multiplier for fixtures in the air nodes
    r0: float = 0.03  # leakage exchange through containment, fraction of server airflow
    cda_leak: float = 4.0  # containment leakage area per pod, m²
    ha_ca: float = 10e3  # cold aisle to structure conductance per pod, W/K
    ha_ha: float = 10e3  # hot aisle to structure conductance per pod, W/K
    c_struct: float = 0.6e9  # active structure capacitance (whole hall), J/K
    ua_env: float = 10e3  # envelope conductance, W/K

    # --- CRAH units (fan walls) ---
    crah_per_pod: int = 4  # 3 duty + 1 redundant, all running together
    v_crah: float = 28.6  # design airflow per unit at full speed, m³/s
    ua_coil: float = 47e3  # coil UA per unit at design flows, W/K
    x_air: float = 0.7  # air-side share of coil thermal resistance
    tau_coil: float = 60.0  # coil response time constant, s
    p_fan_d: float = 30e3  # fan power per unit at full speed, W
    n_fan: float = 2.7  # fan affinity exponent (ideal cube law is 3)
    s_min: float = 0.3  # minimum fan speed
    m_w_crah: float = 8.4  # chilled-water flow per unit with the valve fully open, kg/s

    # --- Water ---
    rho_w: float = 998.0
    cp_w: float = 4186.0
    vol_chws: float = 40.0  # supply header and piping volume, m³
    vol_chwr: float = 40.0  # return header and piping volume, m³
    m_chw_min_frac: float = 0.25  # chiller minimum evaporator flow, share of design flow (bypass)

    # --- Chillers (Level 1: Carnot fraction with a part-load curve) ---
    n_ch: int = 3
    q_ch: float = 2.8e6  # capacity per chiller, W
    eta_carnot: float = 0.55
    approach_evap: float = 1.5  # refrigerant evaporating temperature below leaving chilled water, K
    approach_cond: float = 1.5  # condensing temperature above leaving condenser water, K
    plr_min: float = 0.15  # below this the chiller false-loads
    ramp_per_s: float = 0.10 / 60  # loading ramp limit, fraction of capacity per second
    t_restart: float = 12 * 60.0  # restart delay after a trip or outage, s
    stage_up_s: float = 120.0  # staging condition must hold this long
    stage_down_s: float = 600.0

    # --- Waterside economizer (plate heat exchanger in series ahead of the chillers) ---
    eps_hx: float = 0.85

    # --- Cooling towers (Level 1: approach curve) ---
    n_cells: int = 4
    approach_d: float = 3.5  # tower approach at design rejection and full fan, K
    q_rej_d: float = 5.6e6  # design heat rejection, W
    p_ct_d: float = 12e3  # fan power per cell at full speed, W
    vol_basin: float = 100.0  # m³
    t_cws_min: float = 15.0  # chiller minimum entering condenser water, °C
    t_cws_freeze: float = 5.0  # lowest condenser water allowed in economizer mode, °C
    coc: float = 3.0  # cycles of concentration
    f_lat: float = 0.85  # latent share of tower heat rejection
    h_fg: float = 2.43e6  # J/kg
    m_cw: float = 155.0  # condenser water flow (constant speed), kg/s

    # --- Pumps ---
    m_chw_d: float = 134.0  # design chilled-water flow, kg/s
    h_chw: float = 30.0  # design head, m
    h_chw_sp: float = 8.0  # differential-pressure setpoint head, m
    h_cw: float = 22.0  # condenser-water head, m
    eta_pump: float = 0.65  # wire-to-water efficiency

    # --- Electrical chain ---
    ups_modules: int = 8  # 2N: two systems of four modules
    ups_module_rating: float = 1.5e6
    ups_a: tuple[float, float, float] = (0.012, 0.015, 0.008)  # loss = rating·(a0 + a1·ℓ + a2·ℓ²)
    c_dist: float = 0.01  # PDU and busway loss, share of IT
    tx_rating: float = 7.5e6
    tx_nl: float = 0.002  # transformer no-load loss, share of rating
    tx_ll: float = 0.010  # transformer load loss at rating, share of rating
    f_misc: float = 0.01  # lighting, BMS, offices: share of design IT
    t_gen: float = 60.0  # generator start and transfer after a utility outage, s

    # --- Comfort and safety limits (ASHRAE) ---
    inlet_recommended: float = 27.0
    inlet_allowable: float = 32.0

    extra: dict = field(default_factory=dict)

    @property
    def design_it(self) -> float:
        return self.n_pods * self.p_cap
