/**
 * Typed learner settings persisted in IndexedDB, with defaults.
 * Read with `useSettings()`, write with `setSetting(key, value)`.
 */
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import type { DayBudget, PeriodType } from "@/engine/schedule";

export type Theme = "system" | "dark" | "light";

export interface Settings {
  theme: Theme;
  /** Per-period overrides of the default daily time budget (minutes). */
  timeBudget: Partial<Record<PeriodType, DayBudget>>;
  /** FSRS desired retention for the default deck. */
  desiredRetention: number;
  /** Maximum new review cards introduced per day. */
  newCardsPerDay: number;
  /** Override for "minutes available today" (date-scoped). */
  todayOverride: { date: string; minutes: number } | null;
  /** Tutor model (only used when an API key is stored). */
  tutorModel: "claude-opus-5-5" | "claude-sonnet-5-5" | "claude-haiku-5-5";
  /** Last time the learner exported a backup (ISO). */
  lastBackupAt: string | null;
  /** Whether the learner finished the first-run welcome. */
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  timeBudget: {},
  desiredRetention: 0.9,
  newCardsPerDay: 12,
  todayOverride: null,
  tutorModel: "claude-opus-5-5",
  lastBackupAt: null,
  onboarded: false,
};

export async function getSettings(): Promise<Settings> {
  const rows = await db.settings.toArray();
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in DEFAULT_SETTINGS) merged[r.key] = r.value;
  return merged as unknown as Settings;
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  await db.settings.put({ key, value });
}

/** Live settings; returns defaults until IndexedDB answers. */
export function useSettings(): Settings {
  return useLiveQuery(getSettings, [], DEFAULT_SETTINGS);
}
