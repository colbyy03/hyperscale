/**
 * Weekly review (PLAN.md §8.6): calibration, hint hotspots, review health, delayed
 * confirmations and time against plan, over the last seven days. Pure function.
 */
import type { AttemptRow, CheckpointRow, ReviewLogRow, SessionRow } from "@/db";

export interface CalibrationBin {
  confidence: 1 | 2 | 3 | 4;
  n: number;
  accuracy: number;
}

export interface WeeklySummary {
  from: string;
  attempts: number;
  accuracy: number | null;
  calibration: CalibrationBin[];
  /** High confidence and wrong: either a misleading item or a real misconception. */
  confidentErrors: string[];
  hintHotspots: Array<{ itemId: string; maxTier: number }>;
  reviews: { count: number; again: number; retention: number | null };
  slipping: string[];
  confirmations: Array<{ moduleId: string; passed: boolean; score: number; at: string }>;
  minutesDone: number;
  activeDays: number;
}

export function weeklySummary(args: { attempts: AttemptRow[]; reviewLog: ReviewLogRow[]; checkpoints: CheckpointRow[]; sessions: SessionRow[]; now: Date; days?: number }): WeeklySummary {
  const fromMs = args.now.getTime() - (args.days ?? 7) * 86_400_000;
  const from = new Date(fromMs).toISOString();
  const attempts = args.attempts.filter((a) => a.submittedAt >= from);
  const graded = attempts.filter((a) => a.kind !== "predict");
  const accuracy = graded.length ? graded.filter((a) => a.correct).length / graded.length : null;

  const calibration: CalibrationBin[] = [];
  for (const c of [1, 2, 3, 4] as const) {
    const bin = attempts.filter((a) => a.confidence === c);
    if (bin.length) calibration.push({ confidence: c, n: bin.length, accuracy: bin.filter((a) => a.correct).length / bin.length });
  }
  const confidentErrors = [...new Set(attempts.filter((a) => (a.confidence ?? 0) >= 3 && !a.correct).map((a) => a.itemId))];

  const tierOf = (a: AttemptRow) => Math.max(a.hintTier ?? 0, (a.payload as { hintTier?: number } | undefined)?.hintTier ?? 0);
  const hints = new Map<string, number>();
  for (const a of attempts) {
    const t = tierOf(a);
    if (t > 0) hints.set(a.itemId, Math.max(hints.get(a.itemId) ?? 0, t));
  }
  const hintHotspots = [...hints.entries()].map(([itemId, maxTier]) => ({ itemId, maxTier })).sort((a, b) => b.maxTier - a.maxTier);

  const logs = args.reviewLog.filter((l) => l.reviewedAt >= from);
  // Retention counts reviews of cards that had graduated (state review), as FSRS defines it.
  const matured = logs.filter((l) => l.prevState === 2);
  const again = logs.filter((l) => l.rating === 1).length;
  const lapses = new Map<string, number>();
  for (const l of matured) if (l.rating === 1) lapses.set(l.cardId, (lapses.get(l.cardId) ?? 0) + 1);
  const slipping = [...lapses.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);

  const confirmations = args.checkpoints
    .filter((c) => c.kind === "delayed" && c.startedAt >= from)
    .map((c) => ({ moduleId: c.moduleId, passed: c.passed, score: c.score, at: c.startedAt }));

  const fromDay = from.slice(0, 10);
  const sessions = args.sessions.filter((s) => s.date >= fromDay);
  return {
    from,
    attempts: attempts.length,
    accuracy,
    calibration,
    confidentErrors,
    hintHotspots,
    reviews: { count: logs.length, again, retention: matured.length ? matured.filter((l) => l.rating > 1).length / matured.length : null },
    slipping,
    confirmations,
    minutesDone: sessions.reduce((s, r) => s + r.doneMinutes, 0),
    activeDays: new Set([...sessions.filter((s) => s.doneMinutes > 0).map((s) => s.date), ...attempts.map((a) => a.submittedAt.slice(0, 10))]).size,
  };
}
