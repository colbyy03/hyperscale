# expect: pytest.raises(ValueError)
import pytest


def check_pue(pue):
    assert pue(12.0, 10.0) == pytest.approx(1.2)
    assert pue([1500.0, 3600.0], [1000.0, 3000.0]) == pytest.approx(1.275)
    assert pue(1.234, 1.0) == pytest.approx(1.234)
