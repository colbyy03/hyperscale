# expect: Huber gradient compared with central differences
import numpy as np


def huber_loss_grad(w, X, y, delta):
    r = X @ w - y
    a = np.abs(r)
    loss = float(np.mean(np.where(a <= delta, 0.5 * r**2, delta * (a - 0.5 * delta))))
    grad = X.T @ r / len(y)  # forgets the clipping
    return loss, grad


def fit_huber(X, y, delta, iters=3000):
    L = np.linalg.eigvalsh(X.T @ X / len(y)).max()
    w = np.zeros(X.shape[1])
    for _ in range(iters):
        w = w - huber_loss_grad(w, X, y, delta)[1] / L
    return w
