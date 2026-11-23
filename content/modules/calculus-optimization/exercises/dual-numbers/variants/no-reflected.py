# expect: define __rsub__
import math


class Dual:
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

    def __mul__(self, o):
        o = _lift(o)
        return Dual(self.val * o.val, self.dot * o.val + self.val * o.dot)

    __rmul__ = __mul__

    def __truediv__(self, o):
        o = _lift(o)
        return Dual(self.val / o.val, (self.dot * o.val - self.val * o.dot) / o.val**2)

    def __pow__(self, n):
        return Dual(self.val**n, n * self.val ** (n - 1) * self.dot)


def _lift(o):
    return o if isinstance(o, Dual) else Dual(o, 0.0)


def exp(x):
    return Dual(math.exp(x.val), math.exp(x.val) * x.dot) if isinstance(x, Dual) else math.exp(x)


def sin(x):
    return Dual(math.sin(x.val), math.cos(x.val) * x.dot) if isinstance(x, Dual) else math.sin(x)


def log(x):
    return Dual(math.log(x.val), x.dot / x.val) if isinstance(x, Dual) else math.log(x)


def derivative(f, x):
    return f(Dual(x, 1.0)).dot
