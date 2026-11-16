/**
 * One-file JSON backup of all learner data (except secrets), with schema versioning.
 */
import { z } from "zod";
import { EXPORTED_TABLES, SCHEMA_VERSION, type ExportedTable, type HyperscaleDB } from "./index";

export const backupSchema = z.object({
  app: z.literal("hyperscale"),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.string(),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});
export type BackupFile = z.infer<typeof backupSchema>;

export async function exportAll(db: HyperscaleDB, now = new Date()): Promise<BackupFile> {
  const tables: Record<string, Record<string, unknown>[]> = {};
  for (const name of EXPORTED_TABLES) {
    tables[name] = (await db.table(name).toArray()) as Record<string, unknown>[];
  }
  return { app: "hyperscale", schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), tables };
}

/** Upgrade older backup files to the current schema. Add a step here whenever SCHEMA_VERSION changes. */
export function migrateBackup(file: BackupFile): BackupFile {
  if (file.schemaVersion > SCHEMA_VERSION) {
    throw new Error(`This backup was made by a newer version of Hyperscale (schema ${file.schemaVersion}). Update the app first.`);
  }
  // v1 is the first schema: nothing to migrate yet.
  return { ...file, schemaVersion: SCHEMA_VERSION };
}

export interface ImportSummary {
  mode: "replace" | "merge";
  counts: Partial<Record<ExportedTable, number>>;
}

export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) throw new Error("That file isn't a Hyperscale backup.");
  return migrateBackup(parsed.data);
}

/** Preview what an import would change, without writing anything. */
export function previewImport(file: BackupFile): Partial<Record<ExportedTable, number>> {
  const counts: Partial<Record<ExportedTable, number>> = {};
  for (const name of EXPORTED_TABLES) counts[name] = file.tables[name]?.length ?? 0;
  return counts;
}

export async function importAll(db: HyperscaleDB, file: BackupFile, mode: "replace" | "merge"): Promise<ImportSummary> {
  const data = migrateBackup(file);
  const counts: Partial<Record<ExportedTable, number>> = {};
  await db.transaction("rw", EXPORTED_TABLES.map((t) => db.table(t)), async () => {
    for (const name of EXPORTED_TABLES) {
      const rows = data.tables[name] ?? [];
      const table = db.table(name);
      if (mode === "replace") await table.clear();
      if (rows.length) await table.bulkPut(rows);
      counts[name] = rows.length;
    }
  });
  return { mode, counts };
}
