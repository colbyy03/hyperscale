/**
 * An interactive code exercise: editor, Run, Check (real pytest in Pyodide), tiered hints,
 * and a guarded solution reveal. Attempts are recorded for mastery and review scheduling.
 */
import clsx from "clsx";
import { CheckCircle2, CircleAlert, Eye, Lightbulb, Loader2, Play, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Badge, Button } from "@/components/ui";
import { content } from "@/content";
import { recordAttempt } from "@/lesson/context";
import type { GradeResult, RunResult } from "@/runtime/protocol";
import { python, usePythonStatus } from "@/runtime/python";
import { CodeEditor } from "./CodeEditor";
import { loadExerciseFile } from "./files";

/** Minimal inline formatting for prompts and hints: `code`, **bold**, blank-line paragraphs. */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className={i ? "mt-2" : undefined}>
          {para.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, j) => {
            if (part.startsWith("`") && part.endsWith("`")) return <code key={j}>{part.slice(1, -1)}</code>;
            if (part.startsWith("**") && part.endsWith("**")) return <strong key={j}>{part.slice(2, -2)}</strong>;
            return <Fragment key={j}>{part}</Fragment>;
          })}
        </p>
      ))}
    </>
  );
}

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

type Output = { kind: "run"; result: RunResult } | { kind: "grade"; result: GradeResult } | { kind: "error"; message: string } | null;

const TIER_LABEL = ["", "Hint 1 · orient", "Hint 2 · principle", "Hint 3 · next step"];

export function CodeExercise({ id }: { id: string }) {
  const ex = useMemo(() => content.exercises.find((e) => e.id === id), [id]);
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
    void Promise.all([loadExerciseFile(ex.dir, ex.language === "sql" ? "starter.sql" : "starter.py"), loadExerciseFile(ex.dir, "tests.py")]).then(([s, t]) => {
      setStarter(s ?? "");
      setTests(t ?? "");
      setCode(readDraft(ex.id) ?? s ?? "");
    });
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [ex]);

  const onChange = useCallback(
    (v: string) => {
      setCode(v);
      if (ex) writeDraft(ex.id, v === starter ? null : v);
    },
    [ex, starter],
  );

  const run = useCallback(async () => {
    if (!ex || busy) return;
    setBusy("run");
    try {
      setOutput({ kind: "run", result: await python.run(code, ex.packages, ex.constraints.timeoutMs) });
    } catch (e) {
      setOutput({ kind: "error", message: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }, [ex, busy, code]);

  const check = useCallback(async () => {
    if (!ex || busy || tests === null) return;
    setBusy("check");
    try {
      const result = await python.grade(code, tests, ex.packages, ex.constraints.timeoutMs);
      setOutput({ kind: "grade", result });
      setAttempts((a) => a + 1);
      if (result.allPassed) setSolved(true);
      void recordAttempt({
        itemId: ex.id,
        kind: "code",
        correct: result.allPassed,
        seconds: (Date.now() - started.current) / 1000,
        skills: ex.concepts,
        payload: { passed: result.passed, total: result.total, hintTier: solution ? 4 : hintTier, misconceptions: result.tests.filter((t) => t.outcome === "failed" && t.misconception).map((t) => t.misconception) },
      });
    } catch (e) {
      setOutput({ kind: "error", message: (e as Error).message });
      setAttempts((a) => a + 1);
    } finally {
      setBusy(null);
    }
  }, [ex, busy, tests, code, hintTier, solution]);

  if (!ex) {
    return <div className="my-6 rounded-2xl border border-danger p-4 text-sm text-danger">Unknown exercise "{id}".</div>;
  }

  const hintUnlocked = attempts > 0 || now - started.current >= 60_000;
  const canReveal = hintTier >= 3 || attempts >= 3;

  const reveal = async () => {
    const s = await loadExerciseFile(ex.dir, ex.language === "sql" ? "solution.sql" : "solution.py");
    setSolution(s ?? "# solution unavailable");
    setConfirmReveal(false);
  };

  return (
    <section className="not-prose my-8 rounded-2xl border border-line bg-surface-2/40 p-4 sm:p-5" data-testid={`exercise-${id.split("/")[1]}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-accent uppercase">{ex.type === "debug" ? "Debug" : ex.type === "fill-in" ? "Fill in" : "Code"}</span>
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
        <Button variant="ghost" disabled={hintTier >= 3 || !hintUnlocked} onClick={() => setHintTier((h) => Math.min(3, h + 1))} title={hintUnlocked ? "Show the next hint" : "Try it first: hints unlock after your first check or a minute of work"}>
          <Lightbulb size={15} /> {hintTier === 0 ? "Hint" : hintTier < 3 ? "Next hint" : "No more hints"}
        </Button>
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

      {hintTier > 0 && (
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

function Pre({ children, tone }: { children: ReactNode; tone?: "danger" }) {
  return <pre className={clsx("mt-2 max-h-72 overflow-auto rounded-xl border bg-surface p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap", tone === "danger" ? "border-danger/40 text-danger" : "border-line")}>{children}</pre>;
}

function OutputPanel({ output }: { output: Output }) {
  if (!output) return null;
  if (output.kind === "error") {
    return (
      <div className="mt-4 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm" role="alert">
        <CircleAlert size={15} className="mr-1 inline text-danger" /> {output.message}
      </div>
    );
  }
  if (output.kind === "run") {
    const r = output.result;
    const empty = !r.stdout && !r.stderr && !r.value && !r.error;
    return (
      <div className="mt-4" data-testid="run-output">
        <div className="text-xs font-semibold tracking-wider text-faint uppercase">Output · {r.seconds.toFixed(2)} s</div>
        {empty && <Pre>(no output: print something, or end with an expression)</Pre>}
        {r.stdout && <Pre>{r.stdout}</Pre>}
        {r.value && <Pre>{r.value}</Pre>}
        {r.stderr && <Pre tone="danger">{r.stderr}</Pre>}
        {r.error && <Pre tone="danger">{r.error}</Pre>}
      </div>
    );
  }
  const g = output.result;
  return (
    <div className="mt-4" data-testid="grade-output">
      <div className={clsx("flex items-center gap-2 font-medium", g.allPassed ? "text-accent" : "text-heat")}>
        {g.allPassed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        {g.allPassed ? `All ${g.total} tests pass.` : g.collectionErrors.length ? "Your code didn't load." : `${g.passed} of ${g.total} tests pass.`}
        <span className="text-xs font-normal text-faint">{g.seconds.toFixed(2)} s</span>
      </div>
      {g.collectionErrors.length > 0 && <Pre tone="danger">{g.collectionErrors[0]!.split("\n").slice(-12).join("\n")}</Pre>}
      <ul className="mt-2 flex flex-col gap-1.5">
        {g.tests.map((t) => (
          <li key={t.name} className={clsx("rounded-xl border p-2.5 text-sm", t.outcome === "passed" ? "border-line" : "border-heat/40 bg-heat-soft")}>
            <div className="flex items-center gap-2">
              {t.outcome === "passed" ? <CheckCircle2 size={15} className="shrink-0 text-accent" /> : <XCircle size={15} className="shrink-0 text-heat" />}
              <span className={clsx(t.outcome === "passed" && "text-muted")}>{t.description ?? t.name.replace(/^test_/, "").replace(/_/g, " ")}</span>
              {t.hidden && <Badge className="ml-auto">hidden test</Badge>}
            </div>
            {t.message && <div className="mt-1.5 pl-6 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-ink">{t.message}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
