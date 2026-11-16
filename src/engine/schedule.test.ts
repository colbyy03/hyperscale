import { describe, expect, it } from "vitest";
import calendar from "../../planning/calendar.json";
import curriculum from "../../planning/curriculum.json";
import pythonSchedule from "../../planning/schedule.json";
import { addDays, buildSchedule, dayInfo, isWeekend, roundHalfEven, type CalendarConfig } from "./schedule";

const cal = calendar as unknown as CalendarConfig;
const modules = curriculum.modules.map((m) => ({ id: m.id, title: m.title, hours: m.hours }));

describe("schedule engine", () => {
  it("knows weekends and date arithmetic", () => {
    expect(isWeekend("2026-11-14")).toBe(true); // Saturday
    expect(isWeekend("2026-11-16")).toBe(false); // Monday
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("rounds half to even like Python", () => {
    expect(roundHalfEven(2.5)).toBe(2);
    expect(roundHalfEven(3.5)).toBe(4);
    expect(roundHalfEven(2.4)).toBe(2);
  });

  it("applies period budgets and holidays", () => {
    expect(dayInfo(cal, "2026-11-17").minutes).toBe(75); // teaching weekday
    expect(dayInfo(cal, "2026-11-21").minutes).toBe(150); // teaching weekend
    expect(dayInfo(cal, "2026-12-25").minutes).toBe(0); // Christmas
    expect(dayInfo(cal, "2027-02-09").type).toBe("break");
  });

  it("matches the Python planner exactly", () => {
    const s = buildSchedule(cal, modules);
    expect(Math.round(s.capacityHours * 10) / 10).toBe(pythonSchedule.capacityHours);
    expect(Math.round(s.neededHours * 10) / 10).toBe(pythonSchedule.neededHours);
    expect(s.weeks.length).toBe(pythonSchedule.weeks.length);
    s.weeks.forEach((w, i) => {
      const py = pythonSchedule.weeks[i]!;
      expect(w.start).toBe(py.start);
      expect(Math.round((w.minutes / 60) * 100) / 100).toBe(py.hours);
    });
    for (const [id, span] of Object.entries(pythonSchedule.modules)) {
      expect(s.spans[id], id).toEqual(span);
    }
    expect(s.unfinished).toEqual([]);
  });
});
