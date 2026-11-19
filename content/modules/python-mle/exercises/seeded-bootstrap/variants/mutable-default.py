# expect: shared by every call
import numpy as np


def bootstrap_means(x, n_boot=200, seed=0, means=[]):
    rng = np.random.default_rng(seed)
    x = np.asarray(x, dtype=float)
    for _ in range(n_boot):
        means.append(x[rng.integers(0, len(x), len(x))].mean())
    return np.array(means)
