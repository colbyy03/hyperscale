/**
 * Placement summary for the Induction diagnostic: first-attempt scores per area and what they mean
 * for the plan (brisk, normal pace, full depth, or a test-out where the module allows one).
 */
import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router";
import { curriculum, displayNumber, MDS_MODE_LABEL } from "@/content";
import { db, type AttemptRow } from "@/db";

const AREAS = [
  { title: "Python and NumPy", module: "python-mle", items: ["place-py-mean-shape", "place-py-view", "place-py-transpose"] },
  { title: "Linear algebra", module: "linear-algebra", items: ["place-la-shape", "place-la-matvec", "place-la-collinear"] },
  { title: "Calculus", module: "calculus-optimization", items: ["place-calc-deriv", "place-calc-chain", "place-calc-gd"] },
  { title: "Probability", module: "probability-statistics", items: ["place-prob-bayes", "place-prob-expect", "place-prob-avg-var"] },
] as const;

export function placementAdvice(correct: number, answered: number, total: number, accelerate: boolean): string {
  if (answered < total) return `Answer all ${total} to see a recommendation.`;
  if (correct === total) return accelerate ? "Strong. When this module opens, try its checkpoint first: you can test out and skip what you already know." : "Strong. Move briskly through the early lessons; the module's checkpoint still decides.";
  if (correct === total - 1) return "Solid, with a gap. Take the module at a normal pace and watch for the idea you missed.";
  return "New or rusty. Take this module at full depth; it starts from the basics.";
}

export function Placement() {
  const ids = AREAS.flatMap((a) => a.items.map((i) => `q:induction/${i}`));
  const attempts = useLiveQuery(() => db.attempts.where("itemId").anyOf(ids).toArray(), [], [] as AttemptRow[]);
  const first = new Map<string, AttemptRow>();
  for (const a of [...attempts].sort((x, y) => x.submittedAt.localeCompare(y.submittedAt))) if (!first.has(a.itemId)) first.set(a.itemId, a);

  return (
    <section className="not-prose my-8" data-testid="placement">
      <div className="mb-3 text-xs font-semibold tracking-wider text-accent uppercase">Your starting point</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {AREAS.map((area) => {
          const mod = curriculum.modules.find((m) => m.id === area.module);
          const results = area.items.map((i) => first.get(`q:induction/${i}`));
          const answered = results.filter(Boolean).length;
          const correct = results.filter((r) => r?.correct).length;
          return (
            <div key={area.module} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{area.title}</div>
                <div className="flex gap-1" aria-label={`${correct} of ${area.items.length} correct`}>
                  {results.map((r, k) => (
                    <span key={k} className={clsx("h-2.5 w-2.5 rounded-full", !r ? "bg-surface-3" : r.correct ? "bg-accent" : "bg-heat")} />
                  ))}
                </div>
              </div>
              <Link to={`/learn/${area.module}`} className="mt-0.5 block text-xs text-muted hover:text-accent">
                Module {displayNumber[area.module]} · {mod?.title}
                {mod?.mds ? ` · ${MDS_MODE_LABEL[mod.mds]}` : ""}
              </Link>
              <p className="mt-2 text-sm leading-relaxed">{placementAdvice(correct, answered, area.items.length, mod?.mds === "accelerate")}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-faint">Only your first answer to each question counts. Mastery gates, not this check, decide when a module is done.</p>
    </section>
  );
}
