/**
 * Practice: weak spots, the challenge, drills by concept, and the mixed-practice session
 * (5–8 interleaved questions with a confidence rating before each answer).
 */
import clsx from "clsx";
import { ArrowLeft, ArrowRight, CheckCircle2, Dumbbell, Shuffle, Swords, Target } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Badge, Button, ButtonLink, Card, EmptyState, PageHeader, ProgressBar, SectionTitle } from "@/components/ui";
import { content, displayNumber } from "@/content";
import { MASTERED, skillLevel, weakSkills } from "@/engine/mastery";
import { selectPractice } from "@/engine/practice";
import { CONFIDENCE_LABELS } from "@/learn/grading";
import { QuestionView, type GradedAnswer } from "@/learn/QuestionView";
import { conceptTitle, pickChallenge, practiceCandidates, questionAttemptId } from "@/learn/state";
import { markItemDone, useDayPlan, useLearning, useNow } from "@/hooks/learning";
import { recordAttempt } from "@/lesson/context";
import type { PoolQuestion } from "@/content/schema";
import { NotFound } from "./NotFound";

const LazyCodeExercise = lazy(() => import("@/exercise/CodeExercise").then((m) => ({ default: m.CodeExercise })));

function levelTone(p: number | undefined): "accent" | "heat" | "neutral" {
  if (p === undefined) return "neutral";
  return p >= MASTERED ? "accent" : p < 0.7 ? "heat" : "neutral";
}

export function Practice() {
  const learning = useLearning();
  const now = useNow();
  const pool = useMemo(() => practiceCandidates(learning, learning.attempts), [learning]);
  const weak = weakSkills(learning.mastery);
  const challenge = pickChallenge(learning.attempts, now);
  const met = content.exercises.filter((e) => learning.attempts.some((a) => a.itemId === e.id));
  const introduced = [...learning.introduced].sort((a, b) => (learning.mastery.get(a)?.p ?? 0) - (learning.mastery.get(b)?.p ?? 0));

  return (
    <div>
      <PageHeader eyebrow="Interleaved practice" title="Practice">
        Mixed questions across everything you've learned, weighted toward what's slipping.
      </PageHeader>
      {pool.length === 0 && met.length === 0 ? (
        <EmptyState title="Nothing to practice yet" icon={<Target size={28} />}>
          Practice draws on lessons you've completed. Start with <Link to="/learn" className="text-accent underline">the first module</Link>.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5">
                <Shuffle size={14} /> Mixed practice
              </span>
            </SectionTitle>
            <p className="text-sm text-muted">
              {pool.length} question{pool.length === 1 ? "" : "s"} available from your completed lessons. You rate your confidence before each answer, which trains calibration.
            </p>
            <div>
              <ButtonLink variant="primary" to={`/practice/session?n=${Math.min(8, pool.length)}`} aria-disabled={pool.length === 0}>
                Start {Math.min(8, pool.length)} questions <ArrowRight size={16} />
              </ButtonLink>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5">
                <Dumbbell size={14} /> Weak spots
              </span>
            </SectionTitle>
            {weak.length ? (
              <>
                <ul className="flex flex-col gap-2">
                  {weak.slice(0, 5).map((s) => (
                    <li key={s.skill} className="text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <Link to={`/practice/session?mode=drill&concept=${s.skill}`} className="truncate hover:text-accent">
                          {conceptTitle(s.skill)}
                        </Link>
                        <span className="shrink-0 text-xs text-faint tabular-nums">{Math.round(s.p * 100)}%</span>
                      </div>
                      <ProgressBar className="mt-1" tone="heat" value={s.p} label={`${conceptTitle(s.skill)} mastery`} />
                    </li>
                  ))}
                </ul>
                <div>
                  <ButtonLink to="/practice/session?mode=drill&n=10">Drill weak spots</ButtonLink>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">No weak skills right now. Misses in lessons, practice and checkpoints show up here.</p>
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5">
                <Swords size={14} /> Challenge
              </span>
            </SectionTitle>
            {challenge ? (
              <>
                <div>
                  <div className="font-medium">{challenge.title}</div>
                  <p className="mt-1 text-sm text-muted">Re-solve it from a blank editor, no notes. Two or more days after you first met it, this is retrieval practice for code.</p>
                </div>
                <div>
                  <ButtonLink to={`/practice/exercise/${challenge.id}?challenge=1`}>Take the challenge</ButtonLink>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">Challenges are exercises you met at least two days ago, re-solved from scratch. The first one appears two days after your first code exercise.</p>
            )}
          </Card>

          {met.length > 0 && (
            <Card className="flex flex-col gap-3">
              <SectionTitle>Exercises you've met</SectionTitle>
              <ul className="flex flex-col divide-y divide-line">
                {met.map((e) => {
                  const solved = learning.attempts.some((a) => a.itemId === e.id && a.correct);
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <Link to={`/practice/exercise/${e.id}`} className="truncate hover:text-accent">
                        <span className="mr-2 text-faint">{displayNumber[e.moduleId]}</span>
                        {e.title}
                      </Link>
                      {solved ? <Badge tone="success">solved</Badge> : <Badge>attempted</Badge>}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          {introduced.length > 0 && (
            <Card className="flex flex-col gap-3 lg:col-span-2">
              <SectionTitle>Drill by concept</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {introduced.map((c) => {
                  const m = learning.mastery.get(c);
                  return (
                    <Link
                      key={c}
                      to={`/practice/session?mode=drill&concept=${c}`}
                      className={clsx("rounded-full border px-3 py-1 text-xs transition-colors hover:border-line-strong", levelTone(m?.p) === "heat" ? "border-heat/40 text-heat" : levelTone(m?.p) === "accent" ? "border-accent/40 text-accent" : "border-line text-muted")}
                      title={m ? `${Math.round(m.p * 100)}% · ${skillLevel(m)}` : "no evidence yet"}
                    >
                      {conceptTitle(c)}
                    </Link>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Session ---------- */

interface Answered {
  key: string;
  correct: boolean;
  confidence?: number;
}

export function PracticeSession() {
  const [params] = useSearchParams();
  const mode = params.get("mode") === "drill" ? "drill" : "mixed";
  const concept = params.get("concept");
  const n = Math.max(1, Math.min(20, Number(params.get("n")) || 8));
  const learning = useLearning();
  const { plan } = useDayPlan();
  const [keys, setKeys] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<Answered[]>([]);
  const [startedAt] = useState(() => Date.now());

  // Freeze the selection once stored progress and attempts have loaded.
  useEffect(() => {
    if (keys || !learning.loaded) return;
    const pool = practiceCandidates(learning, learning.attempts);
    const focus = concept ? [concept] : mode === "drill" ? weakSkills(learning.mastery).map((s) => s.skill) : undefined;
    setKeys(selectPractice(pool, { n, currentModuleIndex: learning.currentModuleIndex, mastery: (c) => learning.mastery.get(c)?.p, now: new Date(), focus: focus?.length ? focus : undefined }));
  }, [keys, learning, n, mode, concept]);

  const items = useMemo(() => (keys ?? []).map((k) => content.questions[k]).filter((q): q is PoolQuestion => !!q), [keys]);
  const current = items[index];
  const done = keys !== null && index >= items.length && items.length > 0;
  const planKey = mode === "drill" ? "drill" : "practice";

  useEffect(() => {
    if (!done) return;
    const planned = plan.items.find((i) => i.key === planKey)?.minutes;
    void markItemDone(planKey, planned ?? Math.max(1, Math.round((Date.now() - startedAt) / 60_000)));
  }, [done, plan.items, planKey, startedAt]);

  const onGraded = (q: PoolQuestion, g: GradedAnswer) => {
    setAnswered((a) => [...a, { key: q.key, correct: g.correct, confidence: g.confidence }]);
    void recordAttempt({ itemId: questionAttemptId(q), kind: "practice", correct: g.correct, score: g.score, seconds: g.seconds, skills: q.concepts, confidence: g.confidence, payload: { format: q.kind, response: g.response, mode } });
  };

  const title = concept ? `Drill: ${conceptTitle(concept)}` : mode === "drill" ? "Weakness drill" : "Mixed practice";
  const right = answered.filter((a) => a.correct).length;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/practice" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Practice
      </Link>
      <PageHeader eyebrow={mode === "drill" ? "Focused drill" : "Interleaved practice"} title={title} />
      {keys === null ? (
        <p className="text-sm text-faint">Choosing questions…</p>
      ) : items.length === 0 ? (
        <EmptyState title="No questions available">Complete a lesson first; its questions join the practice pool.</EmptyState>
      ) : current ? (
        <div>
          <div className="mb-3 flex items-center gap-3 text-xs text-faint">
            <span className="shrink-0 whitespace-nowrap tabular-nums">
              {index + 1} of {items.length}
            </span>
            <ProgressBar className="max-w-48" value={index / items.length} label="Practice progress" />
            <span className="ml-auto min-w-0 truncate">{content.modules[current.moduleId]?.title}</span>
          </div>
          <QuestionView key={current.key} item={current} mode="practice" testId="practice-question" onGraded={(g) => onGraded(current, g)} />
          {answered.length > index && (
            <Button variant="primary" className="mt-4" onClick={() => setIndex((i) => i + 1)}>
              {index + 1 < items.length ? "Next question" : "See results"} <ArrowRight size={16} />
            </Button>
          )}
        </div>
      ) : (
        <Card className="flex flex-col gap-4" data-testid="practice-summary">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <CheckCircle2 size={22} className="text-accent" /> {right} of {answered.length} right
          </div>
          <ul className="flex flex-col gap-1.5 text-sm">
            {[1, 2, 3, 4].map((c) => {
              const bin = answered.filter((a) => a.confidence === c);
              if (!bin.length) return null;
              return (
                <li key={c} className="flex justify-between rounded-lg bg-surface-2 px-3 py-2">
                  <span>{CONFIDENCE_LABELS[c - 1]}</span>
                  <span className="text-muted tabular-nums">
                    {bin.filter((a) => a.correct).length} of {bin.length} right
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-faint">Misses lower that skill's mastery estimate, so it comes back sooner in practice.</p>
          <div className="flex flex-wrap gap-2">
            <SessionNext fallback="/practice" />
          </div>
        </Card>
      )}
    </div>
  );
}

function SessionNext({ fallback }: { fallback: string }) {
  const { next } = useDayPlan();
  if (!next) return <ButtonLink to={fallback}>Done</ButtonLink>;
  return (
    <ButtonLink variant="primary" to={next.href}>
      Next: {next.title} <ArrowRight size={16} />
    </ButtonLink>
  );
}

/* ---------- Exercise page (challenge and re-solve) ---------- */

export function ExercisePage() {
  const { moduleId = "", slug = "" } = useParams();
  const [params] = useSearchParams();
  const challenge = params.get("challenge") === "1";
  const id = `${moduleId}/${slug}`;
  const ex = content.exercises.find((e) => e.id === id);
  if (!ex) return <NotFound />;
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/practice" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Practice
      </Link>
      <PageHeader eyebrow={challenge ? "Challenge of the day" : `Module ${displayNumber[ex.moduleId]} · re-solve`} title={ex.title}>
        {challenge ? "From a blank editor, without looking back at the lesson. Hints unlock after your first check, as usual." : "Your lesson draft is kept separately; this starts from the starter code."}
      </PageHeader>
      <Suspense fallback={<div className="rounded-2xl border border-line p-6 text-center text-sm text-faint">Loading exercise…</div>}>
        <LazyCodeExercise id={ex.id} mode="challenge" />
      </Suspense>
      <div className="mt-6">
        <SessionNext fallback="/practice" />
      </div>
    </div>
  );
}
