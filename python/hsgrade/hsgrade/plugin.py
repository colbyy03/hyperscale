"""pytest plugin that collects structured, JSON-serializable results for the app.

Tests can carry two markers:
- @pytest.mark.hidden: an edge-case test whose body the app doesn't show (the message is still shown);
- @pytest.mark.misconception("id"): links a failure to a known misconception (drafts a review card).
"""

from __future__ import annotations

from typing import Any

import pytest


def _message(report: pytest.TestReport) -> str:
    longrepr = report.longrepr
    crash = getattr(longrepr, "reprcrash", None)
    if crash is not None and getattr(crash, "message", None):
        msg = str(crash.message)
    else:
        msg = str(longrepr)
    # pytest prefixes assertion messages with "AssertionError: "; keep the learner-facing part.
    for prefix in ("AssertionError: ", "E   AssertionError: "):
        if msg.startswith(prefix):
            msg = msg[len(prefix) :]
    # Drop pytest's assertion-rewrite explanation lines after a custom message.
    return msg.split("\nassert ")[0].strip()


class Collector:
    def __init__(self) -> None:
        self.results: list[dict[str, Any]] = []
        self.collection_errors: list[str] = []
        self._meta: dict[str, dict[str, Any]] = {}

    def pytest_collection_modifyitems(self, items: list[pytest.Item]) -> None:
        for i, item in enumerate(items):
            mis = item.get_closest_marker("misconception")
            doc = getattr(getattr(item, "function", None), "__doc__", None)
            self._meta[item.nodeid] = {
                "order": i,
                "hidden": item.get_closest_marker("hidden") is not None,
                "misconception": mis.args[0] if mis and mis.args else None,
                "description": " ".join(doc.split()) if doc else None,
            }

    def pytest_collectreport(self, report: pytest.CollectReport) -> None:
        if report.failed:
            self.collection_errors.append(str(report.longrepr)[-2000:])

    def pytest_runtest_logreport(self, report: pytest.TestReport) -> None:
        relevant = report.when == "call" or (report.when == "setup" and report.outcome != "passed")
        if not relevant:
            return
        meta = self._meta.get(report.nodeid, {})
        name = report.nodeid.split("::")[-1]
        self.results.append(
            {
                "name": name,
                "outcome": report.outcome,  # passed | failed | skipped
                "message": None if report.passed else _message(report)[:1500],
                "seconds": round(report.duration, 4),
                **meta,
            }
        )


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line("markers", "hidden: edge-case test whose body is not shown to the learner")
    config.addinivalue_line("markers", "misconception(id): links a failure to a known misconception")
