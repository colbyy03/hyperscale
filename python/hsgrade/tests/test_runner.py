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
