import numpy as np


def backtracking(f, x, d, g, alpha=1.0, c=1e-4, rho=0.5):
    """Armijo backtracking along d: shrink alpha until f(x + alpha d) <= f(x) + c alpha g.d."""
    raise NotImplementedError("backtracking is not written yet")


def damped_newton(f, grad, hess, x0, tol=1e-8, max_iter=200):
    """Newton's method with a descent check and Armijo backtracking. Returns (x, history)."""
    raise NotImplementedError("damped_newton is not written yet")
