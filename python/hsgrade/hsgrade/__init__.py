"""hsgrade: grading helpers for Hyperscale exercises (runs in Pyodide and CPython)."""

from .checks import (
    assert_close,
    assert_dtype_kind,
    assert_finite,
    assert_not_imported,
    assert_returns,
    assert_runtime_under,
    assert_shape,
    assert_vectorized,
)
from .runner import grade, prepare_workdir, run_grading

__all__ = [
    "assert_close",
    "assert_dtype_kind",
    "assert_finite",
    "assert_not_imported",
    "assert_returns",
    "assert_runtime_under",
    "assert_shape",
    "assert_vectorized",
    "grade",
    "prepare_workdir",
    "run_grading",
]
__version__ = "0.1.0"
