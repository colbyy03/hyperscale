import numpy as np


def bounded_lsq(A, b, lo, hi, iters=5000):
    """Projected gradient for min 0.5 * ||A w - b||^2 / n subject to lo <= w <= hi."""
    raise NotImplementedError("bounded_lsq is not written yet")


def kkt_residual(A, b, w, lo, hi):
    """Largest violation of the box KKT conditions at w (0 means optimal)."""
    raise NotImplementedError("kkt_residual is not written yet")
