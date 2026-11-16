"""Assertion helpers that turn raw test failures into diagnoses a learner can act on.

Every helper raises AssertionError with a message written for the learner, e.g.
"expected shape (100,), got (100, 1). Did you keep a column dimension? Try .ravel()."
"""

from __future__ import annotations

import ast
import inspect
import textwrap
import time
from types import ModuleType
from typing import Any, Callable, Iterable

import numpy as np

__all__ = [
    "assert_close",
    "assert_shape",
    "assert_dtype_kind",
    "assert_finite",
    "assert_vectorized",
    "assert_not_imported",
    "assert_runtime_under",
    "assert_returns",
]


def _fmt(x: Any, maxlen: int = 80) -> str:
    s = np.array2string(np.asarray(x), precision=6, threshold=8, edgeitems=3) if _is_arraylike(x) else repr(x)
    s = " ".join(s.split())
    return s if len(s) <= maxlen else s[: maxlen - 1] + "…"


def _is_arraylike(x: Any) -> bool:
    return isinstance(x, (np.ndarray, list, tuple)) or hasattr(x, "__array__")


def assert_returns(value: Any, name: str = "your function") -> None:
    if value is None:
        raise AssertionError(f"{name} returned None. Did you forget a `return` statement?")


def assert_shape(actual: Any, expected: tuple[int, ...], name: str = "result") -> None:
    assert_returns(actual, name)
    shape = tuple(np.shape(actual))
    expected = tuple(expected)
    if shape == expected:
        return
    hint = ""
    if len(shape) == len(expected) + 1 and shape[-1] == 1 and shape[:-1] == expected:
        hint = " You kept a trailing dimension of size 1; try .ravel() or index with [:, 0]."
    elif len(expected) == len(shape) + 1 and expected[-1] == 1 and expected[:-1] == shape:
        hint = " A column vector is expected; try .reshape(-1, 1) or [:, None]."
    elif shape == tuple(reversed(expected)) and len(shape) == 2:
        hint = " The axes are swapped. Check which axis you reduced over, or transpose."
    elif len(shape) < len(expected):
        hint = " Your result has fewer dimensions: did you reduce over an axis you needed to keep (try keepdims=True)?"
    elif len(shape) > len(expected):
        hint = " Your result has extra dimensions. Check for unintended broadcasting between (n,) and (n, 1)."
    raise AssertionError(f"{name}: expected shape {expected}, got {shape}.{hint}")


def assert_dtype_kind(actual: Any, kinds: str = "f", name: str = "result") -> None:
    """kinds: numpy dtype.kind codes, e.g. 'f' float, 'i' int, 'b' bool, 'fc' float or complex."""
    arr = np.asarray(actual)
    if arr.dtype.kind == "O":
        raise AssertionError(f"{name} has dtype object. Something produced a Python list of mixed types or arrays; build a numeric array instead.")
    if arr.dtype.kind not in kinds:
        names = {"f": "float", "i": "int", "u": "unsigned int", "b": "bool", "c": "complex"}
        want = " or ".join(names.get(k, k) for k in kinds)
        raise AssertionError(f"{name}: expected a {want} array, got dtype {arr.dtype}. Integer division or an int input array is a common cause.")


def assert_finite(actual: Any, name: str = "result") -> None:
    arr = np.asarray(actual, dtype=float)
    bad = ~np.isfinite(arr)
    if bad.any():
        idx = tuple(int(i) for i in np.argwhere(bad)[0])
        kind = "NaN" if np.isnan(arr[idx]) else "inf"
        raise AssertionError(
            f"{name} contains {kind} (first at index {idx if len(idx) > 1 else idx[0]}). "
            "Look for division by zero, log of zero or a negative number, or overflow in exp()."
        )


def assert_close(actual: Any, expected: Any, *, rtol: float = 1e-7, atol: float = 1e-9, name: str = "result") -> None:
    assert_returns(actual, name)
    exp = np.asarray(expected, dtype=float)
    try:
        act = np.asarray(actual, dtype=float)
    except (TypeError, ValueError) as e:
        raise AssertionError(f"{name} could not be converted to a numeric array ({e}). Return numbers, not strings or nested ragged lists.") from None
    assert_shape(act, exp.shape, name)
    exp_finite = np.isfinite(exp)
    if (~np.isfinite(act) & exp_finite).any():
        assert_finite(np.where(exp_finite, act, 0.0), name)
    with np.errstate(invalid="ignore"):
        ok = np.isclose(act, exp, rtol=rtol, atol=atol, equal_nan=True)
    if ok.all():
        return
    diff = np.where(ok, 0.0, np.abs(act - exp))
    worst = np.unravel_index(int(np.nanargmax(diff)), diff.shape) if diff.ndim else ()
    loc = f" at index {worst if len(worst) > 1 else worst[0]}" if worst else ""
    a = act[worst] if worst else act
    e = exp[worst] if worst else exp
    n_bad = int((~ok).sum())
    extra = ""
    if np.allclose(act, -exp, rtol=rtol, atol=atol):
        extra = " Every value has the wrong sign. Check the sign of a gradient or a subtraction order."
    elif exp.size > 1 and np.allclose(np.sort(act.ravel()), np.sort(exp.ravel()), rtol=rtol, atol=atol):
        extra = " The right values are there but in the wrong order. Check axis order or sorting."
    elif exp.size > 1 and np.std(act) > 0 and np.allclose(act / np.std(act), exp / np.std(exp), rtol=1e-4, atol=1e-6):
        extra = " Your values are a constant multiple of the expected ones. Check a scale factor (n vs n-1, a missing 1/2, a ddof)."
    raise AssertionError(f"{name}: {n_bad} of {exp.size} value(s) differ{loc}: got {_fmt(a)}, expected {_fmt(e)} (max error {float(np.nanmax(diff)):.3g}).{extra}")


def _loops_in(source: str) -> list[tuple[str, int]]:
    tree = ast.parse(textwrap.dedent(source))
    found: list[tuple[str, int]] = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.For, ast.AsyncFor)):
            found.append(("for loop", node.lineno))
        elif isinstance(node, ast.While):
            found.append(("while loop", node.lineno))
        elif isinstance(node, (ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp)):
            found.append(("comprehension", node.lineno))
    return found


def assert_vectorized(func: Callable[..., Any], allow_comprehensions: bool = False) -> None:
    """Fail if `func` contains Python-level loops (vectorization exercises)."""
    try:
        source = inspect.getsource(func)
    except (OSError, TypeError):
        return  # source unavailable (e.g. builtins); nothing to check
    loops = [(k, n) for k, n in _loops_in(source) if allow_comprehensions is False or k != "comprehension"]
    if loops:
        kind, line = loops[0]
        raise AssertionError(
            f"{func.__name__} uses a Python {kind} (line {line} of the function). "
            "This exercise is about vectorization: express it with whole-array operations, broadcasting or reductions."
        )


def _imported_modules(source: str) -> set[str]:
    mods: set[str] = set()
    for node in ast.walk(ast.parse(source)):
        if isinstance(node, ast.Import):
            mods.update(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            mods.add(node.module.split(".")[0])
    return mods


def assert_not_imported(module: ModuleType | str, forbidden: Iterable[str]) -> None:
    """Fail if the learner's module imports any forbidden package (from-scratch exercises)."""
    source = module if isinstance(module, str) else inspect.getsource(module)
    used = _imported_modules(source) & set(forbidden)
    if used:
        names = ", ".join(sorted(used))
        raise AssertionError(f"This is a from-scratch exercise, so {names} can't be used here. You'll compare against it in the next step.")


def assert_runtime_under(func: Callable[[], Any], seconds: float, label: str = "your function", repeats: int = 3) -> float:
    """Best-of-`repeats` wall time; fail if slower than `seconds`."""
    best = float("inf")
    for _ in range(repeats):
        t0 = time.perf_counter()
        func()
        best = min(best, time.perf_counter() - t0)
    if best > seconds:
        raise AssertionError(f"{label} took {best:.3f} s; it should take under {seconds:g} s. Look for Python loops over array elements.")
    return best
