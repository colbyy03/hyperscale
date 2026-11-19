import numpy as np


def fill_missing(X, observed, mean, modes):
    """Fill the dead (NaN) sensor columns of X from POD modes fitted to the working sensors."""
    X = np.asarray(X, dtype=float)
    observed = np.asarray(observed, dtype=bool)
    if observed.sum() < len(modes):
        raise ValueError(f"{observed.sum()} working sensors can't pin down {len(modes)} mode coefficients")
    A = modes[:, observed].T  # (n_working, k)
    B = (X[:, observed] - mean[observed]).T  # one snapshot per column
    coef = np.linalg.lstsq(A, B, rcond=None)[0]  # (k, n)
    est = mean + coef.T @ modes
    out = X.copy()
    out[:, ~observed] = est[:, ~observed]
    return out
