"""Build the week-by-week Hyperscale schedule from the calendar and curriculum.

Reads planning/calendar.json (periods, time budget, holidays) and
planning/curriculum.json (modules in study order with base hours), then:

1. computes available study minutes for every day,
2. groups days into Monday-start weeks,
3. fills weekly capacity with modules in order (hours x (1 + review overhead)),
4. writes planning/schedule.json and planning/schedule.md.

The app will port this logic to TypeScript so the schedule re-flows when the
learner changes their time budget or falls ahead/behind.

Usage:  python3 planning/build_schedule.py [--order alternative]
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
from dataclasses import dataclass, field
from pathlib import Path

HERE = Path(__file__).resolve().parent


@dataclass
class Week:
    index: int
    start: dt.date
    end: dt.date
    minutes: int = 0
    labels: list[str] = field(default_factory=list)
    allocations: list[dict] = field(default_factory=list)

    @property
    def hours(self) -> float:
        return self.minutes / 60.0


def daterange(a: dt.date, b: dt.date):
    d = a
    while d <= b:
        yield d
        d += dt.timedelta(days=1)


def load():
    cal = json.loads((HERE / "calendar.json").read_text())
    cur = json.loads((HERE / "curriculum.json").read_text())
    return cal, cur


def day_minutes(cal: dict) -> dict[dt.date, tuple[int, str]]:
    periods = [
        (dt.date.fromisoformat(p["start"]), dt.date.fromisoformat(p["end"]), p["type"], p["mds"])
        for p in cal["periods"]
    ]
    holidays = {dt.date.fromisoformat(h["date"]): h["minutes"] for h in cal["holidays"]}
    budget = cal["timeBudget"]
    start = dt.date.fromisoformat(cal["courseStart"])
    end = dt.date.fromisoformat(cal["courseEnd"])
    out: dict[dt.date, tuple[int, str]] = {}
    for d in daterange(start, end):
        kind, label = None, ""
        for a, b, t, mds in periods:
            if a <= d <= b:
                kind, label = t, mds
                break
        if kind is None:
            raise ValueError(f"no period covers {d}")
        weekend = d.weekday() >= 5
        mins = budget[kind]["weekend" if weekend else "weekday"]
        if d in holidays:
            mins = holidays[d]
        out[d] = (mins, label)
    return out


def build_weeks(cal: dict) -> list[Week]:
    days = day_minutes(cal)
    start = dt.date.fromisoformat(cal["courseStart"])
    assert start.weekday() == 0, "courseStart must be a Monday"
    weeks: list[Week] = []
    for d, (mins, label) in sorted(days.items()):
        idx = (d - start).days // 7 + 1
        if not weeks or weeks[-1].index != idx:
            weeks.append(Week(index=idx, start=d, end=d))
        w = weeks[-1]
        w.end = d
        w.minutes += mins
        if label and label not in w.labels:
            w.labels.append(label)
    return weeks


def allocate(weeks: list[Week], modules: list[dict], overhead: float):
    """Fill weeks in order. Returns per-module start/end dates."""
    queue = [dict(m, remaining=m["hours"] * (1 + overhead)) for m in modules]
    spans: dict[str, dict] = {}
    qi = 0
    for w in weeks:
        cap = w.hours
        while cap > 1e-9 and qi < len(queue):
            m = queue[qi]
            take = min(cap, m["remaining"])
            first = m["id"] not in spans
            if first:
                spans[m["id"]] = {"start": w.start.isoformat(), "startWeek": w.index}
            m["remaining"] -= take
            cap -= take
            done = m["remaining"] <= 1e-9
            w.allocations.append({
                "id": m["id"], "title": m["title"], "hours": round(take, 1),
                "status": ("start+finish" if first and done else "start" if first else "finish" if done else "continue"),
            })
            if done:
                # finish date: proportional position inside the week
                used = w.hours - cap
                frac = used / w.hours if w.hours else 1.0
                finish = w.start + dt.timedelta(days=max(0, min(6, round(frac * 7) - 1)))
                spans[m["id"]].update({"end": finish.isoformat(), "endWeek": w.index})
                qi += 1
        w.spare = round(cap, 1)  # type: ignore[attr-defined]
    unfinished = [m["id"] for m in queue[qi:]]
    return spans, unfinished


def fmt(d: dt.date) -> str:
    return d.strftime("%b %d").replace(" 0", " ")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--order", choices=["primary", "alternative"], default="primary")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    cal, cur = load()
    byid = {m["id"]: m for m in cur["modules"]}
    if args.order == "alternative":
        modules = [byid[i] for i in cur["alternativeOrder"]["order"]]
    else:
        modules = cur["modules"]
    weeks = build_weeks(cal)
    spans, unfinished = allocate(weeks, modules, cal["reviewOverhead"])

    milestones = []
    for ms in cur["milestones"]:
        s = spans.get(ms["after"], {})
        milestones.append({**ms, "date": s.get("end"), "week": s.get("endWeek")})

    total_capacity = sum(w.hours for w in weeks)
    total_need = sum(m["hours"] for m in modules) * (1 + cal["reviewOverhead"])

    if args.order == "alternative":
        if not args.quiet:
            print(f"capacity {total_capacity:.0f} h, need {total_need:.0f} h")
            for k in ["autograd", "transformers", "llm-apps", "mlops", "time-series", "optimization-or",
                      "bayesian-uq", "anomaly-fdd", "rl", "control-piml", "capstone-1", "capstone-2"]:
                print(f"  {k:22s} done {spans.get(k, {}).get('end')}")
            for ms in milestones:
                print(f"  {ms['id']} {ms['title']}: {ms['date']}")
            print("unfinished:", unfinished)
        (HERE / "schedule-alternative.json").write_text(json.dumps({
            "modules": spans, "milestones": milestones, "unfinished": unfinished,
            "capacityHours": round(total_capacity, 1), "neededHours": round(total_need, 1)}, indent=2))
        return

    # JSON output
    out = {
        "generated": dt.date.today().isoformat(),
        "capacityHours": round(total_capacity, 1),
        "neededHours": round(total_need, 1),
        "bufferHours": round(total_capacity - total_need, 1),
        "weeks": [
            {"week": w.index, "start": w.start.isoformat(), "end": w.end.isoformat(),
             "hours": round(w.hours, 2), "mds": w.labels, "allocations": w.allocations,
             "spareHours": getattr(w, "spare", 0.0)}
            for w in weeks
        ],
        "modules": spans,
        "milestones": milestones,
        "unfinished": unfinished,
    }
    (HERE / "schedule.json").write_text(json.dumps(out, indent=2))

    # Markdown table
    ms_by_week: dict[int, list[str]] = {}
    for ms in milestones:
        if ms["week"]:
            ms_by_week.setdefault(ms["week"], []).append(f"**{ms['id']} {ms['title']}**")
    lines = ["| Wk | Dates | MDS context | Hours | Focus (hours) |", "|---|---|---|---|---|"]
    cum = 0.0
    for w in weeks:
        cum += w.hours
        mds = "; ".join(w.labels).replace("(DSCI ", "(").replace("Block", "B")
        parts = []
        for a in w.allocations:
            tag = {"start": "start", "continue": "cont.", "finish": "finish", "start+finish": ""}[a["status"]]
            parts.append(f"{a['title']} ({a['hours']:g}{', ' + tag if tag else ''})")
        spare = getattr(w, "spare", 0.0)
        if spare >= 1:
            parts.append(f"buffer ({spare:g})")
        focus = "; ".join(parts)
        if w.index in ms_by_week:
            focus += " - " + ", ".join(ms_by_week[w.index])
        lines.append(f"| {w.index} | {fmt(w.start)}-{fmt(w.end)} | {mds} | {w.hours:.1f} | {focus} |")
    (HERE / "schedule.md").write_text("\n".join(lines) + "\n")

    if not args.quiet:
        print(f"capacity {total_capacity:.0f} h, need {total_need:.0f} h, buffer {total_capacity - total_need:.0f} h")
        for ms in milestones:
            print(f"  {ms['id']} {ms['title']}: {ms['date']} (week {ms['week']})")
        print("unfinished:", unfinished)


if __name__ == "__main__":
    main()
