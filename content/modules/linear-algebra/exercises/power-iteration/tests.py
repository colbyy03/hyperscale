import inspect

import numpy as np
import pytest
from hsgrade import assert_close

import solution
from solution import power_iteration


def with_eigenvalues(values, seed=4):
    rng = np.random.default_rng(seed)
    Q, _ = np.linalg.qr(rng.normal(size=(len(values), len(values))))
    return Q @ np.diag(values) @ Q.T, Q


def test_finds_the_dominant_pair():
    """Eigenvalues 5, 2.5, 1, 0.5, 0.2, 0.1: λ = 5 and its eigenvector."""
    A, Q = with_eigenvalues([5.0, 2.5, 1.0, 0.5, 0.2, 0.1])
    lam, v, its = power_iteration(A)
    assert_close(lam, 5.0, rtol=1e-9, name="dominant eigenvalue")
    assert_close(np.linalg.norm(v), 1.0, rtol=1e-12, name="length of v")
    assert_close(A @ v, lam * v, atol=1e-8, name="A @ v compared with lam * v")
    assert_close(abs(v @ Q[:, 0]), 1.0, rtol=1e-9, name="|v · true eigenvector|")


@pytest.mark.misconception("norm-loses-sign")
def test_a_negative_dominant_eigenvalue():
    """Eigenvalues −4, 1, 0.5: the vector flips sign every step, and λ = −4."""
    A, _ = with_eigenvalues([-4.0, 1.0, 0.5])
    lam, v, its = power_iteration(A)
    assert_close(lam, -4.0, rtol=1e-9, name="dominant eigenvalue of a matrix whose eigenvalues are −4, 1, 0.5")


def test_convergence_speed_follows_the_eigenvalue_ratio():
    """With |λ₂/λ₁| = 0.5 the error halves each step: about 35 iterations to 1e-10, not hundreds."""
    A, _ = with_eigenvalues([5.0, 2.5, 1.0, 0.5])
    _, _, its = power_iteration(A)
    assert 20 <= its <= 60, f"expected roughly 35 iterations at a ratio of 0.5 (0.5³⁵ ≈ 3×10⁻¹¹); got {its}. Stop as soon as the change is below tol."


def test_gives_up_when_the_gap_is_tiny():
    """|λ₂/λ₁| = 0.999 needs thousands of steps: with max_iter=50 it must raise."""
    A, _ = with_eigenvalues([1.0, 0.999, 0.5])
    with pytest.raises(RuntimeError) as err:
        power_iteration(A, max_iter=50)
    assert not isinstance(err.value, NotImplementedError), "power_iteration is not written yet"


def test_written_from_scratch():
    """Library eigensolvers are the comparison, not the implementation."""
    src = inspect.getsource(solution)
    for banned in ("eig(", "eigh(", "eigvals", "svd("):
        assert banned not in src, f"don't call np.linalg.{banned.rstrip('(')}: write the power iteration yourself"
