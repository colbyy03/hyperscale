# Changelog

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
