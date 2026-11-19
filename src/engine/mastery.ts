/**
 * Per-skill mastery with Bayesian knowledge tracing (Corbett & Anderson 1995). PLAN.md §8.6.
 *
 * Each skill has P(known). An attempt updates it with Bayes' rule given slip/guess rates
 * for that item kind, then the learning transition adds a chance the skill was just learned.
 * Only the first attempt at an item on a given day counts; hints discount the evidence.
 */
import type { AttemptRow } from "@/db";

export interface BktParams {
  pInit: number;
  pTransit: number;
  pSlip: number;
  pGuess: number;
}

/** Guessing is easy on multiple choice and nearly impossible on code that must pass tests. */
export const BKT_BY_KIND: Record<string, BktParams> = {
  predict: { pInit: 0.2, pTransit: 0.12, pSlip: 0.1, pGuess: 0.3 },
  check: { pInit: 0.2, pTransit: 0.12, pSlip: 0.1, pGuess: 0.25 },
  practice: { pInit: 0.2, pTransit: 0.12, pSlip: 0.1, pGuess: 0.25 },
  exit: { pInit: 0.2, pTransit: 0.1, pSlip: 0.1, pGuess: 0.15 },
  checkpoint: { pInit: 0.2, pTransit: 0.1, pSlip: 0.08, pGuess: 0.15 },
  code: { pInit: 0.2, pTransit: 0.18, pSlip: 0.1, pGuess: 0.05 },
  parsons: { pInit: 0.2, pTransit: 0.15, pSlip: 0.1, pGuess: 0.1 },
  derivation: { pInit: 0.2, pTransit: 0.15, pSlip: 0.1, pGuess: 0.05 },
};
const DEFAULT_PARAMS = BKT_BY_KIND.check!;

/** A typed numeric answer is hard to guess; a self-rated explanation sits in between. */
function paramsFor(a: AttemptRow): BktParams {
  const base = BKT_BY_KIND[a.kind] ?? DEFAULT_PARAMS;
  const format = (a.payload as { format?: string } | undefined)?.format;
  if (format === "numeric") return { ...base, pGuess: 0.05 };
  if (format === "explain") return { ...base, pGuess: 0.15 };
  return base;
}

export const MASTERED = 0.95;
export const WEAK = 0.7;

export function bktUpdate(p: number, correct: boolean, k: BktParams): number {
  const posterior = correct ? (p * (1 - k.pSlip)) / (p * (1 - k.pSlip) + (1 - p) * k.pGuess) : (p * k.pSlip) / (p * k.pSlip + (1 - p) * (1 - k.pGuess));
  return posterior + (1 - posterior) * k.pTransit;
}

export interface SkillMastery {
  skill: string;
  p: number;
  attempts: number;
  correct: number;
  lastAt: string;
}

function hintTier(a: AttemptRow): number {
  const fromPayload = (a.payload as { hintTier?: number } | undefined)?.hintTier;
  return Math.max(a.hintTier ?? 0, fromPayload ?? 0);
}

export function computeMastery(attempts: AttemptRow[]): Map<string, SkillMastery> {
  const sorted = [...attempts].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const seen = new Set<string>();
  const out = new Map<string, SkillMastery>();
  for (const a of sorted) {
    const episode = `${a.itemId}@${a.submittedAt.slice(0, 10)}`;
    if (seen.has(episode)) continue; // first attempt per item per day
    seen.add(episode);
    const params = paramsFor(a);
    const tier = hintTier(a);
    const correct = a.correct && tier < 3; // bottom-out help counts as not knowing it
    for (const skill of a.skills) {
      const cur = out.get(skill) ?? { skill, p: params.pInit, attempts: 0, correct: 0, lastAt: a.submittedAt };
      let next = bktUpdate(cur.p, correct, params);
      if (correct && tier > 0) next = cur.p + 0.5 * (next - cur.p); // hinted success: half the evidence
      out.set(skill, { skill, p: next, attempts: cur.attempts + 1, correct: cur.correct + (correct ? 1 : 0), lastAt: a.submittedAt });
    }
  }
  return out;
}

export function skillLevel(m: SkillMastery | undefined): "unseen" | "weak" | "developing" | "mastered" {
  if (!m) return "unseen";
  if (m.p >= MASTERED) return "mastered";
  if (m.p < WEAK) return "weak";
  return "developing";
}

/** Skills with evidence but below WEAK, weakest first. */
export function weakSkills(m: Map<string, SkillMastery>): SkillMastery[] {
  return [...m.values()].filter((s) => s.p < WEAK).sort((a, b) => a.p - b.p);
}

/** Mean P(known) over a module's concepts (unseen concepts count as the prior). */
export function moduleMastery(concepts: string[], m: Map<string, SkillMastery>): number {
  if (!concepts.length) return 0;
  return concepts.reduce((s, c) => s + (m.get(c)?.p ?? DEFAULT_PARAMS.pInit), 0) / concepts.length;
}
