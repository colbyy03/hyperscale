import numpy as np


def truncate(A, k):
    """Best rank-k approximation of A (keep the k largest singular values)."""
    raise NotImplementedError("truncate is not written yet")


def rank_for_energy(A, fraction):
    """Smallest k whose squared singular values capture at least `fraction` of the total."""
    raise NotImplementedError("rank_for_energy is not written yet")
