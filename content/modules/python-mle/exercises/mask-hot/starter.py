import numpy as np


def mask_hot(readings, limit=40.0):
    """Return a copy of `readings` with every value above `limit` replaced by NaN.

    The input must not change: callers keep it as the raw record.
    """
    cleaned = readings[:]
    cleaned[cleaned > limit] = np.nan
    return cleaned
