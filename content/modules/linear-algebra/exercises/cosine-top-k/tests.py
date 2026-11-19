import numpy as np
import pytest
from hsgrade import assert_vectorized

import solution
from solution import most_similar

HOURS = np.arange(24)


def profile(base_kw, swing_kw, peak_hour):
    return base_kw + swing_kw * np.cos(2 * np.pi * (HOURS - peak_hour) / 24)


def as_list(idx):
    return [int(i) for i in np.asarray(idx).ravel()]


def test_same_shape_beats_same_size():
    """A rack twice as big with the same shape ranks above a same-size rack with a shifted peak."""
    q = profile(10, 2.5, 15)
    P = np.array([profile(10, 2.5, 18), profile(20, 5, 15), profile(10, 2.5, 9)])
    got = as_list(most_similar(q, P, 3))
    assert got[0] == 1, f"the rack with the same shape at double the size (row 1) should rank first; got order {got}"
    assert got == [1, 0, 2], f"expected order [1, 0, 2] (same shape, then a 3-hour shift, then a 6-hour shift); got {got}"


@pytest.mark.misconception("cosine-needs-centering")
def test_opposite_shapes_rank_last():
    """A same-size rack peaking 12 hours later is the *least* similar, despite sharing the 10 kW baseline."""
    q = profile(10, 2.5, 15)
    P = np.array([profile(10, 2.5, 3), profile(3.75, 3.5, 15), profile(9.5, 1.5, 14)])
    got = as_list(most_similar(q, P, 3))
    assert got[-1] == 0, (
        f"the rack peaking 12 hours away (row 0) should rank last; got order {got}. "
        "Raw cosine similarity scores it about 0.94, above the same-shaped rack in row 1, because of the shared baseline: center each profile first."
    )
    assert got == [1, 2, 0], f"expected order [1, 2, 0]; got {got}"


@pytest.mark.misconception("cosine-zero-vector")
def test_flat_profiles_are_never_returned():
    """A rack drawing a constant 7.5 kW has no shape to compare."""
    q = profile(10, 2.5, 15)
    P = np.array([np.full(24, 7.5), profile(10, 2.5, 16), profile(5, 1.25, 2)])
    got = as_list(most_similar(q, P, 3))
    assert 0 not in got, f"a perfectly flat profile (row 0) has no defined similarity and must not be returned; got {got}"
    assert got == [1, 2], f"with only two racks that qualify, return both, best first: expected [1, 2], got {got}"


def test_k_limits_the_result_and_a_bigger_search_works():
    """With 500 racks, the planted near-copies come back first."""
    rng = np.random.default_rng(3)
    q = profile(10, 2.5, 15)
    peaks = rng.uniform(0, 24, 500)
    P = profile(rng.uniform(3, 30, (500, 1)), rng.uniform(0.3, 6, (500, 1)), peaks[:, None]) + rng.normal(0, 0.05, (500, 24))
    planted = [17, 250, 401]
    for i, scale in zip(planted, (0.5, 1.5, 3.0)):
        P[i] = scale * q + rng.normal(0, 0.01, 24)
    got = as_list(most_similar(q, P, 3))
    assert len(got) == 3, f"k=3 should return 3 indices; got {len(got)}"
    assert sorted(got) == planted, f"the three scaled copies of q are rows {planted}; got {got}"


def test_no_python_loops():
    """Vectorized: no for/while loops."""
    assert_vectorized(solution.most_similar)
