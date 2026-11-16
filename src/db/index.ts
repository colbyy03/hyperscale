/**
 * Local-first storage (IndexedDB via Dexie). Everything about the learner lives here,
 * on this device only. `secrets` (the optional tutor API key) is never exported.
 */
import Dexie, { type EntityTable } from "dexie";

export interface SettingRow {
  key: string;
  value: unknown;
}

export interface ProgressRow {
  lessonId: string;
  moduleId: string;
  status: "started" | "completed";
  updatedAt: string;
  completedAt?: string;
  stepsDone?: string[];
}

export interface AttemptRow {
  id?: number;
  itemId: string;
  kind: string; // predict | check | code | derivation | parsons | sql | checkpoint | ...
  submittedAt: string;
  correct: boolean;
  score: number; // 0..1
  hintTier: number; // 0..4
  seconds: number;
  confidence?: number; // 1..4
  skills: string[];
  payload?: unknown;
  result?: unknown;
}

export interface CardRow {
  id: string;
  source: string; // e.g. lesson:linear-models/ridge or misconception:<id>
  due: string; // ISO timestamp
  state: unknown; // serialized FSRS card
  critical?: boolean;
  suspended?: boolean;
}

export interface ReviewLogRow {
  id?: number;
  cardId: string;
  rating: number;
  reviewedAt: string;
  log: unknown;
}

export interface SessionRow {
  date: string; // YYYY-MM-DD
  plannedMinutes: number;
  doneMinutes: number;
  items: unknown[];
}

export interface CheckpointRow {
  id?: number;
  moduleId: string;
  kind: "immediate" | "delayed";
  startedAt: string;
  score: number;
  passed: boolean;
  details: unknown;
}

export interface ProjectRow {
  id: string;
  status: "not-started" | "in-progress" | "done";
  completionCode?: string;
  repoUrl?: string;
  postUrl?: string;
  updatedAt: string;
}

export interface IncidentRow {
  id: string;
  status: "open" | "resolved";
  updatedAt: string;
}

export interface SimRunRow {
  id?: number;
  controller: string;
  scenario: string;
  kpis: Record<string, number>;
  createdAt: string;
}

export interface NoteRow {
  id?: number;
  lessonId: string;
  text: string;
  createdAt: string;
}

export interface SecretRow {
  key: string;
  value: string;
}

export const SCHEMA_VERSION = 1;

/** Tables included in exports (everything except secrets). */
export const EXPORTED_TABLES = [
  "settings",
  "progress",
  "attempts",
  "cards",
  "reviewLog",
  "sessions",
  "checkpoints",
  "projects",
  "incidents",
  "simRuns",
  "notes",
] as const;
export type ExportedTable = (typeof EXPORTED_TABLES)[number];

export class HyperscaleDB extends Dexie {
  settings!: EntityTable<SettingRow, "key">;
  progress!: EntityTable<ProgressRow, "lessonId">;
  attempts!: EntityTable<AttemptRow, "id">;
  cards!: EntityTable<CardRow, "id">;
  reviewLog!: EntityTable<ReviewLogRow, "id">;
  sessions!: EntityTable<SessionRow, "date">;
  checkpoints!: EntityTable<CheckpointRow, "id">;
  projects!: EntityTable<ProjectRow, "id">;
  incidents!: EntityTable<IncidentRow, "id">;
  simRuns!: EntityTable<SimRunRow, "id">;
  notes!: EntityTable<NoteRow, "id">;
  secrets!: EntityTable<SecretRow, "key">;

  constructor(name = "hyperscale") {
    super(name);
    this.version(SCHEMA_VERSION).stores({
      settings: "key",
      progress: "lessonId, moduleId, status",
      attempts: "++id, itemId, submittedAt, kind, *skills",
      cards: "id, due, source",
      reviewLog: "++id, cardId, reviewedAt",
      sessions: "date",
      checkpoints: "++id, moduleId, startedAt",
      projects: "id",
      incidents: "id",
      simRuns: "++id, controller, scenario, createdAt",
      notes: "++id, lessonId",
      secrets: "key",
    });
  }
}

export const db = new HyperscaleDB();

/** Ask the browser not to evict our data (Safari evicts non-persistent storage after inactivity). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
