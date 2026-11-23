# expect: mean Huber loss for residuals 0.5 and 3 with δ = 1
import numpy as np


def huber_loss_grad(w, X, y, delta):
    r = X @ w - y
    a = np.abs(r)
    loss = float(np.mean(np.where(a <= delta, 0.5 * r**2, delta * a)))  # missing the −δ/2
    grad = X.T @ np.clip(r, -delta, delta) / len(y)
    return loss, grad


def fit_huber(X, y, delta, iters=3000):
    L = np.linalg.eigvalsh(X.T @ X / len(y)).max()
    w = np.zeros(X.shape[1])
    for _ in range(iters):
        w = w - huber_loss_grad(w, X, y, delta)[1] / L
    return w
