import inspect

import numpy as np
import pytest
from hsgrade import assert_close

import solution
from solution import steady_state

# One GPU: junction (0) -> case (1) -> cold plate (2) -> coolant. Resistances 0.03, 0.02, 0.015 K/W.
CHAIN = [(0, 1, 1 / 0.03), (1, 2, 1 / 0.02), (2, -1, 1 / 0.015)]
# Two GPUs: junctions 0, 1; cases 2, 3; shared plate 4. The cases also exchange a little heat sideways.
TWIN = [(0, 2, 1 / 0.03), (1, 3, 1 / 0.03), (2, 4, 1 / 0.02), (3, 4, 1 / 0.02), (2, 3, 5.0), (4, -1, 1 / 0.008)]


def test_a_series_chain_adds_resistances():
    """700 W through 0.015, 0.02 and 0.03 K/W in series, from 35 °C coolant: 45.5, 59.5, 80.5 °C."""
    T = steady_state(CHAIN, [700.0, 0.0, 0.0], 35.0)
    assert_close(T, [80.5, 59.5, 45.5], rtol=1e-9, name="temperatures of the single-GPU chain [junction, case, plate]")


def test_energy_balance_and_symmetry():
    """Everything generated leaves through the coolant link; equal loads give equal temperatures."""
    q = np.array([650.0, 650.0, 0.0, 0.0, 0.0])
    T = steady_state(TWIN, q, 32.0)
    assert_close((T[4] - 32.0) / 0.008, q.sum(), rtol=1e-9, name="heat into the coolant (W)")
    assert_close(T[0], T[1], rtol=1e-12, name="junction temperatures under equal load")


def test_an_idle_gpu_still_warms_up():
    """With one GPU idle, its junction sits above the coolant: heat reaches it through the plate and the side link."""
    T = steady_state(TWIN, [700.0, 0.0, 0.0, 0.0, 0.0], 32.0)
    assert T[1] > 32.0 + 1.0, f"the idle GPU's junction should be warmer than the coolant; got {T[1]:.2f} °C"
    assert T[0] > T[2] > T[4] > 32.0, f"heat flows downhill from the busy junction to the coolant; got {np.round(T, 2)}"


def test_superposition():
    """The temperature rise is linear in the heat: the rise for q1 + q2 is the sum of the rises."""
    q1 = np.array([500.0, 0.0, 0.0, 0.0, 0.0])
    q2 = np.array([0.0, 300.0, 20.0, 0.0, 10.0])
    rise = lambda q: steady_state(TWIN, q, 30.0) - 30.0
    assert_close(rise(q1 + q2), rise(q1) + rise(q2), rtol=1e-9, name="rise(q1 + q2)")


def test_a_floating_network_is_rejected():
    """No link to the coolant: adding a constant to every temperature changes nothing, so T isn't determined."""
    with pytest.raises(ValueError):
        steady_state([(0, 1, 33.3), (1, 2, 50.0)], [700.0, 0.0, 0.0], 35.0)


def test_a_floating_island_is_rejected():
    """Nodes 3 and 4 are linked to each other but to nothing else."""
    links = CHAIN + [(3, 4, 12.5)]
    with pytest.raises(ValueError):
        steady_state(links, [700.0, 0.0, 0.0, 0.0, 0.0], 35.0)


@pytest.mark.misconception("solve-not-inverse")
def test_no_explicit_inverse():
    """Solve the system; don't form the inverse."""
    src = inspect.getsource(solution)
    assert "inv(" not in src and "pinv" not in src, "use np.linalg.solve(K, rhs), not an explicit inverse: it's cheaper and more accurate"
