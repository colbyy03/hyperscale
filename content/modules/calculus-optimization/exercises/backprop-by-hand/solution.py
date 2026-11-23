import numpy as np


def forward_backward(W1, W2, x, y):
    """Loss 0.5 * ||W2 tanh(W1 x) - y||^2 and its gradients (L, dW1, dW2)."""
    # Forward pass, keeping what the backward pass needs.
    z = W1 @ x
    a = np.tanh(z)
    out = W2 @ a
    g_out = out - y
    L = 0.5 * float(g_out @ g_out)
    # Backward pass: from the loss to the weights.
    dW2 = np.outer(g_out, a)
    g_a = W2.T @ g_out
    g_z = g_a * (1.0 - a**2)
    dW1 = np.outer(g_z, x)
    return L, dW1, dW2
