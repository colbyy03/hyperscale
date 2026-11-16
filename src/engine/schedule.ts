/**
 * Week-by-week schedule engine: a TypeScript port of planning/build_schedule.py.
 *
 * Given the calendar (MDS periods, holidays, daily time budget) and the study-order
 * curriculum, it computes available minutes for every day, groups days into
 * Monday-start weeks, and fills weekly capacity with modules in order
 * (hours x (1 + review overhead)). A unit test checks parity with the Python output.
 */

export type PeriodType = "teaching" | "blockWeek5" | "break" | "capstone" | "summer";

export interface DayBudget {
  weekday: number; // minutes
  weekend: number; // minutes
  label?: string;
}

export interface CalendarConfig {
  courseStart: string; // YYYY-MM-DD (a Monday)
  courseEnd: string;
  timeBudget: Record<PeriodType, DayBudget>;
  reviewOverhead: number;
  periods: Array<{ start: string; end: string; type: PeriodType; mds: string; status?: string }>;
  holidays: Array<{ date: string; minutes: number; name: string }>;
}

export interface ScheduleModule {
  id: string;
  title: string;
  hours: number;
}

export interface Allocation {
  id: string;
  title: string;
  hours: number;
  status: "start" | "continue" | "finish" | "start+finish";
}

export interface Week {
  index: number;
  start: string;
  end: string;
  minutes: number;
  labels: string[];
  allocations: Allocation[];
  spareHours: number;
}

export interface Span {
  start: string;
  startWeek: number;
  end?: string;
  endWeek?: number;
}

export interface Schedule {
  weeks: Week[];
  spans: Record<string, Span>;
  capacityHours: number;
  neededHours: number;
  unfinished: string[];
}

const DAY_MS = 86_400_000;

export function toUtc(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

export function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

/** Python's round() for non-negative values: round half to even. */
export function roundHalfEven(x: number): number {
  const f = Math.floor(x);
  const diff = x - f;
  if (Math.abs(diff - 0.5) < 1e-12) return f % 2 === 0 ? f : f + 1;
  return Math.round(x);
}

export function isWeekend(date: string): boolean {
  const day = new Date(toUtc(date)).getUTCDay();
  return day === 0 || day === 6;
}

export interface DayInfo {
  date: string;
  minutes: number;
  type: PeriodType;
  label: string;
  holiday?: string;
}

/** Available study minutes and period for one date. */
export function dayInfo(cal: CalendarConfig, date: string): DayInfo {
  const period = cal.periods.find((p) => p.start <= date && date <= p.end);
  if (!period) throw new Error(`no calendar period covers ${date}`);
  const budget = cal.timeBudget[period.type];
  const holiday = cal.holidays.find((h) => h.date === date);
  const minutes = holiday ? holiday.minutes : isWeekend(date) ? budget.weekend : budget.weekday;
  return { date, minutes, type: period.type, label: period.mds, holiday: holiday?.name };
}

export function buildWeeks(cal: CalendarConfig): Week[] {
  const weeks: Week[] = [];
  const total = daysBetween(cal.courseStart, cal.courseEnd);
  for (let i = 0; i <= total; i++) {
    const date = addDays(cal.courseStart, i);
    const info = dayInfo(cal, date);
    const idx = Math.floor(i / 7) + 1;
    let w = weeks[weeks.length - 1];
    if (!w || w.index !== idx) {
      w = { index: idx, start: date, end: date, minutes: 0, labels: [], allocations: [], spareHours: 0 };
      weeks.push(w);
    }
    w.end = date;
    w.minutes += info.minutes;
    if (info.label && !w.labels.includes(info.label)) w.labels.push(info.label);
  }
  return weeks;
}

export function buildSchedule(cal: CalendarConfig, modules: ScheduleModule[]): Schedule {
  const weeks = buildWeeks(cal);
  const queue = modules.map((m) => ({ ...m, remaining: m.hours * (1 + cal.reviewOverhead) }));
  const spans: Record<string, Span> = {};
  let qi = 0;
  for (const w of weeks) {
    const wHours = w.minutes / 60;
    let cap = wHours;
    while (cap > 1e-9 && qi < queue.length) {
      const m = queue[qi]!;
      const take = Math.min(cap, m.remaining);
      const first = !(m.id in spans);
      if (first) spans[m.id] = { start: w.start, startWeek: w.index };
      m.remaining -= take;
      cap -= take;
      const done = m.remaining <= 1e-9;
      w.allocations.push({
        id: m.id,
        title: m.title,
        hours: Math.round(take * 10) / 10,
        status: first && done ? "start+finish" : first ? "start" : done ? "finish" : "continue",
      });
      if (done) {
        const used = wHours - cap;
        const frac = wHours ? used / wHours : 1;
        const offset = Math.max(0, Math.min(6, roundHalfEven(frac * 7) - 1));
        spans[m.id] = { ...spans[m.id]!, end: addDays(w.start, offset), endWeek: w.index };
        qi += 1;
      }
    }
    w.spareHours = Math.round(cap * 10) / 10;
  }
  const capacityHours = weeks.reduce((s, w) => s + w.minutes / 60, 0);
  const neededHours = modules.reduce((s, m) => s + m.hours, 0) * (1 + cal.reviewOverhead);
  return { weeks, spans, capacityHours, neededHours, unfinished: queue.slice(qi).map((m) => m.id) };
}

/** Index of the week containing `date` (1-based), or 0 before the course and weeks.length+1 after. */
export function weekIndexOf(cal: CalendarConfig, date: string): number {
  const d = daysBetween(cal.courseStart, date);
  if (d < 0) return 0;
  return Math.floor(d / 7) + 1;
}

/** Minutes available on a date, or 0 outside the course window. */
export function minutesOn(cal: CalendarConfig, date: string): number {
  if (date < cal.courseStart || date > cal.courseEnd) return 0;
  return dayInfo(cal, date).minutes;
}

export function todayIso(now: Date = new Date()): string {
  // Local calendar date (not UTC), so "today" matches the learner's wall clock.
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
