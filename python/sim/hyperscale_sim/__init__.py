"""hyperscale_sim: the Kestrel Ridge data-hall simulator (Level 1).

    from hyperscale_sim import Hall
    hall = Hall("summer-day")
    hall.set_controls(chws_sp=18, t_sa_sp=25)
    hall.run(24 * 3600)
    print(hall.metrics.summary())
"""
from .field import InletField, Layout
from .hall import Controls, Hall, Metrics, chiller_power, counterflow_effectiveness, fan_power
from .params import Params
from .scenarios import SCENARIOS, Scenario, constant, get_scenario

__all__ = ["Controls", "Hall", "InletField", "Layout", "Metrics", "Params", "SCENARIOS", "Scenario", "chiller_power", "constant", "counterflow_effectiveness", "fan_power", "get_scenario"]
__version__ = "0.2.0"
