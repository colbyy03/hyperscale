# expect: Fit the coefficients by least squares on the working sensors
import numpy as np


def fill_missing(X, observed, mean, modes):
    observed = np.asarray(observed, dtype=bool)
    if observed.sum() < len(modes):
        raise ValueError("too few sensors")
    coef = modes[:, observed] @ (X[:, observed] - mean[observed]).T
    est = mean + coef.T @ modes
    out = X.copy()
    out[:, ~observed] = est[:, ~observed]
    return out
