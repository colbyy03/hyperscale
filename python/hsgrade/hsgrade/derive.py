"""Step-by-step derivations, graded by evaluating each step numerically (Pyodide and CPython).

A learner writes each step as an expression in NumPy syntax (`X.T @ (X @ w - y)`, `2 * A @ x`).
Each step is compared with a reference expression at several random draws of the variables,
which have declared shapes and kinds (general, symmetric, positive definite, positive). Two
expressions that agree at random points are, with overwhelming probability, the same function.
"""
from __future__ import annotations

import math
from typing import Any

import numpy as np

SAFE = {
    "np": np,
    "inv": np.linalg.inv,
    "trace": np.trace,
    "det": np.linalg.det,
    "exp": np.exp,
    "log": np.log,
    "sqrt": np.sqrt,
    "abs": np.abs,
    "sum": np.sum,
    "outer": np.outer,
    "eye": np.eye,
    "norm": np.linalg.norm,
    "pi": math.pi,
}


def _sample(spec: dict[str, Any], rng: np.random.Generator) -> Any:
    shape = tuple(spec.get("shape", []))
    kind = spec.get("kind", "general")
    if kind == "positive":
        return float(rng.uniform(0.5, 2.0)) if not shape else rng.uniform(0.5, 2.0, size=shape)
    if not shape:
        return float(rng.normal())
    if kind in ("symmetric", "spd"):
        if len(shape) != 2 or shape[0] != shape[1]:
            raise ValueError(f"a {kind} variable must be square, got shape {shape}")
        m = rng.normal(size=shape)
        return (m + m.T) / 2 if kind == "symmetric" else m @ m.T + shape[0] * np.eye(shape[0])
    if kind == "unit":
        v = rng.normal(size=shape)
        return v / np.linalg.norm(v)
    return rng.normal(size=shape)


def _evaluate(expr: str, env: dict[str, Any]) -> np.ndarray:
    value = eval(compile(expr, "<step>", "eval"), {"__builtins__": {}}, {**SAFE, **env})  # noqa: S307
    return np.asarray(value, dtype=float)


def _syntax_problem(expr: str) -> str | None:
    if "^" in expr:
        return "In Python, ^ isn't a power: write x ** 2 (and use @ for matrix products)."
    try:
        compile(expr, "<step>", "eval")
    except SyntaxError as e:
        return f"That isn't a valid expression ({e.msg}). Use NumPy syntax: @ for matrix products, .T for a transpose, ** for powers."
    return None


def check_step(answer: str, reference: str, variables: dict[str, dict[str, Any]], trials: int = 4, seed: int = 0) -> dict[str, Any]:
    """Compare one expression with a reference at `trials` random draws of the variables."""
    if not answer.strip():
        return {"ok": False, "message": "No answer yet."}
    problem = _syntax_problem(answer)
    if problem:
        return {"ok": False, "message": problem}
    rng = np.random.default_rng(seed)
    for _ in range(trials):
        env = {name: _sample(spec, rng) for name, spec in variables.items()}
        want = _evaluate(reference, env)
        try:
            got = _evaluate(answer, env)
        except NameError as e:
            names = ", ".join(sorted(variables))
            return {"ok": False, "message": f"{e}. Use the variables {names}, and np or the helpers inv, trace, outer, eye, exp, log, sqrt."}
        except ValueError as e:
            return {"ok": False, "message": f"NumPy couldn't evaluate it: {e}. Check the shapes on both sides of each @ and +."}
        except Exception as e:  # noqa: BLE001
            return {"ok": False, "message": f"Evaluating it failed: {type(e).__name__}: {e}"}
        if got.shape != want.shape:
            return {"ok": False, "message": f"Your expression has shape {got.shape}; this step should have shape {want.shape}."}
        if not np.allclose(got, want, rtol=1e-6, atol=1e-9):
            if np.allclose(got, -want, rtol=1e-6, atol=1e-9):
                return {"ok": False, "message": "Close: it's exactly the negative of the right expression. Check a sign."}
            if want.ndim == 2 and got.ndim == 2 and np.allclose(got, want.T, rtol=1e-6, atol=1e-9):
                return {"ok": False, "message": "Close: it's the transpose of the right expression."}
            if np.allclose(got, 2 * want, rtol=1e-6) or np.allclose(2 * got, want, rtol=1e-6):
                return {"ok": False, "message": "Close: it's off by a factor of 2."}
            return {"ok": False, "message": "Not equal to the expected expression (checked numerically at random values)."}
    return {"ok": True, "message": "Correct."}


def check(variables: dict[str, dict[str, Any]], steps: list[dict[str, Any]], responses: list[str], trials: int = 4, seed: int = 0) -> list[dict[str, Any]]:
    """Grade every step of a derivation; each result is {"ok": bool, "message": str}."""
    return [check_step(responses[i] if i < len(responses) else "", s["answer"], variables, trials, seed + i) for i, s in enumerate(steps)]
