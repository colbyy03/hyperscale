import inspect

import numpy as np
import pytest
from hsgrade import assert_close, assert_shape

import solution
from solution import mgs_qr

RNG = np.random.default_rng(8)


def test_q_times_r_rebuilds_a():
    """A = QR, with the thin shapes."""
    A = RNG.normal(size=(30, 5))
    Q, R = mgs_qr(A)
    assert_shape(Q, (30, 5), "Q")
    assert_shape(R, (5, 5), "R")
    assert_close(Q @ R, A, rtol=1e-10, atol=1e-12, name="Q @ R")


def test_q_has_orthonormal_columns():
    """QᵀQ = I for a well-conditioned matrix."""
    Q, _ = mgs_qr(RNG.normal(size=(30, 5)))
    assert_close(Q.T @ Q, np.eye(5), atol=1e-12, name="Q.T @ Q")


def test_r_is_upper_triangular_with_a_positive_diagonal():
    """Below the diagonal R is zero; on it, R holds the lengths you divided by."""
    _, R = mgs_qr(RNG.normal(size=(12, 4)))
    assert_close(np.tril(R, -1), np.zeros((4, 4)), atol=1e-12, name="entries of R below the diagonal")
    assert (np.diag(R) > 0).all(), f"the diagonal of R should be positive (column norms); got {np.round(np.diag(R), 3)}"


def test_matches_numpy_up_to_signs():
    """Householder QR (np.linalg.qr) gives the same factors, up to the sign of each column."""
    A = RNG.normal(size=(20, 4))
    Q, R = mgs_qr(A)
    Qn, Rn = np.linalg.qr(A)
    s = np.sign(np.diag(Rn))
    assert_close(R, s[:, None] * Rn, rtol=1e-9, atol=1e-12, name="R compared with np.linalg.qr")
    assert_close(Q, Qn * s, rtol=1e-9, atol=1e-12, name="Q compared with np.linalg.qr")


@pytest.mark.misconception("classical-gram-schmidt")
def test_stays_orthogonal_on_an_ill_conditioned_matrix():
    """Polynomial features 1, t, …, t¹¹ on [0, 1] (condition number ~10⁸): Q must stay orthogonal."""
    A = np.vander(np.linspace(0, 1, 50), 12, increasing=True)
    Q, R = mgs_qr(A)
    err = np.linalg.norm(Q.T @ Q - np.eye(12))
    assert err < 1e-6, (
        f"‖QᵀQ − I‖ = {err:.2g} on an ill-conditioned matrix: the columns of Q have stopped being orthogonal. "
        "Classical Gram-Schmidt projects against the original columns; subtract each new direction from the remaining, already-updated columns instead."
    )
    assert_close(Q @ R, A, rtol=1e-9, atol=1e-12, name="Q @ R for the ill-conditioned matrix")


def test_written_from_scratch():
    """np.linalg.qr is the comparison, not the implementation."""
    src = inspect.getsource(solution)
    assert "linalg.qr" not in src and "qr(" not in src.replace("mgs_qr(", ""), "write the Gram-Schmidt loop yourself; np.linalg.qr is what you compare against afterwards"
