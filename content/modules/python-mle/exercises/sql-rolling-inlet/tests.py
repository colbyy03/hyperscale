from collections import defaultdict

import pytest
from hsgrade.sql import assert_columns, assert_rows, run_learner

from data import make_db, rows


def _expected():
    by_rack = defaultdict(list)
    for ts, rack, temp in rows():
        by_rack[rack].append((ts, temp))
    out = []
    for rack in sorted(by_rack):
        series = sorted(by_rack[rack])
        for k, (ts, _) in enumerate(series):
            window = [t for _, t in series[max(0, k - 14): k + 1]]
            avg = sum(window) / len(window)
            if avg > 27.0:
                out.append((rack, ts, avg))
    return out


def test_columns():
    """Three columns: rack, ts, avg15."""
    assert_columns(run_learner(make_db()), ["rack", "ts", "avg15"])


@pytest.mark.misconception("window-partition")
def test_alerts_match_the_rule():
    """Exactly the minutes whose trailing 15-minute average per rack is above 27 °C."""
    result = run_learner(make_db())
    expected = _expected()
    assert_rows(
        result,
        expected,
        ordered=True,
        rtol=1e-9,
        hint_too_many="Too many alerts: are you filtering on single readings instead of the rolling average, or mixing racks in one window (PARTITION BY rack)?",
        hint_too_few="Too few alerts: check the window frame (the current row and the 14 before it) and that each rack has its own window.",
    )


@pytest.mark.hidden
def test_only_the_warm_rack_alerts():
    """Only A03 is warm enough to trip the rule."""
    result = run_learner(make_db())
    assert {r[0] for r in result.rows} == {"A03"}, f"only rack A03 should alert, got {sorted({r[0] for r in result.rows})}"
