import solution


def test_table_driven_cases():
    """The test is parametrized, and every case in its table passes."""
    test = getattr(solution, "test_pue_examples", None)
    assert test is not None, "define test_pue_examples"
    marks = [m for m in getattr(test, "pytestmark", []) if m.name == "parametrize"]
    assert marks, "decorate test_pue_examples with @pytest.mark.parametrize"
    for case in marks[0].args[1]:
        try:
            test(*case)
        except AssertionError:
            raise AssertionError(f"the case {case} fails: 0.3 / 0.1 is 2.9999999999999996 in floating point, so compare with pytest.approx.") from None
