# expect: averages per-interval ratios
import pytest


def check_pue(pue):
    assert pue(12.0, 10.0) == pytest.approx(1.2)
