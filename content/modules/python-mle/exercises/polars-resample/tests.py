from collections import defaultdict

import polars as pl
import pytest
from hsgrade import assert_vectorized

import solution
from data import readings, rows
from solution import resample_15min


def _expected():
    groups = defaultdict(list)
    for ts, sensor, temp in rows():
        window = ts.replace(minute=ts.minute // 15 * 15, second=0, microsecond=0)
        groups[(sensor, window)].append(temp)
    out = []
    for (sensor, window) in sorted(groups):
        vals = groups[(sensor, window)]
        out.append((sensor, window, sum(vals) / len(vals), len(vals), len(vals) >= 10 and len(set(vals)) == 1))
    return out


def _result():
    try:
        out = resample_15min(readings())
    except pl.exceptions.ComputeError as e:
        if "sorted" in str(e):
            raise AssertionError("Polars says the input isn't sorted. group_by_dynamic needs rows in time order within each sensor: sort by sensor and ts first.") from None
        raise
    assert isinstance(out, pl.DataFrame), f"return a Polars DataFrame, got {type(out).__name__}"
    return out


def test_columns():
    """Five columns, in order: sensor, window, mean_temp, n, stuck."""
    cols = _result().columns
    assert cols == ["sensor", "window", "mean_temp", "n", "stuck"], f"columns should be ['sensor', 'window', 'mean_temp', 'n', 'stuck'], got {cols}"


def test_one_row_per_sensor_and_window():
    """Each sensor gets its own windows (4 sensors, 13 windows in all)."""
    got = _result()
    assert got.height == len(_expected()), (
        f"expected {len(_expected())} rows (one per sensor per 15-minute window), got {got.height}. "
        "Group by sensor as well as by time (group_by_dynamic(..., group_by=\"sensor\"))."
    )


def test_means_and_counts():
    """Window means and reading counts match the data, sorted by sensor and window."""
    got = _result().rows()
    exp = _expected()
    assert len(got) == len(exp), f"expected {len(exp)} rows, got {len(got)}"
    for g, e in zip(got, exp):
        assert (g[0], g[1]) == (e[0], e[1]), f"rows should be sorted by sensor, then window: expected ({e[0]}, {e[1]}), got ({g[0]}, {g[1]})"
        assert abs(g[2] - e[2]) < 1e-9, f"{e[0]} at {e[1]:%H:%M}: mean_temp should be {e[2]:.4f}, got {g[2]:.4f}"
        assert g[3] == e[3], f"{e[0]} at {e[1]:%H:%M}: n should be {e[3]} readings, got {g[3]}"


@pytest.mark.misconception("stuck-needs-evidence")
def test_stuck_flag():
    """Only full windows of identical readings are flagged: T-114 all hour, not T-305's five readings."""
    got = {(r[0], r[1]): r[4] for r in _result().rows()}
    for sensor, window, _, n, stuck in _expected():
        flag = got.get((sensor, window))
        if sensor == "T-305" and flag:
            raise AssertionError(f"T-305 at {window:%H:%M} has only {n} identical readings; that's not enough evidence of a frozen sensor. Flag windows with at least 10 readings.")
        assert flag == stuck, f"{sensor} at {window:%H:%M}: stuck should be {stuck}, got {flag}"


def test_no_python_loops():
    """Built from Polars expressions, not Python loops."""
    assert_vectorized(solution.resample_15min)
