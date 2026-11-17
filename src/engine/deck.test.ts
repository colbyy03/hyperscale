import { describe, expect, it } from "vitest";
import { HyperscaleDB, type AttemptRow, type ReviewLogRow } from "@/db";
import { grade, parseNumber } from "@/learn/grading";
import { approveDraft, buildQueue, draftCard, enrollCards, interleave, newIntroducedOn, rateCard } from "./cards";
import { computePacing } from "./pacing";
import { selectPractice, type PracticeCandidate } from "./practice";
import { localDay, type Schedule } from "./schedule";
import { weeklySummary } from "./weekly";

const freshDb = () => new HyperscaleDB(`deck-${Math.random()}`);
const now = new Date("2026-11-17T18:00:00.000Z");
const tomorrow = new Date(now.getTime() + 36 * 3_600_000);

describe("review deck", () => {
  it("enrols lesson cards once, as new cards that first come due tomorrow", async () => {
    const d = freshDb();
    expect(await enrollCards([{ id: "a" }, { id: "b", critical: true }], "lesson:m/l", now, 0.9, d)).toBe(2);
    expect(await enrollCards([{ id: "a" }, { id: "c" }], "lesson:m/l2", now, 0.9, d)).toBe(1);
    expect(buildQueue(await d.cards.toArray(), now, 10).fresh).toEqual([]);
    const q = buildQueue(await d.cards.toArray(), tomorrow, 10);
    expect(q.fresh.map((c) => c.id).sort()).toEqual(["a", "b", "c"]);
    expect(q.due).toEqual([]);
    expect(buildQueue(await d.cards.toArray(), tomorrow, 2).fresh).toHaveLength(2);
  });

  it("logs every rating, moves the card out of today's queue, and counts new cards introduced", async () => {
    const d = freshDb();
    await enrollCards([{ id: "a" }], "lesson:m/l", now, 0.9, d);
    const row = (await d.cards.get("a"))!;
    const after = await rateCard(row, 3, tomorrow, 0.9, 7, d);
    expect(after.due > tomorrow.toISOString()).toBe(true);
    const logs = await d.reviewLog.toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]!.prevState).toBe(0);
    expect(newIntroducedOn(logs, localDay(tomorrow.toISOString()))).toBe(1);
    expect(newIntroducedOn(logs, localDay(now.toISOString()))).toBe(0);
    expect(buildQueue(await d.cards.toArray(), tomorrow, 10).fresh).toHaveLength(0);
    // "Again" on a new card brings it back within the learning steps.
    await enrollCards([{ id: "b" }], "lesson:m/l", now, 0.9, d);
    await rateCard((await d.cards.get("b"))!, 1, tomorrow, 0.9, 5, d);
    expect(buildQueue(await d.cards.toArray(), tomorrow, 10).soon.map((c) => c.id)).toContain("b");
  });

  it("keeps drafts out of the deck until approved", async () => {
    const d = freshDb();
    expect(await draftCard({ id: "predict:m/l#p1", source: "predict:m/l#p1", front: "Q?", back: "A", concepts: ["x"] }, now, d)).toBe(true);
    expect(await draftCard({ id: "predict:m/l#p1", source: "predict:m/l#p1", front: "Q?", back: "A", concepts: ["x"] }, now, d)).toBe(false);
    expect(buildQueue(await d.cards.toArray(), now, 10).fresh).toHaveLength(0);
    await approveDraft("predict:m/l#p1", { front: "Edited?", back: "A" }, now, 0.9, d);
    const q = buildQueue(await d.cards.toArray(), tomorrow, 10);
    expect(q.fresh[0]!.front).toBe("Edited?");
  });

  it("interleaves one new card after every three reviews", () => {
    const row = (id: string) => ({ id, source: "s", due: "", state: {} });
    expect(interleave(["1", "2", "3", "4"].map(row), ["n1", "n2"].map(row)).map((c) => c.id)).toEqual(["1", "2", "3", "n1", "4", "n2"]);
  });
});

describe("practice selection", () => {
  const cands: PracticeCandidate[] = [];
  for (let m = 0; m < 6; m++) for (let i = 0; i < 6; i++) cands.push({ key: `m${m}-q${i}`, moduleIndex: m, concepts: [`c${m}-${i % 2}`] });
  const fixed = () => 0.5;

  it("fills the 40/30/30 mix from current, recent and older modules", () => {
    const keys = selectPractice(cands, { n: 10, currentModuleIndex: 5, mastery: () => undefined, now, random: fixed });
    const mod = (k: string) => Number(k.slice(1, 2));
    expect(keys).toHaveLength(10);
    expect(keys.filter((k) => mod(k) === 5)).toHaveLength(4);
    expect(keys.filter((k) => mod(k) === 3 || mod(k) === 4)).toHaveLength(3);
    expect(keys.filter((k) => mod(k) < 3)).toHaveLength(3);
  });

  it("prefers weak skills and recently missed items, and rests items seen in the last 20 hours", () => {
    const pool: PracticeCandidate[] = [
      { key: "strong", moduleIndex: 0, concepts: ["s"] },
      { key: "weak", moduleIndex: 0, concepts: ["w"] },
      { key: "missed", moduleIndex: 0, concepts: ["s"], lastAttemptAt: "2026-11-15T10:00:00.000Z", lastCorrect: false },
      { key: "just-seen", moduleIndex: 0, concepts: ["w"], lastAttemptAt: "2026-11-17T17:00:00.000Z", lastCorrect: false },
    ];
    const keys = selectPractice(pool, { n: 2, currentModuleIndex: 0, mastery: (c) => (c === "s" ? 0.97 : 0.3), now, random: fixed });
    expect(keys.sort()).toEqual(["missed", "weak"]);
  });

  it("drills only the focus concepts", () => {
    const keys = selectPractice(cands, { n: 5, currentModuleIndex: 5, mastery: () => undefined, now, focus: ["c2-0"], random: fixed });
    expect(keys).toHaveLength(3);
    expect(keys.every((k) => k.startsWith("m2-"))).toBe(true);
  });
});

describe("grading", () => {
  it("parses typed numbers leniently", () => {
    expect(parseNumber("2.78")).toBe(2.78);
    expect(parseNumber("2,78")).toBe(2.78);
    expect(parseNumber("12,600")).toBe(12600);
    expect(parseNumber("−3")).toBe(-3);
    expect(parseNumber("2.78 m³/s")).toBe(2.78);
    expect(parseNumber("abc")).toBeNull();
  });
  it("grades numeric answers with relative tolerance and explanations by rubric points", () => {
    const num = { kind: "numeric" as const, id: "n", prompt: "PUE?", concepts: ["pue"], critical: false, explain: "x", transfer: false, answer: 29.1, tolerance: 0.03 };
    expect(grade(num, { kind: "numeric", text: "29" }).correct).toBe(true);
    expect(grade(num, { kind: "numeric", text: "25" }).correct).toBe(false);
    const ex = { kind: "explain" as const, id: "e", prompt: "Explain", concepts: ["pue"], critical: false, explain: "x", rubric: ["a", "b", "c", "d"] };
    expect(grade(ex, { kind: "explain", text: "…", points: [true, true, true, false] })).toEqual({ correct: true, score: 0.75 });
  });
});

describe("pacing and weekly review", () => {
  const schedule = {
    weeks: [
      { index: 1, start: "2026-11-16", end: "2026-11-22", minutes: 600, labels: [], allocations: [{ id: "a", title: "A", hours: 10 }], spareHours: 0 },
      { index: 2, start: "2026-11-23", end: "2026-11-29", minutes: 600, labels: [], allocations: [{ id: "b", title: "B", hours: 10 }], spareHours: 0 },
    ],
    spans: {},
    capacityHours: 20,
    neededHours: 20,
    unfinished: [],
  } as unknown as Schedule;

  it("compares hours covered with hours planned to date", () => {
    const perDay = () => 600 / 7;
    const p = computePacing(schedule, "2026-11-18", perDay, [{ id: "a", hours: 10 }, { id: "b", hours: 10 }], (id) => (id === "a" ? 0.3 : 0));
    expect(p.expectedHours).toBeCloseTo((10 * 2) / 7, 5);
    expect(p.actualHours).toBeCloseTo(3, 5);
    expect(p.status).toBe("on-track");
    expect(computePacing(schedule, "2026-11-26", perDay, [{ id: "a", hours: 10 }], () => 0).status).toBe("behind");
    expect(computePacing(schedule, "2026-11-01", perDay, [{ id: "a", hours: 10 }], () => 0).status).toBe("not-started");
  });

  it("builds calibration bins and review retention for the last week", () => {
    const a = (over: Partial<AttemptRow>): AttemptRow => ({ itemId: "q", kind: "practice", submittedAt: "2026-11-16T10:00:00.000Z", correct: true, score: 1, hintTier: 0, seconds: 10, skills: ["x"], ...over });
    const logs: ReviewLogRow[] = [
      { cardId: "c1", rating: 3, reviewedAt: "2026-11-16T10:00:00.000Z", log: {}, prevState: 2 },
      { cardId: "c2", rating: 1, reviewedAt: "2026-11-16T10:00:00.000Z", log: {}, prevState: 2 },
      { cardId: "c3", rating: 3, reviewedAt: "2026-11-01T10:00:00.000Z", log: {}, prevState: 2 },
    ];
    const s = weeklySummary({
      attempts: [a({ confidence: 4 }), a({ confidence: 4, correct: false, itemId: "bad" }), a({ confidence: 1, correct: false }), a({ submittedAt: "2026-10-01T00:00:00.000Z" })],
      reviewLog: logs,
      checkpoints: [{ moduleId: "induction", kind: "delayed", startedAt: "2026-11-16T09:00:00.000Z", score: 0.9, passed: true, details: {} }],
      sessions: [{ date: "2026-11-16", plannedMinutes: 75, doneMinutes: 60, items: [] }],
      now,
    });
    expect(s.attempts).toBe(3);
    expect(s.calibration).toEqual([
      { confidence: 1, n: 1, accuracy: 0 },
      { confidence: 4, n: 2, accuracy: 0.5 },
    ]);
    expect(s.confidentErrors).toEqual(["bad"]);
    expect(s.reviews).toEqual({ count: 2, again: 1, retention: 0.5 });
    expect(s.slipping).toEqual(["c2"]);
    expect(s.confirmations).toHaveLength(1);
    expect(s.minutesDone).toBe(60);
  });
});
