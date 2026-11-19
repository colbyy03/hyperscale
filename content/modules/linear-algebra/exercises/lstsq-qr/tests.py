import inspect

import numpy as np
import pytest
from hsgrade import assert_close

import solution
from solution import back_substitute, lstsq_qr

RNG = np.random.default_rng(13)


def test_back_substitution_by_hand():
    """2x + y − z = 1, 3y + z = 7, 2z = 4  →  z = 2, y = 5/3, x = 2/3."""
    R = np.array([[2.0, 1.0, -1.0], [0.0, 3.0, 1.0], [0.0, 0.0, 2.0]])
    x = back_substitute(R, np.array([1.0, 7.0, 4.0]))
    assert_close(x, [2 / 3, 5 / 3, 2.0], rtol=1e-12, name="back_substitute on the 3×3 example")


def test_matches_numpy_lstsq():
    """A noisy chiller-power fit: same coefficients as np.linalg.lstsq."""
    n = 300
    load = RNG.uniform(0.3, 1.0, n)
    lift = RNG.uniform(15, 30, n)
    X = np.column_stack([np.ones(n), load, lift, load**2])
    y = 50 + 300 * load + 8 * lift + 120 * load**2 + RNG.normal(0, 10, n)
    w = lstsq_qr(X, y)
    assert_close(w, np.linalg.lstsq(X, y, rcond=None)[0], rtol=1e-9, name="coefficients compared with np.linalg.lstsq")


def test_residual_is_orthogonal_to_the_columns():
    """At the solution, Xᵀ(y − Xw) = 0: the defining property of least squares."""
    X = RNG.normal(size=(50, 4))
    y = RNG.normal(size=50)
    r = y - X @ lstsq_qr(X, y)
    assert_close(X.T @ r, np.zeros(4), atol=1e-10, name="X.T @ residual")


@pytest.mark.misconception("normal-equations-square-kappa")
def test_accurate_on_an_ill_conditioned_fit():
    """Degree-10 polynomial on [0, 1] (κ ≈ 2×10⁷) with exact data: QR recovers the coefficients to ~1e-9."""
    t = np.linspace(0, 1, 100)
    X = np.vander(t, 11, increasing=True)
    w_true = np.ones(11)
    w = lstsq_qr(X, X @ w_true)
    err = np.linalg.norm(w - w_true) / np.linalg.norm(w_true)
    assert err < 1e-6, (
        f"relative error {err:.1e} on the degree-10 fit: about {max(0, -np.log10(err)):.0f} correct digits. "
        "QR keeps about 9 here; anything that goes through X.T @ X squares the condition number and keeps about 2."
    )


def test_written_from_scratch():
    """No library solvers: QR plus your own back substitution."""
    src = inspect.getsource(solution)
    for banned in ("solve(", "lstsq(", "inv(", "pinv("):
        assert banned not in src.replace("lstsq_qr(", ""), f"don't call {banned[:-1]}: write the back substitution yourself and use only np.linalg.qr"
