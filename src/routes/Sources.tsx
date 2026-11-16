import { ExternalLink, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge, PageHeader } from "@/components/ui";
import { curriculum, displayNumber } from "@/content";
import { formatAuthors, loadSources, sourceLink, type SourceRecord } from "@/content/sources";

const TYPES = ["all", "paper", "book", "course", "report", "web", "dataset", "software", "standard", "job-posting"];

export function Sources() {
  const [all, setAll] = useState<SourceRecord[] | null>(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [mod, setMod] = useState("all");

  useEffect(() => {
    void loadSources().then(({ list }) => setAll(list));
  }, []);

  const filtered = useMemo(() => {
    if (!all) return [];
    const needle = q.trim().toLowerCase();
    return all.filter(
      (s) =>
        (type === "all" || s.type === type) &&
        (mod === "all" || (s.moduleIds ?? []).includes(mod)) &&
        (!needle || `${s.title} ${s.authors.join(" ")} ${s.venue ?? ""} ${s.id}`.toLowerCase().includes(needle)),
    );
  }, [all, q, type, mod]);

  return (
    <div>
      <PageHeader eyebrow="Bibliography" title="Sources">
        Every source the course draws on, with links. Lessons cite these by id; ideas are taught in original words.
      </PageHeader>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <input
            className="w-full rounded-xl border border-line bg-surface py-2 pr-3 pl-9 text-sm"
            placeholder="Search titles, authors, venues"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search sources"
          />
        </label>
        <select className="rounded-xl border border-line bg-surface px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "all" ? "All types" : t}
            </option>
          ))}
        </select>
        <select className="rounded-xl border border-line bg-surface px-3 py-2 text-sm sm:max-w-64" value={mod} onChange={(e) => setMod(e.target.value)} aria-label="Module">
          <option value="all">All modules</option>
          {curriculum.modules
            .filter((m) => !m.kind)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {displayNumber[m.id]} · {m.title}
              </option>
            ))}
        </select>
      </div>
      {!all ? (
        <p className="text-sm text-faint">Loading sources…</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-faint">
            {filtered.length} of {all.length} sources · {all.filter((s) => s.verified).length} verified against Crossref, arXiv or the live page
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {filtered.slice(0, 300).map((s) => (
              <li key={s.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{s.title}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {formatAuthors(s.authors)} {s.year ? `· ${s.year}` : ""} {s.venue ? `· ${s.venue}` : ""}
                    </div>
                  </div>
                  <a href={sourceLink(s)} target="_blank" rel="noreferrer" className="shrink-0 text-faint hover:text-accent" aria-label={`Open ${s.title}`}>
                    <ExternalLink size={15} />
                  </a>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge>{s.type}</Badge>
                  {s.access === "paywalled" && <Badge tone="heat">paywalled</Badge>}
                  {!s.verified && <Badge tone="danger">unverified</Badge>}
                  {s.open_url && (
                    <a href={s.open_url} target="_blank" rel="noreferrer">
                      <Badge tone="accent">open copy</Badge>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {filtered.length > 300 && <p className="mt-3 text-xs text-faint">Showing the first 300; refine the search to see more.</p>}
        </>
      )}
    </div>
  );
}
