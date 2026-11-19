/// <reference lib="webworker" />
/**
 * Python runtime worker: Pyodide (CPython 3.14 in WebAssembly) plus the hsgrade grader.
 * Runs learner code and pytest-based grading off the UI thread.
 */
import type { PyodideAPI } from "pyodide";
import hsInit from "../../python/hsgrade/hsgrade/__init__.py?raw";
import hsChecks from "../../python/hsgrade/hsgrade/checks.py?raw";
import hsPlugin from "../../python/hsgrade/hsgrade/plugin.py?raw";
import hsRunner from "../../python/hsgrade/hsgrade/runner.py?raw";
import hsSql from "../../python/hsgrade/hsgrade/sql.py?raw";
import hsDerive from "../../python/hsgrade/hsgrade/derive.py?raw";
import { PYODIDE_URL, type GradeResult, type RunResult, type WorkerRequest, type WorkerResponse } from "./protocol";

// The data-hall simulator package (pure Python, no NumPy).
const simFiles = import.meta.glob<string>("../../python/sim/hyperscale_sim/*.py", { query: "?raw", import: "default", eager: true });

declare const self: DedicatedWorkerGlobalScope;

let pyodide: PyodideAPI | null = null;
let ready: Promise<void> | null = null;
const loaded = new Set<string>();

/** Load order matters (e.g. scikit-learn must be importable before xgboost's sklearn wrapper is imported). */
const ORDER = ["numpy", "scipy", "pandas", "scikit-learn", "statsmodels", "xgboost", "lightgbm", "matplotlib", "sympy", "polars", "duckdb", "pytest"];

function status(message: string) {
  self.postMessage({ id: 0, status: message } satisfies WorkerResponse);
}

async function init(mode: "grader" | "sim"): Promise<void> {
  status("Starting Python…");
  const mod = (await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`)) as { loadPyodide: (opts: { indexURL: string }) => Promise<PyodideAPI> };
  const py = await mod.loadPyodide({ indexURL: PYODIDE_URL });
  py.FS.mkdirTree("/hs/lib/hsgrade");
  py.FS.mkdirTree("/hs/lib/hyperscale_sim");
  py.FS.mkdirTree("/hs/work");
  for (const [path, source] of Object.entries(simFiles)) py.FS.writeFile(`/hs/lib/hyperscale_sim/${path.split("/").pop()}`, source);
  if (mode === "sim") {
    // The simulator needs only the standard library, so it starts without any package download.
    py.runPython("import sys\nsys.path.insert(0, '/hs/lib')\nimport hyperscale_sim.bridge");
    pyodide = py;
    status("Python ready");
    return;
  }
  status("Loading NumPy and pytest…");
  await py.loadPackage(["numpy", "pytest"]);
  for (const p of ["numpy", "pytest"]) loaded.add(p);
  py.FS.writeFile("/hs/lib/hsgrade/__init__.py", hsInit);
  py.FS.writeFile("/hs/lib/hsgrade/checks.py", hsChecks);
  py.FS.writeFile("/hs/lib/hsgrade/plugin.py", hsPlugin);
  py.FS.writeFile("/hs/lib/hsgrade/runner.py", hsRunner);
  py.FS.writeFile("/hs/lib/hsgrade/sql.py", hsSql);
  py.FS.writeFile("/hs/lib/hsgrade/derive.py", hsDerive);
  // Pre-import so the first grade is fast.
  py.runPython("import sys\nsys.path.insert(0, '/hs/lib')\nimport numpy, pytest, hsgrade");
  pyodide = py;
  status("Python ready");
}

function sim(request: string): string {
  const py = pyodide!;
  py.globals.set("_hs_sim_request", request);
  return py.runPython("import hyperscale_sim.bridge as _b\n_b.handle_json(_hs_sim_request)") as string;
}

async function ensurePackages(packages: string[], code?: string): Promise<void> {
  const py = pyodide!;
  const rank = (p: string) => (ORDER.includes(p) ? ORDER.indexOf(p) : ORDER.length);
  const want = packages.filter((p) => !loaded.has(p)).sort((a, b) => rank(a) - rank(b));
  for (const p of want) {
    status(`Loading ${p}…`);
    await py.loadPackage(p);
    loaded.add(p);
  }
  if (code) {
    // Also load anything the code imports that ships with Pyodide (e.g. pandas in a scratch run).
    await py.loadPackagesFromImports(code, { messageCallback: () => {}, errorCallback: () => {} });
  }
}

async function run(code: string, packages: string[]): Promise<RunResult> {
  const py = pyodide!;
  await ensurePackages(packages, code);
  const out: string[] = [];
  const err: string[] = [];
  py.setStdout({ batched: (s: string) => out.push(s) });
  py.setStderr({ batched: (s: string) => err.push(s) });
  const t0 = performance.now();
  const globals = py.toPy({ __name__: "__main__" });
  try {
    const value = await py.runPythonAsync(code, { globals, filename: "solution.py" });
    let repr: string | null = null;
    if (value !== undefined && value !== null) {
      const reprFn = py.globals.get("repr");
      repr = String(reprFn(value));
      reprFn.destroy?.();
    }
    (value as { destroy?: () => void } | undefined)?.destroy?.();
    return { stdout: out.join("\n"), stderr: err.join("\n"), value: repr, error: null, seconds: (performance.now() - t0) / 1000 };
  } catch (e) {
    return { stdout: out.join("\n"), stderr: err.join("\n"), value: null, error: cleanTraceback(String((e as Error).message ?? e)), seconds: (performance.now() - t0) / 1000 };
  } finally {
    globals.destroy();
    py.setStdout({});
    py.setStderr({});
  }
}

/** Drop Pyodide-internal frames so tracebacks point at the learner's code. */
function cleanTraceback(tb: string): string {
  const lines = tb.split("\n");
  const keep: string[] = [];
  let skipping = false;
  for (const line of lines) {
    if (/File "\/lib\/python3\d+\.zip\/_pyodide|File "<exec>"|_pyodide\/_base\.py/.test(line)) {
      skipping = true;
      continue;
    }
    if (skipping && /^\s{4}/.test(line)) continue;
    skipping = false;
    keep.push(line);
  }
  return keep.join("\n").trim();
}

async function grade(solution: string, tests: string, packages: string[], solutionFile = "solution.py", extraFiles: Record<string, string> = {}): Promise<GradeResult> {
  const py = pyodide!;
  await ensurePackages(["pytest", ...packages], `${solution}\n${tests}\n${Object.values(extraFiles).join("\n")}`);
  const t0 = performance.now();
  py.globals.set("_hs_solution", solution);
  py.globals.set("_hs_tests", tests);
  py.globals.set("_hs_file", solutionFile);
  py.globals.set("_hs_extra", JSON.stringify(extraFiles));
  const json = py.runPython("import json, hsgrade\njson.dumps(hsgrade.grade(_hs_solution, _hs_tests, '/hs/work', _hs_file, json.loads(_hs_extra)))") as string;
  const result = JSON.parse(json) as Omit<GradeResult, "seconds">;
  return { ...result, seconds: (performance.now() - t0) / 1000 };
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    ready ??= init(req.type === "init" ? (req.mode ?? "grader") : "grader");
    await ready;
    let result: unknown;
    if (req.type === "init") result = true;
    else if (req.type === "sim") result = sim(req.request);
    else if (req.type === "load") result = await ensurePackages(req.packages, req.code);
    else if (req.type === "run") result = await run(req.code, req.packages);
    else result = await grade(req.solution, req.tests, req.packages, req.solutionFile, req.extraFiles);
    self.postMessage({ id: req.id, ok: true, result } satisfies WorkerResponse);
  } catch (e) {
    self.postMessage({ id: req.id, ok: false, error: String((e as Error)?.message ?? e) } satisfies WorkerResponse);
  }
};
