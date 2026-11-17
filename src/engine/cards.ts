/**
 * The review deck: enrolment, drafted cards, the daily queue and ratings. PLAN.md §3.5.
 *
 * Cards enter the deck when their lesson is completed, when an exercise exposes a known
 * misconception, or when a wrong prediction is turned into a card and approved at exit recall.
 * Both the new card state and a review-log entry are written on every rating.
 */
import { db as defaultDb, type CardRow, type HyperscaleDB, type ReviewLogRow } from "@/db";
import type { Grade, StoredCardState } from "./fsrs";
import { retentionFor } from "./retention";
import { localDay } from "./schedule";

// ts-fsrs loads on first use, so screens that only count due cards stay light.
const fsrs = () => import("./fsrs");

export interface CardText {
  front: string;
  back: string;
  concepts: string[];
  type?: string;
}

const LEARNING = 1;
const RELEARNING = 3;

export function fsrsState(row: CardRow): number | undefined {
  return (row.state as StoredCardState | null)?.state;
}

/**
 * New cards first come due at the next local midnight: the first retrieval should be spaced
 * from the lesson (same-day recall happens at exit recall instead).
 */
export function firstDue(now: Date): string {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
}

export function isActive(row: CardRow): boolean {
  return !row.draft && !row.suspended && !!row.state;
}

/** Add any of these cards not already in the deck. Returns how many were added. */
export async function enrollCards(defs: Array<{ id: string; critical?: boolean }>, source: string, now: Date, baseRetention: number, d: HyperscaleDB = defaultDb): Promise<number> {
  if (!defs.length) return 0;
  const existing = await d.cards.bulkGet(defs.map((c) => c.id));
  const missing = defs.filter((_, i) => !existing[i]);
  if (!missing.length) return 0;
  const rows: CardRow[] = [];
  const { newCardState } = await fsrs();
  for (const def of missing) {
    const state = await newCardState(now, retentionFor(def.critical, baseRetention));
    rows.push({ id: def.id, source, due: firstDue(now), state, critical: def.critical || undefined, createdAt: now.toISOString() });
  }
  if (rows.length) await d.cards.bulkPut(rows);
  return rows.length;
}

/** Turn a wrong prediction into a draft card (once). */
export async function draftCard(args: { id: string; source: string; front: string; back: string; concepts: string[] }, now: Date, d: HyperscaleDB = defaultDb): Promise<boolean> {
  if (await d.cards.get(args.id)) return false;
  await d.cards.put({ id: args.id, source: args.source, due: now.toISOString(), state: null, draft: true, front: args.front, back: args.back, concepts: args.concepts, createdAt: now.toISOString() });
  return true;
}

export async function approveDraft(id: string, edits: { front: string; back: string } | undefined, now: Date, baseRetention: number, d: HyperscaleDB = defaultDb): Promise<void> {
  const row = await d.cards.get(id);
  if (!row?.draft) return;
  const { newCardState } = await fsrs();
  const state = await newCardState(now, baseRetention);
  await d.cards.put({ ...row, ...(edits ?? {}), draft: false, state, due: firstDue(now) });
}

export async function discardDraft(id: string, d: HyperscaleDB = defaultDb): Promise<void> {
  const row = await d.cards.get(id);
  if (row?.draft) await d.cards.delete(id);
}

export async function setSuspended(id: string, suspended: boolean, d: HyperscaleDB = defaultDb): Promise<void> {
  await d.cards.update(id, { suspended: suspended || undefined });
}

/** New cards introduced (first reviewed) on a local day. */
export function newIntroducedOn(logs: ReviewLogRow[], day: string): number {
  return logs.filter((l) => l.prevState === 0 && localDay(l.reviewedAt) === day).length;
}

export interface Queue {
  /** Learning, review and relearning cards due now, oldest first. */
  due: CardRow[];
  /** New cards that have come due, up to today's allowance, in enrolment order. */
  fresh: CardRow[];
  /** Learning-step cards coming back within 15 minutes. */
  soon: CardRow[];
}

export function buildQueue(rows: CardRow[], now: Date, newAllowance: number, hasText: (row: CardRow) => boolean = () => true): Queue {
  const nowIso = now.toISOString();
  const soonIso = new Date(now.getTime() + 15 * 60_000).toISOString();
  const active = rows.filter((r) => isActive(r) && hasText(r));
  const fresh = active
    .filter((r) => fsrsState(r) === 0 && r.due <= nowIso)
    .sort((a, b) => (a.createdAt ?? a.due).localeCompare(b.createdAt ?? b.due) || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, newAllowance));
  const seen = active.filter((r) => fsrsState(r) !== 0);
  const due = seen.filter((r) => r.due <= nowIso).sort((a, b) => a.due.localeCompare(b.due));
  const soon = seen.filter((r) => r.due > nowIso && r.due <= soonIso && (fsrsState(r) === LEARNING || fsrsState(r) === RELEARNING)).sort((a, b) => a.due.localeCompare(b.due));
  return { due, fresh, soon };
}

/** Mix new cards into the reviews: one new card after every three due ones. */
export function interleave(due: CardRow[], fresh: CardRow[]): CardRow[] {
  const out: CardRow[] = [];
  let f = 0;
  due.forEach((c, i) => {
    out.push(c);
    if (i % 3 === 2 && f < fresh.length) out.push(fresh[f++]!);
  });
  while (f < fresh.length) out.push(fresh[f++]!);
  return out;
}

export async function rateCard(row: CardRow, grade: Grade, now: Date, baseRetention: number, seconds: number, d: HyperscaleDB = defaultDb): Promise<CardRow> {
  const prev = row.state as StoredCardState;
  const { reviewCard } = await fsrs();
  const r = await reviewCard(prev, grade, now, retentionFor(row.critical, baseRetention));
  const updated: CardRow = { ...row, state: r.state, due: r.dueAt };
  await d.transaction("rw", d.cards, d.reviewLog, async () => {
    await d.cards.put(updated);
    await d.reviewLog.add({ cardId: row.id, rating: grade, reviewedAt: now.toISOString(), log: r.log, prevState: prev.state, seconds: Math.round(seconds) });
  });
  return updated;
}
