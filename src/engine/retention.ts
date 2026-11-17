/** Desired retention per card (PLAN.md §3.5). Kept apart from fsrs.ts so callers don't pull in ts-fsrs. */
export const CRITICAL_RETENTION = 0.93;

/** Gate-critical cards are scheduled to be recalled more reliably. */
export function retentionFor(critical: boolean | undefined, base: number): number {
  return critical ? Math.max(base, CRITICAL_RETENTION) : base;
}
