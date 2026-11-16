"""Merge research/sources-*.json into research/sources.json.

`modules` holds the brief's topic numbers; `moduleIds` maps them to the stable module ids in
planning/curriculum.json (topic 24 maps to both optimization-or and control-piml).

Deduplicates by DOI, then by normalized URL, then by id. When records collide,
the verified record wins, module lists are unioned, notes are kept, and the
losing ids are stored as `aliases` so lessons may cite either id.

Usage:  python3 research/merge_sources.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REQUIRED = ["id", "type", "title", "authors", "year", "url", "access", "accessed", "verified", "modules", "notes"]
TYPES = {"paper", "book", "course", "report", "web", "dataset", "standard", "job-posting", "software"}
ACCESS = {"open", "paywalled", "partial"}


def norm_doi(doi: str | None) -> str | None:
    if not doi:
        return None
    d = doi.strip().lower()
    d = re.sub(r"^https?://(dx\.)?doi\.org/", "", d)
    return d or None


def norm_url(url: str | None) -> str | None:
    if not url:
        return None
    u = url.strip().lower()
    u = re.sub(r"^https?://(www\.)?", "", u)
    u = u.rstrip("/")
    u = re.sub(r"arxiv\.org/(pdf|abs)/([0-9.]+)(v\d+)?(\.pdf)?", r"arxiv.org/abs/\2", u)
    return u


def title_similarity(a: str, b: str) -> float:
    import difflib
    na = " ".join(re.sub(r"[^a-z0-9 ]+", " ", (a or "").lower()).split())
    nb = " ".join(re.sub(r"[^a-z0-9 ]+", " ", (b or "").lower()).split())
    return difflib.SequenceMatcher(None, na, nb).ratio()


def same_work(a: str, b: str) -> bool:
    """Titles name the same work: identical, one extends the other (subtitle), or nearly identical."""
    na = " ".join(re.sub(r"[^a-z0-9 ]+", " ", (a or "").lower()).split())
    nb = " ".join(re.sub(r"[^a-z0-9 ]+", " ", (b or "").lower()).split())
    return na == nb or na.startswith(nb) or nb.startswith(na) or title_similarity(a, b) >= 0.97


def clean(rec: dict, origin: str, problems: list[str]) -> dict:
    r = dict(rec)
    r.setdefault("doi", None)
    r.setdefault("open_url", None)
    r.setdefault("license", None)
    r.setdefault("venue", None)
    if isinstance(r.get("authors"), str):
        r["authors"] = [a.strip() for a in re.split(r";|\band\b", r["authors"]) if a.strip()]
    try:
        r["year"] = int(r["year"]) if r.get("year") not in (None, "") else None
    except (TypeError, ValueError):
        problems.append(f"{origin}:{r.get('id')}: bad year {r.get('year')!r}")
        r["year"] = None
    r["modules"] = sorted({int(m) for m in r.get("modules") or [] if str(m).lstrip("-").isdigit()})
    if r.get("type") not in TYPES:
        problems.append(f"{origin}:{r.get('id')}: unknown type {r.get('type')!r}")
    if r.get("access") not in ACCESS:
        problems.append(f"{origin}:{r.get('id')}: unknown access {r.get('access')!r}")
    for k in REQUIRED:
        if k not in r:
            problems.append(f"{origin}:{r.get('id')}: missing {k}")
    r["verified"] = bool(r.get("verified"))
    r["origin"] = origin
    return r


def merge(a: dict, b: dict) -> dict:
    """Merge b into a (a is kept as the canonical record unless b is verified and a isn't)."""
    if b["verified"] and not a["verified"]:
        a, b = b, a
    out = dict(a)
    out["modules"] = sorted(set(a["modules"]) | set(b["modules"]))
    aliases = set(a.get("aliases", [])) | set(b.get("aliases", [])) | {b["id"]}
    aliases.discard(out["id"])
    out["aliases"] = sorted(aliases)
    for k in ("doi", "open_url", "license", "venue"):
        if not out.get(k) and b.get(k):
            out[k] = b[k]
    if b.get("notes") and b["notes"] not in (out.get("notes") or ""):
        out["notes"] = (out.get("notes") or "").rstrip() + " | " + b["notes"]
    origins = {*(a.get("origins") or [a["origin"]]), *(b.get("origins") or [b["origin"]])}
    out["origins"] = sorted(origins)
    return out


def main() -> int:
    files = sorted(HERE.glob("sources-*.json"))
    problems: list[str] = []
    records: list[dict] = []
    for f in files:
        data = json.loads(f.read_text())
        if isinstance(data, dict):
            data = data.get("sources", [])
        for rec in data:
            records.append(clean(rec, f.stem.replace("sources-", ""), problems))

    by_key: dict[str, dict] = {}
    key_of_id: dict[str, str] = {}
    for r in records:
        keys = [k for k in (("doi:" + norm_doi(r["doi"])) if norm_doi(r["doi"]) else None,
                            ("url:" + norm_url(r["url"])) if norm_url(r["url"]) else None,
                            "id:" + r["id"]) if k]
        hit = next((k for k in keys if k in by_key), None)
        # A shared URL alone is weak evidence (publisher landing pages are reused across titles):
        # only merge on a URL match when the titles are also similar.
        if hit and hit.startswith("url:") and not same_work(r["title"], by_key[hit]["title"]):
            keys = [k for k in keys if not k.startswith("url:")]
            hit = next((k for k in keys if k in by_key), None)
        if hit is None and r["id"] in key_of_id:
            hit = key_of_id[r["id"]]
        if hit:
            merged = merge(by_key[hit], r)
            for k in keys:
                by_key[k] = merged
            # repoint every key that referenced the old object
            for k, v in list(by_key.items()):
                if v is not merged and (v["id"] == merged["id"] or v["id"] in merged.get("aliases", [])):
                    by_key[k] = merged
        else:
            r.setdefault("aliases", [])
            r["origins"] = [r["origin"]]
            for k in keys:
                by_key[k] = r
        for k in keys:
            key_of_id[r["id"]] = k

    unique = {id(v): v for v in by_key.values()}.values()
    out = []
    seen_ids: set[str] = set()
    for r in sorted(unique, key=lambda x: (x["type"], x["id"])):
        if r["id"] in seen_ids:
            continue
        seen_ids.add(r["id"])
        r = {k: v for k, v in r.items() if k != "origin"}
        out.append(r)

    # alias collisions
    all_ids = {r["id"] for r in out}
    for r in out:
        for a in r.get("aliases", []):
            if a in all_ids:
                problems.append(f"alias {a} of {r['id']} is also a primary id")

    # Map brief topic numbers (used by the research streams) to stable module ids from the
    # study-order curriculum, so citations survive any future reordering or renumbering.
    cur = json.loads((HERE.parent / "planning" / "curriculum.json").read_text())
    brief_to_ids: dict[int, list[str]] = {0: ["induction"]}
    for m in cur["modules"]:
        if m.get("brief") is not None:
            brief_to_ids.setdefault(int(m["brief"]), []).append(m["id"])
    for r in out:
        r["moduleIds"] = sorted({i for b in r["modules"] for i in brief_to_ids.get(b, [])})

    (HERE / "sources.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")

    by_type: dict[str, int] = {}
    for r in out:
        by_type[r["type"]] = by_type.get(r["type"], 0) + 1
    print(f"merged {len(records)} records from {len(files)} files into {len(out)} sources")
    print("by type:", dict(sorted(by_type.items())))
    print("verified:", sum(r["verified"] for r in out), "| paywalled:", sum(r["access"] == "paywalled" for r in out))
    if problems:
        print(f"{len(problems)} problems:")
        for p in problems[:80]:
            print("  -", p)
    return 0


if __name__ == "__main__":
    sys.exit(main())
