import inspect

import numpy as np
import pytest
from hsgrade import assert_close

import solution
from solution import fit_logistic_newton

RNG = np.random.default_rng(53)
N = 3000
VIB = RNG.normal(4, 1.5, N)  # mm/s
KURT = RNG.normal(3.5, 0.8, N)
TEMP = RNG.normal(45, 5, N)  # °C
HOURS = RNG.normal(2000, 800, N)  # since service
X_RAW = np.column_stack([np.ones(N), VIB, KURT, TEMP, HOURS])
Z_TRUE = -9 + 0.8 * VIB + 0.6 * KURT + 0.06 * TEMP + 0.0006 * HOURS
Y = (RNG.uniform(size=N) < 1 / (1 + np.exp(-Z_TRUE))).astype(float)


def mean_grad(X, y, w, ridge=0.0):
    p = 0.5 * (1 + np.tanh(X @ w / 2))
    return X.T @ (p - y) / len(y) + ridge * w


def test_raw_features_converge_in_a_few_steps():
    """Hessian condition number ~10⁹, yet Newton reaches ‖g‖ < 1e-10 in under 10 iterations."""
    w, norms = fit_logistic_newton(X_RAW, Y)
    its = len(norms) - 1
    assert norms[-1] < 1e-10 and its <= 10, (
        f"after {its} iterations the gradient norm is {norms[-1]:.1e}; Newton with the exact Hessian reaches 1e-10 in about 5 here. "
        "Check the step d = −H⁻¹g and the p(1 − p) weights in H."
    )
    assert_close(mean_grad(X_RAW, Y, w), np.zeros(5), atol=1e-9, name="gradient at the returned coefficients")


def test_digits_double_at_the_end():
    """Quadratic convergence: each late gradient norm is far below the previous one squared-ish."""
    _, norms = fit_logistic_newton(X_RAW, Y)
    tail = [v for v in norms if v < 1e-2]
    assert len(tail) >= 2 and tail[-1] < tail[-2] ** 1.5, f"late gradient norms {['%.1e' % v for v in tail]} should shrink quadratically (each roughly the square of the last)"


@pytest.mark.misconception("newton-affine-invariant")
def test_rescaling_a_feature_changes_nothing_but_its_coefficient():
    """Measure hours in thousands instead: the hours coefficient scales by 1000, and the iteration count is the same."""
    X2 = X_RAW.copy()
    X2[:, 4] /= 1000.0
    w1, n1 = fit_logistic_newton(X_RAW, Y)
    w2, n2 = fit_logistic_newton(X2, Y)
    assert_close(w2[4], w1[4] * 1000.0, rtol=1e-6, name="hours coefficient after measuring hours in thousands")
    assert_close(w2[:4], w1[:4], rtol=1e-6, name="the other coefficients")
    assert abs(len(n1) - len(n2)) <= 1, f"iterations changed from {len(n1) - 1} to {len(n2) - 1}; Newton's steps don't depend on units"


@pytest.mark.misconception("separable-needs-ridge")
def test_separable_data_with_a_ridge():
    """Perfectly separable labels: with ridge = 1e-3 there's a finite minimizer and Newton finds it."""
    X = np.column_stack([np.ones(200), RNG.normal(size=200)])
    y = (X[:, 1] > 0).astype(float)
    w, norms = fit_logistic_newton(X, y, ridge=1e-3)
    assert norms[-1] < 1e-10, f"with ridge = 1e-3 Newton should converge; final gradient norm {norms[-1]:.1e}"
    assert_close(mean_grad(X, y, w, ridge=1e-3), np.zeros(2), atol=1e-9, name="regularized gradient at the solution")


def test_uses_solve_not_inverse():
    """Solve H d = −g; don't invert H."""
    assert "inv(" not in inspect.getsource(solution), "use np.linalg.solve(H, g), not an explicit inverse"
