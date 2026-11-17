/**
 * Mixed practice selection (PLAN.md §3.1 rule 7, §3.2): 40% current module, 30% the two
 * modules before it, 30% older material, weighted toward weak skills and items you missed,
 * with a cooldown so the same question doesn't come back the same day.
 */
export interface PracticeCandidate {
  key: string;
  /** Position of the item's module in study order. */
  moduleIndex: number;
  concepts: string[];
  lastAttemptAt?: string;
  lastCorrect?: boolean;
}

export interface PracticeOptions {
  n: number;
  currentModuleIndex: number;
  /** P(known) for a concept, if there is evidence. */
  mastery: (concept: string) => number | undefined;
  now: Date;
  /** Drill mode: only items touching these concepts, no bucket quotas. */
  focus?: string[];
  random?: () => number;
  cooldownHours?: number;
}

const DAY = 86_400_000;

export function selectPractice(candidates: PracticeCandidate[], opts: PracticeOptions): string[] {
  const rnd = opts.random ?? Math.random;
  const now = opts.now.getTime();
  let pool = candidates;
  if (opts.focus?.length) {
    const focus = new Set(opts.focus);
    pool = pool.filter((c) => c.concepts.some((x) => focus.has(x)));
  }
  const n = Math.min(opts.n, pool.length);
  if (n <= 0) return [];
  const cooldown = (opts.cooldownHours ?? 20) * 3_600_000;
  const rested = pool.filter((c) => !c.lastAttemptAt || now - Date.parse(c.lastAttemptAt) >= cooldown);
  const usable = rested.length >= n ? rested : pool;

  const score = (c: PracticeCandidate) => {
    const ps = c.concepts.map((x) => opts.mastery(x) ?? 0.2);
    const weakness = 1 - ps.reduce((a, b) => a + b, 0) / Math.max(ps.length, 1);
    const missed = c.lastCorrect === false ? 0.3 : 0;
    const unseen = c.lastAttemptAt ? 0 : 0.15;
    const stale = c.lastAttemptAt ? Math.min(0.3, ((now - Date.parse(c.lastAttemptAt)) / (30 * DAY)) * 0.3) : 0;
    return weakness + missed + unseen + stale + rnd() * 0.25;
  };
  const ranked = usable
    .map((c) => ({ c, s: score(c) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);

  if (opts.focus?.length) return interleaveByConcept(ranked.slice(0, n));

  const cur = opts.currentModuleIndex;
  const bucketOf = (c: PracticeCandidate) => (c.moduleIndex >= cur ? 0 : c.moduleIndex >= cur - 2 ? 1 : 2);
  const quotas = [Math.round(n * 0.4), Math.round(n * 0.3)];
  quotas.push(n - quotas[0]! - quotas[1]!);
  const chosen = new Set<string>();
  const picked: PracticeCandidate[] = [];
  for (const b of [0, 1, 2]) {
    for (const c of ranked) {
      if (picked.filter((p) => bucketOf(p) === b).length >= quotas[b]!) break;
      if (bucketOf(c) === b && !chosen.has(c.key)) {
        chosen.add(c.key);
        picked.push(c);
      }
    }
  }
  // Buckets that ran short hand their slots to the best remaining items.
  for (const c of ranked) {
    if (picked.length >= n) break;
    if (!chosen.has(c.key)) {
      chosen.add(c.key);
      picked.push(c);
    }
  }
  return interleaveByConcept(picked);
}

/** Greedy reorder so consecutive items rarely share a primary concept (interleaving). */
export function interleaveByConcept(items: PracticeCandidate[]): string[] {
  const left = [...items];
  const out: PracticeCandidate[] = [];
  while (left.length) {
    const prev = out.at(-1)?.concepts[0];
    const i = left.findIndex((c) => c.concepts[0] !== prev);
    out.push(left.splice(i === -1 ? 0 : i, 1)[0]!);
  }
  return out.map((c) => c.key);
}
