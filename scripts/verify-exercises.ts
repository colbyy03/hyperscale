/**
 * Verifies every graded exercise in the same engine the browser uses (Pyodide, here on Node):
 *   1. the reference solution passes every test;
 *   2. the starter code fails at least one test (so no test passes trivially);
 *   3. every known-wrong variant in variants/ fails, and some failure message contains the text
 *      named on its first line ("# expect: <text>" in Python, "-- expect: <text>" in SQL);
 *   4. Parsons problems with tests: the reference order passes and a scrambled order fails.
 *
 *   npm run verify:exercises            # all exercises
 *   npm run verify:exercises -- <filter> # ids containing <filter>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPyodide, type PyodideAPI } from "pyodide";
import { buildContentIndex } from "./content-index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filter = process.argv.slice(2).find((a) => !a.startsWith("-"));
const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/";

interface Grade {
  allPassed: boolean;
  passed: number;
  total: number;
  tests: Array<{ name: string; outcome: string; message: string | null }>;
  collectionErrors: string[];
}

async function setup(): Promise<PyodideAPI> {
  // Cache downloaded wheels under node_modules (otherwise Pyodide on Node writes them to a folder named after the URL).
  const packageCacheDir = path.join(root, "node_modules", ".cache", "pyodide");
  fs.mkdirSync(packageCacheDir, { recursive: true });
  const py = await loadPyodide({ packageBaseUrl: PYODIDE_CDN, packageCacheDir } as Parameters<typeof loadPyodide>[0]);
  await py.loadPackage(["numpy", "pytest"], { messageCallback: () => {} });
  py.FS.mkdirTree("/hs/lib/hsgrade");
  py.FS.mkdirTree("/hs/work");
  const libDir = path.join(root, "python", "hsgrade", "hsgrade");
  for (const f of fs.readdirSync(libDir).filter((x) => x.endsWith(".py"))) {
    py.FS.writeFile(`/hs/lib/hsgrade/${f}`, fs.readFileSync(path.join(libDir, f), "utf8"));
  }
  py.runPython("import sys\nsys.path.insert(0, '/hs/lib')\nimport hsgrade");
  return py;
}

function grade(py: PyodideAPI, solution: string, tests: string, solutionFile = "solution.py", extra: Record<string, string> = {}): Grade {
  py.globals.set("_s", solution);
  py.globals.set("_t", tests);
  py.globals.set("_f", solutionFile);
  py.globals.set("_x", JSON.stringify(extra));
  return JSON.parse(py.runPython("import json, hsgrade\njson.dumps(hsgrade.grade(_s, _t, '/hs/work', _f, json.loads(_x)))") as string) as Grade;
}

const STANDARD = new Set(["exercise.json", "starter.py", "starter.sql", "solution.py", "solution.sql", "tests.py"]);
const supportFiles = (files: string[]) => files.filter((f) => /\.(py|sql|csv|json)$/.test(f) && !STANDARD.has(f));

function failureText(g: Grade): string {
  return [...g.collectionErrors, ...g.tests.filter((t) => t.outcome !== "passed").map((t) => t.message ?? "")].join("\n");
}

async function main() {
  const { index, errors } = buildContentIndex(root);
  if (errors.length) {
    console.error("content has errors; run npm run validate first");
    process.exit(1);
  }
  const graded = (e: (typeof index.exercises)[number]) =>
    (e.language === "python" && ["code", "fill-in", "debug"].includes(e.type)) || e.type === "sql" || (e.type === "parsons" && e.files.includes("tests.py"));
  const exercises = index.exercises.filter((e) => graded(e) && (!filter || e.id.includes(filter)));
  if (!exercises.length) {
    console.log("no graded exercises to verify");
    return;
  }
  const t0 = Date.now();
  const py = await setup();
  console.log(`Pyodide ready in ${((Date.now() - t0) / 1000).toFixed(1)} s; verifying ${exercises.length} exercise(s)`);
  const problems: string[] = [];

  for (const ex of exercises) {
    const dir = path.join(root, ex.dir.replace(/^\//, ""));
    if (ex.packages.length) await py.loadPackage(ex.packages, { messageCallback: () => {} });
    const read = (f: string) => fs.readFileSync(path.join(dir, f), "utf8");
    const tests = read("tests.py");
    const extra = Object.fromEntries(supportFiles(ex.files).map((f) => [f, read(f)]));
    const lines: string[] = [];

    if (ex.type === "parsons") {
      const ordered = ex.parsons!.lines.join("\n") + "\n";
      const sol = grade(py, ordered, tests, "solution.py", extra);
      if (!sol.allPassed) problems.push(`${ex.id}: the reference order fails:\n${failureText(sol)}`);
      const scrambled = [...ex.parsons!.lines].reverse().join("\n") + "\n";
      if (grade(py, scrambled, tests, "solution.py", extra).allPassed) problems.push(`${ex.id}: a reversed order passes the tests (tests don't check the order)`);
      lines.push(`order ${sol.passed}/${sol.total}`, "reversed ✗");
      console.log(`  ${problems.some((p) => p.startsWith(ex.id)) ? "✗" : "✓"} ${ex.id}: ${lines.join(", ")}`);
      continue;
    }

    const ext = ex.language === "sql" ? "sql" : "py";
    const solutionFile = `solution.${ext}`;
    const sol = grade(py, read(solutionFile), tests, solutionFile, extra);
    if (!sol.allPassed) problems.push(`${ex.id}: reference solution fails:\n${failureText(sol)}`);
    lines.push(`solution ${sol.passed}/${sol.total}`);

    const start = grade(py, read(`starter.${ext}`), tests, solutionFile, extra);
    if (start.allPassed) problems.push(`${ex.id}: starter code passes every test (tests are too weak)`);
    lines.push(`starter ${start.passed}/${start.total}`);

    const vdir = path.join(dir, "variants");
    const variants = fs.existsSync(vdir) ? fs.readdirSync(vdir).filter((f) => f.endsWith(`.${ext}`)).sort() : [];
    for (const v of variants) {
      const src = fs.readFileSync(path.join(vdir, v), "utf8");
      const expect = /^(?:#|--)\s*expect:\s*(.+)$/m.exec(src)?.[1]?.trim();
      const g = grade(py, src, tests, solutionFile, extra);
      if (g.allPassed) problems.push(`${ex.id}: variant ${v} passes every test (a known mistake goes undetected)`);
      else if (expect && !failureText(g).includes(expect)) problems.push(`${ex.id}: variant ${v} fails, but no message contains "${expect}". Messages:\n${failureText(g)}`);
      lines.push(`${v.replace(/\.(py|sql)$/, "")} ✗`);
    }
    console.log(`  ${problems.some((p) => p.startsWith(ex.id)) ? "✗" : "✓"} ${ex.id}: ${lines.join(", ")}`);
  }

  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
}

void main();
