import numpy as np
import pytest
from hsgrade import assert_close, assert_shape, assert_vectorized

import solution
from solution import rank_for_energy, truncate

RNG = np.random.default_rng(17)


def with_singular_values(s, m=30, n=12, seed=2):
    rng = np.random.default_rng(seed)
    U, _ = np.linalg.qr(rng.normal(size=(m, len(s))))
    V, _ = np.linalg.qr(rng.normal(size=(n, len(s))))
    return U @ np.diag(s) @ V.T


def test_error_matches_eckart_young():
    """Keep 3 of singular values 10, 5, 2, 1, 0.5: the Frobenius error is √(1 + 0.25) and the 2-norm error is 1."""
    A = with_singular_values([10.0, 5.0, 2.0, 1.0, 0.5])
    A3 = truncate(A, 3)
    assert_shape(A3, A.shape, "truncate(A, 3)")
    assert_close(np.linalg.norm(A - A3), np.sqrt(1.0 + 0.25), rtol=1e-9, name="Frobenius error of the rank-3 approximation")
    assert_close(np.linalg.norm(A - A3, 2), 1.0, rtol=1e-9, name="2-norm error of the rank-3 approximation")
    assert np.linalg.matrix_rank(A3) == 3, f"truncate(A, 3) should have rank 3; got {np.linalg.matrix_rank(A3)}"


def test_edge_cases():
    """k = 0 is all zeros; k at the rank returns A; works for wide matrices too."""
    A = RNG.normal(size=(5, 8))
    assert_close(truncate(A, 0), np.zeros((5, 8)), name="truncate(A, 0)")
    assert_close(truncate(A, 5), A, rtol=1e-10, atol=1e-12, name="truncate(A, 5) for a rank-5 matrix")


def test_beats_keeping_columns():
    """The SVD's rank-2 approximation is more accurate than keeping the two biggest columns."""
    A = RNG.normal(size=(40, 6)) @ np.diag([3, 2.5, 2, 1.5, 1, 0.5])
    big = np.argsort(np.linalg.norm(A, axis=0))[-2:]
    cols = np.zeros_like(A)
    cols[:, big] = A[:, big]
    assert np.linalg.norm(A - truncate(A, 2)) < np.linalg.norm(A - cols), "truncate(A, 2) should beat any other rank-2 matrix, including keeping two columns"


@pytest.mark.misconception("energy-uses-squares")
def test_rank_for_energy():
    """Singular values 10, 5, 2, 1, 0.5 have energies 100, 25, 4, 1, 0.25 out of 130.25."""
    A = with_singular_values([10.0, 5.0, 2.0, 1.0, 0.5])
    got = [rank_for_energy(A, f) for f in (0.5, 0.9, 0.99, 0.995, 0.999)]
    assert got == [1, 2, 3, 4, 5], (
        f"for fractions 0.5, 0.9, 0.99, 0.995, 0.999 expected k = [1, 2, 3, 4, 5]; got {got}. "
        "Energy uses squared singular values: the cumulative fractions are 100/130.25 = 0.768, 125/130.25 = 0.960, 129/130.25 = 0.9904, 130/130.25 = 0.9981 and 1."
    )
    assert rank_for_energy(A, 1.0) == 5, f"capturing all of the energy needs all 5 singular values; got {rank_for_energy(A, 1.0)}"


def test_no_python_loops():
    """Vectorized: slicing and cumsum, no loops."""
    assert_vectorized(solution.truncate)
    assert_vectorized(solution.rank_for_energy)
