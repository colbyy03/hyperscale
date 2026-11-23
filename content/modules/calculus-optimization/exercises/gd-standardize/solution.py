import numpy as np


def gradient_descent(grad, w0, lr, tol=1e-9, max_iter=100_000):
    """Fixed-step gradient descent until ||grad(w)|| < tol. Returns (w, iterations, converged)."""
    w = np.asarray(w0, dtype=float).copy()
    for k in range(max_iter + 1):
        g = grad(w)
        if np.linalg.norm(g) < tol:
            return w, k, True
        if k == max_iter:
            break
        w = w - lr * g
    return w, max_iter, False


def fit_linear_gd(X, y):
    """Least squares with an intercept, by gradient descent on standardized features. Returns (intercept, coef, iterations)."""
    X = np.atleast_2d(np.asarray(X, dtype=float).T).T  # accept a single feature as shape (n,)
    y = np.asarray(y, dtype=float)
    n = len(y)
    m = X.mean(axis=0)
    s = X.std(axis=0)
    Z = np.column_stack([np.ones(n), (X - m) / s])
    H = Z.T @ Z / n
    g0 = Z.T @ y / n
    L = np.linalg.eigvalsh(H).max()
    beta, its, _ = gradient_descent(lambda b: H @ b - g0, np.zeros(Z.shape[1]), 1.0 / L)
    coef = beta[1:] / s
    return beta[0] - coef @ m, coef, its
