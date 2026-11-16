import { ArrowLeft, CheckCircle2, Circle, Hammer } from "lucide-react";
import { Link, useParams } from "react-router";
import { Badge, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { content, displayNumber, lessonsOf, MDS_MODE_LABEL, moduleById, PHASE_TITLES } from "@/content";
import { formatDate, useProgress, useSchedule } from "@/hooks/data";
import { NotFound } from "./NotFound";

export function ModulePage() {
  const { moduleId = "" } = useParams();
  const plan = moduleById(moduleId);
  const schedule = useSchedule();
  const progress = useProgress();
  if (!plan) return <NotFound />;
  const meta = content.modules[moduleId];
  const lessons = lessonsOf(moduleId);
  const span = schedule.spans[moduleId];

  return (
    <div>
      <Link to="/learn" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> All modules
      </Link>
      <PageHeader eyebrow={`${plan.kind ? "" : "Module "}${displayNumber[moduleId]} · Phase ${plan.phase}: ${PHASE_TITLES[plan.phase]}`} title={meta?.title ?? plan.title}>
        {meta?.summary}
      </PageHeader>

      <div className="mb-8 flex flex-wrap gap-2 text-sm">
        <Badge>{plan.hours} h planned</Badge>
        {span?.end && (
          <Badge>
            {formatDate(span.start)} – {formatDate(span.end)}
          </Badge>
        )}
        {plan.mds && <Badge tone="violet">{MDS_MODE_LABEL[plan.mds]}</Badge>}
        {plan.mdsCourses && plan.mdsCourses.length > 0 && <Badge tone="info">MDS overlap: DSCI {plan.mdsCourses.join(", ")}</Badge>}
      </div>

      {meta ? (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section>
            <SectionTitle>Lessons</SectionTitle>
            {lessons.length ? (
              <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {lessons.map((l, i) => {
                  const done = progress.get(l.id)?.status === "completed";
                  return (
                    <li key={l.id}>
                      <Link to={`/learn/${moduleId}/${l.id.split("/")[1]}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
                        {done ? <CheckCircle2 size={18} className="text-accent" /> : <Circle size={18} className="text-faint" />}
                        <span className="w-5 text-sm text-faint tabular-nums">{i + 1}</span>
                        <span className="flex-1 font-medium">{l.title}</span>
                        <span className="text-sm text-muted tabular-nums">{l.minutes} min</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState title="Lessons are being written">They will appear here before this module's scheduled start.</EmptyState>
            )}
          </section>
          <aside className="flex flex-col gap-5">
            <Card>
              <SectionTitle>You will be able to</SectionTitle>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted">
                {meta.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </Card>
            {meta.build && (
              <Card>
                <SectionTitle>
                  <span className="inline-flex items-center gap-1.5">
                    <Hammer size={14} /> Module build
                  </span>
                </SectionTitle>
                <div className="font-medium">{meta.build.title}</div>
                <p className="mt-1 text-sm text-muted">{meta.build.summary}</p>
              </Card>
            )}
          </aside>
        </div>
      ) : (
        <EmptyState title="This module hasn't been authored yet">
          Content is written ahead of your schedule{span ? `; this module is planned to start ${formatDate(span.start)}` : ""}. Its full syllabus is in PLAN.md, section 4.
        </EmptyState>
      )}
    </div>
  );
}
