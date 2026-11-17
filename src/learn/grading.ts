/** Grading for question items (lesson checks, practice, checkpoints). Pure functions. */
import type { QuestionItem } from "@/content/schema";

/**
 * Parse a typed number leniently: "2.78", "2,78" (decimal comma), "12,600" (thousands),
 * "−3" (Unicode minus), "1e-3", and a trailing unit such as "2.78 m³/s".
 */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/[−–]/g, "-").replace(/\s+/g, "");
  if (/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?(?!\d)/.test(s)) s = s.replace(/,/g, "");
  else s = s.replace(",", ".");
  const m = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/i.exec(s);
  if (!m) return null;
  const x = Number(m[0]);
  return Number.isFinite(x) ? x : null;
}

export function numericCorrect(value: number, answer: number, tolerance = 0.02): boolean {
  return Math.abs(value - answer) <= tolerance * Math.max(Math.abs(answer), 1e-9);
}

/** What the learner gave: a choice index, a typed number, or rubric points ticked (explain). */
export type Response = { kind: "choice"; choice: number } | { kind: "numeric"; text: string } | { kind: "explain"; text: string; points: boolean[] };

export interface Graded {
  correct: boolean;
  /** 0..1 */
  score: number;
}

export function grade(item: QuestionItem, r: Response | undefined): Graded {
  if (!r) return { correct: false, score: 0 };
  if (item.kind === "choice" && r.kind === "choice") {
    const ok = r.choice === item.answer;
    return { correct: ok, score: ok ? 1 : 0 };
  }
  if (item.kind === "numeric" && r.kind === "numeric") {
    const x = parseNumber(r.text);
    const ok = x !== null && numericCorrect(x, item.answer, item.tolerance);
    return { correct: ok, score: ok ? 1 : 0 };
  }
  if (item.kind === "explain" && r.kind === "explain") {
    const score = r.points.filter(Boolean).length / 4;
    return { correct: score >= 0.75, score };
  }
  return { correct: false, score: 0 };
}

export function isAnswered(item: QuestionItem, r: Response | undefined): boolean {
  if (!r) return false;
  if (item.kind === "choice") return r.kind === "choice" && r.choice >= 0;
  if (item.kind === "numeric") return r.kind === "numeric" && parseNumber(r.text) !== null;
  return r.kind === "explain" && r.text.trim().split(/\s+/).length >= 15;
}

export function answerText(item: QuestionItem): string {
  if (item.kind === "choice") return item.options[item.answer] ?? "";
  if (item.kind === "numeric") return `${item.answer}${item.unit ? ` ${item.unit}` : ""}`;
  return item.rubric.join("; ");
}

export const CONFIDENCE_LABELS = ["Guessing", "Unsure", "Fairly sure", "Certain"] as const;
