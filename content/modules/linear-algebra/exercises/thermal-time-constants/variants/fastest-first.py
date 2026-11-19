# expect: slowest first
import numpy as np


def _rates(C, K):
    d = 1.0 / np.sqrt(np.asarray(C, dtype=float))
    return np.linalg.eigvalsh(d[:, None] * np.asarray(K, dtype=float) * d[None, :])


def time_constants(C, K):
    return np.sort(1.0 / _rates(C, K))


def max_euler_step(C, K):
    return 2.0 / _rates(C, K).max()
