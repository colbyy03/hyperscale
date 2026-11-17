/**
 * Today's session (PLAN.md §3.2, §8.6): an ordered list of concrete activities sized to the
 * minutes available. Pure function, so it is easy to test; the Today screen supplies the inputs.
 *
 * Order: reviews (hard cap 15 min) → gates (delayed confirmations, a checkpoint) → new material
 * → mixed practice → weakness drill (lab days) → one hard challenge → exit recall.
 * New material has priority over the challenge; a checkpoint replaces the challenge.
 */
export type ItemKind = "reviews" | "confirm" | "checkpoint" | "lesson" | "practice" | "drill" | "challenge" | "exit";

export interface PlannedItem {
  kind: ItemKind;
  title: string;
  minutes: number;
  href: string;
  detail?: string;
  /** Stable key used to mark the item done. */
  key: string;
}

export interface PlannerInput {
  minutes: number;
  /** Cards still due plus those already reviewed today (keeps the block stable through the day). */
  dueCards: number;
  /** New cards that may still be introduced today. */
  newCards: number;
  /** Lessons completed today (done: true) first, then the next unlocked lessons in study order. */
  lessons: Array<{ id: string; title: string; minutes: number; href: string; done?: boolean }>;
  /** Delayed confirmations that are due (or were taken today). */
  confirmations: Array<{ moduleId: string; title: string; href: string }>;
  /** Gates that are ready to take (or were taken today). */
  checkpoints: Array<{ moduleId: string; title: string; href: string }>;
  /** Number of questions eligible for mixed practice. */
  practicePool: number;
  /** Weakest skills (titles), weakest first. */
  weakSkills: string[];
  challenge?: { id: string; title: string; minutes: number; href: string };
  device: "phone" | "desktop";
}

export interface DayPlan {
  variant: "rest" | "lite" | "standard" | "lab";
  items: PlannedItem[];
  minutes: number;
}

const SECONDS_PER_CARD = 30;
const REVIEW_CAP_MIN = 15;
const CHECKPOINT_MIN = 20;
const CONFIRM_MIN = 12;
const EXIT_MIN = 3;
const DRILL_MIN = 20;
const MIN_LESSON_CHUNK = 15;

/** About 75 seconds per mixed-practice item, confidence rating included. */
export const practiceItemsFor = (minutes: number, pool: number) => Math.min(pool, Math.max(3, Math.round(minutes * 0.8)));

export function planToday(input: PlannerInput): DayPlan {
  const budget = Math.max(0, Math.round(input.minutes));
  if (budget === 0) return { variant: "rest", items: [], minutes: 0 };
  const items: PlannedItem[] = [];
  let left = budget;
  const take = (item: PlannedItem) => {
    items.push(item);
    left -= item.minutes;
  };
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  const cards = input.dueCards + input.newCards;
  const lite = budget < 30;
  const reviewCap = lite ? Math.max(0, budget - 5) : REVIEW_CAP_MIN;
  const reviewMin = Math.min(reviewCap, Math.ceil((cards * SECONDS_PER_CARD) / 60));
  if (reviewMin > 0) {
    take({ kind: "reviews", key: "reviews", title: `Review ${plural(cards, "card")}`, minutes: reviewMin, href: "/review", detail: input.newCards ? `${input.newCards} new` : undefined });
  }

  if (lite) {
    // Lite day: reviews plus three mixed items.
    if (input.practicePool > 0 && left >= 3) {
      const n = Math.min(3, input.practicePool);
      take({ kind: "practice", key: "practice", title: `Mixed practice · ${plural(n, "item")}`, minutes: Math.min(left, 5), href: `/practice/session?n=${n}` });
    }
    return { variant: "lite", items, minutes: budget - left };
  }

  for (const c of input.confirmations) {
    if (left < CONFIRM_MIN + 5) break;
    take({ kind: "confirm", key: `confirm:${c.moduleId}`, title: `Delayed check: ${c.title}`, minutes: CONFIRM_MIN, href: c.href, detail: "Confirms the skill stuck" });
  }
  const cp = input.checkpoints[0];
  let checkpointPlanned = false;
  if (cp && left >= CHECKPOINT_MIN) {
    take({ kind: "checkpoint", key: `checkpoint:${cp.moduleId}`, title: `Checkpoint: ${cp.title}`, minutes: CHECKPOINT_MIN, href: cp.href, detail: "Mastery gate" });
    checkpointPlanned = true;
  }

  // Reserve the smaller blocks, then give new material everything else.
  let practiceMin = input.practicePool > 0 ? Math.min(budget >= 45 ? 10 : 6, Math.ceil(input.practicePool * 1.25)) : 0;
  const drillMin = budget >= 90 && input.weakSkills.length > 0 && input.practicePool > 0 ? DRILL_MIN : 0;
  const exitMin = input.lessons.length ? EXIT_MIN : 0;
  let challengeMin = input.device === "desktop" && budget >= 45 && input.challenge && !checkpointPlanned ? Math.min(input.challenge.minutes, budget >= 60 ? 15 : 10) : 0;
  let lessonBudget = left - practiceMin - drillMin - exitMin;
  const firstOpen = input.lessons.find((l) => !l.done);
  if (firstOpen && lessonBudget < firstOpen.minutes && practiceMin > 5) {
    // Trim practice (down to 5 min) so the next lesson fits whole rather than being split.
    const give = Math.min(practiceMin - 5, firstOpen.minutes - lessonBudget);
    practiceMin -= give;
    lessonBudget += give;
  }
  if (challengeMin && firstOpen && lessonBudget - challengeMin < firstOpen.minutes) challengeMin = 0; // lessons first
  lessonBudget -= challengeMin;

  let lessonsTaken = 0;
  for (const l of input.lessons) {
    if (l.done) {
      take({ kind: "lesson", key: `lesson:${l.id}`, title: l.title, minutes: l.minutes, href: l.href });
      lessonBudget -= l.minutes;
      lessonsTaken += 1;
      continue;
    }
    if (lessonBudget < Math.min(l.minutes, MIN_LESSON_CHUNK)) break;
    const minutes = Math.min(l.minutes, lessonBudget);
    take({ kind: "lesson", key: `lesson:${l.id}`, title: l.title, minutes, href: l.href, detail: minutes < l.minutes ? "first part" : undefined });
    lessonBudget -= minutes;
    lessonsTaken += 1;
  }

  if (practiceMin > 0 && left >= 3) {
    const minutes = Math.min(practiceMin, left);
    const n = practiceItemsFor(minutes, input.practicePool);
    take({ kind: "practice", key: "practice", title: `Mixed practice · ${plural(n, "item")}`, minutes, href: `/practice/session?n=${n}`, detail: "Confidence rating before each answer" });
  }
  if (drillMin > 0 && left >= drillMin) {
    take({ kind: "drill", key: "drill", title: "Weakness drill", minutes: drillMin, href: "/practice/session?mode=drill&n=15", detail: input.weakSkills.slice(0, 3).join(", ") });
  }
  if (challengeMin > 0 && input.challenge && left >= challengeMin) {
    take({ kind: "challenge", key: `challenge:${input.challenge.id}`, title: input.challenge.title, minutes: challengeMin, href: input.challenge.href, detail: "One hard problem, from a blank editor" });
  }
  if (lessonsTaken > 0 && left >= EXIT_MIN) {
    take({ kind: "exit", key: "exit", title: "Exit recall", minutes: EXIT_MIN, href: "/review/exit", detail: "Two closed-book questions, today's draft cards" });
  }
  return { variant: budget >= 90 ? "lab" : "standard", items, minutes: budget - left };
}
