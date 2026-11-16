# Hyperscale

A personal course and interactive learning environment for going from basic Python and ML to mastery of machine learning engineering. It is aimed at ML for data centers, energy and infrastructure.

**Status: Phase 0, research and plan.** The app has not been built yet. Start with [`PLAN.md`](PLAN.md).

## Repository layout (Phase 0)

| Path | What it is |
|---|---|
| `PLAN.md` | Full plan: research summary, teaching design, curriculum, projects, week-by-week timeline, MDS coordination, app architecture, content format, build phases, risks |
| `research/` | Research notes (job postings, UBC MDS curriculum, pedagogy, data-center domain, ML literature, datasets) and `sources.json`, the citation database every lesson will reference |
| `research/merge_sources.py` | Merges the per-stream `sources-*.json` files into `sources.json` (dedupes by DOI/URL, keeps aliases, maps brief topic numbers to stable module ids) |
| `research/build_foundations_sources.py` | Rebuilds `sources-pedagogy-foundations.json` from the ids cited in `pedagogy-foundations.md`, verifying DOIs against Crossref and other sources against their live pages |
| `planning/calendar.json` | MDS block calendar (partly inferred), holidays, default daily time budget |
| `planning/curriculum.json` | Modules in study order with hour estimates and MDS overlap modes |
| `planning/build_schedule.py` | Generates the week-by-week schedule (`schedule.md`, `schedule.json`) |

## Regenerating planning artifacts

```bash
uv run --no-project --python 3.13 python planning/build_schedule.py
```

```bash
uv run --no-project --python 3.13 python planning/build_schedule.py --order alternative
```

```bash
uv run --no-project --python 3.13 python research/merge_sources.py
```

Run, deploy and add-content instructions will be added in Phase 1, when the app exists.
