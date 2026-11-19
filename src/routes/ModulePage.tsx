import { ArrowLeft, CheckCircle2, Circle, Hammer, Lock, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, ProgressBar, SectionTitle } from "@/components/ui";
import { content, displayNumber, lessonsOf, MDS_MODE_LABEL, moduleById, PHASE_TITLES } from "@/content";
import { MASTERED, skillLevel } from "@/engine/mastery";
import { formatDate, useSchedule } from "@/hooks/data";
import { useLearning } from "@/hooks/learning";
import { conceptTitle, type ModuleState } from "@/learn/state";
import { NotFound } from "./NotFound";

export function GateBadge({ st }: { st: ModuleState }) {
  if (!st.hasCheckpoint || !st.gate) return null;
  if (st.delayedDue) return <Badge tone="info">Delayed check due</Badge>;
  switch (st.gate.status) {
    case "confirmed":
      return <Badge tone="success">Mastered</Badge>;
    case "passed":
      return <Badge tone="accent">Gate passed</Badge>;
    case "provisional":
      return <Badge tone="heat">Provisional</Badge>;
    case "retake-wait":
      return <Badge tone="heat">Retake soon</Badge>;
    default:
      return st.ready ? <Badge tone="info">Checkpoint ready</Badge> : null;
  }
}

function GateCard({ moduleId, st }: { moduleId: string; st: ModuleState }) {
  const cp = content.checkpoints[moduleId];
  return (
    <Card>
      <SectionTitle action={<GateBadge st={st} />}>
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={14} /> Mastery gate
        </span>
      </SectionTitle>
      {!cp ? (
        <p className="text-sm text-muted">The checkpoint ships with the rest of this module's lessons.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {cp.items.length} closed-book questions. Pass with {Math.round(cp.passThreshold * 100)}%, every critical item right, a transfer item and a solid explanation.
          </p>
          <div>
            <div className="mb-1 flex justify-between text-xs text-faint">
              <span>Estimated mastery</span>
              <span className="tabular-nums">{Math.round(st.mastery * 100)}%</span>
            </div>
            <ProgressBar value={st.mastery} label="Module mastery" />
          </div>
          <div>
            <ButtonLink variant={st.ready || st.delayedDue ? "primary" : "secondary"} to={`/learn/${moduleId}/checkpoint`}>
              {st.delayedDue ? "Take the delayed check" : st.ready ? "Take the checkpoint" : "View checkpoint"}
            </ButtonLink>
          </div>
        </div>
      )}
    </Card>
  );
}

export function ModulePage() {
  const { moduleId = "" } = useParams();
  const plan = moduleById(moduleId);
  const schedule = useSchedule();
  const learning = useLearning();
  if (!plan) return <NotFound />;
  const meta = content.modules[moduleId];
  const lessons = lessonsOf(moduleId);
  const span = schedule.spans[moduleId];
  const st = learning.modules[moduleId];
  const locked = learning.loaded && st && !st.unlocked && lessons.length > 0;

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
        {st && <GateBadge st={st} />}
      </div>

      {locked && st?.blockedBy && (
        <div className="mb-6 flex items-start gap-2 rounded-2xl border border-line bg-surface-2 p-4 text-sm text-muted">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <span>
            Opens when you pass the checkpoint for{" "}
            <Link className="text-accent underline" to={`/learn/${st.blockedBy}`}>
              Module {displayNumber[st.blockedBy]}
            </Link>
            . You can still open the lessons to look ahead.
          </span>
        </div>
      )}

      {meta ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <section>
            <SectionTitle>Lessons</SectionTitle>
            {lessons.length ? (
              <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
                {lessons.map((l, i) => {
                  const done = learning.completed.has(l.id);
                  return (
                    <li key={l.id}>
                      <Link to={`/learn/${moduleId}/${l.id.split("/")[1]}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
                        {done ? <CheckCircle2 size={18} className="text-accent" /> : locked ? <Lock size={16} className="text-faint" /> : <Circle size={18} className="text-faint" />}
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

            {st && st.concepts.length > 0 && (
              <div className="mt-8">
                <SectionTitle>Concepts</SectionTitle>
                <ul className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-2">
                  {st.concepts.map((c) => {
                    const m = learning.mastery.get(c);
                    const level = skillLevel(m);
                    return (
                      <li key={c} className="text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate" title={conceptTitle(c)}>
                            {conceptTitle(c)}
                          </span>
                          <span className="shrink-0 text-xs text-faint">{level === "unseen" ? "not yet" : `${Math.round(m!.p * 100)}%`}</span>
                        </div>
                        <ProgressBar className="mt-1" tone={m && m.p < 0.7 ? "heat" : "accent"} value={m?.p ?? 0} label={`${conceptTitle(c)} mastery`} />
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-faint">
                  Estimated from your first attempts with Bayesian knowledge tracing; {Math.round(MASTERED * 100)}% counts as mastered. Hints and revealed solutions count as weaker evidence.
                </p>
              </div>
            )}
          </section>
          <aside className="flex flex-col gap-5">
            {st && lessons.length > 0 && <GateCard moduleId={moduleId} st={st} />}
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
                {content.builds[moduleId] && (
                  <ButtonLink className="mt-3" to={`/learn/${moduleId}/build`}>
                    Read the brief · about {content.builds[moduleId]!.hours} h
                  </ButtonLink>
                )}
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
