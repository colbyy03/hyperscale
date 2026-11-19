# expect: Compare floats with pytest.approx
import pytest


def check_pue(pue):
    assert pue(0.3, 0.1) == 3.0
    assert pue([1500.0, 3600.0], [1000.0, 3000.0]) == pytest.approx(1.275)
    with pytest.raises(ValueError):
        pue(5.0, 0.0)
