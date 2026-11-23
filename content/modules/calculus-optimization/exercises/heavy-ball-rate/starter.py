import numpy as np


def heavy_ball_matrix(lam, lr, beta):
    """2x2 matrix mapping (e_k, e_{k-1}) to (e_{k+1}, e_k) for curvature lam."""
    raise NotImplementedError("heavy_ball_matrix is not written yet")


def worst_rate(mu, L, lr, beta, n=401):
    """Largest spectral radius over n curvatures from mu to L."""
    raise NotImplementedError("worst_rate is not written yet")


def tuned(mu, L):
    """The classic optimal (lr, beta) for curvatures in [mu, L]."""
    raise NotImplementedError("tuned is not written yet")
