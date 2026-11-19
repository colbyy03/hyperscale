import numpy as np
import pytest

from solution import byte_offset, read_strided, transposed

BASE = np.arange(24, dtype=np.int64)  # each element's value is its position in the buffer
VIEWS = {
    "reshape(2, 3, 4)": BASE.reshape(2, 3, 4),
    "reshape(2, 3, 4).transpose(2, 0, 1)": BASE.reshape(2, 3, 4).transpose(2, 0, 1),
    "reshape(4, 6)[:, ::2]": BASE.reshape(4, 6)[:, ::2],
    "[::3]": BASE[::3],
    "reshape(6, 4).T": BASE.reshape(6, 4).T,
}


def test_byte_offset_small_cases():
    """Offsets for hand-checkable cases."""
    assert byte_offset((0, 0), (32, 8)) == 0, "the first element is at offset 0"
    got = byte_offset((2, 3), (32, 8))
    assert got == 88, f"byte_offset((2, 3), (32, 8)) should be 2*32 + 3*8 = 88, got {got}"
    got = byte_offset((1, 2, 3), (96, 32, 8))
    assert got == 184, f"byte_offset((1, 2, 3), (96, 32, 8)) should be 184, got {got}"


@pytest.mark.misconception("strides-are-bytes")
def test_read_strided_divides_by_itemsize():
    """Reads the right element: strides are bytes, the buffer is indexed by element."""
    v = BASE.reshape(2, 3, 4)
    got = read_strided(BASE, v.strides, (0, 0, 1))
    assert got == 1, (
        f"element (0, 0, 1) of reshape(2, 3, 4) is 1, got {got}. Strides are in bytes: "
        f"divide the byte offset by buffer.itemsize ({BASE.itemsize} for int64) to get an element index."
    )


@pytest.mark.parametrize("name", list(VIEWS))
def test_read_strided_matches_numpy(name):
    """Every element of each view matches NumPy's own indexing."""
    v = VIEWS[name]
    for idx in np.ndindex(v.shape):
        got = read_strided(BASE, v.strides, idx)
        assert got == v[idx], f"BASE.{name}: element {idx} should be {v[idx]}, got {got} (strides {v.strides})"


@pytest.mark.parametrize("name", list(VIEWS))
def test_transposed_matches_numpy(name):
    """The transpose reverses both the shape and the strides."""
    v = VIEWS[name]
    shape, strides = transposed(v.shape, v.strides)
    assert tuple(shape) == v.T.shape, f"transposed shape of BASE.{name} should be {v.T.shape}, got {tuple(shape)}"
    assert tuple(strides) == v.T.strides, f"transposed strides of BASE.{name} should be {v.T.strides}, got {tuple(strides)}. A transpose reverses the strides too."


@pytest.mark.hidden
def test_one_dimensional():
    """Works for 1-D views too."""
    v = BASE[::3]
    shape, strides = transposed(v.shape, v.strides)
    assert tuple(shape) == (8,) and tuple(strides) == (24,)
    assert read_strided(BASE, v.strides, (5,)) == 15
