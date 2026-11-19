import tracemalloc

import numpy as np
import pytest
from hsgrade import assert_close, assert_shape, assert_vectorized

import solution
from solution import high_leverage, leverages

RNG = np.random.default_rng(37)


def test_matches_the_hat_matrix_on_a_small_problem():
    """On 30 readings, the leverages equal the diagonal of X (XᵀX)⁻¹ Xᵀ."""
    X = RNG.normal(size=(30, 4))
    h = leverages(X)
    assert_shape(h, (30,), "leverages(X)")
    assert_close(h, np.diag(X @ np.linalg.inv(X.T @ X) @ X.T), rtol=1e-9, name="leverages compared with diag(H)")


def test_leverages_add_up_to_p():
    """Each leverage is between 0 and 1, and they sum to p = trace(H)."""
    X = np.column_stack([np.ones(200), RNG.normal(size=(200, 4))])
    h = leverages(X)
    assert ((h >= -1e-12) & (h <= 1 + 1e-12)).all(), "every leverage must lie between 0 and 1"
    assert_close(h.sum(), 5.0, rtol=1e-9, name="sum of leverages (should be p = 5)")


def test_an_extreme_operating_point_stands_out():
    """A chiller logged once at 140% load, far outside the usual 30–100%, has the highest leverage."""
    n = 300
    load = RNG.uniform(0.3, 1.0, n)
    load[123] = 1.4
    lift = RNG.uniform(15, 30, n)
    X = np.column_stack([np.ones(n), load, lift, load**2])
    got = [int(i) for i in high_leverage(X)]
    assert got and got[0] == 123, f"reading 123 (140% load) should have the highest leverage and come first; got {got[:5]}"
    h = leverages(X)
    assert all(h[i] > 2 * 4 / n for i in got), "every returned reading must exceed 2 × p/n"
    above_average = [int(i) for i in high_leverage(X, factor=1.0)]
    assert len(above_average) > 20, f"with factor=1.0, every reading above the average leverage should be returned; got {len(above_average)}"
    assert all(h[a] >= h[b] for a, b in zip(above_average, above_average[1:])), "high_leverage must list the readings from highest leverage down"


@pytest.mark.misconception("hat-matrix-memory")
def test_never_forms_an_n_by_n_matrix():
    """4,000 readings: the hat matrix alone would take 128 MB. Stay under 16 MB."""
    X = RNG.normal(size=(4000, 5))
    tracemalloc.start()
    try:
        leverages(X)
        peak = tracemalloc.get_traced_memory()[1]
    finally:
        tracemalloc.stop()
    assert peak < 16e6, f"leverages(X) peaked at {peak / 1e6:.0f} MB for 4,000 × 5 data: something n × n was formed. Use the row norms of Q from a thin QR."


def test_no_python_loops():
    """Vectorized: no loops."""
    assert_vectorized(solution.leverages)
    assert_vectorized(solution.high_leverage)
