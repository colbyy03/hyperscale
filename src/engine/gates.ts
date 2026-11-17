/**
 * Mastery gates (PLAN.md §3.4): checkpoint scoring and the per-module gate state machine.
 *
 * Pass: ≥ passThreshold overall, every critical item correct, at least one transfer item
 * correct, and an explanation scoring ≥ 3/4. A delayed parallel form 3–7 days later confirms.
 * Failed: retake after 24 h; after two failed attempts the learner may advance provisionally.
 */
import type { CheckpointItem } from "@/content/schema";
import type { CheckpointRow } from "@/db";

export const RETAKE_HOURS = 24;
export const DELAYED_MIN_DAYS = 3;
export const PROVISIONAL_AFTER_FAILS = 2;

export interface ItemOutcome {
  /** 0..1 (choice/numeric/exercise are 0 or 1; explain is rubric points / 4). */
  score: number;
}

export interface CheckpointScore {
  score: number;
  passed: boolean;
  criticalOk: boolean;
  transferOk: boolean;
  explainOk: boolean;
  reasons: string[];
}

function itemId(item: CheckpointItem): string {
  return item.id;
}

export function scoreCheckpoint(items: CheckpointItem[], outcomes: Record<string, ItemOutcome | undefined>, threshold: number): CheckpointScore {
  const scoreOf = (i: CheckpointItem) => Math.max(0, Math.min(1, outcomes[itemId(i)]?.score ?? 0));
  const score = items.length ? items.reduce((s, i) => s + scoreOf(i), 0) / items.length : 0;
  const critical = items.filter((i) => i.critical);
  const criticalOk = critical.every((i) => scoreOf(i) >= 1);
  const transfer = items.filter((i) => i.kind !== "explain" && i.transfer);
  const transferOk = transfer.length === 0 || transfer.some((i) => scoreOf(i) >= 1);
  const explain = items.filter((i) => i.kind === "explain");
  const explainOk = explain.length === 0 || explain.some((i) => scoreOf(i) >= 0.75);
  const reasons: string[] = [];
  if (score < threshold) reasons.push(`Score ${Math.round(score * 100)}% is below the ${Math.round(threshold * 100)}% needed.`);
  if (!criticalOk) reasons.push(`Every critical item must be right: missed ${critical.filter((i) => scoreOf(i) < 1).map(itemId).join(", ")}.`);
  if (!transferOk) reasons.push("At least one transfer item (a new context) must be right.");
  if (!explainOk) reasons.push("Your explanation needs at least 3 of the 4 rubric points.");
  return { score, passed: reasons.length === 0, criticalOk, transferOk, explainOk, reasons };
}

export type GateStatus = "locked" | "open" | "retake-wait" | "passed" | "confirmed" | "provisional";

export interface GateState {
  status: GateStatus;
  /** When the delayed confirmation becomes available (status "passed"). */
  delayedDueAt?: string;
  /** When a retake becomes available (status "retake-wait"). */
  retakeAt?: string;
  failedAttempts: number;
  lastScore?: number;
}

const addHours = (iso: string, h: number) => new Date(new Date(iso).getTime() + h * 3_600_000).toISOString();

export function gateState(rows: CheckpointRow[], unlocked: boolean, now: Date): GateState {
  const sorted = [...rows].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const immediate = sorted.filter((r) => r.kind === "immediate");
  const delayed = sorted.filter((r) => r.kind === "delayed");
  const failedAttempts = immediate.filter((r) => !r.passed).length;
  const lastScore = sorted.at(-1)?.score;
  if (delayed.some((r) => r.passed)) return { status: "confirmed", failedAttempts, lastScore };
  const pass = immediate.find((r) => r.passed);
  if (pass) {
    // A failed delayed check doesn't revoke the pass: its objectives come back in daily practice
    // and the confirmation is offered again a few days later.
    const lastDelayed = delayed.at(-1);
    const from = lastDelayed && lastDelayed.startedAt > pass.startedAt ? lastDelayed.startedAt : pass.startedAt;
    return { status: "passed", delayedDueAt: addHours(from, DELAYED_MIN_DAYS * 24), failedAttempts, lastScore };
  }
  const last = immediate.at(-1);
  const waitUntil = last && !last.passed ? addHours(last.startedAt, RETAKE_HOURS) : undefined;
  const retakeAt = waitUntil && now.toISOString() < waitUntil ? waitUntil : undefined;
  // After two failed attempts you may move on; the gate stays open for a retake.
  if (failedAttempts >= PROVISIONAL_AFTER_FAILS) return { status: "provisional", retakeAt, failedAttempts, lastScore };
  if (retakeAt) return { status: "retake-wait", retakeAt, failedAttempts, lastScore };
  return { status: unlocked ? "open" : "locked", failedAttempts, lastScore };
}

/** True once a module no longer blocks the next one. */
export function isAdvanced(status: GateStatus): boolean {
  return status === "passed" || status === "confirmed" || status === "provisional";
}

export function delayedCheckDue(state: GateState, now: Date): boolean {
  return state.status === "passed" && !!state.delayedDueAt && now.toISOString() >= state.delayedDueAt;
}
