"""Grade one exercise: run its pytest file against the learner's `solution.py`.

The same function runs inside Pyodide (the app) and in CPython (CI and local checks),
so a test that passes on your laptop passes in the browser.
"""

from __future__ import annotations

import importlib
import io
import os
import shutil
import sys
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from typing import Any

LEARNER_MODULES = ("solution", "test_exercise", "data")


def _forget_learner_modules() -> None:
    for name in list(sys.modules):
        if name in LEARNER_MODULES or name.startswith("test_exercise"):
            del sys.modules[name]


def prepare_workdir(
    workdir: str | os.PathLike[str],
    solution_code: str,
    tests_code: str,
    solution_file: str = "solution.py",
    extra_files: dict[str, str] | None = None,
) -> Path:
    """Write the learner's code, the tests and any support files (data.py, CSVs) into a fresh folder.

    `solution_file` is "solution.py" for Python exercises and "solution.sql" for SQL ones.
    Cached bytecode is removed: Python validates .pyc files by source mtime (whole seconds) and size,
    so an edit that keeps the file length (say 2*x -> 3*x) re-checked within the same second would
    otherwise import the *previous* code.
    """
    wd = Path(workdir)
    wd.mkdir(parents=True, exist_ok=True)
    for stale in wd.iterdir():
        if stale.is_file():
            stale.unlink()
    shutil.rmtree(wd / "__pycache__", ignore_errors=True)
    (wd / solution_file).write_text(solution_code)
    (wd / "test_exercise.py").write_text(tests_code)
    for name, content in (extra_files or {}).items():
        if "/" in name or name in (solution_file, "test_exercise.py"):
            raise ValueError(f"bad support file name {name!r}")
        (wd / name).write_text(content)
    importlib.invalidate_caches()
    return wd


def run_grading(workdir: str | os.PathLike[str]) -> dict[str, Any]:
    """Run test_exercise.py in `workdir` and return structured results (JSON-serializable)."""
    import pytest

    from .plugin import Collector

    wd = Path(workdir).resolve()
    _forget_learner_modules()
    importlib.invalidate_caches()
    # Never write bytecode for learner or test files (see prepare_workdir); pytest honours this too.
    old_dont_write = sys.dont_write_bytecode
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(wd))
    old_cwd = os.getcwd()
    os.chdir(wd)
    collector = Collector()
    out, err = io.StringIO(), io.StringIO()
    try:
        with redirect_stdout(out), redirect_stderr(err):
            code = pytest.main(
                ["-q", "-p", "no:cacheprovider", "-p", "hsgrade.plugin", "--tb=short", "-W", "ignore::DeprecationWarning", "test_exercise.py"],
                plugins=[collector],
            )
    finally:
        sys.dont_write_bytecode = old_dont_write
        os.chdir(old_cwd)
        try:
            sys.path.remove(str(wd))
        except ValueError:
            pass
        _forget_learner_modules()

    tests = sorted(collector.results, key=lambda r: r.get("order", 0))
    passed = sum(1 for t in tests if t["outcome"] == "passed")
    return {
        "exitCode": int(code),
        "passed": passed,
        "total": len(tests),
        "allPassed": bool(tests) and passed == len(tests) and not collector.collection_errors,
        "tests": tests,
        "collectionErrors": collector.collection_errors,
        "output": out.getvalue()[-4000:],
    }


def grade(
    solution_code: str,
    tests_code: str,
    workdir: str | os.PathLike[str] = "/tmp/hsgrade-work",
    solution_file: str = "solution.py",
    extra_files: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Convenience: prepare the folder and run the tests."""
    return run_grading(prepare_workdir(workdir, solution_code, tests_code, solution_file, extra_files))
