import numpy as np
import pytest
from hsgrade import assert_close

from solution import fit_linear_gd, gradient_descent

RNG = np.random.default_rng(47)


def test_gradient_descent_on_a_quadratic():
    """On ½wᵀAw − bᵀw with lr = 1/L it converges to A⁻¹b and reports its iterations."""
    A = np.array([[3.0, 1.0], [1.0, 2.0]])
    b = np.array([1.0, -1.0])
    w, its, ok = gradient_descent(lambda w: A @ w - b, np.zeros(2), 1 / np.linalg.eigvalsh(A).max())
    assert ok, "gradient descent should converge on a well-conditioned quadratic"
    assert_close(w, np.linalg.solve(A, b), rtol=1e-7, atol=1e-9, name="the minimizer found by gradient descent")
    assert 5 < its < 500, f"expected tens of iterations at κ ≈ 2.6; got {its}"


def test_too_big_a_step_does_not_converge():
    """lr above 2/L makes the iterates grow; with max_iter=200 it must give up and say so."""
    A = np.diag([1.0, 10.0])
    w, its, ok = gradient_descent(lambda w: A @ w - 1.0, np.zeros(2), 0.25, max_iter=200)
    assert not ok and its == 200, f"lr = 0.25 > 2/L = 0.2 diverges; expected (converged=False, iterations=200), got ({ok}, {its})"


def rack(spread, n=2000):
    T = 22.0 + spread * RNG.normal(size=n)  # inlet temperature, °C
    fan_kw = 1.5 + 0.12 * T + RNG.normal(0, 0.05, n)
    return T, fan_kw


@pytest.mark.misconception("center-and-scale")
def test_a_steady_rack_fits_fast():
    """Inlet held to ±0.5 °C: κ ≈ 10⁶ raw, about 1 after standardizing, so a few iterations suffice."""
    T, y = rack(0.5)
    b0, coef, its = fit_linear_gd(T[:, None], y)
    ref = np.linalg.lstsq(np.column_stack([np.ones(len(T)), T]), y, rcond=None)[0]
    assert its <= 50, (
        f"{its} iterations: the features weren't standardized properly. Centered and scaled, ZᵀZ/n is nearly the identity "
        "and gradient descent needs only a few steps."
    )
    assert_close([b0, coef[0]], ref, rtol=1e-6, name="intercept and slope compared with lstsq")


@pytest.mark.misconception("back-transform-intercept")
def test_several_features_in_original_units():
    """Inlet °C, IT load kW and fan speed %: coefficients come back in the original units."""
    n = 3000
    X = np.column_stack([22 + 0.8 * RNG.normal(size=n), 30 + 6 * RNG.normal(size=n), 60 + 10 * RNG.normal(size=n)])
    y = 2.0 + X @ np.array([0.1, 0.05, 0.02]) + RNG.normal(0, 0.05, n)
    b0, coef, its = fit_linear_gd(X, y)
    ref = np.linalg.lstsq(np.column_stack([np.ones(n), X]), y, rcond=None)[0]
    assert_close(coef, ref[1:], rtol=1e-6, name="coefficients in original units")
    assert_close(b0, ref[0], rtol=1e-6, name="intercept in original units")
    assert its <= 300, f"{its} iterations for three standardized features; expected far fewer"
