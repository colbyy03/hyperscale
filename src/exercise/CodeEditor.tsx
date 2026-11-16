/** CodeMirror 6 editor themed with the app's tokens. Mod-Enter runs; Shift-Mod-Enter checks. */
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { bracketMatching, HighlightStyle, indentOnInput, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";
import { useEffect, useRef } from "react";

const theme = EditorView.theme({
  "&": { backgroundColor: "var(--surface)", color: "var(--text)", fontSize: "14px", borderRadius: "12px" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.6" },
  ".cm-content": { padding: "12px 0", caretColor: "var(--accent)" },
  ".cm-gutters": { backgroundColor: "var(--surface)", color: "var(--faint)", border: "none", borderRadius: "12px 0 0 12px" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--surface-3) 55%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--muted)" },
  "&.cm-focused .cm-cursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "color-mix(in srgb, var(--accent) 22%, transparent) !important" },
  ".cm-tooltip": { backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "var(--surface-3)", color: "var(--text)" },
  ".cm-matchingBracket": { backgroundColor: "var(--surface-3)", outline: "1px solid var(--border-strong)" },
});

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.modifier], color: "var(--violet)" },
  { tag: [t.string, t.special(t.string)], color: "var(--success)" },
  { tag: [t.number, t.bool, t.null], color: "var(--heat)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--faint)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--info)" },
  { tag: [t.definition(t.variableName), t.definition(t.function(t.variableName)), t.className], color: "var(--accent)" },
  { tag: [t.operator, t.punctuation, t.bracket], color: "var(--muted)" },
  { tag: t.propertyName, color: "var(--text)" },
]);

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "python" | "sql";
  onRun?: () => void;
  onCheck?: () => void;
  readOnly?: boolean;
  label?: string;
}

export function CodeEditor({ value, onChange, language = "python", onRun, onCheck, readOnly = false, label = "Code editor" }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const handlers = useRef({ onChange, onRun, onCheck });
  handlers.current = { onChange, onRun, onCheck };

  useEffect(() => {
    if (!host.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        indentUnit.of("    "),
        EditorState.tabSize.of(4),
        language === "python" ? python() : sql(),
        syntaxHighlighting(highlight),
        theme,
        EditorView.lineWrapping,
        EditorState.readOnly.of(readOnly),
        EditorView.contentAttributes.of({ "aria-label": label, spellcheck: "false", autocapitalize: "off", autocorrect: "off" }),
        keymap.of([
          { key: "Mod-Enter", preventDefault: true, run: () => (handlers.current.onRun?.(), true) },
          { key: "Shift-Mod-Enter", preventDefault: true, run: () => (handlers.current.onCheck?.(), true) },
          indentWithTab,
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...completionKeymap,
        ]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) handlers.current.onChange(u.state.doc.toString());
        }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current });
    return () => {
      view.current?.destroy();
      view.current = null;
    };
    // The editor is created once per language/readOnly; external value changes are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, readOnly, label]);

  // Sync external value changes (reset, reveal) without recreating the editor.
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  return <div ref={host} className="overflow-hidden rounded-xl border border-line" data-testid="code-editor" />;
}
