# expect: your function changed its input
import numpy as np


def mask_hot(readings, limit=40.0):
    cleaned = readings[:]
    cleaned[cleaned > limit] = np.nan
    return cleaned
