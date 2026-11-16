# Hyperscale

A personal course and interactive learning environment for going from basic Python and ML to mastery of machine learning engineering. It is aimed at ML for data centers, energy and infrastructure, and set at a fictional hyperscale campus.

- **Plan:** [`PLAN.md`](PLAN.md) (curriculum, schedule, architecture, content format)
- **Status:** see [`CHANGELOG.md`](CHANGELOG.md)

## Run it

You need Node.js 24 or newer (`brew install node`) and, for the Python side, [uv](https://docs.astral.sh/uv/).

```bash
npm install
```

```bash
npm run dev
```

The app opens at http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (content edits reload too) |
| `npm run build` | Validates content, builds `dist/` (PWA, service worker, `404.html` fallback) |
| `npm run preview` | Serves the production build at http://localhost:4173 |
| `npm run check` | Type-check + unit tests + content validation |
| `npm run e2e` | Playwright smoke tests on desktop/tablet/phone viewports (uses installed Chrome; build first) |

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds with `HS_BASE=/hyperscale/` and publishes to GitHub Pages. That puts the app at `https://<user>.github.io/hyperscale/`, alongside any existing user site. One-time setup in the repo: **Settings → Pages → Source: GitHub Actions**. `ci.yml` runs type-check, tests, content validation, build and end-to-end tests on every push and PR.

The app is a PWA. Open it in Safari or Chrome and "Add to Home Screen" (iPhone/iPad) or "Install" (desktop) to get offline use and protection from browser storage eviction.

## Add content

Module order, hours and phases come from `planning/curriculum.json`. Teaching content lives in `content/`:

```
content/concepts.json                      # concept graph (every concept a lesson or exercise uses)
content/modules/<module-id>/module.json    # title, summary, objectives, build, sources
content/modules/<module-id>/lessons/NN-slug.mdx
content/modules/<module-id>/exercises/<slug>/{exercise.json,starter.py,solution.py,tests.py}
```

A lesson is MDX with frontmatter (`id: <module-id>/<slug>`, `title`, `minutes`, `concepts`, `sources`, `cards`). It can use these components:
- `<Situation>`, `<Predict>`, `<Check>`, `<Viz name="...">`
- `<Bridge>`, `<Craft>`, `<KeyIdea>`, `<Figure>`, `<CodeExercise id="...">`

Math is written in KaTeX (`$...$`, `$$...$$`). Sources are cited by id from `research/sources.json`.

`npm run validate` checks every file against the schemas in `src/content/schema.ts`. It covers ids, concepts, source ids and the required exercise files. The build refuses to ship invalid content.

## Repository layout

| Path | What it is |
|---|---|
| `src/` | The app (React + TypeScript): `routes/` screens, `lesson/` MDX components, `viz/` interactive explainers, `engine/` schedule and session planning, `db/` IndexedDB storage and backups |
| `content/` | Lessons, exercises, concepts |
| `research/` | Research notes and `sources.json` (566 sources, 533 verified); `merge_sources.py`, `build_foundations_sources.py` |
| `planning/` | MDS calendar, time budget, curriculum order, Python schedule generator (the app's TypeScript engine matches it exactly) |
| `scripts/` | Content index and validation, SPA fallback |
| `tests/e2e/` | Playwright smoke tests |
| `public/icons/` | App icons |

## Regenerate planning artifacts

```bash
uv run --no-project --python 3.13 python planning/build_schedule.py
```

```bash
uv run --no-project --python 3.13 python research/merge_sources.py
```
