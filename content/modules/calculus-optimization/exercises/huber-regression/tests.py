import numpy as np
import pytest
from hsgrade import assert_close, assert_vectorized

import solution
from solution import fit_huber, huber_loss_grad

RNG = np.random.default_rng(61)
N = 300
REF = RNG.uniform(15, 30, N)  # reference thermometer, °C
X = np.column_stack([np.ones(N), (REF - 22) / 4])  # standardized for gradient descent
W_TRUE = np.array([0.4, 1.02])
Y = X @ W_TRUE + RNG.normal(0, 0.05, N)  # the sensor under calibration
OUT = RNG.choice(N, 15, replace=False)
Y_BAD = Y.copy()
Y_BAD[OUT] += RNG.uniform(5, 12, 15)  # glitches: readings far too high


@pytest.mark.misconception("huber-gradient-clip")
def test_gradient_matches_central_differences():
    """At a point with residuals on both sides of δ, the gradient matches a numerical one."""
    w = np.array([0.1, 0.7])
    loss, g = huber_loss_grad(w, X, Y_BAD, 1.0)
    num = np.zeros(2)
    for j in range(2):
        e = np.zeros(2)
        e[j] = 1e-6
        num[j] = (huber_loss_grad(w + e, X, Y_BAD, 1.0)[0] - huber_loss_grad(w - e, X, Y_BAD, 1.0)[0]) / 2e-6
    assert_close(g, num, rtol=1e-5, atol=1e-8, name="Huber gradient compared with central differences")


def test_loss_values():
    """Residuals 0.5 and 3 with δ = 1: ρ = 0.125 and 2.5, mean 1.3125."""
    loss, _ = huber_loss_grad(np.zeros(1), np.ones((2, 1)), np.array([-0.5, -3.0]), 1.0)
    assert_close(loss, 1.3125, name="mean Huber loss for residuals 0.5 and 3 with δ = 1")


def test_robust_to_glitches():
    """With 15 glitched readings, Huber recovers the calibration far better than least squares."""
    w_h = fit_huber(X, Y_BAD, delta=0.2)
    w_ls = np.linalg.lstsq(X, Y_BAD, rcond=None)[0]
    err_h, err_ls = np.abs(w_h - W_TRUE).max(), np.abs(w_ls - W_TRUE).max()
    assert err_h < 0.05 and err_h < err_ls / 5, f"Huber coefficients are off by {err_h:.3f} and least squares by {err_ls:.3f}; Huber should be within 0.05 and far better"


def test_vectorized_loss():
    """One array expression for the loss and gradient."""
    assert_vectorized(solution.huber_loss_grad)
