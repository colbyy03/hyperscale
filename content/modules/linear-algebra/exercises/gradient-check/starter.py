import numpy as np


def numerical_gradient(f, w, h=1e-5):
    """Central-difference estimate of the gradient of scalar f at w (w is not modified)."""
    raise NotImplementedError("numerical_gradient is not written yet")


def check_gradient(f, grad, w, tol=1e-6):
    """Compare grad(w) with the numerical gradient: returns (ok, rel_error)."""
    raise NotImplementedError("check_gradient is not written yet")
