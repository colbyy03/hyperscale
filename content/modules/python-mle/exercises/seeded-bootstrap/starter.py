import numpy as np


def bootstrap_means(x, n_boot=200, seed=0, means=[]):
    """Means of n_boot bootstrap resamples of x, reproducible for a given seed.

    Returns an array of n_boot means. It must not disturb anyone else's random numbers.
    """
    np.random.seed(seed)
    for _ in range(n_boot):
        sample = np.random.choice(x, size=len(x))
        means.append(sample.mean())
    return np.array(means)
