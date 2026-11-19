import numpy as np
import pytest

from solution import bootstrap_means

X = np.random.default_rng(9).normal(24.0, 1.5, 300)


@pytest.mark.misconception("mutable-default")
def test_same_length_every_call():
    """Every call returns n_boot means, however many calls came before."""
    first = bootstrap_means(X, n_boot=50, seed=1)
    second = bootstrap_means(X, n_boot=50, seed=1)
    assert len(first) == 50, f"the first call should return 50 means, got {len(first)}"
    assert len(second) == 50, (
        f"the second call returned {len(second)} means. The default list `means=[]` is created once, when the function is "
        "defined, and shared by every call, so results pile up. Create the list inside the function (or drop the parameter)."
    )


def test_reproducible_for_a_seed():
    """The same seed gives the same means; a different seed gives different ones."""
    a = bootstrap_means(X, n_boot=100, seed=7)
    b = bootstrap_means(X, n_boot=100, seed=7)
    c = bootstrap_means(X, n_boot=100, seed=8)
    assert np.array_equal(a, b), "the same seed should give exactly the same means every time"
    assert not np.array_equal(a, c), "a different seed should give different means"


@pytest.mark.misconception("global-seed")
def test_leaves_the_global_generator_alone():
    """Calling it doesn't change the random numbers the rest of the program draws."""
    np.random.seed(123)
    expected = np.random.random(3)
    np.random.seed(123)
    bootstrap_means(X, n_boot=20, seed=0)
    got = np.random.random(3)
    assert np.array_equal(got, expected), (
        "your function changed NumPy's global random generator, so code elsewhere now gets different 'random' numbers. "
        "Use a private generator: rng = np.random.default_rng(seed)."
    )


def test_means_are_plausible():
    """Bootstrap means centre on the sample mean, with spread near σ/√n."""
    m = bootstrap_means(X, n_boot=400, seed=3)
    se = X.std() / np.sqrt(len(X))
    assert abs(m.mean() - X.mean()) < 0.5 * se, f"the bootstrap means should average close to {X.mean():.3f}, got {m.mean():.3f}"
    assert 0.7 * se < m.std() < 1.3 * se, f"their spread should be near the standard error {se:.3f}, got {m.std():.3f}"


@pytest.mark.hidden
def test_accepts_a_list():
    """A plain list works too."""
    assert len(bootstrap_means([20.0, 21.0, 22.0, 23.0], n_boot=10, seed=0)) == 10
