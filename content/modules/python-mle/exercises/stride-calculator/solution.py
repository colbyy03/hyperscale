def byte_offset(index, strides):
    """Bytes from the start of the view to the element at `index`."""
    return sum(i * s for i, s in zip(index, strides))


def read_strided(buffer, strides, index):
    """Read the element at `index` of a view over the flat array `buffer`."""
    return buffer[byte_offset(index, strides) // buffer.itemsize]


def transposed(shape, strides):
    """Shape and strides of the transpose (all axes reversed), as two tuples."""
    return tuple(reversed(shape)), tuple(reversed(strides))
