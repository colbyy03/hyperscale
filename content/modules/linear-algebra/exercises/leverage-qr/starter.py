import numpy as np


def leverages(X):
    """Diagonal of the hat matrix X (X^T X)^-1 X^T, computed through a thin QR."""
    raise NotImplementedError("leverages is not written yet")


def high_leverage(X, factor=2.0):
    """Indices of readings with leverage above factor * p / n, highest first."""
    raise NotImplementedError("high_leverage is not written yet")
