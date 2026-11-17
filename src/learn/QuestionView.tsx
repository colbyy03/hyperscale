/**
 * One question (choice, numeric or explain), used by lesson checks, mixed practice and
 * checkpoints. Lesson and practice modes grade on the spot; checkpoint mode is controlled
 * by the parent and only shows feedback in the review phase.
 */
import clsx from "clsx";
import { Check as CheckIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { InlineText } from "@/components/InlineText";
import type { QuestionItem } from "@/content/schema";
import { answerText, CONFIDENCE_LABELS, grade, isAnswered, type Graded, type Response } from "./grading";

export interface GradedAnswer extends Graded {
  response: Response;
  confidence?: number;
  seconds: number;
}

type Phase = "answer" | "assess" | "review";

interface Props {
  item: QuestionItem;
  mode: "lesson" | "practice" | "checkpoint";
  number?: number;
  /** Lesson and practice modes: called once the learner checks an answer. */
  onGraded?: (g: GradedAnswer) => void;
  /** Checkpoint mode: controlled response and phase. */
  value?: Response;
  onChange?: (r: Response) => void;
  phase?: Phase;
  testId?: string;
}

const empty = (item: QuestionItem): Response =>
  item.kind === "choice" ? { kind: "choice", choice: -1 } : item.kind === "numeric" ? { kind: "numeric", text: "" } : { kind: "explain", text: "", points: [false, false, false, false] };

export function QuestionView({ item, mode, number, onGraded, value, onChange, phase: phaseProp, testId }: Props) {
  const controlled = mode === "checkpoint";
  const [local, setLocal] = useState<Response>(() => empty(item));
  const [confidence, setConfidence] = useState<number | null>(null);
  const [result, setResult] = useState<Graded | null>(null);
  const [rubricOpen, setRubricOpen] = useState(false);
  const started = useRef(Date.now());
  const response = controlled ? (value ?? empty(item)) : local;
  const setResponse = (r: Response) => (controlled ? onChange?.(r) : setLocal(r));
  const phase: Phase = controlled ? (phaseProp ?? "answer") : result ? "review" : rubricOpen ? "assess" : "answer";
  const locked = phase !== "answer";
  const showFeedback = phase === "review";

  const submit = () => {
    if (!isAnswered(item, response) && !(item.kind === "explain" && rubricOpen)) return;
    if (mode === "practice" && confidence === null) return;
    const g = grade(item, response);
    setResult(g);
    onGraded?.({ ...g, response, confidence: confidence ?? undefined, seconds: (Date.now() - started.current) / 1000 });
  };

  const choice = response.kind === "choice" ? response.choice : -1;
  const correct = result?.correct ?? (showFeedback ? grade(item, response).correct : undefined);

  return (
    <div className="rounded-xl border border-line p-3.5 sm:p-4" data-testid={testId}>
      <div className="mb-2.5 flex gap-2 text-[15px] font-medium leading-relaxed">
        {number !== undefined && <span className="text-faint tabular-nums">{number}.</span>}
        <div className="[&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.88em]">
          <InlineText text={item.prompt} />
        </div>
      </div>

      {item.kind === "choice" && (
        <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={item.prompt}>
          {item.options.map((o, i) => {
            const isAnswer = showFeedback && i === item.answer;
            const wrongPick = showFeedback && i === choice && i !== item.answer;
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={choice === i}
                disabled={locked}
                onClick={() => setResponse({ kind: "choice", choice: i })}
                className={clsx(
                  "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  isAnswer ? "border-accent bg-accent-soft" : wrongPick ? "border-danger bg-danger-soft" : choice === i ? "border-line-strong bg-surface-3" : "border-line hover:border-line-strong",
                  locked && !isAnswer && !wrongPick && "opacity-80",
                )}
              >
                <span>{o}</span>
                {isAnswer && <CheckIcon size={15} className="shrink-0 text-accent" />}
                {wrongPick && <X size={15} className="shrink-0 text-danger" />}
              </button>
            );
          })}
        </div>
      )}

      {item.kind === "numeric" && response.kind === "numeric" && (
        <div className="flex items-center gap-2">
          <input
            inputMode="decimal"
            className="w-36 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-sm tabular-nums disabled:opacity-80"
            value={response.text}
            disabled={locked}
            onChange={(e) => setResponse({ kind: "numeric", text: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && !controlled && submit()}
            aria-label={item.prompt}
          />
          {item.unit && <span className="text-sm text-muted">{item.unit}</span>}
        </div>
      )}

      {item.kind === "explain" && response.kind === "explain" && (
        <div className="flex flex-col gap-2">
          <textarea
            className="min-h-28 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm leading-relaxed disabled:opacity-80"
            placeholder="Explain it as you would to a new teammate. Aim for 3–6 sentences."
            value={response.text}
            disabled={locked}
            onChange={(e) => setResponse({ ...response, text: e.target.value })}
            aria-label={item.prompt}
          />
          {phase !== "answer" && (
            <fieldset className="rounded-lg bg-surface-2 p-3">
              <legend className="px-1 text-xs font-semibold text-faint">Tick each point your explanation actually made</legend>
              {item.rubric.map((r, i) => (
                <label key={r} className="flex cursor-pointer items-start gap-2 py-1 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--accent)]"
                    checked={response.points[i] ?? false}
                    disabled={phase === "review"}
                    onChange={(e) => setResponse({ ...response, points: response.points.map((p, j) => (j === i ? e.target.checked : p)) })}
                  />
                  {r}
                </label>
              ))}
            </fieldset>
          )}
        </div>
      )}

      {mode === "practice" && phase === "answer" && (
        <div className="mt-3">
          <div className="mb-1.5 text-xs text-faint">How sure are you?</div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {CONFIDENCE_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                aria-pressed={confidence === i + 1}
                onClick={() => setConfidence(i + 1)}
                className={clsx("rounded-lg border px-2 py-1.5 text-xs transition-colors", confidence === i + 1 ? "border-info bg-info-soft text-info" : "border-line text-muted hover:border-line-strong")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!controlled && phase === "answer" && item.kind !== "explain" && (
        <Button className="mt-3" variant={mode === "practice" ? "primary" : "secondary"} disabled={!isAnswered(item, response) || (mode === "practice" && confidence === null)} onClick={submit}>
          Check
        </Button>
      )}
      {!controlled && item.kind === "explain" && phase === "answer" && (
        <Button className="mt-3" disabled={!isAnswered(item, response) || (mode === "practice" && confidence === null)} onClick={() => setRubricOpen(true)}>
          Compare with the rubric
        </Button>
      )}
      {!controlled && item.kind === "explain" && phase === "assess" && (
        <Button className="mt-3" variant="primary" onClick={submit}>
          Score my explanation
        </Button>
      )}

      {showFeedback && (
        <p className="mt-3 text-sm leading-relaxed">
          {item.kind === "explain" ? (
            <span className={clsx("font-semibold", correct ? "text-accent" : "text-heat")}>{`${(response.kind === "explain" ? response.points.filter(Boolean).length : 0)} of 4 points. `}</span>
          ) : (
            <span className={clsx("font-semibold", correct ? "text-accent" : "text-heat")}>{correct ? "Correct. " : `Answer: ${answerText(item)}. `}</span>
          )}
          {item.explain}
        </p>
      )}
    </div>
  );
}
