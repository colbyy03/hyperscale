import { CheckCircle2, ChevronRight, Circle, CircleDashed, Lock } from "lucide-react";
import { Link } from "react-router";
import { Badge, PageHeader, ProgressBar } from "@/components/ui";
import { curriculum, displayNumber, MDS_MODE_LABEL, PHASE_TITLES } from "@/content";
import { formatDate, useSchedule } from "@/hooks/data";
import { useLearning } from "@/hooks/learning";
import { GateBadge } from "./ModulePage";

export function Learn() {
  const schedule = useSchedule();
  const learning = useLearning();
  const phases = [1, 2, 3, 4, 5, 6];

  return (
    <div>
      <PageHeader eyebrow="Curriculum" title="Learn">
        32 modules, 3 milestone projects and 2 capstones, in study order. Each module opens when you pass the one before it. Dates come from your time budget and re-flow as you go.
      </PageHeader>
      <div className="flex flex-col gap-10">
        {phases.map((p) => {
          const mods = curriculum.modules.filter((m) => m.phase === p);
          const first = schedule.spans[mods[0]!.id];
          const last = schedule.spans[mods[mods.length - 1]!.id];
          return (
            <section key={p}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">
                  <span className="mr-2 text-faint">Phase {p}</span>
                  {PHASE_TITLES[p]}
                </h2>
                {first && last?.end && (
                  <span className="text-sm text-faint">
                    {formatDate(first.start)} – {formatDate(last.end)}
                  </span>
                )}
              </div>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {mods.map((m) => {
                  const st = learning.modules[m.id];
                  const total = st?.lessonsTotal ?? 0;
                  const done = st?.lessonsDone ?? 0;
                  const span = schedule.spans[m.id];
                  const mastered = st && (st.gate ? st.gate.status === "passed" || st.gate.status === "confirmed" : st.lessonsComplete);
                  const icon =
                    total === 0 ? (
                      <CircleDashed size={18} className="text-faint" />
                    ) : mastered ? (
                      <CheckCircle2 size={18} className="text-accent" />
                    ) : learning.loaded && st && !st.unlocked ? (
                      <Lock size={16} className="mx-px text-faint" aria-label="Locked" />
                    ) : (
                      <Circle size={18} className="text-muted" />
                    );
                  return (
                    <li key={m.id}>
                      <Link to={`/learn/${m.id}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2">
                        <span className="w-8 shrink-0 text-right text-sm font-semibold text-faint tabular-nums">{displayNumber[m.id]}</span>
                        {icon}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{m.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                            <span>{m.hours} h</span>
                            {span?.end && (
                              <span>
                                {formatDate(span.start)} – {formatDate(span.end)}
                              </span>
                            )}
                            {m.mds && <Badge tone={m.mds === "accelerate" ? "info" : m.mds === "deepen" ? "violet" : "neutral"}>{MDS_MODE_LABEL[m.mds]}</Badge>}
                            {m.kind && <Badge tone="heat">{m.kind === "project" ? "Milestone project" : "Capstone"}</Badge>}
                            {st && <GateBadge st={st} />}
                            {total === 0 && !m.kind && <span className="text-faint">not yet authored</span>}
                          </div>
                          {total > 0 && <ProgressBar className="mt-2 max-w-48" value={done / total} label={`${m.title} progress`} />}
                        </div>
                        <ChevronRight size={18} className="shrink-0 text-faint" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
