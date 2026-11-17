import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge, ButtonLink, Card, PageHeader, ProgressBar, SectionTitle, Stat } from "@/components/ui";
import { content, curriculum, displayNumber } from "@/content";
import { db, type ReviewLogRow, type SessionRow } from "@/db";
import { MASTERED, weakSkills } from "@/engine/mastery";
import { addDays, minutesOn } from "@/engine/schedule";
import { weeklySummary } from "@/engine/weekly";
import { CONFIDENCE_LABELS } from "@/learn/grading";
import { conceptTitle } from "@/learn/state";
import { daysUntil, formatDate, useCalendar, useSchedule, useToday } from "@/hooks/data";
import { useDeck, useLearning, useNow } from "@/hooks/learning";
import { GateBadge } from "./ModulePage";

const weekAgo = () => new Date(Date.now() - 7 * 86_400_000).toISOString();

function itemLabel(itemId: string): string {
  if (itemId.startsWith("q:")) return content.questions[itemId.slice(2)]?.prompt ?? itemId;
  if (itemId.startsWith("card:")) return content.cards[itemId.slice(5)]?.front ?? itemId;
  if (itemId.startsWith("cp:")) return `Checkpoint item ${itemId.split("/").pop()}`;
  return content.exercises.find((e) => e.id === itemId)?.title ?? itemId;
}

function WeeklyReview() {
  const learning = useLearning();
  const today = useToday();
  const cal = useCalendar();
  const schedule = useSchedule();
  const now = useNow();
  const reviewLog = useLiveQuery(() => db.reviewLog.where("reviewedAt").aboveOrEqual(weekAgo()).toArray(), [], [] as ReviewLogRow[]);
  const sessions = useLiveQuery(() => db.sessions.where("date").aboveOrEqual(addDays(today.date, -6)).toArray(), [today.date], [] as SessionRow[]);
  const s = useMemo(() => weeklySummary({ attempts: learning.attempts, reviewLog, checkpoints: learning.checkpointRows, sessions, now }), [learning, reviewLog, sessions, now]);
  let plannedMinutes = 0;
  for (let i = 0; i < 7; i++) plannedMinutes += minutesOn(cal, addDays(today.date, -i));
  const weak = weakSkills(learning.mastery).slice(0, 5);
  const nextWeek = schedule.weeks.find((w) => w.index === today.week + 1);
  const isSunday = new Date().getDay() === 0;

  return (
    <section className="mb-10">
      <SectionTitle action={<span className="text-xs text-faint">last 7 days</span>}>{isSunday ? "Weekly review" : "This week so far"}</SectionTitle>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-4">
          <Stat label="Time studied" value={`${Math.round(s.minutesDone / 6) / 10} h`} hint={`of ${Math.round(plannedMinutes / 6) / 10} h available · ${s.activeDays} active day${s.activeDays === 1 ? "" : "s"}`} />
          <Stat label="First-try accuracy" value={s.accuracy === null ? "–" : `${Math.round(s.accuracy * 100)}%`} hint={`${s.attempts} attempts`} />
          <Stat label="Review retention" value={s.reviews.retention === null ? "–" : `${Math.round(s.reviews.retention * 100)}%`} hint={`${s.reviews.count} reviews · target ${Math.round(0.9 * 100)}%`} />
        </Card>

        <Card>
          <div className="mb-2 text-sm font-medium">Calibration</div>
          {s.calibration.length ? (
            <ul className="flex flex-col gap-2 text-sm">
              {s.calibration.map((b) => (
                <li key={b.confidence}>
                  <div className="flex justify-between text-xs">
                    <span>{CONFIDENCE_LABELS[b.confidence - 1]}</span>
                    <span className="text-faint tabular-nums">
                      {Math.round(b.accuracy * 100)}% right · n={b.n}
                    </span>
                  </div>
                  <ProgressBar className="mt-1" value={b.accuracy} tone={b.confidence >= 3 && b.accuracy < 0.7 ? "heat" : "accent"} label={`${CONFIDENCE_LABELS[b.confidence - 1]} accuracy`} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Rate your confidence in mixed practice to see whether "certain" really means right.</p>
          )}
          {s.confidentErrors.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-faint">Sure, but wrong (likely misconceptions)</div>
              <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-xs text-muted">
                {s.confidentErrors.slice(0, 3).map((id) => (
                  <li key={id} className="line-clamp-2">
                    {itemLabel(id)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="text-sm font-medium">Weakest skills</div>
          {weak.length ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {weak.map((w) => (
                <li key={w.skill} className="flex justify-between gap-2">
                  <span className="truncate">{conceptTitle(w.skill)}</span>
                  <span className="shrink-0 text-xs text-faint tabular-nums">{Math.round(w.p * 100)}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Nothing weak yet.</p>
          )}
          {weak.length > 0 && (
            <ButtonLink className="self-start" to="/practice/session?mode=drill&n=15">
              20-minute weakness drill <ArrowRight size={14} />
            </ButtonLink>
          )}
          {s.hintHotspots.length > 0 && (
            <div>
              <div className="text-xs text-faint">Needed hints</div>
              <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted">
                {s.hintHotspots.slice(0, 3).map((h) => (
                  <li key={h.itemId}>
                    {itemLabel(h.itemId)} <span className="text-faint">(tier {h.maxTier})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.slipping.length > 0 && (
            <div>
              <div className="text-xs text-faint">Slipping cards</div>
              <ul className="mt-1 flex flex-col gap-0.5 text-xs text-muted">
                {s.slipping.slice(0, 3).map((id) => (
                  <li key={id} className="line-clamp-1">
                    {content.cards[id]?.front ?? id}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.confirmations.length > 0 && (
            <div className="text-xs text-muted">
              Delayed checks:{" "}
              {s.confirmations.map((c) => `${content.modules[c.moduleId]?.title ?? c.moduleId} ${c.passed ? "confirmed" : "missed"} (${Math.round(c.score * 100)}%)`).join("; ")}
            </div>
          )}
          {nextWeek && (
            <div className="mt-auto border-t border-line pt-3 text-xs text-muted">
              <span className="text-faint">Next week: </span>
              {nextWeek.allocations.map((a) => a.title).join(", ") || "buffer"}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}

export function Progress() {
  const schedule = useSchedule();
  const learning = useLearning();
  const today = useToday();
  const now = useNow();
  const deck = useDeck(now);
  const [showAll, setShowAll] = useState(false);
  const lessonsDone = learning.completed.size;
  const introduced = [...learning.introduced];
  const mastered = introduced.filter((c) => (learning.mastery.get(c)?.p ?? 0) >= MASTERED).length;
  const buffer = schedule.capacityHours - schedule.neededHours;
  const weeks = showAll ? schedule.weeks : schedule.weeks.filter((w) => w.index >= today.week - 1 && w.index <= today.week + 6);
  const authored = curriculum.modules.filter((m) => (learning.modules[m.id]?.lessonsTotal ?? 0) > 0);

  return (
    <div>
      <PageHeader eyebrow="Progress" title="Where you stand">
        Mastery from your first attempts, review health, and dates that re-flow from your time budget.
      </PageHeader>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <Stat label="Lessons completed" value={`${lessonsDone} / ${content.lessons.length}`} hint="authored so far" />
        </Card>
        <Card>
          <Stat label="Concepts mastered" value={`${mastered} / ${introduced.length}`} hint="of those taught so far" />
        </Card>
        <Card>
          <Stat label="Review deck" value={deck.rows.filter((r) => !r.draft).length} hint={`${deck.dueCount + deck.freshCount} due now`} />
        </Card>
        <Card>
          <Stat label="Buffer" value={`${Math.round(buffer)} h`} hint={buffer >= 0 ? "slack for slippage" : "over budget: add time or trim"} />
        </Card>
      </div>

      <WeeklyReview />

      <section className="mb-10">
        <SectionTitle>Mastery by module</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {authored.map((m) => {
            const st = learning.modules[m.id]!;
            return (
              <Link key={m.id} to={`/learn/${m.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-0 hover:bg-surface-2">
                <span className="w-8 text-right text-sm font-semibold text-faint tabular-nums">{displayNumber[m.id]}</span>
                <span className="min-w-40 flex-1 text-sm font-medium">{m.title}</span>
                <span className="text-xs text-muted tabular-nums">
                  {st.lessonsDone}/{st.lessonsTotal} lessons
                </span>
                <GateBadge st={st} />
                <div className="flex w-full items-center gap-2 sm:w-44">
                  <ProgressBar value={st.mastery} label={`${m.title} mastery`} />
                  <span className="w-9 text-right text-xs text-faint tabular-nums">{Math.round(st.mastery * 100)}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle>Milestones</SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          {curriculum.milestones.map((m) => {
            const date = schedule.spans[m.after]?.end;
            const reached = learning.modules[m.after]?.advanced && (learning.modules[m.after]?.lessonsTotal ?? 0) > 0;
            return (
              <div key={m.id} className="flex items-center gap-4 border-b border-line px-4 py-3 last:border-0">
                <Badge tone="accent">{m.id}</Badge>
                <div className="flex-1 text-sm font-medium">{m.title}</div>
                <div className="text-right text-sm">
                  <div className="tabular-nums">{date ? formatDate(date, { month: "short", day: "numeric", year: "numeric" }) : "–"}</div>
                  {date && <div className="text-xs text-faint">{reached ? "reached" : `${daysUntil(date, today.date)} days`}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle action={<button className="text-xs text-accent hover:underline" onClick={() => setShowAll((s) => !s)}>{showAll ? "Show nearby weeks" : `Show all ${schedule.weeks.length} weeks`}</button>}>
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
