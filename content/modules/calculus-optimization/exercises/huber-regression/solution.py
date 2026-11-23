import numpy as np


def huber_loss_grad(w, X, y, delta):
    """Mean Huber loss of the residuals X w - y, and its gradient."""
    r = X @ w - y
    a = np.abs(r)
    loss = float(np.mean(np.where(a <= delta, 0.5 * r**2, delta * (a - 0.5 * delta))))
    grad = X.T @ np.clip(r, -delta, delta) / len(y)
    return loss, grad


def fit_huber(X, y, delta, iters=3000):
    """Gradient descent with step 1/L on the mean Huber loss, starting from zero."""
    n = len(y)
    L = np.linalg.eigvalsh(X.T @ X / n).max()
    w = np.zeros(X.shape[1])
    for _ in range(iters):
        w = w - huber_loss_grad(w, X, y, delta)[1] / L
    return w
