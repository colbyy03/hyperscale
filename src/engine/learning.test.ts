import { describe, expect, it } from "vitest";
import type { CheckpointItem } from "@/content/schema";
import type { AttemptRow, CheckpointRow } from "@/db";
import { delayedCheckDue, gateState, isAdvanced, scoreCheckpoint } from "./gates";
import { bktUpdate, BKT_BY_KIND, computeMastery, MASTERED, weakSkills } from "./mastery";
import { planToday, type PlannerInput } from "./planner";

const attempt = (over: Partial<AttemptRow>): AttemptRow => ({
  itemId: "x",
  kind: "code",
  submittedAt: "2026-11-17T10:00:00.000Z",
  correct: true,
  score: 1,
  hintTier: 0,
  seconds: 30,
  skills: ["broadcasting"],
  ...over,
});

describe("knowledge tracing", () => {
  it("raises P(known) on success and lowers it on failure", () => {
    const k = BKT_BY_KIND.code!;
    expect(bktUpdate(0.2, true, k)).toBeGreaterThan(0.2);
    expect(bktUpdate(0.8, false, k)).toBeLessThan(0.8);
  });

  it("reaches mastery after several distinct successes, counting only first attempts per day", () => {
    const days = ["10", "11", "12", "13", "14"];
    const m = computeMastery(days.map((d, i) => attempt({ itemId: `item-${i}`, submittedAt: `2026-11-${d}T10:00:00.000Z` })));
    expect(m.get("broadcasting")!.p).toBeGreaterThanOrEqual(MASTERED);
    // Re-checking the same item on the same day adds no evidence.
    const spam = computeMastery([attempt({ correct: false }), attempt({ submittedAt: "2026-11-17T10:01:00.000Z" }), attempt({ submittedAt: "2026-11-17T10:02:00.000Z" })]);
    expect(spam.get("broadcasting")!.attempts).toBe(1);
    expect(spam.get("broadcasting")!.correct).toBe(0);
  });

  it("discounts hinted successes and treats bottom-out help as a miss", () => {
    const clean = computeMastery([attempt({})]).get("broadcasting")!.p;
    const hinted = computeMastery([attempt({ hintTier: 2 })]).get("broadcasting")!.p;
    const revealed = computeMastery([attempt({ hintTier: 4 })]).get("broadcasting")!;
    expect(hinted).toBeLessThan(clean);
    expect(revealed.correct).toBe(0);
    expect(weakSkills(computeMastery([attempt({ correct: false })]))[0]!.skill).toBe("broadcasting");
  });
});

const items: CheckpointItem[] = [
  { kind: "numeric", id: "a", prompt: "PUE?", answer: 1.2, tolerance: 0.01, concepts: ["pue"], critical: true, transfer: false, explain: "x" },
  { kind: "choice", id: "b", prompt: "Envelope?", options: ["x", "y"], answer: 1, concepts: ["e"], critical: false, transfer: true, explain: "x" },
  { kind: "choice", id: "c", prompt: "Other?", options: ["x", "y"], answer: 0, concepts: ["e"], critical: false, transfer: false, explain: "x" },
  { kind: "explain", id: "d", prompt: "Explain…", rubric: ["1", "2", "3", "4"], concepts: ["e"], critical: false, explain: "x" },
];

describe("checkpoint scoring", () => {
  it("passes only when threshold, critical, transfer and explanation all hold", () => {
    const all = scoreCheckpoint(items, { a: { score: 1 }, b: { score: 1 }, c: { score: 1 }, d: { score: 0.75 } }, 0.85);
    expect(all.passed).toBe(true);
    const missCritical = scoreCheckpoint(items, { a: { score: 0 }, b: { score: 1 }, c: { score: 1 }, d: { score: 1 } }, 0.7);
    expect(missCritical.passed).toBe(false);
    expect(missCritical.reasons.join(" ")).toMatch(/critical/);
    const weakExplain = scoreCheckpoint(items, { a: { score: 1 }, b: { score: 1 }, c: { score: 1 }, d: { score: 0.5 } }, 0.85);
    expect(weakExplain.passed).toBe(false);
    expect(weakExplain.explainOk).toBe(false);
  });
});

const row = (over: Partial<CheckpointRow>): CheckpointRow => ({ moduleId: "m", kind: "immediate", startedAt: "2026-11-17T10:00:00.000Z", score: 0.5, passed: false, details: {}, ...over });

describe("gate state machine", () => {
  const now = new Date("2026-11-17T12:00:00.000Z");
  it("is locked until the previous module advances, then open", () => {
    expect(gateState([], false, now).status).toBe("locked");
    expect(gateState([], true, now).status).toBe("open");
  });
  it("enforces a 24 h retake wait, then allows provisional advance after two fails", () => {
    const one = gateState([row({})], true, now);
    expect(one.status).toBe("retake-wait");
    expect(gateState([row({})], true, new Date("2026-11-18T11:00:00.000Z")).status).toBe("open");
    const two = gateState([row({}), row({ startedAt: "2026-11-18T11:00:00.000Z" })], true, new Date("2026-11-18T12:00:00.000Z"));
    expect(two.status).toBe("provisional");
    expect(isAdvanced(two.status)).toBe(true);
  });
  it("schedules a delayed confirmation 3 days after a pass", () => {
    const passed = gateState([row({ passed: true, score: 0.9 })], true, now);
    expect(passed.status).toBe("passed");
    expect(delayedCheckDue(passed, now)).toBe(false);
    expect(delayedCheckDue(passed, new Date("2026-11-20T10:00:00.000Z"))).toBe(true);
    expect(gateState([row({ passed: true }), row({ kind: "delayed", passed: true, startedAt: "2026-11-20T11:00:00.000Z" })], true, now).status).toBe("confirmed");
  });
  it("offers a failed delayed check again three days later without revoking the pass", () => {
    const rows = [row({ passed: true }), row({ kind: "delayed", passed: false, startedAt: "2026-11-20T11:00:00.000Z" })];
    const after = gateState(rows, true, new Date("2026-11-21T10:00:00.000Z"));
    expect(after.status).toBe("passed");
    expect(delayedCheckDue(after, new Date("2026-11-21T10:00:00.000Z"))).toBe(false);
    expect(delayedCheckDue(after, new Date("2026-11-23T12:00:00.000Z"))).toBe(true);
  });
});

const base: PlannerInput = {
  minutes: 75,
  dueCards: 12,
  newCards: 6,
  lessons: [
    { id: "l1", title: "Lesson one", minutes: 25, href: "/l1" },
    { id: "l2", title: "Lesson two", minutes: 30, href: "/l2" },
  ],
  confirmations: [],
  checkpoints: [],
  practicePool: 12,
  weakSkills: ["Broadcasting"],
  challenge: { id: "c1", title: "Challenge", minutes: 15, href: "/c1" },
  device: "desktop",
};

const total = (p: ReturnType<typeof planToday>) => p.items.reduce((s, i) => s + i.minutes, 0);

describe("daily planner", () => {
  it("never plans more than the minutes available", () => {
    for (const minutes of [10, 15, 20, 30, 45, 60, 75, 90, 150]) {
      for (const device of ["desktop", "phone"] as const) {
        const plan = planToday({ ...base, minutes, device, checkpoints: [{ moduleId: "m", title: "M", href: "/cp" }] });
        expect(total(plan)).toBeLessThanOrEqual(minutes);
        expect(total(planToday({ ...base, minutes, device }))).toBeLessThanOrEqual(minutes);
      }
    }
  });
  it("starts with reviews (capped at 15 min) and ends with exit recall", () => {
    const plan = planToday({ ...base, dueCards: 80 });
    expect(plan.items[0]!.kind).toBe("reviews");
    expect(plan.items[0]!.minutes).toBe(15);
    expect(plan.items.at(-1)!.kind).toBe("exit");
    expect(plan.items.some((i) => i.kind === "lesson")).toBe(true);
  });
  it("puts gates before new lessons and drops the challenge on a checkpoint day", () => {
    const plan = planToday({ ...base, checkpoints: [{ moduleId: "m", title: "Module", href: "/cp" }], confirmations: [{ moduleId: "k", title: "K", href: "/k" }] });
    const kinds = plan.items.map((i) => i.kind);
    expect(kinds.indexOf("confirm")).toBeLessThan(kinds.indexOf("lesson"));
    expect(kinds.indexOf("checkpoint")).toBeLessThan(kinds.indexOf("lesson"));
    expect(kinds).not.toContain("challenge");
  });
  it("gives new material priority over the challenge on short days", () => {
    const plan = planToday({ ...base, minutes: 45 });
    expect(plan.items.find((i) => i.kind === "lesson")?.minutes).toBe(25);
    expect(plan.items.some((i) => i.kind === "challenge")).toBe(false);
    const long = planToday({ ...base, minutes: 75 });
    expect(long.items.some((i) => i.kind === "challenge")).toBe(true);
  });
  it("keeps lessons finished today in the plan so it doesn't shift under you", () => {
    const plan = planToday({ ...base, lessons: [{ ...base.lessons[0]!, done: true }, base.lessons[1]!] });
    expect(plan.items.filter((i) => i.kind === "lesson").map((i) => i.key)).toEqual(["lesson:l1"]);
    expect(plan.items.find((i) => i.key === "lesson:l1")?.minutes).toBe(25);
  });
  it("makes lite days of reviews plus three items, and lab days with a weakness drill", () => {
    const lite = planToday({ ...base, minutes: 15 });
    expect(lite.variant).toBe("lite");
    expect(lite.items.map((i) => i.kind)).toEqual(["reviews", "practice"]);
    expect(lite.items[1]!.href).toContain("n=3");
    const lab = planToday({ ...base, minutes: 150 });
    expect(lab.variant).toBe("lab");
    expect(lab.items.some((i) => i.kind === "drill")).toBe(true);
  });
  it("skips the code challenge on a phone and plans nothing on a rest day", () => {
    expect(planToday({ ...base, device: "phone" }).items.some((i) => i.kind === "challenge")).toBe(false);
    expect(planToday({ ...base, minutes: 0 }).items).toEqual([]);
  });
});
