import numpy as np


def numerical_jacobian(f, x, h=1e-6):
    """Central-difference Jacobian of f at x, shape (m, n). x is not modified."""
    raise NotImplementedError("numerical_jacobian is not written yet")


def check_jacobian(f, jac, x, tol=1e-6):
    """Compare jac(x) with the numerical Jacobian: (ok, rel_error); (False, inf) if the shapes differ."""
    raise NotImplementedError("check_jacobian is not written yet")
