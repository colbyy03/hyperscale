import { Fragment } from "react";

/** Minimal inline formatting for prompts and hints: `code`, **bold**, blank-line paragraphs. */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className={i ? "mt-2" : undefined}>
          {para.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, j) => {
            if (part.startsWith("`") && part.endsWith("`")) return <code key={j}>{part.slice(1, -1)}</code>;
            if (part.startsWith("**") && part.endsWith("**")) return <strong key={j}>{part.slice(2, -2)}</strong>;
            return <Fragment key={j}>{part}</Fragment>;
          })}
        </p>
      ))}
    </>
  );
}
