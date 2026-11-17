"""Validation tests for the Level 1 simulator (research/domain-datacenter.md, section 3.10)."""
import json

import pytest

from hyperscale_sim import Controls, Hall, Params, chiller_power, constant, fan_power
from hyperscale_sim.bridge import handle_json


def steady(scenario, hours=6.0, dt=10.0, params=None, **controls):
    h = Hall(scenario, params=params, controls=Controls(**controls))
    h.run(hours * 3600, dt=dt)
    return h


DESIGN = constant(t_db=30.0, t_wb=20.0, util=1.0)  # design wet-bulb, full IT load


def test_energy_closes_at_steady_state():
    """Coil duty = IT power + CRAH fan heat + envelope gain, within 1% (Test 1)."""
    for economizer in ("off", "auto"):
        h = steady(constant(t_db=22.0, t_wb=14.0, util=0.7), economizer=economizer)
        o = h.out
        coils = o["balance"]["coils_kw"]
        gains = o["power"]["it_kw"] + o["power"]["fans_kw"] + o["balance"]["envelope_kw"]
        assert abs(coils - gains) / coils < 0.01, (economizer, coils, gains)
        # The water side carries the same heat: economizer plus chiller duty.
        plant = o["plant"]["q_hx_kw"] + o["plant"]["q_ch_kw"]
        assert abs(coils - plant) / coils < 0.01, (economizer, coils, plant)


def test_design_point_mechanical_cooling():
    """Supply air 24 °C, hot aisle about 36 °C, chilled water about 16/26 °C, PUE about 1.3 (Test 2)."""
    h = steady(DESIGN, economizer="off")
    o = h.out
    for pod in o["pods"]:
        assert pod["supply_air"] == pytest.approx(24.0, abs=0.2)
        assert 33.0 <= pod["hot_aisle"] <= 38.0
        assert pod["inlet_top"] < 27.0
    assert o["plant"]["chws"] == pytest.approx(16.0, abs=0.2)
    assert 24.0 <= o["plant"]["chwr"] <= 30.0
    assert 1.25 <= o["power"]["pue"] <= 1.35


def test_full_economizer_turns_the_chillers_off():
    """A cold, dry day: tower water alone holds the setpoint and PUE drops to about 1.1-1.2."""
    h = steady(constant(t_db=6.0, t_wb=3.0, util=1.0), hours=8)
    o = h.out
    assert o["plant"]["economizer"] is True
    assert o["power"]["chillers_kw"] == pytest.approx(0.0, abs=1.0)
    assert o["plant"]["chws"] <= 16.2
    assert all(pod["supply_air"] == pytest.approx(24.0, abs=0.2) for pod in o["pods"])
    assert 1.10 <= o["power"]["pue"] <= 1.20


def test_fan_affinity_law():
    """20% less fan speed gives about 45-49% less fan power (Test 5)."""
    p = Params()
    saving = 1 - fan_power(p, 4, 0.8) / fan_power(p, 4, 1.0)
    assert 0.45 <= saving <= 0.49


def test_chiller_sensitivity_to_chilled_water_temperature():
    """About 3.5% chiller power per K of chilled-water temperature at traditional conditions (Test 4),
    and more at the low lift of a warm-water design."""
    p = Params()

    def per_kelvin(t_chw, t_cw):
        a = chiller_power(p, 2.0e6, 1, t_chw, t_cw)
        b = chiller_power(p, 2.0e6, 1, t_chw + 1.0, t_cw)
        return (a - b) / a

    assert 0.03 <= per_kelvin(7.0, 35.0) <= 0.045
    assert per_kelvin(16.0, 30.0) > per_kelvin(7.0, 35.0)


def test_raising_chilled_water_saves_energy_until_the_coils_saturate():
    """CHWS reset: warmer water saves energy, until coils can't hold supply air at setpoint."""
    warm = constant(t_db=30.0, t_wb=19.0, util=0.7)
    p12, p17, p21 = (steady(warm, chws_sp=v, hours=4) for v in (12, 17, 21))
    assert p17.out["power"]["facility_kw"] < p12.out["power"]["facility_kw"]
    assert all(pod["supply_air"] == pytest.approx(24.0, abs=0.2) for pod in p17.out["pods"])
    hot = max(pod["inlet_top"] for pod in p21.out["pods"])
    assert max(pod["supply_air"] for pod in p21.out["pods"]) > 25.0  # coil-limited: supply air floats
    assert hot > 27.0


def test_server_fans_make_pue_misleading():
    """Warmer inlets speed up server fans inside the IT boundary: PUE improves, total energy doesn't."""
    warm = constant(t_db=30.0, t_wb=19.0, util=0.7)
    a = steady(warm, t_sa_sp=26.0, chws_sp=18.5, hours=4).out["power"]
    b = steady(warm, t_sa_sp=27.0, chws_sp=20.0, hours=4).out["power"]
    assert b["pue"] < a["pue"]
    assert b["facility_kw"] > a["facility_kw"]
    assert b["it_kw"] > a["it_kw"]


def test_slow_fans_cause_recirculation_hot_spots():
    warm = constant(t_db=30.0, t_wb=19.0, util=0.7)
    ok = steady(warm, fan_speed=0.75, hours=4).out
    starved = steady(warm, fan_speed=0.55, hours=4).out
    assert max(p["recirculation"] for p in ok["pods"]) == 0.0
    assert max(p["inlet_top"] for p in ok["pods"]) < 27.0
    assert max(p["recirculation"] for p in starved["pods"]) > 0.1
    assert max(p["inlet_top"] for p in starved["pods"]) > 27.0
    assert starved["power"]["fans_kw"] < ok["power"]["fans_kw"]


def test_containment_breach_raises_inlets_and_lowers_return_air():
    """Opening containment (r0 0.03 → 0.2) at fixed airflow: hotter inlets, cooler CRAH return (Test 6)."""
    base = steady(constant(util=0.7), fan_speed=0.8, hours=4)
    breached = Hall(constant(util=0.7), controls=Controls(fan_speed=0.8))
    breached.set_containment(1, 0.2)
    breached.run(4 * 3600, dt=10)
    before, after = base.out["pods"][1], breached.out["pods"][1]
    assert after["inlet_top"] - before["inlet_top"] >= 2.0
    assert after["hot_aisle"] < before["hot_aisle"]


def test_chiller_trip_floats_the_loop_then_recovers():
    h = Hall(DESIGN, controls=Controls(economizer="off"))
    h.run(1800, dt=5)
    assert sum(c["on"] for c in h.out["plant"]["chillers"]) >= 2
    h.trip_chiller()
    worst = 0.0
    for _ in range(10 * 60 // 5):
        h.step(5)
        worst = max(worst, h.out["plant"]["chws"])
    assert worst > 16.5  # capacity lost: chilled water floats above setpoint
    h.run(40 * 60, dt=5)  # restart delay, then staging and ramp
    assert h.out["plant"]["chws"] == pytest.approx(16.0, abs=0.3)
    assert h.events[0]["kind"] == "chiller_trip"


def test_crah_failure_is_covered_by_the_remaining_units():
    h = Hall(constant(util=0.7))
    h.run(3600, dt=10)
    before = h.out["pods"][0]
    h.fail_crah(0)
    h.run(1800, dt=10)
    after = h.out["pods"][0]
    assert after["crah_units"] == 3
    assert after["fan_speed"] > before["fan_speed"]
    assert after["inlet_top"] < 27.0


def test_sensor_faults_change_readings_not_physics():
    a, b = Hall(constant(util=0.7)), Hall(constant(util=0.7))
    b.set_sensor_fault("pod1.inlet", bias=2.0)
    a.run(1800, dt=10)
    b.run(1800, dt=10)
    assert b.truth()["pod1.inlet"] == pytest.approx(a.truth()["pod1.inlet"], abs=1e-9)
    assert b.read()["pod1.inlet"] == pytest.approx(a.read()["pod1.inlet"] + 2.0, abs=1e-9)
    # A biased *control* sensor mis-controls the real temperature: reading 2 K low makes air 2 K warmer.
    c = Hall(constant(util=0.7))
    c.set_sensor_fault("pod1.supply_air", bias=-2.0)
    c.run(3600, dt=10)
    assert c.truth()["pod1.supply_air"] == pytest.approx(26.0, abs=0.2)
    assert c.read()["pod1.supply_air"] == pytest.approx(24.0, abs=0.2)


def test_outage_reproduces_the_published_temperature_rise_shape():
    """Schneider WP179-style room: 400 kW, open hall, 45 m³/s of CRAH air, CHW 7.2 °C, supply 20 °C,
    generators at 60 s, chiller restart at 12 min. Published: a fast early spike, recovery when fans
    return, a peak near 40 °C around 11 minutes, below 32 °C about 17 minutes after the event (Test 3).
    Level 1 reproduces the shape and peak; its peak arrives about 3 minutes later."""
    p = Params(
        n_pods=1, p_cap=400e3, p_idle=1.0, f_sfan=0.0, v_per_w=0.059e-3, vol_ca=1100, vol_ha=2200, r0=0.15,
        crah_per_pod=2, v_crah=22.5, m_w_crah=7.0, ua_coil=30e3, ha_ca=4e3, ha_ha=4e3, c_struct=0.1e9, ua_env=2e3,
        vol_chws=0.5, vol_chwr=0.5, n_ch=1, q_ch=0.6e6, m_chw_d=14.0, q_rej_d=0.5e6, tx_rating=0.8e6,
        ups_modules=2, ups_module_rating=0.5e6, cda_leak=6.0, ramp_per_s=0.5 / 60,
    )
    h = Hall(constant(t_db=25, t_wb=15, util=1.0, n_pods=1), params=p, controls=Controls(t_sa_sp=20, chws_sp=7.2, fan_speed=1.0, economizer="off"))
    h.run(1800, dt=2)
    start = h.out["pods"][0]["inlet"]
    h.utility_outage()
    trace = []
    for _ in range(30 * 60 // 2):
        h.step(2)
        trace.append((h.t - 1800, h.out["pods"][0]["inlet"]))
    spike = max(T for t, T in trace if t <= 62)
    dip = min(T for t, T in trace if 62 < t <= 300)
    peak_t, peak = max(trace, key=lambda x: x[1])
    recovered = next(t for t, T in trace if t > peak_t and T < 32.0)
    assert spike - start >= 3.0  # no airflow for a minute: several kelvin
    assert dip < spike  # fans back on generator power: partial recovery
    assert 36.0 <= peak <= 45.0
    assert 10 * 60 <= peak_t <= 16 * 60  # around the chiller restart
    assert recovered <= 25 * 60


def test_bridge_round_trip():
    created = json.loads(handle_json(json.dumps({"op": "create", "scenario": "summer-day", "controls": {"chws_sp": 17}})))
    sid = created["id"]
    assert created["controls"]["chws_sp"] == 17
    adv = json.loads(handle_json(json.dumps({"op": "advance", "id": sid, "seconds": 3600})))
    assert adv["t"] == pytest.approx(3600)
    assert len(adv["points"]) == 60
    assert adv["kpis"]["it_mwh"] > 0
    json.loads(handle_json(json.dumps({"op": "fault", "id": sid, "kind": "chiller_trip"})))
    after = json.loads(handle_json(json.dumps({"op": "controls", "id": sid, "controls": {"fan_speed": 0.7, "economizer": "off"}})))
    assert after["controls"]["fan_speed"] == 0.7 and after["events"][-1]["kind"] == "chiller_trip"
    ref = json.loads(handle_json(json.dumps({"op": "reference", "scenario": "shoulder-day"})))
    assert ref["kpis"]["hours"] == pytest.approx(24.0) and ref["kpis"]["violation_min"] == 0.0
    scen = json.loads(handle_json(json.dumps({"op": "scenarios"})))
    assert {s["id"] for s in scen["scenarios"]} >= {"summer-day", "heat-wave"}


def test_a_full_day_runs_fast_and_stays_in_the_envelope_with_default_settings():
    import time

    h = Hall("summer-day")
    t0 = time.perf_counter()
    h.run(24 * 3600, dt=5)
    assert time.perf_counter() - t0 < 5.0  # Pyodide is a few times slower; still interactive
    k = h.metrics.summary()
    assert k["violation_min"] == 0.0
    assert 1.15 <= k["pue"] <= 1.25
    assert k["water_m3"] > 0
