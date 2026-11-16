/** Shared live data hooks: schedule, progress, today. */
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { curriculum, effectiveCalendar, lessonsOf } from "@/content";
import { db, type ProgressRow } from "@/db";
import { buildSchedule, dayInfo, minutesOn, todayIso, weekIndexOf, type Schedule } from "@/engine/schedule";
import { useSettings } from "@/state/settings";

export function useCalendar() {
  const settings = useSettings();
  return useMemo(() => effectiveCalendar(settings.timeBudget), [settings.timeBudget]);
}

export function useSchedule(): Schedule {
  const cal = useCalendar();
  return useMemo(
    () => buildSchedule(cal, curriculum.modules.map((m) => ({ id: m.id, title: m.title, hours: m.hours }))),
    [cal],
  );
}

export function useProgress(): Map<string, ProgressRow> {
  const rows = useLiveQuery(() => db.progress.toArray(), [], [] as ProgressRow[]);
  return useMemo(() => new Map(rows.map((r) => [r.lessonId, r])), [rows]);
}

export interface TodayInfo {
  date: string;
  week: number;
  minutes: number;
  periodLabel: string;
  holiday?: string;
  overridden: boolean;
}

export function useToday(): TodayInfo {
  const cal = useCalendar();
  const settings = useSettings();
  const date = todayIso();
  return useMemo(() => {
    const inCourse = date >= cal.courseStart && date <= cal.courseEnd;
    const info = inCourse ? dayInfo(cal, date) : undefined;
    const override = settings.todayOverride?.date === date ? settings.todayOverride.minutes : undefined;
    return {
      date,
      week: weekIndexOf(cal, date),
      minutes: override ?? minutesOn(cal, date),
      periodLabel: info?.label ?? (date < cal.courseStart ? "Before the course starts" : "After the course"),
      holiday: info?.holiday,
      overridden: override !== undefined,
    };
  }, [cal, date, settings.todayOverride]);
}

/** Module completion based on authored lessons (mastery gates replace this in the learning engine). */
export function moduleCompletion(moduleId: string, progress: Map<string, ProgressRow>) {
  const lessons = lessonsOf(moduleId);
  const done = lessons.filter((l) => progress.get(l.id)?.status === "completed").length;
  return { done, total: lessons.length, complete: lessons.length > 0 && done === lessons.length };
}

/** The first authored lesson not yet completed, in study order. */
export function useNextLesson() {
  const progress = useProgress();
  return useMemo(() => {
    for (const m of curriculum.modules) {
      for (const l of lessonsOf(m.id)) {
        if (progress.get(l.id)?.status !== "completed") return l;
      }
    }
    return undefined;
  }, [progress]);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts);
}

export function daysUntil(iso: string, from: string = todayIso()): number {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${iso}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
