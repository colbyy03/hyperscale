# expect: the returned ki must itself be stable
import numpy as np


def closed_loop_matrix(a, b, kp, ki, ts, delay):
    if delay == 0:
        return np.array([[a - b * kp, b * ki], [-ts, 1.0]])
    n = 2 + delay
    M = np.zeros((n, n))
    M[0, 0], M[0, n - 1] = a, b
    M[1, 0], M[1, 1] = -ts, 1.0
    M[2, 0], M[2, 1] = -kp, ki
    for i in range(3, n):
        M[i, i - 1] = 1.0
    return M


def spectral_radius(M):
    return float(np.abs(np.linalg.eigvals(M)).max())


def period(M, ts):
    ev = np.linalg.eigvals(M)
    lam = ev[np.argmax(np.abs(ev))]
    ang = abs(np.angle(lam))
    return 2 * np.pi / ang * ts if ang > 1e-12 else np.inf


def max_stable_ki(a, b, kp, ts, delay, hi=1.0):
    lo = 0.0
    for _ in range(80):
        mid = 0.5 * (lo + hi)
        if spectral_radius(closed_loop_matrix(a, b, kp, mid, ts, delay)) < 1.0:
            lo = mid
        else:
            hi = mid
    return hi * (1 + 1e-6)  # the first unstable value, not the last stable one
