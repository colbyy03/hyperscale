import math

import numpy as np
import pytest
from hsgrade import assert_close, assert_finite, assert_shape, assert_vectorized

import solution
from solution import logsumexp, softmax

RNG = np.random.default_rng(11)


def test_matches_the_formula_for_ordinary_values():
    """For ordinary logits the results equal the textbook formulas."""
    x = RNG.normal(0.0, 2.0, 6)
    assert_close(logsumexp(x), math.log(np.exp(x).sum()), rtol=1e-12, name="logsumexp(x)")
    assert_close(softmax(x), np.exp(x) / np.exp(x).sum(), rtol=1e-12, name="softmax(x)")


@pytest.mark.misconception("softmax-shift")
def test_large_logits_do_not_overflow():
    """Logits of 1000 and 1001 give finite, correct answers."""
    z = np.array([1000.0, 1001.0])
    s = softmax(z)
    assert_finite(s, "softmax([1000, 1001])")
    assert_close(s, [0.2689414213699951, 0.7310585786300049], rtol=1e-12, name="softmax([1000, 1001])")
    out = logsumexp(z)
    assert_finite(out, "logsumexp([1000, 1001])")
    assert_close(out, 1001.0 + math.log1p(math.exp(-1.0)), rtol=1e-12, name="logsumexp([1000, 1001])")


def test_very_negative_logits_do_not_underflow():
    """Logits of −1000 don't collapse to log(0) = −inf."""
    out = logsumexp(np.array([-1000.0, -1000.0]))
    assert_finite(out, "logsumexp([-1000, -1000])")
    assert_close(out, -1000.0 + math.log(2.0), rtol=1e-12, name="logsumexp([-1000, -1000])")


@pytest.mark.misconception("keepdims-row-mean")
def test_rows_of_a_matrix():
    """A (5, 3) batch: one logsumexp per row, softmax rows that each sum to 1."""
    X = RNG.normal(0.0, 3.0, (5, 3)) + 500.0
    try:
        s = softmax(X)
        out = logsumexp(X)
    except ValueError as e:
        raise AssertionError(f"a (5, 3) input raised: {e}. The row maximum has shape (5,); use keepdims=True so it stays (5, 1) and broadcasts across each row.") from None
    assert_shape(s, (5, 3), "softmax(X)")
    assert_shape(out, (5,), "logsumexp(X)")
    assert_close(s.sum(axis=1), np.ones(5), rtol=1e-12, name="row sums of softmax(X)")
    assert_close(out, [logsumexp(row) for row in X], rtol=1e-12, name="logsumexp(X)")


def test_shift_invariance():
    """Adding a constant shifts logsumexp by that constant and leaves softmax unchanged."""
    x = RNG.normal(0.0, 1.0, 8)
    assert_close(softmax(x + 300.0), softmax(x), rtol=1e-12, name="softmax(x + 300)")
    assert_close(logsumexp(x + 300.0), logsumexp(x) + 300.0, rtol=1e-12, name="logsumexp(x + 300)")


def test_no_python_loops():
    """Vectorized: no for/while loops."""
    assert_vectorized(solution.softmax)
    assert_vectorized(solution.logsumexp)


@pytest.mark.hidden
@pytest.mark.misconception("softmax-shift")
def test_wide_range_of_logits():
    """A spread of 2000 between logits: subtracting the mean isn't enough, the maximum is."""
    s = softmax(np.array([0.0, 2000.0]))
    assert_finite(s, "softmax([0, 2000])")
    assert_close(s, [0.0, 1.0], atol=1e-300, name="softmax([0, 2000])")
