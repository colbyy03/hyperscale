import numpy as np
import pytest

from solution import backtracking, damped_newton


def rosen(p):
    return 100 * (p[1] - p[0] ** 2) ** 2 + (1 - p[0]) ** 2


def rosen_grad(p):
    return np.array([-400 * p[0] * (p[1] - p[0] ** 2) - 2 * (1 - p[0]), 200 * (p[1] - p[0] ** 2)])


def rosen_hess(p):
    return np.array([[1200 * p[0] ** 2 - 400 * p[1] + 2, -400 * p[0]], [-400 * p[0], 200.0]])


def saddle(p):
    return p[0] ** 2 - p[1] ** 2 + p[1] ** 4  # saddle at the origin, minima at (0, ±1/√2)


def saddle_grad(p):
    return np.array([2 * p[0], -2 * p[1] + 4 * p[1] ** 3])


def saddle_hess(p):
    return np.array([[2.0, 0.0], [0.0, -2 + 12 * p[1] ** 2]])


def test_armijo_backtracking():
    """f(x) = x²: a step of 10× the negative gradient overshoots, so α halves until the Armijo test passes."""
    f = lambda x: float(x @ x)
    x = np.array([1.0])
    g = 2 * x
    d = -10 * g
    a = backtracking(f, x, d, g)
    assert a < 1.0, "the full step overshoots badly; α must shrink"
    assert f(x + a * d) <= f(x) + 1e-4 * a * (g @ d), f"α = {a} doesn't satisfy the Armijo condition"
    assert f(x + 2 * a * d) > f(x) + 1e-4 * 2 * a * (g @ d), f"α = {a} isn't the first acceptable halving: 2α already passes"


@pytest.mark.misconception("newton-not-monotone")
def test_rosenbrock_converges_without_ever_going_uphill():
    """From (−1.2, 1): at most 40 iterations, and the loss falls at every step (pure Newton jumps uphill on the way)."""
    x, hist = damped_newton(rosen, rosen_grad, rosen_hess, [-1.2, 1.0])
    rises = [i for i in range(1, len(hist)) if hist[i] > hist[i - 1] + 1e-12]
    assert not rises, f"the loss rose at step(s) {rises[:5]}: f went from {hist[rises[0] - 1]:.3g} to {hist[rises[0]]:.3g}. Backtrack until the Armijo condition holds."
    assert np.allclose(x, [1.0, 1.0], atol=1e-6) and len(hist) - 1 <= 40, f"expected convergence to (1, 1) within 40 iterations; got {np.round(x, 6)} after {len(hist) - 1}"


@pytest.mark.misconception("newton-uphill-at-saddle")
def test_escapes_toward_a_minimum_near_a_saddle():
    """From (0.1, 0.3) the Hessian is indefinite and the Newton direction points uphill toward the saddle; fall back to −g."""
    x, hist = damped_newton(saddle, saddle_grad, saddle_hess, [0.1, 0.3])
    assert abs(saddle(x) + 0.25) < 1e-8 and abs(abs(x[1]) - 2**-0.5) < 1e-5, (
        f"ended at {np.round(x, 5)} with f = {saddle(x):.4f}; it should reach a minimum (0, ±0.7071), f = −0.25. "
        "When gᵀd ≥ 0 the Newton direction is uphill: use −g instead."
    )
    assert all(hist[i] <= hist[i - 1] + 1e-12 for i in range(1, len(hist))), "the loss must never increase"
