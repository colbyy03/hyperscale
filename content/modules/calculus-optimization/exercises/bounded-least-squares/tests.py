import numpy as np
import pytest
from hsgrade import assert_close

from solution import bounded_lsq, kkt_residual

RNG = np.random.default_rng(67)
N = 400
A = RNG.uniform(0.5, 2.0, (N, 4))  # flow per unit of opening, for each valve
W_TRUE = np.array([0.3, 1.0, 0.0, 0.65])  # one valve wide open, one shut
B = A @ W_TRUE + RNG.normal(0, 0.05, N)


def test_kkt_residual_by_hand():
    """A 1-D problem min ½(w − 2)² on [0, 1]: w = 1 is optimal (g = −1 at the upper bound); w = 0.5 isn't."""
    A1, b1 = np.ones((1, 1)), np.array([2.0])
    assert_close(kkt_residual(A1, b1, np.array([1.0]), 0.0, 1.0), 0.0, name="KKT residual at the optimum w = 1")
    assert_close(kkt_residual(A1, b1, np.array([0.5]), 0.0, 1.0), 1.5, name="KKT residual at w = 0.5 (gradient −1.5, inside the box)")


@pytest.mark.misconception("box-kkt-signs")
def test_a_wrong_sign_at_a_bound_is_a_violation():
    """At the lower bound with a negative gradient, the objective would improve by moving up: a violation."""
    A1, b1 = np.ones((1, 1)), np.array([0.5])
    assert_close(kkt_residual(A1, b1, np.array([0.0]), 0.0, 1.0), 0.5, name="KKT residual at w = 0 when the optimum is 0.5")


@pytest.mark.misconception("clip-after-fit")
def test_solves_the_valve_problem():
    """Projected gradient lands on a point satisfying KKT, inside the bounds, close to the true openings."""
    w = bounded_lsq(A, B, 0.0, 1.0)
    assert w.min() >= 0 and w.max() <= 1, f"openings must stay within [0, 1]; got {np.round(w, 3)}"
    assert kkt_residual(A, B, w, 0.0, 1.0) < 1e-6, f"KKT residual {kkt_residual(A, B, w, 0.0, 1.0):.1e} at your solution; projected gradient should drive it to zero"
    assert_close(w, W_TRUE, atol=0.03, name="estimated valve openings")
    w_clip = np.clip(np.linalg.lstsq(A, B, rcond=None)[0], 0, 1)
    assert kkt_residual(A, B, w_clip, 0.0, 1.0) > kkt_residual(A, B, w, 0.0, 1.0), "your answer should satisfy KKT better than clipping the unconstrained fit"
