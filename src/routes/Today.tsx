import clsx from "clsx";
import { ArrowRight, BookOpen, CheckCircle2, Clock, Dumbbell, LogOut, Minus, Plus, Repeat, ShieldCheck, Shuffle, Swords } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Badge, ButtonLink, Card, PageHeader, SectionTitle } from "@/components/ui";
import { curriculum, displayNumber, lessonsOf } from "@/content";
import { isAdvanced } from "@/engine/gates";
import { computePacing } from "@/engine/pacing";
import type { ItemKind } from "@/engine/planner";
import { minutesOn } from "@/engine/schedule";
import { daysUntil, formatDate, formatMinutes, useCalendar, useSchedule, useToday } from "@/hooks/data";
import { useDayPlan } from "@/hooks/learning";
import type { LearningState } from "@/learn/state";
import { setSetting } from "@/state/settings";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const KIND_ICON: Record<ItemKind, ReactNode> = {
  reviews: <Repeat size={16} />,
  confirm: <ShieldCheck size={16} />,
  checkpoint: <ShieldCheck size={16} />,
  lesson: <BookOpen size={16} />,
  practice: <Shuffle size={16} />,
  drill: <Dumbbell size={16} />,
  challenge: <Swords size={16} />,
  exit: <LogOut size={16} />,
};

const VARIANT_LABEL = { rest: "Rest day", lite: "Lite day", standard: "Standard session", lab: "Lab day" } as const;

function TimeControl({ minutes, date, overridden }: { minutes: number; date: string; overridden: boolean }) {
  const set = (m: number) => void setSetting("todayOverride", { date, minutes: Math.max(0, Math.min(480, m)) });
  return (
    <div className="flex items-center gap-2">
      <button className="rounded-lg border border-line p-1.5 text-muted hover:text-ink" aria-label="Less time today" onClick={() => set(minutes - 15)}>
        <Minus size={14} />
      </button>
      <div className="min-w-24 text-center text-lg font-semibold tabular-nums" data-testid="minutes-today">
        {formatMinutes(minutes)}
      </div>
      <button className="rounded-lg border border-line p-1.5 text-muted hover:text-ink" aria-label="More time today" onClick={() => set(minutes + 15)}>
        <Plus size={14} />
      </button>
      {overridden && (
        <button className="ml-1 text-xs text-faint underline" onClick={() => void setSetting("todayOverride", null)}>
          reset
        </button>
      )}
    </div>
  );
}

/** Share of a module covered: 1 once its gate is passed; otherwise lesson time against half its hours (the rest is practice), capped at 90%. */
export function moduleFraction(learning: LearningState, id: string, hours: number): number {
  const st = learning.modules[id];
  if (!st || st.lessonsTotal === 0) return 0;
  if (st.gate && isAdvanced(st.gate.status)) return 1;
  const minutes = lessonsOf(id)
    .filter((l) => learning.completed.has(l.id))
    .reduce((s, l) => s + l.minutes, 0);
  return Math.min(0.9, minutes / (hours * 60 * 0.5));
}

export function Today() {
  const today = useToday();
  const schedule = useSchedule();
  const cal = useCalendar();
  const { plan, done, next, loaded, learning } = useDayPlan();
  const week = schedule.weeks.find((w) => w.index === today.week);
  const milestones = curriculum.milestones
    .map((m) => ({ ...m, date: schedule.spans[m.after]?.end }))
    .filter((m) => m.date && m.date >= today.date)
    .slice(0, 3);
  const pacing = computePacing(
    schedule,
    today.date,
    (d) => minutesOn(cal, d),
    // Scheduled hours include the review overhead, so covered hours must too.
    curriculum.modules.map((m) => ({ id: m.id, hours: m.hours * (1 + cal.reviewOverhead) })),
    (id) => moduleFraction(learning, id, curriculum.modules.find((m) => m.id === id)?.hours ?? 1),
  );
  const planned = plan.items.reduce((s, i) => s + i.minutes, 0);
  const allDone = plan.items.length > 0 && !next;

  return (
    <div>
      <PageHeader eyebrow={`${formatDate(today.date, { weekday: "long", month: "long", day: "numeric" })} · Week ${Math.max(today.week, 0)}`} title={greeting()}>
        {today.holiday ? `${today.holiday}. ` : ""}
        {today.periodLabel}.
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-5" data-testid="today-session">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionTitle>Today's session</SectionTitle>
              <div className="-mt-1 flex items-center gap-2 text-sm text-muted">
                <Clock size={14} /> Time available today
              </div>
            </div>
            <TimeControl minutes={today.minutes} date={today.date} overridden={today.overridden} />
          </div>

          {!loaded ? (
            <p className="text-sm text-faint">Planning your session…</p>
          ) : plan.items.length > 0 ? (
            <>
              <div className="-mb-2 flex items-center gap-2 text-xs text-faint">
                <Badge>{VARIANT_LABEL[plan.variant]}</Badge>
                <span>
                  {planned} of {today.minutes} min planned
                </span>
              </div>
              <ol className="flex flex-col gap-1.5" data-testid="plan">
                {plan.items.map((item) => {
                  const isDone = done.has(item.key);
                  const isNext = next?.key === item.key;
                  return (
                    <li key={item.key} data-testid={`plan-${item.kind}`} data-done={isDone || undefined}>
                      <Link
                        to={item.href}
                        className={clsx(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                          isNext ? "bg-accent-soft ring-1 ring-accent/40" : "bg-surface-2 hover:bg-surface-3",
                          isDone && "opacity-70",
                        )}
                      >
                        <span className={clsx("shrink-0", isDone || isNext ? "text-accent" : "text-muted")}>{isDone ? <CheckCircle2 size={16} /> : KIND_ICON[item.kind]}</span>
                        <span className="min-w-0 flex-1">
                          <span className={clsx("block truncate", isDone && "line-through decoration-faint")}>{item.title}</span>
                          {item.detail && <span className="block truncate text-xs text-faint">{item.detail}</span>}
                        </span>
                        <span className="shrink-0 text-muted tabular-nums">{item.minutes} min</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              {next ? (
                <ButtonLink variant="primary" className="self-start" to={next.href} data-testid="start-session">
                  {done.size ? "Continue" : "Start session"}: {next.title} <ArrowRight size={16} />
                </ButtonLink>
              ) : (
                <p className="inline-flex items-center gap-2 text-sm text-accent">
                  <CheckCircle2 size={18} /> Today's session is done. Nice work.
                </p>
              )}
              {allDone && today.minutes - planned >= 15 && <p className="text-xs text-faint">You have time left: the Practice tab has drills by concept, and Review picks up any cards coming due.</p>}
            </>
          ) : today.minutes === 0 ? (
            <p className="text-sm text-muted">No study time planned today. Rest counts too.</p>
          ) : (
            <p className="text-sm text-muted">Nothing is due and you've finished everything authored so far. New modules land ahead of your schedule.</p>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <SectionTitle>Pace</SectionTitle>
            {pacing.status === "not-started" ? (
              <p className="text-sm text-muted">The course starts {formatDate(schedule.weeks[0]?.start ?? today.date)}.</p>
            ) : (
              <>
                <div className={clsx("text-xl font-semibold", pacing.status === "behind" ? "text-heat" : pacing.status === "ahead" ? "text-accent" : "")}>
                  {pacing.status === "on-track" ? "On track" : `${Math.abs(pacing.deltaHours).toFixed(1)} h ${pacing.status}`}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {pacing.actualHours.toFixed(1)} h of curriculum covered, {pacing.expectedHours.toFixed(1)} h planned before today.
                </p>
                {pacing.status === "behind" && <p className="mt-2 text-xs text-faint">A lab day or a little extra time this week closes the gap. The schedule re-flows either way.</p>}
              </>
            )}
          </Card>

          <Card>
            <SectionTitle action={week && <span className="text-xs text-faint">{formatDate(week.start)} – {formatDate(week.end)}</span>}>This week</SectionTitle>
            {week ? (
              <ul className="flex flex-col gap-2">
                {week.allocations.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link to={`/learn/${a.id}`} className="truncate hover:text-accent">
                      <span className="mr-2 text-faint tabular-nums">{displayNumber[a.id]}</span>
                      {a.title}
                    </Link>
                    <span className="shrink-0 text-muted tabular-nums">{a.hours.toFixed(1)} h</span>
                  </li>
                ))}
                <li className="mt-1 border-t border-line pt-2 text-xs text-faint">{(week.minutes / 60).toFixed(1)} h planned this week</li>
              </ul>
            ) : (
              <p className="text-sm text-muted">The course schedule starts {formatDate(schedule.weeks[0]?.start ?? today.date)}.</p>
            )}
          </Card>

          <Card>
            <SectionTitle>Milestones</SectionTitle>
            <ul className="flex flex-col gap-3">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <Badge tone="accent">{m.id}</Badge> <span className="ml-1">{m.title}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="tabular-nums">{formatDate(m.date!)}</div>
                    <div className="text-xs text-faint">{daysUntil(m.date!, today.date)} days</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
