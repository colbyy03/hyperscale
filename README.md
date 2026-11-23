# Hyperscale

A personal course and interactive learning environment for going from basic Python and ML to mastery of machine learning engineering. It is aimed at ML for data centers, energy and infrastructure, and set at a fictional hyperscale campus.

- **Plan:** [`PLAN.md`](PLAN.md) (curriculum, schedule, architecture, content format)
- **Live app:** https://colbyy03.github.io/hyperscale/
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
| `npm run check` | Type-check + unit tests + content validation + exercise verification |
| `npm run verify:exercises` | Runs every exercise in Pyodide on Node: solution passes, starter fails, each known-wrong variant fails with its expected message |
| `npm run test:python` | Tests for the `hsgrade` grading library (CPython 3.14 with the same NumPy/pytest versions as Pyodide) and the simulator's physics tests |
| `npm run test:sim` | Only the simulator's physics tests (`python/sim`) |
| `npm run e2e` | Playwright tests on desktop/tablet/phone viewports (uses installed Chrome; build first): smoke checks, a two-day simulated session (lessons, practice, exit recall, reviews, passing a gate), a failed gate's retake wait, real Pyodide grading, and overflow checks on every screen |

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
content/modules/<module-id>/questions.json  # question pool: lesson checks and mixed practice
content/modules/<module-id>/cards.json      # spaced-repetition cards
content/modules/<module-id>/checkpoint.json # the mastery gate
content/modules/<module-id>/build.mdx       # the module build's brief (frontmatter: title, hours, sources)
```

A lesson is MDX with frontmatter (`id: <module-id>/<slug>`, `title`, `minutes`, `concepts`, `sources`, `cards`). It can use these components:
- `<Situation>`, `<Predict>`, `<Check items={["question-id", ...]} />`, `<Viz name="...">`
- `<Bridge>`, `<Craft>`, `<KeyIdea>`, `<Figure>`, `<CodeExercise id="...">`

**Questions** (`questions.json`) are `choice`, `numeric` (relative `tolerance`, optional `unit`) or `explain` (four rubric points) items, each tagged with concepts. A lesson's `<Check>` shows some of them; mixed practice draws on every question whose concepts you've been taught. **Cards** (`cards.json`) have a `front`, a `back` (supports `code`, **bold** and `$math$`), concepts and a `critical` flag; the ids listed in a lesson's `cards` frontmatter join the deck when the lesson is completed, and a card whose id matches an exercise misconception joins as soon as a check reveals that misconception. **Checkpoints** (`checkpoint.json`) list the gate's items (questions or `{"kind": "exercise", "id": ...}`) with at least one `explain` and one `transfer` item, an optional `delayedItems` parallel form for retakes and the delayed confirmation, and the pass thresholds.

Math is written in KaTeX (`$...$`, `$$...$$`). Sources are cited by id from `research/sources.json`.

An exercise folder holds:
- `exercise.json`: prompt, concepts, exactly three hints, packages, constraints, misconceptions;
- `starter.py`;
- `solution.py`;
- `tests.py`: pytest, importing the learner's code with `from solution import ...` and the helpers in `hsgrade`. Mark edge cases with `@pytest.mark.hidden` and link failures to misconceptions with `@pytest.mark.misconception("id")`;
- optional `variants/*.py`: known-wrong implementations whose first line is `# expect: <text a failure message must contain>`.

**SQL exercises** (`"type": "sql"`, `"language": "sql"`, `"packages": ["duckdb"]`) hold `starter.sql`, `solution.sql`, a `data.py` whose `make_db()` builds the tables in DuckDB, and pytest `tests.py` that call `hsgrade.sql` (`run_learner`, `assert_columns`, `assert_rows`). Wrong variants are `variants/*.sql` with `-- expect: <text>`. Run shows the query's result as a table. DuckDB runs inside Pyodide, so the browser and CI use the same engine.

**Parsons problems** (`"type": "parsons"`) list the solution's `lines` in order (indentation included) and optional `distractors` in a `parsons` block. With a `tests.py`, the assembled code is graded by pytest, so any correct order passes; without one, the order is compared directly. Learners tap blocks to build the answer, which works on a phone.

**Derivations** (`"type": "derivation"`, `"language": "none"`) need no code files. A `derivation` block declares `variables` (each with a `shape` and a `kind`: `general`, `symmetric`, `spd`, `positive`, `unit` or `simplex`, a positive vector that sums to 1) and `steps`, each with a `prompt`, a reference `answer` written as a NumPy expression, an optional `hint`, `wrong` answers the checker must reject, and an optional `name`: later steps may use that name for the step's reference value (`p` for a softmax, say). `hsgrade.derive` evaluates the learner's expression and the reference at random draws of the variables, so any equivalent form passes, and it names common slips (a sign, a transpose, a factor of 2, a shape mismatch). The verifier checks that every reference passes and every `wrong` answer fails.

Any other `.py`, `.csv` or `.json` file in an exercise folder is written next to the learner's code when grading. Questions with `"practice": false` (such as the placement check) stay out of mixed practice.

Embed an exercise in a lesson with `<CodeExercise id="module-id/slug" />` (any type). In the app it runs real pytest inside Pyodide, with hint tiers, a guarded solution reveal and an 8–10 s infinite-loop guard.

`npm run validate` checks every file against the schemas in `src/content/schema.ts`. It covers ids, concepts, source ids and the required exercise files. The build refuses to ship invalid content.

## How the learning engine works

Everything is local to your device and derived from what you do:
- **Today** builds a session sized to the minutes available: reviews (capped at 15 min), any due gate, new lessons, mixed practice, a challenge on longer desktop days, and exit recall. Lite days (under 30 min) are reviews plus three questions; lab days (90+ min) add a weakness drill. Finished items stay in the list, checked off.
- **Reviews** use FSRS (ts-fsrs, FSRS-7) at 90% target retention (93% for gate-critical cards), at most 12 new cards a day. A lesson's cards first come due the next day; same-day recall happens at exit recall. Wrong predictions become draft cards you approve, edit or discard at exit recall.
- **Mastery** per concept is Bayesian knowledge tracing over first attempts each day; hints count as weaker evidence and a revealed solution as a miss. 95% counts as mastered.
- **Gates**: each module opens when the previous module's checkpoint is passed (85%, every critical item, a transfer item, an explanation scoring 3 of 4 rubric points). A miss means a 24-hour wait and a fresh form; after two misses you may move on provisionally. A delayed check 3–7 days after a pass confirms it stuck. The planner schedules a gate the day after a module's last lesson. Locked lessons can still be opened for a look ahead.
- **Practice** mixes 40% current module, 30% the two before it and 30% older material, weighted toward weak concepts and recent misses, with a confidence rating before each answer.
- **Progress** shows pace against the schedule (planned hours before today vs curriculum covered), mastery by module, and a weekly review: calibration, sure-but-wrong items, hint hotspots, review retention, time studied and a weakness drill.

## The simulator

`python/sim` holds `hyperscale_sim`, the Kestrel Ridge data-hall simulator: Hall A's four contained pods, sixteen fan walls with ε-NTU coils, the chilled-water loop with a waterside economizer and three staged chillers, cooling towers, pumps and the electrical chain (Level 1 of the spec in `research/domain-datacenter.md` §3). It is pure Python with no dependencies, so the in-app Control Room starts it in a Pyodide worker without downloading NumPy. The same package runs locally:

```bash
cd python/sim && uv run --python 3.14 python -c "from hyperscale_sim import Hall; h = Hall('summer-day'); h.set_controls(chws_sp=18); h.run(24 * 3600); print(h.metrics.summary())"
```

The building's baseline loops (valves, fans, chiller staging, towers, economizer) close inside each step; you change setpoints with `set_controls`, inject faults (`trip_chiller`, `fail_crah`, `set_containment`, `utility_outage`, sensor bias/drift/stuck), and read instruments with `read()` (the true values stay in `truth()`). The physics tests check steady-state energy closure (within 1%), the design point (supply 24 °C, chilled water 16/26 °C, PUE 1.30), full-economizer operation, the fan affinity law, chiller sensitivity to chilled-water temperature, the coil limit on chilled-water reset, the server-fan PUE trap, recirculation and containment breaches, chiller trips and fan-wall failures, sensor faults, and the shape of a published cooling-outage temperature rise.

`InletField` (v0.2) spreads each pod's lumped state over a rack layout: inlet sensors at three heights on every rack (288 in Hall A), with recirculation that collects at the tops of the racks and spills over the row ends, airflow starvation at the far end from the CRAH when the fans slow, fixed per-sensor offsets and sensor noise. Module 2's build reconstructs failed sensors from it; its tests check that it reduces to the lumped model and that breaches and slow fans move the expected sensors.

The Control Room (`/facility/control-room`, also embedded in Induction lesson 3) scores a simulated day on total facility energy with zero minutes above 27 °C at any rack inlet, and keeps your best valid runs on this device as the baseline later controllers must beat.

## Repository layout

| Path | What it is |
|---|---|
| `src/` | The app (React + TypeScript): `routes/` screens, `lesson/` MDX components, `learn/` question views, grading and derived learner state, `viz/` interactive explainers, `engine/` pure learning logic (FSRS deck, knowledge tracing, gates, daily planner, practice selection, pacing, weekly review, schedule), `db/` IndexedDB storage and backups |
| `content/` | Lessons, exercises, question pools, cards, checkpoints, concepts |
| `python/hsgrade/` | Grading helpers and pytest plugin (Pyodide and CPython) |
| `python/sim/` | `hyperscale_sim`, the data-hall simulator, with physics tests |
| `research/` | Research notes and `sources.json` (566 sources, 533 verified); `merge_sources.py`, `build_foundations_sources.py` |
| `planning/` | MDS calendar, time budget, curriculum order, Python schedule generator (the app's TypeScript engine matches it exactly) |
| `scripts/` | Content index and validation, SPA fallback |
| `tests/e2e/` | Playwright end-to-end tests |
| `public/icons/` | App icons |

## Regenerate planning artifacts

```bash
uv run --no-project --python 3.13 python planning/build_schedule.py
```

```bash
uv run --no-project --python 3.13 python research/merge_sources.py
```
