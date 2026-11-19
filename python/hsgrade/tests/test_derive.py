from hsgrade.derive import check, check_step

VARS = {"X": {"shape": [6, 3]}, "w": {"shape": [3]}, "y": {"shape": [6]}, "A": {"shape": [3, 3]}, "S": {"shape": [3, 3], "kind": "spd"}, "lam": {"kind": "positive"}}


def test_equivalent_forms_pass():
    """Algebraically equal expressions pass, whatever their form."""
    ref = "X.T @ (X @ w - y)"
    for answer in ["X.T @ X @ w - X.T @ y", "(X @ w - y) @ X", "X.T.dot(X @ w) - X.T.dot(y)"]:
        assert check_step(answer, ref, VARS)["ok"], answer


def test_common_mistakes_get_specific_messages():
    """Sign, transpose, factor-of-2 and shape mistakes are named."""
    assert "negative" in check_step("X.T @ (y - X @ w)", "X.T @ (X @ w - y)", VARS)["message"]
    assert "transpose" in check_step("A.T", "A", VARS)["message"]
    assert "factor of 2" in check_step("2 * X.T @ (X @ w - y)", "X.T @ (X @ w - y)", VARS)["message"]
    shape = check_step("X @ w - y", "X.T @ (X @ w - y)", VARS)["message"]
    assert "shape (6,)" in shape and "(3,)" in shape


def test_syntax_and_names():
    """Helpful messages for ^, syntax errors, unknown names and shape errors."""
    assert "**" in check_step("w ^ 2", "w ** 2", VARS)["message"]
    assert "valid expression" in check_step("X.T @ (", "X.T", VARS)["message"]
    assert "Use the variables" in check_step("Z @ w", "X @ w", VARS)["message"]
    assert "couldn't evaluate" in check_step("X @ y", "X.T @ y", VARS)["message"]
    assert check_step("", "X", VARS)["message"] == "No answer yet."


def test_spd_and_symmetric_kinds():
    """A symmetric variable makes A.T @ x equal to A @ x; a general one doesn't."""
    sym = {"A": {"shape": [3, 3], "kind": "symmetric"}, "x": {"shape": [3]}}
    assert check_step("A.T @ x", "A @ x", sym)["ok"]
    assert not check_step("A.T @ x", "A @ x", {"A": {"shape": [3, 3]}, "x": {"shape": [3]}})["ok"]
    assert check_step("inv(S + lam * eye(3)) @ (S @ w)", "np.linalg.solve(S + lam * np.eye(3), S @ w)", VARS)["ok"]


def test_check_grades_every_step():
    """One result per step, in order."""
    steps = [{"answer": "X @ w - y"}, {"answer": "X.T @ (X @ w - y)"}]
    out = check(VARS, steps, ["X @ w - y", "nonsense +"])
    assert [r["ok"] for r in out] == [True, False]
