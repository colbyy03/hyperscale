import datetime as dt
from collections import defaultdict

import pytest
from hsgrade.sql import assert_columns, assert_rows, run_learner

from data import make_db, rows


def _expected():
    fac, it, ratios = defaultdict(float), defaultdict(float), defaultdict(list)
    for ts, i, f in rows():
        d = ts.date()
        fac[d] += f
        it[d] += i
        ratios[d].append(f / i)
    days = sorted(fac)
    return [(d, fac[d] / it[d]) for d in days], [(d, sum(ratios[d]) / len(ratios[d])) for d in days]


def test_columns():
    """Two columns: day and pue."""
    assert_columns(run_learner(make_db()), ["day", "pue"])


def test_one_row_per_day():
    """Three days, three rows."""
    result = run_learner(make_db())
    assert len(result.rows) == 3, f"expected 3 rows (one per day), got {len(result.rows)}. Group by the date, not the timestamp."


@pytest.mark.misconception("average-of-ratios")
def test_energy_weighted_pue():
    """Each day's PUE is total facility energy divided by total IT energy."""
    result = run_learner(make_db())
    good, averaged = _expected()
    got = [(r[0], r[1]) for r in result.rows]
    if len(got) == 3 and all(abs(g[1] - a[1]) < 1e-9 for g, a in zip(sorted(got, key=lambda r: str(r[0])), averaged)):
        raise AssertionError(
            "That's the average of the 15-minute PUE values. It gives a quiet night interval the same weight as a busy afternoon. "
            "A period's PUE is total facility energy ÷ total IT energy: SUM(facility_kw) / SUM(it_kw)."
        )
    assert_rows(result, good, ordered=True, rtol=1e-9)


@pytest.mark.hidden
def test_day_is_a_date():
    """day is a DATE, not a timestamp or text."""
    result = run_learner(make_db())
    assert isinstance(result.rows[0][0], dt.date) and not isinstance(result.rows[0][0], dt.datetime), f"day should be a DATE (CAST(ts AS DATE)), got {type(result.rows[0][0]).__name__}"
