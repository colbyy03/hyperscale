import dataclasses

import pytest

from solution import ForecastConfig


def test_defaults():
    """The defaults are a 24-hour horizon, lags (1, 2, 24) and two features."""
    c = ForecastConfig()
    assert (c.horizon_hours, c.lags, c.features) == (24, (1, 2, 24), ["inlet_temp", "it_kw"])


def test_frozen():
    """Fields can't be reassigned after construction."""
    c = ForecastConfig()
    with pytest.raises(dataclasses.FrozenInstanceError):
        c.horizon_hours = 48


def test_each_instance_has_its_own_list():
    """Two configs don't share one feature list."""
    assert ForecastConfig().features is not ForecastConfig().features
