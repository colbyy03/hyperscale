/** A module build's brief: a project done on your own machine, rendered from build.mdx. */
import { MDXProvider } from "@mdx-js/react";
import { ArrowLeft, Hammer } from "lucide-react";
import type { MDXContent } from "mdx/types";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Badge } from "@/components/ui";
import { content, displayNumber, loadBuild, moduleById } from "@/content";
import { lessonComponents } from "@/lesson/components";
import { LessonContext } from "@/lesson/context";
import { NotFound } from "./NotFound";

export function BuildPage() {
  const { moduleId = "" } = useParams();
  const build = content.builds[moduleId];
  const plan = moduleById(moduleId);
  const [Body, setBody] = useState<MDXContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ctx = useMemo(() => ({ lessonId: `${moduleId}/build`, moduleId, concepts: [] }), [moduleId]);

  useEffect(() => {
    if (!build) return;
    let alive = true;
    loadBuild(build.file)
      .then((m) => alive && setBody(() => m.default))
      .catch((e: unknown) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [build]);

  if (!build || !plan) return <NotFound />;
  return (
    <article className="mx-auto max-w-3xl">
      <Link to={`/learn/${moduleId}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Module {displayNumber[moduleId]} · {plan.title}
      </Link>
      <header className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-faint uppercase">
          <Hammer size={14} /> Module build
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{build.title}</h1>
        <div className="mt-3 flex gap-2">
          <Badge>about {build.hours} h</Badge>
          <Badge tone="info">on your own machine</Badge>
        </div>
      </header>
      <LessonContext.Provider value={ctx}>
        <MDXProvider components={lessonComponents}>
          <div className="lesson-prose">{error ? <p className="text-danger">Couldn't load the brief: {error}</p> : Body ? <Body /> : <p className="text-faint">Loading…</p>}</div>
        </MDXProvider>
      </LessonContext.Provider>
    </article>
  );
}
