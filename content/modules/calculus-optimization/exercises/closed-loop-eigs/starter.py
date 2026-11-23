import numpy as np


def closed_loop_matrix(a, b, kp, ki, ts, delay):
    """Closed-loop state matrix for x' = a x + b u(k - delay) under PI control."""
    raise NotImplementedError("closed_loop_matrix is not written yet")


def spectral_radius(M):
    raise NotImplementedError("spectral_radius is not written yet")


def period(M, ts):
    """Oscillation period (s) of the dominant eigenvalue; inf if it's real."""
    raise NotImplementedError("period is not written yet")


def max_stable_ki(a, b, kp, ts, delay, hi=1.0):
    """Largest ki in (0, hi] with spectral radius < 1, by bisection."""
    raise NotImplementedError("max_stable_ki is not written yet")
