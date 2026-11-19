# Changelog

## Unreleased

## Phase 4c: Module 1 complete (2026-11-19)

- **Lesson 6, "ML code as software"**: functions vs classes, type hints, Protocols, frozen dataclass configs, scikit-learn's estimator contract (why `__init__` must only store arguments, `fit` returns `self`, learned attributes end in `_`), seeded generators and `SeedSequence.spawn`, mutable defaults. Exercises: a `MedianScaler` graded against real scikit-learn 1.8 in the browser (`clone`, `Pipeline`, `NotFittedError`), a bootstrap with a mutable default and global seeding (debug), and a frozen config (Parsons with a mutable-default distractor).
- **Lesson 7, "Testing and tooling"**: what numerical tests should assert, relative vs absolute tolerance, fixtures and parametrize, mutation testing, property-based testing with Hypothesis (local), uv lockfiles, ruff, type checkers and CI. Exercises: write `check_pue`, graded by mutation testing (it must accept a correct `pue` and reject five plausible broken ones), and a table-driven pytest test (Parsons, graded by running its cases).
- **Lesson 8, "How I'd do this with AI tools"**: the split between your specification and tests and the agent's drafts, Module 1's tasks done with an agent, a reusable prompt for the module build, and a review checklist for AI-written code.
- **Module 1 checkpoint**: 14 items with a parallel 14-item delayed form, covering views and copies, broadcasting, energy-weighted PUE, the estimator contract (critical items), numerics, SQL windows, Polars and pandas, seeding, tolerances, a transfer item, a rubric-scored explanation, and a fresh code exercise in each form (pairwise distances; one-hot encoding).
- **Tests**: 17 exercises verified in Pyodide with 39 known-wrong variants. A new end-to-end test passes the Induction gate, completes Module 1 and takes its checkpoint with a code item in checkpoint mode.

## Phase 4b: Module 1 lessons 4 and 5 (2026-11-18)

- **Lesson 4, "SQL for telemetry, with DuckDB"**, built on the "PUE dashboard is wrong" incident: ratios of sums vs averages of ratios, clause order and evaluation order, window functions (frames, PARTITION BY, LAG on counters, QUALIFY), and as-of joins for sensors that don't share a clock. Exercises: fix the dashboard's daily PUE query, rolling-average inlet alerts, an ASOF LEFT JOIN onto a one-minute grid (all graded on DuckDB in the browser), and a clause-order Parsons problem with a WHERE-vs-HAVING distractor.
- **Lesson 5, "DataFrames for telemetry"**: Polars expressions, lazy plans with predicate and projection pushdown, `group_by_dynamic` resampling, pandas 3 copy-on-write (chained assignment), DuckDB on DataFrames via Arrow, and when to use which tool. Exercises: resample shuffled, gappy sensor data to 15-minute windows and flag frozen sensors (Polars 1.33 in the browser), and a lazy-query Parsons problem with an eager-read distractor.
- Python exercises with a `data.py` can import it from the Run button too.
- CI caches Pyodide's downloaded packages (Polars and DuckDB are large); local Playwright runs use three workers, since several tests boot Pyodide.
- 13 new cards and 11 new questions. 10 exercises now verify in Pyodide, with 26 known-wrong variants.

## Phase 4a: new exercise types, placement check, Module 1 lessons 1 and 3 (2026-11-18)

- **SQL exercises** graded on DuckDB 1.5.1 inside Pyodide (the version Pyodide ships), so the browser, CI verification and local tests use one engine. `hsgrade.sql` adds `run_learner`, `assert_columns`, `assert_rows` (order-insensitive, float tolerance, row-level messages) and `preview`. The grader now takes the solution file name and support files (`data.py`, CSVs). Run prints the result table.
- **Parsons problems**: tap blocks into order, with distractor blocks, reordering arrows, hints and a guarded reveal. Graded by pytest when the exercise ships tests (any correct order passes), otherwise by order. The verifier checks that the reference order passes and a reversed order fails.
- **Induction lesson 4, "Placement check"**: twelve closed-book questions across Python, linear algebra, calculus and probability, with a live summary per area (move briskly, normal pace, full depth, or try the test-out where the module allows it). Placement questions are kept out of mixed practice (`"practice": false`).
- **Module 1, lesson 1, "How NumPy stores your data"**: buffer, dtype, shape and strides; views vs copies; NumPy 2's promotion rules and integer wraparound, every claim checked against NumPy 2.4.6. A new **stride explorer** shows strides, offsets and copies over one buffer. Three exercises: a stride calculator, the view-mutation bug from the lesson's story (debug), and a rolling mean with `sliding_window_view` (Parsons).
- **Module 1, lesson 3, "Numerical hygiene and measuring speed"**: machine epsilon, non-associativity, catastrophic cancellation, log-sum-exp, profiling first. Exercises: a stable softmax and log-sum-exp (vectorized), and Welford's one-pass mean and variance, graded on a counter near 4.2 × 10¹⁰ where the textbook formula returns 262,144 instead of 9.06.
- 14 new cards and 23 new questions; 6 new concepts for upcoming modules (used by the placement check).
- **Tests**: 41 unit tests, 30 grader and simulator tests, 6 exercises verified with 14 wrong variants, 30 Playwright tests (including a Parsons problem in the browser and the placement summary).

## Phase 3b: Data-hall simulator and Control Room (2026-11-17)

- **`hyperscale_sim` v0.1** (`python/sim`), Level 1 of the Hall A spec, pure Python with no dependencies:
  - per pod: cold-aisle, hot-aisle, server-mass and coil leaving-air temperatures; server fans that speed up with inlet temperature; airflow balance with bypass, recirculation and containment leakage; top-of-rack hot spots;
  - fan walls with affinity-law power, ε-NTU coils whose valves hold the supply-air setpoint until they run out of temperature difference;
  - chilled-water headers, a waterside economizer with hysteresis, three chillers (Carnot-fraction COP with a part-load curve, staging timers, ramp limits, trips with restart delays), towers on an approach curve with fan control and water use, pumps on a system curve, a 2N UPS, distribution and transformer losses;
  - four synthetic days at Kestrel Ridge (summer, spring, heat wave, winter) with diurnal web load, a training-job pod, time-of-use prices and grid carbon;
  - faults: chiller trip, fan-wall failure, containment breach, coil fouling, tower degradation, IT load steps, utility outage; a separate measurement layer with sensor bias, drift and stuck faults (a biased control sensor mis-controls the real temperature);
  - KPIs: energy, PUE, WUE, cost, carbon, economizer hours, and pod-minutes above the 27 °C and 32 °C inlet limits.
- **15 physics tests**, including energy closure within 1%, the design point (PUE 1.30, chilled water 16/26.6 °C) and the published cooling-outage shape (spike, recovery, a 40.7 °C peak about 3 minutes later than published, recovery). A summer day runs in about 0.5 s in CPython.
- **Control Room** (`/facility/control-room`, and `<Viz name="ControlRoom" />` in lessons): runs the simulator in its own Pyodide worker (no package downloads, so it starts in seconds and never blocks code grading). It has setpoint sliders, auto or manual fans, the economizer switch, pod heat tiles with recirculation warnings, plant status, KPI tiles, day-long charts, fault injection, and an end-of-day summary compared with a default-settings run. Valid runs (no faults, no inlet violations) can be saved as your baseline, with a leaderboard per scenario. The layout uses container queries, so it adapts to a lesson column or a full page.
- **Induction lesson 3, "Hands on the controls"**: three predictions, the Control Room, the coil limit, why PUE isn't the objective, the constrained-optimization framing, five new cards and five new questions, and three new concepts (fan affinity, airflow management, setpoint trade-offs).
- **Fix**: on a day when finished lessons used most of the budget, the planner dropped exit recall. Practice, drill and challenge now leave room for it, and a day with lessons always closes with it (new unit test).
- **Tests**: 39 unit tests, 15 simulator tests, 27 Playwright tests, including the Control Room booting Pyodide, running a full day and saving a baseline on three viewports.

## Phase 3a: Learning engine (2026-11-17)

- **Daily session planner** (`src/engine/planner.ts`): sizes today's session to the minutes available. Reviews (hard cap 15 min) → due delayed checks and gates → new lessons → mixed practice → weakness drill (lab days) → a challenge (desktop, 45+ min, never on a gate day) → exit recall. New material has priority over the challenge; practice shrinks so a lesson fits whole. Lessons finished today stay in the plan, checked off. Today shows the plan with a one-tap Start/Continue, and every screen's finish state links to the next step.
- **Spaced repetition** (`src/engine/fsrs.ts`, `cards.ts`): ts-fsrs v6 (FSRS-7), 0.90 retention, 0.93 for gate-critical cards, 365-day cap, 12 new cards a day. Cards join the deck when their lesson is completed and first come due the next day. A known exercise misconception adds its card immediately. Wrong predictions become draft cards. The Review screen shows interval previews on the rating buttons, keyboard shortcuts (space, 1–4) and KaTeX math; the nav shows the number due. ts-fsrs loads only when cards are enrolled or rated.
- **Exit recall** (`/review/exit`): two closed-book recall items from today's lessons, approve/edit/discard draft cards, and today's calibration.
- **Mastery** (`src/engine/mastery.ts`): Bayesian knowledge tracing per concept from the first attempt at each item per day; guess rates depend on the format (choice, typed number, self-rated explanation, code); hinted successes count half; tier-3+ hints or a revealed solution count as a miss.
- **Mastery gates** (`src/engine/gates.ts`, `/learn/:module/checkpoint`): closed-book checkpoint scored on threshold, critical items, a transfer item and a rubric-scored explanation (written first, self-assessed after submitting). 24-hour retake on the alternate form, provisional advance after two misses, delayed confirmation 3–7 days after a pass (re-offered 3 days after a miss without revoking the pass). Modules unlock in study order; projects and unwritten modules don't block. Locked lessons show why and offer "Open anyway" for the browser session.
- **Question pools** (`content/modules/<id>/questions.json`): lesson `<Check items={[...]}>` now references pooled questions (inline questions are rejected by validation, and unknown ids fail the build). 15 Induction and 9 Module 1 questions, including new practice-only items.
- **Mixed practice** (`src/engine/practice.ts`, `/practice/session`): 40/30/30 current/recent/older mix, weighted to weak concepts and recent misses, a 20-hour cooldown, concept interleaving, and a confidence rating before each answer. Drill mode by concept or weak spots. The Practice screen lists weak spots, the challenge (re-solve, from a blank editor, an exercise met 2+ days ago) and drills by concept.
- **Progress**: pace against the schedule (counts planned hours before today, never today's), mastery by module and concept, and a weekly review (time studied vs available, first-try accuracy, review retention, calibration, sure-but-wrong items, hint hotspots, slipping cards, delayed checks, weakness drill, next week's focus).
- **Code exercises** gain modes: `lesson` (drafts, hints, reveal), `challenge` (blank editor) and `checkpoint` (no hints or reveal; counts if it passes within three checks).
- **Fixes**: grids on Today, module, Practice, Progress, Projects and Checkpoint screens overflowed on phones when titles were long (grid tracks now use `minmax(0, …)`). The overflow tests compared the page against `window.innerWidth`, which mobile Chrome widens to fit overflowing content, so they could never fail on phones; they now use `clientWidth`, cover every screen and the stateful views, and were confirmed to fail with the bug present.
- **Tests**: 38 unit tests (FSRS, knowledge tracing, gate state machine, planner, deck, practice selection, grading, pacing, weekly review, schedule parity, backups); 24 Playwright tests, including a two-day simulated session with a frozen clock (lessons, practice, exit recall, reviews the next day, passing the Induction gate unlocks Module 1) and a failed gate's 24-hour retake wait.

- **Live on GitHub Pages:** https://colbyy03.github.io/hyperscale/ (repo: github.com/colbyy03/hyperscale).
- **Fix (caught by CI on Linux):** re-checking an edit that kept the file's length within the same second could grade the *previous* code. Python validates cached bytecode by whole-second mtime and size. The grader now removes `__pycache__`, invalidates import caches and disables bytecode writing during grading, in both the browser and CI. A regression test covers it.

## Phase 2: Code runner and grading (2026-11-16)

- **`hsgrade`** (`python/hsgrade`), a grading library that runs unchanged in Pyodide and CPython:
  - assertion helpers that diagnose common mistakes: shape mismatches with `.ravel()`/`keepdims` hints, NaN/inf sources, wrong sign, wrong order, constant-factor errors such as ddof, loops in vectorization exercises, forbidden imports in from-scratch exercises, runtime limits;
  - a pytest plugin returning structured JSON results, with `hidden` and `misconception` markers;
  - 13 tests, run on CPython 3.14 with Pyodide's NumPy 2.4.6 and pytest 9.0.2.
- **Python worker**: Pyodide 314.0.7 in a module Web Worker.
  - Package loading in dependency order, kept outside the run timeout.
  - stdout/stderr capture and cleaned tracebacks.
  - Timeouts terminate and respawn the worker, so an infinite loop can't hang the app.
- **CodeMirror 6 editor** themed to the app, touch-friendly: Ctrl/Cmd+Enter runs, Shift+Ctrl/Cmd+Enter checks.
- **CodeExercise**: Run, Check (real pytest), attempt-first tiered hints, a guarded solution reveal, saved drafts, attempts recorded with skills and hint tier.
- **`npm run verify:exercises`**: Pyodide on Node checks that each exercise's solution passes, its starter fails, and every known-wrong variant fails with its expected message.
- **First Module 1 content**: lesson "Vectorization and broadcasting" and the exercise "Standardize sensor columns, vectorized", with five known-wrong variants.
- **Fix**: lesson text styles no longer leak into exercises and interactive blocks (`not-prose` scoping).
- **Tests**: end-to-end test that loads real Pyodide in Chrome and grades the starter (1/7) and a correct solution (7/7). CI now runs the grader tests and exercise verification.

## Phase 1: App shell and content system (2026-11-16)

- Vite 8 + React 19 + TypeScript 7 (strict) single-page app; Tailwind 4 design system (dark-first, light theme, thermal colour tokens); Inter and JetBrains Mono bundled for offline use.
- Screens: Today, Learn, module and lesson pages, Practice, Review, Facility map, Projects, Progress (milestones and the 46-week schedule), Sources (searchable bibliography) and Settings.
- Content pipeline:
  - MDX lessons compiled at build time with KaTeX math;
  - a validated content index (`virtual:hyperscale/content`);
  - zod schemas for modules, lessons, exercises and the curriculum;
  - `npm run validate` checks ids, concepts, source ids and required exercise files.
- Lesson components: Situation, Predict (commit-then-reveal), Check (multiple choice and numeric with tolerance), Viz, Bridge, Craft, KeyIdea, Figure, plus a CodeExercise placeholder until the runner ships.
- Interactive explainers: PUE calculator and the chip-to-sky heat path with an economizer toggle.
- Schedule engine: a TypeScript port of `planning/build_schedule.py`, with a unit test proving identical weeks, module spans and milestone dates. The schedule re-flows from the time budget in Settings.
- Local-first storage: IndexedDB via Dexie (progress, attempts, cards, sessions, checkpoints, projects, incidents, simulator runs, notes; secrets kept separate). JSON export/import with schema versioning, preview, and merge or replace. Persistent-storage request.
- PWA: manifest, icons, Workbox service worker (precache plus cache-first for Pyodide), in-app update prompt, `404.html` SPA fallback for GitHub Pages.
- First content: Induction lessons 1–2 ("Welcome to Kestrel Ridge", "The data hall in one picture") with cited sources.
- Tests: 11 unit tests (schedule parity, session outline, backup round-trip); 15 Playwright smoke checks across desktop, tablet and phone. The tablet run caught and fixed a grid overflow.
- CI (`ci.yml`) and GitHub Pages deploy (`deploy.yml`) workflows.
- Sources merge: URL-based de-duplication now requires matching titles. This fixed three false merges; `sources.json` holds 566 sources.

## Phase 0: Research and plan (2026-11-12 – 2026-11-16)

- Research streams (all in `research/`):
  - UBC MDS curriculum and 2026–27 calendar (`mds-curriculum.*`);
  - 36 current job postings at Amazon, Microsoft, Google and Meta with skill-frequency analysis (`job-postings.*`);
  - ML-for-data-center/energy literature and public datasets (`domain-ml-literature.md`, `datasets.*`);
  - data-center domain primer and simulator spec seed (`domain-datacenter.md`);
  - pedagogy surveys for every module plus learning-science design rules (`pedagogy-foundations.md`, `pedagogy-advanced.md`).
- Citation database `research/sources.json`: 563 sources, 532 verified (Crossref, arXiv or live page), mapped to stable module ids. Merge tooling in `merge_sources.py`; `build_foundations_sources.py` rebuilds the foundations stream's records.
- Verified the in-browser grading stack in Chrome: pytest inside Pyodide 314.0.7 with a results plugin (warm re-grade ≈ 0.5 s); scikit-learn, LightGBM, XGBoost and SciPy HiGHS run in-browser. Package-order and coexistence constraints are documented in `PLAN.md` §8.3.
- Planning model in `planning/`: MDS calendar, time budget, study-order curriculum, and a schedule generator that produces the week-by-week plan and milestone dates.
- Curriculum order revised from the pedagogy research: feature pipelines before boosting; kernels directly before Bayesian/GPs; a policy-gradient primer in LLM training; evals before RAG and agents.
- `PLAN.md` ready for approval.
