import math


class Dual:
    """A value and its tangent (derivative with respect to the input)."""

    def __init__(self, val, dot=0.0):
        self.val = float(val)
        self.dot = float(dot)

    def __add__(self, o):
        o = _lift(o)
        return Dual(self.val + o.val, self.dot + o.dot)

    __radd__ = __add__

    def __neg__(self):
        return Dual(-self.val, -self.dot)

    def __sub__(self, o):
        return self + (-_lift(o))

    def __rsub__(self, o):
        return _lift(o) - self

    def __mul__(self, o):
        o = _lift(o)
        return Dual(self.val * o.val, self.dot * o.val + self.val * o.dot)

    __rmul__ = __mul__

    def __truediv__(self, o):
        o = _lift(o)
        return Dual(self.val / o.val, (self.dot * o.val - self.val * o.dot) / o.val**2)

    def __rtruediv__(self, o):
        return _lift(o) / self

    def __pow__(self, n):
        return Dual(self.val**n, n * self.val ** (n - 1) * self.dot)


def _lift(o):
    return o if isinstance(o, Dual) else Dual(o, 0.0)


def exp(x):
    if isinstance(x, Dual):
        e = math.exp(x.val)
        return Dual(e, e * x.dot)
    return math.exp(x)


def sin(x):
    if isinstance(x, Dual):
        return Dual(math.sin(x.val), math.cos(x.val) * x.dot)
    return math.sin(x)


def log(x):
    if isinstance(x, Dual):
        return Dual(math.log(x.val), x.dot / x.val)
    return math.log(x)


def derivative(f, x):
    """f'(x) from one forward pass with dual numbers."""
    return f(Dual(x, 1.0)).dot
