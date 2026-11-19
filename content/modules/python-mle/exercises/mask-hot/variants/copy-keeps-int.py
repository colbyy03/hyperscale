# expect: Integer arrays can't hold NaN
import numpy as np


def mask_hot(readings, limit=40.0):
    cleaned = readings.copy()
    cleaned[cleaned > limit] = np.nan
    return cleaned
