import numpy as np
import pytest
from hsgrade import assert_close, assert_shape, assert_vectorized

import solution
from solution import project

RNG = np.random.default_rng(21)


@pytest.mark.misconception("projection-multiplier")
def test_a_hand_worked_example():
    """b = (2, 1) onto a = (3, 4): p = (10/25)·a = (1.2, 1.6), residual (0.8, −0.6)."""
    P, R = project(np.array([2.0, 1.0]), np.array([3.0, 4.0]))
    assert_close(P, [1.2, 1.6], name="projection of (2, 1) onto (3, 4)")
    assert_close(R, [0.8, -0.6], name="residual of (2, 1) onto (3, 4)")


def test_residuals_are_perpendicular_to_a():
    """Every residual is orthogonal to a: that's what makes p the closest point."""
    a = RNG.normal(size=6)
    B = RNG.normal(size=(40, 6))
    P, R = project(B, a)
    assert_shape(P, (40, 6), "P")
    assert_shape(R, (40, 6), "R")
    assert_close(R @ a, np.zeros(40), atol=1e-10, name="R @ a (should be all zeros)")
    assert_close(P + R, B, name="P + R")


@pytest.mark.misconception("projection-multiplier")
def test_only_the_direction_of_a_matters():
    """Projecting onto 5a or −a is the same as projecting onto a: it's a line, not an arrow."""
    a = RNG.normal(size=4)
    B = RNG.normal(size=(7, 4))
    P1, _ = project(B, a)
    assert_close(project(B, 5.0 * a)[0], P1, name="projection onto 5a")
    assert_close(project(B, -a)[0], P1, name="projection onto -a")


def test_vectors_on_the_line_are_unchanged():
    """A multiple of a is its own projection, with zero residual."""
    a = np.array([1.0, -2.0, 2.0])
    P, R = project(np.array([[3.0, -6.0, 6.0], [-0.5, 1.0, -1.0]]), a)
    assert_close(P, [[3.0, -6.0, 6.0], [-0.5, 1.0, -1.0]], name="P for points on the line")
    assert_close(R, np.zeros((2, 3)), atol=1e-12, name="R for points on the line")


def test_zero_vector_raises():
    """The zero vector doesn't define a line."""
    with pytest.raises(ValueError):
        project(np.array([1.0, 2.0]), np.zeros(2))


def test_no_python_loops():
    """Vectorized: no for/while loops."""
    assert_vectorized(solution.project)
