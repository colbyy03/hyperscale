import numpy as np


def closed_loop_matrix(a, b, kp, ki, ts, delay):
    """Closed-loop state matrix for x' = a x + b u(k - delay) under PI control."""
    if delay == 0:
        return np.array([[a - b * kp, b * ki], [-ts, 1.0]])
    n = 2 + delay
    M = np.zeros((n, n))
    M[0, 0] = a
    M[0, n - 1] = b  # the plant sees the oldest stored valve signal
    M[1, 0], M[1, 1] = -ts, 1.0  # s' = s + ts * e, with e = -x
    M[2, 0], M[2, 1] = -kp, ki  # newest valve signal u_k = kp * e + ki * s
    for i in range(3, n):
        M[i, i - 1] = 1.0  # shift register
    return M


def spectral_radius(M):
    return float(np.abs(np.linalg.eigvals(M)).max())


def period(M, ts):
    """Oscillation period (s) of the dominant eigenvalue; inf if it's real."""
    ev = np.linalg.eigvals(M)
    lam = ev[np.argmax(np.abs(ev))]
    ang = abs(np.angle(lam))
    return 2 * np.pi / ang * ts if ang > 1e-12 else np.inf


def max_stable_ki(a, b, kp, ts, delay, hi=1.0):
    """Largest ki in (0, hi] with spectral radius < 1, by bisection."""
    lo = 0.0
    for _ in range(80):
        mid = 0.5 * (lo + hi)
        if spectral_radius(closed_loop_matrix(a, b, kp, mid, ts, delay)) < 1.0:
            lo = mid
        else:
            hi = mid
    return lo
