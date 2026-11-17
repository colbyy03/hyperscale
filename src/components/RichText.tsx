/**
 * Light formatting for cards and questions: blank-line paragraphs, `code`, **bold**,
 * $inline math$ and $$display math$$ (KaTeX). Screens that use it are code-split.
 */
import clsx from "clsx";
import katex from "katex";
import { Fragment, useMemo } from "react";

const TOKEN = /(\$\$[^$]+\$\$|\$[^$\n]+\$|`[^`]+`|\*\*[^*]+\*\*)/g;

function math(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: "htmlAndMathml" });
}

function Inline({ text }: { text: string }) {
  const parts = useMemo(() => text.split(TOKEN), [text]);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) return <span key={i} className="my-2 block overflow-x-auto" dangerouslySetInnerHTML={{ __html: math(part.slice(2, -2), true) }} />;
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) return <span key={i} dangerouslySetInnerHTML={{ __html: math(part.slice(1, -1), false) }} />;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) return <code key={i}>{part.slice(1, -1)}</code>;
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const paras = text.split(/\n\s*\n/);
  return (
    <div className={clsx("[&_code]:rounded [&_code]:bg-surface-3 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.88em]", className)}>
      {paras.map((p, i) => (
        <p key={i} className={i ? "mt-2" : undefined}>
          <Inline text={p} />
        </p>
      ))}
    </div>
  );
}
