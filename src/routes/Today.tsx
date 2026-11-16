import { ArrowRight, Clock, Minus, Plus } from "lucide-react";
import { Link } from "react-router";
import { Badge, ButtonLink, Card, PageHeader, SectionTitle } from "@/components/ui";
import { curriculum, displayNumber, moduleById } from "@/content";
import { planSessionOutline } from "@/engine/session";
import { daysUntil, formatDate, formatMinutes, useNextLesson, useSchedule, useToday } from "@/hooks/data";
import { setSetting } from "@/state/settings";

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function TimeControl({ minutes, date, overridden }: { minutes: number; date: string; overridden: boolean }) {
  const set = (m: number) => void setSetting("todayOverride", { date, minutes: Math.max(0, Math.min(480, m)) });
  return (
    <div className="flex items-center gap-2">
      <button className="rounded-lg border border-line p-1.5 text-muted hover:text-ink" aria-label="Less time today" onClick={() => set(minutes - 15)}>
        <Minus size={14} />
      </button>
      <div className="min-w-24 text-center text-lg font-semibold tabular-nums">{formatMinutes(minutes)}</div>
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

export function Today() {
  const today = useToday();
  const schedule = useSchedule();
  const next = useNextLesson();
  const week = schedule.weeks.find((w) => w.index === today.week);
  const outline = planSessionOutline(today.minutes, 0);
  const milestones = curriculum.milestones
    .map((m) => ({ ...m, date: schedule.spans[m.after]?.end }))
    .filter((m) => m.date && m.date >= today.date)
    .slice(0, 3);
  const nextModule = next ? moduleById(next.moduleId) : undefined;

  return (
    <div>
      <PageHeader eyebrow={`${formatDate(today.date, { weekday: "long", month: "long", day: "numeric" })} · Week ${Math.max(today.week, 0)}`} title={greeting()}>
        {today.holiday ? `${today.holiday}. ` : ""}
        {today.periodLabel}.
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionTitle>Today's session</SectionTitle>
              <div className="-mt-1 flex items-center gap-2 text-sm text-muted">
                <Clock size={14} /> Time available today
              </div>
            </div>
            <TimeControl minutes={today.minutes} date={today.date} overridden={today.overridden} />
          </div>

          {outline.blocks.length > 0 ? (
            <ol className="flex flex-col gap-1.5">
              {outline.blocks.map((b) => (
                <li key={b.kind} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2 text-sm">
                  <span>{b.label}</span>
                  <span className="text-muted tabular-nums">{b.minutes} min</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted">No study time planned today. Rest counts too.</p>
          )}

          {next && nextModule ? (
            <div className="rounded-xl border border-line p-4">
              <div className="text-xs text-faint">
                Module {displayNumber[next.moduleId]} · {nextModule.title}
              </div>
              <div className="mt-1 font-medium">{next.title}</div>
              <div className="mt-0.5 text-sm text-muted">{next.minutes} min</div>
              <ButtonLink variant="primary" className="mt-3" to={`/learn/${next.moduleId}/${next.id.split("/")[1]}`}>
                Start session <ArrowRight size={16} />
              </ButtonLink>
            </div>
          ) : (
            <p className="text-sm text-muted">You've finished everything that's been authored so far. New modules land ahead of your schedule.</p>
          )}
          <p className="text-xs text-faint">
            Spaced reviews, mixed practice and the daily challenge join the session as their modules ship; until then the session is new material.
          </p>
        </Card>

        <div className="flex flex-col gap-5">
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
