import numpy as np


def time_constants(C, K):
    """Time constants (s) of C dT/dt = -K T, slowest first, as a real array."""
    raise NotImplementedError("time_constants is not written yet")


def max_euler_step(C, K):
    """Largest stable forward-Euler time step (s): 2 / lambda_max."""
    raise NotImplementedError("max_euler_step is not written yet")
