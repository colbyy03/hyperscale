"""One-minute rack-inlet readings for three racks over two hours; A03 sits in a warm spot."""
import datetime as dt
import math

import duckdb

OFFSET = {"A01": 0.0, "A02": 1.4, "A03": 3.1}


def rows():
    start = dt.datetime(2026, 7, 14, 12, 0)
    for m in range(120):
        ts = start + dt.timedelta(minutes=m)
        for rack, off in OFFSET.items():
            temp = 23.6 + off + 1.2 * math.sin(2 * math.pi * m / 90.0) + 0.3 * math.sin(m * 1.7 + off)
            yield ts, rack, round(temp, 2)


def make_db():
    con = duckdb.connect()
    con.execute("CREATE TABLE inlet (ts TIMESTAMP, rack VARCHAR, temp DOUBLE)")
    con.executemany("INSERT INTO inlet VALUES (?, ?, ?)", list(rows()))
    return con
