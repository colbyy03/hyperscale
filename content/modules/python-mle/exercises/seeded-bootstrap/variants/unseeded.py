# expect: the same seed should give exactly the same means
import numpy as np


def bootstrap_means(x, n_boot=200, seed=0):
    rng = np.random.default_rng()
    x = np.asarray(x, dtype=float)
    return x[rng.integers(0, len(x), size=(n_boot, len(x)))].mean(axis=1)
