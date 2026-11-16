"""Grade one exercise: run its pytest file against the learner's `solution.py`.

The same function runs inside Pyodide (the app) and in CPython (CI and local checks),
so a test that passes on your laptop passes in the browser.
"""

from __future__ import annotations

import io
import os
import sys
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from typing import Any

LEARNER_MODULES = ("solution", "test_exercise")


def _forget_learner_modules() -> None:
    for name in list(sys.modules):
        if name in LEARNER_MODULES or name.startswith("test_exercise"):
            del sys.modules[name]


def prepare_workdir(workdir: str | os.PathLike[str], solution_code: str, tests_code: str) -> Path:
    """Write the learner's code and the tests into a fresh folder."""
    wd = Path(workdir)
    wd.mkdir(parents=True, exist_ok=True)
    for stale in wd.glob("*.py"):
        stale.unlink()
    (wd / "solution.py").write_text(solution_code)
    (wd / "test_exercise.py").write_text(tests_code)
    return wd


def run_grading(workdir: str | os.PathLike[str]) -> dict[str, Any]:
    """Run test_exercise.py in `workdir` and return structured results (JSON-serializable)."""
    import pytest

    from .plugin import Collector

    wd = Path(workdir).resolve()
    _forget_learner_modules()
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


def grade(solution_code: str, tests_code: str, workdir: str | os.PathLike[str] = "/tmp/hsgrade-work") -> dict[str, Any]:
    """Convenience: prepare the folder and run the tests."""
    return run_grading(prepare_workdir(workdir, solution_code, tests_code))
