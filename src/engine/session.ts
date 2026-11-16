/**
 * Daily session outline (PLAN.md §3.2). The full planner (due cards, weak skills,
 * delayed confirmations) arrives with the learning engine; this sizes the blocks.
 */
export type BlockKind = "warmup" | "reviews" | "lesson" | "practice" | "challenge" | "exit";

export interface SessionBlock {
  kind: BlockKind;
  minutes: number;
  label: string;
}

export interface SessionOutline {
  variant: "lite" | "standard" | "lab";
  blocks: SessionBlock[];
  totalMinutes: number;
}

const LABEL: Record<BlockKind, string> = {
  warmup: "Warm-up predictions",
  reviews: "Spaced reviews",
  lesson: "New material",
  practice: "Mixed practice",
  challenge: "One hard challenge",
  exit: "Exit recall and cards",
};

export function planSessionOutline(minutes: number, dueReviewMinutes: number): SessionOutline {
  const m = Math.max(0, Math.round(minutes));
  if (m === 0) return { variant: "lite", blocks: [], totalMinutes: 0 };
  if (m < 30) {
    // Lite day: reviews plus a few mixed items.
    const reviews = Math.min(dueReviewMinutes, Math.max(0, m - 5));
    const practice = m - reviews;
    const blocks: SessionBlock[] = [];
    if (reviews > 0) blocks.push({ kind: "reviews", minutes: reviews, label: LABEL.reviews });
    blocks.push({ kind: "practice", minutes: practice, label: LABEL.practice });
    return { variant: "lite", blocks, totalMinutes: m };
  }
  const variant = m >= 90 ? "lab" : "standard";
  const warmup = 3;
  const exit = 4;
  const reviews = Math.min(dueReviewMinutes, 15, Math.round(m * 0.15));
  const challenge = m >= 45 ? Math.min(20, Math.round(m * 0.15)) : 0;
  const practice = Math.round(m * 0.15);
  const lesson = m - warmup - exit - reviews - challenge - practice;
  const blocks: SessionBlock[] = [
    { kind: "warmup", minutes: warmup, label: LABEL.warmup },
    ...(reviews > 0 ? [{ kind: "reviews" as const, minutes: reviews, label: LABEL.reviews }] : []),
    { kind: "lesson", minutes: lesson, label: LABEL.lesson },
    { kind: "practice", minutes: practice, label: LABEL.practice },
    ...(challenge > 0 ? [{ kind: "challenge" as const, minutes: challenge, label: LABEL.challenge }] : []),
    { kind: "exit", minutes: exit, label: LABEL.exit },
  ];
  return { variant, blocks, totalMinutes: m };
}
