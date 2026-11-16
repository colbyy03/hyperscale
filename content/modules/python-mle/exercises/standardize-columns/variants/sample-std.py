# expect: differ
import numpy as np


def standardize(X):
    X = np.asarray(X, dtype=float)
    sd = X.std(axis=0, ddof=1)
    return (X - X.mean(axis=0)) / np.where(sd == 0, 1.0, sd)
