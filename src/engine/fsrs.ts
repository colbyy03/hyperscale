/**
 * Spaced-repetition scheduling with FSRS-7 (ts-fsrs v6). PLAN.md §3.5.
 *
 * Cards are stored as JSON (dates as ISO strings) and revived before scheduling.
 * Retention: 0.90 default, 0.93 for gate-critical cards, capped interval 365 days.
 */
import { DefaultScheduler, Rating } from "ts-fsrs";

export { Rating };
export type Grade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

type Scheduler = Awaited<ReturnType<typeof DefaultScheduler<"FSRS-7">>>;
type SchedulerCard = ReturnType<Scheduler["newCard"]>;

/** JSON-safe card state as persisted in IndexedDB. */
export type StoredCardState = Omit<SchedulerCard, "dueAt" | "lastReviewAt"> & { dueAt: string; lastReviewAt: string | null };

export const MAX_INTERVAL_DAYS = 365;
export { CRITICAL_RETENTION, retentionFor } from "./retention";

const schedulers = new Map<string, Promise<Scheduler>>();

export function getScheduler(retention: number, fuzz = true): Promise<Scheduler> {
  const key = `${retention.toFixed(3)}:${fuzz}`;
  let s = schedulers.get(key);
  if (!s) {
    s = DefaultScheduler({
      desiredRetention: retention,
      enableShortTerm: true,
      learningSteps: ["1m", "10m"],
      relearningSteps: ["10m"],
      enableFuzz: fuzz,
      maximumInterval: MAX_INTERVAL_DAYS,
    });
    schedulers.set(key, s);
  }
  return s;
}

function serialize(card: SchedulerCard): StoredCardState {
  return {
    ...card,
    dueAt: new Date(card.dueAt).toISOString(),
    lastReviewAt: card.lastReviewAt ? new Date(card.lastReviewAt).toISOString() : null,
  } as StoredCardState;
}

function revive(state: StoredCardState): SchedulerCard {
  return { ...state, dueAt: new Date(state.dueAt), lastReviewAt: state.lastReviewAt ? new Date(state.lastReviewAt) : null } as unknown as SchedulerCard;
}

export async function newCardState(now: Date, retention: number): Promise<StoredCardState> {
  const s = await getScheduler(retention);
  return serialize(s.newCard({ now }));
}

export interface ReviewOutcome {
  state: StoredCardState;
  log: unknown;
  dueAt: string;
}

export async function reviewCard(state: StoredCardState, grade: Grade, now: Date, retention: number, fuzz = true): Promise<ReviewOutcome> {
  const s = await getScheduler(retention, fuzz);
  const result = s.review({ card: revive(state), grade, now });
  const next = serialize(result.card);
  const log = JSON.parse(JSON.stringify(result.revlog)) as unknown;
  return { state: next, log, dueAt: next.dueAt };
}

/** Interval (in days) each grade would schedule, for labelling the rating buttons. */
export async function previewIntervals(state: StoredCardState, now: Date, retention: number): Promise<Record<Grade, number>> {
  const s = await getScheduler(retention, false);
  const out = {} as Record<Grade, number>;
  for (const p of s.preview({ card: revive(state), now })) {
    out[p.grade as Grade] = (new Date(p.card.dueAt).getTime() - now.getTime()) / 86_400_000;
  }
  return out;
}

/** Estimated probability of recall now (1 for cards never reviewed). */
export async function retrievability(state: StoredCardState, now: Date, retention: number): Promise<number> {
  if (!state.lastReviewAt) return 1;
  const s = await getScheduler(retention, false);
  const elapsed = s.chrono.difference(new Date(state.lastReviewAt), now);
  return s.model.forgettingCurve(revive(state), elapsed);
}

export function formatInterval(days: number): string {
  const minutes = days * 1440;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
