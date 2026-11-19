# expect: after subtracting the mean
import numpy as np


def fill_missing(X, observed, mean, modes):
    observed = np.asarray(observed, dtype=bool)
    if observed.sum() < len(modes):
        raise ValueError("too few sensors")
    coef = np.linalg.lstsq(modes[:, observed].T, X[:, observed].T, rcond=None)[0]
    est = coef.T @ modes
    out = X.copy()
    out[:, ~observed] = est[:, ~observed]
    return out
