import inspect

import numpy as np
import pytest
from hsgrade import assert_close, assert_finite, assert_shape, assert_vectorized

import solution
from solution import pinv

RNG = np.random.default_rng(29)


def test_matches_numpy_for_tall_and_wide():
    """Full-rank tall and wide matrices: same as np.linalg.pinv, with the transposed shape."""
    for shape in ((20, 4), (3, 7)):
        A = RNG.normal(size=shape)
        P = pinv(A)
        assert_shape(P, shape[::-1], f"pinv of a {shape} matrix")
        assert_close(P, np.linalg.pinv(A), rtol=1e-9, atol=1e-12, name=f"pinv of a {shape} matrix")


def test_least_squares_for_independent_columns():
    """For a tall X with independent columns, pinv(X) @ y is the least-squares solution."""
    X = RNG.normal(size=(50, 3))
    y = RNG.normal(size=50)
    w = pinv(X) @ y
    assert_close(X.T @ (y - X @ w), np.zeros(3), atol=1e-10, name="X.T @ residual")


@pytest.mark.misconception("pinv-cutoff")
def test_minimum_norm_in_the_dummy_variable_trap():
    """Intercept plus all three season indicators (rank 3 of 4): the minimum-norm solution, with finite entries."""
    season = RNG.integers(0, 3, 60)
    X = np.column_stack([np.ones(60), season == 0, season == 1, season == 2]).astype(float)
    y = np.array([20.0, 23.0, 25.0])[season] + RNG.normal(0, 0.1, 60)
    w = pinv(X) @ y
    assert_finite(w, "pinv(X) @ y")
    assert np.abs(w).max() < 100, (
        f"coefficients {np.round(w, 2)}: inverting the rounding-noise singular value of a rank-deficient X blows them up. "
        "Treat singular values at or below rtol × σ_max as zero."
    )
    assert_close(w, np.linalg.lstsq(X, y, rcond=None)[0], rtol=1e-8, atol=1e-10, name="minimum-norm coefficients for the dummy-variable trap")


@pytest.mark.misconception("relative-tolerance")
def test_the_cutoff_is_relative():
    """Scaling A by 10⁻¹³ (say, values in TW instead of W) scales A⁺ by 10¹³; nothing is dropped."""
    A = RNG.normal(size=(6, 4))
    assert_close(pinv(1e-13 * A), 1e13 * np.linalg.pinv(A), rtol=1e-8, name="pinv(1e-13 * A)")


def test_written_from_scratch():
    """Build it from the SVD."""
    src = inspect.getsource(solution)
    assert "linalg.pinv" not in src and "lstsq" not in src, "build A⁺ from np.linalg.svd yourself; np.linalg.pinv is what you compare against"
    assert_vectorized(solution.pinv)
