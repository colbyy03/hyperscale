# expect: contains NaN
import numpy as np


def standardize(X):
    X = np.asarray(X, dtype=float)
    return (X - X.mean(axis=0)) / X.std(axis=0)
