/**
 * Components available inside lesson MDX. See PLAN.md §9.2 for the authoring format.
 */
import clsx from "clsx";
import { Building2, Check as CheckIcon, Lightbulb, Radio, Wrench, X } from "lucide-react";
import { lazy, Suspense, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { content } from "@/content";
import { draftCard } from "@/engine/cards";
import { QuestionView } from "@/learn/QuestionView";
import { questionAttemptId } from "@/learn/state";
import { vizRegistry } from "@/viz/registry";
import { recordAttempt, useLesson } from "./context";

/* ---------- Callouts ---------- */

export function Situation({ from = "Kestrel Ridge ops channel", children }: { from?: string; children: ReactNode }) {
  return (
    <div className="not-prose my-6 rounded-2xl border border-line bg-surface-2 p-4 sm:p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-faint uppercase">
        <Building2 size={14} /> {from}
      </div>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

function Callout({ icon, title, tone, children }: { icon: ReactNode; title: string; tone: "violet" | "heat" | "accent" | "info"; children: ReactNode }) {
  const toneCls = {
    violet: "border-violet/40 bg-violet-soft",
    heat: "border-heat/40 bg-heat-soft",
    accent: "border-accent/40 bg-accent-soft",
    info: "border-info/40 bg-info-soft",
  }[tone];
  const textCls = { violet: "text-violet", heat: "text-heat", accent: "text-accent", info: "text-info" }[tone];
  return (
    <aside className={clsx("my-6 rounded-2xl border p-4 sm:p-5", toneCls)}>
      <div className={clsx("mb-1.5 flex items-center gap-2 text-sm font-semibold", textCls)}>
        {icon} {title}
      </div>
      <div className="text-[15px] leading-relaxed [&>p+p]:mt-2">{children}</div>
    </aside>
  );
}

export function Bridge({ title = "Engineering bridge", children }: { title?: string; children: ReactNode }) {
  return (
    <Callout icon={<Radio size={16} />} title={title} tone="violet">
      {children}
    </Callout>
  );
}

export function Craft({ title = "Craft", children }: { title?: string; children: ReactNode }) {
  return (
    <Callout icon={<Wrench size={16} />} title={title} tone="heat">
      {children}
    </Callout>
  );
}

export function KeyIdea({ title = "Key idea", children }: { title?: string; children: ReactNode }) {
  return (
    <Callout icon={<Lightbulb size={16} />} title={title} tone="accent">
      {children}
    </Callout>
  );
}

export function Figure({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className="my-6">
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface p-4">{children}</div>
      {caption && <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

/* ---------- Predict → explore → explain ---------- */

export function Predict({ id, question, options, answer, explain }: { id: string; question: string; options: string[]; answer: number; explain: ReactNode }) {
  const lesson = useLesson();
  const [choice, setChoice] = useState<number | null>(null);
  const [committed, setCommitted] = useState(false);
  const started = useRef(Date.now());
  const commit = () => {
    if (choice === null) return;
    setCommitted(true);
    const itemId = `${lesson.lessonId}#${id}`;
    void recordAttempt({ itemId, kind: "predict", correct: choice === answer, seconds: (Date.now() - started.current) / 1000, skills: lesson.concepts, payload: { choice } });
    if (choice !== answer && lesson.lessonId) {
      // A wrong prediction becomes a draft card you approve or edit at exit recall.
      const back = `${options[answer] ?? ""}.${typeof explain === "string" ? ` ${explain}` : ""}`;
      void draftCard({ id: `predict:${itemId}`, source: `predict:${itemId}`, front: question, back, concepts: lesson.concepts }, new Date());
    }
  };
  return (
    <div className="not-prose my-6 rounded-2xl border border-line bg-surface p-4 sm:p-5" data-testid={`predict-${id}`}>
      <div className="mb-1 text-xs font-semibold tracking-wider text-info uppercase">Predict first</div>
      <div className="mb-3 font-medium">{question}</div>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={question}>
        {options.map((o, i) => {
          const isAnswer = committed && i === answer;
          const isWrongPick = committed && i === choice && i !== answer;
          return (
            <button
              key={o}
              role="radio"
              aria-checked={choice === i}
              disabled={committed}
              onClick={() => setChoice(i)}
              className={clsx(
                "flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                isAnswer ? "border-accent bg-accent-soft" : isWrongPick ? "border-danger bg-danger-soft" : choice === i ? "border-line-strong bg-surface-3" : "border-line hover:border-line-strong",
              )}
            >
              <span>{o}</span>
              {isAnswer && <CheckIcon size={16} className="text-accent" />}
              {isWrongPick && <X size={16} className="text-danger" />}
            </button>
          );
        })}
      </div>
      {!committed ? (
        <Button variant="primary" className="mt-3" disabled={choice === null} onClick={commit}>
          Commit prediction
        </Button>
      ) : (
        <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm leading-relaxed">
          <span className={clsx("font-semibold", choice === answer ? "text-accent" : "text-heat")}>{choice === answer ? "You predicted it. " : "Not quite. "}</span>
          {explain}
        </div>
      )}
    </div>
  );
}

/* ---------- Retrieval checks ---------- */

/** Retrieval questions from the module's question pool (content/modules/<id>/questions.json). */
export function Check({ title = "Check yourself", items }: { title?: string; items: string[] }) {
  const lesson = useLesson();
  const questions = items.map((id) => ({ id, q: content.questions[`${lesson.moduleId}/${id}`] }));
  return (
    <section className="not-prose my-8 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-3 text-xs font-semibold tracking-wider text-accent uppercase">{title}</div>
      <ol className="flex flex-col gap-3">
        {questions.map(({ id, q }) =>
          q ? (
            <li key={q.key}>
              <QuestionView
                item={q}
                mode="lesson"
                testId={`check-${id}`}
                onGraded={(g) =>
                  void recordAttempt({ itemId: questionAttemptId(q), kind: "check", correct: g.correct, score: g.score, seconds: g.seconds, skills: q.concepts, payload: { format: q.kind, response: g.response, lessonId: lesson.lessonId } })
                }
              />
            </li>
          ) : (
            <li key={id} className="text-sm text-danger">
              Unknown question "{id}".
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

/* ---------- Interactive explainers and code ---------- */

export function Viz({ name, ...props }: { name: string } & Record<string, unknown>) {
  const Component = vizRegistry[name];
  if (!Component) {
    return (
      <div className="my-6 rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
        Interactive explainer <code>{name}</code> is coming with a later build.
      </div>
    );
  }
  return (
    <div className="not-prose my-6">
      <Suspense fallback={<div className="rounded-2xl border border-line p-6 text-center text-sm text-faint">Loading explainer…</div>}>
        <Component {...props} />
      </Suspense>
    </div>
  );
}

// The editor and Python runtime are code-split so prose-only lessons stay light.
const LazyCodeExercise = lazy(() => import("@/exercise/CodeExercise").then((m) => ({ default: m.CodeExercise })));

export function CodeExercise({ id }: { id: string }) {
  return (
    <Suspense fallback={<div className="my-8 rounded-2xl border border-line p-6 text-center text-sm text-faint">Loading exercise…</div>}>
      <LazyCodeExercise id={id} />
    </Suspense>
  );
}

export const lessonComponents = { Situation, Bridge, Craft, KeyIdea, Figure, Predict, Check, Viz, CodeExercise };
