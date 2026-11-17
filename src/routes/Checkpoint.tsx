/**
 * The mastery gate for a module (PLAN.md §3.4): a closed-book, unhinted checkpoint, scored on
 * threshold + critical items + a transfer item + a self-assessed explanation, with a 24-hour
 * retake, provisional advance after two misses, and a delayed confirmation 3–7 days after a pass.
 */
import clsx from "clsx";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Lock, ShieldCheck, XCircle } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Badge, Button, ButtonLink, Card, PageHeader, SectionTitle } from "@/components/ui";
import { content, displayNumber, lessonsOf, moduleById } from "@/content";
import type { CheckpointItem, QuestionItem } from "@/content/schema";
import { db } from "@/db";
import { RETAKE_HOURS, scoreCheckpoint, type CheckpointScore } from "@/engine/gates";
import { grade, isAnswered, type Response } from "@/learn/grading";
import { QuestionView } from "@/learn/QuestionView";
import { useDayPlan, useLearning } from "@/hooks/learning";
import { formatDate } from "@/hooks/data";
import { recordAttempt } from "@/lesson/context";
import { NotFound } from "./NotFound";

const LazyCodeExercise = lazy(() => import("@/exercise/CodeExercise").then((m) => ({ default: m.CodeExercise })));

type Phase = "intro" | "answer" | "assess" | "result";
type Form = "A" | "B";

interface Attempt {
  kind: "immediate" | "delayed";
  form: Form;
  items: CheckpointItem[];
  startedAt: string;
  failsBefore: number;
}

interface ExerciseState {
  checks: number;
  solved: boolean;
}

const MAX_COUNTED_CHECKS = 3;

function shuffle<T>(xs: T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const isQuestion = (i: CheckpointItem): i is QuestionItem => i.kind !== "exercise";

export function Checkpoint() {
  const { moduleId = "" } = useParams();
  const cp = content.checkpoints[moduleId];
  const plan = moduleById(moduleId);
  const learning = useLearning();
  const { next } = useDayPlan();
  const st = learning.modules[moduleId];
  const [phase, setPhase] = useState<Phase>("intro");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [exercises, setExercises] = useState<Record<string, ExerciseState>>({});
  const [result, setResult] = useState<CheckpointScore | null>(null);
  const [saving, setSaving] = useState(false);
  const rows = useMemo(() => learning.checkpointRows.filter((r) => r.moduleId === moduleId).sort((a, b) => b.startedAt.localeCompare(a.startedAt)), [learning.checkpointRows, moduleId]);

  if (!cp || !plan || !st) return <NotFound />;
  const title = content.modules[moduleId]?.title ?? plan.title;
  const gate = st.gate!;

  const begin = () => {
    const kind = st.delayedDue ? "delayed" : "immediate";
    let form: Form;
    if (kind === "delayed") {
      const pass = rows.find((r) => r.kind === "immediate" && r.passed);
      form = (pass?.details as { form?: Form } | undefined)?.form === "B" ? "A" : "B";
    } else {
      form = rows.filter((r) => r.kind === "immediate").length % 2 === 0 ? "A" : "B";
    }
    const items = form === "B" && cp.delayedItems?.length ? cp.delayedItems : cp.items;
    setAttempt({ kind, form, items: shuffle(items), startedAt: new Date().toISOString(), failsBefore: rows.filter((r) => r.kind === "immediate" && !r.passed).length });
    setResponses({});
    setExercises({});
    setResult(null);
    setPhase("answer");
    window.scrollTo({ top: 0 });
  };

  const answered = (item: CheckpointItem) => (isQuestion(item) ? isAnswered(item, responses[item.id]) : (exercises[item.id]?.checks ?? 0) > 0);
  const answeredCount = attempt ? attempt.items.filter(answered).length : 0;
  const allAnswered = !!attempt && answeredCount === attempt.items.length;
  const hasExplain = !!attempt?.items.some((i) => i.kind === "explain");

  const finish = async () => {
    if (!attempt || saving) return;
    setSaving(true);
    const outcomes: Record<string, { score: number }> = {};
    for (const item of attempt.items) {
      outcomes[item.id] = { score: isQuestion(item) ? grade(item, responses[item.id]).score : exercises[item.id]?.solved ? 1 : 0 };
    }
    const threshold = attempt.kind === "delayed" ? cp.delayedThreshold : cp.passThreshold;
    const score = scoreCheckpoint(attempt.items, outcomes, threshold);
    await db.checkpoints.add({ moduleId, kind: attempt.kind, startedAt: attempt.startedAt, score: score.score, passed: score.passed, details: { form: attempt.form, outcomes, reasons: score.reasons, responses } });
    const seconds = (Date.now() - new Date(attempt.startedAt).getTime()) / 1000 / attempt.items.length;
    for (const item of attempt.items) {
      const s = outcomes[item.id]!.score;
      const ex = item.kind === "exercise" ? content.exercises.find((e) => e.id === item.id) : undefined;
      void recordAttempt({
        itemId: `cp:${moduleId}/${item.id}`,
        kind: "checkpoint",
        correct: item.kind === "explain" ? s >= 0.75 : s >= 1,
        score: s,
        seconds,
        skills: isQuestion(item) ? item.concepts : (ex?.concepts ?? []),
        payload: { format: item.kind, form: attempt.form, gate: attempt.kind },
      });
    }
    setResult(score);
    setPhase("result");
    setSaving(false);
    window.scrollTo({ top: 0 });
  };

  const header = (
    <>
      <Link to={`/learn/${moduleId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Module {displayNumber[moduleId]} · {title}
      </Link>
      <PageHeader eyebrow={attempt?.kind === "delayed" || (phase === "intro" && st.delayedDue) ? "Delayed confirmation" : "Mastery gate"} title={`Checkpoint: ${title}`} />
    </>
  );

  if (phase === "intro") {
    const remaining = lessonsOf(moduleId).filter((l) => !learning.completed.has(l.id));
    const passRow = rows.find((r) => r.kind === "immediate" && r.passed);
    return (
      <div className="mx-auto max-w-3xl">
        {header}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Card className="flex flex-col gap-4">
            {!st.unlocked ? (
              <p className="flex items-start gap-2 text-sm text-muted">
                <Lock size={16} className="mt-0.5 shrink-0" /> Locked until you pass the checkpoint for{" "}
                {st.blockedBy ? (
                  <Link className="text-accent underline" to={`/learn/${st.blockedBy}/checkpoint`}>
                    Module {displayNumber[st.blockedBy]}
                  </Link>
                ) : (
                  "the previous module"
                )}
                .
              </p>
            ) : gate.status === "confirmed" ? (
              <p className="flex items-start gap-2 text-sm">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" /> Passed and confirmed after a delay. This module is mastered.
              </p>
            ) : st.delayedDue ? (
              <p className="text-sm text-muted">You passed this gate{passRow ? ` on ${formatDate(passRow.startedAt.slice(0, 10))}` : ""}. A shorter parallel form now checks that it stuck. You need {Math.round(cp.delayedThreshold * 100)}%.</p>
            ) : gate.status === "passed" ? (
              <p className="flex items-start gap-2 text-sm">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" /> Passed. The delayed confirmation opens {gate.delayedDueAt ? when(gate.delayedDueAt) : "in a few days"}.
              </p>
            ) : gate.status === "retake-wait" ? (
              <p className="flex items-start gap-2 text-sm text-muted">
                <Clock size={16} className="mt-0.5 shrink-0" /> Retake opens {gate.retakeAt ? when(gate.retakeAt) : "tomorrow"}. The missed concepts are in your practice queue until then.
              </p>
            ) : !st.lessonsComplete && !st.allowTestOut ? (
              <div className="text-sm text-muted">
                Finish the module's lessons first ({st.lessonsDone} of {st.lessonsTotal} done):
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
                  {remaining.map((l) => (
                    <li key={l.id}>
                      <Link className="text-accent hover:underline" to={`/learn/${moduleId}/${l.id.split("/")[1]}`}>
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <>
                {gate.status === "provisional" && <p className="text-sm text-muted">You've moved on provisionally after two attempts. Passing now makes it official.</p>}
                <p className="text-sm text-muted">
                  {cp.items.length} questions, about 20 minutes. Closed book: no lessons, notes or hints. Answer everything, then submit once.
                </p>
              </>
            )}
            {(st.ready || st.delayedDue) && (
              <div>
                <Button variant="primary" onClick={begin} data-testid="begin-checkpoint">
                  <ShieldCheck size={16} /> {st.delayedDue ? "Begin delayed check" : gate.failedAttempts ? "Begin retake" : "Begin checkpoint"}
                </Button>
              </div>
            )}
          </Card>
          <Card>
            <SectionTitle>To pass</SectionTitle>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
              <li>at least {Math.round(cp.passThreshold * 100)}% overall</li>
              <li>every item marked critical right</li>
              <li>at least one transfer item (a new context) right</li>
              <li>an explanation that hits 3 of 4 rubric points</li>
            </ul>
            <p className="mt-3 text-xs text-faint">Missed? Retake after {RETAKE_HOURS} h on a fresh form. After two misses you may move on provisionally.</p>
          </Card>
        </div>
        {rows.length > 0 && (
          <section className="mt-8">
            <SectionTitle>Attempts</SectionTitle>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  {r.passed ? <CheckCircle2 size={16} className="text-accent" /> : <XCircle size={16} className="text-heat" />}
                  <span className="flex-1">{when(r.startedAt)}</span>
                  <Badge>{r.kind === "delayed" ? "delayed" : "gate"}</Badge>
                  <span className="w-12 text-right tabular-nums">{Math.round(r.score * 100)}%</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }

  if (!attempt) return null;
  const review = phase === "result";

  return (
    <div className="mx-auto max-w-3xl">
      {header}
      {phase === "result" && result && (
        <Card className={clsx("mb-6 border-2", result.passed ? "border-accent/50" : "border-heat/50")} data-testid="checkpoint-result">
          <div className="flex items-center gap-2 text-xl font-semibold">
            {result.passed ? <CheckCircle2 className="text-accent" /> : <XCircle className="text-heat" />}
            {result.passed ? (attempt.kind === "delayed" ? "Confirmed" : "Passed") : "Not yet"} · {Math.round(result.score * 100)}%
          </div>
          {result.reasons.length > 0 && (
            <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm text-muted">
              {result.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-muted">
            {result.passed
              ? attempt.kind === "delayed"
                ? "The skill held up after a delay. This module is mastered."
                : "The next module is unlocked. A shorter delayed check in 3–7 days confirms it stuck."
              : attempt.kind === "delayed"
                ? "Your pass stands. The missed concepts get extra practice, and the delayed check returns in 3 days."
                : attempt.failsBefore + 1 >= 2
                  ? "You can move on provisionally; the gate stays open for a retake after 24 hours."
                  : "Retake after 24 hours on a fresh form. Until then, your misses feed daily practice."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {next ? (
              <ButtonLink variant="primary" to={next.href}>
                Next: {next.title} <ArrowRight size={16} />
              </ButtonLink>
            ) : (
              <ButtonLink to="/">Back to Today</ButtonLink>
            )}
            <ButtonLink variant="ghost" to={`/learn/${moduleId}`}>
              Module page
            </ButtonLink>
          </div>
        </Card>
      )}

      {phase === "assess" && (
        <Card className="mb-6 border-info/40 bg-info-soft">
          <div className="font-medium text-info">One more step: score your explanation</div>
          <p className="mt-1 text-sm text-muted">Compare what you wrote with the rubric and tick only the points you actually made. Honest scoring is what makes the gate mean something.</p>
        </Card>
      )}

      <ol className="flex flex-col gap-4">
        {attempt.items.map((item, i) =>
          isQuestion(item) ? (
            <li key={item.id}>
              <QuestionView
                item={item}
                mode="checkpoint"
                number={i + 1}
                testId={`cp-item-${item.id}`}
                phase={review ? "review" : phase === "assess" ? "assess" : "answer"}
                value={responses[item.id]}
                onChange={(r) => setResponses((m) => ({ ...m, [item.id]: r }))}
              />
              <div className="mt-1 flex gap-1.5 pl-1">
                {item.critical && <Badge tone="heat">critical</Badge>}
                {item.kind !== "explain" && item.transfer && <Badge tone="violet">transfer</Badge>}
              </div>
            </li>
          ) : (
            <li key={item.id} className="rounded-xl border border-line p-3">
              <div className="mb-1 flex items-center gap-2 text-sm text-faint">
                <span className="tabular-nums">{i + 1}.</span> Code: counts if it passes within {MAX_COUNTED_CHECKS} checks
                {item.critical && <Badge tone="heat">critical</Badge>}
                {review && (exercises[item.id]?.solved ? <Badge tone="success">passed</Badge> : <Badge tone="danger">not passed</Badge>)}
              </div>
              {!review && (
                <Suspense fallback={<div className="p-6 text-center text-sm text-faint">Loading exercise…</div>}>
                  <LazyCodeExercise
                    id={item.id}
                    mode="checkpoint"
                    onResult={(r) => setExercises((m) => ({ ...m, [item.id]: { checks: r.checks, solved: (m[item.id]?.solved ?? false) || (r.allPassed && r.checks <= MAX_COUNTED_CHECKS) } }))}
                  />
                </Suspense>
              )}
            </li>
          ),
        )}
      </ol>

      {phase !== "result" && (
        <div className="sticky bottom-20 mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface/95 p-3 backdrop-blur md:bottom-4">
          <span className="text-sm text-muted tabular-nums">
            {answeredCount} of {attempt.items.length} answered
          </span>
          {phase === "answer" ? (
            <Button variant="primary" className="ml-auto" disabled={!allAnswered} onClick={() => (hasExplain ? (setPhase("assess"), window.scrollTo({ top: 0 })) : void finish())} data-testid="submit-checkpoint">
              Submit answers
            </Button>
          ) : (
            <Button variant="primary" className="ml-auto" disabled={saving} onClick={() => void finish()} data-testid="finish-checkpoint">
              Finish and score
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
