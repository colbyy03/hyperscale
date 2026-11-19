"""A one-minute timeline, and a power meter that reports at irregular times (first reading after 12:00)."""
import datetime as dt

import duckdb

POWER = [
    ("12:00:40", 410.2), ("12:03:10", 415.5), ("12:04:55", 412.9), ("12:09:30", 420.4),
    ("12:15:00", 418.0), ("12:15:20", 425.1), ("12:22:45", 421.7), ("12:28:05", 430.0),
]


def grid():
    start = dt.datetime(2026, 7, 14, 12, 0)
    return [start + dt.timedelta(minutes=m) for m in range(31)]


def power():
    day = dt.date(2026, 7, 14)
    return [(dt.datetime.combine(day, dt.time.fromisoformat(t)), kw) for t, kw in POWER]


def make_db():
    con = duckdb.connect()
    con.execute("CREATE TABLE grid (ts TIMESTAMP)")
    con.executemany("INSERT INTO grid VALUES (?)", [(t,) for t in grid()])
    con.execute("CREATE TABLE power (ts TIMESTAMP, kw DOUBLE)")
    con.executemany("INSERT INTO power VALUES (?, ?)", power())
    return con
