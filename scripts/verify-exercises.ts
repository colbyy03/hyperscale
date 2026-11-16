/**
 * Verifies every Python exercise in the same engine the browser uses (Pyodide, here on Node):
 *   1. the reference solution passes every test;
 *   2. the starter code fails at least one test (so no test passes trivially);
 *   3. every known-wrong variant in variants/*.py fails, and some failure message contains
 *      the text named on its first line ("# expect: <text>").
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

function grade(py: PyodideAPI, solution: string, tests: string): Grade {
  py.globals.set("_s", solution);
  py.globals.set("_t", tests);
  return JSON.parse(py.runPython("import json, hsgrade\njson.dumps(hsgrade.grade(_s, _t, '/hs/work'))") as string) as Grade;
}

function failureText(g: Grade): string {
  return [...g.collectionErrors, ...g.tests.filter((t) => t.outcome !== "passed").map((t) => t.message ?? "")].join("\n");
}

async function main() {
  const { index, errors } = buildContentIndex(root);
  if (errors.length) {
    console.error("content has errors; run npm run validate first");
    process.exit(1);
  }
  const exercises = index.exercises.filter((e) => e.language === "python" && ["code", "fill-in", "debug"].includes(e.type) && (!filter || e.id.includes(filter)));
  if (!exercises.length) {
    console.log("no Python exercises to verify");
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
    const lines: string[] = [];

    const sol = grade(py, read("solution.py"), tests);
    if (!sol.allPassed) problems.push(`${ex.id}: reference solution fails:\n${failureText(sol)}`);
    lines.push(`solution ${sol.passed}/${sol.total}`);

    const start = grade(py, read("starter.py"), tests);
    if (start.allPassed) problems.push(`${ex.id}: starter code passes every test (tests are too weak)`);
    lines.push(`starter ${start.passed}/${start.total}`);

    const vdir = path.join(dir, "variants");
    const variants = fs.existsSync(vdir) ? fs.readdirSync(vdir).filter((f) => f.endsWith(".py")).sort() : [];
    for (const v of variants) {
      const src = fs.readFileSync(path.join(vdir, v), "utf8");
      const expect = /^#\s*expect:\s*(.+)$/m.exec(src)?.[1]?.trim();
      const g = grade(py, src, tests);
      if (g.allPassed) problems.push(`${ex.id}: variant ${v} passes every test (a known mistake goes undetected)`);
      else if (expect && !failureText(g).includes(expect)) problems.push(`${ex.id}: variant ${v} fails, but no message contains "${expect}". Messages:\n${failureText(g)}`);
      lines.push(`${v.replace(/\.py$/, "")} ✗`);
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
