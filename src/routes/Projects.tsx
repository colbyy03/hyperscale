import { Badge, Card, PageHeader } from "@/components/ui";
import { curriculum, displayNumber } from "@/content";
import { formatDate, useSchedule } from "@/hooks/data";

const DESCRIPTIONS: Record<string, string> = {
  "project-1":
    "Day-ahead forecasts of IT load, cooling power and PUE with quantile intervals, built on your leakage-safe evaluation harness and checked for generalization on real building data (BDG2).",
  "project-2":
    "Probabilistic data-center power forecasts (Google PowerData2019) feeding a stochastic optimization of capacity or plant scheduling, with calibrated intervals and a decision memo.",
  "project-3":
    "A deployed fault detection and diagnosis service with CI quality gates, a model registry and drift monitoring, plus a small RAG assistant that explains alerts.",
  "capstone-1":
    "Forecasting, anomaly detection and control (economic MPC and a safe PPO agent) for the cooling plant, evaluated across held-out scenarios against your week-1 manual score and PI controller.",
  "capstone-2":
    "An LLM agent that diagnoses facility faults from telemetry (through an MCP server) and messy maintenance logs, with a full evaluation harness, ablations and prompt-injection tests.",
};

export function Projects() {
  const schedule = useSchedule();
  const projects = curriculum.modules.filter((m) => m.kind);
  return (
    <div>
      <PageHeader eyebrow="Portfolio" title="Projects">
        Every module ends with a small build. These larger projects each become their own repo and a post for your Quarto site.
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p) => {
          const span = schedule.spans[p.id];
          return (
            <Card key={p.id}>
              <div className="flex items-start justify-between gap-3">
                <Badge tone={p.kind === "capstone" ? "heat" : "accent"}>{displayNumber[p.id]}</Badge>
                <span className="text-xs text-faint">
                  {p.hours} h{span?.end ? ` · due ${formatDate(span.end)}` : ""}
                </span>
              </div>
              <h2 className="mt-3 font-semibold">{p.title.replace(/^Milestone project \d: /, "")}</h2>
              <p className="mt-1.5 text-sm text-muted">{DESCRIPTIONS[p.id]}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
