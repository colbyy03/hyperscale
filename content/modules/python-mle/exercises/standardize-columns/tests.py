import numpy as np
import pytest
from hsgrade import assert_close, assert_finite, assert_shape, assert_vectorized

from solution import standardize

RNG = np.random.default_rng(7)


def test_column_means_are_zero():
    """Every column ends up with mean 0."""
    X = RNG.normal(20.0, 3.0, size=(200, 4))
    Z = standardize(X)
    assert_shape(Z, X.shape, "standardize(X)")
    assert_close(Z.mean(axis=0), np.zeros(4), atol=1e-12, name="column means")


def test_column_stds_are_one():
    """Every column ends up with population standard deviation 1, whatever its scale."""
    X = RNG.normal(20.0, 3.0, size=(200, 4)) * np.array([1.0, 10.0, 100.0, 1000.0])
    Z = standardize(X)
    assert_close(Z.std(axis=0), np.ones(4), rtol=1e-12, name="column standard deviations")


def test_matches_hand_computation():
    """Matches a small example you can check by hand."""
    X = np.array([[1.0, 10.0], [3.0, 30.0]])
    assert_close(standardize(X), [[-1.0, -1.0], [1.0, 1.0]], name="standardize([[1, 10], [3, 30]])")


@pytest.mark.misconception("standardize-constant-column")
def test_constant_column_becomes_zeros():
    """A stuck sensor (constant column) becomes zeros, not NaN."""
    X = np.array([[21.5, 1.0], [21.5, 2.0], [21.5, 3.0]])
    Z = standardize(X)
    assert_finite(Z, "standardize(X) with a constant column")
    assert_close(Z[:, 0], np.zeros(3), name="the constant column")


@pytest.mark.hidden
def test_does_not_modify_input():
    X = RNG.normal(size=(5, 3))
    before = X.copy()
    standardize(X)
    assert np.array_equal(X, before), "standardize changed its input array in place. Return a new array instead (X - mu already creates one)."


@pytest.mark.hidden
def test_accepts_integer_input():
    assert_close(standardize(np.array([[1, 2], [3, 4]])), [[-1.0, -1.0], [1.0, 1.0]], name="standardize of an integer array")


def test_no_python_loops():
    """Uses whole-array operations, not Python loops."""
    assert_vectorized(standardize)
