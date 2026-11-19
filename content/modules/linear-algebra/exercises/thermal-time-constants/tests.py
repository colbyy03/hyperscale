import numpy as np
import pytest
from hsgrade import assert_close, assert_shape

from solution import max_euler_step, time_constants

# Junction, case, cold plate: heat capacities (J/K) and the conductance matrix (W/K).
C3 = np.array([40.0, 120.0, 600.0])
G_JC, G_CP, G_PC = 1 / 0.03, 1 / 0.02, 1 / 0.015
K3 = np.array([[G_JC, -G_JC, 0.0], [-G_JC, G_JC + G_CP, -G_CP], [0.0, -G_CP, G_CP + G_PC]])


def reference_tau(C, K):
    lam = np.linalg.eigvals(np.diag(1 / C) @ K).real
    return np.sort(1 / lam)[::-1]


def test_one_node_is_c_over_g():
    """A 600 J/K plate with 66.7 W/K to the coolant: τ = C/G = 9 s."""
    tau = time_constants(np.array([600.0]), np.array([[600.0 / 9.0]]))
    assert_close(tau, [9.0], rtol=1e-12, name="time constant of a single node")


@pytest.mark.misconception("eigenvalues-ignore-capacity")
def test_the_three_node_stack():
    """Junction, case and plate: about 12.4 s, 2.65 s and 0.79 s."""
    tau = time_constants(C3, K3)
    assert_shape(tau, (3,), "time_constants(C, K)")
    assert np.isrealobj(tau), f"return real time constants, not dtype {np.asarray(tau).dtype}: eigvalsh on the symmetric form gives real eigenvalues"
    assert_close(tau, reference_tau(C3, K3), rtol=1e-9, name="time constants of the three-node stack (slowest first)")


def test_capacity_scales_time():
    """Double every heat capacity and every time constant doubles."""
    assert_close(time_constants(2 * C3, K3), 2 * reference_tau(C3, K3), rtol=1e-9, name="time constants with doubled capacities")


def euler_peak(C, K, dt, steps=400):
    T = np.array([10.0, 5.0, 2.0])
    A = np.eye(3) - dt * (K / C[:, None])
    for _ in range(steps):
        T = A @ T
    return np.abs(T).max()


@pytest.mark.misconception("stiff-euler-step")
def test_the_euler_limit_is_set_by_the_fastest_mode():
    """Just under the limit forward Euler decays; just over it, it blows up."""
    dt = max_euler_step(C3, K3)
    assert_close(dt, 2 * 0.7910, rtol=1e-3, name="max_euler_step for the three-node stack (s)")
    assert euler_peak(C3, K3, 0.95 * dt) < 1e-3, "forward Euler at 95% of your step limit should decay"
    assert euler_peak(C3, K3, 1.05 * dt) > 1e3, "forward Euler at 105% of your step limit should blow up; your limit is too small"
