import numpy as np


def bootstrap_means(x, n_boot=200, seed=0):
    """Means of n_boot bootstrap resamples of x, reproducible for a given seed.

    Returns an array of n_boot means. It must not disturb anyone else's random numbers.
    """
    x = np.asarray(x, dtype=float)
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(x), size=(n_boot, len(x)))
    return x[idx].mean(axis=1)
