import numpy as np


def huber_loss_grad(w, X, y, delta):
    """Mean Huber loss of the residuals X w - y, and its gradient."""
    raise NotImplementedError("huber_loss_grad is not written yet")


def fit_huber(X, y, delta, iters=3000):
    """Gradient descent with step 1/L on the mean Huber loss, starting from zero."""
    raise NotImplementedError("fit_huber is not written yet")
