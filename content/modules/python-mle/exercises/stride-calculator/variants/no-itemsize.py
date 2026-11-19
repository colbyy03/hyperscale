# expect: divide the byte offset by buffer.itemsize
def byte_offset(index, strides):
    return sum(i * s for i, s in zip(index, strides))


def read_strided(buffer, strides, index):
    return buffer[byte_offset(index, strides)]


def transposed(shape, strides):
    return tuple(reversed(shape)), tuple(reversed(strides))
