# expect: changed NumPy's global random generator
import numpy as np


def bootstrap_means(x, n_boot=200, seed=0):
    np.random.seed(seed)
    x = np.asarray(x, dtype=float)
    return np.array([np.random.choice(x, size=len(x)).mean() for _ in range(n_boot)])
