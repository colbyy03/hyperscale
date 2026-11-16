import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Link } from "react-router";
import { Badge, Card, PageHeader, SectionTitle, Stat } from "@/components/ui";
import { content, curriculum, displayNumber } from "@/content";
import { db } from "@/db";
import { daysUntil, formatDate, moduleCompletion, useProgress, useSchedule, useToday } from "@/hooks/data";

export function Progress() {
  const schedule = useSchedule();
  const progress = useProgress();
  const today = useToday();
  const [showAll, setShowAll] = useState(false);
  const attempts = useLiveQuery(() => db.attempts.toArray(), [], []);
  const lessonsDone = [...progress.values()].filter((p) => p.status === "completed").length;
  const firstTry = attempts.length ? attempts.filter((a) => a.correct).length / attempts.length : null;
  const buffer = schedule.capacityHours - schedule.neededHours;
  const weeks = showAll ? schedule.weeks : schedule.weeks.filter((w) => w.index >= today.week - 1 && w.index <= today.week + 6);

  return (
    <div>
      <PageHeader eyebrow="Progress" title="Where you stand">
        Dates re-flow from your time budget. Mastery estimates appear as checkpoints and reviews come online.
      </PageHeader>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <Stat label="Lessons completed" value={`${lessonsDone} / ${content.lessons.length}`} hint="authored so far" />
        </Card>
        <Card>
          <Stat label="Prediction and check accuracy" value={firstTry === null ? "–" : `${Math.round(firstTry * 100)}%`} hint={`${attempts.length} attempts`} />
        </Card>
        <Card>
          <Stat label="Planned vs available" value={`${Math.round(schedule.neededHours)} / ${Math.round(schedule.capacityHours)} h`} hint="through Oct 3, 2027" />
        </Card>
        <Card>
          <Stat label="Buffer" value={`${Math.round(buffer)} h`} hint={buffer >= 0 ? "slack for slippage" : "over budget: add time or trim"} />
        </Card>
      </div>

      <section className="mb-10">
        <SectionTitle>Milestones</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {curriculum.milestones.map((m) => {
            const date = schedule.spans[m.after]?.end;
            const c = moduleCompletion(m.after, progress);
            return (
              <div key={m.id} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0">
                <Badge tone="accent">{m.id}</Badge>
                <div className="flex-1 text-sm font-medium">{m.title}</div>
                <div className="text-right text-sm">
                  <div className="tabular-nums">{date ? formatDate(date, { month: "short", day: "numeric", year: "numeric" }) : "–"}</div>
                  {date && <div className="text-xs text-faint">{c.complete ? "reached" : `${daysUntil(date, today.date)} days`}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle action={<button className="text-xs text-accent hover:underline" onClick={() => setShowAll((s) => !s)}>{showAll ? "Show nearby weeks" : "Show all 46 weeks"}</button>}>
          Week by week
        </SectionTitle>
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs tracking-wider text-faint uppercase">
                <th className="px-4 py-2.5 font-semibold">Week</th>
                <th className="px-4 py-2.5 font-semibold">Dates</th>
                <th className="px-4 py-2.5 font-semibold">Hours</th>
                <th className="px-4 py-2.5 font-semibold">Focus</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr key={w.index} className={clsx("border-b border-line align-top last:border-0", w.index === today.week && "bg-accent-soft")}>
                  <td className="px-4 py-2.5 font-medium tabular-nums">{w.index}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted">
                    {formatDate(w.start)} – {formatDate(w.end)}
                  </td>
                  <td className="px-4 py-2.5 text-muted tabular-nums">{(w.minutes / 60).toFixed(1)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {w.allocations.map((a) => (
                        <Link key={a.id} to={`/learn/${a.id}`} className="hover:text-accent">
                          <span className="text-faint">{displayNumber[a.id]}</span> {a.title} <span className="text-faint">({a.hours.toFixed(1)} h)</span>
                        </Link>
                      ))}
                      {w.spareHours >= 1 && <span className="text-faint">buffer ({w.spareHours.toFixed(1)} h)</span>}
                    </div>
                    <div className="mt-1 text-xs text-faint">{w.labels.join("; ")}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
