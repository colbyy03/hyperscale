/** Messages between the app and the Python (Pyodide) worker. */

export const PYODIDE_VERSION = "314.0.7";
export const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export interface RunResult {
  stdout: string;
  stderr: string;
  /** repr() of the last expression, when it isn't None. */
  value: string | null;
  error: string | null;
  seconds: number;
}

export interface TestResult {
  name: string;
  outcome: "passed" | "failed" | "skipped";
  message: string | null;
  seconds: number;
  hidden?: boolean;
  misconception?: string | null;
  description?: string | null;
}

export interface GradeResult {
  exitCode: number;
  passed: number;
  total: number;
  allPassed: boolean;
  tests: TestResult[];
  collectionErrors: string[];
  output: string;
  seconds: number;
}

export type WorkerRequest =
  | { id: number; type: "init"; mode?: "grader" | "sim" }
  | { id: number; type: "sim"; request: string }
  | { id: number; type: "load"; packages: string[]; code: string }
  | { id: number; type: "run"; code: string; packages: string[] }
  | { id: number; type: "grade"; solution: string; tests: string; packages: string[] };

export type WorkerResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: string }
  | { id: 0; status: string };
