import numpy as np
import pytest
from hsgrade import assert_close, assert_vectorized

import solution
from solution import heavy_ball_matrix, tuned, worst_rate


def test_the_matrix_by_hand():
    """λ = 2, η = 0.1, β = 0.5: [[1 + 0.5 − 0.2, −0.5], [1, 0]]."""
    assert_close(heavy_ball_matrix(2.0, 0.1, 0.5), [[1.3, -0.5], [1.0, 0.0]], name="heavy_ball_matrix(2, 0.1, 0.5)")


def test_no_momentum_is_gradient_descent():
    """With β = 0 the worst rate is gradient descent's, (κ − 1)/(κ + 1) at η = 2/(L + μ)."""
    assert_close(worst_rate(1.0, 100.0, 2 / 101, 0.0), 99 / 101, rtol=1e-9, name="worst_rate with β = 0 at κ = 100")


def test_tuned_momentum_reaches_sqrt_kappa():
    """Tuned heavy ball converges at (√κ − 1)/(√κ + 1): 0.818 per step at κ = 100, against 0.980 for gradient descent."""
    lr, beta = tuned(1.0, 100.0)
    assert_close([lr, beta], [4 / 121, (9 / 11) ** 2], rtol=1e-12, name="tuned(1, 100)")
    assert_close(worst_rate(1.0, 100.0, lr, beta), 9 / 11, rtol=1e-6, name="worst_rate at the tuned parameters (should be (√κ − 1)/(√κ + 1))")


@pytest.mark.misconception("spectral-radius-complex")
def test_too_much_momentum_is_slow():
    """β = 0.99 with η = 1/L rings: its rate is about √0.99 ≈ 0.995, slower than tuned momentum."""
    r = worst_rate(1.0, 100.0, 0.01, 0.99)
    assert r > 0.99, f"with β = 0.99 the slowest mode decays at about √β = 0.995 per step; got {r:.4f}"


def test_vectorized():
    """All curvatures at once."""
    assert_vectorized(solution.worst_rate)
