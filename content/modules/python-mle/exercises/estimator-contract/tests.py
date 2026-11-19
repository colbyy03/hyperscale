import numpy as np
import pytest
from hsgrade import assert_close
from sklearn.base import clone
from sklearn.exceptions import NotFittedError
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import make_pipeline

from solution import MedianScaler

RNG = np.random.default_rng(2)
X = np.column_stack([RNG.normal(24.0, 1.0, 200), RNG.normal(3500.0, 400.0, 200), np.full(200, 21.5)])
X[::25, 0] = 80.0  # spikes: the median and IQR shrug them off


@pytest.mark.misconception("init-does-work")
def test_init_only_stores_parameters():
    """Parameters come back from get_params exactly as given, and clone works."""
    qr = (10.0, 90.0)
    est = MedianScaler(with_centering=False, quantile_range=qr)
    params = est.get_params()
    assert params == {"with_centering": False, "quantile_range": qr} and params["quantile_range"] is qr, (
        f"get_params() should return the constructor arguments exactly as given, got {params}. "
        "__init__ must store each argument unchanged (no conversion, no validation), or clone() and grid search break."
    )
    try:
        twin = clone(est)
    except RuntimeError as e:
        raise AssertionError(f"clone() failed: {e} __init__ must store each argument unchanged (no conversion, no validation).") from None
    assert twin.get_params() == params


@pytest.mark.misconception("fit-returns-self")
def test_fit_returns_self_and_learns_underscore_attributes():
    """fit returns the estimator itself and sets center_ and scale_."""
    est = MedianScaler()
    out = est.fit(X)
    assert out is est, "fit() should return self, so est.fit(X).transform(X) works"
    for name in ("center_", "scale_"):
        assert hasattr(est, name), f"after fit, the estimator should have a learned attribute {name}"


def test_learned_values():
    """center_ is the column median; scale_ is the IQR, with 1.0 for a constant column."""
    est = MedianScaler().fit(X)
    assert_close(est.center_, np.median(X, axis=0), name="center_")
    q75, q25 = np.percentile(X, [75, 25], axis=0)
    expected = np.where(q75 - q25 == 0, 1.0, q75 - q25)
    assert_close(est.scale_, expected, name="scale_ (a constant column needs 1.0, not 0)")


def test_transform_and_fit_transform():
    """transform scales new data with what fit learned; fit_transform comes from TransformerMixin."""
    est = MedianScaler(quantile_range=(10.0, 90.0)).fit(X)
    lo, hi = np.percentile(X, [10, 90], axis=0)
    expected = (X - np.median(X, axis=0)) / np.where(hi - lo == 0, 1.0, hi - lo)
    assert_close(est.transform(X), expected, name="transform(X) with quantile_range=(10, 90)")
    assert_close(MedianScaler().fit_transform(X), MedianScaler().fit(X).transform(X), name="fit_transform(X)")


def test_transform_before_fit_raises():
    """Calling transform on an unfitted scaler raises NotFittedError."""
    with pytest.raises(NotFittedError):
        MedianScaler().transform(X)


def test_no_centering_option():
    """with_centering=False only scales."""
    est = MedianScaler(with_centering=False).fit(X)
    assert_close(est.center_, np.zeros(3), name="center_ with with_centering=False")


def test_works_inside_a_pipeline():
    """A Pipeline can fit, clone and use it."""
    y = 0.002 * X[:, 1] + RNG.normal(0, 0.1, 200)
    pipe = make_pipeline(MedianScaler(), LinearRegression())
    pipe.fit(X, y)
    assert clone(pipe).get_params()["medianscaler__quantile_range"] == (25.0, 75.0)
    assert pipe.score(X, y) > 0.5


@pytest.mark.hidden
def test_unfitted_clone_is_unfitted():
    """clone gives a fresh, unfitted copy."""
    fitted = MedianScaler().fit(X)
    with pytest.raises(NotFittedError):
        clone(fitted).transform(X)
