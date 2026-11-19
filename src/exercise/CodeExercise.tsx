/**
 * An interactive code exercise: editor, Run, Check (real pytest in Pyodide), tiered hints,
 * and a guarded solution reveal. Attempts are recorded for mastery and review scheduling.
 */
import { CheckCircle2, Eye, Lightbulb, Loader2, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InlineText } from "@/components/InlineText";
import { Badge, Button } from "@/components/ui";
import { content } from "@/content";
import { enrollCards } from "@/engine/cards";
import { markItemDone } from "@/hooks/learning";
import { recordAttempt } from "@/lesson/context";
import { getSettings } from "@/state/settings";
import { python, usePythonStatus } from "@/runtime/python";
import { CodeEditor } from "./CodeEditor";
import { loadExerciseFile, supportFileNames } from "./files";
import { OutputPanel, type Output } from "./OutputPanel";
import { ParsonsExercise } from "./ParsonsExercise";

function draftKey(id: string) {
  return `hs-draft:${id}`;
}
function readDraft(id: string): string | null {
  try {
    return localStorage.getItem(draftKey(id));
  } catch {
    return null;
  }
}
function writeDraft(id: string, code: string | null) {
  try {
    if (code === null) localStorage.removeItem(draftKey(id));
    else localStorage.setItem(draftKey(id), code);
  } catch {
    /* drafts are a convenience; ignore storage failures */
  }
}


const TIER_LABEL = ["", "Hint 1 · orient", "Hint 2 · principle", "Hint 3 · next step"];

export type ExerciseMode = "lesson" | "challenge" | "checkpoint";

/**
 * Modes: "lesson" keeps a draft and offers hints and a guarded reveal; "challenge" starts from a
 * blank starter (no draft); "checkpoint" has no hints or reveal and reports results to the gate.
 */
type ExerciseProps = { id: string; mode?: ExerciseMode; onResult?: (r: { allPassed: boolean; checks: number }) => void };

/** Every exercise type renders through here: code, fill-in, debug and SQL in the editor; Parsons as blocks. */
export function CodeExercise(props: ExerciseProps) {
  const ex = content.exercises.find((e) => e.id === props.id);
  if (ex?.type === "parsons") return <ParsonsExercise ex={ex} mode={props.mode ?? "lesson"} onResult={props.onResult} />;
  return <EditorExercise {...props} />;
}

/** Python script for the SQL Run button: build the exercise's tables, run the query, print a table. */
function sqlRunScript(sql: string, support: Record<string, string>): string {
  return `${support["data.py"] ?? ""}\n\nfrom hsgrade.sql import run as _hs_run, preview as _hs_preview\nprint(_hs_preview(_hs_run(make_db(), ${JSON.stringify(sql)})))\n`;
}

function EditorExercise({ id, mode = "lesson", onResult }: ExerciseProps) {
  const ex = useMemo(() => content.exercises.find((e) => e.id === id), [id]);
  const keepDraft = mode === "lesson";
  const [support, setSupport] = useState<Record<string, string>>({});
  const [starter, setStarter] = useState<string | null>(null);
  const [tests, setTests] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<Output>(null);
  const [busy, setBusy] = useState<"run" | "check" | null>(null);
  const [hintTier, setHintTier] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [solution, setSolution] = useState<string | null>(null);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [solved, setSolved] = useState(false);
  const started = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const status = usePythonStatus();

  useEffect(() => {
    if (!ex) return;
    void python.warm().catch(() => undefined);
    const names = supportFileNames(ex.files);
    void Promise.all([loadExerciseFile(ex.dir, ex.language === "sql" ? "starter.sql" : "starter.py"), loadExerciseFile(ex.dir, "tests.py"), ...names.map((n) => loadExerciseFile(ex.dir, n))]).then(([s, t, ...extra]) => {
      setSupport(Object.fromEntries(names.map((n, i) => [n, extra[i] ?? ""])));
      setStarter(s ?? "");
      setTests(t ?? "");
      setCode((keepDraft ? readDraft(ex.id) : null) ?? s ?? "");
    });
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [ex, keepDraft]);

  const onChange = useCallback(
    (v: string) => {
      setCode(v);
      if (ex && keepDraft) writeDraft(ex.id, v === starter ? null : v);
    },
    [ex, starter, keepDraft],
  );

  const run = useCallback(async () => {
    if (!ex || busy) return;
    setBusy("run");
    try {
      const script = ex.language === "sql" ? sqlRunScript(code, support) : code;
      setOutput({ kind: "run", result: await python.run(script, ex.packages, ex.constraints.timeoutMs) });
    } catch (e) {
      setOutput({ kind: "error", message: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }, [ex, busy, code, support]);

  const check = useCallback(async () => {
    if (!ex || busy || tests === null) return;
    setBusy("check");
    try {
      const result = await python.grade(code, tests, ex.packages, ex.constraints.timeoutMs, { solutionFile: ex.language === "sql" ? "solution.sql" : "solution.py", extraFiles: support });
      setOutput({ kind: "grade", result });
      const checks = attempts + 1;
      setAttempts(checks);
      if (result.allPassed) setSolved(true);
      onResult?.({ allPassed: result.allPassed, checks });
      const misconceptions = [...new Set(result.tests.filter((t) => t.outcome === "failed" && t.misconception).map((t) => t.misconception!))];
      if (mode !== "checkpoint") {
        // The gate records its own attempt; everywhere else this check is evidence for mastery.
        void recordAttempt({
          itemId: ex.id,
          kind: "code",
          correct: result.allPassed,
          seconds: (Date.now() - started.current) / 1000,
          skills: ex.concepts,
          payload: { passed: result.passed, total: result.total, hintTier: solution ? 4 : hintTier, misconceptions, mode },
        });
        // A known misconception puts its card in the deck right away.
        const known = misconceptions.filter((m) => content.cards[m]);
        if (known.length) void getSettings().then((st) => enrollCards(known.map((m) => ({ id: m, critical: content.cards[m]!.critical })), `misconception:${ex.id}`, new Date(), st.desiredRetention));
      }
      if (mode === "challenge") void markItemDone(`challenge:${ex.id}`, Math.max(10, ex.minutes));
    } catch (e) {
      setOutput({ kind: "error", message: (e as Error).message });
      setAttempts((a) => a + 1);
    } finally {
      setBusy(null);
    }
  }, [ex, busy, tests, code, hintTier, solution, attempts, onResult, mode, support]);

  if (!ex) {
    return <div className="my-6 rounded-2xl border border-danger p-4 text-sm text-danger">Unknown exercise "{id}".</div>;
  }

  const hintUnlocked = attempts > 0 || now - started.current >= 60_000;
  const allowHelp = mode !== "checkpoint";
  const canReveal = allowHelp && (hintTier >= 3 || attempts >= 3);

  const reveal = async () => {
    const s = await loadExerciseFile(ex.dir, ex.language === "sql" ? "solution.sql" : "solution.py");
    setSolution(s ?? "# solution unavailable");
    setConfirmReveal(false);
  };

  return (
    <section className="not-prose my-8 rounded-2xl border border-line bg-surface-2/40 p-4 sm:p-5" data-testid={`exercise-${id.split("/")[1]}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-accent uppercase">{mode === "challenge" ? "Challenge" : ex.type === "debug" ? "Debug" : ex.type === "fill-in" ? "Fill in" : ex.type === "sql" ? "SQL" : "Code"}</span>
        <h3 className="mr-auto font-semibold">{ex.title}</h3>
        <Badge>{ex.minutes} min</Badge>
        {ex.constraints.requireVectorized && <Badge tone="info">no Python loops</Badge>}
        {ex.constraints.forbidImports.length > 0 && <Badge tone="violet">from scratch</Badge>}
        {solved && (
          <Badge tone="success">
            <CheckCircle2 size={12} /> solved
          </Badge>
        )}
      </div>
      <div className="mb-4 text-[15px] leading-relaxed text-ink [&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.88em]">
        <InlineText text={ex.prompt} />
      </div>

      {starter === null ? (
        <div className="rounded-xl border border-line p-6 text-center text-sm text-faint">Loading exercise…</div>
      ) : (
        <CodeEditor value={code} onChange={onChange} language={ex.language === "sql" ? "sql" : "python"} onRun={() => void run()} onCheck={() => void check()} label={`Code for ${ex.title}`} />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button onClick={() => void run()} disabled={!!busy || starter === null} title="Run (Ctrl/Cmd+Enter)">
          {busy === "run" ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Run
        </Button>
        <Button variant="primary" onClick={() => void check()} disabled={!!busy || tests === null} title="Check with tests (Shift+Ctrl/Cmd+Enter)">
          {busy === "check" ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Check
        </Button>
        {allowHelp && (
          <Button variant="ghost" disabled={hintTier >= 3 || !hintUnlocked} onClick={() => setHintTier((h) => Math.min(3, h + 1))} title={hintUnlocked ? "Show the next hint" : "Try it first: hints unlock after your first check or a minute of work"}>
            <Lightbulb size={15} /> {hintTier === 0 ? "Hint" : hintTier < 3 ? "Next hint" : "No more hints"}
          </Button>
        )}
        {confirmReset ? (
          <>
            <Button variant="danger" onClick={() => (onChange(starter ?? ""), setConfirmReset(false))}>
              Reset code?
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Keep
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={() => (code === starter ? undefined : setConfirmReset(true))} disabled={code === starter}>
            <RotateCcw size={15} /> Reset
          </Button>
        )}
        <span className="ml-auto text-xs text-faint" aria-live="polite">
          {status.phase === "starting" || status.phase === "busy" ? status.message : status.phase === "ready" ? "Python ready" : ""}
        </span>
      </div>

      {allowHelp && hintTier > 0 && (
        <ol className="mt-4 flex flex-col gap-2 [&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.88em]">
          {ex.hints.slice(0, hintTier).map((h, i) => (
            <li key={i} className="rounded-xl border border-heat/30 bg-heat-soft p-3 text-sm leading-relaxed">
              <div className="mb-1 text-xs font-semibold text-heat">{TIER_LABEL[i + 1]}</div>
              <InlineText text={h} />
            </li>
          ))}
        </ol>
      )}

      <OutputPanel output={output} />

      <div className="mt-4">
        {solution !== null ? (
          <div>
            <div className="mb-2 text-xs font-semibold tracking-wider text-faint uppercase">Reference solution</div>
            <CodeEditor value={solution} onChange={() => undefined} readOnly language={ex.language === "sql" ? "sql" : "python"} label="Reference solution" />
            <p className="mt-2 text-xs text-faint">A variant of this exercise will come back in a couple of days, so the skill sticks.</p>
          </div>
        ) : canReveal ? (
          confirmReveal ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Reveal the solution? You can still solve it yourself afterwards.</span>
              <Button variant="danger" onClick={() => void reveal()}>
                Reveal
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReveal(false)}>
                Not yet
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmReveal(true)}>
              <Eye size={15} /> Show solution
            </Button>
          )
        ) : null}
      </div>
    </section>
  );
}
