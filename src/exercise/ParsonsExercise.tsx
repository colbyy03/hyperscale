/**
 * Parsons problem: put the given lines of code in order. Some blocks may be distractors that don't
 * belong in a correct solution. Tap a block to move it into your answer and use the arrows to
 * reorder, so it works on a phone without dragging. If the exercise ships tests.py, the assembled
 * code is graded by pytest (so any correct order passes); otherwise the order is compared directly.
 */
import clsx from "clsx";
import { ArrowDown, ArrowUp, CheckCircle2, Eye, Lightbulb, Loader2, RotateCcw, ShieldCheck, Undo2, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { InlineText } from "@/components/InlineText";
import { Badge, Button } from "@/components/ui";
import type { ExerciseIndexEntry } from "@/content/schema";
import { recordAttempt } from "@/lesson/context";
import { python } from "@/runtime/python";
import type { ExerciseMode } from "./CodeExercise";
import { loadExerciseFile } from "./files";
import { OutputPanel, type Output } from "./OutputPanel";

interface Block {
  text: string;
  /** Position in the solution, or -1 for a distractor. */
  at: number;
}

function seeded(seed: string): () => number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** A shuffle that is stable for an exercise and never leaves the solution already in order. */
export function shuffledOrder(n: number, solutionLength: number, seed: string): number[] {
  const rnd = seeded(seed);
  const order = Array.from({ length: n }, (_, i) => i);
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    const inOrder = order.filter((i) => i < solutionLength).every((v, k, arr) => k === 0 || arr[k - 1]! < v);
    if (!inOrder) break;
  }
  return order;
}

/** Feedback for an ordering, compared with the solution (no tests). */
export function judgeOrder(answer: Block[], solutionLength: number): { correct: boolean; message: string; wrongAt?: number } {
  const distractor = answer.findIndex((b) => b.at < 0);
  if (distractor >= 0) return { correct: false, message: `Line ${distractor + 1} doesn't belong in a correct solution.`, wrongAt: distractor };
  const wrong = answer.findIndex((b, k) => b.at !== k);
  if (wrong >= 0) return { correct: false, message: `Line ${wrong + 1} is out of place.`, wrongAt: wrong };
  if (answer.length < solutionLength) return { correct: false, message: `${solutionLength - answer.length} more line${solutionLength - answer.length === 1 ? "" : "s"} needed.` };
  return { correct: true, message: "Correct order." };
}

const TIER_LABEL = ["", "Hint 1 · orient", "Hint 2 · principle", "Hint 3 · next step"];

export function ParsonsExercise({ ex, mode, onResult }: { ex: ExerciseIndexEntry; mode: ExerciseMode; onResult?: (r: { allPassed: boolean; checks: number }) => void }) {
  const spec = ex.parsons!;
  const blocks = useMemo<Block[]>(() => [...spec.lines.map((text, at) => ({ text, at })), ...spec.distractors.map((text) => ({ text, at: -1 }))], [spec]);
  const initialPool = useMemo(() => shuffledOrder(blocks.length, spec.lines.length, ex.id), [blocks.length, spec.lines.length, ex.id]);
  const [answer, setAnswer] = useState<number[]>([]);
  const [pool, setPool] = useState<number[]>(initialPool);
  const [verdict, setVerdict] = useState<{ correct: boolean; message: string; wrongAt?: number } | null>(null);
  const [output, setOutput] = useState<Output>(null);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState(0);
  const [hintTier, setHintTier] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tests, setTests] = useState<string | null>(null);
  const started = useRef(Date.now());
  const allowHelp = mode !== "checkpoint";

  useEffect(() => {
    if (!ex.files.includes("tests.py")) return;
    void loadExerciseFile(ex.dir, "tests.py").then((t) => setTests(t));
    void python.warm().catch(() => undefined);
  }, [ex]);

  const add = (i: number) => {
    setPool((p) => p.filter((x) => x !== i));
    setAnswer((a) => [...a, i]);
    setVerdict(null);
  };
  const remove = (i: number) => {
    setAnswer((a) => a.filter((x) => x !== i));
    setPool((p) => [...p, i]);
    setVerdict(null);
  };
  const move = (k: number, d: -1 | 1) => {
    setAnswer((a) => {
      const j = k + d;
      if (j < 0 || j >= a.length) return a;
      const next = [...a];
      [next[k], next[j]] = [next[j]!, next[k]!];
      return next;
    });
    setVerdict(null);
  };
  const reset = () => {
    setAnswer([]);
    setPool(initialPool);
    setVerdict(null);
    setOutput(null);
  };

  const check = async () => {
    if (busy || !answer.length) return;
    const chosen = answer.map((i) => blocks[i]!);
    let correct: boolean;
    setBusy(true);
    try {
      if (tests) {
        const code = chosen.map((b) => b.text).join("\n") + "\n";
        const result = await python.grade(code, tests, ex.packages, ex.constraints.timeoutMs);
        setOutput({ kind: "grade", result });
        correct = result.allPassed;
        setVerdict(correct ? { correct, message: "All tests pass." } : judgeHint(chosen, spec.lines.length));
      } else {
        const v = judgeOrder(chosen, spec.lines.length);
        correct = v.correct;
        setVerdict(v);
      }
      const n = checks + 1;
      setChecks(n);
      onResult?.({ allPassed: correct, checks: n });
      if (mode !== "checkpoint") {
        void recordAttempt({ itemId: ex.id, kind: "parsons", correct, seconds: (Date.now() - started.current) / 1000, skills: ex.concepts, payload: { hintTier: revealed ? 4 : hintTier, order: chosen.map((b) => b.at) } });
      }
    } catch (e) {
      setOutput({ kind: "error", message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const hintUnlocked = checks > 0 || Date.now() - started.current >= 45_000;
  const canReveal = allowHelp && (hintTier >= 3 || checks >= 3);

  return (
    <section className="not-prose my-8 rounded-2xl border border-line bg-surface-2/40 p-4 sm:p-5" data-testid={`exercise-${ex.id.split("/")[1]}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-accent uppercase">Put it in order</span>
        <h3 className="mr-auto font-semibold">{ex.title}</h3>
        <Badge>{ex.minutes} min</Badge>
        {spec.distractors.length > 0 && <Badge tone="violet">{spec.distractors.length} extra block{spec.distractors.length === 1 ? "" : "s"}</Badge>}
        {verdict?.correct && (
          <Badge tone="success">
            <CheckCircle2 size={12} /> solved
          </Badge>
        )}
      </div>
      <div className="mb-4 text-[15px] leading-relaxed [&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.88em]">
        <InlineText text={ex.prompt} />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <div className="mb-1.5 text-xs font-semibold tracking-wider text-faint uppercase">Your solution</div>
          <ol className="flex min-h-24 flex-col gap-1.5 rounded-xl border border-dashed border-line-strong p-2" aria-label="Your solution" data-testid="parsons-answer">
            {answer.length === 0 && <li className="p-2 text-xs text-faint">Tap blocks below to add them here, in order. Tap a line here to send it back.</li>}
            {answer.map((i, k) => (
              <li key={i} className={clsx("flex items-stretch gap-1 rounded-lg border bg-surface", verdict && !verdict.correct && verdict.wrongAt === k ? "border-heat" : "border-line")}>
                <button className="min-w-0 flex-1 overflow-x-auto px-2 py-1.5 text-left font-mono text-[13px] whitespace-pre" onClick={() => remove(i)} title="Remove this line" aria-label={`Remove line: ${blocks[i]!.text.trim()}`}>
                  {blocks[i]!.text}
                </button>
                <div className="flex flex-col border-l border-line">
                  <button className="px-1.5 text-faint hover:text-ink disabled:opacity-30" disabled={k === 0} onClick={() => move(k, -1)} aria-label="Move up">
                    <ArrowUp size={12} />
                  </button>
                  <button className="px-1.5 text-faint hover:text-ink disabled:opacity-30" disabled={k === answer.length - 1} onClick={() => move(k, 1)} aria-label="Move down">
                    <ArrowDown size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="mb-1.5 text-xs font-semibold tracking-wider text-faint uppercase">Blocks · tap to add</div>
          <ul className="flex min-h-24 flex-col gap-1.5 rounded-xl border border-line p-2" aria-label="Available blocks" data-testid="parsons-pool">
            {pool.length === 0 && <li className="p-2 text-xs text-faint">All blocks used.</li>}
            {pool.map((i) => (
              <li key={i}>
                <button className="w-full overflow-x-auto rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-left font-mono text-[13px] whitespace-pre hover:border-line-strong" onClick={() => add(i)} aria-label={`Add line: ${blocks[i]!.text.trim()}`}>
                  {blocks[i]!.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={() => void check()} disabled={busy || answer.length === 0}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />} Check
        </Button>
        {allowHelp && (
          <Button variant="ghost" disabled={hintTier >= 3 || !hintUnlocked} onClick={() => setHintTier((h) => Math.min(3, h + 1))}>
            <Lightbulb size={15} /> {hintTier === 0 ? "Hint" : hintTier < 3 ? "Next hint" : "No more hints"}
          </Button>
        )}
        <Button variant="ghost" onClick={reset} disabled={answer.length === 0}>
          <RotateCcw size={15} /> Start over
        </Button>
        {answer.length > 0 && (
          <Button variant="ghost" onClick={() => remove(answer.at(-1)!)}>
            <Undo2 size={15} /> Undo
          </Button>
        )}
      </div>

      {verdict && (
        <p className={clsx("mt-3 flex items-center gap-2 text-sm font-medium", verdict.correct ? "text-accent" : "text-heat")} role="status">
          {verdict.correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />} {verdict.message}
        </p>
      )}

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

      {output?.kind !== "grade" || !verdict?.correct ? <OutputPanel output={output} /> : null}

      {canReveal && !revealed && (
        <Button variant="ghost" className="mt-3" onClick={() => setRevealed(true)}>
          <Eye size={15} /> Show the order
        </Button>
      )}
      {revealed && (
        <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-surface p-3 font-mono text-[13px] leading-relaxed">{spec.lines.join("\n")}</pre>
      )}
    </section>
  );
}

/** When tests fail, still point at the first line that differs from the reference order. */
function judgeHint(chosen: Block[], solutionLength: number) {
  const v = judgeOrder(chosen, solutionLength);
  return v.correct ? { correct: false, message: "The tests fail with this order. Read the test output below." } : v;
}
