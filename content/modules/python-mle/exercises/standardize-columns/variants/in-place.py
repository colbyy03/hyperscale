# expect: changed its input
import numpy as np


def standardize(X):
    X = np.asarray(X, dtype=float)
    sd = X.std(axis=0)
    X -= X.mean(axis=0)
    X /= np.where(sd == 0, 1.0, sd)
    return X
