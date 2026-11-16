# Changelog

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
