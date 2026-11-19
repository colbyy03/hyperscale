import numpy as np
import pytest
from hsgrade import assert_close, assert_dtype_kind, assert_shape, assert_vectorized

import solution
from solution import one_hot


def test_small_example():
    """Labels [2, 0, 1] with k = 3."""
    out = one_hot(np.array([2, 0, 1]), 3)
    assert_shape(out, (3, 3), "one_hot([2, 0, 1], 3)")
    assert_close(out, [[0, 0, 1], [1, 0, 0], [0, 1, 0]], name="one_hot([2, 0, 1], 3)")


def test_float_output_and_unused_classes():
    """Floats, and columns for classes that never appear."""
    out = one_hot(np.array([0, 0, 1]), 5)
    assert_dtype_kind(out, "f", "one_hot(...)")
    assert_shape(out, (3, 5), "one_hot([0, 0, 1], 5)")
    assert_close(out.sum(axis=1), np.ones(3), name="row sums")
    assert_close(out[:, 2:].sum(), 0.0, name="unused class columns")


def test_out_of_range_labels():
    """Labels outside [0, k) raise ValueError."""
    with pytest.raises(ValueError):
        one_hot(np.array([0, 3]), 3)
    with pytest.raises(ValueError):
        one_hot(np.array([-1, 0]), 3)


def test_no_python_loops():
    """Vectorized: no for/while loops."""
    assert_vectorized(solution.one_hot)
