import pytest
from hsgrade import grade

TESTS = '''
import numpy as np
import pytest
from hsgrade import assert_close
from solution import double

def test_basic():
    """Doubles a small array."""
    assert_close(double(np.array([1.0, 2.0])), [2.0, 4.0])

@pytest.mark.hidden
@pytest.mark.misconception("returns-list")
def test_returns_array():
    assert isinstance(double(np.array([1.0])), np.ndarray), "Return a NumPy array, not a list."
'''


def test_all_pass(tmp_path):
    r = grade("import numpy as np\ndef double(x):\n    return 2 * np.asarray(x)\n", TESTS, tmp_path)
    assert r["allPassed"] and r["passed"] == 2 and r["total"] == 2
    assert [t["name"] for t in r["tests"]] == ["test_basic", "test_returns_array"]
    assert r["tests"][0]["description"] == "Doubles a small array."
    assert r["tests"][1]["hidden"] is True


def test_failure_messages_and_markers(tmp_path):
    r = grade("def double(x):\n    return [2 * v for v in x]\n", TESTS, tmp_path)
    assert not r["allPassed"]
    failed = {t["name"]: t for t in r["tests"] if t["outcome"] == "failed"}
    assert "test_returns_array" in failed
    assert failed["test_returns_array"]["message"] == "Return a NumPy array, not a list."
    assert failed["test_returns_array"]["misconception"] == "returns-list"


def test_syntax_error_is_reported(tmp_path):
    r = grade("def double(x)\n    return x\n", TESTS, tmp_path)
    assert not r["allPassed"]
    assert r["collectionErrors"] and "SyntaxError" in r["collectionErrors"][0]


def test_fresh_module_each_run(tmp_path):
    wrong = grade("import numpy as np\ndef double(x):\n    return 3 * np.asarray(x)\n", TESTS, tmp_path)
    right = grade("import numpy as np\ndef double(x):\n    return 2 * np.asarray(x)\n", TESTS, tmp_path)
    assert not wrong["allPassed"] and right["allPassed"]


def test_same_length_edit_is_not_served_from_stale_bytecode(tmp_path):
    """Regression: re-checking a same-length edit within one second must grade the new code."""
    for _ in range(3):
        wrong = grade("import numpy as np\ndef double(x):\n    return 3 * np.asarray(x)\n", TESTS, tmp_path)
        right = grade("import numpy as np\ndef double(x):\n    return 2 * np.asarray(x)\n", TESTS, tmp_path)
        assert not wrong["allPassed"] and right["allPassed"]
    assert not (tmp_path / "__pycache__").exists() or not any((tmp_path / "__pycache__").iterdir())


def test_sql_solution_file_and_support_files(tmp_path):
    """SQL exercises write solution.sql plus data.py; the tests read both."""
    pytest.importorskip("duckdb")
    data = "import duckdb\n\ndef make_db():\n    con = duckdb.connect()\n    con.execute(\"CREATE TABLE t AS SELECT * FROM (VALUES (1, 2.0), (1, 4.0), (2, 5.0)) v(k, x)\")\n    return con\n"
    tests = (
        "from data import make_db\n"
        "from hsgrade.sql import run_learner, assert_columns, assert_rows\n\n"
        "def test_avg():\n"
        "    r = run_learner(make_db())\n"
        "    assert_columns(r, ['k', 'avg_x'])\n"
        "    assert_rows(r, [(1, 3.0), (2, 5.0)])\n"
    )
    good = grade("SELECT k, AVG(x) AS avg_x FROM t GROUP BY k", tests, tmp_path / "w", "solution.sql", {"data.py": data})
    assert good["allPassed"], good
    wrong = grade("SELECT k, SUM(x) AS avg_x FROM t GROUP BY k", tests, tmp_path / "w", "solution.sql", {"data.py": data})
    assert not wrong["allPassed"]
    assert "avg_x should be 3" in wrong["tests"][0]["message"]
    broken = grade("SELEC k FROM t", tests, tmp_path / "w", "solution.sql", {"data.py": data})
    assert "DuckDB couldn't run your query" in broken["tests"][0]["message"]
