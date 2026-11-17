import clsx from "clsx";
import { ArrowRight, Lock, Zap } from "lucide-react";
import { Link } from "react-router";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { displayNumber, moduleById } from "@/content";
import { ZONES } from "@/facility/zones";
import { moduleCompletion, useProgress } from "@/hooks/data";

export function Facility() {
  const progress = useProgress();
  const status = (modules: string[]) => {
    const states = modules.map((m) => moduleCompletion(m, progress));
    if (states.every((s) => s.complete)) return "complete" as const;
    if (states.some((s) => s.done > 0 || s.complete)) return "active" as const;
    return "locked" as const;
  };

  return (
    <div>
      <PageHeader eyebrow="Kestrel Ridge · Basalt Cloud (fictional)" title="Facility">
        A hyperscale campus on a semi-arid inland plateau. Each room comes online as you master the modules behind it.
      </PageHeader>

      <Card className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <Zap size={16} className="text-accent" /> Plant Control Room
          </div>
          <p className="mt-1 max-w-xl text-sm text-muted">Run Hall A's simulator: set supply air, chilled water, fans and the economizer, then see what a whole day costs. Inject faults to see how much margin the plant has.</p>
        </div>
        <ButtonLink variant="primary" to="/facility/control-room" className="shrink-0">
          Open the Control Room <ArrowRight size={16} />
        </ButtonLink>
      </Card>

      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface p-3 sm:block">
        <div className="relative grid aspect-[12/8] grid-cols-12 grid-rows-8 gap-2 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:40px_40px] p-2">
          {ZONES.map((z) => {
            const s = status(z.modules);
            return (
              <Link
                key={z.id}
                to={`/learn/${z.modules[0]}`}
                style={{ gridColumn: `${z.x + 1} / span ${z.w}`, gridRow: `${z.y + 1} / span ${z.h}` }}
                className={clsx(
                  "flex flex-col justify-between rounded-xl border p-3 transition-colors",
                  s === "complete" ? "border-accent bg-accent-soft" : s === "active" ? "border-info/60 bg-info-soft" : "border-line bg-surface-2/80 hover:border-line-strong",
                )}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    {s === "locked" && <Lock size={12} className="text-faint" />}
                    {z.name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">{z.blurb}</div>
                </div>
                <div className="text-[11px] text-faint">Modules {z.modules.map((m) => displayNumber[m]).join(", ")}</div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:hidden">
        {ZONES.map((z) => (
          <Card key={z.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{z.name}</div>
              <span className="text-xs text-faint">{status(z.modules)}</span>
            </div>
            <div className="mt-1 text-sm text-muted">{z.blurb}</div>
            <div className="mt-2 text-xs text-faint">{z.modules.map((m) => `${displayNumber[m]} ${moduleById(m)?.title ?? m}`).join(" · ")}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
