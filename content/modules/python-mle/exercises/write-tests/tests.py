import numpy as np
import pytest

from solution import check_pue


def reference(facility_kwh, it_kwh):
    f = np.asarray(facility_kwh, dtype=float)
    i = np.asarray(it_kwh, dtype=float)
    total_it = float(i.sum())
    if total_it <= 0:
        raise ValueError("total IT energy must be positive")
    return float(f.sum()) / total_it


def swapped(facility_kwh, it_kwh):
    return reference(it_kwh, facility_kwh) if float(np.sum(facility_kwh)) > 0 else reference(facility_kwh, it_kwh)


def average_of_ratios(facility_kwh, it_kwh):
    reference(facility_kwh, it_kwh)  # keeps the error behaviour
    return float(np.mean(np.asarray(facility_kwh, dtype=float) / np.asarray(it_kwh, dtype=float)))


def never_raises(facility_kwh, it_kwh):
    total_it = float(np.sum(it_kwh))
    return float(np.sum(facility_kwh)) / total_it if total_it else float("inf")


def rounded(facility_kwh, it_kwh):
    return round(reference(facility_kwh, it_kwh), 1)


def first_interval_only(facility_kwh, it_kwh):
    return reference(np.atleast_1d(facility_kwh)[:1], np.atleast_1d(it_kwh)[:1])


MUTANTS = {
    "swapped": (swapped, "divides IT by facility (results below 1). Assert a value you worked out by hand."),
    "average_of_ratios": (average_of_ratios, "averages per-interval ratios. Add two intervals at different IT loads and check the ratio of totals."),
    "never_raises": (never_raises, "never raises for zero IT energy. Check the error case with pytest.raises(ValueError)."),
    "rounded": (rounded, "rounds to one decimal. Use an expected value that isn't a round number, compared with pytest.approx."),
    "first_interval_only": (first_interval_only, "only looks at the first interval. Test sequences of several intervals, not just single numbers."),
}


def _rejects(impl):
    try:
        check_pue(impl)
    except NotImplementedError:
        return False  # no checks written yet
    except (AssertionError, pytest.fail.Exception, Exception):
        return True
    return False


@pytest.mark.misconception("float-equality")
def test_accepts_a_correct_implementation():
    """A correct pue passes your checks."""
    try:
        check_pue(reference)
    except NotImplementedError:
        raise
    except (AssertionError, pytest.fail.Exception) as e:
        raise AssertionError(f"your checks reject a correct implementation: {e}. Compare floats with pytest.approx, not ==.") from None


@pytest.mark.parametrize("name", list(MUTANTS))
def test_rejects_a_broken_implementation(name):
    """Your checks catch a plausible bug."""
    impl, hint = MUTANTS[name]
    assert _rejects(impl), f"your checks accept a pue that {hint}"
