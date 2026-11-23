import numpy as np
import pytest
from hsgrade import assert_close, assert_vectorized

import solution
from solution import mixing_fractions, project_simplex

RNG = np.random.default_rng(59)


@pytest.mark.misconception("clip-and-renormalize")
def test_projection_by_hand():
    """(1.0, 0.4, 0.0) projects to (0.8, 0.2, 0): θ = 0.2. Clip-and-rescale would give (0.714, 0.286, 0)."""
    assert_close(project_simplex(np.array([1.0, 0.4, 0.0])), [0.8, 0.2, 0.0], name="projection of (1.0, 0.4, 0.0) onto the simplex")


def test_projection_properties():
    """Feasible, unchanged for points already on the simplex, and closer than any other feasible point tried."""
    v = RNG.normal(size=6)
    w = project_simplex(v)
    assert w.min() >= 0 and abs(w.sum() - 1) < 1e-12, f"the projection must be non-negative and sum to 1; got {np.round(w, 4)}"
    assert_close(project_simplex(w), w, atol=1e-12, name="projecting a point that's already on the simplex")
    others = RNG.dirichlet(np.ones(6), size=2000)
    assert np.linalg.norm(v - w) <= np.linalg.norm(v - others, axis=1).min() + 1e-12, "a random point on the simplex is closer to v than your projection"
    assert_vectorized(solution.project_simplex)


def blend(f_true, n=600, noise=0.02):
    S = np.column_stack([18 + 1.5 * np.sin(np.arange(n) / 17 + p) + RNG.normal(0, 0.3, n) for p in (0.0, 2.0, 4.0)])
    return S, S @ f_true + RNG.normal(0, noise, n)


@pytest.mark.misconception("projection-needed")
def test_recovers_a_blend():
    """Rack air that is 60/30/10% from three CRAHs: the fractions come back."""
    S, t = blend(np.array([0.6, 0.3, 0.1]))
    f = mixing_fractions(S, t)
    assert f.min() >= 0 and abs(f.sum() - 1) < 1e-9, f"fractions must be non-negative and sum to 1; got {np.round(f, 4)}"
    assert_close(f, [0.6, 0.3, 0.1], atol=0.03, name="estimated mixing fractions for a 60/30/10 blend")


def test_kkt_with_an_active_constraint():
    """With one CRAH contributing nothing, its fraction sits at 0 and its gradient component is no smaller than the others'."""
    S, t = blend(np.array([0.7, 0.3, 0.0]), noise=0.05)
    f = mixing_fractions(S, t, iters=5000)
    g = S.T @ (S @ f - t) / len(t)
    pos = f > 1e-8
    # The supply temperatures are nearly collinear, so projected gradient converges slowly: check KKT to 2e-4.
    assert_close(g[pos], np.full(pos.sum(), g[pos].mean()), atol=2e-4, name="gradient components of the positive fractions (KKT: all equal)")
    assert (g[~pos] >= g[pos].mean() - 2e-4).all(), "a fraction at zero must have a gradient component at least as large as the positive ones (KKT)"
