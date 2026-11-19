import numpy as np
import pytest


def check_pue(pue):
    """Raise AssertionError (or fail a pytest check) if `pue` breaks its specification."""
    assert pue(12.0, 10.0) == pytest.approx(1.2)
    # Several intervals: a ratio of totals, not an average of per-interval ratios.
    assert pue([1500.0, 3600.0], [1000.0, 3000.0]) == pytest.approx(1.275)
    assert pue(np.array([2.6, 2.6]), np.array([2.0, 2.0])) == pytest.approx(1.3)
    # Not a round number, so rounding shows up.
    assert pue(1.234, 1.0) == pytest.approx(1.234)
    with pytest.raises(ValueError):
        pue(5.0, 0.0)
    with pytest.raises(ValueError):
        pue([1.0, 2.0], [0.0, 0.0])
