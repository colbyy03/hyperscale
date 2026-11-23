import math

import pytest
from hsgrade import assert_close

from solution import Dual, derivative, exp, log, sin


def test_a_polynomial():
    """f(x) = 3x² + 2x + 1 has f′(2) = 14."""
    assert_close(derivative(lambda x: 3 * x**2 + 2 * x + 1, 2.0), 14.0, name="derivative of 3x² + 2x + 1 at 2")


@pytest.mark.misconception("product-rule-tangent")
def test_products_and_quotients():
    """x·x·x and x / (1 + x²): the product and quotient rules."""
    assert_close(derivative(lambda x: x * x * x, 1.5), 3 * 1.5**2, name="derivative of x·x·x at 1.5")
    assert_close(derivative(lambda x: x / (1 + x * x), 0.5), (1 - 0.25) / (1.25**2), name="derivative of x / (1 + x²) at 0.5")


@pytest.mark.misconception("reflected-operators")
def test_numbers_on_the_left():
    """3 − x, 2 / x and 5·x with the number first."""
    try:
        assert_close(derivative(lambda x: 3 - x, 1.0), -1.0, name="derivative of 3 − x")
        assert_close(derivative(lambda x: 2 / x, 2.0), -0.5, name="derivative of 2 / x at 2")
        assert_close(derivative(lambda x: 5 * x + 1, 0.3), 5.0, name="derivative of 5x + 1")
    except TypeError as e:
        raise AssertionError(f"{e}: define __rsub__, __rtruediv__, __rmul__ and __radd__ for plain numbers on the left") from None


def test_compositions_through_the_chain_rule():
    """exp(sin(x)), log(x)·x and a negative power."""
    x0 = 1.0
    assert_close(derivative(lambda x: exp(sin(x)), x0), math.cos(x0) * math.exp(math.sin(x0)), rtol=1e-12, name="derivative of exp(sin(x)) at 1")
    assert_close(derivative(lambda x: log(x) * x, 2.0), math.log(2.0) + 1.0, rtol=1e-12, name="derivative of x·log(x) at 2")
    assert_close(derivative(lambda x: x**-2, 0.5), -2 * 0.5**-3, rtol=1e-12, name="derivative of x⁻² at 0.5")


def test_matches_a_central_difference():
    """A tangled function agrees with a numerical derivative."""
    f = lambda x: exp(-x * x / 2) * sin(3 * x) / (1 + x**2) - log(2 + sin(x))
    x0, h = 0.7, 1e-6
    num = (f(x0 + h) - f(x0 - h)) / (2 * h)  # plain floats go through the same functions
    assert_close(derivative(f, x0), num, rtol=1e-7, name="derivative of the tangled function at 0.7")


def test_plain_floats_still_work():
    """exp, sin and log accept plain numbers too."""
    assert_close(exp(0.0) + sin(0.0) + log(1.0), 1.0, name="exp(0) + sin(0) + log(1)")
    assert isinstance(Dual(1.0, 1.0) + 1, Dual), "Dual + number should give a Dual"
