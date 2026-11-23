import numpy as np


def gradient_descent(grad, w0, lr, tol=1e-9, max_iter=100_000):
    """Fixed-step gradient descent until ||grad(w)|| < tol. Returns (w, iterations, converged)."""
    raise NotImplementedError("gradient_descent is not written yet")


def fit_linear_gd(X, y):
    """Least squares with an intercept, by gradient descent on standardized features. Returns (intercept, coef, iterations)."""
    raise NotImplementedError("fit_linear_gd is not written yet")
