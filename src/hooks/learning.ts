/** Live learning state for screens: unlocks and gates, the review deck, and today's plan. */
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { content, curriculum, lessonById, lessonsOf } from "@/content";
import { db, type AttemptRow, type CardRow, type CheckpointRow, type ReviewLogRow, type SessionRow } from "@/db";
import { buildQueue, enrollCards, newIntroducedOn, type CardText } from "@/engine/cards";
import { weakSkills } from "@/engine/mastery";
import { planToday, type DayPlan, type PlannedItem } from "@/engine/planner";
import { localDay, todayIso } from "@/engine/schedule";
import { buildLearningState, conceptTitle, pickChallenge, practiceCandidates, type LearningState } from "@/learn/state";
import { getSettings, useSettings } from "@/state/settings";
import { useProgress, useToday } from "./data";

/** Re-render on an interval so time-based states (retake waits, due cards) stay current. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function useAttempts(): AttemptRow[] {
  return useLiveQuery(() => db.attempts.toArray(), [], [] as AttemptRow[]);
}

export function useCheckpointRows(): CheckpointRow[] {
  return useLiveQuery(() => db.checkpoints.toArray(), [], [] as CheckpointRow[]);
}

export function useLearning(): LearningState & { attempts: AttemptRow[]; checkpointRows: CheckpointRow[]; loaded: boolean } {
  const progressRows = useLiveQuery(() => db.progress.toArray(), []);
  const attempts = useLiveQuery(() => db.attempts.toArray(), []);
  const checkpointRows = useLiveQuery(() => db.checkpoints.toArray(), []);
  const now = useNow();
  return useMemo(() => {
    const progress = new Map((progressRows ?? []).map((r) => [r.lessonId, r]));
    const a = attempts ?? [];
    const c = checkpointRows ?? [];
    return { ...buildLearningState(progress, a, c, now), attempts: a, checkpointRows: c, loaded: !!(progressRows && attempts && checkpointRows) };
  }, [progressRows, attempts, checkpointRows, now]);
}

/**
 * Make sure every completed lesson's cards are in the deck: covers lessons finished before the
 * deck existed, restored backups, and cards added to a lesson later. Runs once per lesson per load.
 */
export function useCardSync(): void {
  const completed = useLiveQuery(() => db.progress.where("status").equals("completed").toArray(), []);
  const seen = useRef(new Set<string>());
  useEffect(() => {
    if (!completed) return;
    const pending = completed.filter((p) => !seen.current.has(p.lessonId));
    if (!pending.length) return;
    for (const p of pending) seen.current.add(p.lessonId);
    void (async () => {
      const settings = await getSettings();
      for (const p of pending) {
        const lesson = lessonById(p.lessonId);
        if (!lesson) continue;
        const defs = lesson.cards.filter((id) => content.cards[id]).map((id) => ({ id, critical: content.cards[id]!.critical }));
        await enrollCards(defs, `lesson:${lesson.id}`, new Date(p.completedAt ?? p.updatedAt), settings.desiredRetention);
      }
    })();
  }, [completed]);
}

/** Front/back for a deck row: authored cards from content, learner cards from the row. */
export function cardText(row: CardRow): CardText | undefined {
  const authored = content.cards[row.id];
  if (authored) return { front: authored.front, back: authored.back, concepts: authored.concepts, type: authored.type };
  if (row.front && row.back) return { front: row.front, back: row.back, concepts: row.concepts ?? [] };
  return undefined;
}

const startOfToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
};

export interface DeckInfo {
  loaded: boolean;
  rows: CardRow[];
  logsToday: ReviewLogRow[];
  dueCount: number;
  freshCount: number;
  soonCount: number;
  newAllowance: number;
  reviewedToday: number;
  drafts: CardRow[];
}

export function useDeck(now: Date): DeckInfo {
  const settings = useSettings();
  const rows = useLiveQuery(() => db.cards.toArray(), []);
  const logsToday = useLiveQuery(() => db.reviewLog.where("reviewedAt").aboveOrEqual(startOfToday()).toArray(), [todayIso(now)]);
  return useMemo(() => {
    const r = rows ?? [];
    const logs = logsToday ?? [];
    const newAllowance = Math.max(0, settings.newCardsPerDay - newIntroducedOn(logs, todayIso(now)));
    const q = buildQueue(r, now, newAllowance, (row) => !!cardText(row));
    return {
      loaded: rows !== undefined && logsToday !== undefined,
      rows: r,
      logsToday: logs,
      dueCount: q.due.length,
      freshCount: q.fresh.length,
      soonCount: q.soon.length,
      newAllowance,
      reviewedToday: logs.length,
      drafts: r.filter((c) => c.draft),
    };
  }, [rows, logsToday, settings.newCardsPerDay, now]);
}

/** Today's session row: undefined while loading, null if nothing is recorded yet. */
export function useSessionRow(date: string): SessionRow | null | undefined {
  return useLiveQuery(() => db.sessions.get(date).then((r) => r ?? null), [date]);
}

/** Record that a planned activity is finished today (idempotent). */
export async function markItemDone(key: string, minutes: number, date = todayIso()): Promise<void> {
  await db.transaction("rw", db.sessions, async () => {
    const row = (await db.sessions.get(date)) ?? { date, plannedMinutes: 0, doneMinutes: 0, items: [] };
    if (row.items.some((i) => i.key === key)) return;
    row.items.push({ key, minutes, doneAt: new Date().toISOString() });
    row.doneMinutes += minutes;
    await db.sessions.put(row);
  });
}

export function useIsPhone(): boolean {
  const query = "(max-width: 767px)";
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && window.matchMedia?.(query).matches);
  useEffect(() => {
    const m = window.matchMedia?.(query);
    if (!m) return;
    const on = () => setPhone(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return !!phone;
}

const lessonHref = (id: string) => {
  const [m, s] = id.split("/");
  return `/learn/${m}/${s}`;
};

export interface DayPlanInfo {
  loaded: boolean;
  plan: DayPlan;
  done: Set<string>;
  next?: PlannedItem;
  learning: ReturnType<typeof useLearning>;
  deck: DeckInfo;
}

export function useDayPlan(): DayPlanInfo {
  const today = useToday();
  const now = useNow();
  const learning = useLearning();
  const deck = useDeck(now);
  const progress = useProgress();
  const session = useSessionRow(today.date);
  const phone = useIsPhone();

  return useMemo(() => {
    const doneKeys = new Set(session?.items.map((i) => i.key) ?? []);
    const doneToday = [...progress.values()]
      .filter((p) => p.status === "completed" && p.completedAt && localDay(p.completedAt) === today.date)
      .sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""));
    const lessons: Array<{ id: string; title: string; minutes: number; href: string; done?: boolean }> = [];
    for (const p of doneToday) {
      const l = content.lessons.find((x) => x.id === p.lessonId);
      if (l) lessons.push({ id: l.id, title: l.title, minutes: l.minutes, href: lessonHref(l.id), done: true });
    }
    let open = 0;
    for (const m of curriculum.modules) {
      if (open >= 3) break;
      if (!learning.modules[m.id]?.unlocked) continue;
      for (const l of lessonsOf(m.id)) {
        if (open >= 3) break;
        if (learning.completed.has(l.id)) continue;
        lessons.push({ id: l.id, title: l.title, minutes: l.minutes, href: lessonHref(l.id) });
        open += 1;
      }
    }
    const rowsToday = learning.checkpointRows.filter((r) => localDay(r.startedAt) === today.date);
    const title = (id: string) => content.modules[id]?.title ?? curriculum.modules.find((m) => m.id === id)?.title ?? id;
    const confirmations = Object.values(learning.modules)
      .filter((m) => m.delayedDue || rowsToday.some((r) => r.moduleId === m.id && r.kind === "delayed"))
      .map((m) => ({ moduleId: m.id, title: title(m.id), href: `/learn/${m.id}/checkpoint` }));
    // A gate is scheduled the day after the module's last lesson, so it measures retention rather
    // than what's still in short-term memory (it can always be taken early from the module page).
    const lastLessonDay = (id: string) =>
      lessonsOf(id)
        .map((l) => progress.get(l.id)?.completedAt)
        .filter((x): x is string => !!x)
        .map(localDay)
        .sort()
        .at(-1);
    const checkpoints = Object.values(learning.modules)
      .filter(
        (m) =>
          (m.ready && (m.lessonsDone === 0 ? m.allowTestOut : (lastLessonDay(m.id) ?? today.date) < today.date)) ||
          rowsToday.some((r) => r.moduleId === m.id && r.kind === "immediate"),
      )
      .map((m) => ({ moduleId: m.id, title: title(m.id), href: `/learn/${m.id}/checkpoint` }));
    const pool = practiceCandidates(learning, learning.attempts);
    const keptChallenge = [...doneKeys].find((k) => k.startsWith("challenge:"))?.slice("challenge:".length);
    const ex = pickChallenge(learning.attempts, now, keptChallenge);
    const plan = planToday({
      minutes: today.minutes,
      dueCards: deck.dueCount + deck.reviewedToday,
      newCards: deck.freshCount,
      lessons,
      confirmations,
      checkpoints,
      practicePool: pool.length,
      weakSkills: weakSkills(learning.mastery).map((s) => conceptTitle(s.skill)),
      challenge: ex ? { id: ex.id, title: `Challenge: ${ex.title}`, minutes: Math.max(10, ex.minutes), href: `/practice/exercise/${ex.id}?challenge=1` } : undefined,
      device: phone ? "phone" : "desktop",
    });
    const done = new Set<string>();
    for (const item of plan.items) {
      const k = item.key;
      if (k === "reviews") {
        if (deck.loaded && deck.dueCount + deck.freshCount === 0) done.add(k);
      } else if (k.startsWith("lesson:")) {
        if (learning.completed.has(k.slice(7))) done.add(k);
      } else if (k.startsWith("confirm:")) {
        if (rowsToday.some((r) => r.moduleId === k.slice(8) && r.kind === "delayed")) done.add(k);
      } else if (k.startsWith("checkpoint:")) {
        if (rowsToday.some((r) => r.moduleId === k.slice(11) && r.kind === "immediate")) done.add(k);
      } else if (doneKeys.has(k)) done.add(k);
    }
    return { loaded: deck.loaded && session !== undefined && learning.loaded, plan, done, next: plan.items.find((i) => !done.has(i.key)), learning, deck };
  }, [today, now, learning, deck, progress, session, phone]);
}
