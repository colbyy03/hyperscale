import numpy as np
import pytest
from hsgrade import assert_close, assert_shape, assert_vectorized

import solution
from solution import forward_backward

RNG = np.random.default_rng(43)
N, H, M = 4, 5, 3
W1 = RNG.normal(0, 0.8, (H, N))
W2 = RNG.normal(0, 0.8, (M, H))
X = RNG.normal(size=N)
Y = RNG.normal(size=M)


def loss(W1, W2):
    return 0.5 * np.sum((W2 @ np.tanh(W1 @ X) - Y) ** 2)


def numerical(W, f, h=1e-6):
    g = np.zeros_like(W)
    for idx in np.ndindex(W.shape):
        Wp, Wm = W.copy(), W.copy()
        Wp[idx] += h
        Wm[idx] -= h
        g[idx] = (f(Wp) - f(Wm)) / (2 * h)
    return g


def test_loss_and_shapes():
    """L matches the formula; each gradient has its weight's shape."""
    L, dW1, dW2 = forward_backward(W1, W2, X, Y)
    assert_close(L, loss(W1, W2), rtol=1e-12, name="L")
    assert_shape(dW1, (H, N), "dW1 (the shape of W1)")
    assert_shape(dW2, (M, H), "dW2 (the shape of W2)")


@pytest.mark.misconception("outer-product-order")
def test_output_layer_gradient():
    """dW2 matches central differences."""
    _, _, dW2 = forward_backward(W1, W2, X, Y)
    assert_close(dW2, numerical(W2, lambda W: loss(W1, W)), rtol=1e-6, atol=1e-9, name="dW2 compared with finite differences")


@pytest.mark.misconception("tanh-derivative-output")
def test_hidden_layer_gradient():
    """dW1 matches central differences: the signal goes back through W2ᵀ and tanh′."""
    _, dW1, _ = forward_backward(W1, W2, X, Y)
    assert_close(dW1, numerical(W1, lambda W: loss(W, W2)), rtol=1e-6, atol=1e-9, name="dW1 compared with finite differences")


def test_a_perfect_fit_has_zero_gradient():
    """If the target equals the output, there's nothing to learn."""
    y = W2 @ np.tanh(W1 @ X)
    L, dW1, dW2 = forward_backward(W1, W2, X, y)
    assert_close([L, np.abs(dW1).max(), np.abs(dW2).max()], [0, 0, 0], atol=1e-12, name="loss and gradients at a perfect fit")


def test_no_python_loops():
    """One forward and one backward pass of array operations."""
    assert_vectorized(solution.forward_backward)
