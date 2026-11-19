# expect: time constants of the three-node stack
import numpy as np


def time_constants(C, K):
    return 1.0 / np.linalg.eigvalsh(np.asarray(K, dtype=float)) * np.mean(C)


def max_euler_step(C, K):
    return 2.0 / (np.linalg.eigvalsh(np.asarray(K, dtype=float)).max() / np.mean(C))
