import numpy as np
import pytest
from hsgrade import assert_close, assert_shape

from solution import closed_loop_matrix, max_stable_ki, period, spectral_radius

TS, TAU, K, DELAY = 10.0, 90.0, 8.0, 3  # 10 s samples, 90 s time constant, gain 8, 30 s dead time
A = np.exp(-TS / TAU)
B = K * (1 - A)
KP = TAU / (K * 60.0)  # SIMC tuning with τc = θ = 30 s
KI = KP / TAU


def char_roots(kp, ki, delay):
    """Roots of (z − a)(z − 1) z^delay + b (kp (z − 1) + ki ts): the loop's poles."""
    p = np.polymul(np.polymul([1, -A], [1, -1]), [1] + [0] * delay)
    p[-2] += B * kp
    p[-1] += B * (ki * TS - kp)
    return np.sort_complex(np.roots(p))


def test_no_delay_by_hand():
    """delay = 0: [[a − b·kp, b·ki], [−ts, 1]]."""
    M = closed_loop_matrix(0.9, 0.5, 0.2, 0.01, 10.0, 0)
    assert_close(M, [[0.9 - 0.1, 0.005], [-10.0, 1.0]], name="closed_loop_matrix with no delay")


@pytest.mark.misconception("deadtime-in-state")
def test_delay_adds_states_and_matches_the_poles():
    """With 3 samples of dead time the state has 5 entries, and the eigenvalues are the characteristic polynomial's roots."""
    M = closed_loop_matrix(A, B, KP, KI, TS, DELAY)
    assert_shape(M, (5, 5), "closed_loop_matrix with delay = 3 (x, s and three stored valve signals)")
    assert_close(np.sort_complex(np.linalg.eigvals(M)), char_roots(KP, KI, DELAY), atol=1e-8, name="eigenvalues of M compared with the loop's poles")


@pytest.mark.misconception("spectral-radius-complex")
def test_the_incident():
    """Commissioning tuning is stable (radius ≈ 0.883); the upgrade's 4× integral gain isn't (≈ 1.016), oscillating every ≈ 236 s."""
    good = closed_loop_matrix(A, B, KP, KI, TS, DELAY)
    bad = closed_loop_matrix(A, B, KP, 4 * KI, TS, DELAY)
    assert_close(spectral_radius(good), 0.8827, rtol=1e-3, name="spectral radius with the commissioning tuning")
    assert_close(spectral_radius(bad), 1.0165, rtol=1e-3, name="spectral radius with 4× the integral gain")
    assert_close(period(bad, TS), 236.0, rtol=0.01, name="oscillation period (s) with 4× the integral gain")
    assert period(good, TS) == np.inf, "the commissioning tuning's dominant pole is real: no oscillation"


def test_stability_limit():
    """The largest stable integral gain is about 3.45× the commissioning value, and it really is stable."""
    ki_max = max_stable_ki(A, B, KP, TS, DELAY, hi=0.05)
    assert_close(ki_max / KI, 3.45, rtol=0.01, name="max stable ki as a multiple of the SIMC ki")
    assert spectral_radius(closed_loop_matrix(A, B, KP, ki_max, TS, DELAY)) < 1, "the returned ki must itself be stable"
