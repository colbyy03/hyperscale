/**
 * Runtime access to the curriculum, calendar and authored content.
 * Order and hours come from planning/curriculum.json; teaching content from content/.
 */
import type { MDXContent } from "mdx/types";
import contentIndex from "virtual:hyperscale/content";
import calendarJson from "../../planning/calendar.json";
import curriculumJson from "../../planning/curriculum.json";
import type { CalendarConfig, DayBudget, PeriodType } from "@/engine/schedule";
import type { Curriculum, CurriculumModule, LessonIndexEntry } from "./schema";

export const content = contentIndex;
// Validated at build time by scripts/validate-content.ts (keeps zod out of the startup bundle).
export const curriculum = curriculumJson as unknown as Curriculum;
export const baseCalendar = calendarJson as unknown as CalendarConfig;

export const PHASE_TITLES: Record<number, string> = {
  1: "Foundations",
  2: "Classical ML",
  3: "Forecasting, optimization and the deep-learning core",
  4: "Reliability, LLM systems and production",
  5: "Deep-learning depth and LLM internals",
  6: "Control, RL and the capstones",
};

/** Display number in study order: "0".."31" for modules, "P1".."P3" and "C1","C2" for projects. */
export const displayNumber: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  let n = 0;
  let p = 0;
  let c = 0;
  for (const m of curriculum.modules) {
    if (m.kind === "project") out[m.id] = `P${++p}`;
    else if (m.kind === "capstone") out[m.id] = `C${++c}`;
    else out[m.id] = String(n++);
  }
  return out;
})();

export function moduleById(id: string): CurriculumModule | undefined {
  return curriculum.modules.find((m) => m.id === id);
}

export function lessonsOf(moduleId: string): LessonIndexEntry[] {
  return content.lessons.filter((l) => l.moduleId === moduleId).sort((a, b) => a.order - b.order);
}

export function lessonById(id: string): LessonIndexEntry | undefined {
  return content.lessons.find((l) => l.id === id);
}

/** Lesson bodies are code-split: each MDX file becomes its own chunk. */
const lessonLoaders = import.meta.glob<{ default: MDXContent }>("/content/modules/*/lessons/*.mdx");

const buildLoaders = import.meta.glob<{ default: MDXContent }>("/content/modules/*/build.mdx");

export function loadBuild(file: string): Promise<{ default: MDXContent }> {
  const loader = buildLoaders[file];
  if (!loader) return Promise.reject(new Error(`No build brief ${file}`));
  return loader();
}

export function loadLesson(file: string): Promise<{ default: MDXContent }> {
  const loader = lessonLoaders[file];
  if (!loader) return Promise.reject(new Error(`No lesson file ${file}`));
  return loader();
}

/** The calendar with the learner's time-budget overrides applied. */
export function effectiveCalendar(overrides: Partial<Record<PeriodType, DayBudget>>): CalendarConfig {
  return {
    ...baseCalendar,
    timeBudget: { ...baseCalendar.timeBudget, ...overrides },
  };
}

export const MDS_MODE_LABEL: Record<string, string> = {
  "teach-fully": "Teach fully",
  deepen: "Deepen MDS",
  accelerate: "Accelerate (test-out)",
};
