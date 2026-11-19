"""Hall A main meters: average power over each 15-minute interval, three summer days."""
import datetime as dt
import math

import duckdb


def rows():
    start = dt.datetime(2026, 7, 14)
    for k in range(3 * 96):
        ts = start + dt.timedelta(minutes=15 * k)
        day, f = k // 96, (k % 96) / 96.0
        it = 1800 + 2600 * max(0.0, math.sin(2 * math.pi * (f - 0.30))) + (0, 400, 200)[day]
        cooling = 380 + 170 * max(0.0, math.sin(2 * math.pi * (f - 0.35))) + (0, 140, 60)[day]
        losses = 310 + 0.065 * it
        yield ts, round(it, 1), round(it + cooling + losses, 1)


def make_db():
    con = duckdb.connect()
    con.execute("CREATE TABLE meter (ts TIMESTAMP, it_kw DOUBLE, facility_kw DOUBLE)")
    con.executemany("INSERT INTO meter VALUES (?, ?, ?)", list(rows()))
    return con
