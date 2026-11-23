import numpy as np
import pytest
from hsgrade import assert_close, assert_vectorized

import solution
from solution import AdamW, Momentum


def test_momentum_by_hand():
    """Two steps: v₁ = −lr·g₁, w₁ = w₀ + v₁; v₂ = βv₁ − lr·g₂, w₂ = w₁ + v₂."""
    opt = Momentum(lr=0.1, beta=0.9)
    w0 = np.array([1.0, -2.0])
    g1, g2 = np.array([0.5, 1.0]), np.array([-1.0, 0.2])
    w1 = opt.step(w0, g1)
    w2 = opt.step(w1, g2)
    v1 = -0.1 * g1
    v2 = 0.9 * v1 - 0.1 * g2
    assert_close(w1, w0 + v1, name="parameters after the first momentum step")
    assert_close(w2, w0 + v1 + v2, name="parameters after the second momentum step")


@pytest.mark.misconception("adam-bias-correction")
def test_adam_first_step_moves_each_coordinate_by_lr():
    """With bias correction, step 1 is −lr·sign(g) in every coordinate, whatever the gradient's size."""
    opt = AdamW(lr=0.01)
    w0 = np.zeros(3)
    w1 = opt.step(w0, np.array([1e-3, -50.0, 2.0]))
    assert_close(w1, [-0.01, 0.01, -0.01], rtol=1e-5, name="AdamW's first step (should be −lr·sign(g))")


def test_adam_matches_the_formulas_for_three_steps():
    """Three steps checked against the update equations written out."""
    lr, b1, b2, eps = 0.05, 0.9, 0.999, 1e-8
    opt = AdamW(lr)
    w = np.array([0.5, -1.5])
    ref, m, s = w.copy(), np.zeros(2), np.zeros(2)
    for t, g in enumerate([np.array([0.3, -0.2]), np.array([0.1, 0.4]), np.array([-0.5, 0.05])], start=1):
        w = opt.step(w, g)
        m, s = b1 * m + (1 - b1) * g, b2 * s + (1 - b2) * g**2
        ref = ref - lr * (m / (1 - b1**t)) / (np.sqrt(s / (1 - b2**t)) + eps)
    assert_close(w, ref, rtol=1e-10, name="AdamW after three steps")


@pytest.mark.misconception("decoupled-weight-decay")
def test_weight_decay_is_decoupled():
    """With zero gradient, AdamW shrinks every weight by the same factor, (1 − lr·wd) per step."""
    opt = AdamW(lr=0.1, weight_decay=0.5)
    w = np.array([2.0, -0.01, 300.0])
    for _ in range(3):
        w = opt.step(w, np.zeros(3))
    assert_close(w, np.array([2.0, -0.01, 300.0]) * (1 - 0.05) ** 3, rtol=1e-9, name="weights after three decay-only steps (each shrinks by 1 − lr·wd)")


def test_tuned_momentum_beats_gradient_descent():
    """On a bowl with κ = 100, tuned momentum reaches 1e-6 in a fraction of gradient descent's iterations."""
    A = np.diag([1.0, 100.0])
    b = np.array([1.0, 1.0])
    target = np.linalg.solve(A, b)

    def iterations(opt):
        w = np.zeros(2)
        for k in range(1, 5000):
            w = opt.step(w, A @ w - b)
            if np.linalg.norm(w - target) < 1e-6 * np.linalg.norm(target):
                return k
        return 5000

    gd = iterations(Momentum(lr=2 / 101, beta=0.0))
    hb = iterations(Momentum(lr=4 / 121, beta=(9 / 11) ** 2))
    assert hb * 4 < gd, f"tuned momentum took {hb} iterations against gradient descent's {gd}; expected several times fewer (about √κ = 10×)"


def test_state_is_per_optimizer_and_vectorized():
    """Two optimizers don't share state, and nothing loops over coordinates."""
    a, b = Momentum(0.1), Momentum(0.1)
    a.step(np.zeros(2), np.ones(2))
    assert_close(b.step(np.zeros(2), np.ones(2)), [-0.1, -0.1], name="a fresh Momentum's first step (state must not be shared)")
    assert_vectorized(solution.Momentum.step)
    assert_vectorized(solution.AdamW.step)
