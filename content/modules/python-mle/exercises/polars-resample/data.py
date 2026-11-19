"""An hour of one-minute readings from four sensors, exported out of order and with gaps.

T-101 warms steadily; T-114 is frozen at 21.5 °C; T-207 drops out for ten minutes;
T-305 was offline and comes back for the last five minutes reporting a constant value.
"""
import datetime as dt
import random

import polars as pl


def rows():
    start = dt.datetime(2026, 7, 14, 12, 0)
    out = []
    for m in range(60):
        ts = start + dt.timedelta(minutes=m)
        out.append((ts, "T-101", round(24.0 + 0.05 * m, 3)))
        out.append((ts, "T-114", 21.5))
        if not 16 <= m <= 25:
            out.append((ts, "T-207", round(25.2 + 0.4 * ((m * 7) % 5) / 4, 3)))
        if m >= 55:
            out.append((ts, "T-305", 23.0))
    random.Random(4).shuffle(out)
    return out


def readings():
    return pl.DataFrame(rows(), schema=["ts", "sensor", "temp"], orient="row")
