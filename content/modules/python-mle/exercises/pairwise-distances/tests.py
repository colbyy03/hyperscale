import numpy as np
from hsgrade import assert_close, assert_finite, assert_shape, assert_vectorized

import solution
from solution import pairwise_distances

RNG = np.random.default_rng(21)


def _loops(A, B):
    return np.array([[np.sqrt(((a - b) ** 2).sum()) for b in B] for a in A])


def test_shape_and_values():
    """Matches a slow, obviously correct double loop."""
    A, B = RNG.normal(size=(7, 3)), RNG.normal(size=(5, 3))
    D = pairwise_distances(A, B)
    assert_shape(D, (7, 5), "pairwise_distances(A, B)")
    assert_close(D, _loops(A, B), rtol=1e-10, name="distances")


def test_identical_rows_are_zero():
    """A point is at distance exactly 0 from itself, even for large coordinates."""
    A = 1e8 + RNG.normal(size=(6, 4))
    D = pairwise_distances(A, A)
    assert_finite(D, "pairwise_distances(A, A) for large coordinates")
    assert_close(np.diag(D), np.zeros(6), atol=1e-6, name="the diagonal (distance of each row to itself)")


def test_rectangular_and_one_dimensional_points():
    """Works for d = 1 and for n ≠ m."""
    A = np.array([[0.0], [3.0]])
    B = np.array([[4.0], [0.0], [-1.0]])
    assert_close(pairwise_distances(A, B), [[4.0, 0.0, 1.0], [1.0, 3.0, 4.0]], name="1-D points")


def test_no_python_loops():
    """Vectorized: no for/while loops."""
    assert_vectorized(solution.pairwise_distances)
