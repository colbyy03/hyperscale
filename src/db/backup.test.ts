import { beforeEach, describe, expect, it } from "vitest";
import { exportAll, importAll, parseBackup, previewImport } from "./backup";
import { HyperscaleDB } from "./index";

let n = 0;
function freshDb() {
  n += 1;
  return new HyperscaleDB(`test-${n}-${Math.random()}`);
}

describe("backup", () => {
  let db: HyperscaleDB;
  beforeEach(async () => {
    db = freshDb();
    await db.settings.put({ key: "theme", value: "dark" });
    await db.progress.put({ lessonId: "induction/welcome", moduleId: "induction", status: "completed", updatedAt: "2026-11-16T10:00:00Z" });
    await db.attempts.add({ itemId: "x", kind: "predict", submittedAt: "2026-11-16T10:00:00Z", correct: true, score: 1, hintTier: 0, seconds: 12, skills: ["broadcasting"] });
    await db.secrets.put({ key: "anthropicApiKey", value: "sk-test-not-real" });
  });

  it("round-trips everything except secrets", async () => {
    const file = await exportAll(db, new Date("2026-11-16T12:00:00Z"));
    expect(file.app).toBe("hyperscale");
    expect(file.tables.secrets).toBeUndefined();
    expect(JSON.stringify(file)).not.toContain("sk-test-not-real");

    const other = freshDb();
    const summary = await importAll(other, parseBackup(JSON.stringify(file)), "replace");
    expect(summary.counts.progress).toBe(1);
    expect(await other.attempts.count()).toBe(1);
    expect((await other.settings.get("theme"))?.value).toBe("dark");
    expect(await other.secrets.count()).toBe(0);
  });

  it("merge keeps existing rows; replace clears them", async () => {
    const file = await exportAll(db);
    const other = freshDb();
    await other.progress.put({ lessonId: "python-mle/numpy", moduleId: "python-mle", status: "started", updatedAt: "2026-11-17T10:00:00Z" });
    await importAll(other, file, "merge");
    expect(await other.progress.count()).toBe(2);
    await importAll(other, file, "replace");
    expect(await other.progress.count()).toBe(1);
  });

  it("rejects non-backups and newer schemas, and previews counts", async () => {
    expect(() => parseBackup("not json")).toThrow(/valid JSON/);
    expect(() => parseBackup(JSON.stringify({ hello: 1 }))).toThrow(/Hyperscale backup/);
    const file = await exportAll(db);
    expect(() => parseBackup(JSON.stringify({ ...file, schemaVersion: 99 }))).toThrow(/newer version/);
    expect(previewImport(file).attempts).toBe(1);
  });
});
