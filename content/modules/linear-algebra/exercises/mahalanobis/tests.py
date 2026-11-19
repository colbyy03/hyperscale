import inspect

import numpy as np
import pytest
from hsgrade import assert_close, assert_finite, assert_shape, assert_vectorized

import solution
from field import make_field
from solution import distances, fit

FIELD = make_field()


def test_distances_on_a_correlated_pair():
    """Σ = [[1, 0.9], [0.9, 1]]: (1, 1) follows the correlation (d ≈ 1.03); (1, −1) fights it (d ≈ 4.47)."""
    S = np.array([[1.0, 0.9], [0.9, 1.0]])
    Y = np.array([[1.0, 1.0], [1.0, -1.0]])
    d = distances(Y, np.zeros(2), np.linalg.cholesky(S))
    assert_shape(d, (2,), "distances for two points")
    want = np.sqrt(np.einsum("ij,jk,ik->i", Y, np.linalg.inv(S), Y))
    assert_close(d, want, rtol=1e-10, name="Mahalanobis distances of (1, 1) and (1, −1)")


@pytest.mark.misconception("np-cov-rowvar")
def test_fit_matches_the_textbook_formula():
    """Mean and covariance of the snapshots (columns are the variables), then the distances agree with inv()."""
    rng = np.random.default_rng(4)
    X = rng.normal(size=(500, 3)) @ np.array([[2.0, 0.0, 0.0], [1.5, 0.5, 0.0], [0.3, -0.4, 0.2]])
    mu, L = fit(X, ridge=0.0)
    assert_shape(L, (3, 3), "L (one row and column per variable; pass rowvar=False to np.cov)")
    assert_close(L @ L.T, np.cov(X, rowvar=False), rtol=1e-9, name="L @ L.T compared with the covariance")
    Y = rng.normal(size=(5, 3))
    S_inv = np.linalg.inv(np.cov(X, rowvar=False))
    want = np.sqrt(np.einsum("ij,jk,ik->i", Y - mu, S_inv, Y - mu))
    assert_close(distances(Y, mu, L), want, rtol=1e-8, name="distances compared with the formula")


def test_pattern_beats_size():
    """From the mean field: one mid-height sensor 1 °C above its neighbours is far more unusual than the whole pod 1 °C warmer."""
    mu, L = fit(FIELD[:360])
    bump = mu.copy()
    bump[16] += 1.0  # row A, rack 6, mid height
    warm = mu + 1.0
    d_bump, d_warm = distances(np.array([bump, warm]), mu, L)
    assert d_bump > 3 * d_warm, (
        f"the local bump scored {d_bump:.1f} and the uniform warming {d_warm:.1f}; the bump should score far higher. "
        "Euclidean distance gets this backwards (1 against √72 ≈ 8.5); the covariance has to do the work."
    )


def test_more_sensors_than_snapshots():
    """40 snapshots of 72 sensors: the covariance is singular, and the ridge keeps Cholesky working."""
    hint = "distances from a 40-snapshot fit (that covariance is singular: add the ridge before factoring)"
    try:
        mu, L = fit(FIELD[:40])
        d = distances(FIELD[100:105], mu, L)
    except np.linalg.LinAlgError as e:
        raise AssertionError(f"{hint} raised LinAlgError: {e}") from None
    assert_finite(d, hint)


def test_no_inverse_and_no_loops():
    """Solve with the Cholesky factor; don't form Σ⁻¹."""
    src = inspect.getsource(solution)
    assert "inv(" not in src and "pinv" not in src, "solve L z = y − μ instead of forming the inverse covariance"
    assert_vectorized(solution.fit)
    assert_vectorized(solution.distances)
