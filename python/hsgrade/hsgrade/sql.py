"""Helpers for SQL exercises graded against DuckDB (in Pyodide and in CPython).

An SQL exercise folder holds `data.py` (a `make_db()` that builds the tables), the learner's
`solution.sql`, and pytest tests that call these helpers:

    from data import make_db
    from hsgrade.sql import run_learner, assert_columns, assert_rows

    def test_daily_pue():
        result = run_learner(make_db())
        assert_columns(result, ["day", "pue"])
        assert_rows(result, [("2026-07-01", 1.21), ...])
"""
from __future__ import annotations

import datetime as _dt
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Sequence


@dataclass
class Result:
    columns: list[str]
    rows: list[tuple[Any, ...]]

    def column(self, name: str) -> list[Any]:
        if name not in self.columns:
            raise AssertionError(f"Your result has no column {name!r}; it has {self.columns}.")
        i = self.columns.index(name)
        return [r[i] for r in self.rows]


def learner_sql(path: str = "solution.sql") -> str:
    text = Path(path).read_text()
    code = re.sub(r"--[^\n]*", "", text)
    code = re.sub(r"/\*.*?\*/", "", code, flags=re.S)
    if not code.strip():
        raise AssertionError("Your query is empty. Write a SELECT statement.")
    return text


def run(con: Any, sql: str) -> Result:
    import duckdb

    try:
        cur = con.execute(sql)
    except duckdb.Error as e:  # syntax errors, unknown columns, type errors
        msg = str(e).strip().splitlines()
        raise AssertionError("DuckDB couldn't run your query:\n" + "\n".join(msg[:6])) from None
    if cur.description is None:
        raise AssertionError("Your SQL didn't return any rows. Finish with a SELECT statement.")
    return Result([d[0] for d in cur.description], [tuple(r) for r in cur.fetchall()])


def run_learner(con: Any, path: str = "solution.sql") -> Result:
    return run(con, learner_sql(path))


def assert_columns(result: Result, expected: Sequence[str]) -> None:
    got = list(result.columns)
    want = list(expected)
    if got == want:
        return
    missing = [c for c in want if c not in got]
    extra = [c for c in got if c not in want]
    if missing or extra:
        parts = []
        if missing:
            parts.append(f"missing {missing}")
        if extra:
            parts.append(f"unexpected {extra}")
        raise AssertionError(f"Columns should be {want}; yours are {got} ({'; '.join(parts)}). Name columns with AS.")
    raise AssertionError(f"Columns should be in the order {want}; yours are {got}.")


def _norm(v: Any) -> Any:
    if isinstance(v, (_dt.datetime, _dt.date)):
        return v.isoformat(sep=" ") if isinstance(v, _dt.datetime) else v.isoformat()
    if hasattr(v, "item") and not isinstance(v, (str, bytes)):
        try:
            return v.item()
        except Exception:  # noqa: BLE001
            return v
    if type(v).__name__ == "Decimal":
        return float(v)
    return v


def _same(a: Any, b: Any, rtol: float, atol: float) -> bool:
    a, b = _norm(a), _norm(b)
    if a is None or b is None:
        return a is None and b is None
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool) and not isinstance(b, bool):
        if isinstance(a, float) and math.isnan(a):
            return isinstance(b, float) and math.isnan(b)
        return math.isclose(float(a), float(b), rel_tol=rtol, abs_tol=atol)
    return str(a) == str(b)


def _sort_key(row: Iterable[Any]) -> list[tuple[int, Any]]:
    out = []
    for v in row:
        v = _norm(v)
        if v is None:
            out.append((2, 0))
        elif isinstance(v, (int, float)) and not isinstance(v, bool):
            out.append((0, float(v)))
        else:
            out.append((1, str(v)))
    return out


def _fmt_row(columns: Sequence[str], row: Sequence[Any]) -> str:
    return ", ".join(f"{c}={_fmt_val(v)}" for c, v in zip(columns, row))


def _fmt_val(v: Any) -> str:
    v = _norm(v)
    if isinstance(v, float):
        return f"{v:.6g}"
    return repr(v)


def assert_rows(result: Result, expected: Sequence[Sequence[Any]], *, ordered: bool = False, rtol: float = 1e-6, atol: float = 1e-9, hint_too_many: str = "", hint_too_few: str = "") -> None:
    """Compare rows (as sets unless `ordered`), with a tolerance for floats."""
    got = [tuple(r) for r in result.rows]
    want = [tuple(r) for r in expected]
    if len(got) != len(want):
        hint = hint_too_many if len(got) > len(want) else hint_too_few
        raise AssertionError(f"Expected {len(want)} rows, got {len(got)}.{(' ' + hint) if hint else ''}")
    if not ordered:
        got = sorted(got, key=_sort_key)
        want = sorted(want, key=_sort_key)
    for i, (g, w) in enumerate(zip(got, want)):
        if len(g) != len(w):
            raise AssertionError(f"Rows should have {len(w)} values; yours have {len(g)}.")
        for j, (a, b) in enumerate(zip(g, w)):
            if not _same(a, b, rtol, atol):
                col = result.columns[j] if j < len(result.columns) else f"column {j + 1}"
                where = f"row {i + 1}" if ordered else f"the row ({_fmt_row(result.columns[:1], w[:1])}…)" if result.columns else f"row {i + 1}"
                raise AssertionError(f"In {where}, {col} should be {_fmt_val(b)}, got {_fmt_val(a)}.\nYour row:     {_fmt_row(result.columns, g)}\nExpected row: {_fmt_row(result.columns, w)}")


def preview(result: Result, limit: int = 20) -> str:
    """An aligned text table of the first rows, for the Run button."""
    rows = [[_fmt_val(v) if not isinstance(_norm(v), str) else str(_norm(v)) for v in r] for r in result.rows[:limit]]
    head = list(result.columns)
    widths = [max([len(h)] + [len(r[i]) for r in rows]) for i, h in enumerate(head)]
    line = lambda cells: "  ".join(c.ljust(w) for c, w in zip(cells, widths))  # noqa: E731
    out = [line(head), line(["-" * w for w in widths])] + [line(r) for r in rows]
    if len(result.rows) > limit:
        out.append(f"… {len(result.rows) - limit} more rows ({len(result.rows)} in total)")
    else:
        out.append(f"({len(result.rows)} row{'s' if len(result.rows) != 1 else ''})")
    return "\n".join(out)
