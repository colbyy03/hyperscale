import numpy as np
import pytest

from solution import redundant_columns

RNG = np.random.default_rng(5)
N = 200


@pytest.mark.misconception("dummy-variable-trap")
def test_the_dummy_variable_trap():
    """An intercept plus an indicator for every season: the last indicator is redundant."""
    season = RNG.integers(0, 3, N)
    X = np.column_stack([np.ones(N), season == 0, season == 1, season == 2, RNG.uniform(300, 900, N)]).astype(float)
    got = redundant_columns(X, ["intercept", "summer", "winter", "shoulder", "it_kw"])
    assert got == ["shoulder"], (
        f"expected ['shoulder']: summer + winter + shoulder = intercept for every row, so the last indicator adds nothing; got {got}"
    )


def test_a_sensor_logged_twice_in_different_units():
    """°F = 32 + 1.8 °C is a combination of the intercept and the °C column, but not of the °C column alone."""
    inlet_c = RNG.normal(22, 1.5, N)
    X = np.column_stack([np.ones(N), inlet_c, 32 + 1.8 * inlet_c])
    got = redundant_columns(X, ["intercept", "inlet_c", "inlet_f"])
    assert got == ["inlet_f"], f"with an intercept, inlet_f = 32·intercept + 1.8·inlet_c is redundant; expected ['inlet_f'], got {got}"
    got = redundant_columns(X[:, 1:], ["inlet_c", "inlet_f"])
    assert got == [], f"without an intercept column, inlet_f isn't a multiple of inlet_c (the 32 needs a constant column); expected [], got {got}"


@pytest.mark.misconception("rank-needs-scaling")
def test_wildly_different_units():
    """A cumulative energy counter (~4×10¹⁰ Wh) next to a valve fraction: both carry information."""
    energy_wh = 4.2e10 + np.cumsum(RNG.uniform(5e4, 6e4, N))
    valve_frac = RNG.uniform(0.2, 0.9, N)
    got = redundant_columns(np.column_stack([energy_wh, valve_frac]), ["energy_wh", "valve_frac"])
    assert got == [], (
        f"valve_frac isn't redundant, it's just 10¹¹ times smaller; expected [], got {got}. "
        "Scale each column to unit length before testing the rank."
    )
    it_w = RNG.uniform(3e5, 9e5, N)
    got = redundant_columns(np.column_stack([it_w, valve_frac, it_w / 1000]), ["it_w", "valve_frac", "it_kw"])
    assert got == ["it_kw"], f"it_kw = it_w / 1000; expected ['it_kw'], got {got}"


def test_nearly_collinear_is_a_matter_of_tolerance():
    """Two inlet sensors 5 cm apart differ only by noise: independent at rtol=1e-8, redundant at rtol=1e-2."""
    truth = RNG.normal(22, 1.0, N)
    X = np.column_stack([np.ones(N), truth + RNG.normal(0, 0.05, N), truth + RNG.normal(0, 0.05, N)])
    names = ["intercept", "inlet_a", "inlet_b"]
    got = redundant_columns(X, names)
    assert got == [], f"at the default rtol=1e-8 the sensors are distinct (nearly collinear isn't collinear); expected [], got {got}"
    got = redundant_columns(X, names, rtol=1e-2)
    assert got == ["inlet_b"], f"with rtol=1e-2, inlet_b is within tolerance of inlet_a; expected ['inlet_b'], got {got}. Pass rtol through to matrix_rank."


def test_an_all_zero_column():
    """A column of zeros (a dead meter) is redundant, and dividing by its norm mustn't crash."""
    X = np.column_stack([np.ones(N), np.zeros(N), RNG.normal(size=N)])
    got = redundant_columns(X, ["intercept", "dead_meter", "x"])
    assert got == ["dead_meter"], f"expected ['dead_meter'], got {got}"
