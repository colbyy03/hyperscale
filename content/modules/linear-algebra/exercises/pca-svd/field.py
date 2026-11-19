"""A synthetic rack-inlet temperature field for one pod (the same recipe as the lesson's explorer).

make_field() returns an (hours, 72) array in °C: 2 rows x 12 racks x 3 sensor heights, with
sensor index (row * 12 + rack) * 3 + height (height 0 = low, 1 = mid, 2 = top).
"""
import numpy as np

ROWS, RACKS, HEIGHTS = 2, 12, 3


def patterns():
    r, k, h = np.meshgrid(np.arange(ROWS), np.arange(RACKS), np.arange(HEIGHTS), indexing="ij")
    k, h = k.ravel(), h.ravel()
    uniform = 1.0 - 0.1 * (h == 2)
    edge = np.exp(-np.minimum(k, RACKS - 1 - k) / 1.5)
    recirc = np.array([0.0, 0.3, 1.0])[h] * (1.0 + 1.2 * edge)
    starve = (k / (RACKS - 1)) ** 2 * np.array([0.6, 0.8, 1.0])[h]
    return uniform, recirc, starve, h


def make_field(n_hours=480, seed=0, noise=0.08):
    rng = np.random.default_rng(seed)
    uniform, recirc, starve, h = patterns()
    t = np.arange(n_hours)
    day = t / 24.0
    supply = (
        18.0
        + 0.6 * np.sin(2 * np.pi * (t % 24 - 9) / 24)
        + 2.0 * ((day >= 6) & (day < 9))
        - 1.0 * ((day >= 14) & (day < 16))
        + np.cumsum(rng.normal(0, 0.05, n_hours))
    )
    load = 0.5 + 0.3 * np.sin(2 * np.pi * (t % 24 - 10) / 24) + rng.normal(0, 0.08, n_hours)
    rec = np.clip(load + 0.25 * rng.normal(size=n_hours), 0, None)
    night = ((t % 24) < 6) | ((t % 24) >= 22)
    st = np.clip(0.8 * night + 0.3 * rng.normal(size=n_hours), 0, None)
    base = 1.0 + 0.8 * (h == 2) + rng.normal(0, 0.3, ROWS * RACKS * HEIGHTS)
    return supply[:, None] * uniform + base + 2.5 * rec[:, None] * recirc + 2.0 * st[:, None] * starve + rng.normal(0, noise, (n_hours, len(base)))
