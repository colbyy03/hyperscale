/** Lazy access to the bibliography (research/sources.json is large, so it is its own chunk). */
export interface SourceRecord {
  id: string;
  type: string;
  title: string;
  authors: string[];
  year: number | null;
  venue: string | null;
  doi: string | null;
  url: string;
  open_url: string | null;
  access: "open" | "paywalled" | "partial";
  verified: boolean;
  modules: number[];
  moduleIds?: string[];
  aliases?: string[];
  notes: string;
}

let cache: Promise<{ list: SourceRecord[]; byId: Map<string, SourceRecord> }> | undefined;

export function loadSources() {
  cache ??= import("../../research/sources.json").then((m) => {
    const list = (m.default as unknown as SourceRecord[]).filter((s) => s.type !== "job-posting" || true);
    const byId = new Map<string, SourceRecord>();
    for (const s of list) {
      byId.set(s.id, s);
      for (const a of s.aliases ?? []) byId.set(a, s);
    }
    return { list, byId };
  });
  return cache;
}

export function formatAuthors(authors: string[], max = 3): string {
  if (!authors.length) return "";
  const names = authors.map((a) => a.split(",")[0]!.trim());
  return names.length > max ? `${names.slice(0, max).join(", ")} et al.` : names.join(", ");
}

export function sourceLink(s: SourceRecord): string {
  return s.doi ? `https://doi.org/${s.doi}` : s.url;
}
