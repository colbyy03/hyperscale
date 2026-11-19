/**
 * A derivation, one step at a time. Each step is a NumPy expression; Python checks it against the
 * reference at random values of the variables (declared shapes and kinds), so any algebraically
 * equivalent form passes and common slips (a sign, a transpose, a factor of 2) are named.
 */
import clsx from "clsx";
import { CheckCircle2, Eye, Lightbulb, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InlineText } from "@/components/InlineText";
import { Badge, Button } from "@/components/ui";
import type { ExerciseIndexEntry } from "@/content/schema";
import { recordAttempt } from "@/lesson/context";
import { python, usePythonStatus } from "@/runtime/python";
import type { ExerciseMode } from "./CodeExercise";

interface StepResult {
  ok: boolean;
  message: string;
}

const TIER_LABEL = ["", "Hint 1 · orient", "Hint 2 · principle", "Hint 3 · next step"];

function shapeLabel(shape: number[]): string {
  return shape.length === 0 ? "scalar" : shape.length === 1 ? `vector (${shape[0]})` : `${shape.join("×")} matrix`;
}

/** Python that grades the responses and prints one JSON line. */
export function derivationScript(ex: ExerciseIndexEntry, responses: string[]): string {
  const d = ex.derivation!;
  const steps = d.steps.map((s) => ({ answer: s.answer }));
  return `import json\nfrom hsgrade.derive import check\nprint(json.dumps(check(json.loads(${JSON.stringify(JSON.stringify(d.variables))}), json.loads(${JSON.stringify(JSON.stringify(steps))}), json.loads(${JSON.stringify(JSON.stringify(responses))}))))`;
}

export function DerivationExercise({ ex, mode, onResult }: { ex: ExerciseIndexEntry; mode: ExerciseMode; onResult?: (r: { allPassed: boolean; checks: number }) => void }) {
  const d = ex.derivation!;
  const [responses, setResponses] = useState<string[]>(() => d.steps.map(() => ""));
  const [results, setResults] = useState<StepResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState(0);
  const [hintTier, setHintTier] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const started = useRef(Date.now());
  const status = usePythonStatus();
  const allowHelp = mode !== "checkpoint";

  useEffect(() => {
    void python.warm().catch(() => undefined);
  }, []);

  const check = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const run = await python.run(derivationScript(ex, responses), [], 10_000);
      if (run.error) throw new Error(run.error);
      const parsed = JSON.parse(run.stdout.trim().split("\n").at(-1) ?? "[]") as StepResult[];
      setResults(parsed);
      const all = parsed.length === d.steps.length && parsed.every((r) => r.ok);
      const n = checks + 1;
      setChecks(n);
      onResult?.({ allPassed: all, checks: n });
      if (mode !== "checkpoint") {
        void recordAttempt({ itemId: ex.id, kind: "derivation", correct: all, seconds: (Date.now() - started.current) / 1000, skills: ex.concepts, payload: { hintTier: revealed ? 4 : hintTier, stepsOk: parsed.map((r) => r.ok) } });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const solved = !!results && results.length === d.steps.length && results.every((r) => r.ok);
  const canReveal = allowHelp && (hintTier >= 3 || checks >= 3);

  return (
    <section className="not-prose my-8 rounded-2xl border border-line bg-surface-2/40 p-4 sm:p-5" data-testid={`exercise-${ex.id.split("/")[1]}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-accent uppercase">Derive</span>
        <h3 className="mr-auto font-semibold">{ex.title}</h3>
        <Badge>{ex.minutes} min</Badge>
        {solved && (
          <Badge tone="success">
            <CheckCircle2 size={12} /> solved
          </Badge>
        )}
      </div>
      <div className="mb-3 text-[15px] leading-relaxed [&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.88em]">
        <InlineText text={ex.prompt} />
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5 text-xs">
        {Object.entries(d.variables).map(([name, v]) => (
          <span key={name} className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono">
            {name} <span className="text-faint">· {v.kind !== "general" ? `${v.kind} ` : ""}{shapeLabel(v.shape)}</span>
          </span>
        ))}
      </div>

      <ol className="flex flex-col gap-3">
        {d.steps.map((step, i) => {
          const r = results?.[i];
          return (
            <li key={i} className={clsx("rounded-xl border p-3", r ? (r.ok ? "border-accent/40" : "border-heat/40 bg-heat-soft") : "border-line")} data-testid={`step-${i + 1}`}>
              <div className="mb-2 flex gap-2 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.88em]">
                <span className="text-faint tabular-nums">{i + 1}.</span>
                <div>
                  <InlineText text={step.prompt} />
                </div>
              </div>
              <input
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm"
                value={responses[i]}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="NumPy expression"
                aria-label={`Step ${i + 1}`}
                onChange={(e) => setResponses((rs) => rs.map((v, j) => (j === i ? e.target.value : v)))}
                onKeyDown={(e) => e.key === "Enter" && void check()}
              />
              {r && (
                <p className={clsx("mt-2 flex items-start gap-1.5 text-sm", r.ok ? "text-accent" : "text-heat")}>
                  {r.ok ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <XCircle size={15} className="mt-0.5 shrink-0" />}
                  <span>
                    {r.message}
                    {!r.ok && allowHelp && step.hint && <span className="block text-muted">{step.hint}</span>}
                  </span>
                </p>
              )}
              {revealed && <p className="mt-2 font-mono text-xs text-muted">reference: {step.answer}</p>}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={() => void check()} disabled={busy || responses.every((v) => !v.trim())}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Check steps
        </Button>
        {allowHelp && (
          <Button variant="ghost" disabled={hintTier >= 3 || checks === 0} onClick={() => setHintTier((h) => Math.min(3, h + 1))} title={checks ? "Show the next hint" : "Try a step first"}>
            <Lightbulb size={15} /> {hintTier === 0 ? "Hint" : hintTier < 3 ? "Next hint" : "No more hints"}
          </Button>
        )}
        {canReveal && !revealed && (
          <Button variant="ghost" onClick={() => setRevealed(true)}>
            <Eye size={15} /> Show the derivation
          </Button>
        )}
        <span className="ml-auto text-xs text-faint" aria-live="polite">
          {status.phase === "starting" || status.phase === "busy" ? status.message : status.phase === "ready" ? "Python ready" : ""}
        </span>
      </div>
      <p className="mt-2 text-xs text-faint">Write NumPy: <code>@</code> multiplies matrices, <code>.T</code> transposes, <code>**</code> is a power. Helpers: <code>inv</code>, <code>trace</code>, <code>outer</code>, <code>eye</code>, <code>exp</code>, <code>log</code>, <code>sqrt</code>.</p>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

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
    </section>
  );
}
