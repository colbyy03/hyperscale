import numpy as np
import pytest

from hsgrade import (
    assert_close,
    assert_dtype_kind,
    assert_finite,
    assert_not_imported,
    assert_returns,
    assert_runtime_under,
    assert_shape,
    assert_vectorized,
)


def message(fn, *args, **kwargs) -> str:
    with pytest.raises(AssertionError) as info:
        fn(*args, **kwargs)
    return str(info.value)


def test_returns_none_is_diagnosed():
    assert "forget a `return`" in message(assert_returns, None)


def test_shape_hints():
    assert ".ravel()" in message(assert_shape, np.zeros((5, 1)), (5,))
    assert "reshape(-1, 1)" in message(assert_shape, np.zeros(5), (5, 1))
    assert "swapped" in message(assert_shape, np.zeros((3, 2)), (2, 3))
    assert "keepdims" in message(assert_shape, np.zeros(3), (3, 4))
    assert_shape(np.zeros((2, 3)), (2, 3))


def test_close_passes_and_reports_worst_error():
    assert_close([1.0, 2.0], np.array([1.0, 2.0 + 1e-12]))
    msg = message(assert_close, [1.0, 2.5, 3.0], [1.0, 2.0, 3.0])
    assert "1 of 3" in msg and "index 1" in msg and "got 2.5" in msg


def test_close_detects_sign_order_and_scale_mistakes():
    assert "wrong sign" in message(assert_close, [-1.0, -2.0], [1.0, 2.0])
    assert "wrong order" in message(assert_close, [3.0, 1.0, 2.0], [1.0, 2.0, 3.0])
    assert "constant multiple" in message(assert_close, [2.0, 4.0, 7.0], [1.0, 2.0, 3.5])


def test_close_flags_nan_where_values_expected():
    assert "NaN" in message(assert_close, [np.nan, 1.0], [0.0, 1.0])


def test_dtype_and_finite():
    assert "dtype object" in message(assert_dtype_kind, np.array([1, "a"], dtype=object))
    assert "float" in message(assert_dtype_kind, np.array([1, 2]), "f")
    assert "inf" in message(assert_finite, np.array([1.0, np.inf]))


def test_vectorized_detects_loops_and_comprehensions():
    def looped(x):
        total = 0
        for v in x:
            total += v
        return total

    def comp(x):
        return sum([v for v in x])

    def vectorized(x):
        return np.sum(x)

    assert "for loop" in message(assert_vectorized, looped)
    assert "comprehension" in message(assert_vectorized, comp)
    assert_vectorized(vectorized)
    assert_vectorized(comp, allow_comprehensions=True)


def test_not_imported():
    src = "import numpy as np\nfrom sklearn.linear_model import Ridge\n"
    assert "sklearn" in message(assert_not_imported, src, ["sklearn"])
    assert_not_imported("import numpy as np\n", ["sklearn"])


def test_runtime_under():
    assert assert_runtime_under(lambda: sum(range(10)), 1.0) < 1.0
    assert "took" in message(assert_runtime_under, lambda: sum(range(200_000)), 1e-9)
