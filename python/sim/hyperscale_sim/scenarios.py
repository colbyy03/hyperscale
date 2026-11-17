"""Scenarios: one day of weather, IT load, electricity price and grid carbon at Kestrel Ridge.

Weather is a smooth daily cycle shaped like a semi-arid inland Pacific Northwest site: hot,
dry summer afternoons with a low wet-bulb, cool nights, cold winters. Real weather files arrive
with the forecasting modules; these synthetic days keep the Control Room self-contained.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Env:
    hour: float  # hour of day, 0-24
    t_db: float  # outdoor dry-bulb, °C
    t_wb: float  # outdoor wet-bulb, °C
    util: tuple[float, ...]  # server utilization per pod, 0-1
    price: float  # $/kWh
    carbon: float  # kg CO2e/kWh


def _cycle(hour: float, mean: float, amp: float, peak: float) -> float:
    return mean + amp * math.cos(2 * math.pi * (hour - peak) / 24.0)


@dataclass(frozen=True)
class Scenario:
    id: str
    title: str
    summary: str
    duration: float = 24 * 3600.0
    start_hour: float = 0.0
    t_db: tuple[float, float, float] = (24.0, 9.0, 16.0)  # mean, amplitude, peak hour
    t_wb: tuple[float, float, float] = (15.0, 3.0, 15.0)
    web_util: tuple[float, float, float] = (0.6, 0.12, 14.0)  # pods running services
    training_pods: tuple[int, ...] = (3,)  # pods running long training jobs (0-based)
    training_util: tuple[float, float] = (0.85, 0.5)  # during a job, between jobs
    training_hours: tuple[float, float] = (2.0, 20.0)  # job runs between these hours
    price: tuple[float, float] = (0.06, 0.12)  # off-peak, peak (16:00-21:00) $/kWh
    carbon: tuple[float, float] = (0.11, 0.17)  # kg/kWh off-peak, peak
    constant: bool = False  # hold everything at its start-of-day value (tests)
    tags: tuple[str, ...] = field(default_factory=tuple)

    def at(self, t: float, n_pods: int = 4) -> Env:
        hour = (self.start_hour + (0.0 if self.constant else t / 3600.0)) % 24.0
        t_db = _cycle(hour, *self.t_db)
        t_wb = min(_cycle(hour, *self.t_wb), t_db)
        web = min(1.0, max(0.0, _cycle(hour, *self.web_util)))
        lo, hi = self.training_hours
        train = self.training_util[0] if lo <= hour < hi else self.training_util[1]
        util = tuple(train if z in self.training_pods else web for z in range(n_pods))
        peak = 16.0 <= hour < 21.0
        return Env(hour, t_db, t_wb, util, self.price[1] if peak else self.price[0], self.carbon[1] if peak else self.carbon[0])


SCENARIOS: dict[str, Scenario] = {
    s.id: s
    for s in [
        Scenario(
            id="summer-day",
            title="Summer day",
            summary="A hot, dry July day: 15 °C at dawn, 33 °C by late afternoon, wet-bulb 12-18 °C. Free cooling at night, mechanical cooling in the afternoon.",
        ),
        Scenario(
            id="shoulder-day",
            title="Spring day",
            summary="A mild April day: 5-19 °C with a low wet-bulb. The economizer can carry most of the load if you let it.",
            t_db=(12.0, 7.0, 15.0),
            t_wb=(6.0, 3.0, 15.0),
        ),
        Scenario(
            id="heat-wave",
            title="Heat-wave day",
            summary="A heat-dome afternoon: 42 °C peak, wet-bulb up to 23 °C. No free cooling, high lift, chillers near their limit.",
            t_db=(33.0, 9.0, 16.0),
            t_wb=(20.0, 3.0, 15.0),
            tags=("stress",),
        ),
        Scenario(
            id="winter-day",
            title="Winter day",
            summary="A cold January day around freezing. Towers run near their freeze limit and the chillers can rest.",
            t_db=(-2.0, 4.0, 15.0),
            t_wb=(-3.0, 3.0, 15.0),
        ),
    ]
}


def get_scenario(scenario_id: str) -> Scenario:
    try:
        return SCENARIOS[scenario_id]
    except KeyError:
        raise ValueError(f"unknown scenario {scenario_id!r}; choose one of {sorted(SCENARIOS)}") from None


def constant(t_db: float = 25.0, t_wb: float = 15.0, util: float = 0.7, n_pods: int = 4) -> Scenario:
    """A scenario that never changes: for steady-state physics tests."""
    return Scenario(
        id="constant",
        title="Constant conditions",
        summary="Test scenario.",
        t_db=(t_db, 0.0, 0.0),
        t_wb=(t_wb, 0.0, 0.0),
        web_util=(util, 0.0, 0.0),
        training_pods=(),
        constant=True,
    )
