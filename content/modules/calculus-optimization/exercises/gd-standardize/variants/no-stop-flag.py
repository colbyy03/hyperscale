# expect: lr = 0.25 > 2/L = 0.2 diverges
import numpy as np


def gradient_descent(grad, w0, lr, tol=1e-9, max_iter=100_000):
    w = np.asarray(w0, dtype=float).copy()
    k = 0
    for k in range(1, max_iter + 1):
        w = w - lr * grad(w)
        if np.linalg.norm(grad(w)) < tol:
            break
    return w, k, True


def fit_linear_gd(X, y):
    X = np.atleast_2d(np.asarray(X, dtype=float).T).T
    n = len(y)
    m, s = X.mean(axis=0), X.std(axis=0)
    Z = np.column_stack([np.ones(n), (X - m) / s])
    H = Z.T @ Z / n
    L = np.linalg.eigvalsh(H).max()
    beta, its, _ = gradient_descent(lambda b: H @ b - Z.T @ y / n, np.zeros(Z.shape[1]), 1.0 / L)
    coef = beta[1:] / s
    return beta[0] - coef @ m, coef, its
