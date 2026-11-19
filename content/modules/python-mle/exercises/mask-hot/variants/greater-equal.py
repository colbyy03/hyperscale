# expect: a reading equal to the limit is kept
import numpy as np


def mask_hot(readings, limit=40.0):
    return np.where(readings >= limit, np.nan, readings)
