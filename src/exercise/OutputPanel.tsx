/** Run and test output shared by the editor and Parsons exercises. */
import clsx from "clsx";
import { CheckCircle2, CircleAlert, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui";
import type { GradeResult, RunResult } from "@/runtime/protocol";

export type Output = { kind: "run"; result: RunResult } | { kind: "grade"; result: GradeResult } | { kind: "error"; message: string } | null;

function Pre({ children, tone }: { children: ReactNode; tone?: "danger" }) {
  return <pre className={clsx("mt-2 max-h-72 overflow-auto rounded-xl border bg-surface p-3 font-mono text-[13px] leading-relaxed whitespace-pre-wrap", tone === "danger" ? "border-danger/40 text-danger" : "border-line")}>{children}</pre>;
}

export function OutputPanel({ output }: { output: Output }) {
  if (!output) return null;
  if (output.kind === "error") {
    return (
      <div className="mt-4 rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm" role="alert">
        <CircleAlert size={15} className="mr-1 inline text-danger" /> {output.message}
      </div>
    );
  }
  if (output.kind === "run") {
    const r = output.result;
    const empty = !r.stdout && !r.stderr && !r.value && !r.error;
    return (
      <div className="mt-4" data-testid="run-output">
        <div className="text-xs font-semibold tracking-wider text-faint uppercase">Output · {r.seconds.toFixed(2)} s</div>
        {empty && <Pre>(no output: print something, or end with an expression)</Pre>}
        {r.stdout && <Pre>{r.stdout}</Pre>}
        {r.value && <Pre>{r.value}</Pre>}
        {r.stderr && <Pre tone="danger">{r.stderr}</Pre>}
        {r.error && <Pre tone="danger">{r.error}</Pre>}
      </div>
    );
  }
  const g = output.result;
  return (
    <div className="mt-4" data-testid="grade-output">
      <div className={clsx("flex items-center gap-2 font-medium", g.allPassed ? "text-accent" : "text-heat")}>
        {g.allPassed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        {g.allPassed ? `All ${g.total} tests pass.` : g.collectionErrors.length ? "Your code didn't load." : `${g.passed} of ${g.total} tests pass.`}
        <span className="text-xs font-normal text-faint">{g.seconds.toFixed(2)} s</span>
      </div>
      {g.collectionErrors.length > 0 && <Pre tone="danger">{g.collectionErrors[0]!.split("\n").slice(-12).join("\n")}</Pre>}
      <ul className="mt-2 flex flex-col gap-1.5">
        {g.tests.map((t) => (
          <li key={t.name} className={clsx("rounded-xl border p-2.5 text-sm", t.outcome === "passed" ? "border-line" : "border-heat/40 bg-heat-soft")}>
            <div className="flex items-center gap-2">
              {t.outcome === "passed" ? <CheckCircle2 size={15} className="shrink-0 text-accent" /> : <XCircle size={15} className="shrink-0 text-heat" />}
              <span className={clsx(t.outcome === "passed" && "text-muted")}>{t.description ?? t.name.replace(/^test_/, "").replace(/_/g, " ")}</span>
              {t.hidden && <Badge className="ml-auto">hidden test</Badge>}
            </div>
            {t.message && <div className="mt-1.5 pl-6 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-ink">{t.message}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
