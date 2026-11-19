# expect: must not modify its input X
import numpy as np


def fill_missing(X, observed, mean, modes):
    observed = np.asarray(observed, dtype=bool)
    if observed.sum() < len(modes):
        raise ValueError("too few sensors")
    coef = np.linalg.lstsq(modes[:, observed].T, (X[:, observed] - mean[observed]).T, rcond=None)[0]
    est = mean + coef.T @ modes
    X[:, ~observed] = est[:, ~observed]
    return X
