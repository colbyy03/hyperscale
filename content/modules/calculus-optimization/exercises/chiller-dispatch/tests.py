import numpy as np
import pytest
from hsgrade import assert_close

from solution import dispatch

A = np.array([60.0, 55.0, 30.0])
B = np.array([0.10, 0.11, 0.06])
C = np.array([2.5e-5, 2.2e-5, 2.0e-5])  # chiller 3 is the newer, more efficient machine
QMIN = np.full(3, 560.0)
QMAX = np.full(3, 2800.0)


def power(q):
    return A + B * q + C * q**2


@pytest.mark.misconception("equal-loading")
def test_beats_equal_loading():
    """5,000 kW of cooling: the efficient chiller takes more, saving about 25 kW over an equal split."""
    q, lam = dispatch(A, B, C, QMIN, QMAX, 5000.0)
    assert_close(q.sum(), 5000.0, rtol=1e-9, name="total load")
    assert_close(q, [1248.4, 1190.6, 2560.9], rtol=2e-3, name="optimal loads for 5,000 kW")
    saving = power(np.full(3, 5000.0 / 3)).sum() - power(q).sum()
    assert saving > 20, f"the optimal split should save about 25 kW over equal loading; it saves {saving:.1f} kW"


@pytest.mark.misconception("marginal-power-derivative")
def test_kkt_conditions():
    """Interior chillers share one marginal power λ; at 7,000 kW the efficient chiller hits 2,800 kW with P′ below λ."""
    q, lam = dispatch(A, B, C, QMIN, QMAX, 7000.0)
    marginal = B + 2 * C * q
    assert_close(q[2], 2800.0, rtol=1e-9, name="the efficient chiller's load at 7,000 kW total (its upper limit)")
    assert_close(marginal[:2], [lam, lam], rtol=1e-6, name="marginal power (b + 2cQ) of the two interior chillers, which must equal λ")
    assert marginal[2] <= lam + 1e-9, f"a chiller at its upper limit must have marginal power ≤ λ; got {marginal[2]:.4f} > {lam:.4f}"


def test_lambda_is_the_shadow_price():
    """λ predicts the extra power for 100 kW more cooling."""
    q1, lam = dispatch(A, B, C, QMIN, QMAX, 5000.0)
    q2, _ = dispatch(A, B, C, QMIN, QMAX, 5100.0)
    assert_close(power(q2).sum() - power(q1).sum(), 100 * lam, rtol=0.02, name="extra plant power for 100 kW more cooling, compared with 100·λ")


def test_out_of_range_load():
    """More than the plant can deliver is an error, not a silent clip."""
    with pytest.raises(ValueError):
        dispatch(A, B, C, QMIN, QMAX, 9000.0)
    with pytest.raises(ValueError):
        dispatch(A, B, C, QMIN, QMAX, 1000.0)
