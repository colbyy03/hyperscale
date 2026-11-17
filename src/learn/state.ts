/**
 * Derives the learner's state from stored rows: module unlocks, gates, mastery, practice pool.
 * Pure functions over content + rows, so screens can share one computation.
 */
import { content, curriculum, lessonsOf } from "@/content";
import type { ExerciseIndexEntry, PoolQuestion } from "@/content/schema";
import type { AttemptRow, CheckpointRow, ProgressRow } from "@/db";
import { delayedCheckDue, gateState, isAdvanced, type GateState } from "@/engine/gates";
import { computeMastery, moduleMastery, type SkillMastery } from "@/engine/mastery";
import type { PracticeCandidate } from "@/engine/practice";

export interface ModuleState {
  id: string;
  index: number;
  lessonsDone: number;
  lessonsTotal: number;
  lessonsComplete: boolean;
  hasCheckpoint: boolean;
  allowTestOut: boolean;
  /** Every earlier blocking module has advanced. */
  unlocked: boolean;
  blockedBy?: string;
  gate?: GateState;
  /** No longer blocks the next module. */
  advanced: boolean;
  /** The checkpoint can be taken now. */
  ready: boolean;
  delayedDue: boolean;
  concepts: string[];
  mastery: number;
}

export interface LearningState {
  modules: Record<string, ModuleState>;
  mastery: Map<string, SkillMastery>;
  /** Concepts taught in completed lessons. */
  introduced: Set<string>;
  completed: Set<string>;
  currentModuleIndex: number;
}

export const moduleIndex: Record<string, number> = Object.fromEntries(curriculum.modules.map((m, i) => [m.id, i]));

export function moduleConcepts(id: string): string[] {
  const declared = content.modules[id]?.concepts ?? [];
  return declared.length ? declared : [...new Set(lessonsOf(id).flatMap((l) => l.concepts))];
}

export function buildLearningState(progress: Map<string, ProgressRow>, attempts: AttemptRow[], checkpoints: CheckpointRow[], now: Date): LearningState {
  const mastery = computeMastery(attempts);
  const completed = new Set([...progress.values()].filter((p) => p.status === "completed").map((p) => p.lessonId));
  const introduced = new Set(content.lessons.filter((l) => completed.has(l.id)).flatMap((l) => l.concepts));
  const modules: Record<string, ModuleState> = {};
  let open = true; // every blocking module so far has advanced
  let blocker: string | undefined;

  curriculum.modules.forEach((m, index) => {
    const lessons = lessonsOf(m.id);
    const lessonsDone = lessons.filter((l) => completed.has(l.id)).length;
    const lessonsComplete = lessons.length > 0 && lessonsDone === lessons.length;
    const cp = content.checkpoints[m.id];
    const unlocked = open;
    const gate = cp ? gateState(checkpoints.filter((r) => r.moduleId === m.id), unlocked, now) : undefined;
    const allowTestOut = cp?.allowTestOut ?? false;
    const concepts = moduleConcepts(m.id);
    let advanced: boolean;
    if (m.kind || lessons.length === 0) advanced = open; // projects and unwritten modules don't block
    else if (gate) advanced = isAdvanced(gate.status);
    else advanced = lessonsComplete;
    const ready =
      !!gate && unlocked && (lessonsComplete || allowTestOut) && (gate.status === "open" || (gate.status === "provisional" && !gate.retakeAt));
    modules[m.id] = {
      id: m.id,
      index,
      lessonsDone,
      lessonsTotal: lessons.length,
      lessonsComplete,
      hasCheckpoint: !!cp,
      allowTestOut,
      unlocked,
      blockedBy: unlocked ? undefined : blocker,
      gate,
      advanced,
      ready,
      delayedDue: !!gate && delayedCheckDue(gate, now),
      concepts,
      mastery: moduleMastery(concepts, mastery),
    };
    if (!(m.kind || lessons.length === 0)) {
      if (!advanced && open) blocker = m.id;
      open = open && advanced;
    }
  });

  const lastDone = [...progress.values()]
    .filter((p) => p.status === "completed")
    .sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt))[0];
  const currentModuleIndex = lastDone ? (moduleIndex[lastDone.moduleId] ?? 0) : 0;
  return { modules, mastery, introduced, completed, currentModuleIndex };
}

export const questionAttemptId = (q: PoolQuestion) => `q:${q.key}`;

/** Pool questions you've met (in a completed lesson) or whose concepts you've been taught. */
export function practiceCandidates(state: LearningState, attempts: AttemptRow[]): Array<PracticeCandidate & { question: PoolQuestion }> {
  const checked = new Set(content.lessons.filter((l) => state.completed.has(l.id)).flatMap((l) => l.checks.map((c) => `${l.moduleId}/${c}`)));
  const last = new Map<string, AttemptRow>();
  for (const a of attempts) {
    if (!a.itemId.startsWith("q:")) continue;
    const prev = last.get(a.itemId);
    if (!prev || prev.submittedAt < a.submittedAt) last.set(a.itemId, a);
  }
  return Object.values(content.questions)
    .filter((q) => checked.has(q.key) || q.concepts.every((c) => state.introduced.has(c)))
    .map((q) => {
      const a = last.get(questionAttemptId(q));
      return { key: q.key, moduleIndex: moduleIndex[q.moduleId] ?? 0, concepts: q.concepts, lastAttemptAt: a?.submittedAt, lastCorrect: a?.correct, question: q };
    });
}

const CODE_TYPES = new Set(["code", "fill-in", "debug"]);

/**
 * The challenge: re-solve, from a blank editor, an exercise you met at least two days ago.
 * Exercises you needed hints for, or never passed, come first.
 */
export function pickChallenge(attempts: AttemptRow[], now: Date, keep?: string): ExerciseIndexEntry | undefined {
  const byId = new Map<string, AttemptRow[]>();
  for (const a of attempts) {
    if (a.kind !== "code") continue;
    const list = byId.get(a.itemId) ?? [];
    list.push(a);
    byId.set(a.itemId, list);
  }
  if (keep) {
    const kept = content.exercises.find((e) => e.id === keep);
    if (kept) return kept;
  }
  const cutoff = new Date(now.getTime() - 48 * 3_600_000).toISOString();
  const tier = (a: AttemptRow) => Math.max(a.hintTier ?? 0, (a.payload as { hintTier?: number } | undefined)?.hintTier ?? 0);
  return content.exercises
    .filter((e) => CODE_TYPES.has(e.type) && byId.has(e.id))
    .map((e) => {
      const list = byId.get(e.id)!;
      const lastAt = list.reduce((m, a) => (a.submittedAt > m ? a.submittedAt : m), "");
      const clean = list.some((a) => a.correct && tier(a) === 0);
      return { e, lastAt, clean };
    })
    .filter((x) => x.lastAt <= cutoff)
    .sort((a, b) => Number(a.clean) - Number(b.clean) || a.lastAt.localeCompare(b.lastAt))[0]?.e;
}

export function conceptTitle(id: string): string {
  return content.concepts[id]?.title ?? id;
}
