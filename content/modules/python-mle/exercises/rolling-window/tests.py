import numpy as np

from solution import rolling_mean


def test_small_example():
    """Windows of 3 over 0..5 average to 1, 2, 3, 4."""
    out = rolling_mean(np.arange(6.0), 3)
    assert np.allclose(out, [1.0, 2.0, 3.0, 4.0]), f"expected [1, 2, 3, 4], got {out}"


def test_matches_a_convolution():
    """Agrees with a moving average computed another way, and has n - k + 1 values."""
    x = np.random.default_rng(3).normal(24.0, 1.0, 500)
    out = rolling_mean(x, 15)
    assert out.shape == (486,), f"a length-500 series with k = 15 gives 486 windows, got shape {out.shape}"
    assert np.allclose(out, np.convolve(x, np.ones(15) / 15, mode="valid"))
