import numpy as np
import pytest
from hsgrade import assert_close, assert_shape, assert_vectorized

import solution
from field import make_field
from solution import pca

X = make_field()  # (480, 72) inlet temperatures, °C


def test_shapes_and_orthonormal_components():
    """Three unit-length, mutually orthogonal rows of length 72."""
    mean, C, explained, scores = pca(X, 3)
    assert_shape(mean, (72,), "mean")
    assert_shape(C, (3, 72), "components")
    assert_shape(explained, (3,), "explained")
    assert_shape(scores, (480, 3), "scores")
    assert_close(C @ C.T, np.eye(3), atol=1e-10, name="components @ components.T")


@pytest.mark.misconception("pca-needs-centering")
def test_variance_fractions_match_the_covariance():
    """explained = the covariance matrix's top eigenvalues divided by its trace."""
    mean, C, explained, _ = pca(X, 3)
    assert_close(mean, X.mean(axis=0), name="mean")
    lam = np.linalg.eigvalsh(np.cov(X, rowvar=False))[::-1]
    assert explained[0] < 0.95, (
        f"the first component claims {explained[0]:.4f} of the variance: it's pointing at the mean field. "
        "Subtract each sensor's mean before the SVD."
    )
    assert_close(explained, lam[:3] / lam.sum(), rtol=1e-8, name="explained variance fractions")


def test_scores_and_reconstruction():
    """scores = centered data · components; mean + scores @ components rebuilds X (all 72) or ~noise (3)."""
    mean, C, _, scores = pca(X, 3)
    assert_close(scores, (X - X.mean(axis=0)) @ C.T, rtol=1e-9, atol=1e-9, name="scores")
    rms3 = np.sqrt(((mean + scores @ C - X) ** 2).mean())
    assert rms3 < 0.1, f"three components should rebuild the field to about the 0.08 °C sensor noise; RMS error {rms3:.3f} °C"
    mean, C, _, scores = pca(X, 72)
    assert_close(mean + scores @ C, X, rtol=1e-9, atol=1e-8, name="reconstruction from all 72 components")


def test_sign_convention():
    """Each component's largest-magnitude entry is positive, so results don't flip between runs."""
    _, C, _, _ = pca(X, 4)
    picks = C[np.arange(4), np.abs(C).argmax(axis=1)]
    assert (picks > 0).all(), f"the largest-magnitude entry of each component should be positive; got {np.round(picks, 3)}"


def test_no_python_loops():
    """Vectorized: no for/while loops."""
    assert_vectorized(solution.pca)
