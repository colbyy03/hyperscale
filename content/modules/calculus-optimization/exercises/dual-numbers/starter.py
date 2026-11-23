import math


class Dual:
    """A value and its tangent (derivative with respect to the input)."""

    def __init__(self, val, dot=0.0):
        self.val = float(val)
        self.dot = float(dot)

    # Add the arithmetic operators here.


def exp(x):
    raise NotImplementedError("exp is not written yet")


def sin(x):
    raise NotImplementedError("sin is not written yet")


def log(x):
    raise NotImplementedError("log is not written yet")


def derivative(f, x):
    """f'(x) from one forward pass with dual numbers."""
    raise NotImplementedError("derivative is not written yet")
