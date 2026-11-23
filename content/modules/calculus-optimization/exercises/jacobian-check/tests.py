import numpy as np
import pytest
from hsgrade import assert_close, assert_shape

from solution import check_jacobian, numerical_jacobian

RNG = np.random.default_rng(41)
X = RNG.normal(size=(5, 3))
W = RNG.normal(size=3)


def f(w):
    return np.tanh(X @ w)  # R³ → R⁵


def jac(w):
    return (1 - np.tanh(X @ w) ** 2)[:, None] * X  # (5, 3)


def softmax(z):
    e = np.exp(z - z.max())
    return e / e.sum()


@pytest.mark.misconception("jacobian-layout")
def test_shape_is_outputs_by_inputs():
    """f maps 3 inputs to 5 outputs, so its Jacobian is 5 × 3."""
    J = numerical_jacobian(f, W)
    assert_shape(J, (5, 3), "numerical_jacobian of a function from R³ to R⁵ (one row per output)")


@pytest.mark.misconception("forward-difference-error")
def test_central_differences_are_accurate():
    """On tanh(Xw) the estimate matches the analytic Jacobian to better than 1e-8."""
    J = numerical_jacobian(f, W)
    rel = np.linalg.norm(J - jac(W)) / np.linalg.norm(jac(W))
    assert rel < 1e-8, f"relative error {rel:.1e}: that's a one-sided difference's accuracy (~h). Use (f(x + h e) − f(x − h e)) / 2h."


def test_does_not_modify_x():
    """The caller's array is untouched."""
    w = W.copy()
    numerical_jacobian(f, w)
    assert_close(w, W, rtol=0, atol=0, name="x after numerical_jacobian")


def test_correct_jacobians_pass():
    """The analytic Jacobians of tanh(Xw) and of softmax pass with tiny errors."""
    ok, rel = check_jacobian(f, jac, W)
    assert ok and rel < 1e-8, f"the correct Jacobian of tanh(Xw) should pass; got ok={ok}, rel_error={rel:.1e}"
    z = RNG.normal(size=4)
    ok, rel = check_jacobian(softmax, lambda v: np.diag(softmax(v)) - np.outer(softmax(v), softmax(v)), z)
    assert ok, f"the correct softmax Jacobian should pass; got rel_error={rel:.1e}"


def test_wrong_jacobians_fail_without_crashing():
    """A missing derivative factor fails; a transposed Jacobian (3 × 5) fails cleanly with an infinite error."""
    ok, rel = check_jacobian(f, lambda w: X, W)
    assert not ok and rel > 1e-3, f"X alone (missing the 1 − tanh² factor) must fail; got ok={ok}, rel_error={rel:.2g}"
    try:
        ok, rel = check_jacobian(f, lambda w: jac(w).T, W)
    except ValueError as e:
        raise AssertionError(f"a transposed (3 × 5) Jacobian made check_jacobian raise ({e}); compare shapes first and return (False, inf)") from None
    assert not ok and rel == float("inf"), f"a transposed Jacobian has the wrong shape: expected (False, inf), got ({ok}, {rel})"
