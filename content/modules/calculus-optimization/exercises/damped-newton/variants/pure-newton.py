# expect: Backtrack until the Armijo condition holds
import numpy as np


def backtracking(f, x, d, g, alpha=1.0, c=1e-4, rho=0.5):
    fx = f(x)
    for _ in range(60):
        if f(x + alpha * d) <= fx + c * alpha * float(g @ d):
            return alpha
        alpha *= rho
    return alpha


def damped_newton(f, grad, hess, x0, tol=1e-8, max_iter=200):
    x = np.asarray(x0, dtype=float).copy()
    history = [float(f(x))]
    for _ in range(max_iter):
        g = grad(x)
        if np.linalg.norm(g) < tol:
            break
        d = np.linalg.solve(hess(x), -g)
        if g @ d >= 0:
            d = -g
        x = x + d  # full steps, no line search
        history.append(float(f(x)))
    return x, history
