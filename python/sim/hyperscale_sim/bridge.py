"""JSON interface used by the browser (Pyodide worker): one string in, one string out.

Simulators live in this module's registry between calls, so the page can create one, then
advance it in small slices while the learner moves sliders.
"""
from __future__ import annotations

import json
from dataclasses import asdict

from .hall import Controls, Hall
from .scenarios import SCENARIOS

_sims: dict[int, Hall] = {}
_next = 1

SNAPSHOT_EVERY = 60.0  # seconds of simulated time between points returned to the page


def _snapshot(h: Hall) -> dict:
    return {
        "t": h.t,
        "done": h.done,
        "duration": h.scenario.duration,
        "out": h.out,
        "kpis": h.metrics.summary(),
        "controls": asdict(h.controls),
        "events": h.events[-20:],
    }


def handle(req: dict) -> dict:
    global _next
    op = req.get("op")
    if op == "scenarios":
        return {"scenarios": [{"id": s.id, "title": s.title, "summary": s.summary, "tags": list(s.tags)} for s in SCENARIOS.values()]}
    if op == "reference":
        return {"kpis": reference_run(req.get("scenario", "summer-day"), req.get("controls"))}
    if op == "create":
        controls = Controls(**req.get("controls", {}))
        h = Hall(req.get("scenario", "summer-day"), controls=controls, dt=float(req.get("dt", 5.0)))
        sid = _next
        _next += 1
        _sims[sid] = h
        return {"id": sid, **_snapshot(h)}
    h = _sims.get(int(req.get("id", 0)))
    if h is None:
        raise ValueError("unknown simulator id (the page may have reloaded); create a new one")
    if op == "controls":
        h.set_controls(**req.get("controls", {}))
        return _snapshot(h)
    if op == "advance":
        # Advance up to `seconds`, returning one point per SNAPSHOT_EVERY for the charts.
        seconds = min(float(req.get("seconds", 600.0)), h.scenario.duration - h.t)
        points = []
        end = h.t + seconds
        while h.t < end - 1e-9:
            h.run(min(SNAPSHOT_EVERY, end - h.t))
            o = h.out
            points.append({"t": h.t, "pue": o["power"]["pue"], "inlet_max": max(pod["inlet_top"] for pod in o["pods"]), "t_wb": o["t_wb"], "facility_kw": o["power"]["facility_kw"], "chws": o["plant"]["chws"]})
        return {**_snapshot(h), "points": points}
    if op == "fault":
        kind, args = req.get("kind"), req.get("args", {})
        if kind == "chiller_trip":
            h.trip_chiller(args.get("chiller"))
        elif kind == "crah_failure":
            h.fail_crah(int(args.get("pod", 1)), int(args.get("units", 1)))
        elif kind == "crah_restore":
            h.restore_crah(int(args.get("pod", 1)))
        elif kind == "containment":
            h.set_containment(int(args.get("pod", 2)), float(args.get("r0", 0.2)))
        elif kind == "outage":
            h.utility_outage()
        elif kind == "it_step":
            h.it_step(int(args.get("pod", 0)), float(args.get("delta", 0.2)))
        elif kind == "sensor_bias":
            h.set_sensor_fault(str(args["sensor"]), bias=float(args.get("bias", 2.0)))
        else:
            raise ValueError(f"unknown fault {kind!r}")
        return _snapshot(h)
    if op == "dispose":
        _sims.pop(int(req["id"]), None)
        return {"ok": True}
    raise ValueError(f"unknown op {op!r}")


def handle_json(text: str) -> str:
    return json.dumps(handle(json.loads(text)))


def reference_run(scenario: str = "summer-day", controls: dict | None = None, dt: float = 10.0) -> dict:
    """Run a whole scenario headlessly (for the default-settings comparison)."""
    h = Hall(scenario, controls=Controls(**(controls or {})), dt=dt)
    h.run(h.scenario.duration)
    return h.metrics.summary()
