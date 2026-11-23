import numpy as np


def backtracking(f, x, d, g, alpha=1.0, c=1e-4, rho=0.5):
    """Armijo backtracking along d: shrink alpha until f(x + alpha d) <= f(x) + c alpha g.d."""
    fx = f(x)
    slope = float(g @ d)
    for _ in range(60):
        if f(x + alpha * d) <= fx + c * alpha * slope:
            return alpha
        alpha *= rho
    return alpha


def damped_newton(f, grad, hess, x0, tol=1e-8, max_iter=200):
    """Newton's method with a descent check and Armijo backtracking. Returns (x, history)."""
    x = np.asarray(x0, dtype=float).copy()
    history = [float(f(x))]
    for _ in range(max_iter):
        g = grad(x)
        if np.linalg.norm(g) < tol:
            break
        try:
            d = np.linalg.solve(hess(x), -g)
        except np.linalg.LinAlgError:
            d = -g
        if g @ d >= 0:  # not a descent direction: fall back to steepest descent
            d = -g
        x = x + backtracking(f, x, d, g) * d
        history.append(float(f(x)))
    return x, history
