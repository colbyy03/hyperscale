import { MDXProvider } from "@mdx-js/react";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Lock } from "lucide-react";
import type { MDXContent } from "mdx/types";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Badge, Button, ButtonLink, Card } from "@/components/ui";
import { content, displayNumber, lessonsOf, loadLesson, moduleById } from "@/content";
import { formatAuthors, loadSources, sourceLink, type SourceRecord } from "@/content/sources";
import { db } from "@/db";
import { enrollCards } from "@/engine/cards";
import { useProgress } from "@/hooks/data";
import { useDayPlan } from "@/hooks/learning";
import { getSettings } from "@/state/settings";
import { lessonComponents } from "@/lesson/components";
import { LessonContext } from "@/lesson/context";
import { NotFound } from "./NotFound";

function LessonSources({ ids }: { ids: string[] }) {
  const [records, setRecords] = useState<Array<SourceRecord | string>>([]);
  useEffect(() => {
    let alive = true;
    void loadSources().then(({ byId }) => {
      if (!alive) return;
      // Several cited ids can resolve to one record (aliases); list each source once.
      const seen = new Set<string>();
      const out: Array<SourceRecord | string> = [];
      for (const id of ids) {
        const r = byId.get(id);
        const key = r?.id ?? id;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(r ?? id);
      }
      setRecords(out);
    });
    return () => {
      alive = false;
    };
  }, [ids]);
  if (!ids.length) return null;
  return (
    <section className="mt-12 border-t border-line pt-6">
      <h2 className="mb-3 text-sm font-semibold tracking-wider text-faint uppercase">Sources</h2>
      <ol className="flex flex-col gap-2 text-sm text-muted">
        {records.map((r) =>
          typeof r === "string" ? (
            <li key={r}>{r}</li>
          ) : (
            <li key={r.id}>
              {formatAuthors(r.authors)} ({r.year ?? "n.d."}). <span className="text-ink">{r.title}</span>
              {r.venue ? `. ${r.venue}` : ""}.{" "}
              <a href={sourceLink(r)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-accent hover:underline">
                link <ExternalLink size={11} />
              </a>
              {r.access === "paywalled" && <span className="ml-1 text-faint">(paywalled)</span>}
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

function sessionPeek(moduleId: string): boolean {
  try {
    return sessionStorage.getItem(`hs-peek:${moduleId}`) === "1";
  } catch {
    return false;
  }
}

function rememberPeek(moduleId: string) {
  try {
    sessionStorage.setItem(`hs-peek:${moduleId}`, "1");
  } catch {
    /* best effort: the in-memory flag still works */
  }
}

export function LessonPage() {
  const { moduleId = "", lessonSlug = "" } = useParams();
  const lessons = lessonsOf(moduleId);
  const idx = lessons.findIndex((l) => l.id === `${moduleId}/${lessonSlug}`);
  const lesson = lessons[idx];
  const plan = moduleById(moduleId);
  const progress = useProgress();
  const [Body, setBody] = useState<MDXContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  // "Open anyway" on a locked module lasts for this browser session.
  const [peeked, setPeeked] = useState<Set<string>>(() => new Set());
  const peek = peeked.has(moduleId) || sessionPeek(moduleId);
  const setPeek = () => {
    rememberPeek(moduleId);
    setPeeked((p) => new Set(p).add(moduleId));
  };
  const [added, setAdded] = useState<number | null>(null);
  const { learning, next: nextStep } = useDayPlan();
  const modState = learning.modules[moduleId];
  const locked = learning.loaded && modState !== undefined && !modState.unlocked && !peek;
  const gateKnown = learning.loaded;

  useEffect(() => {
    // Wait until we know whether the module is open, so a locked lesson isn't marked as started.
    if (!lesson || !gateKnown || locked) return;
    let alive = true;
    setBody(null);
    loadLesson(lesson.file)
      .then((m) => alive && setBody(() => m.default))
      .catch((e: unknown) => alive && setError(String(e)));
    // Mark as started (never downgrade a completed lesson).
    void db.progress.get(lesson.id).then((row) => {
      if (!row) void db.progress.put({ lessonId: lesson.id, moduleId, status: "started", updatedAt: new Date().toISOString() });
    });
    return () => {
      alive = false;
    };
  }, [lesson, moduleId, locked, gateKnown]);

  const ctx = useMemo(() => ({ lessonId: lesson?.id ?? "", moduleId, concepts: lesson?.concepts ?? [] }), [lesson, moduleId]);
  if (!lesson || !plan) return <NotFound />;
  const done = progress.get(lesson.id)?.status === "completed";
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];

  const complete = async () => {
    const now = new Date();
    let n = 0;
    try {
      // The lesson's cards join the review deck. Enrol before recording completion so the
      // background card sync (which watches completions) never races this count.
      const settings = await getSettings();
      const defs = lesson.cards.filter((id) => content.cards[id]).map((id) => ({ id, critical: content.cards[id]!.critical }));
      n = await enrollCards(defs, `lesson:${lesson.id}`, now, settings.desiredRetention);
    } finally {
      await db.progress.put({ lessonId: lesson.id, moduleId, status: "completed", updatedAt: now.toISOString(), completedAt: now.toISOString() });
      setAdded(n);
    }
  };

  if (locked) {
    const blocker = modState?.blockedBy;
    return (
      <article className="mx-auto max-w-2xl py-6">
        <Card className="text-center">
          <Lock size={26} className="mx-auto text-faint" />
          <h1 className="mt-3 text-xl font-semibold">{lesson.title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Module {displayNumber[moduleId]} opens once you pass the checkpoint for{" "}
            {blocker ? `Module ${displayNumber[blocker]}, ${content.modules[blocker]?.title ?? moduleById(blocker)?.title}` : "the previous module"}. Mastery first keeps the later material from resting on gaps.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {blocker && (
              <ButtonLink variant="primary" to={content.checkpoints[blocker] ? `/learn/${blocker}/checkpoint` : `/learn/${blocker}`}>
                Go to Module {displayNumber[blocker]}
              </ButtonLink>
            )}
            <Button variant="ghost" onClick={setPeek}>
              Open anyway
            </Button>
          </div>
        </Card>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-3xl">
      <Link to={`/learn/${moduleId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Module {displayNumber[moduleId]} · {plan.title}
      </Link>
      <header className="mb-8">
        <div className="text-xs font-semibold tracking-wider text-faint uppercase">
          Lesson {idx + 1} of {lessons.length} · {lesson.minutes} min
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        {lesson.concepts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lesson.concepts.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
        )}
      </header>

      <LessonContext.Provider value={ctx}>
        <MDXProvider components={lessonComponents}>
          <div className="lesson-prose">{error ? <p className="text-danger">Couldn't load this lesson: {error}</p> : Body ? <Body /> : <p className="text-faint">Loading lesson…</p>}</div>
        </MDXProvider>
      </LessonContext.Provider>

      <LessonSources ids={lesson.sources} />

      <footer className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        {done ? (
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-sm text-accent">
              <CheckCircle2 size={18} /> Lesson complete{added ? ` · ${added} card${added === 1 ? "" : "s"} added to your reviews` : ""}
            </span>
            {nextStep && nextStep.key !== `lesson:${lesson.id}` && (
              <ButtonLink variant="primary" className="self-start" to={nextStep.href}>
                Next in today's session: {nextStep.title} <ArrowRight size={16} />
              </ButtonLink>
            )}
          </div>
        ) : (
          <Button variant="primary" onClick={() => void complete()}>
            <CheckCircle2 size={16} /> Mark lesson complete
          </Button>
        )}
        <div className="flex gap-2">
          {prev && (
            <Link to={`/learn/${moduleId}/${prev.id.split("/")[1]}`} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink">
              <ArrowLeft size={14} /> Previous
            </Link>
          )}
          {next && (
            <Link to={`/learn/${moduleId}/${next.id.split("/")[1]}`} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink">
              Next <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}
