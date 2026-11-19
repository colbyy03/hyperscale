from hsgrade.sql import assert_columns, assert_rows, run_learner

from data import grid, make_db, power


def _expected():
    readings = sorted(power())
    out = []
    for t in grid():
        before = [kw for ts, kw in readings if ts <= t]
        out.append((t, before[-1] if before else None))
    return out


def test_columns():
    """Two columns: ts and kw."""
    assert_columns(run_learner(make_db()), ["ts", "kw"])


def test_every_minute_is_kept():
    """31 minutes in, 31 rows out."""
    result = run_learner(make_db())
    assert len(result.rows) == 31, (
        f"expected 31 rows (one per minute), got {len(result.rows)}. An equality join only matches exact timestamps, "
        "and a plain ASOF JOIN drops minutes before the first reading; ASOF LEFT JOIN keeps them."
    )


def test_latest_reading_at_or_before_each_minute():
    """Each minute carries the most recent earlier reading, or NULL."""
    assert_rows(run_learner(make_db()), _expected(), ordered=True)
