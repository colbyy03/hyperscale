import numpy as np
import pytest
from hsgrade import assert_not_imported

import solution
from solution import running_mean_var

RNG = np.random.default_rng(5)


def _check(values, mean, var, label, rtol=1e-9):
    m, v = running_mean_var(values)
    assert m == pytest.approx(mean, rel=rtol, abs=1e-12), f"{label}: mean should be {mean:.10g}, got {m:.10g}"
    assert v == pytest.approx(var, rel=rtol, abs=1e-12), f"{label}: variance should be {var:.10g}, got {v:.10g}"


def test_small_example():
    """10, 12, 14, 16, 18: mean 14, population variance 8."""
    m, v = running_mean_var([10.0, 12.0, 14.0, 16.0, 18.0])
    assert m == pytest.approx(14.0), f"mean should be 14, got {m}"
    if v == pytest.approx(10.0):
        raise AssertionError("variance is 10, the sample variance (divide by n − 1). This function returns the population variance: divide by n.")
    assert v == pytest.approx(8.0), f"population variance should be 8, got {v}"


def test_reads_a_generator_once():
    """Works on a generator, which can only be read once."""
    data = RNG.normal(24.0, 1.5, 1000)
    _check((float(x) for x in data), data.mean(), data.var(), "a generator of 1000 readings")


@pytest.mark.misconception("catastrophic-cancellation")
def test_huge_offset():
    """A cumulative counter near 4.2e10 with a variance of about 9."""
    data = 4.2e10 + RNG.normal(0.0, 3.0, 5000)
    m, v = running_mean_var(float(x) for x in data)
    true_v = data.var()
    assert abs(v - true_v) <= 1e-5 * true_v, (
        f"variance should be {true_v:.6g}, got {v:.6g}. With a large offset, mean of squares minus square of mean "
        "cancels catastrophically: both terms are near 1.8e21 and their difference is lost in rounding. Track deviations from the running mean instead (Welford)."
    )
    assert m == pytest.approx(data.mean(), rel=1e-12)


def test_single_value_and_empty():
    """One value has variance 0; no values raise ValueError."""
    assert running_mean_var([21.5]) == (21.5, 0.0)
    with pytest.raises(ValueError):
        running_mean_var([])


def test_no_numpy_or_statistics():
    """Built from running totals, not library reductions."""
    assert_not_imported(solution, ["numpy", "statistics"])


@pytest.mark.hidden
def test_float32_readings():
    """Float32 readings (as a GPU pipeline would produce) still give an accurate variance."""
    data = (21.5 + 0.01 * RNG.standard_normal(20000)).astype(np.float32)
    m, v = running_mean_var(data.tolist())
    assert v == pytest.approx(data.astype(np.float64).var(), rel=1e-6)
