"""Rack-level inlet temperatures: a sensor field spread out from each pod's lumped state.

The hall model is lumped: one cold-aisle temperature and one top-of-rack temperature per pod.
A real pod has inlet sensors at several heights on every rack, and their readings form a field
with structure. Recirculated hot air collects at the tops of the racks and spills over the row
ends; racks far from the CRAH get less cold air when its fans slow down. `InletField` spreads
each pod's state over a rack layout with those two patterns, then adds fixed per-sensor offsets
(floor-tile and blanking-panel placement) and independent sensor noise.

Without offsets, noise or fan starvation, the low sensors read the pod's cold-aisle temperature
and the top sensors average to its lumped top-of-rack temperature.

    from hyperscale_sim import Hall, InletField

    hall = Hall("summer-day", dt=10.0)
    field = InletField(hall.p.n_pods)
    hall.run(600)
    snapshot = field.read(hall)  # {"pod1.A01.low": 24.6, ..., "pod4.B12.top": 25.9}
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass

HEIGHTS = ("low", "mid", "top")


@dataclass(frozen=True)
class Layout:
    """Rows of racks per pod, racks per row (the CRAH sits at rack 1's end), and how each sensor
    height shares the top-of-rack excess and the starvation at the far end."""

    rows: int = 2
    racks: int = 12
    recirculation_share: tuple[float, float, float] = (0.0, 0.3, 1.0)
    starvation_share: tuple[float, float, float] = (0.6, 0.8, 1.0)


class InletField:
    """Inlet sensors at three heights on every rack of every pod; see the module docstring."""

    def __init__(
        self,
        n_pods: int = 4,
        layout: Layout = Layout(),
        seed: int = 0,
        noise: float = 0.05,
        offset_sd: float = 0.3,
        starvation_gain: float = 4.0,
        fan_reference: float = 0.8,
    ):
        self.layout = layout
        self.noise = noise
        self.starvation_gain = starvation_gain  # °C per unit of fan speed below the reference, at the far end
        self.fan_reference = fan_reference
        self._noise_rng = random.Random(seed + 1)
        rng = random.Random(seed)
        racks = layout.racks
        # Recirculation spills over the row ends: amplify the ends, normalized to a rack average of 1.
        ends = [1.0 + 1.2 * math.exp(-min(k, racks - 1 - k) / 1.5) for k in range(racks)]
        mean_end = sum(ends) / racks
        self._ends = [e / mean_end for e in ends]
        self._far = [(k / (racks - 1)) ** 2 for k in range(racks)]
        self.names: list[str] = []
        self._where: list[tuple[int, int, int]] = []  # (pod, rack, height)
        self.offsets: list[float] = []
        for z in range(n_pods):
            for r in range(layout.rows):
                for k in range(racks):
                    for h in range(len(HEIGHTS)):
                        self.names.append(f"pod{z + 1}.{'ABCDEFGH'[r]}{k + 1:02d}.{HEIGHTS[h]}")
                        self._where.append((z, k, h))
                        self.offsets.append(rng.gauss(0.0, offset_sd))

    def truth(self, hall) -> dict[str, float]:
        """The field without sensor noise (offsets included: they're real, fixed differences)."""
        pods = hall.out["pods"]
        rec, sta = self.layout.recirculation_share, self.layout.starvation_share
        values: dict[str, float] = {}
        for name, (z, k, h), offset in zip(self.names, self._where, self.offsets):
            pod = pods[z]
            excess = max(pod["inlet_top"] - pod["inlet"], 0.0)
            starved = max(self.fan_reference - pod["fan_speed"], 0.0)
            values[name] = pod["inlet"] + rec[h] * self._ends[k] * excess + self.starvation_gain * starved * self._far[k] * sta[h] + offset
        return values

    def read(self, hall) -> dict[str, float]:
        """What the sensors report: the true field plus independent Gaussian noise."""
        values = self.truth(hall)
        if self.noise > 0:
            values = {name: v + self._noise_rng.gauss(0.0, self.noise) for name, v in values.items()}
        return values
