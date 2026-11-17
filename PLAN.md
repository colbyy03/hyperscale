# Hyperscale: plan (draft for approval)

Status: **Phase 0 (research + plan) — awaiting your approval.**

Contents:
1. Summary and decisions
2. What the research says
3. Teaching design
4. Curriculum
5. Projects
6. Timeline
7. How Hyperscale complements MDS
8. App architecture
9. Content format
10. Build phases
11. Risks

## 1. Summary and decisions

Hyperscale is a year-long personal course plus a standalone PWA:
- 32 modules (0–31), 3 milestone projects, 2 capstones;
- about **547 planned hours** against about **609 available** from Nov 16, 2026 to Oct 3, 2027 at your stated time budget, leaving about 60 h of buffer;
- every algorithm goes intuition → math → NumPy from scratch → production library;
- in-browser Python (Pyodide, including scikit-learn, XGBoost, LightGBM, HiGHS) and SQL (DuckDB-WASM);
- local uv/PyTorch labs for GPU work;
- mastery gates, FSRS spaced repetition, a daily one-tap session, and a data-hall simulator you keep coming back to;
- set at a fictional campus, Kestrel Ridge.

**Recommended order (job-weighted, "Option A").** The 36-posting analysis puts these ahead of RL/MPC and advanced deep learning for the domain roles:
- forecasting (56% of tier-A postings);
- optimization/OR (47% of all postings);
- uncertainty quantification (44% of tier-A);
- MLOps (67%) and system design (53%).

RL appears in 1 of 36 postings, so Option A moves time series, optimization/OR, UQ and anomaly detection into Feb–Apr, synced with DSCI 574/553/554. Transformers and LLM internals move to May–June.

| Milestone | Target date (Option A) | You can build | Roles it supports |
|---|---|---|---|
| M1 Foundations and classical ML | **Jan 26, 2027** | Leak-free forecasting/classification pipelines with calibrated GBMs; tested, typed Python packages; core algorithms from scratch | Data scientist (forecasting/analytics) on infrastructure and energy teams; ML-fundamentals screens |
| M2 Forecasting, optimization, DL core | **Mar 22** | Probabilistic forecasters with backtests; LP/MILP and stochastic optimization; your own autograd engine; PyTorch training | Applied scientist / data scientist in capacity, demand and energy planning (Meta demand forecasting, Amazon CloudTune-type roles) |
| M3 Production ML and LLM systems | **May 15** | FDD/anomaly systems; causal impact estimates; RAG/agent apps with evals; deployed, monitored ML services | ML engineer (production), AI engineer, applied scientist for infrastructure reliability (e.g. Amazon DC Ops analytics, Microsoft safe-changes) |
| M4 DL and LLM internals | **Jun 30** | CNN/RNN/attention and transformers from scratch; a small LM; LoRA; inference optimization | ML engineer on model/serving teams; GenAI applied scientist |
| M5 Control, RL, Capstone 1 | **Aug 17** | Economic MPC and PPO controllers with safety layers, evaluated in simulation | Applied scientist for energy optimization and data-center efficiency; controls-plus-ML roles |
| M6 Capstone 2, full mastery | **Sep 4** (buffer to Oct 3) | AI-native diagnostic agent with an evaluation harness | All of the above, with a portfolio of 2 capstones + 3 milestone projects |

Under Option B (deep learning first, close to your example dates):
- transformers finish Mar 8;
- time series finishes May 27;
- optimization/OR finishes Jun 19;
- Bayesian/UQ finishes Jun 26.

That is after much of the application window. `planning/schedule-alternative.json` has the full Option B schedule.

**Decisions I need from you**
1. Option A (recommended) or Option B ordering.
2. Default time budget, in minutes per day (weekday/weekend):
   - teaching weeks 75/150;
   - block week 5: 150/150;
   - breaks 180/150;
   - MDS capstone 60/150;
   - summer 120/150 (assumes no full-time job before October).
3. Fictional names: "Basalt Cloud" / "Kestrel Ridge", or your own.
4. OK to install Node.js with Homebrew (`brew install node`)? The build needs it; it is not on this Mac.
5. Where the project lives: a permanent folder (e.g. `~/Developer/hyperscale`) and a GitHub repo `hyperscale` with Pages at `colbyy03.github.io/hyperscale/`. Public, or private (Pages on a private repo needs GitHub Pro, which the Student Pack includes).
6. Licence: code MIT; course content CC BY-NC-SA 4.0 or all rights reserved.
7. MDS block dates are partly inferred (the MDS calendar is login-gated); please confirm them (section 7).
8. UBC Library: no paywalled paper was needed for planning. I'll ask you to sign in when we write Modules 18 and 29 (priority list in `research/domain-ml-literature.md`).

## 2. What the research says

Full notes in `research/`. All citations are in `research/sources.json`: **563 sources, 532 verified** against Crossref, arXiv or the live page. 155 are paywalled. Each record also maps to stable module ids, so renumbering never breaks a citation. The file is merged from the per-stream files by `research/merge_sources.py`.

- **Jobs** (`job-postings.md`, 36 postings: Amazon 10, Microsoft 9, Google 9, Meta 8):
  - **Most-named skills:** Python 75%, MLOps/deployment 67%, ML system design 53%, statistics 50%, distributed systems 50%, optimization/MIP 47%, LLM/GenAI 42%, time-series forecasting 33% (56% of tier A), Bayesian/UQ 25% (44% of tier A).
  - **Rarely named:** RL in 1 posting; managed cloud ML services (SageMaker etc.) almost never.
  - **Seniority:** true ML-for-data-center roles are scarce and mostly senior; entry routes are Amazon Applied Scientist I/Data Scientist I and Microsoft Applied Scientist II.
  - **Communication** is in 69%, so every project ends with a stakeholder memo.
- **MDS** (`mds-curriculum.md`): ML courses are applied, with no from-scratch work and no autograd; transformers get about one lecture; statistics is in R. Mode per module:
  - accelerate: 4, 7, 16, 17;
  - deepen: 1, 3, 6, 8–10, 12–14, 19, 22, 23, 31;
  - teach fully: everything else.
- **Domain ML** (`domain-ml-literature.md`, `datasets.md`):
  - **Data:** no public data-center cooling telemetry exists, so the simulator is necessary. Usable public data:
    - Google PowerData2019 (data-center power, CC-BY 4.0);
    - BDG2 (CC BY 4.0);
    - Azure LLM inference traces (CC BY 4.0);
    - LBNL labeled HVAC faults;
    - EIA-930 grid data.
  - **Gotchas to teach:** flawed anomaly benchmarks; forecast leakage; sim-to-real.
- **Data-center domain** (`domain-datacenter.md`):
  - **Scale:** US data centers used 176 TWh in 2023 (4.4% of US electricity), with 325–580 TWh projected for 2028 (LBNL). Global use is heading from 415 TWh (2024) to about 945 TWh (2030) (IEA).
  - **Efficiency:** industry-average PUE is about 1.5 (Uptime) against hyperscalers at 1.08–1.17. Typical racks draw about 11 kW; liquid-cooled AI racks about 120 kW. ASHRAE's recommended inlet range is 18–27 °C.
  - **Simulator:** the notes contain the full spec described in section 8.7: states, equations, parameters, 10 baseline control loops, 15 failure modes with sensor signatures, and a sensor list.
  - **Library items:** ASHRAE's thermal and liquid-cooling guidelines and the chiller-model papers are the paywalled items to fetch through UBC later.
- **Pedagogy** (`pedagogy-foundations.md`, `pedagogy-advanced.md`; current syllabi checked for CS229, CS231n, CS224n, CS336, CMU DL Systems, fast.ai, Karpathy's Zero to Hero/nanochat, FPP, and others):
  - **Learning science:** the evidence-based rules (retrieval, spacing, interleaving, faded worked examples, predict-observe-explain, mastery gates with a release valve, attempt-first hints, FSRS-7) define section 3.
  - **Order changes adopted:** feature pipelines before boosting; kernels directly before Bayesian/GPs; a policy-gradient primer inside LLM training; evals before RAG and agents; resource accounting from the PyTorch module on.
  - **Browser vs local, measured:** NumPy runs at about 0.5 GFLOP/s in Pyodide, so in-browser training stays at ≤ 10⁵ parameters and under 60 s; PyTorch, JAX, numba-based libraries and Gymnasium run locally. Optimization and control tooling (CVXPY+Clarabel, CasADi, python-control, PySINDy) works in the browser.

## 3. Teaching design

The design follows the learning-science review in `research/pedagogy-foundations.md` (rules R1–R18 there, with citations). Thresholds are evidence-anchored defaults, not experimentally optimized constants. The app logs enough data to tune them for you after a few months (R18).

### 3.1 The loop every major idea goes through

1. **Predict, then explore.** Every interactive explainer starts locked until you commit a prediction: a number, a choice, or a sketch on axes. After you explore, you write one or two sentences reconciling prediction and outcome. A wrong prediction automatically drafts a review card for that misconception. Watching demonstrations without predicting produces little understanding (`crouch2004-predict-demos`); how you engage matters more than what the visualization shows (`hundhausen2002-av-meta`).
2. **Math, as a faded worked example.**
   - A full derivation comes first, with a "which principle justifies this step?" prompt on each line.
   - Then backward fading: the last step is blank, then the last two, and so on.
   - Then a matched problem you derive yourself, as typed expressions checked numerically or symbolically.
   - Fading is faster where you are already strong (calculus) and slower where the material is new (probabilistic modeling). This follows the expertise-reversal effect (`atkinson2003-fading-self-explanation`, `kalyuga2003-expertise-reversal`).
3. **Code, also faded.**
   1. An annotated reference implementation.
   2. A Parsons problem (shuffled lines, later with distractors).
   3. Fill in the key lines.
   4. Write it from scratch in NumPy.

   If you solve the first faded item quickly, correctly and without hints, the app jumps you to the from-scratch task.
4. **Production comparison.** The same task with scikit-learn, statsmodels, LightGBM/XGBoost, PyTorch or the relevant tool. A `<Compare>` block checks agreement within a stated tolerance and explains differences (defaults, numerics, regularization conventions).
5. **Craft and debugging, after competence.** "Find the bug" and "why is this model lying?" items unlock only once the correct procedure is secure. Erroneous examples help learners with solid prior knowledge but hurt novices (`grosse2007-erroneous-examples`).
6. **Retrieval and spacing.** Closed-book recall at the end of the lesson, then review cards (FSRS), then spiral re-checks:
   - a delayed mastery confirmation 3–7 days after the gate;
   - a mixed module set about 3–4 weeks later;
   - re-derive / re-implement drills at about 1 week, 1 month and 3 months.

   Whole derivations and implementations are drills, not flashcards (`cepeda2008-spacing-ridgeline`).
7. **Interleaving.** After 3–5 blocked items on a new procedure, practice is mixed: about 40% today's lesson, 30% this module, 30% earlier modules. Each set includes at least one "which method applies?" item, and confusable pairs are interleaved deliberately:
   - ridge/lasso;
   - ROC/PR;
   - bagging/boosting;
   - GroupKFold vs time-series splits;
   - MLE/MAP;
   - confidence vs prediction vs credible intervals;
   - confounder/mediator/collider.

   Terminology drills stay blocked, because interleaving hurts word learning (`brunmair2019-interleaving-meta`, `rohrer2020-interleaving-rct`).
8. **Productive failure, sparingly.** At most one 10–15 minute invention task per module, before instruction, on a concept worth reinventing. Examples: invent a split-quality score before impurity; invent an interval that covers 90% of future errors before conformal prediction. It is never used for tooling or syntax (`sinha2021-pf-meta`, `loibl2017-ps-i`).

### 3.2 A daily session

| Part | Default (weekday, 45–75 min) | Why |
|---|---|---|
| Warm-up | 2–3 min: two or three pre-questions or predictions about today's lesson, recorded but not graded | Pre-questions prime later learning (IES guide, `pashler2007-ies-guide`) |
| Reviews | ≤ 15 min (hard cap): FSRS cards mixed across all modules | Spacing and interleaving at no extra cost |
| New material | 25–35 min: one or two cycles of the loop in 3.1, with a learner action at least every 3–5 minutes | Active learning beats passive exposure (`freeman2014-active-learning`) |
| Mixed practice | 8–10 min: 5–8 items in the 40/30/30 mix, with a confidence rating before each reveal | Interleaving plus calibration |
| Challenge | One harder, unscaffolded item (≈10–15 min; shorter on short days) | Your brief's "one hard challenge" |
| Exit | 3–5 min: two closed-book recall items, approve or edit today's draft review cards, calibration readout | Retrieval beats restudy on delayed tests (`roediger2006-test-enhanced-learning`) |

Variants:
- **lite day** (15 min: reviews plus three mixed items) for heavy MDS weeks, switched on automatically during assessment crunches;
- **weekend lab** (90–150 min: a from-scratch build or project work, a weakness drill, and delayed confirmations).

The planner sizes every session to the minutes available that day (section 8.6). Once, briefly, the app explains why spaced and mixed practice *feels* slower while producing more durable learning (`deslauriers2019-feeling-of-learning`, `bjork2013-self-regulated`).

### 3.3 Exercise types

- **Predict-the-output**: code or a plot is shown and you predict before running. Heavy use for NumPy semantics, broadcasting, PyTorch autograd behaviour and loss-curve reading.
- **Parsons problems**: the code-level fading step. Fast, and phone-friendly.
- **Fill-in-the-code** and **from-scratch implementation**, graded by visible and hidden pytest suites, plus a comparison with the library. Gradients must pass finite-difference checks (relative error below 1e-6 in float64).
- **Debugging**: seeded broken code or a recorded broken training run (loss curve, activation statistics, config). You name the cause, then prove it with a minimal fix that hidden tests verify.
- **Derivations**: step lists with typed expressions, graded step by step rather than only on the final answer (step-level feedback is what makes tutoring systems work; `vanlehn2011-tutoring`).
- **"What happens if" experiments** on explainers, answered after exploring.
- **Concept questions**: mostly *generative* (numbers, steps, short code, explanations). Multiple choice is reserved for discrimination items with diagnostic distractors, because recall beats recognition (`rowland2014-testing-meta`).
- **Explain items**: a Feynman-style explanation scored against a rubric, plus one "interviewer follow-up" question. These are self-assessed, or tutor-assessed if you enable the tutor.
- **SQL** against telemetry tables (DuckDB-WASM).
- **Local labs**: PyTorch/GPU work with pytest suites. Tests fail with `NotImplementedError` until your code is wired in through an adapters module, the pattern Stanford CS336 uses.
- **Experiments with seeds**: any comparison of training methods runs 3–5 seeds and reports intervals.

### 3.4 Mastery gates, hints and feedback

- **Module gate.** A fresh, unhinted, interleaved checkpoint of 10–14 items covering every module objective. To pass you need:
  - **at least 85% overall**;
  - **100% on items flagged critical** (for example a leak-free split, a correct gradient, the right estimand);
  - at least one **transfer item** in a new engineering context;
  - one **explain item** scoring at least 3/4.

  Code is graded per function by tests; derivations per step.
- **Delayed confirmation.** A parallel form 3–7 days later; pass at 80% or more. Failing re-opens only the failed objectives.
- **Failing a gate.** Targeted remediation (a new worked example plus 3–5 items per failed objective), then a retake on new items after at least 24 hours. **After two failed attempts you may advance provisionally**, with the remediation items pinned into daily reviews. Self-paced mastery programs without that release valve lower completion rates (`kulik1990-mastery-meta`).
- **Test-outs.** Modules MDS already covers well (**4, 7, 16, 17**) open with an optional gate attempt. Passing skips the introductory lessons and assigns only the extension lessons.
- **Hint ladder.**
  - **T0:** a first attempt (or about 60 seconds of work) is required before any hint.
  - **T1 orient:** restates the goal and the known quantities.
  - **T2 principle:** names the concept and links to the lesson.
  - **T3 next step:** solves the next step, or gives a Parsons skeleton.
  - **T4 bottom-out:** the full worked solution. The item is graded as a failure, and an isomorphic variant comes back within 1–3 days.

  Hints fade as your skill estimate rises (`aleven2016-help-seeking`, `koedinger2007-assistance-dilemma`).
- **Feedback** is always about the task and the process: the correct answer plus a short process-level explanation. It is never praise or blame of the person, which can lower performance (`hattie2007-feedback`, `kluger1996-feedback`).
- **Weak spots get more practice automatically.** Each week a 20-minute weakness drill is assembled from:
  - lowest-retrievability cards;
  - skills with the most hint use;
  - repeated misconceptions from predictions.

  These also feed daily mixed practice.
- **What the dashboard leads with.** Delayed-retention evidence comes first: gate confirmations, FSRS retention, calibration curves comparing your confidence with your accuracy. Streaks and time spent are shown, but kept secondary.

### 3.5 Spaced repetition

- **Scheduler.** FSRS-7 through `ts-fsrs` v6, not SM-2. FSRS models each card's difficulty, stability and retrievability, and schedules reviews to hit a target retention. On the open benchmark, per-user optimized FSRS-7 beats its defaults and older schedulers (`fsrs-srs-benchmark`).
- **Retention.** 0.90 by default; 0.92–0.93 for gate-critical cards (prerequisite identities, leakage rules, core derivation steps); 0.85 for peripheral facts (API names, history).
- **Steps and limits.**
  - learning steps 1m and 10m, relearning 10m;
  - maximum interval 365 days during MDS and the job search;
  - 10–15 new cards a day, and new cards pause when the review backlog exceeds two days;
  - leeches (about 8 lapses) are suspended and flagged for a rewrite or re-teach.
- **Weights.** Personalized monthly from your own review log.
- **Grade mapping.**
  - wrong, or a T3/T4 hint used → Again;
  - correct with T2, or slow → Hard;
  - correct → Good;
  - fast, correct and confident → Easy.
- **Cards per lesson.** 8–15, drafted from tagged lesson elements and approved or edited by you in the exit step. Types:
  - concept why/when;
  - one derivation step;
  - predict-the-output or shape;
  - code cloze;
  - discrimination ("which metric here?");
  - engineering bridge;
  - bug spotting.
- **Card writing.** One retrieval target per card; no yes/no prompts; parameterized variants where possible, so you recall the concept rather than the surface form (`matuschak2020-prompts`).

### 3.6 Engineering bridges (examples)

| ML idea | What you already know |
|---|---|
| Gradient descent, conditioning, preconditioning | Iterative linear solvers (Jacobi, Gauss–Seidel, CG), stiffness |
| Momentum | Heavy ball / damped mass–spring dynamics |
| Ridge / weight decay | Tikhonov regularization of ill-posed inverse problems; damping |
| PCA / SVD | Modal analysis; proper orthogonal decomposition of flow and temperature fields |
| Covariance ellipse | Mohr's circle (principal axes of a symmetric tensor) |
| Kalman filter, state-space models, RNNs | State estimation and discrete-time state-space systems |
| Normalization layers | Nondimensionalization of governing equations |
| LR warmup and annealing | Under-relaxation in CFD solvers |
| MLE | Least-squares fits of experimental data with known noise |
| Bellman equation, MPC | Dynamic programming, optimal and receding-horizon control |
| PINNs, grey-box models | PDE residuals, lumped-capacitance and RC thermal networks |
| Conformal / Bayesian intervals | Measurement uncertainty and error propagation |
| Control charts for anomalies | Statistical process control |

Each bridge appears in its lesson and as a review card. Each visualization is paired with its equation and a concrete facility example.

### 3.7 The craft thread

| Skill | Introduced | Practised again in |
|---|---|---|
| Debugging training runs and reading loss curves | 12 | 13, 23–25, 28 |
| Data leakage (target, temporal, group, preprocessing, pretraining overlap) | 6–7 | 8, 14, 18, P1–P3 |
| Reproducibility (seeds, lockfiles, determinism, data versions) | 1 | 13, 22, every project |
| Experiment tracking | 13 | 14, 22, 24–25, capstones |
| Tested ML code (unit, property, shape, golden, "overfit one batch") | 1 | 11, 12, 22, every project |
| Numerical stability | 1 | 2, 6, 11, 26 |
| Resource accounting (memory, FLOPs ≈ 6·N·D) | 13 | 24–26, 30 |
| Evaluation design and uncertainty on every number | 6–7 | 14, 17, 18, 20, capstones |

### 3.8 AI-native thread

The policy matches where the field landed in 2026: course policies that forbid AI completing assignments, open-source projects that require disclosing LLM-written code, and agents running whole experiment loops (`research/pedagogy-advanced.md` §0.5).

- **From-scratch stages are AI-off.** The optional tutor switches to Socratic-only mode, with no code generation.
- **Production stages are AI-on, with eval-driven review.**
- **Every module ends with "How I'd do this with AI tools":** a walkthrough of a real coding-agent session on that module's work, *plus the checks that caught its mistakes*, plus at least one exercise where you review agent-written code or a derivation and find what is wrong.
- **Delegate** scaffolding, boilerplate, plotting, refactors, test skeletons, docstrings and search.
- **Own** the math, evaluation design, leakage reasoning, numerical stability, and what to build.
- **Always verify:**
  - run the tests;
  - gradient-check derivatives;
  - compare against a library;
  - read every diff;
  - check shapes and units;
  - re-derive claims that matter.
- **Known failure modes:**
  - hallucinated APIs;
  - silent broadcasting bugs;
  - pipelines that leak because an agent fit a scaler on all the data;
  - confident but wrong derivations;
  - tests that test the implementation instead of the spec.
- **Eval-first** for LLM systems: error analysis and a small golden set come before any RAG or agent work (Module 20).

### 3.9 Domain thread (data centers)

| Domain topic | Where it appears |
|---|---|
| Power chain, cooling chain, PUE/WUE/CUE | Induction |
| Telemetry, BMS/DCIM points, units and time | Module 1 |
| Thermal fields and sensors | Modules 2 and 4 |
| CRAH control loops | Module 3 |
| Chiller physics (lift, part-load) | Modules 6 and 9 |
| Psychrometrics and economizers | Module 8 |
| Operating modes and coil fouling | Module 10 |
| IT load, PUE seasonality, grid carbon | Module 14 |
| Plant scheduling, thermal storage, power capacity | Module 15 / P2 |
| FDD for chillers, CRAHs, towers, sensors | Module 18 |
| Retrofit M&V | Module 19 |
| SOPs and maintenance logs | Module 20 |
| Liquid-cooled AI pods, rack density, inference energy | Modules 26 and 30 |
| MPC/RL for cooling | Modules 28–29 |
| Water, grid and community impacts | Module 31 |

Facts and numbers come from `research/domain-datacenter.md`, cited by source id.

### 3.10 Narrative

You are a new ML engineer at **Kestrel Ridge**, a fictional hyperscale campus run by the fictional **Basalt Cloud**:
- modules unlock rooms of the campus map;
- incidents arrive as short tickets from a small cast of colleagues (site lead, controls engineer, reliability lead, energy analyst, platform lead);
- the writing is matter-of-fact, like a real ops channel;
- there are no points for clicking, only for demonstrated skill.

## 4. Curriculum

The curriculum has 32 modules (0–31) in **study order**, grouped into six phases. Topic 24 from your brief is split in two:
- **Optimization and OR**, early, because 47% of postings name it;
- **Control and physics-informed ML**, later.

The `brief #` column maps each module back to your original list. Hours are base estimates. The schedule adds 10% for spaced-repetition reviews.

Each module entry lists:
- its lessons (each about 15–30 minutes of active work);
- what you build from scratch and the library you compare it against;
- the module build;
- engineering bridges, facility tie-ins and incidents.

Every module also has:
- a checkpoint (the mastery gate: graded code plus concept questions);
- review cards;
- a "How I'd do this with AI tools" section;
- cited sources.

Sections 3 and 9 describe the lesson anatomy and file format.

| # | Module | Brief # | Hours | MDS mode | Phase |
|---|---|---|---|---|---|
| 0 | Induction: first week at the facility | n/a | 2 | teach fully | 1 Foundations |
| 1 | Python for ML engineering | 1 | 12 | deepen | 1 |
| 2 | Linear algebra for ML | 2 | 12 | teach fully | 1 |
| 3 | Calculus and continuous optimization | 3 | 10 | deepen | 1 |
| 4 | Probability and statistics | 4 | 10 | accelerate | 1 |
| 5 | Information theory | 5 | 4 | teach fully | 1 |
| 6 | Linear and logistic regression from scratch | 6 | 14 | deepen | 2 Classical ML |
| 7 | Model evaluation | 7 | 8 | accelerate | 2 |
| 8 | Feature engineering and data pipelines | 11 | 10 | deepen | 2 |
| 9 | Trees, random forests and gradient boosting | 8 | 14 | deepen | 2 |
| 10 | Unsupervised learning | 10 | 11 | deepen | 2 |
| P1 | Milestone project: Energy Desk forecaster | n/a | 12 | n/a | 2 |
| 11 | Autograd engine from scratch | 12 | 14 | teach fully | 3 Forecasting, optimization and the deep-learning core |
| 12 | Training deep networks | 13 | 13 | deepen | 3 |
| 13 | PyTorch fluency | 14 | 10 | deepen | 3 |
| 14 | Time series and probabilistic forecasting | 21 | 22 | deepen | 3 |
| 15 | Optimization and operations research | 24a | 14 | teach fully | 3 |
| 16 | SVMs, kernels and k-NN | 9 | 5 | accelerate | 3 |
| 17 | Bayesian methods and uncertainty quantification | 25 | 10 | accelerate | 3 |
| P2 | Milestone project: Capacity and power planner | n/a | 12 | n/a | 3 |
| 18 | Anomaly detection and fault diagnosis | 22 | 16 | teach fully | 4 Reliability, LLM systems and production |
| 19 | Causal inference | 26 | 8 | deepen | 4 |
| 20 | Building with LLMs | 19 | 20 | teach fully | 4 |
| 21 | ML system design | 27 | 10 | teach fully | 4 |
| 22 | MLOps and cloud ML | 28 | 18 | deepen | 4 |
| P3 | Milestone project: Reliability platform | n/a | 12 | n/a | 4 |
| 23 | CNNs, RNNs and attention | 15 | 14 | deepen | 5 Deep-learning depth and LLM internals |
| 24 | Transformers from scratch and a small language model | 16 | 18 | teach fully | 5 |
| 25 | Tokenization, pretraining, scaling, fine-tuning, alignment | 17 | 14 | teach fully | 5 |
| 26 | Inference and serving | 18 | 10 | teach fully | 5 |
| 27 | Generative models: VAEs and diffusion | 20 | 8 | teach fully | 5 |
| 28 | Reinforcement learning | 23 | 20 | teach fully | 6 Control, RL and the capstones |
| 29 | Control, physics-informed ML and digital twins | 24b | 16 | teach fully | 6 |
| 30 | Scaling and performance | 29 | 8 | teach fully | 6 |
| 31 | Responsible AI | 30 | 6 | deepen | 6 |
| C1 | Capstone 1: cooling and energy intelligence | n/a | 45 | n/a | 6 |
| C2 | Capstone 2: AI-native fault diagnostician | n/a | 35 | n/a | 6 |

---

### Phase 1: Foundations (Nov 16 – Dec 17)

**0 · Induction (2 h)**
1. Welcome to Kestrel Ridge: how the course works (daily sessions, mastery gates, reviews) and the story.
2. The data hall in one picture: power chain and cooling chain, heat from chip to atmosphere, PUE and WUE.
3. Hands on the controls: tune supply-air temperature, fan speed and chilled-water setpoint by hand in the Control Room. Your manual score becomes the baseline your RL agent must beat in August.
4. Placement diagnostic: short checks in Python, linear algebra, calculus and probability that set up your test-outs.

**1 · Python for ML engineering (12 h · deepen)**
1. NumPy's mental model: memory layout, dtypes, strides, views vs copies.
2. Vectorization and broadcasting: shape algebra, `einsum`, replacing loops, and the classic broadcasting bugs.
3. Numerical hygiene and performance: floating point, cancellation, log-sum-exp and stable softmax; profiling (timeit, cProfile, memory).
4. SQL for ML engineers with DuckDB: joins, window functions, as-of joins on telemetry, Parquet.
5. DataFrames: Polars lazy expressions vs pandas vs DuckDB and when each wins; resampling sensor data.
6. ML code as software: functions vs classes, dataclasses, protocols, type hints, the fit/predict/transform contract, seeded RNGs.
7. Testing and tooling: pytest (fixtures, parametrize, tolerances), property-based tests (Hypothesis), uv projects and lockfiles, ruff.

- *From scratch → library:* vectorized pairwise distances, standardization and softmax vs SciPy; a tiny estimator class that honours scikit-learn's API contract.
- *Build:* **Telemetry toolkit**, a typed, tested package that:
  - loads simulator telemetry from Parquet;
  - cleans gaps, stuck sensors and unit mix-ups;
  - computes interval PUE;
  - exposes a CLI.

  It is a local uv project; its core functions are graded in the browser.
- *Facility:* unlocks the Ops Console. Incident: "the PUE dashboard is wrong" (W vs kW, plus a timezone join bug).

**2 · Linear algebra for ML (12 h · teach fully)**
1. Vectors and geometry: dot products, norms, projections, cosine similarity (a preview of embeddings).
2. Matrices as linear maps: composition, rank, column and null spaces, solving Ax = b, condition numbers.
3. Least squares as orthogonal projection; normal equations vs QR; why you never invert XᵀX.
4. Eigendecomposition: linear dynamics x₍ₖ₊₁₎ = A x₍ₖ₎, stability, quadratic forms, positive definiteness.
5. The SVD: rotate–stretch–rotate, low-rank approximation (Eckart–Young), the pseudoinverse.
6. PCA and POD of a temperature field: the dominant thermal modes of the data hall.
7. Matrix calculus essentials: gradients of quadratic forms and least squares (handoff to Module 3).

- *From scratch → library:* Gram–Schmidt/QR, least squares via QR, power iteration, truncated SVD vs `numpy.linalg`/`scipy.linalg`.
- *Build:* **Sensor field reconstruction**: POD of rack-inlet temperature fields, used to reconstruct three failed sensors from the others.
- *Bridges:* vibration modes and modal analysis; the eigenvalues of an RC thermal network are its time constants; POD in fluid mechanics.

**3 · Calculus and continuous optimization (10 h · deepen)**
1. Gradients, Jacobians and Hessians for ML; matrix-calculus rules; finite-difference gradient checks and their error.
2. The chain rule as a computational graph; forward vs reverse mode (autograd preview).
3. Convexity, smoothness and step sizes; what conditioning does to convergence.
4. Gradient descent and family: momentum (a damped mass–spring), Nesterov, RMSProp, Adam.
5. Newton and quasi-Newton (BFGS/L-BFGS), line search; when second-order pays.
6. Constrained optimization: Lagrange multipliers, KKT conditions, duality, projected gradient.
7. Feedback as iteration: a discrete-time PI controller for supply-air temperature, its stability via eigenvalues, and anti-windup.

- *From scratch → library:* gradient checker, GD/momentum/Adam optimizers, projected gradient vs `scipy.optimize.minimize`.
- *Build:* **Your first controller**, a PI loop plus economizer logic for the simulator, scored against your manual tuning (simulator arc, step 2). Also fit a chiller power curve by least squares.
- *Bridges:* Jacobi, Gauss–Seidel, conjugate gradients and preconditioning from numerical methods; heavy-ball momentum as a damped oscillator.
- *Incident:* "oscillating CRAH valve".

**4 · Probability and statistics (10 h · accelerate)**: starts with a test-out (MDS 551/552 covered the basics in R)
1. Probability by simulation in NumPy: generators, LLN, CLT, and the distributions engineers meet (Gaussian, Poisson, exponential, Weibull).
2. Multivariate Gaussians and covariance geometry; Mahalanobis distance.
3. Maximum likelihood: derivations, MLE equals least squares under Gaussian noise, Fisher information and standard errors.
4. Bayes and MAP: conjugate updates, MAP as regularization, posterior predictive.
5. State estimation: the Kalman filter as Bayesian updating, 1-D then n-D, fusing redundant sensors.
6. Uncertainty for ML engineers: bootstrap CIs on metrics, paired comparisons, multiple testing, power (Python versions of the R material).

- *From scratch → library:* MLE fitters, Kalman filter, bootstrap vs `scipy.stats`/statsmodels.
- *Build:* **Sensor truth**, a Kalman filter that fuses two sensors with a thermal model and flags a drifting sensor from its innovation statistics.
- *Bridges:* lab error propagation; Weibull reliability; Kalman filtering from controls.
- *Incident:* "two sensors disagree".
- *Causal hook:* Simpson's paradox in fleet failure rates (prediction vs explanation).

**5 · Information theory (4 h · teach fully)**
1. Entropy as surprise and compression.
2. Cross-entropy and KL divergence: why cross-entropy is the classification loss; forward vs reverse KL.
3. Mutual information and perplexity: information gain for trees, perplexity for language models.

- *Build:* rank fault-predictive features by mutual information; compute the perplexity of a character n-gram model of maintenance logs.

### Phase 2: Classical ML (Dec 14 – Jan 26)

**6 · Linear and logistic regression from scratch (14 h · deepen)**
1. Linear regression three ways: QR closed form, gradient descent, maximum likelihood; statsmodels as the Python twin of DSCI 561's R output.
2. Minimum viable evaluation: an honest split, one leakage check and one metric, so every model from here on is judged fairly. Module 7 goes deep.
3. Features and basis expansions: polynomials, splines, interactions, physically motivated features (dimensionless groups).
4. Regularization: ridge as Tikhonov damping, lasso by coordinate descent, elastic net, regularization paths, the MAP view.
5. Bias–variance: the decomposition derived and simulated; a double-descent teaser.
6. Logistic regression: Bernoulli likelihood, gradient and Newton/IRLS, softmax regression.
7. GLMs in Python: Poisson regression for fault counts, link functions.
8. Diagnostics and numerics: conditioning, standardization, collinearity, residuals, influence.

- *From scratch → library:* OLS (QR), ridge, lasso (coordinate descent), logistic (GD and Newton), softmax vs scikit-learn and statsmodels.
- *Build:* **Chiller power model**, a regression of chiller kW on lift, part-load ratio and wet-bulb, plus a logistic model of inlet-temperature excursions.
- *Incident:* "the model says chillers use less power at higher load" (collinearity and confounding).
- *Causal hook:* coefficients are not effects. This plants confounding and bad controls ahead of Module 19.

**7 · Model evaluation (8 h · accelerate)**: test-out first
1. Splitting for the question you are asking: k-fold, grouped, rolling-origin time-series CV, nested CV, optimization bias.
2. Metrics from costs: regression-metric traps (MAPE), ROC vs PR, choosing thresholds from the cost of a missed fault vs a false alarm.
3. Calibration and proper scoring rules: reliability diagrams, Brier and log score, Platt and isotonic from scratch.
4. Leakage: a taxonomy (target, temporal, preprocessing, group, duplicate) and hands-on leakage hunts.
5. Imbalance and rare events: base rates; resampling vs weighting vs thresholds.
6. Comparing models honestly: paired bootstrap, McNemar's test, multiple comparisons, reporting uncertainty.

- *Build:* **Evaluation harness**, a reusable, tested module used by every later project.
- *Incident:* "the 99%-accurate fault detector".
- *Causal hook:* temporal leakage as a violation of time order.

**8 · Feature engineering and data pipelines (10 h · deepen)**
1. Features for sensor and time data: lags, rolling windows, calendar and Fourier terms, physics-derived features (ΔT, approach, lift, part-load ratio).
2. Missing and bad data: gaps, stuck-at values and spikes, imputation without leakage, data validation checks.
3. scikit-learn Pipelines and ColumnTransformer in depth; custom transformers.
4. Point-in-time correctness: as-of joins of weather *forecasts* vs actuals (DuckDB `ASOF JOIN`), training/serving consistency.
5. Production pipelines: idempotent batch ETL over partitioned Parquet with DuckDB/Polars, incremental updates, schema evolution, feature-store concepts.

- *Build:* **Energy Desk feature pipeline**: raw telemetry → validated, point-in-time-correct features → model-ready Parquet, with tests. It feeds the boosting forecaster in Module 9 and P1.
- *Why before boosting:* leakage-proof pipelines become a habit before the most powerful tabular models arrive.
- *Causal hook:* features that are consequences of the target leak.

**9 · Trees, random forests and gradient boosting (14 h · deepen)**
1. Decision trees from scratch: impurity (entropy from Module 5), vectorized split search, regression trees, pruning.
2. Bagging and random forests: variance reduction, OOB error, impurity vs permutation importance and their biases.
3. Gradient boosting as functional gradient descent: squared and log loss, shrinkage, subsampling.
4. Inside XGBoost: second-order boosting, the regularized objective and gain formula, histogram/quantile split finding, sparsity-aware splits.
5. Inside LightGBM and CatBoost: histogram binning, leaf-wise growth, GOSS, EFB; ordered target statistics and the leakage they prevent.
6. Practice: tuning, early stopping, monotonic constraints for physical consistency, quantile objectives, TreeSHAP.

- *From scratch → library:* CART, random forest, and a mini second-order histogram GBM, compared with scikit-learn's HistGradientBoosting, XGBoost and LightGBM, all in the browser.
- *Build:* **Cooling load forecaster v1**, a day-ahead GBM on your Module 8 feature pipeline, with monotonic constraints and quantile intervals (simulator arc, step 3).
- *Incident:* "feature importance says hour-of-day causes failures".

**10 · Unsupervised learning (11 h · deepen)**
1. k-means from scratch: Lloyd's algorithm, k-means++, failure modes.
2. Density and hierarchy: DBSCAN/HDBSCAN and hierarchical clustering for discovering plant operating modes.
3. PCA in depth: variance maximization equals the SVD, choosing components, whitening, process monitoring with T² and SPE statistics.
4. Gaussian mixtures and EM: derive and implement; EM as coordinate ascent on a lower bound (VAE preview).
5. Nonlinear embeddings: kernel PCA, t-SNE, UMAP, and how they mislead.
6. Matrix factorization and NMF, briefly.

- *From scratch → library:* k-means++, PCA, GMM-EM, DBSCAN vs scikit-learn.
- *Build:* **Operating modes + PCA monitor**: cluster economizer vs mechanical-cooling regimes, then catch an injected coil-fouling fault with T²/SPE (simulator arc, step 4, your first fault detector).

**P1 · Energy Desk forecaster → Milestone M1** (details in section 5)

### Phase 3: Forecasting, optimization and the deep-learning core (Jan 25 – Mar 22)

**11 · Autograd engine from scratch (14 h · teach fully)**
1. Reverse-mode automatic differentiation on paper: computational graphs, local derivatives, topological order.
2. A scalar autograd engine: a value type, operators and `backward`, checked against finite differences.
3. Tensor autograd on NumPy: broadcasting-aware gradients (sum-to-shape), matmul backward.
4. A neural-network library on top: modules, parameters, linear layers, activations, MSE and numerically stable cross-entropy.
5. Training loops: mini-batch SGD; MLPs for 2-D classification and for predicting rack inlet temperatures.
6. Testing an autograd engine: property tests against numerical gradients; agreement with PyTorch (local).

- *Build:* **your own tensor library**, plus a neural surrogate that emulates the simulator one step ahead (a digital-twin preview). Runs entirely in the browser.

**12 · Training deep networks (13 h · deepen)**
1. Initialization: variance propagation (Xavier/He) and what breaks without it.
2. Optimizers in depth: SGD with momentum, Adam/AdamW and decoupled weight decay, the LR range test.
3. Normalization: BatchNorm and its train/eval trap, LayerNorm, RMSNorm.
4. Regularization: weight decay, dropout from scratch, augmentation, early stopping.
5. Learning-rate schedules: warmup, cosine, one-cycle.
6. Debugging training runs: overfit one batch, loss-at-init sanity checks, gradient norms, NaN hunts, a gallery of loss-curve pathologies.
7. Residual connections and depth.

- *Build:* **Training doctor**: diagnose and fix eight broken training runs and write the incident report. Everything is built inside your own engine.
- *Bridges:* normalization as nondimensionalization; warmup and annealing as solver relaxation factors.

**13 · PyTorch fluency (10 h · deepen · local)**
1. From your engine to `torch`: tensors, autograd, `no_grad`/`detach`, in-place pitfalls, devices (CPU, Apple MPS, CUDA).
2. `nn.Module`, `state_dict`, hooks, custom layers and initialization.
3. Data: `Dataset`/`DataLoader`, collate functions, workers, windowed sequence datasets from Parquet telemetry.
4. The training loop done right: train/eval modes, clipping, checkpoint and resume, determinism and seeding.
5. Performance and resource accounting: memory for parameters, gradients, optimizer state and activations; FLOPs ≈ 6·N·D; asynchronous execution and correct timing; mixed precision (bf16/fp16, GradScaler); `torch.compile`; the profiler.
6. Experiment tracking: MLflow locally, configs, reproducible runs.

- *Build:* **Thermal surrogate in PyTorch**:
  1. Port your Module 11 surrogate.
  2. Prove numerical agreement with your engine from identical weights.
  3. Train it fast with AMP and tracking.

**14 · Time series and probabilistic forecasting (22 h · deepen · in step with DSCI 574)**
1. Anatomy: trend, seasonality, autocorrelation, stationarity, STL; data-center load patterns.
2. Baselines and exponential smoothing: naive, seasonal-naive, ETS from scratch.
3. ARIMA and state space: AR by least squares, SARIMA in statsmodels, the Kalman filter for local-level models.
4. Backtesting done right: rolling origin, horizon-wise metrics, MASE, leakage traps, hierarchical reconciliation (campus → hall → rack).
5. ML forecasters: GBM with lags, direct vs recursive multi-step, global models, exogenous *forecasts* not actuals.
6. Deep forecasters: MLP/N-BEATS-style models, then a first sequence model: an RNN as a nonlinear state-space model (a learnable cousin of your Kalman filter) and dilated causal convolutions; when deep learning wins and when it doesn't (M4/M5 evidence). Module 23 revisits sequence models in depth.
7. Probabilistic forecasting: quantile regression, pinball loss, CRPS, conformal intervals, interval calibration.
8. Foundation models and forecasting for decisions: Chronos/TimesFM zero-shot vs tuned baselines (with a pretraining-leakage check); grid carbon-intensity and price forecasts for load shifting.

- *From scratch → library:* ETS, AR, Kalman local-level, a quantile-GBM objective and split conformal, compared with statsforecast, statsmodels, LightGBM and neuralforecast (local).
- *Build:* **Grid Desk**: probabilistic day-ahead forecasts of IT load, cooling load and grid carbon intensity (public EIA-930 data), with a backtest and calibration report.

**15 · Optimization and operations research (14 h · teach fully)**
1. Modeling with LP: variables, constraints and objectives for energy and capacity problems; geometry and the simplex idea.
2. Duality and shadow prices: what a binding constraint is worth.
3. Integer programming: MILP modeling tricks (on/off, big-M, minimum run times), branch-and-bound intuition, chiller staging.
4. Solvers in practice: HiGHS (in the browser) and OR-Tools; formulation quality, scaling, infeasibility debugging.
5. Optimization under uncertainty: scenario-based two-stage stochastic programs, chance constraints, robust optimization basics.
6. Convex optimization and QPs: modeling patterns, Clarabel/OSQP (sets up MPC later).

- *From scratch → library:* a dense simplex for small LPs vs HiGHS, `scipy.optimize.linprog` and OR-Tools.
- *Build:* **Plant scheduler**: day-ahead chiller staging plus thermal-storage/battery dispatch as a MILP under time-varying prices and carbon, driven by your forecasts (simulator arc, step 5).

**16 · SVMs, kernels and k-NN (5 h · accelerate)**: test-out first
1. k-NN and the curse of dimensionality; KD-trees and approximate nearest neighbours (vector search preview).
2. Max-margin classification: hinge loss, the dual via KKT, support vectors.
3. Kernels: the kernel trick, RBF intuition, kernel ridge regression from scratch, and the bridge to Gaussian processes.

- *Build:* kernel ridge vs GBM on chiller curves; k-NN distance as an anomaly score.
- *Placement:* this sits directly before Module 17 so kernels flow straight into Gaussian processes.

**17 · Bayesian methods and uncertainty quantification (10 h · accelerate · in step with DSCI 553)**: test-out first
1. The Bayesian workflow in Python (PyMC/NumPyro): priors, posterior predictive checks, diagnostics (Python twin of 553).
2. Inference from scratch: Metropolis–Hastings, HMC intuition, variational inference and the ELBO.
3. Gaussian processes from scratch: kernels and marginal likelihood; GP calibration of a sensor.
4. Uncertainty for ML models: deep ensembles, MC dropout, quantile heads, calibration, conformal prediction (split, CQR, time-series variants).
5. Decisions under uncertainty: expected cost, CVaR, value of information; Bayesian optimization of a setpoint.

- *Build:* **Bayesian setpoint tuner**: GP-based Bayesian optimization of the chilled-water setpoint, plus calibrated intervals on your forecasts.

**P2 · Capacity and power planner → Milestone M2**

### Phase 4: Reliability, LLM systems and production (Mar 22 – May 15)

**18 · Anomaly detection and fault diagnosis (16 h · teach fully)**
1. The problem: anomaly types, base rates, label scarcity; why many benchmarks and point-adjusted scores mislead.
2. Statistical process control and change points: Shewhart, CUSUM, EWMA; model residuals as signals.
3. ML detectors: Isolation Forest from scratch, LOF, one-class SVM, PCA T²/SPE, autoencoders.
4. Physics- and rule-based FDD: APAR-style rules, energy-balance checks, analytical redundancy, sensor validation (bias, drift, stuck-at).
5. Diagnosis: fault classification with scarce labels, fault signatures, contribution analysis and root-cause isolation.
6. Running alerting systems: event-level metrics, alert fatigue, thresholds from costs, feedback loops, drift of "normal".

- *Build:* **Fault Detection Center**:
  - detect and diagnose injected simulator faults (chiller degradation, fouled coil, stuck valve, drifting sensor);
  - validate on LBNL's labeled HVAC fault data using event-level metrics.

**19 · Causal inference (8 h · deepen · in step with DSCI 554)**
1. Potential outcomes and DAGs: confounders, colliders, the backdoor criterion.
2. Estimation: regression adjustment, propensity scores/IPW, doubly robust estimators; DoWhy/EconML.
3. Quasi-experiments for operations: difference-in-differences, synthetic control, interrupted time series; energy measurement-and-verification baselines.
4. Experiments on physical systems: switchback designs for control policies, heterogeneous effects.

- *Build:* **Did the retrofit save energy?** Estimate savings from a simulated retrofit confounded by weather and load growth, and compare with the naive before/after.

**20 · Building with LLMs (20 h · teach fully)**
1. LLMs as components: tokens, context, sampling, cost, latency; the Messages API, streaming and prompt caching (Python and TypeScript).
2. Evals first: error analysis on traces, a 20–50-task golden set, binary judgments, LLM-as-judge validated against your own labels, regression tests, tracing, cost tracking. Everything after this lesson is built eval-first.
3. Structured outputs and tool use: schemas, validation, retries; extracting structured fault records from maintenance logs.
4. Embeddings and vector search: chunking, ANN indexes (HNSW intuition), hybrid BM25 + vector search, reranking; a vector index from scratch, then a library.
5. RAG: retrieval metrics (recall@k, MRR), grounding and citations, failure analysis; RAG over equipment manuals and SOPs.
6. Agents and MCP: the agent loop, tools, planning, memory, error recovery; when a workflow beats an agent; an MCP server over facility telemetry, built to the current (2026-07-28) stateless MCP spec.
7. Safety for operations: prompt injection through retrieved documents and logs, guardrails, human approval for actions on physical plant.

- *Build:* **Ops Copilot v0**, a RAG + tools assistant over manuals and live simulator telemetry, with a 50-question eval harness.

**21 · ML system design (10 h · teach fully)**
1. Framing: from operational problem to ML problem; requirements (latency, freshness, cost); baselines and non-ML options.
2. Data and features at scale: logging, labeling, feature stores, training–serving skew.
3. Training and evaluation infrastructure: offline/online evaluation, registries, reproducibility.
4. Serving patterns: batch, online, streaming; on-prem edge controllers vs cloud; latency budgets; safe fallbacks.
5. Monitoring and drift: data vs concept drift, detection (PSI, KS, MMD), delayed labels, retraining policies.
6. Design reviews: four data-center case studies (cooling optimization, fleet failure prediction, capacity forecasting, carbon-aware scheduling). Write design docs and critique them, including AI-generated ones.

- *Build:* the design doc for Capstone 1.

**22 · MLOps and cloud ML (18 h · deepen)**
1. MLOps maturity as the scaffold (level 0 manual → level 1 continuous training → level 2 CI/CD); experiment tracking, model registry and lineage (MLflow).
2. Data versioning and orchestration concepts (DVC-style versioning; Prefect/Airflow/Dagster patterns); data validation in pipelines.
3. Containers for ML: Docker multi-stage builds, slim images, reproducibility.
4. CI/CD for ML: GitHub Actions, the ML testing pyramid, model-quality gates, shadow and canary releases.
5. Serving: FastAPI/BentoML-style services, batch inference jobs, ONNX export, load testing.
6. Production monitoring: metrics, logs, traces, drift dashboards, alerting, ML incident response.
7. Cloud ML platforms: AWS (S3, SageMaker training/endpoints/pipelines/monitoring, Bedrock) and Azure (Azure ML, managed endpoints, AI Foundry) mapped to the concepts; one guarded free-tier deployment with a teardown script.

- *Build:* **Platform team**: take the Grid Desk forecaster to production grade:
  - containerized training and serving;
  - CI quality gates;
  - a model registry;
  - monitoring with drift-triggered retraining.

**P3 · Reliability platform → Milestone M3**

### Phase 5: Deep-learning depth and LLM internals (May 10 – Jun 30)

**23 · CNNs, RNNs and attention (14 h · deepen)**
1. Convolution from scratch: 1-D and 2-D, padding/stride/dilation, receptive fields, backward pass; 1-D convs on sensor signals.
2. CNN architectures and transfer learning: residual networks; thermal-image hot-spot detection (local).
3. RNNs as nonlinear state-space models; backpropagation through time; vanishing gradients.
4. LSTMs and GRUs from scratch; sequence forecasting.
5. Attention: alignment, scaled dot-product attention, attention as a soft lookup.
6. Temporal convolutions vs RNNs vs attention for time series.

- *Build:* **Hot spots and inlet forecasts**: a CNN on synthetic thermal images and an LSTM inlet-temperature forecaster.

**24 · Transformers from scratch and a small language model (18 h · teach fully)**
1. Embeddings and positional information: sinusoidal, learned, RoPE.
2. Multi-head causal self-attention from scratch; shapes and cost.
3. The transformer block and the residual stream: pre-norm, MLP, LayerNorm/RMSNorm.
4. A GPT-style decoder: forward pass in NumPy (in-browser), then training in PyTorch (local).
5. Training a small LM on a synthetic facility-log corpus: data pipeline, tokenizer, sampling (temperature, top-k, top-p).
6. Evaluation and inspection: perplexity, attention maps, small scaling experiments.
7. Encoders, decoders and transformers for sensor data (patching).

- *Build:* **OpsGPT-mini**, a roughly 10M-parameter transformer trained locally, with ablations.

**25 · Tokenization, pretraining, scaling, fine-tuning and alignment (14 h · teach fully)**
1. Tokenization: byte-level BPE from scratch, tiktoken, failure modes (numbers, sensor IDs).
2. Pretraining: objectives, data mixtures, deduplication and filtering, compute accounting (≈6ND FLOPs).
3. Scaling laws: Kaplan vs Chinchilla; fit a scaling law to your own small runs.
4. Fine-tuning: full vs parameter-efficient; LoRA derived and implemented on your model; QLoRA concepts.
5. Policy-gradient primer: the bandit framing, REINFORCE with a baseline, and a KL penalty to a reference policy. RLHF and DPO need this before Module 28 covers RL properly.
6. Alignment: reward models, RLHF with PPO and a KL penalty, DPO derived from Bradley–Terry, AI-feedback methods, evaluating tuned models.
7. Practical fine-tuning with Hugging Face (local/Colab).

- *Build:* LoRA fine-tune of a small open model for structured fault-report extraction, compared with prompting a frontier model on quality and cost.

**26 · Inference and serving (10 h · teach fully)**
1. The cost of decoding: prefill vs decode, memory- vs compute-bound, the roofline model.
2. The KV cache: implement it in your model; memory math.
3. Batching and scheduling: static vs continuous batching, paged KV memory, throughput vs latency, Little's law.
4. Quantization: int8/int4, scales and zero-points, GPTQ/AWQ ideas; measuring the perplexity cost.
5. Speculative decoding, distillation, IO-aware attention (the FlashAttention idea).
6. Serving economics and energy: SLOs, cost per million tokens, GPU sizing, energy and water per token at a real PUE.

- *Build:* an inference benchmark of your model, with and without the KV cache and quantization, plus an energy-per-token estimate for the campus AI pod. The Azure public LLM inference traces drive the workload.

**27 · Generative models: VAEs and diffusion (8 h · teach fully)**
1. Latent-variable models and VAEs: the ELBO from EM, the reparameterization trick, VAE anomaly scores for sensors.
2. Diffusion: forward noising, the denoising objective, score intuition; a tiny 2-D diffusion model in the browser.
3. Generative models for engineering: synthetic rare-fault data, weather scenarios, evaluating generated data.

- *Build:* **Synthetic fault generator**: train on synthetic data, test on held-out simulated faults.

**→ Milestone M4**

### Phase 6: Control, RL and the capstones (Jun 28 – Sep 4, buffer to Oct 3)

**28 · Reinforcement learning (20 h · teach fully)**
1. Bandits: ε-greedy, UCB, Thompson sampling; bandits vs A/B tests for setpoint trials.
2. MDPs and dynamic programming: Bellman equations, value and policy iteration.
3. Model-free learning: Monte Carlo, TD, SARSA, Q-learning from scratch, learning live in the browser.
4. Function approximation and DQN: replay, target networks, the deadly triad.
5. Policy gradients: REINFORCE, baselines, actor–critic, GAE.
6. PPO: the clipped objective and the implementation details that matter; training on the simulator (local, Gymnasium; in the browser a lightweight environment class stands in, since Gymnasium does not run in Pyodide). Revisit RL post-training of LLMs as an application.
7. RL in the physical world: reward design, constraints and safety layers, sim-to-real, offline RL, fair evaluation; lessons from the DeepMind, Trane and Meta cooling work.

- *Build:* a PPO agent on the simulator, compared fairly with your PI controller.

**29 · Control, physics-informed ML and digital twins (16 h · teach fully)**
1. System identification: grey-box RC thermal models fitted to simulator data; linearization and state-space form.
2. From PID to LQR to MPC: the receding horizon, constraints, MPC as a QP.
3. Economic MPC for cooling: forecasts, prices and carbon, ASHRAE limits, robustness to forecast error.
4. Physics-informed ML: PINNs on the 1-D heat equation, physics-constrained networks, hybrid physics + ML residual models, neural ODEs, SINDy.
5. Digital twins: definitions and calibration, surrogates inside MPC; RL for control vs MPC with safety layers.

- *Build:* **Plant Control Room**: economic MPC for the simulator, compared with PI and PPO (simulator arc, steps 6–7).
- *Runs mostly in the browser:* CVXPY (with Clarabel), CasADi, python-control and PySINDy all loaded in Pyodide during research. PINNs and IPOPT-based nonlinear MPC run locally.

**30 · Scaling and performance (8 h · teach fully)**
1. Profiling and bottlenecks: data loading vs compute, GPU utilization, file formats and throughput math.
2. Distributed training: data parallelism and all-reduce, tensor/pipeline parallelism, ZeRO/FSDP, gradient accumulation, communication cost.
3. Efficient training: mixed precision, activation checkpointing, compilation, efficient attention.
4. Scaling data work: Spark/Ray/Dask concepts vs DuckDB/Polars scale-up; when to drop to compiled code (Numba, C++ extensions).
5. The physical side: power and cooling of AI training clusters, power capping, grid interaction.

- *Build:* two-process DDP training of your transformer with a profiling report (local/Colab).

**31 · Responsible AI (6 h · deepen)**
1. Harms where infrastructure ML touches people: grid, water and community impacts; fairness definitions and their tradeoffs.
2. Robustness and failure modes: distribution shift, specification gaming in RL, Goodhart's law in PUE optimization, fail-safe design and human oversight for control.
3. Documentation and governance: model cards, datasheets, risk assessments, postmortems; the energy, water and carbon footprint of ML itself.

- *Build:* model card and risk assessment for your Capstone 1 controller, plus a footprint estimate of your own training runs.

**C1 · Capstone 1 → Milestone M5 · C2 · Capstone 2 → Milestone M6** (section 5)

## 5. Projects

Three layers. Every module ends with a **build** (2–4 h; listed per module in section 4). Each milestone has a **milestone project** (about 12 h). The course ends with **two capstones**.

Every milestone project and capstone is its own repo, created from a template:
- `uv` environment and lockfile;
- `src/` package with type hints and pytest suite;
- CI;
- `Makefile`/`justfile` entry points;
- data-download scripts that respect licenses;
- `post/` folder with a Quarto `.qmd` draft, so the write-up drops straight into colbyy03.github.io.

### Rubric (all projects)

| Criterion | What "excellent" looks like |
|---|---|
| Problem framing | Decision-relevant metric chosen from operational costs; baselines first |
| Rigor | Leak-free splits, backtests or simulation scenarios, uncertainty on every headline number |
| Engineering | Typed, tested, reproducible (`make all` from a clean clone), small focused modules |
| Domain insight | Physically sensible features, constraints and failure analysis |
| Communication | A one-page decision memo for a non-ML stakeholder, plus the technical post |
| AI-native practice | A short log of where coding agents helped, what you verified by hand, and what they got wrong |

### Milestone projects

**P1: Energy Desk forecaster** (end of January)
- Day-ahead forecasts of IT load, cooling power and PUE for the simulated campus, with quantile intervals.
- Generalization check on real buildings from the Building Data Genome 2 dataset (CC BY 4.0).
- Seasonal-naive and linear baselines, then gradient boosting with physically motivated features (lift, part-load ratio, wet-bulb).
- Your reusable leakage-safe evaluation harness; a model card.
- Post: *forecasting a data center's energy without fooling yourself*.

**P2: Capacity and power planner** (late March)
- Probabilistic forecasts of data-center power using Google's public PowerData2019 traces (CC-BY 4.0).
- Fed into a stochastic optimization: chance-constrained power allocation across power domains, or chiller staging plus energy procurement under price uncertainty.
- Calibrated intervals (quantile and conformal); scenario analysis.
- A decision memo explaining the risk/efficiency tradeoff.
- This is the skill mix the Meta demand-forecasting and Amazon capacity/CloudTune postings describe.

**P3: Reliability platform** (mid-May)
- A fault detection and diagnosis service: residual, PCA and Isolation Forest detectors plus rule-based diagnosis.
- Tested on simulator faults and the LBNL labeled HVAC fault data.
- Packaged and deployed like production: Docker, CI with quality gates, MLflow registry, monitoring with drift checks.
- Includes a small LLM "explain this alert" assistant that uses RAG over SOPs, with its own eval set.

### Capstones

**Capstone 1: Cooling and energy intelligence for Kestrel Ridge** (target mid-August)
- **Pipeline:** probabilistic forecasting of load and weather, then anomaly detection and diagnosis, then control. Control means a physics-aware economic MPC *and* a PPO agent with a safety layer.
- **Evaluation:** in the simulator across held-out scenarios (heat wave, chiller trip, drifting sensor, demand-response event). Compared against your week-1 manual tuning, your PI controller, and each other on these KPIs:
  - energy;
  - cost;
  - carbon;
  - water;
  - ASHRAE inlet-envelope violations.
- **Also included:**
  - a switchback-style evaluation of the controller change;
  - a system design doc covering data, serving, monitoring, fallbacks and human oversight;
  - a model card and risk assessment;
  - an honest sim-to-real section.
- **Outputs:** a portfolio repo and a long-form post.

**Capstone 2: AI-native fault diagnostician** (target early September)
- **Agent:** an LLM agent that diagnoses facility faults. It works from sensor data (exposed through an MCP server over the simulator and telemetry database) and maintenance logs. The logs are synthetic but realistically messy: abbreviations, missing fields, some wrong technician diagnoses.
- **Behaviour:** proposes next actions with evidence and citations; actions on the plant need human approval.
- **Evaluation harness:**
  - a golden incident set generated from injected faults;
  - retrieval metrics;
  - an LLM-as-judge rubric calibrated against your own labels;
  - cost and latency tracking;
  - prompt-injection tests hidden in logs.
- **Ablations:** rules-only vs ML FDD vs LLM agent vs hybrid.
- **Outputs:** a portfolio repo and post.

Both capstones reuse code from earlier builds, so by September you have one coherent body of work rather than disconnected exercises.

## 6. Timeline (week by week, Nov 16, 2026 – Oct 3, 2027)

The table below is generated by `planning/build_schedule.py` from:
- `planning/calendar.json`: MDS periods, holidays and your time budget;
- `planning/curriculum.json`: study order and hour estimates.

It fills each week's available hours with modules in order, adding 10% for spaced-repetition reviews.

In the app the same logic runs live, so the plan re-flows whenever you:
- change the time budget;
- edit the MDS dates;
- move ahead or behind.

Milestone countdowns show the target date and your projected date side by side.

**Start date.** The schedule starts Monday Nov 16. Study begins as soon as the first app release ships (shell, code runners, Induction and Module 1); the schedule then re-flows from your actual start date. The buffer absorbs a one-week slip, at a cost of about 11 hours.

Default time budget (configurable):

| Period | Weekdays | Weekend days | Typical week |
|---|---|---|---|
| MDS teaching weeks | 75 min | 2.5 h | 11.25 h |
| Block week 5 (no lectures or labs) | 2.5 h | 2.5 h | 17.5 h |
| Breaks (winter, February) | 3 h | 2.5 h | 20 h (less over the holidays) |
| MDS capstone (Apr 26 – Jun 24) | 1 h | 2.5 h | 10 h |
| After MDS (Jun 25 – Oct 3) | 2 h | 2.5 h | 15 h |

Totals: **609 h available**, **547 h planned** (496 h of modules and projects plus reviews), **about 62 h of buffer**, which sits in September.

| Wk | Dates | MDS context | Hours | Focus (hours) |
|---|---|---|---|---|
| 1 | Nov 16-Nov 22 | B 3 (513, 522, 561, 573) | 11.2 | Induction: first week at the facility (2.2); Python for ML engineering (9.1, start) |
| 2 | Nov 23-Nov 29 | B 3 (513, 522, 561, 573) | 11.2 | Python for ML engineering (4.2, finish); Linear algebra for ML (7.1, start) |
| 3 | Nov 30-Dec 6 | B 3 (513, 522, 561, 573) | 11.2 | Linear algebra for ML (6.1, finish); Calculus and continuous optimization (5.1, start) |
| 4 | Dec 7-Dec 13 | B 3 (513, 522, 561, 573) | 11.2 | Calculus and continuous optimization (5.9, finish); Probability and statistics (5.4, start) |
| 5 | Dec 14-Dec 20 | B 3 week 5 / end of Semester 1 (Dec 21) | 17.5 | Probability and statistics (5.6, finish); Information theory (4.4); Linear and logistic regression from scratch (7.5, start) |
| 6 | Dec 21-Dec 27 | B 3 week 5 / end of Semester 1 (Dec 21); Winter break | 13.0 | Linear and logistic regression from scratch (7.9, finish); Model evaluation (5.1, start) |
| 7 | Dec 28-Jan 3 | Winter break | 16.0 | Model evaluation (3.7, finish); Feature engineering and data pipelines (11); Trees, random forests and gradient boosting (1.3, start) |
| 8 | Jan 4-Jan 10 | Winter break; B 4 (524, 541, 562, 572) | 13.0 | Trees, random forests and gradient boosting (13, cont.) |
| 9 | Jan 11-Jan 17 | B 4 (524, 541, 562, 572) | 11.2 | Trees, random forests and gradient boosting (1.1, finish); Unsupervised learning (10.1, start) |
| 10 | Jan 18-Jan 24 | B 4 (524, 541, 562, 572) | 11.2 | Unsupervised learning (2, finish); Milestone project 1: Energy Desk forecaster (9.3, start) |
| 11 | Jan 25-Jan 31 | B 4 (524, 541, 562, 572) | 11.2 | Milestone project 1: Energy Desk forecaster (3.9, finish); Autograd engine from scratch (7.3, start) - **M1 Foundations and classical ML** |
| 12 | Feb 1-Feb 7 | B 4 week 5 | 17.5 | Autograd engine from scratch (8.1, finish); Training deep networks (9.4, start) |
| 13 | Feb 8-Feb 14 | Semester 2 midterm break | 20.0 | Training deep networks (4.9, finish); PyTorch fluency (11); Time series and probabilistic forecasting (4.1, start) |
| 14 | Feb 15-Feb 21 | B 5 (525, 553, 563, 574) | 12.5 | Time series and probabilistic forecasting (12.5, cont.) |
| 15 | Feb 22-Feb 28 | B 5 (525, 553, 563, 574) | 11.2 | Time series and probabilistic forecasting (7.6, finish); Optimization and operations research (3.7, start) |
| 16 | Mar 1-Mar 7 | B 5 (525, 553, 563, 574) | 11.2 | Optimization and operations research (11.2, cont.) |
| 17 | Mar 8-Mar 14 | B 5 (525, 553, 563, 574) | 11.2 | Optimization and operations research (0.5, finish); SVMs, kernels and k-NN (5.5); Bayesian methods and uncertainty quantification (5.3, start) |
| 18 | Mar 15-Mar 21 | B 5 week 5 | 17.5 | Bayesian methods and uncertainty quantification (5.7, finish); Milestone project 2: Capacity and power planner (11.8, start) |
| 19 | Mar 22-Mar 28 | B 6 (532, 542, 554, 575) | 12.5 | Milestone project 2: Capacity and power planner (1.4, finish); Anomaly detection and fault diagnosis (11.1, start) - **M2 Forecasting, optimization and deep-learning core** |
| 20 | Mar 29-Apr 4 | B 6 (532, 542, 554, 575) | 12.5 | Anomaly detection and fault diagnosis (6.5, finish); Causal inference (6, start) |
| 21 | Apr 5-Apr 11 | B 6 (532, 542, 554, 575) | 11.2 | Causal inference (2.8, finish); Building with LLMs (8.4, start) |
| 22 | Apr 12-Apr 18 | B 6 (532, 542, 554, 575) | 11.2 | Building with LLMs (11.2, cont.) |
| 23 | Apr 19-Apr 25 | B 6 week 5 | 17.5 | Building with LLMs (2.3, finish); ML system design (11); MLOps and cloud ML (4.2, start) |
| 24 | Apr 26-May 2 | Capstone DSCI 591 (Apr 26 - Jun 24) | 10.0 | MLOps and cloud ML (10, cont.) |
| 25 | May 3-May 9 | Capstone DSCI 591 (Apr 26 - Jun 24) | 10.0 | MLOps and cloud ML (5.6, finish); Milestone project 3: Reliability platform (4.4, start) |
| 26 | May 10-May 16 | Capstone DSCI 591 (Apr 26 - Jun 24) | 10.0 | Milestone project 3: Reliability platform (8.8, finish); CNNs, RNNs and attention (1.2, start) - **M3 Production ML and LLM systems** |
| 27 | May 17-May 23 | Capstone DSCI 591 (Apr 26 - Jun 24) | 10.0 | CNNs, RNNs and attention (10, cont.) |
| 28 | May 24-May 30 | Capstone DSCI 591 (Apr 26 - Jun 24) | 11.5 | CNNs, RNNs and attention (4.2, finish); Transformers from scratch and a small language model (7.3, start) |
| 29 | May 31-Jun 6 | Capstone DSCI 591 (Apr 26 - Jun 24) | 10.0 | Transformers from scratch and a small language model (10, cont.) |
| 30 | Jun 7-Jun 13 | Capstone DSCI 591 (Apr 26 - Jun 24) | 10.0 | Transformers from scratch and a small language model (2.5, finish); Tokenization, pretraining, scaling, fine-tuning, alignment (7.5, start) |
| 31 | Jun 14-Jun 20 | Capstone DSCI 591 (Apr 26 - Jun 24) | 10.0 | Tokenization, pretraining, scaling, fine-tuning, alignment (7.9, finish); Inference and serving (2.1, start) |
| 32 | Jun 21-Jun 27 | Capstone DSCI 591 (Apr 26 - Jun 24); After MDS | 11.0 | Inference and serving (8.9, finish); Generative models: VAEs and diffusion (2.1, start) |
| 33 | Jun 28-Jul 4 | After MDS | 15.5 | Generative models: VAEs and diffusion (6.7, finish); Reinforcement learning (8.8, start) - **M4 Deep learning and LLM internals** |
| 34 | Jul 5-Jul 11 | After MDS | 15.0 | Reinforcement learning (13.2, finish); Control, physics-informed ML and digital twins (1.8, start) |
| 35 | Jul 12-Jul 18 | After MDS | 15.0 | Control, physics-informed ML and digital twins (15, cont.) |
| 36 | Jul 19-Jul 25 | After MDS | 15.0 | Control, physics-informed ML and digital twins (0.8, finish); Scaling and performance (8.8); Responsible AI (5.4, start) |
| 37 | Jul 26-Aug 1 | After MDS | 15.0 | Responsible AI (1.2, finish); Capstone 1: cooling and energy intelligence (13.8, start) |
| 38 | Aug 2-Aug 8 | After MDS | 15.5 | Capstone 1: cooling and energy intelligence (15.5, cont.) |
| 39 | Aug 9-Aug 15 | After MDS | 15.0 | Capstone 1: cooling and energy intelligence (15, cont.) |
| 40 | Aug 16-Aug 22 | After MDS | 15.0 | Capstone 1: cooling and energy intelligence (5.2, finish); Capstone 2: AI-native fault diagnostician (9.8, start) - **M5 Control, RL and capstone 1** |
| 41 | Aug 23-Aug 29 | After MDS | 15.0 | Capstone 2: AI-native fault diagnostician (15, cont.) |
| 42 | Aug 30-Sep 5 | After MDS | 15.0 | Capstone 2: AI-native fault diagnostician (13.7, finish); buffer (1.3) - **M6 Capstone 2 and full mastery** |
| 43 | Sep 6-Sep 12 | After MDS | 15.5 | buffer (15.5) |
| 44 | Sep 13-Sep 19 | After MDS | 15.0 | buffer (15) |
| 45 | Sep 20-Sep 26 | After MDS | 15.0 | buffer (15) |
| 46 | Sep 27-Oct 3 | After MDS | 15.5 | buffer (15.5) |

## 7. How Hyperscale complements MDS

Source: `research/mds-curriculum.md`. Block dates are partly inferred because the detailed MDS calendar is login-gated. **Please check them against your MDS calendar.** They live in `planning/calendar.json` and in the app's settings, and the schedule re-flows when you edit them.

### 7.1 The pattern

MDS's ML courses are applied, intuition-first scikit-learn and PyTorch work. The research found no from-scratch implementations, no autograd, and backprop only conceptually. Transformers and LLMs get about one or two lectures, in DSCI 575. The statistics half of MDS (551, 552, 553, 561, 562, 554) is taught in R.

So Hyperscale does four things:
1. **Never re-teaches the applied basics MDS already covers.** "Accelerate" modules open with a test-out checkpoint. Pass it and you get only the extension lessons.
2. **Goes underneath MDS topics.** Math, from-scratch NumPy implementations, numerical edge cases, failure modes, and production-grade code ("deepen").
3. **Teaches fully what MDS skips or touches lightly.** Linear algebra, information theory, autograd, transformers and LLMs, inference, RL, optimization/OR, control, anomaly detection, ML system design, scaling.
4. **Translates R material into Python** (statsmodels, SciPy, PyMC/NumPyro, DoWhy/EconML, lifelines). Python is what the target teams use.

### 7.2 Coverage and sync points

| Hyperscale module (study order) | MDS overlap | Mode | Timing relative to MDS |
|---|---|---|---|
| 1 Python for ML engineering | 511, 512, 522, 524 (basics, tests, Make/Docker) | deepen | MDS basics already done (B1–B2); Hyperscale adds NumPy internals, performance, typing, pytest, uv, Polars, DuckDB |
| 2 Linear algebra | matrix notation in 561, PCA use in 563 | teach fully | Concurrent with 561's matrix-form OLS (B3), so the matrix algebra there feels easy |
| 3 Calculus and optimization | 572 GD/SGD (B4) | deepen | Before 572, so 572 becomes reinforcement |
| 4 Probability and statistics | 551, 552 (R, done) | accelerate | Test-out, then MLE/asymptotics, Kalman filter, model comparison in Python |
| 5 Information theory | none | teach fully | n/a |
| 6 Linear and logistic regression | 561, 573 (B3), 571 (B2) | deepen | **Right after 561/573** (B3 week 5 and winter break): Hyperscale derives and implements what 561 interprets in R |
| 7 Model evaluation | 571, 573 | accelerate | Right after 573 covers metrics; Hyperscale adds calibration, leakage taxonomy, time-series CV, model comparison tests |
| 8 Feature engineering and pipelines | 571, 573, 522 | deepen | Adds point-in-time correctness, production pipelines, data validation |
| 9 Trees and boosting | 571, 573 (applied) | deepen | Boosting internals (XGBoost/LightGBM) absent in MDS |
| 10 Unsupervised | 563 (B5, later) | deepen | Hyperscale goes first with from-scratch EM/PCA and process-monitoring statistics; 563 reinforces |
| 11–13 Autograd, training, PyTorch | 572 (B4) | teach fully / deepen | **Overlaps the end of 572**: 572 shows the library, then you build the engine underneath it during B4 week 5 and the February break |
| 14 Time series | 574 (B5) | deepen | **Concurrent with 574** (starts a week earlier, in the February break): adds GBM and deep forecasters, probabilistic forecasting, backtesting at scale |
| 15 Optimization and OR | 512 (DP only) | teach fully | n/a |
| 16 SVMs, kernels, k-NN | 571 (applied, B2) | accelerate | Kernel math, dual, kernel ridge only; placed directly before 17 so kernels flow into Gaussian processes |
| 17 Bayesian and UQ | 553 (B5, R/Stan) | accelerate | **Concurrent with 553**: Python equivalents plus GPs, conformal prediction, deep-learning UQ |
| 18 Anomaly detection and FDD | 574 (change points only) | teach fully | Right after 574 |
| 19 Causal inference | 554 (B6, R) | deepen | **Concurrent with 554**: adds DAGs, quasi-experiments, DoWhy/EconML, energy M&V |
| 20 Building with LLMs | 575 (B6, overview) | teach fully | Concurrent with 575 |
| 21–22 System design, MLOps | 522, 524, 525 | deepen | After the MDS workflow/cloud intro; overlaps your MDS capstone |
| 23–27 DL depth and LLM internals | 572 CNNs, 575 RNNs/transformers | deepen / teach fully | After MDS introduces them (May–June) |
| 28–31 RL, control, scaling, responsible AI | 541 (privacy/ethics), 525 (parallel intro) | teach fully / deepen | Summer, after MDS |

### 7.3 Workload

Blocks are heavy, so teaching weeks default to 75 minutes on weekdays and 2.5 hours on weekend days. Block week 5 and the breaks carry the heavier from-scratch builds, for example:
- gradient boosting from scratch over winter break;
- the autograd engine in the Block 4 week 5 and February midterm break.

During the MDS capstone (Apr 26–Jun 24) the default drops to 10 hours a week.

## 8. App architecture

### 8.1 Stack and why

| Concern | Choice | Why this and not the alternative |
|---|---|---|
| App framework | **Vite + React 19 + TypeScript (strict)**, single-page app | Builds to static files, so it deploys to GitHub Pages with no server. React's ecosystem covers everything this app needs (MDX, CodeMirror, D3, Dexie) and its declarative model is close to SwiftUI, which you already know. Astro is better for mostly-static content sites, but this app is stateful and interactive on every screen. Next.js adds server features we would never use. SvelteKit is lighter but has a thinner ecosystem for editors and MDX tooling. |
| Routing | React Router 7 (SPA mode) with `basename=/hyperscale/` and a `404.html` copy of `index.html` | Clean URLs on GitHub Pages; the service worker serves the app shell offline. |
| Styling | Tailwind CSS 4 plus a small token layer (CSS variables) | Fast to build a consistent, polished dark UI. Thermal colour semantics (cool teal to hot amber) live in tokens. |
| Lessons | **MDX** compiled at build time (`@mdx-js/rollup`), math pre-rendered with KaTeX (`remark-math` + `rehype-katex`) | Prose stays readable as Markdown; interactive blocks are React components dropped inline (`<Predict>`, `<Derivation>`, `<Viz>`, `<CodeExercise>`). There is no math-rendering cost at runtime. |
| Exercises | JSON metadata plus real `.py` / `.sql` files (`starter`, `solution`, `tests`, known-wrong variants) | Python stays in `.py` files, so it can be linted, type-checked and run with real pytest locally and in CI. JSON holds prompts, hints, concept tags and grading options. |
| Code editor | **CodeMirror 6** | You asked for a "Monaco-style" editor. CodeMirror 6 gives the same core features: syntax highlighting, autocomplete, multi-cursor, search/replace, inline lint diagnostics, and optional Vim keys. It also **works on iPad and phone**. Monaco does not officially support mobile browsers, weighs several MB, and needs worker plumbing. CodeMirror is about 10x smaller and touch-friendly. |
| Python in browser | **Pyodide 314.0.7** (CPython 3.14.2 in WebAssembly) in a dedicated Web Worker via Comlink | Verified package set: NumPy 2.4, pandas 3.0, scikit-learn 1.8, SciPy 1.18, statsmodels 0.14, **XGBoost 2.1, LightGBM 4.6**, Polars 1.33, DuckDB 1.5, SymPy 1.14, matplotlib 3.10, **pytest 9.0**, HiGHS (`highspy`, LP/MILP) and Clarabel (conic/QP). Production-library comparisons can therefore run in the browser for everything except deep-learning frameworks. |
| SQL in browser | **DuckDB-WASM** in its own worker; datasets shipped as Parquet | SQL lessons start instantly without booting Python. The same queries also run through DuckDB inside Pyodide when an exercise mixes SQL and Python. |
| Math checking | Randomized numeric equivalence (mathjs) for expression answers; SymPy (in Pyodide) for symbolic steps | Fast checking of typed derivation steps like `2*X^T*(X*w - y)` with no Python boot. SymPy handles the harder symbolic cases. |
| Local data store | **IndexedDB via Dexie**, versioned schema, JSON export/import | Progress, attempts, review cards and session logs stay on your device. Calling `navigator.storage.persist()` and installing the PWA protects against Safari storage eviction; a weekly export reminder is the safety net. |
| Spaced repetition | **ts-fsrs** (FSRS scheduler) | Modern, evidence-based scheduler with a desired-retention knob; better than SM-2 at the same review load. |
| State | Zustand (UI/session state); Dexie live queries (persistent state) | Small and explicit. |
| Visualizations | React + SVG/Canvas with d3 modules (scale, shape, contour, force); no heavy charting framework | Full control over the custom interactive explainers (loss surfaces, backprop stepper, attention maps). Each one is code-split and loads on demand. |
| PWA / offline | `vite-plugin-pwa` (Workbox): precache app shell + content; runtime-cache Pyodide packages and datasets | Installable on laptop, iPad, iPhone. Works on a plane. A "Download everything for offline" button prefetches about 90 MB of Python packages. |
| AI tutor (optional) | Official `@anthropic-ai/sdk` called directly from the browser with your own key | No backend at all. Details in 8.10. |
| Tests | Vitest (unit), Playwright (end-to-end smoke on desktop/tablet/phone viewports), pytest (Python graders, simulator, local labs) | Each layer is tested in its own language. |
| CI/CD | GitHub Actions: typecheck, lint, unit tests, **content validation in Pyodide on Node**, build, deploy to Pages | A broken exercise can never ship. |

Download budget (measured from the Pyodide CDN, uncompressed):
- Pyodide core: about 12 MB. NumPy adds 3 MB.
- pandas: +4 MB.
- scikit-learn stack (SciPy, OpenBLAS, scikit-learn): about +21 MB.
- Polars: +18 MB.
- DuckDB: +9 MB.

Everything is cached after first use. The lesson player pre-warms the worker as soon as you open a lesson that contains code, so the first Run click rarely waits.

### 8.2 System overview

```
                         ┌──────────────────────────────── Browser (PWA) ───────────────────────────────┐
  content/ (MDX, JSON,   │  React UI ── Lesson player ── Daily session ── Facility map ── Progress      │
  .py, .sql, cards) ──►  │     │             │                 │               │            │           │
  build-time compile     │     ▼             ▼                 ▼               ▼            ▼           │
                         │  Content store  Grader client   Session planner  Sim client   Mastery model  │
                         │                    │                                 │            │           │
                         │        ┌───────────┴───────┐                         │            ▼           │
                         │        ▼                   ▼                         ▼        Dexie (IndexedDB)│
                         │  Pyodide worker      DuckDB-WASM worker      Pyodide worker   attempts, cards,│
                         │  (hsgrade + pytest,  (SQL graders)           (facility sim,   progress, logs  │
                         │   learner code)                               controllers)                    │
                         │                                                                               │
                         │  Optional: Tutor panel ──HTTPS──► Anthropic API (your key, stored locally)     │
                         └───────────────────────────────────────────────────────────────────────────────┘
  Local track: python/labs (uv project) ── pytest ── prints completion code ──► pasted into app
```

### 8.3 Code execution and grading

- **Worker protocol.** The worker exposes:
  - `run(code, {packages, timeoutMs})`, which returns stdout, stderr, rich outputs and errors;
  - `grade(exerciseId, files)`, which returns structured results.

  Learner code runs as a module, never via `exec` on the UI thread. Tracebacks are re-mapped to the learner's line numbers.
- **In-browser performance budget**, measured in research: Pyodide NumPy matmul runs at about 0.4–0.6 GFLOP/s, a small NumPy MLP step takes about 16 ms, and a scalar-autograd op about 5–6 µs. So:
  - interactive training steps stay under about 50 ms;
  - in-browser training runs stay under about 60 s;
  - in-browser models stay at or below about 10⁵ parameters (a character-level transformer with d_model ≤ 64, context ≤ 32 and ≤ 2 layers is feasible);
  - demos ship pre-trained checkpoints so samples look good.

  Anything larger goes to local labs.
- **What runs where.**
  - *In the browser:* NumPy, SciPy, pandas, scikit-learn, statsmodels, LightGBM, XGBoost, Polars, DuckDB, SymPy and pytest from the Pyodide distribution. CVXPY (with Clarabel), CasADi, python-control, filterpy and PySINDy also loaded in testing (some via micropip).
  - *Locally only:* PyTorch, JAX, numba-based libraries (statsforecast, PyOD) and Gymnasium, which do not run in Pyodide.
  - *Bundled:* tiktoken's BPE vocabulary files, since the in-browser download failed.
- **Version skew.** The browser lags PyPI: Pyodide 314.0.7 ships NumPy 2.4.6, scikit-learn 1.8.0, Polars 1.33.1, DuckDB 1.5.1 and XGBoost 2.1.4, while PyPI had NumPy 2.5.4, scikit-learn 1.9.1, Polars 2.1, DuckDB 2.0 and XGBoost 3.4 on Nov 12. So:
  - in-browser exercises target the Pyodide versions;
  - `python/constraints-pyodide.txt` pins the local test environment to the same versions, so `tests.py` behaves identically in both places;
  - local labs that need newer libraries use their own environments and note API differences, especially for Polars 2 and DuckDB 2.
- **Timeouts.** Default 10 s, configurable per exercise. On timeout the worker is terminated and respawned (about 2 s warm restart from cache). This catches infinite loops without needing cross-origin isolation, which GitHub Pages cannot provide.
- **Graders run real pytest.** Each exercise ships a `tests.py`. A small pytest plugin (`hsgrade.plugin`) collects every test's outcome, assertion message, duration and the hint tag it maps to, and returns them as JSON. The *same* `tests.py` runs locally with `uv run pytest`, so the browser and your laptop agree.
  - **Verified on Nov 12 in Chrome on this Mac**, with Pyodide 314.0.7 loaded from the CDN:
    - cold boot 3.3 s;
    - NumPy + pytest load 1.0 s;
    - first pytest run 3.2 s (imports plus assertion rewriting);
    - **warm re-grade 0.5 s**.
  - pytest's assertion rewriting produced readable failure messages through the plugin.
  - The worker pre-warms Python and imports pytest as soon as a lesson with code opens, so you normally see the warm number.
  - Between attempts the grader clears the learner and test modules from `sys.modules`, so each run sees fresh code.
- **Package loading is part of grading.** Also verified in Chrome on Nov 12 (100 boosting rounds on 5,000×8 data, after 4–5 s cold package downloads):
  - scikit-learn HistGradientBoosting: 0.6 s;
  - LightGBM: 0.6 s;
  - XGBoost native API: 0.6 s;
  - XGBoost's scikit-learn wrapper: 0.8 s, and **only if scikit-learn is loaded before XGBoost is imported**;
  - LightGBM and XGBoost coexist in one interpreter;
  - SciPy's bundled HiGHS (`linprog`, `milp`) solved LPs correctly.

  The standalone `highspy` package works on its own, but crashed WebAssembly ("memory access out of bounds") when loaded into an interpreter already holding the ML stack. So:
  - LP/MILP lessons use SciPy's HiGHS interface;
  - each exercise declares its packages;
  - the worker loads them in dependency order and recycles itself when a lesson needs an incompatible set;
  - CI loads every package combination any exercise uses.
- **Feedback that teaches.** `hsgrade` assertion helpers turn raw failures into diagnoses:
  - `assert_close` reports where and by how much values differ;
  - `assert_shape` says, for example, "expected (n,), got (n, 1). Did you forget `.ravel()`?";
  - `assert_dtype`, `assert_no_nan`;
  - `assert_vectorized` is an AST check that flags Python loops when vectorization is the point;
  - `assert_not_imported("sklearn")` enforces from-scratch tasks;
  - `assert_runtime_under`, `assert_deterministic`;
  - `compare_to_reference` checks results against scikit-learn or SciPy within tolerance.

  Known-misconception detectors map specific failures to explanations and to review cards.
- **Hidden tests.** Visible tests guide; hidden tests check edge cases. Both count toward mastery; only visible test bodies are shown.
- **Tiered hints.** Hint 1 is a conceptual nudge, hint 2 a specific pointer, hint 3 pseudocode or a partial line. After that, "reveal solution". Hints reduce the mastery credit for that attempt. A reveal schedules a fresh re-attempt of the same skill two days later.
- **SQL grading.** Result sets are compared order-insensitively unless the task requires `ORDER BY`, with float tolerance and type-aware messages ("you returned 23 rows; 3 duplicates come from the join on `rack_id`").
- **Concept questions.** Single or multiple choice, numeric with tolerance and units, ordering, matching, and Parsons problems (reorder code lines). Free-text explanations are self-assessed against a rubric. If the tutor is enabled, it gives Socratic feedback on them.
- **Local (PyTorch/GPU) labs.** Labs live in `python/labs/<module>/` as a uv project with notebooks or scripts plus pytest suites. They run on your Mac (PyTorch MPS backend). GPU-specific parts (CUDA mixed precision, multi-GPU) have Colab-ready notebooks. `uv run hs-check <lab>` runs the tests and prints a short completion code: a checksum over lab id, test summary and date. Pasting it into the app marks the lab complete. It guards against typos, not cheating; this is your course.

### 8.4 Content verification pipeline (runs in CI and locally)

For every exercise:
1. the reference solution passes all tests;
2. the starter code **fails** at least one test (so a test cannot pass trivially);
3. every known-wrong variant fails with its expected diagnostic message;
4. the run completes under the time limit in Pyodide on Node, the same engine the browser uses.

Every lesson's MDX compiles. Every cited source id exists in `research/sources.json`. Every concept tag exists in the concept graph. Every SRS card renders. The simulator's physics tests must also pass:
- energy-balance closure;
- steady-state values close to hand calculations;
- monotonic responses, e.g. more IT load never lowers inlet temperatures;
- deterministic replays under a fixed seed.

### 8.5 Data model (IndexedDB, schema-versioned)

`settings` (time budget, calendar, retention, theme; tutor key stored separately and **never exported**) ·
`progress` (lesson step completion) ·
`attempts` (item id, code/answer, result details, hints used, time spent, timestamp) ·
`mastery` (per concept, derived from attempts and recomputable) ·
`cards` (FSRS state per card) ·
`reviewLog` ·
`sessions` (planned vs done, minutes) ·
`checkpoints` ·
`projects` (status, completion codes, repo and post URLs) ·
`incidents` (facility story state) ·
`simRuns` (controller, scenario, KPIs, for the "beat your own controller" leaderboard) ·
`notes`.

Export writes one JSON file with `schemaVersion`; import runs migrations, previews what will change, and merges or replaces.

### 8.6 Learning engine

Section 3 is the pedagogical spec; this is how the app implements it.

- **Concept graph.** Every lesson, exercise and card is tagged with skills, for example `broadcasting`, `ridge-closed-form`, `leakage-temporal`, `kv-cache-memory`. Skills have prerequisites; modules unlock from the graph.
- **Per-skill mastery.** Bayesian knowledge tracing per skill (P(known) ≥ 0.95 counts as mastered; `corbett1995-knowledge-tracing`). It updates from first attempts, discounted for hint use, and FSRS retrievability of the skill's cards serves as a second signal. Unit-tested, explainable on the Progress screen.
- **Gates.** The section 3.4 rules:
  - an 85% unhinted checkpoint, plus 100% on critical items, a transfer item and an explain item;
  - delayed confirmation at 80% after 3–7 days;
  - a 24-hour retake on new items;
  - provisional advance after two failed attempts.

  Checkpoints draw from item pools with parameterized variants so retakes are fresh.
- **FSRS.** `ts-fsrs` v6 with the section 3.5 settings. Both the card state and the review-log entry are persisted, since `review()` does not mutate its input. Weights are re-optimized monthly from your log. *Build-time check:* confirm the v6 package bundles for the browser (its Node ≥ 24 engine note concerns the default scheduler setup); fall back to v5 if needed.
- **Daily session planner.** Inputs:
  - minutes available (calendar + time budget, with a "today I have…" override);
  - due cards;
  - scheduled lesson steps;
  - weak skills;
  - pending delayed confirmations and re-derive drills;
  - the challenge pool;
  - device type.

  It outputs the section 3.2 structure, choosing lite-day or weekend-lab variants automatically. On a phone it favours reviews, Parsons problems, predictions and concept checks.
- **Pacing.** `planning/build_schedule.py`, ported to TypeScript, re-flows the week-by-week plan from your time budget and actual pace. The dashboard shows ahead or behind in hours, projected vs target milestone dates, and a gentle behind-plan indicator rather than streak pressure.
- **Weekly review.** Every Sunday the app produces:
  - weakest skills and slipping cards;
  - calibration curve (confidence vs accuracy);
  - delayed-confirmation results;
  - hint-use hotspots;
  - time against plan;
  - an auto-built 20-minute weakness drill;
  - next week's focus.
- **Instrumentation.** Every attempt logs item, skills, latency, hint tier, per-step correctness, confidence, and the FSRS entry. Items with high error *and* high confidence are flagged as either misleading items or real misconceptions. Gate thresholds are reviewed against delayed-confirmation pass rates.

### 8.7 Facility narrative and simulator

- **Setting (fictional).** You join Basalt Cloud as a new ML engineer at **Kestrel Ridge**, a hyperscale campus on a semi-arid inland Pacific Northwest plateau. The climate brings hot, dry summers with low wet-bulb, cold winters (tower freeze protection), and many free-cooling hours.
  - **Weather:** a typical-year file for a comparable real location (for example Kamloops, BC, or Moses Lake, WA) plus the real hourly record of the late-June 2021 Pacific Northwest heat dome for the heat-wave incident. Both come from public ECCC/NOAA/NSRDB data, and licenses are confirmed before any data ships with the app.
  - The company, site and staff are invented; names are editable in `content/facility/`.
- **Map.** A clean blueprint-style SVG campus:
  - Ops Console;
  - Sensor Network;
  - Energy Desk;
  - Reliability Center;
  - Neural Lab;
  - Grid Desk;
  - Planning Office;
  - Fault Detection Center;
  - Ops Copilot;
  - Platform Team;
  - Plant Control Room;
  - AI Pod (liquid-cooled GPU hall).

  Zones light up as their modules are mastered.
- **Incidents.** Short tickets from colleagues, each linked to an exercise or project. Examples:
  - "PUE dashboard is wrong";
  - "two inlet sensors disagree";
  - "the 99%-accurate fault detector";
  - "chiller 2 trips during a heat wave";
  - "a supply-air sensor is drifting";
  - "the forecast leaks tomorrow's weather";
  - "new GPU pod broke the load forecast";
  - "utility calls a demand-response event".

  The tone is professional, like a real ops queue.
- **Simulator (`hyperscale_sim`).** One pure-Python + NumPy package, the single source of truth. It runs in a Pyodide worker for the in-app Control Room and exercises, and locally (`uv pip install -e python/sim`) with a Gymnasium wrapper for RL training.
  - **Model.** A lumped-parameter data hall:
    - zones of racks with air and structure thermal nodes;
    - CRAH units (coil effectiveness, fan affinity laws);
    - chilled-water loop with chillers (part-load and lift-dependent COP);
    - plate heat exchanger and economizer;
    - cooling towers driven by wet-bulb;
    - pumps;
    - UPS and transformer losses;
    - a later liquid-cooled AI pod with CDU and cold plates.
  - **Outputs.** PUE, WUE, energy, cost, carbon, and ASHRAE inlet-envelope violations.
  - **Inputs.** Fault injection and scenario files (heat wave, chiller trip, sensor drift, fouling, stuck valve, demand response).
  - **Reference hall** (from `research/domain-datacenter.md`, which has the full equations, parameter table, control loops, failure modes and sensor list):
    - 4.8 MW air-cooled hall in 4 contained pods of 120 racks;
    - 16 fan-wall CRAHs;
    - 3 variable-speed chillers in N+1 plus a plate-heat-exchanger economizer and hybrid wet/dry towers;
    - 2N UPS;
    - a later 1 MW liquid-cooled AI pod (130 kW racks on a CDU).
  - **States.** About 31:
    - cold-aisle, hot-aisle and server-mass temperatures per pod, plus a coil lag per pod;
    - structure temperature and humidity;
    - chilled-water headers and a storage tank;
    - chiller loading, tower basin and UPS state of charge;
    - the AI-pod liquid loop;
    - sensor bias/drift states, kept apart from the physics so sensor faults never change the plant.
  - **Fidelity levels.** Level 1 (about 21 states) for hand tuning, Level 2 for controller and FDD work, Level 3 for the AI pod and power chain.
  - **Timing.** Physics runs at 1–5 s steps, controllers every 10–60 s, logs every 60 s, plus 5-minute ML snapshots.
  - **Baseline controls.** Ten control loops form the "BMS v1" you later beat: supply-air PI, containment ΔP, pumping, chilled-water reset, chiller staging, condenser water, economizer mode, humidity, liquid loop, and a supervisory safety cap.
  - **Validation tests** include:
    - steady-state energy closure within 1%;
    - the design point;
    - fan-affinity checks;
    - replicating a published cooling-outage temperature-rise case.
  - **Calibration.** Parameters flagged as estimates in the research notes get calibrated against library sources (ASHRAE guidelines, EnergyPlus chiller and tower curves) before the simulator ships.
  - **Recurring arc.**
    1. Tune setpoints by hand (Induction).
    2. Write a PI controller plus economizer logic (Calculus & optimization).
    3. Forecast load (Trees & boosting, Time series).
    4. Detect and diagnose faults (Unsupervised, Anomaly detection).
    5. Optimize the plant with LP/MILP (Optimization & OR).
    6. Build an MPC (Control).
    7. Train an RL agent to beat your best controller (RL, then Capstone 1).

    The leaderboard keeps your manual score from week 1 so you can see how far you have come.
- **Control Room UI.**
  - Live data-hall heatmap and plant schematic with flows and power.
  - Sparklines and KPI tiles.
  - Sliders in manual mode, and a code editor for `def control(obs) -> action` in controller mode.
  - Scenario picker and a speed control.

### 8.8 Visualization library (`src/viz/`)

Every intuition step has an interactive explainer. Planned set, built with the module that needs it:

- **Linear algebra:** vector projector, 2-D transform grid, SVD rotate-stretch-rotate, rank-k reconstruction.
- **Optimization:** loss-surface optimizer race (GD, momentum, Adam on ill-conditioned and saddle surfaces), Newton vs GD, LP feasible-region explorer.
- **Probability and inference:** CLT sampler, covariance ellipse, MLE likelihood landscape, Kalman filter tracker.
- **Classical ML:** bias–variance degree slider, L1/L2 constraint geometry, decision-boundary playground (draggable points), threshold–cost slider with a live confusion matrix, reliability diagram, tree split search, boosting residual stepper.
- **Unsupervised:** k-means and EM animators, PCA explorer, kernel/RBF slider.
- **Deep learning:** backprop stepper (computational graph with forward and backward values), neural-net playground (poke weights, watch activations), activation and gradient histograms by depth, loss-curve pathology gallery.
- **Sequence models and LLMs:** convolution animator, LSTM gate trace, attention heatmap, BPE merge stepper, KV-cache memory calculator, continuous-batching simulator, roofline plot, diffusion denoising trajectories.
- **Forecasting and anomaly detection:** forecast fan chart with interval calibration, anomaly threshold vs event-level precision and recall.
- **RL and control:** live bandit arena, gridworld value iteration, Q-learning agent learning live, MPC receding-horizon animator.
- **Domain:** psychrometric chart and PUE Sankey for the domain lessons.

### 8.9 Screens

Today (one-tap session) · Learn (skill tree → module → lesson player) · Practice (weak spots, challenge of the day, by-concept drills) · Review (FSRS) · Facility (map, incidents, Control Room) · Projects (briefs, rubrics, completion codes, repo/post links) · Progress (mastery by concept and module, streak, milestone countdowns, schedule, weekly review) · Sources (bibliography with per-lesson filters) · Settings (time budget, MDS calendar, retention, tutor, export/import, offline download).

### 8.10 Optional AI tutor

- **Setup.** Enabled only when you paste your own Anthropic API key in Settings. The key stays in this browser's IndexedDB, is never included in exports, and can be wiped with one click.
- **Calls.** Requests go straight from the browser to the Anthropic API through the official TypeScript SDK in browser mode.
- **Model.** Default `claude-opus-5-5` with adaptive thinking and effort set per mode. Sonnet 5.5 and Haiku 5.5 are selectable for lower cost; that is your choice in Settings.
- **Fallbacks and caching.** Server-side refusal fallbacks are on by default. Prompt caching covers the static tutor instructions and lesson context.
- **Modes.**
  - **Explain:** Socratic questions that build toward the idea.
  - **Quiz me:** retrieval practice on the current module.
  - **Review my code:** rubric-based feedback that points at lines and asks questions.
  - **Debug with me:** reads the grader output and asks what you expected.
  - **Derivation coach:** checks each step you write.
- **Socratic-only mode** switches on automatically during from-scratch stages (section 3.8): questions and pointers only, no code.
- **Guardrails.** The tutor never receives the reference solution, so it cannot leak it. Its instructions forbid writing full solutions until you have revealed one yourself. It sees the lesson summary, the exercise prompt, your code, the test results, how many hints you used, and your weak concepts.
- **Cost display.** A per-session token estimate.
- **Without a key.** Everything else in the app works with no key.

### 8.11 Deployment and repos

- Main repo `hyperscale` (app, content, Python packages, labs) deploys to GitHub Pages at `colbyy03.github.io/hyperscale/`. It sits alongside your Quarto user site and does not touch it.
- Each milestone project and capstone gets its own repo from a template:
  - README;
  - uv environment;
  - tests and CI;
  - `post/` folder with a Quarto `.qmd` draft for colbyy03.github.io.
- Local development: `npm run dev` for the app, `uv sync` for the Python side. CI mirrors both.
- **Prerequisite on this Mac:** Node.js is not installed. The build phase needs it (`brew install node`, or a version manager).

## 9. Content format

All course content is plain files in the repo. Adding a lesson means adding an MDX file; adding an exercise means adding a folder.

### 9.1 Layout

```
content/
  curriculum.json                 # module order, prerequisites, milestones, hour estimates
  concepts.json                   # concept graph (id, title, prerequisites, module)
  facility/                       # campus map zones, characters, unlock rules
  incidents/<id>.mdx              # narrative tickets linked to exercises/projects
  modules/<NN-slug>/
    module.json                   # title, summary, objectives, prereqs, concepts, MDS mode, facility unlock, sources
    lessons/<NN-slug>.mdx         # lesson body + interactive blocks (frontmatter below)
    exercises/<slug>/
      exercise.json               # metadata, prompt, hints, grading config
      starter.py | starter.sql
      solution.py | solution.sql
      tests.py                    # pytest; visible + hidden tests
      variants/<name>.py          # known-wrong implementations that must FAIL with a specific message
    checkpoint.json               # mastery gate: items, weights, thresholds
    questions.json                # question pool: lesson <Check items> and mixed practice
    cards.json                    # spaced-repetition cards for the module (lessons can also inline cards)
    project/README.md             # module build: brief, rubric, starter repo pointer
    ai-workflow.mdx               # "How I'd do this with AI tools"
python/
  hsgrade/                        # grading helpers + pytest plugin (runs in Pyodide and locally)
  sim/                            # hyperscale_sim package (facility simulator)
  labs/                           # local PyTorch/GPU labs (uv project, pytest suites, hs-check CLI)
research/sources.json             # every citation; lessons reference sources by id
planning/                         # calendar, curriculum order, schedule builder
```

### 9.2 Lesson frontmatter and blocks

```mdx
---
id: linear-models/ridge
title: Ridge regression is Tikhonov damping
minutes: 25
concepts: [ridge-closed-form, conditioning, map-gaussian-prior]
sources: [hoerl1970-ridge, hastie2009-esl, deisenroth2020-mml]
cards: [ridge-normal-eq, ridge-shrinks-small-singular-values, ridge-map-prior]
---

<Situation incident="chiller-curve-explodes">The chiller model fit last night predicts
negative power at low load. Ines suspects collinear features.</Situation>

<Predict id="ridge-p1" question="If you double λ, what happens to the norm of w?"
  options={["grows", "shrinks", "unchanged", "depends on the data"]} answer={1}
  explain="..." />

<Viz name="RidgePath" props={{ dataset: "chiller-collinear" }} />

<Derivation id="ridge-d1" steps="ridge-normal-equations" />   {/* learner completes blanks */}

<CodeExercise id="ridge-closed-form" />                        {/* loads exercise folder */}

<Bridge kind="mechanical">Ridge is the same move as Tikhonov regularization of an
ill-posed inverse heat-conduction problem: add damping so small singular values
can't blow up the solution.</Bridge>

<Craft>Never invert XᵀX. Solve the augmented least-squares system with QR or a Cholesky solve.</Craft>

<Check items={["ridge-q1", "ridge-q2"]} />
```

Block components:
- **`<Situation>`**: facility hook.
- **`<Predict>`**: predict, then run, then explain.
- **`<Viz>`**: interactive explainer.
- **`<Experiment>`**: a slider experiment with a question at the end.
- **`<Derivation>`**: step-by-step, with typed expressions checked numerically or symbolically.
- **`<CodeExercise>`**: fill-in, from-scratch, debugging, or production comparison.
- **`<Parsons>`**: reorder code lines.
- **`<Bridge>`**: connection to engineering.
- **`<Craft>`**: debugging and production gotchas.
- **`<Check>`**: retrieval questions.
- **`<Compare>`**: your implementation against the library's on the same data.
- **`<LocalLab>`**: links a PyTorch lab and its completion code.
- **`<Sources>`**: auto-rendered at the end of every lesson.

### 9.3 Exercise schema (abridged)

```json
{
  "id": "linear-models/ridge-closed-form",
  "type": "code",                      // code | fill-in | debug | predict | derivation | parsons | concept | sql | local
  "language": "python",
  "title": "Ridge regression without inverting XᵀX",
  "prompt": "prompt.md",
  "concepts": ["ridge-closed-form", "conditioning"],
  "difficulty": 0.55,                  // 0..1, calibrated from attempts over time
  "minutes": 12,
  "packages": ["numpy"],
  "constraints": { "forbidImports": ["sklearn"], "requireVectorized": true, "timeoutMs": 8000 },
  "compare": { "against": "sklearn.linear_model.Ridge", "tolerance": 1e-8 },
  "hints": [
    "What does adding λI do to the eigenvalues of XᵀX?",
    "Stack sqrt(λ)·I under X and zeros under y, then solve ordinary least squares.",
    "np.linalg.lstsq(np.vstack([X, np.sqrt(lam) * np.eye(d)]), np.concatenate([y, np.zeros(d)]))"
  ],
  "misconceptions": {
    "test_intercept_not_penalized": "card:ridge-dont-penalize-intercept"
  },
  "sources": ["hoerl1970-ridge"]
}
```

### 9.4 Card schema

```json
{ "id": "ridge-shrinks-small-singular-values", "type": "concept",
  "front": "In the SVD basis, how does ridge change each component of the least-squares solution?",
  "back": "Each component is scaled by σᵢ²/(σᵢ²+λ): directions with small singular values are shrunk the most.",
  "concepts": ["ridge-closed-form"], "source": "lesson:linear-models/ridge" }
```

### 9.5 Sources

`research/sources.json` holds one record per source:
- `id`, `type`, `title`, `authors`, `year`, `venue`;
- `doi`, `url`, `open_url`, `access`, `license`, `accessed`;
- `verified`;
- `modules`, `notes`.

Lessons cite by id. CI fails if a cited id is missing. The Sources screen and every lesson footer render from this one file.

## 10. Build phases and verification

Each phase ends with:
- tests green;
- a click-through of the deployed build in Chrome (desktop and phone-size viewport);
- updated `README.md` and `CHANGELOG.md`;
- a git commit.

| Phase | Builds | Done when |
|---|---|---|
| **0. Research and plan** (this phase) | `research/` (sources, job analysis, MDS map, pedagogy, domain, datasets), `planning/` (calendar, curriculum order, schedule builder), this `PLAN.md` | You approve or adjust the plan |
| **1. App shell and content system** | Vite/React/TS scaffold, design system (dark-first), navigation, Dexie schema + settings, MDX/JSON content pipeline with schema validation (zod), concept graph, lesson player (static blocks), skill tree, Today/Progress skeletons, PWA, GitHub Actions CI, Pages deploy | Sample module renders online and offline; content-loader unit tests; Playwright smoke passes on three viewports |
| **2. Code runners and grading** | Pyodide worker + CodeMirror, `hsgrade` + pytest plugin, DuckDB-WASM SQL runner, concept/numeric/Parsons/derivation graders, hint tiers, attempt storage, content-verification pipeline (Pyodide on Node) in CI | One sample exercise of every type behaves correctly: solution passes, starter fails, variants fail with the right message; grader unit tests pass |
| **3. Learning engine + simulator/viz core** | Mastery model, checkpoints and gates, FSRS reviews, daily session planner, pacing and weekly review; `hyperscale_sim` v1 (hall + CRAH + chilled-water plant + economizer + faults) with physics tests; Control Room (manual mode); viz framework + the first explainers | A full daily session runs end to end on sample content; simulator passes energy-balance and steady-state tests; Control Room is playable |
| **4…N. Content, module by module** (study order) | Per module: lessons, exercises, checkpoint, cards, visualizations, project brief, AI-workflow section, sources, Python labs where needed | Every exercise CI-verified; module click-through; mastery gate tested by actually passing and failing it |
| **N+1. Polish** | Performance budgets, accessibility (keyboard, screen reader, reduced motion), mobile ergonomics, onboarding, offline download, tutor hardening, export/import edge cases | Lighthouse PWA/perf checks pass; full end-to-end suite green |

**One deliberate deviation from your phase order.** The brief puts simulations and visualizations after all content. I propose building the simulator core and the viz framework in Phase 3, before content, because:
- Induction and Modules 1–3 use the Control Room;
- the intuition-first lessons need their explainers;
- each module's own visualizations ship with that module.

Advanced pieces arrive with the modules that need them:
- the AI pod;
- live RL agents;
- MPC and the continuous-batching simulator.

**Content cadence.** At your default pace you finish about one module per week. I will keep content at least two modules ahead of where the schedule puts you, starting with Induction and Modules 1–3 so you can begin in the first week. The schedule screen marks any module not yet authored.

**Tutor timing.** The tutor is optional, so it ships after the first modules are live (late Phase 4) rather than blocking anything.

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| **Content volume** (about 180 lessons, hundreds of exercises) outpaces authoring | One verified pipeline for every exercise. Content stays at least two modules ahead of you. The schedule flags any module not yet authored. Accelerate modules are deliberately lean. |
| **MDS workload** crowds out study, leading to burnout | Teaching-week defaults are modest. A 62 h buffer. The daily planner adapts to "today I have 20 minutes", and a review-only minimum day keeps streaks honest. The schedule re-flows weekly instead of guilt-tripping. |
| **Inferred MDS dates** are wrong | Dates are editable in settings; the schedule recomputes instantly. |
| **Pyodide on iPad/iPhone**: memory limits, large first downloads | Small in-browser datasets (in-memory working sets kept modest), lazy package loading, cache-first service worker, a pre-download button on Wi-Fi. Phone sessions prefer reviews and concept work. Heavy jobs run in local labs. |
| **Safari storage eviction** wipes progress | Installed PWA + `storage.persist()`, export reminders, one-file JSON export/import. |
| **Errors in authored content** (a wrong derivation, a buggy test) | Every derivation is numerically checked. Every exercise passes the solution-passes / starter-fails / variants-fail pipeline in CI. A "report a problem" button keeps a local errata list you can export. |
| **Copyright** | Original prose, exercises, figures and code throughout. Ideas are attributed to sources; nothing is copied. Every lesson lists its sources. |
| **Sim-to-real gap** in the facility simulator | Parameters come from published ranges. Sanity checks against public data (BDG2, Google PowerData2019). Simulator results are always labeled as such. Projects also use real datasets wherever licenses allow. |
| **Tutor cost or misuse** | Your own key, model choice, per-session token estimates, effort settings, prompt caching. The tutor never sees reference solutions. |
| **Tooling churn** (new major versions of Vite, TypeScript, Pyodide) | Exact versions pinned with a lockfile; upgrades happen deliberately behind green CI. Pyodide is pinned and its package set is recorded in the repo. |
| **Local GPU limits** (Apple MPS vs CUDA) | Small models by design. CUDA-specific steps (bf16/AMP on NVIDIA, multi-GPU) ship as Colab-ready notebooks. |
| **Scope creep** | This plan is the contract. Changes go through `PLAN.md` and `CHANGELOG.md`. |
