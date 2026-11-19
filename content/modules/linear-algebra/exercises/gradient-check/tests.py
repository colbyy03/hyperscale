import numpy as np
import pytest
from hsgrade import assert_close

from solution import check_gradient, numerical_gradient

RNG = np.random.default_rng(31)
X = RNG.normal(size=(8, 3))
Y = RNG.normal(size=8)
W = RNG.normal(size=3)


def loss(w):
    return 0.5 * np.sum((X @ w - Y) ** 2)


def grad(w):
    return X.T @ (X @ w - Y)


@pytest.mark.misconception("forward-difference-error")
def test_central_differences_are_accurate():
    """For f(w) = Σ exp(wᵢ), the estimate at h = 1e-5 matches exp(w) to about 1e-11; one-sided gets only 5e-6."""
    w = np.array([0.3, -1.2, 0.8, 2.0])
    g = numerical_gradient(lambda v: np.sum(np.exp(v)), w)
    rel = np.linalg.norm(g - np.exp(w)) / np.linalg.norm(np.exp(w))
    assert rel < 1e-8, f"relative error {rel:.1e} at h = 1e-5: that's a one-sided difference's error (~h). Use (f(w + h e) − f(w − h e)) / 2h."


def test_does_not_modify_w():
    """Nudging coordinates must leave the caller's array as it was."""
    w = W.copy()
    numerical_gradient(loss, w)
    assert_close(w, W, rtol=0, atol=0, name="w after numerical_gradient")


def test_correct_gradient_passes():
    """The least-squares gradient Xᵀ(Xw − y) passes with a tiny relative error."""
    ok, rel = check_gradient(loss, grad, W)
    assert ok and rel < 1e-8, f"a correct gradient should pass with a tiny error; got ok={ok}, rel_error={rel:.1e}"


@pytest.mark.parametrize(
    "name, bad",
    [
        ("sign flipped", lambda w: -X.T @ (X @ w - Y)),
        ("missing the ½ (a factor of 2)", lambda w: 2 * X.T @ (X @ w - Y)),
        ("wrong residual sign inside", lambda w: X.T @ (Y + X @ w)),
    ],
)
def test_broken_gradients_fail(name, bad):
    """Classic hand-derivation slips give relative errors of order 1."""
    ok, rel = check_gradient(loss, bad, W)
    assert not ok and rel > 0.1, f"the '{name}' gradient should fail with a large relative error; got ok={ok}, rel_error={rel:.2g}"


@pytest.mark.misconception("absolute-gradient-tolerance")
def test_relative_not_absolute():
    """A correct gradient of a huge function passes; a wrong gradient of a tiny function fails."""
    big = lambda w: 1e6 * np.sum(w**2)
    ok, rel = check_gradient(big, lambda w: 2e6 * w, W)
    assert ok, f"a correct gradient of 1e6·‖w‖² must pass (rel_error {rel:.1e}); compare relative, not absolute, errors"
    tiny = lambda w: 1e-9 * np.sum(w**2)
    ok, rel = check_gradient(tiny, lambda w: 1e-9 * w, W)
    assert not ok, f"the gradient of 1e-9·‖w‖² is 2e-9·w, so 1e-9·w is off by half; it must fail (rel_error {rel:.2g})"
