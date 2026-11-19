import numpy as np
import pytest

from solution import mask_hot


def test_masks_values_above_the_limit():
    """Values above the limit become NaN; the rest are unchanged."""
    out = mask_hot(np.array([20.0, 45.0, 39.9, 41.0]), 40.0)
    assert np.isnan(out[1]) and np.isnan(out[3]), f"45 and 41 should be NaN, got {out}"
    assert out[0] == 20.0 and out[2] == 39.9, f"20 and 39.9 should be unchanged, got {out}"


def test_keeps_values_equal_to_the_limit():
    """'Above' means strictly greater: a reading of exactly 40.0 stays."""
    out = mask_hot(np.array([40.0, 40.5]), 40.0)
    assert out[0] == 40.0, f"a reading equal to the limit is kept (values *above* it are masked), got {out[0]}"


@pytest.mark.misconception("slice-is-copy")
def test_does_not_change_its_input():
    """The caller's array is left exactly as it was."""
    raw = np.array([20.0, 45.0, 39.9])
    before = raw.copy()
    mask_hot(raw, 40.0)
    assert np.array_equal(raw, before, equal_nan=True), (
        f"your function changed its input: {before} became {raw}. `readings[:]` is a view of the same memory, "
        "not a copy, so writing into it writes into the caller's array."
    )


def test_returns_a_new_array():
    """The result doesn't share memory with the input."""
    raw = np.array([20.0, 45.0])
    out = mask_hot(raw, 40.0)
    assert not np.shares_memory(out, raw), "the result shares memory with the input; return a new array"


def test_integer_readings():
    """Integer readings work too, and come back as floats with NaN."""
    try:
        out = mask_hot(np.array([20, 45, 30]), 40)
    except ValueError as e:
        raise AssertionError(f"integer input raised ValueError ({e}). Integer arrays can't hold NaN: build a float result (np.where does this, or .astype(float)).") from None
    assert out.dtype.kind == "f", f"the result should be a float array (to hold NaN), got dtype {out.dtype}"
    assert np.isnan(out[1]) and out[0] == 20 and out[2] == 30, f"expected [20, nan, 30], got {out}"


@pytest.mark.hidden
def test_two_dimensional():
    """Works on a (time, sensor) matrix."""
    raw = np.array([[20.0, 50.0], [41.0, 30.0]])
    out = mask_hot(raw, 40.0)
    assert out.shape == (2, 2) and np.isnan(out[0, 1]) and np.isnan(out[1, 0]) and out[1, 1] == 30.0
