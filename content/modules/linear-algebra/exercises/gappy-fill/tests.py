import numpy as np
import pytest
from hsgrade import assert_close, assert_vectorized

import solution
from field import make_field
from solution import fill_missing

X = make_field()  # (480, 72)
TRAIN, TEST = X[:360], X[360:]
MEAN = TRAIN.mean(axis=0)
MODES = np.linalg.svd(TRAIN - MEAN, full_matrices=False)[2]  # all 72 modes, best first
DEAD = np.array([2, 5, 35, 38, 68, 71])  # top-of-rack sensors at the row ends
OBSERVED = np.ones(72, dtype=bool)
OBSERVED[DEAD] = False


def knock_out(Y):
    Y = Y.copy()
    Y[:, DEAD] = np.nan
    return Y


def test_exact_when_the_field_is_in_the_span():
    """A field built exactly from the mean and three modes is recovered exactly."""
    rng = np.random.default_rng(1)
    Y = MEAN + rng.normal(0, 2.0, (10, 3)) @ MODES[:3]
    out = fill_missing(knock_out(Y), OBSERVED, MEAN, MODES[:3])
    assert_close(out[:, DEAD], Y[:, DEAD], rtol=1e-9, atol=1e-9, name="filled sensors for a field that is exactly mean + 3 modes")


@pytest.mark.misconception("gappy-projection")
def test_six_dead_sensors_on_held_out_hours():
    """Modes from the first 15 days fill six dead top sensors over the last 5 days to near the sensor noise."""
    out = fill_missing(knock_out(TEST), OBSERVED, MEAN, MODES[:3])
    err = np.sqrt(((out[:, DEAD] - TEST[:, DEAD]) ** 2).mean())
    baseline = np.sqrt(((MEAN[DEAD] - TEST[:, DEAD]) ** 2).mean())
    assert err < 0.15, (
        f"RMS error at the dead sensors is {err:.2f} °C (filling with the mean alone gives {baseline:.2f} °C; three modes should get under 0.15 °C). "
        "Fit the coefficients by least squares on the working sensors, after subtracting the mean."
    )


def test_working_sensors_are_untouched():
    """Only the dead columns change, and nothing is left as NaN."""
    Y = knock_out(TEST)
    out = fill_missing(Y, OBSERVED, MEAN, MODES[:3])
    assert not np.isnan(out).any(), "the result still contains NaN"
    assert_close(out[:, OBSERVED], Y[:, OBSERVED], rtol=0, atol=0, name="readings of the working sensors")
    assert np.isnan(Y).sum() == 120 * len(DEAD), "fill_missing must not modify its input X; return a filled copy"


def test_too_few_working_sensors():
    """Two working sensors can't determine three mode coefficients."""
    obs = np.zeros(72, dtype=bool)
    obs[[0, 1]] = True
    with pytest.raises(ValueError):
        fill_missing(knock_out(TEST), obs, MEAN, MODES[:3])


def test_no_python_loops():
    """One least-squares solve for every snapshot; no loops."""
    assert_vectorized(solution.fill_missing)
