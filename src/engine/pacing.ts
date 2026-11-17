/**
 * Pacing (PLAN.md §8.6): planned hours to date vs hours of curriculum actually covered.
 * Shown as a gentle ahead/behind figure, never as streak pressure.
 */
import { addDays, type Schedule } from "./schedule";

export interface PacingResult {
  expectedHours: number;
  actualHours: number;
  deltaHours: number;
  status: "not-started" | "ahead" | "on-track" | "behind";
}

/**
 * @param minutesOn  study minutes the calendar gives a date
 * @param fraction   share of a module covered, 0..1 (gate passed = 1)
 */
export function computePacing(schedule: Schedule, today: string, minutesOn: (date: string) => number, modules: Array<{ id: string; hours: number }>, fraction: (id: string) => number): PacingResult {
  // Planned hours through yesterday: today's session can still happen, so it never counts against you.
  let expected = 0;
  for (const w of schedule.weeks) {
    const hours = w.allocations.reduce((s, a) => s + a.hours, 0);
    if (w.end < today) expected += hours;
    else if (w.start < today) {
      let upTo = 0;
      for (let d = w.start; d < today; d = addDays(d, 1)) upTo += minutesOn(d);
      expected += w.minutes > 0 ? hours * Math.min(1, upTo / w.minutes) : 0;
    }
  }
  const actual = modules.reduce((s, m) => s + m.hours * Math.max(0, Math.min(1, fraction(m.id))), 0);
  const delta = actual - expected;
  const first = schedule.weeks[0];
  const status = !first || today < first.start ? "not-started" : delta > 2 ? "ahead" : delta < -2 ? "behind" : "on-track";
  return { expectedHours: expected, actualHours: actual, deltaHours: delta, status };
}
