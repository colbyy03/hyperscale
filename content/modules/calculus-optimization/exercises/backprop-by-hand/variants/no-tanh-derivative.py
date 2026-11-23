# expect: dW1 compared with finite differences
import numpy as np


def forward_backward(W1, W2, x, y):
    a = np.tanh(W1 @ x)
    g_out = W2 @ a - y
    L = 0.5 * float(g_out @ g_out)
    dW2 = np.outer(g_out, a)
    dW1 = np.outer(W2.T @ g_out, x)
    return L, dW1, dW2
