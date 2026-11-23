import math

import pytest

from solution import PI

TS, TAU, GAIN = 10.0, 90.0, 16.0  # full valve cools the air by 16 °C
A = math.exp(-TS / TAU)
KP, KI = 0.1875, 0.1875 / 90  # SIMC tuning for this coil


def simulate(steps, setpoint=18.0, return_air=lambda k: 26.0):
    """Supply air T responds to the valve u through a first-order lag; returns (temps, valves)."""
    pi = PI(KP, KI, TS)
    T, temps, valves = 18.0, [], []
    for k in range(steps):
        sp = setpoint(k) if callable(setpoint) else setpoint
        u = pi.step(sp, T)
        T = A * T + (1 - A) * (return_air(k) - GAIN * u)
        temps.append(T)
        valves.append(u)
    return temps, valves


@pytest.mark.misconception("controller-action")
def test_tracks_a_setpoint_change():
    """Setpoint 18 → 17 °C: the supply air settles at 17 within 1,000 s."""
    temps, _ = simulate(150, setpoint=lambda k: 17.0)
    assert abs(temps[100] - 17.0) < 0.05 and abs(temps[-1] - 17.0) < 0.01, (
        f"supply air at 1,000 s: {temps[100]:.2f} °C, at 1,500 s: {temps[-1]:.2f} °C; it should settle at 17. "
        "A cooling valve opens when the air is too warm: e = measurement − setpoint."
    )


def test_removes_a_steady_load_offset():
    """Return air rises 3 °C for good: the integral term brings the supply air back to 18 °C."""
    temps, valves = simulate(300, return_air=lambda k: 29.0 if k >= 20 else 26.0)
    assert abs(temps[-1] - 18.0) < 0.01, f"steady-state error {temps[-1] - 18.0:+.3f} °C; the integral should remove it"
    assert abs(valves[-1] - 11 / 16) < 0.01, f"the valve should settle at (29 − 18)/16 = 0.6875; got {valves[-1]:.4f}"


@pytest.mark.misconception("integrator-windup")
def test_recovers_from_saturation_without_overshoot():
    """A 10 °C surge for 1,000 s pins the valve at 100%. When it ends, the supply air mustn't overshoot below 17 °C."""
    temps, valves = simulate(300, return_air=lambda k: 36.0 if 20 <= k < 120 else 26.0)
    assert max(valves) > 0.95, f"the surge needs more cooling than the coil has, so the valve should end up (nearly) fully open; max was {max(valves):.2f}"
    low = min(temps[120:])
    assert low > 17.0, (
        f"after the surge ended the supply air fell to {low:.1f} °C: the integral wound up while the valve was pinned at 100%. "
        "Stop integrating when the output is saturated in the direction the error pushes."
    )


def test_output_stays_within_the_valve_limits():
    """Whatever happens, the command is a valid valve position."""
    _, valves = simulate(300, return_air=lambda k: 40.0 if k < 100 else 12.0)
    assert min(valves) >= 0.0 and max(valves) <= 1.0, f"valve commands ranged from {min(valves):.2f} to {max(valves):.2f}; clip to [0, 1]"
