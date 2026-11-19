# expect: should be 2*32 + 3*8 = 88
def byte_offset(index, strides):
    return sum(i * s for i, s in zip(index, reversed(strides)))


def read_strided(buffer, strides, index):
    return buffer[byte_offset(index, strides) // buffer.itemsize]


def transposed(shape, strides):
    return tuple(reversed(shape)), tuple(reversed(strides))
