def byte_offset(index, strides):
    """Bytes from the start of the view to the element at `index`."""
    raise NotImplementedError("byte_offset is not written yet")


def read_strided(buffer, strides, index):
    """Read the element at `index` of a view over the flat array `buffer`."""
    raise NotImplementedError("read_strided is not written yet")


def transposed(shape, strides):
    """Shape and strides of the transpose (all axes reversed), as two tuples."""
    raise NotImplementedError("transposed is not written yet")
