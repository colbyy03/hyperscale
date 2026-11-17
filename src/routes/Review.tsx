/**
 * Spaced-repetition reviews (FSRS) and the end-of-session exit recall. Code-split (KaTeX).
 */
import clsx from "clsx";
import { ArrowRight, CheckCircle2, Clock, EyeOff, PencilLine, Repeat, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { RichText } from "@/components/RichText";
import { Badge, Button, ButtonLink, Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { content, lessonById } from "@/content";
import type { CardRow } from "@/db";
import { approveDraft, buildQueue, discardDraft, interleave, rateCard, setSuspended } from "@/engine/cards";
import { formatInterval, previewIntervals, retentionFor, type Grade, type StoredCardState } from "@/engine/fsrs";
import { localDay, todayIso } from "@/engine/schedule";
import { CONFIDENCE_LABELS } from "@/learn/grading";
import { cardText, markItemDone, useAttempts, useDayPlan, useDeck, useNow } from "@/hooks/learning";
import { useProgress } from "@/hooks/data";
import { recordAttempt } from "@/lesson/context";
import { useSettings } from "@/state/settings";

const GRADES: Array<{ grade: Grade; label: string; key: string; tone: string }> = [
  { grade: 1, label: "Again", key: "1", tone: "border-danger/50 text-danger hover:bg-danger-soft" },
  { grade: 2, label: "Hard", key: "2", tone: "border-heat/50 text-heat hover:bg-heat-soft" },
  { grade: 3, label: "Good", key: "3", tone: "border-accent/50 text-accent hover:bg-accent-soft" },
  { grade: 4, label: "Easy", key: "4", tone: "border-info/50 text-info hover:bg-info-soft" },
];

function moduleTitleOf(row: CardRow): string | undefined {
  const authored = content.cards[row.id];
  if (authored) return content.modules[authored.moduleId]?.title;
  const lessonId = row.source.replace(/^predict:/, "").split("#")[0];
  return lessonId ? content.modules[lessonById(lessonId)?.moduleId ?? ""]?.title : undefined;
}

function NextStep() {
  const { next } = useDayPlan();
  if (!next || next.kind === "reviews") return <ButtonLink to="/">Back to Today</ButtonLink>;
  return (
    <ButtonLink variant="primary" to={next.href}>
      Next: {next.title} <ArrowRight size={16} />
    </ButtonLink>
  );
}

export function Review() {
  const settings = useSettings();
  const now = useNow(10_000);
  const deck = useDeck(now);
  const [overrides, setOverrides] = useState<Map<string, CardRow>>(new Map());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [intervals, setIntervals] = useState<Record<Grade, number> | null>(null);
  const [stats, setStats] = useState({ reviewed: 0, again: 0, seconds: 0 });
  const [busy, setBusy] = useState(false);
  const shownAt = useRef(Date.now());
  const finished = useRef(false);

  const rows = useMemo(() => deck.rows.map((r) => overrides.get(r.id) ?? r), [deck.rows, overrides]);
  const queue = useMemo(() => {
    const q = buildQueue(rows, now, deck.newAllowance, (row) => !!cardText(row));
    return { order: interleave(q.due, q.fresh), soon: q.soon };
  }, [rows, now, deck.newAllowance]);

  const current = rows.find((r) => r.id === currentId);
  useEffect(() => {
    if (busy) return;
    // Move on when there's no card, or the shown card was rated or suspended.
    if (!current || !queue.order.some((r) => r.id === current.id)) {
      const next = queue.order[0];
      setCurrentId(next?.id ?? null);
      setRevealed(false);
      setIntervals(null);
      shownAt.current = Date.now();
    }
  }, [queue, current, busy]);

  useEffect(() => {
    if (!current?.state) return;
    let alive = true;
    void previewIntervals(current.state as StoredCardState, new Date(), retentionFor(current.critical, settings.desiredRetention)).then((p) => alive && setIntervals(p));
    return () => {
      alive = false;
    };
  }, [current, settings.desiredRetention]);

  const rate = useCallback(
    async (g: Grade) => {
      if (!current || !revealed || busy) return;
      setBusy(true);
      const seconds = (Date.now() - shownAt.current) / 1000;
      try {
        const updated = await rateCard(current, g, new Date(), settings.desiredRetention, seconds);
        setOverrides((m) => new Map(m).set(updated.id, updated));
        setStats((s) => ({ reviewed: s.reviewed + 1, again: s.again + (g === 1 ? 1 : 0), seconds: s.seconds + Math.min(seconds, 120) }));
        setCurrentId(null);
      } finally {
        setBusy(false);
      }
    },
    [current, revealed, busy, settings.desiredRetention],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        void rate(Number(e.key) as Grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, rate]);

  const empty = deck.loaded && !current && queue.order.length === 0;
  useEffect(() => {
    if (empty && stats.reviewed > 0 && !finished.current) {
      finished.current = true;
      void markItemDone("reviews", Math.max(1, Math.round(stats.seconds / 60)));
    }
  }, [empty, stats]);

  const text = current ? cardText(current) : undefined;
  const remaining = queue.order.length;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Spaced repetition" title="Review">
        Cards from lessons you've finished, scheduled by FSRS to come back just before you'd forget them.
      </PageHeader>

      {!deck.loaded ? (
        <p className="text-sm text-faint">Loading your deck…</p>
      ) : current && text ? (
        <div>
          <div className="mb-3 flex items-center justify-between text-xs text-faint">
            <span>
              {remaining} left{stats.reviewed ? ` · ${stats.reviewed} done` : ""}
            </span>
            <button className="inline-flex items-center gap-1 hover:text-ink" onClick={() => void setSuspended(current.id, true)} title="Stop showing this card">
              <EyeOff size={13} /> Suspend
            </button>
          </div>
          <Card className="min-h-64" data-testid="review-card">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {text.type && <Badge>{text.type}</Badge>}
              {(current.state as StoredCardState).state === 0 && <Badge tone="info">new</Badge>}
              {current.critical && <Badge tone="heat">gate-critical</Badge>}
              {moduleTitleOf(current) && <span className="text-xs text-faint">{moduleTitleOf(current)}</span>}
            </div>
            <RichText text={text.front} className="text-lg leading-relaxed font-medium" />
            {revealed && (
              <div className="mt-5 border-t border-line pt-5">
                <RichText text={text.back} className="leading-relaxed text-ink" />
              </div>
            )}
          </Card>
          {!revealed ? (
            <Button variant="primary" className="mt-4 w-full py-3" onClick={() => setRevealed(true)}>
              Show answer <span className="text-xs opacity-70">(space)</span>
            </Button>
          ) : (
            <div className="mt-4 grid grid-cols-4 gap-2" role="group" aria-label="How well did you recall it?">
              {GRADES.map((g) => (
                <button key={g.grade} disabled={busy} onClick={() => void rate(g.grade)} className={clsx("flex flex-col items-center rounded-xl border bg-surface py-2.5 text-sm font-medium transition-colors disabled:opacity-50", g.tone)}>
                  {g.label}
                  <span className="mt-0.5 text-[11px] font-normal text-faint tabular-nums">{intervals ? formatInterval(intervals[g.grade]) : "…"}</span>
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-center text-xs text-faint">Recall the answer before you reveal it. Rate honestly: "Again" is how the schedule learns.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {stats.reviewed > 0 ? (
            <Card className="text-center">
              <CheckCircle2 size={28} className="mx-auto text-accent" />
              <div className="mt-2 text-lg font-semibold">Reviews done</div>
              <p className="mt-1 text-sm text-muted">
                {stats.reviewed} card{stats.reviewed === 1 ? "" : "s"} in {Math.max(1, Math.round(stats.seconds / 60))} min
                {stats.again ? `, ${stats.again} to relearn` : ""}.
              </p>
              <div className="mt-4 flex justify-center">
                <NextStep />
              </div>
            </Card>
          ) : (
            <EmptyState title={deck.rows.length ? "Nothing due right now" : "Your deck is empty"} icon={<Repeat size={28} />}>
              {deck.rows.length
                ? "Every card is scheduled for later. Come back tomorrow, or keep going with today's session."
                : "Cards join the deck when you complete a lesson. Each one comes back on a schedule tuned to your memory."}
            </EmptyState>
          )}
          {queue.soon.length > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
              <Clock size={14} /> {queue.soon.length} card{queue.soon.length === 1 ? "" : "s"} in learning come back within 15 minutes; this page picks them up automatically.
            </p>
          )}
          {deck.drafts.length > 0 && (
            <p className="text-center text-sm text-muted">
              {deck.drafts.length} draft card{deck.drafts.length === 1 ? "" : "s"} from your predictions are waiting at{" "}
              <Link className="text-accent underline" to="/review/exit">
                exit recall
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Exit recall ---------- */

function pickTwo<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out.slice(0, 2);
}

function DraftEditor({ row }: { row: CardRow }) {
  const settings = useSettings();
  const [front, setFront] = useState(row.front ?? "");
  const [back, setBack] = useState(row.back ?? "");
  const [editing, setEditing] = useState(false);
  return (
    <li className="rounded-xl border border-line p-3.5" data-testid="draft-card">
      {editing ? (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-faint">
            Front
            <textarea className="mt-1 min-h-16 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink" value={front} onChange={(e) => setFront(e.target.value)} />
          </label>
          <label className="text-xs text-faint">
            Back
            <textarea className="mt-1 min-h-20 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink" value={back} onChange={(e) => setBack(e.target.value)} />
          </label>
        </div>
      ) : (
        <div className="text-sm">
          <div className="font-medium">{front}</div>
          <div className="mt-1 text-muted">{back}</div>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" disabled={front.trim().length < 5 || !back.trim()} onClick={() => void approveDraft(row.id, { front: front.trim(), back: back.trim() }, new Date(), settings.desiredRetention)}>
          <CheckCircle2 size={15} /> Add to deck
        </Button>
        <Button variant="ghost" onClick={() => setEditing((e) => !e)}>
          <PencilLine size={15} /> {editing ? "Done editing" : "Edit"}
        </Button>
        <Button variant="ghost" onClick={() => void discardDraft(row.id)}>
          <Trash2 size={15} /> Discard
        </Button>
      </div>
    </li>
  );
}

function RecallItem({ row }: { row: CardRow }) {
  const text = cardText(row);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const started = useRef(Date.now());
  if (!text) return null;
  const answer = (correct: boolean) => {
    setResult(correct);
    void recordAttempt({ itemId: `card:${row.id}`, kind: "exit", correct, seconds: (Date.now() - started.current) / 1000, skills: text.concepts, payload: { format: "recall" } });
  };
  return (
    <li className="rounded-xl border border-line p-4" data-testid="exit-recall">
      <RichText text={text.front} className="font-medium" />
      {revealed ? (
        <>
          <div className="mt-3 border-t border-line pt-3">
            <RichText text={text.back} className="text-sm text-ink" />
          </div>
          {result === null ? (
            <div className="mt-3 flex gap-2">
              <Button variant="primary" onClick={() => answer(true)}>
                I had it
              </Button>
              <Button onClick={() => answer(false)}>I missed it</Button>
            </div>
          ) : (
            <p className={clsx("mt-3 text-sm font-medium", result ? "text-accent" : "text-heat")}>{result ? "Recalled." : "Noted: it comes back in practice."}</p>
          )}
        </>
      ) : (
        <Button className="mt-3" onClick={() => setRevealed(true)}>
          I've recalled it: show the answer
        </Button>
      )}
    </li>
  );
}

export function ExitRecall() {
  const now = useNow();
  const deck = useDeck(now);
  const progress = useProgress();
  const attempts = useAttempts();
  const today = todayIso(now);
  const [finished, setFinished] = useState(false);

  const recall = useMemo(() => {
    const lessonsToday = [...progress.values()].filter((p) => p.status === "completed" && p.completedAt && localDay(p.completedAt) === today).map((p) => p.lessonId);
    const ids = new Set(lessonsToday.flatMap((id) => lessonById(id)?.cards ?? []));
    const fromToday = deck.rows.filter((r) => ids.has(r.id));
    const pool = fromToday.length >= 2 ? fromToday : deck.rows.filter((r) => !r.draft && cardText(r));
    return pickTwo(pool, today);
    // Pick once per day (once data has loaded) so the questions don't change as the deck updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, deck.loaded, progress.size]);

  const calibration = useMemo(() => {
    const todays = attempts.filter((a) => a.confidence && localDay(a.submittedAt) === today);
    return [1, 2, 3, 4]
      .map((c) => {
        const bin = todays.filter((a) => a.confidence === c);
        return { c, n: bin.length, right: bin.filter((a) => a.correct).length };
      })
      .filter((b) => b.n > 0);
  }, [attempts, today]);

  const finish = async () => {
    await markItemDone("exit", 3);
    setFinished(true);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="End of session" title="Exit recall">
        Two closed-book questions from today, then decide what goes in your deck.
      </PageHeader>
      <div className="flex flex-col gap-8">
        <section>
          <SectionTitle>Recall without looking</SectionTitle>
          {recall.length ? (
            <ol className="flex flex-col gap-3">
              {recall.map((r) => (
                <RecallItem key={r.id} row={r} />
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted">Finish a lesson first; its cards supply these questions.</p>
          )}
        </section>

        <section>
          <SectionTitle>Draft cards from today's predictions</SectionTitle>
          {deck.drafts.length ? (
            <ul className="flex flex-col gap-3">
              {deck.drafts.map((d) => (
                <DraftEditor key={d.id} row={d} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No drafts. A wrong prediction in a lesson becomes a draft here, so the surprise turns into a card.</p>
          )}
        </section>

        {calibration.length > 0 && (
          <section>
            <SectionTitle>Calibration today</SectionTitle>
            <ul className="flex flex-col gap-1.5 text-sm">
              {calibration.map((b) => (
                <li key={b.c} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
                  <span>{CONFIDENCE_LABELS[b.c - 1]}</span>
                  <span className="text-muted tabular-nums">
                    {b.right} of {b.n} right
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-faint">Well calibrated means "certain" is nearly always right and "guessing" is often wrong.</p>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
          {finished ? (
            <>
              <span className="inline-flex items-center gap-2 text-sm text-accent">
                <CheckCircle2 size={18} /> Session complete. See you tomorrow.
              </span>
              <ButtonLink to="/">Back to Today</ButtonLink>
            </>
          ) : (
            <Button variant="primary" onClick={() => void finish()}>
              <CheckCircle2 size={16} /> Finish session
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
