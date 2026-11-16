# Pedagogy foundations — Modules 1–11, 25, 26 and the learning-science basis for the app

*Hyperscale research file · compiled 2026-11-12 · by the pedagogy/foundations research agent*
*Companion source list: `research/sources-pedagogy-foundations.json`. References below are source ids from that file.*

**How to read this file.** Each module section covers: (a) how the leading courses and textbooks sequence the topic and where they disagree, (b) a recommended lesson sequence for Hyperscale, (c) from-scratch builds and what to compare against in the production library, (d) mastery benchmarks (derive / implement / debug / explain), (e) misconceptions that can become exercises, (f) bridges to mechanical engineering, and (g) primary references. Items marked ★ go beyond a typical applied-MDS treatment on purpose. Exercise tags: **[P]** predict-the-output, **[D]** debug a broken artifact, **[S]** slider/visual experiment, **[E]** explain or derive. The last section turns the learning-science evidence into concrete app rules.

All prose is original. Nothing is copied from the sources: no passages, figures, exercises or code.

---

## 0. Currency check: what was live on 2026-11-12

| Resource | What I saw | Notes for the course |
|---|---|---|
| Stanford CS229 (`cs229-stanford-2025`) | Front page lists the **Summer 2026** offering. The archived **Fall 2025** page has the full lecture schedule (Sep–Dec 2025). Syllabus and materials are in a Stanford-restricted Google Sheet. The public `main_notes.pdf` was last modified 2026-08-23. | I used the Fall 2025 schedule for sequencing. It runs LMS → WLS/logistic/Newton → splits, exponential family and GLMs → bias–variance and regularization → GDA/NB → kernels/SVM → k-means/GMM/EM → trees → boosting → NNs → ML advice → RL → PCA → LLMs → fairness. Linear algebra, probability, Python/NumPy and evaluation metrics are TA sessions, not prerequisites. |
| ISLP (`james2023-islp`) | Python edition 2023 (ISLR 2013, ISLR2 2021). Free PDFs. | Chapter order: learning → regression → classification → resampling → selection/regularization → beyond linearity → trees → SVM → DL → survival → unsupervised → multiple testing. |
| ESL (`hastie2009-esl`) | 2nd ed. (Feb 2009), corrected 12th printing (Jan 2017). Free PDF. | Reference for derivations: ch. 3, 4, 7, 9, 10, 14, 15. |
| Murphy PML1 (`murphy2022-pml1`) | MIT Press, March 2022. Draft PDF dated 2025-04-18, CC BY-NC-ND. | Foundations come first: probability, statistics, decision theory, information theory, linear algebra, optimization. |
| Bishop PRML (`bishop2006-prml`) / Bishop & Bishop (`bishop2024-deep-learning`) | PRML (2006) is a free PDF from Microsoft Research. The 2024 book's site lists printing corrections and solutions for ch. 2–10. | PRML is the main reference for Bayesian linear models, EM and latent-variable models. |
| MML (`deisenroth2020-mml`) | CUP, April 2020. Free PDF plus Jupyter tutorials. | Part I is math. Part II covers four "central problems": regression, PCA, GMM, SVM. |
| Boyd & Vandenberghe (`boyd2004-convex-optimization`, `boyd2018-vmls`) | Both are free PDFs. CVX slides updated summer 2023. VMLS has a Python companion. | VMLS is the best fit for an engineer: applied least squares, k-means, regularized and constrained LS, linear dynamical systems. |
| Strang (`strang-mit1806-2010`, `strang-mit18065-2018`, `strang2019-lalfd`) | 18.06 Spring 2010 on OCW (plus a 2023 final lecture). 18.065 Spring 2018. LALFD 2019. | 18.065/LALFD is the bridge from linear algebra to data and deep learning. |
| 3Blue1Brown (`sanderson-3b1b-linear-algebra`, `sanderson-3b1b-calculus`) | 16-lesson linear algebra series. Calculus ch. 1 dated 2017-04-28. | Model for "intuition-first" visual lessons. |
| MacKay ITILA (`mackay2003-itila`) | CUP 2003. Author site with 16 recorded lectures (2012). | Best text that unifies information theory with inference. |
| Cover & Thomas (`cover2006-elements-it`) | Wiley, 2nd ed. (Crossref issue date 2005; usually cited 2006). Paywalled. | Rigor reference only. |
| Blitzstein & Hwang (`blitzstein2019-probability`, `stat110-harvard-site`) | 2nd ed. 2019. Free online at probabilitybook.net. Stat 110 site and Stat110x on edX. | Story-based approach to distributions. |
| McElreath (`mcelreath2020-rethinking`, `mcelreath2026-rethinking-course`) | 2nd ed. 2020. The 2026 course ran Jan 6 – Mar 13, 2026 in **Beginner** and **Experienced** sections, with draft 3rd-edition chapters. | Causal DAGs are woven into Bayesian regression (weeks 4–7, 10). |
| BDA3 (`gelman2013-bda3`, `vehtari2026-bda-course`) | Free PDF for non-commercial use. Aki Vehtari's Aalto course page published 2026-11-03, with Python demos. | Workflow and diagnostics. |
| GPML (`rasmussen2006-gpml`) | MIT Press 2006. Free online. | GP chapters for Module 25. |
| Hernán & Robins (`hernan2020-what-if`) | Online only and free. Cite as 2020 (CRC). Text is revised continuously. Print copy "will eventually" be available. | Three parts: without models → with models → longitudinal. |
| Cunningham (`cunningham2021-mixtape`) | 1st ed. (Yale UP 2021) has moved to mixtape-1ed.netlify.app. mixtape.scunning.com now hosts **2nd ed. "Causal Inference: The Remix"**, marked work in progress. | Design-based econometrics (DiD, RDD, IV, synthetic control). |
| Brady Neal (`neal2020-causal-course`) | Course is still the Fall 2020 version. | ML-flavored sequence: PO → graphs → backdoor → estimation → sensitivity → IV/DiD → discovery → transfer → counterfactuals. |
| scikit-learn (`sklearn-user-guide-1-9`) | **1.9.1 stable**. The guide now has 13 top-level chapters, including "Callbacks" and "Common pitfalls". | Production reference for Modules 6–11. |
| Polars / DuckDB / uv (`polars-docs-2-1`, `duckdb-docs-2-0`, `uv-docs-0-13`) | **Polars 2.1.0**, **DuckDB 2.0 ("2.0 LTS" docs)**, **uv 0.13.8**. | Major versions changed since most tutorials were written (Polars 2, DuckDB 2). Check APIs before writing exercises. |
| McKinney PDA3 / Gorelick & Ozsvald HPP3 (`mckinney2022-pda3`, `gorelick2025-hpp3`) | PDA3 (Aug 2022) is open-access HTML. HPP **3rd ed. April 2025**. | |
| Brunton & Kutz (`brunton2022-ddse`) | 2nd ed. 2022 (CUP). databookuw.com covers Parts I–IV (dimensionality reduction, ML, dynamics & control, ROMs). | Key bridge text for this learner. |
| FSRS (`fsrs-ts-fsrs`, `fsrs-srs-benchmark`, `fsrs-abc-wiki`) | **ts-fsrs v6** supports FSRS-3…FSRS-7. `DefaultScheduler()` **defaults to FSRS-7** and needs Node ≥ 24. The optimizer is a separate package, `@open-spaced-repetition/binding`. The benchmark uses about 10k Anki collections (~727M reviews), and a 20k-user/~1.7B-review dataset is also published. | FSRS-7 has 34 trainable parameters and fractional-day intervals. See §Design rules. |

Library versions on PyPI on 2026-11-12 (`pypi-versions-2026-11-12`): numpy 2.5.4 · scipy 1.18.1 · pandas 3.1.1 · polars 2.1.0 · duckdb 2.0.0 · scikit-learn 1.9.1 · xgboost 3.4.1 · lightgbm 4.7.0 · catboost 1.2.10 · statsmodels 0.15.0 · pymc 6.4.0 · arviz 1.3.0 · numpyro 0.22.0 · dowhy 0.14 · econml 0.17.0 · mapie 1.6.0 · pytest 9.2.0 · hypothesis 6.170.15 · mypy 2.4.1 · ruff 0.17.5 · uv 0.13.8 · skrub 0.11.0 · numba 0.68.1 · line-profiler 5.1.0 · scalene 2.4.0 · py-spy 0.4.3. Several of these are new majors (pandas 3, Polars 2, DuckDB 2, ArviZ 1.x, PyMC 6, NumPy 2.5). **Pin versions in `uv.lock` and re-run every code exercise against the pinned set before release.**

---

## 0.1 Cross-cutting findings that should shape the course order

1. **"Math first" vs "models first, math just in time" is the main split.** MML, PML1 and PRML teach the foundations first. CS229 starts with LMS in lecture 2 and treats linear algebra and probability as parallel TA reviews. ISLP keeps math light. *Recommendation:* use a spiral. Keep Modules 2–5 as real modules (the learner needs the rigor), but end each one with an ML payoff the learner can run (least-squares fit, PCA of a sensor field, an MLE fit, cross-entropy loss), and bring the math back inside Modules 6–11 as short retrieval warm-ups. The learner's strong calculus allows **compressing single-variable calculus to near zero**. Matrix calculus, numerical linear algebra, probability and inference should get **full** time, since engineering curricula usually treat them lightly.
2. **Teach evaluation early and twice.** CS229 covers dataset splitting in lecture 4, bias–variance in lecture 5 and metrics in week 4. ISLP puts resampling (ch. 5) right after classification. *Recommendation:* put a "minimum viable evaluation" lesson (honest split, leakage, one metric) inside Module 6. Module 7 is the deep treatment and must come **before** trees and boosting (Module 8), where weak evaluation causes the most damage.
3. **Causality is woven in by the best modern statistics course.** McElreath 2026 teaches forks, pipes, colliders and good/bad controls *inside* regression. *Recommendation:* plant causal "hooks" in Modules 4, 6, 7 and 11 (confounding vs prediction, leakage as a violation of time order, Simpson's paradox), then give Module 26 its full treatment after Module 25.
4. **The SVD is the natural anchor for this learner.** Brunton & Kutz open with the SVD. Trefethen & Bau teach it in lectures 4–5. LALFD treats it as central. *Recommendation:* teach the SVD and POD in Module 2 (POD is a fluid-mechanics concept the learner may already know). Modules 6 (ridge shrinkage), 10 (PCA) and 25 (GP/kernel conditioning) then build on it.
5. **Kernels lead into Gaussian processes.** PML1 covers kernels, GPs and SVMs together. *Recommendation:* keep Module 9 compact and connect kernels to GPs, then schedule Module 25 soon after. For k-NN, teach approximate nearest-neighbor search (HNSW, FAISS), which links to the retrieval and LLM modules owned by the other agent.
6. **Trees and boosting deserve depth.** For tabular data (most data-center telemetry), tree ensembles are still the strong default (`grinsztajn2022-tabular-trees`). Interviews for infrastructure ML roles often probe their internals.
7. **Suggested order for these 13 modules:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 11 → 8 → 10 → 9 → 25 → 26. The reasons: 11 (pipelines) right after 7 makes leakage-proof pipelines a habit before boosting; 10 needs the SVD (2) and EM needs probability (4) plus information theory (5, for the ELBO); 9 sits just before 25 so kernels flow into GPs. The deep-learning, time-series and production modules (other agent) slot in after 8 or 10. Time series should come after 7 and 11, since time-aware validation and features are prerequisites.
8. **Coordinate with the MDS calendar.** The learner is enrolled in UBC MDS (Aug 2026 – Jun 2027), which covers parts of Modules 4, 6–11, 25 and 26 at an applied level. Align Hyperscale with the block schedule (another agent is researching it) so each module either previews MDS content one or two weeks ahead or deepens it during the same week, instead of repeating it. The ★ items mark where this course should go deeper.

---

## Module 1 — Python for ML engineering

**How leading resources sequence it**
- *McKinney PDA3:* language basics → built-in structures → NumPy basics → pandas → I/O → cleaning → wrangling → plotting → group-by → time series → modeling libraries. Breadth-first and analysis-oriented.
- *Gorelick & Ozsvald HPP3 (2025):* starts with "measure before you optimize" (profiling), then the internals of lists/dicts/sets, iterators and generators, matrix/vector computation and memory, compiling (Cython, Numba), concurrency, clusters, using less RAM, and field lessons.
- *Ramalho, Fluent Python 2e:* the language's data model (dunder protocols) first, then sequences and dicts, data classes, type hints, functions as objects, decorators and closures, protocols and ABCs, iterators, context managers, concurrency and metaprogramming.
- *CS229* covers Python/NumPy in a single TA lecture (week 3, Fall 2025).

**Where they disagree.** The analysis books go straight to dataframes. The performance books start with the memory model and profiling. The software-engineering books start with language semantics. None of them teach testing, packaging and reproducibility as a first-class topic, but an ML engineer needs all three.

**Recommended lesson sequence (8)**
1. **The ndarray memory model.** Data buffer, dtype, shape and strides; views vs copies; C vs Fortran order; why vectorized code is fast (interpreter overhead, contiguous memory, SIMD).
2. **Broadcasting and vectorization patterns.** The broadcasting rules, `einsum`, loop-free pairwise distances, log-sum-exp, and floating-point basics such as non-associativity and cancellation (`goldberg1991-floating-point`).
3. **Measure, then optimize.** `timeit`, cProfile, line_profiler, py-spy/scalene, memory profiling; constant factors vs algorithmic complexity; Numba as the escape hatch.
4. **Typed, testable numerical code.** Type hints including array typing, dataclasses and Protocols, mypy; pytest fixtures and parametrize; tolerance-aware assertions; property-based tests with Hypothesis (`maciver2019-hypothesis`).
5. **Object-oriented design for ML.** An estimator API (constructor stores hyperparameters only, `fit` returns `self`, learned attributes end in an underscore, `get_params`/`set_params`/`clone`); composition over inheritance; scikit-learn's estimator checks.
6. **Reproducible environments and randomness.** uv projects (`pyproject.toml`, `uv.lock`, `uv run`, pinned Python), ruff, pre-commit; `np.random.Generator` with `SeedSequence.spawn` for parallel streams instead of global seeding.
7. **Dataframes at scale.** Polars expressions and the lazy engine (predicate and projection pushdown, query plans); DuckDB SQL over Parquet; Arrow memory; when pandas is still the right tool.
8. **Capstone: telemetry mini-package.** Ingest a month of 1-minute rack inlet temperature and power data (Parquet), build rolling and lag features in Polars and DuckDB, vectorize a derived-feature library, and ship it typed, tested (including property tests), profiled, and locked with uv.

**From-scratch builds → production comparison**

| Build (original exercise idea) | What it teaches | Compare against |
|---|---|---|
| A "stride calculator": map an index tuple to a byte offset, then implement transpose and reshape as stride manipulations and predict when reshape must copy | memory model, views | `ndarray.strides`, `.flags`, `np.shares_memory`, `np.lib.stride_tricks.as_strided` |
| `broadcast_shapes(*shapes)` from the rules | broadcasting semantics | `np.broadcast_shapes` |
| Pairwise distances: triple loop → broadcasting → the ‖x‖²+‖y‖²−2x·y identity (and its cancellation error) → chunked version under a memory budget | vectorization trade-offs, numerical error, memory blow-up | `scipy.spatial.distance.cdist`, `sklearn.metrics.pairwise_distances` |
| Stable softmax and log-sum-exp | overflow and underflow | `scipy.special.logsumexp`, `scipy.special.softmax` |
| Welford's running mean and variance vs the two-pass and naive one-pass formulas on float32 sensor streams | catastrophic cancellation | `np.var` (two-pass), float64 reference |
| Minimal `BaseEstimator` clone with `get_params`/`set_params`/`clone` | API contracts | `sklearn.base`, `sklearn.utils.estimator_checks.check_estimator` |
| Rolling-window features: loop vs cumulative-sum trick vs `sliding_window_view` vs Polars `rolling_*` vs a DuckDB window function, with benchmarks | algorithm vs engine choice | Polars, DuckDB |
| Group-by aggregation via sort plus `np.add.reduceat` / `np.bincount` | how group-bys work inside | Polars `group_by`, DuckDB `GROUP BY` |

**Mastery benchmarks**
- *Derive/explain:* the element-address formula from strides; the memory cost of a broadcast intermediate (n×m×d); why `E[x²]−E[x]²` fails in float32 and Welford does not ★; why a Python loop over 10⁶ elements is about two orders of magnitude slower than a ufunc; when the GIL matters and when multiprocessing helps; columnar vs row storage; what lazy evaluation buys (pushdown, fusion).
- *Implement:* loop-free k-NN distance computation for 10⁴ × 10⁴ points within a fixed RAM budget using chunking; a uv-managed package with ≥ 90% coverage, property tests and type checking passing in CI; a Polars lazy query whose explained plan shows predicate pushdown into a Parquet scan.
- *Debug:* a silent (n,)-vs-(n,1) broadcast that creates an n×n matrix; a view-mutation bug; integer overflow and dtype promotion under NumPy 2's rules; float32 accumulation drift; irreproducible parallel runs caused by global seeding; timezone/DST misalignment when joining sensor tables.
- *Benchmark for mastery:* given an unfamiliar slow notebook, produce a profile, name the top hotspot, and deliver a ≥ 10× speedup with tests proving numerical equivalence within a stated tolerance.

**Misconceptions and pitfalls (exercise candidates)**
1. [P] "Slicing copies." Basic slicing returns a view; fancy and boolean indexing copy. Predict whether a write propagates.
2. [P] "`a.T` turns a 1-D array into a column." It is a no-op on 1-D arrays.
3. [D] "(n,) minus (n,1) is fine." It silently broadcasts to (n,n), and the loss looks plausible.
4. [P] "Vectorized always means less memory." Broadcast temporaries can exceed RAM. Predict the peak allocation.
5. [P] "Float addition is associative" and "float32 is fine for summing 10⁸ readings." Predict the drift, then compare pairwise summation.
6. [P] "Small Python ints never overflow array arithmetic." uint8 wraps, and NumPy 2's promotion rules (NEP 50) changed results for mixed scalar/array arithmetic. Verify each item against the pinned NumPy before publishing.
7. [D] "`np.random.seed(0)` makes parallel workers reproducible and independent." Use spawned `SeedSequence` streams instead.
8. [D] Mutable default arguments (`def f(x, cache=[])`) and class-level mutable attributes shared across estimator instances.
9. [P] Timing a Numba function once and including its compile time.
10. [P] "Polars `group_by` preserves input order" and "`.lazy()` executes immediately." Order is not guaranteed unless requested, and nothing runs until `collect`.
11. [D] Chained assignment and copy semantics in pandas. Pandas 3.x changed copy behavior, so re-verify any classic `SettingWithCopy` exercise against pandas 3.1 before using it.

**Mechanical-engineering bridges**
- Strided views are how finite-difference stencils run on structured CFD or heat-conduction grids. A 2-D Laplacian written as four shifted views is a ready-made vectorization lesson.
- Column-major MATLAB habits from engineering school vs NumPy's row-major default: loop order and cache behavior.
- Round-off in iterative FEA/CFD solvers ↔ floating-point accumulation. Welford ↔ running statistics in a data-acquisition system.
- Profiling ↔ an energy audit: measure where the losses are before retrofitting. That framing carries over to data-center efficiency work.
- Dimensional analysis ↔ shape and type contracts. A shape annotation is "unit checking" for arrays.
- BMS/SCADA historian exports (irregular sampling, dropouts, stuck sensors) are realistic data for Polars and DuckDB exercises.

**Primary references:** `harris2020-numpy`, `gorelick2025-hpp3`, `mckinney2022-pda3`, `polars-docs-2-1`, `duckdb-docs-2-0`. *Supporting:* `uv-docs-0-13`, `ramalho2022-fluent-python`, `goldberg1991-floating-point`, `maciver2019-hypothesis`, `pytest-docs-9`, `wilson2014-sci-computing`, `raasveldt2019-duckdb`, `numpy-docs-2-5`, `sklearn-user-guide-1-9`.

---

## Module 2 — Linear algebra

**How leading resources sequence it**
- *Strang 18.06:* elimination and Ax=b (row and column pictures) → LU → vector spaces and the four subspaces → orthogonality, projections and least squares → Gram–Schmidt/QR → determinants → eigenvalues and diagonalization → symmetric and positive-definite matrices → SVD near the end. *18.065/LALFD* starts from the column view (A = CR), reaches the major factorizations and the SVD quickly, then low rank, randomized methods, statistics, optimization and deep learning.
- *3Blue1Brown:* purely geometric. Vectors → span → linear maps → composition → determinant → inverse, column space and null space → non-square maps → dot-product duality → cross products → change of basis → eigenvectors → abstract spaces. No SVD.
- *MML:* systems and spaces → analytic geometry (norms, inner products, projections, rotations) → decompositions (determinant/trace, eigen, Cholesky, SVD, low-rank approximation) → used in regression and PCA.
- *VMLS:* vectors → norms → **k-means as an early application** → matrices → linear dynamical systems → least squares → LS data fitting and classification → **multi-objective (regularized) LS** → constrained LS → nonlinear LS (Gauss–Newton, Levenberg–Marquardt).
- *Trefethen & Bau:* the **SVD in lectures 4–5**, then projectors and QR → least squares → conditioning and stability → elimination and Cholesky → eigenvalue algorithms → Krylov methods (Arnoldi, GMRES, Lanczos, CG).

**Where they disagree.** SVD early (Trefethen & Bau, Brunton & Kutz, LALFD) or late (18.06). Geometry first (3B1B) or algebra first. How much weight determinants and abstract spaces get (light in ML-oriented texts). Whether numerical stability is part of "linear algebra" at all (central in T&B, missing from most ML courses).

**Recommended lesson sequence (8)**
1. **Linear maps and the column picture.** Ax as a combination of columns; matrices as transformations; shapes as contracts; 3B1B-style visual warm-up with predict prompts.
2. **Rank and the four fundamental subspaces.** What can and cannot be solved; identifiability; collinearity and the dummy-variable trap as null-space facts.
3. **Orthogonality, projections and least squares.** The normal equations as an orthogonality condition; QR solutions; the hat matrix; residual geometry.
4. **Symmetric matrices, eigen-decomposition and quadratic forms.** PSD matrices; ellipsoids xᵀAx = c; covariance matrices; Hessians (preparation for Module 3).
5. **The SVD.** Geometry (rotate–stretch–rotate), Eckart–Young low-rank approximation, the pseudoinverse; POD of a temperature field as the first payoff.
6. **Conditioning and numerical stability ★.** Condition number; why the normal equations square κ; backward stability; Cholesky vs QR vs SVD solvers; ridge as a conditioning fix (preview of Module 6).
7. **Factorizations at scale.** LU/Cholesky/QR/SVD/eigsh in LAPACK and ARPACK; sparse matrices; conjugate gradients; randomized SVD (`halko2011-randomized`).
8. **Capstone.** POD of a data-hall temperature or CFD snapshot set: reconstruct with k modes, plot "energy" captured vs k, and analyze the conditioning of a sensor-placement regression.

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| Gaussian elimination with partial pivoting → LU; a tiny-pivot counterexample | why pivoting exists | `scipy.linalg.lu_factor` / `lu_solve` |
| Classical vs modified Gram–Schmidt vs Householder QR; measure ‖QᵀQ − I‖ on Hilbert/Vandermonde matrices | orthogonality loss, stability | `np.linalg.qr` (LAPACK Householder) |
| Least squares three ways (normal equations, QR, SVD); error vs κ on high-degree polynomial fits | conditioning in practice | `np.linalg.lstsq`, `scipy.linalg.lstsq` |
| Power iteration, Rayleigh quotient, deflation | how eigensolvers think | `np.linalg.eigh`, `scipy.sparse.linalg.eigsh` |
| SVD via eigen-decomposition of AᵀA (and why it loses small singular values) vs a library SVD; randomized SVD | accuracy vs cost | `np.linalg.svd`, `sklearn.utils.extmath.randomized_svd` |
| Conjugate gradients for SPD systems | Krylov idea; preview of GD | `scipy.sparse.linalg.cg` |
| Truncated-SVD compression of an image or thermal field | low rank, Eckart–Young | `sklearn.decomposition.TruncatedSVD` |

**Mastery benchmarks**
- *Derive:* the normal equations both by projection and by calculus; the pseudoinverse from the SVD; Eckart–Young (statement plus a geometric argument); κ(AᵀA) = κ(A)² ★; real eigenvalues and orthogonal eigenvectors for symmetric matrices (sketch); the link between the SVD of a centered data matrix and the eigen-decomposition of its covariance; rank–nullity; Rayleigh-quotient bounds.
- *Implement:* Householder QR, a QR-based least-squares solver, power iteration with deflation, CG, randomized SVD, each with tolerance tests against LAPACK.
- *Debug:* a singular design matrix (dummy trap); unscaled features that make a solve unstable; `inv(A) @ b` vs `solve`; eigenvector sign flips that make two PCA runs "disagree"; SVD-PCA without centering.
- *Explain:* conditioning (a property of the problem) vs stability (a property of the algorithm) ★; when to choose Cholesky, QR or SVD; what the determinant does and does not tell you about near-singularity.

**Misconceptions and pitfalls**
1. [P] `A * B` vs `A @ B`; and the belief that matrix products commute.
2. [P] "A small determinant means nearly singular." Scale a well-conditioned matrix by 0.1 and the determinant collapses while κ stays the same.
3. [D] Solving with `inv` (slower and less accurate than a factorization).
4. [P] "Eigenvectors are unique." Sign, scale and rotation within repeated eigenvalues are free. Predict what changes between runs.
5. [P] "The normal equations are how libraries solve least squares." They square the condition number. Compare errors at κ ≈ 10⁸.
6. [P] "Every real square matrix has real eigenvalues and is diagonalizable." Counterexamples: rotations and Jordan blocks.
7. [P] "QᵀQ = I implies QQᵀ = I." False for tall Q. QQᵀ is a projector.
8. [P] "Singular values are eigenvalues." Only for symmetric PSD matrices.
9. [D] "Rank deficiency only happens when p > n." Collinear features and full one-hot encoding with an intercept also cause it.
10. [E] "Linearly independent means orthogonal."

**Mechanical-engineering bridges**
- **Mohr's circle is a 2×2 symmetric eigenproblem.** Principal stresses are eigenvalues and principal directions are eigenvectors, exactly like the principal axes of a covariance ellipse. Use this to introduce PCA.
- The FEA stiffness matrix K is SPD, so Cholesky applies. Large stiffness contrasts cause ill-conditioning, just like unscaled features. Adding K + λI is a "spring to ground", which previews ridge.
- Vibration modal analysis (Kφ = ω²Mφ) ↔ eigen-decomposition. **POD ↔ PCA/SVD on snapshot matrices** (`berkooz1993-pod`, `taira2017-modal`). Explain the difference: structural modes come from M and K, while POD modes are data-optimal in L².
- Least squares ↔ fitting calibration curves and redundant-sensor reconciliation. κ ↔ how much measurement error is amplified, as in tolerance stack-up.
- Jacobi/Gauss–Seidel/SOR from CFD courses ↔ iterative solvers. CG is the optimal Krylov method on the quadratic "energy" (`hestenes1952-cg`, `saad2003-iterative-methods`).
- Inertia-tensor principal axes ↔ PCA.

**Primary references:** `strang-mit1806-2010`, `boyd2018-vmls`, `trefethen1997-nla`, `sanderson-3b1b-linear-algebra`, `brunton2022-ddse`. *Supporting:* `strang2019-lalfd`, `strang-mit18065-2018`, `deisenroth2020-mml`, `halko2011-randomized`, `berkooz1993-pod`, `taira2017-modal`, `hestenes1952-cg`, `saad2003-iterative-methods`.

---

## Module 3 — Calculus and optimization

**How leading resources sequence it**
- *MML:* partial derivatives → gradients and Jacobians → gradients of matrices → backpropagation and automatic differentiation → Taylor series; then GD (step size, momentum, SGD) → constrained optimization with Lagrange multipliers → convex optimization (LP/QP, Legendre–Fenchel duality).
- *Boyd & Vandenberghe:* theory (convex sets, convex functions, convex problems, duality) → applications (fitting, estimation, geometry) → algorithms (unconstrained, equality-constrained, interior-point).
- *Nocedal & Wright:* optimality conditions → line search (Wolfe) → trust regions → CG → quasi-Newton (BFGS, L-BFGS) → large scale → derivatives → least squares (Gauss–Newton, LM) → KKT theory → LP/QP/penalty/SQP/interior point.
- *CS229:* GD in lecture 2 (LMS) and Newton's method in lecture 3 (logistic regression).
- *Bottou, Curtis & Nocedal (2018):* SGD theory for ML, noise reduction and second-order methods. *Goh (2017):* interactive explanation of momentum.

**Where they disagree.** Convex analysis first (Boyd) or algorithms first (CS229, Goh). How much duality to teach. Whether autodiff belongs here (MML) or in a deep-learning course.

**Recommended lesson sequence (8)**
1. **Gradients, Jacobians and the matrix chain rule.** Shape discipline, layout conventions, and the differentials method for matrix calculus (∂ of xᵀAx, ‖Xw − y‖², log det, trace identities).
2. **Taylor models, Hessians and curvature.** Quadratic approximations, definiteness, saddles; why the Hessian's eigenvalues control everything later.
3. **Automatic differentiation ★.** Computational graphs; forward vs reverse mode; why reverse mode costs about one extra pass; gradient checking with central differences and the step-size U-curve (truncation vs round-off) (`baydin2018-autodiff`).
4. **Gradient descent as a dynamical system.** Fixed step on a quadratic; convergence factor tied to κ = L/μ; Armijo/Wolfe line search; GD as forward-Euler on gradient flow.
5. **Momentum, Nesterov, adaptive methods and SGD.** Heavy ball (`polyak1964-heavy-ball`), the √κ speed-up, Adam as diagonal preconditioning, minibatch noise, learning-rate schedules, Robbins–Monro conditions (`robbins1951-sgd`).
6. **Convexity.** Sets, functions, first- and second-order tests, strong convexity and smoothness constants; why convex means local equals global; recognizing convex ML losses.
7. **Second-order and quasi-Newton methods.** Newton (affine invariance), Gauss–Newton and Levenberg–Marquardt for nonlinear least squares, BFGS/L-BFGS; when curvature information pays for itself.
8. **Constrained optimization and duality.** Lagrange multipliers as shadow prices, KKT conditions, complementary slackness, projected gradient; capstone: **chiller-plant load allocation** (minimize total kW subject to meeting the cooling load and staying within unit capacities) solved from scratch and with a modeling library.

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| A reverse-mode autodiff engine (scalar, then array with broadcasting) | the chain rule, mechanized | `jax.grad` or `torch.autograd`; finite differences |
| Gradient checker with relative-error metric and h-sweep | trustworthy gradients | `scipy.optimize.check_grad` |
| GD / momentum / Nesterov / Adam on quadratics with a κ slider; Rosenbrock | conditioning ↔ speed | `scipy.optimize.minimize` (BFGS, L-BFGS-B), `torch.optim` |
| Backtracking line search; damped Newton | step-size control | `scipy.optimize.line_search` |
| Levenberg–Marquardt fit of a heat-exchanger ε–NTU or fan-curve model | nonlinear LS | `scipy.optimize.least_squares` (`trf`, `lm`) |
| Projected gradient and an augmented Lagrangian for the chiller-dispatch QP | KKT in action | `scipy.optimize.minimize(method="trust-constr")`, cvxpy |

**Mastery benchmarks**
- *Derive:* gradients and Hessians of least squares, logistic loss and softmax cross-entropy; PSD-ness of the logistic Hessian; the GD error contraction on a quadratic, (κ−1)/(κ+1) at the best fixed step 2/(L+μ) ★; the heavy-ball rate (√κ−1)/(√κ+1) on quadratics ★; Newton's local quadratic convergence (sketch); KKT conditions for a small QP; the Lagrange multiplier as d(optimal cost)/d(constraint level).
- *Implement:* an autodiff engine passing gradient checks on 20 random compositions; optimizers with schedules; L-BFGS two-loop recursion ★; projected gradient.
- *Debug:* divergence from a step above 2/L; a sign or shape error caught by a gradient check; zig-zagging from unscaled features; a failed finite-difference check at a kink (ReLU, |x|) or from too small an h; Adam stalling because of ε or learning-rate settings.
- *Explain:* why κ governs GD; momentum as second-order dynamics; why Newton is invariant to linear reparameterization and GD is not; duality gap and strong duality; when SGD noise helps.

**Misconceptions and pitfalls**
1. [S] "The negative gradient points at the minimum." On an elongated bowl it can be nearly perpendicular to that direction. Show this with a κ slider.
2. [S] "A bigger learning rate is always faster." It oscillates, then diverges past 2/L.
3. [P] "Zero gradient means a minimum." Saddles and maxima also have zero gradient. Check the Hessian.
4. [E] "Convex functions have a unique minimizer." That needs strict or strong convexity.
5. [P] "Smaller h always gives a better finite-difference gradient." Round-off dominates below about 1e-8 for forward differences in float64.
6. [E] "Momentum just averages gradients." It is a damped second-order system, and tuning it means choosing the damping.
7. [P] "Adam always beats tuned SGD" and "Adam needs no tuning."
8. [E] "Lagrange multipliers are just an algebra trick." They are prices or sensitivities. Sign conventions and complementary slackness matter for inequalities.
9. [D] "Newton's method always converges." It needs a nearby start or a globalization strategy, and it can converge to a saddle.
10. [E] "Reverse-mode AD is symbolic differentiation" or "is finite differencing." It is neither.

**Mechanical-engineering bridges**
- **GD ↔ Richardson/Jacobi relaxation.** The step size plays the role of the relaxation factor, and SOR-style over-relaxation resembles momentum. CG (`hestenes1952-cg`) is the optimal Krylov method for the same quadratic.
- **Ill-conditioning ↔ stiff ODEs.** GD on a quadratic *is* explicit Euler on dx/dt = −∇f. The stable step is limited by the fastest mode (largest eigenvalue L), and convergence is limited by the slowest (μ). That is the same "stiffness" seen in transient heat-transfer simulations.
- **Momentum ↔ a damped mass–spring system** (m ẍ + c ẋ + ∇f = 0). The optimal momentum is near critical damping (`goh2017-momentum`, `polyak1964-heavy-ball`).
- Newton's method ↔ Newton–Raphson in nonlinear FEA and CFD. Levenberg–Marquardt ↔ damped curve fitting of pump and fan curves.
- **Lagrange multipliers ↔ reaction forces** in constrained mechanics (virtual work). **KKT complementarity ↔ contact mechanics** (gap ≥ 0, contact force ≥ 0, product = 0).
- **Economic dispatch of chillers.** The KKT condition gives "equal incremental kW/ton across running units", a classic plant-optimization result the learner can derive.

**Primary references:** `deisenroth2020-mml`, `boyd2004-convex-optimization`, `nocedal2006-numerical-optimization`, `goh2017-momentum`, `bottou2018-optimization`. *Supporting:* `baydin2018-autodiff`, `polyak1964-heavy-ball`, `robbins1951-sgd`, `hestenes1952-cg`, `sanderson-3b1b-calculus`, `cs229-stanford-2025`.

---

## Module 4 — Probability and statistics

**How leading resources sequence it**
- *Blitzstein & Hwang (Stat 110):* counting → conditional probability → random variables → expectation → continuous distributions → moments → joint distributions → transformations → conditional expectation → inequalities and limit theorems → Markov chains → MCMC → Poisson processes. Distributions are taught as "stories" that generate data.
- *Wasserman, All of Statistics:* probability compressed into five chapters, then inference (empirical CDF, bootstrap, parametric inference and MLE, testing and p-values, Bayesian inference, decision theory), then models (regression, multivariate, causal inference, graphical models, nonparametrics, classification, simulation). It was written for ML-oriented readers.
- *PML1 Part I:* univariate and multivariate probability → statistics (MLE, MAP, Bayesian, frequentist, bootstrap) → decision theory → information theory.
- *CS229:* probability review as a TA session in week 2. MLE appears inside linear regression ("probabilistic interpretation").
- *McElreath:* Bayesian from day one ("garden of forking data", then grid and quadratic approximation), using sampling to summarize posteriors.

**Where they disagree.** Frequentist first (Wasserman; most statistics programs) or Bayesian first (McElreath). Formal rigor or simulation-based intuition. How central hypothesis testing should be: it is minimal in ML texts and central in statistics programs and in big-tech experimentation.

**Recommended lesson sequence (8)**
1. **Conditional probability and Bayes' rule with base rates.** Running example: the "99% accurate" fault alarm on a fleet where faults are rare.
2. **Distributions as generative stories.** Bernoulli/Binomial, Poisson (alarm counts), Exponential/Weibull (time to failure), Normal, Gamma; expectation, variance, LOTUS, transformations.
3. **Multivariate thinking.** Joint, marginal and conditional distributions; covariance vs correlation; independence vs uncorrelatedness; the multivariate Gaussian and its conditioning formulas via the Schur complement ★, which prepares Kalman filtering (Module 25) and GPs.
4. **Limit theorems and Monte Carlo.** LLN, CLT, concentration (Chebyshev, Hoeffding); Monte Carlo error ∝ 1/√n; importance sampling.
5. **Likelihood and MLE.** Derivations for the core families; Fisher information and standard errors; least squares = Gaussian MLE; when MLE fails (separation, boundaries, small n).
6. **Bayesian inference and MAP.** Priors from engineering knowledge, conjugacy (Beta–Binomial, Normal–Normal), posterior predictive, MAP as regularized MLE (Gaussian prior → ridge, Laplace prior → lasso).
7. **Uncertainty for estimates.** Bootstrap (`efron1979-bootstrap`) and block bootstrap for dependent data; confidence vs credible vs prediction intervals.
8. **Testing as decision-making.** p-values and their misreadings (`wasserstein2016-pvalues`), power, permutation tests, multiple testing and FDR (`benjamini1995-fdr`); worked case: a cooling-setpoint A/B test (hand-off to Module 26).

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| Sampler zoo: inverse-CDF, Box–Muller, rejection sampling; checks with QQ-plots and KS tests | what "a distribution" means operationally | `numpy.random.Generator`, `scipy.stats` |
| NLL + optimizer MLE fitter for Weibull (fan/HDD lifetimes) and Poisson (alarm counts); Fisher-information SEs vs bootstrap SEs | likelihood and uncertainty | `scipy.stats.weibull_min.fit`, statsmodels |
| Conjugate updater with prior and likelihood sliders (Beta–Binomial failure probability; Normal–Normal sensor bias) | how evidence moves beliefs | PyMC (preview of Module 25) |
| Vectorized bootstrap and permutation-test engine | resampling inference | `scipy.stats.bootstrap`, `scipy.stats.permutation_test` |
| 1,000 "null sensors" multiple-testing simulator plus Benjamini–Hochberg | false discoveries | `statsmodels.stats.multitest.multipletests` |
| Gaussian conditioning calculator (partitioned mean and covariance) | preparation for Kalman filters and GPs | closed form vs Monte Carlo |

**Mastery benchmarks**
- *Derive:* posterior probability with base rates; MLEs for Gaussian (μ, σ²; show the σ² MLE is biased), Bernoulli, Poisson and Exponential; Fisher information and the asymptotic variance of the MLE ★; least squares ⇔ Gaussian MLE; MAP ⇔ ridge and lasso; the Beta–Binomial posterior; the multivariate Gaussian conditional ★; a CLT-based CI; why a p-value is not P(H₀ | data).
- *Implement:* the builds above, verified against scipy and statsmodels, plus a **coverage simulation**: run 10,000 replications and show that a 95% interval covers close to 95%, then break it with heavy tails or dependence.
- *Debug:* too-narrow bootstrap intervals on autocorrelated telemetry (fix with a block bootstrap); inflated false positives from optional stopping; Simpson's paradox in aggregated rack data.
- *Explain:* frequentist vs Bayesian probability; confidence vs prediction intervals; aleatoric vs epistemic uncertainty; when the CLT is a bad approximation.

**Misconceptions and pitfalls**
1. [E] "p = 0.03 means a 3% chance the null is true."
2. [E] "This 95% CI has a 95% chance of containing μ." The frequentist guarantee is about the procedure, not this one interval.
3. [P] "Uncorrelated implies independent." Counterexample: X symmetric, Y = X².
4. [S] "The CLT makes my data normal." It describes the sampling distribution of the mean. Show slow convergence for lognormal or Pareto data and failure under strong autocorrelation.
5. [P] Base-rate neglect: compute P(fault | alarm) for a rare fault and an accurate detector.
6. [P] "MLE is unbiased" (σ² counterexample) and "MLE always exists" (separable logistic data).
7. [D] "The bootstrap fixes tiny samples and works on time series unchanged."
8. [E] "Not significant means no effect." This ignores power.
9. [S] "Running 50 tests at α = 0.05 is fine."
10. [P] Regression to the mean: "the worst racks improved after the intervention."

**Mechanical-engineering bridges**
- **MLE ↔ least-squares curve fitting of lab data**, and uncertainty propagation from lab courses (root-sum-square/Kline–McClintock) ↔ the delta method and Monte Carlo propagation.
- Weibull ↔ reliability and fatigue life. Exponential ↔ constant hazard (MTBF). Poisson ↔ alarm arrivals. These are natural examples for data-center hardware.
- Instrument calibration certificates and Type A/B uncertainty ↔ priors and aleatoric/epistemic uncertainty.
- **Kalman filter (`kalman1960-filter`) = sequential Gaussian Bayesian updating.** The learner may have met it in controls or state estimation. Here it falls out of the Gaussian conditioning formulas.
- Statistical process control (control charts, false-alarm rate, average run length) ↔ hypothesis testing and multiple testing.
- Design of experiments from lab courses ↔ randomized experiments (Module 26).

**Primary references:** `blitzstein2019-probability`, `wasserman2004-all-of-statistics`, `murphy2022-pml1`, `efron1979-bootstrap`, `wasserstein2016-pvalues`. *Supporting:* `stat110-harvard-site`, `benjamini1995-fdr`, `efron2016-casi`, `kalman1960-filter`, `mcelreath2020-rethinking`.

---

## Module 5 — Information theory

**How leading resources sequence it**
- *MacKay ITILA:* opens with error-correcting codes (repetition, Hamming), then probability, entropy and inference → source coding (symbol and stream codes) → noisy-channel coding → long parts on inference (Monte Carlo, variational methods, Laplace, model comparison/Occam) and neural networks. It treats information theory and inference as one subject.
- *Cover & Thomas:* definitions (entropy, relative entropy, mutual information) → AEP → entropy rates → compression → gambling → channel capacity → differential entropy → Gaussian channel → rate–distortion → information theory and statistics (method of types, large deviations, hypothesis testing) → maximum entropy.
- *PML1 ch. 6:* compact ML-oriented version (entropy, cross-entropy, KL, mutual information, data-processing inequality) used for losses and model selection.
- *Olah (2015):* a visual, code-length explanation of entropy, cross-entropy and KL. A good model for the intuition stage.

**Where they disagree.** Coding first (Shannon, MacKay) or definitions first (Cover & Thomas, PML). How much channel coding to include: very little is needed for ML engineers, while cross-entropy, KL (including its direction), mutual information and max-entropy are essential.

**Recommended lesson sequence (6)**
1. **Surprise, entropy and optimal codes.** Shannon's idea (`shannon1948-communication`) through prefix codes and a Huffman build; bits vs nats.
2. **Cross-entropy and KL divergence.** Expected code length with the wrong code; KL as the excess; Gibbs' inequality; asymmetry.
3. **Likelihood meets information.** MLE ⇔ minimizing KL(empirical ‖ model); cross-entropy loss and log loss; perplexity; why classification uses cross-entropy rather than MSE.
4. **Mutual information.** Information gain for tree splits (feeds Module 8), feature screening, the data-processing inequality, and why MI estimation is hard.
5. **Maximum entropy and the Boltzmann bridge ★.** Constrained entropy maximization gives exponential families and softmax with temperature (`jaynes1957-maxent`).
6. **Information-based model selection.** AIC (`akaike1974-aic`), an intuition for MDL, forward vs reverse KL (mode-covering vs mode-seeking) as preparation for variational inference (Module 25).

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| Numerically safe entropy / cross-entropy / KL (zeros, clipping, logits via log-sum-exp) | stable implementations | `scipy.stats.entropy`, `scipy.special.rel_entr`, `sklearn.metrics.log_loss` |
| Huffman coder on a BMS alarm-message stream; average length vs entropy bound | the source-coding theorem, concretely | `heapq` reference; theoretical bound |
| Information-gain stump learner | split criteria | `DecisionTreeClassifier(criterion="entropy")` |
| Histogram vs k-NN (KSG-style) mutual-information estimators; bias on independent data | estimator bias | `sklearn.feature_selection.mutual_info_regression` |
| Max-entropy solver for a die with a fixed mean (Lagrange multipliers) and a temperature slider | max-ent → Boltzmann/softmax | closed form |
| Fit a single Gaussian to a bimodal mixture under forward vs reverse KL | KL direction | numerical optimization |

**Mastery benchmarks**
- *Derive:* entropy is maximized by the uniform distribution; KL ≥ 0 via Jensen; H(p,q) = H(p) + KL(p‖q); MLE ⇔ min KL; max-ent with moment constraints ⇒ an exponential family, and softmax as the special case ★; MI = KL(p(x,y) ‖ p(x)p(y)); differential entropy of a Gaussian; the data-processing inequality (statement and meaning).
- *Implement:* the builds, plus a logits-based log loss that matches scikit-learn to 1e-12 on extreme inputs.
- *Debug:* NaN from log(0); infinite KL from support mismatch; mixed log bases; "significant" MI between independent variables caused by estimator bias.
- *Explain:* why cross-entropy is a proper scoring rule and gives well-behaved gradients; forward vs reverse KL; why differential entropy can be negative; why information gain favors many-valued features.

**Misconceptions and pitfalls**
1. [P] "KL is a distance." Compute KL(p‖q) and KL(q‖p) for a concrete pair.
2. [E] "Entropy measures how disordered the data values are." It is a property of a distribution, and for continuous data it depends on binning.
3. [P] "Differential entropy behaves like discrete entropy." It can be negative and changes under reparameterization.
4. [P] "Zero correlation means zero mutual information" (and the converse error).
5. [P] "Lower log loss always means higher accuracy." Calibration and discrimination differ, and log loss punishes overconfidence.
6. [D] Information gain picking a server-ID column as the best split (high-cardinality bias; gain ratio as the fix).
7. [E] "Shannon entropy *is* thermodynamic entropy." They share mathematical form; Jaynes connects them through inference, but the units and meanings differ.
8. [D] Using MI estimates without checking their bias or variance.

**Mechanical-engineering bridges**
- **Thermodynamics is the strongest hook.** The Gibbs entropy −k_B Σ p ln p has the same form as Shannon entropy. The Boltzmann distribution p ∝ exp(−E/k_BT) is softmax with temperature, and Jaynes derived the canonical ensemble as a max-entropy problem. Free energy F = U − TS previews the variational free energy (ELBO) in Module 25.
- The second law and irreversibility ↔ the data-processing inequality (processing cannot create information about the source).
- ADC resolution and quantization ↔ entropy of a quantized signal: how many bits a 12-bit temperature reading really carries given sensor noise.

**Primary references:** `mackay2003-itila`, `cover2006-elements-it`, `murphy2022-pml1`, `olah2015-visual-information`. *Supporting:* `shannon1948-communication`, `jaynes1957-maxent`, `kullback1951-kl`, `akaike1974-aic`.

---

## Module 6 — Linear and logistic regression from scratch, regularization, bias–variance

**How leading resources sequence it**
- *CS229 (Fall 2025):* supervised setup and LMS → weighted least squares, logistic regression, Newton → dataset split, exponential family, GLMs → bias–variance and regularization → GDA and Naive Bayes.
- *ISLP:* the bias–variance idea and k-NN (ch. 2) → linear regression with inference, interactions and diagnostics (ch. 3) → classification: logistic, LDA/QDA, NB, k-NN, Poisson GLM (ch. 4) → resampling (ch. 5) → subset selection, ridge, lasso, PCR/PLS (ch. 6).
- *ESL:* linear methods for regression (LS, subset selection, shrinkage, LAR) and classification (LDA, logistic, separating hyperplanes); ch. 7 decomposes bias and variance formally.
- *Bishop PRML ch. 3–4 / MML ch. 9:* Bayesian linear regression and the evidence; regression via MLE, then MAP, then the Bayesian posterior; the geometric projection view.
- *Belkin et al. (2019):* "double descent" complicates the classical U-shaped risk curve.

**Where they disagree.** Statistical inference (ISLP/ESL: SEs, tests, diagnostics) or optimization (CS229: GD and Newton). Bayesian (Bishop, MML) or frequentist. Whether bias–variance is a formal decomposition (ESL) or a practical heuristic (CS229's ML advice). Whether to teach double descent at all.

**Recommended lesson sequence (8)**
1. **One model, three views.** Linear regression as projection, as Gaussian MLE, and as GD/normal equations; basis expansions ("linear in the parameters").
2. **Inference and diagnostics ★.** Standard errors and CIs; residual analysis; heteroscedasticity and WLS; leverage and the hat matrix; collinearity (VIF, κ); plus a minimum-viable honest split (preview of Module 7).
3. **Logistic regression.** Bernoulli likelihood, log-odds, convexity, gradient and Hessian, Newton/IRLS; perfect separation; softmax regression.
4. **GLMs and the exponential family.** Poisson regression for alarm counts, link functions, canonical links, deviance.
5. **Bias and variance.** Derive the decomposition for squared loss; simulate it (polynomial degree, k in k-NN, λ); learning curves; double descent with min-norm interpolation (`belkin2019-double-descent`) as a "beyond the textbook" lesson.
6. **Ridge, Tikhonov and conditioning.** MAP with a Gaussian prior; SVD shrinkage factors d²/(d²+λ); effective degrees of freedom; GCV and closed-form LOO (`golub1979-gcv`); why standardization matters.
7. **Lasso and elastic net.** L1 geometry, subgradients and soft-thresholding, coordinate descent and warm-started paths (`friedman2010-glmnet`), Laplace-prior MAP, selection instability with correlated features, the elastic-net fix (`zou2005-elastic-net`).
8. **Capstone: chiller-plant power model.** Fit kW from load, condenser-water and wet-bulb temperatures using basis expansions and regularization; compare with a physics-shaped regression; report calibrated uncertainty; state explicitly which coefficient readings are *not* causal (hook to Module 26).

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| OLS via QR and SVD; WLS; full coefficient table with SEs | estimation + inference | `statsmodels.OLS` (summary); `sklearn.linear_model.LinearRegression` (no SEs) |
| Logistic regression by GD, Newton/IRLS and L-BFGS, with an optional L2 term | optimization ↔ statistics | `sklearn.linear_model.LogisticRegression` (regularized by default; check the 1.9 docs for how to turn the penalty off), `statsmodels.Logit` |
| Poisson GLM via IRLS | GLM machinery | `sklearn.linear_model.PoissonRegressor`, `statsmodels.GLM` |
| Ridge via augmented least squares and via one SVD reused for a whole λ path; closed-form LOO/GCV | cheap model selection | `RidgeCV` (efficient LOO) |
| Lasso by cyclic coordinate descent with soft-thresholding and warm starts | sparsity mechanics | `Lasso`, `LassoCV`, `lasso_path` |
| Bias–variance simulator (resample datasets, decompose error empirically; sliders for degree, λ, n) | the trade-off as a measurement | theory curves |
| Random-features regression sweeping width past the interpolation threshold | double descent | `belkin2019-double-descent` qualitative curves |

**Mastery benchmarks**
- *Derive:* normal equations; unbiasedness and covariance σ²(XᵀX)⁻¹ of OLS (Gauss–Markov statement); hat-matrix properties (idempotent, trace = p); logistic gradient and Hessian, plus convexity; IRLS as Newton; the bias–variance decomposition; ridge in closed form and via SVD shrinkage; effective df = Σ d²ᵢ/(d²ᵢ+λ) ★; the soft-threshold solution for orthonormal designs; the LOOCV shortcut for linear smoothers ★; MAP equivalences.
- *Implement:* everything above, matching statsmodels or scikit-learn to ~1e-6 relative error on well-conditioned problems, with unit tests.
- *Debug:* unscaled features under a penalty; "why don't my sklearn logistic coefficients match statsmodels?" (default regularization); diverging coefficients under separation; the dummy trap; scaling fitted on all data before the split; wild polynomial extrapolation; causal readings of coefficients.
- *Explain:* why lasso selects and ridge shrinks; why standardization matters for penalized fits and not for OLS predictions; prediction vs confidence intervals; what double descent does and does not imply for practice.

**Misconceptions and pitfalls**
1. [E] "Linear regression can't fit curves." It is linear in the parameters, and basis expansions handle curvature.
2. [P] "High R² means a good (or causal) model."
3. [P] "Bigger coefficient means more important feature." That depends on scale and collinearity.
4. [D] Choosing λ on the test set.
5. [S] "Lasso finds the true features." Show selection flipping between correlated features across bootstrap resamples.
6. [E] "Logistic regression is least squares on probabilities." It is Bernoulli MLE, and MSE on a sigmoid is non-convex.
7. [D] "sklearn's LogisticRegression is plain MLE by default."
8. [S] "Test error vs complexity is always U-shaped" (double descent; averaging ensembles).
9. [P] "Adding features never hurts" (training vs test error; spurious fits).
10. [D] "Standardizing on the full dataset before CV is harmless." It is mild for scaling and severe for target-dependent steps.

**Mechanical-engineering bridges**
- **Ridge is Tikhonov regularization** from inverse problems. The classic example is the *inverse heat-conduction problem*: estimating surface heat flux from interior thermocouples is ill-posed and is stabilized with Tikhonov plus the L-curve or GCV (`hansen1998-rank-deficient`, `golub1979-gcv`). Levenberg–Marquardt damping is the same idea applied to nonlinear fits.
- Ridge as K + λI, a "spring to ground" that makes a singular stiffness matrix invertible.
- **Heat-transfer correlations** (Nu = C·Re^m·Pr^n) are fit by log-linear regression. The log transform changes the error model from multiplicative to additive, which opens a discussion of WLS vs a GLM with a log link.
- Logistic regression ↔ fragility curves (probability of failure vs load) from reliability engineering.
- Overfit polynomial calibration curves and Runge's phenomenon ↔ variance. Choosing model order in system identification ↔ bias–variance.

**Primary references:** `cs229-stanford-2025`, `james2023-islp`, `hastie2009-esl`, `bishop2006-prml`, `belkin2019-double-descent`. *Supporting:* `hoerl1970-ridge`, `tibshirani1996-lasso`, `zou2005-elastic-net`, `friedman2010-glmnet`, `golub1979-gcv`, `hansen1998-rank-deficient`, `hastie2015-sparsity`, `deisenroth2020-mml`.

---

## Module 7 — Model evaluation (CV, metrics, calibration, leakage, imbalance)

**How leading resources sequence it**
- *ISLP:* resampling (validation set, LOOCV, k-fold, bootstrap) as ch. 5, right after classification. Confusion matrices and ROC appear inside ch. 4.
- *ESL ch. 7:* bias–variance, optimism of training error, AIC/BIC/MDL, VC dimension, CV, bootstrap (.632). Includes the famous demonstration of the **wrong way to cross-validate** (screening features on all data first).
- *CS229 Fall 2025:* dataset splitting in lecture 4, evaluation metrics as a TA lecture in week 4, "ML advice" in lecture 13.
- *scikit-learn 1.9 guide:* ch. 3 (CV, tuning, metrics, validation curves) and ch. 12 "Common pitfalls" (inconsistent preprocessing, leakage, randomness control) (`sklearn-common-pitfalls`).
- *Research literature that intro courses usually skip:* leakage formalized (`kaufman2012-leakage`) and documented as a cross-field reproducibility problem (`kapoor2023-leakage`); nested CV (`varma2006-nested-cv`) and selection bias (`cawley2010-selection-bias`); structured CV for temporal, grouped and spatial data (`roberts2017-structured-cv`, `bergmeir2012-ts-cv`); PR vs ROC under imbalance (`saito2015-pr-roc`); calibration (`niculescu-mizil2005-probabilities`, `zadrozny2002-isotonic`, `guo2017-calibration`); proper scoring rules (`gneiting2007-proper-scoring`); the harm of resampling-based imbalance fixes for calibrated risk (`vandengoorbergh2022-imbalance`).

**Where they disagree.** ROC-AUC or PR-based metrics. Resampling (SMOTE, `chawla2002-smote`) or cost-sensitive thresholds and class weights. CV or a single holdout for large data. Whether calibration is taught at all. Most intro courses barely mention it, yet it matters for any model whose probabilities drive operations decisions.

**Recommended lesson sequence (8)**
1. **A test score is an estimate.** What a held-out score estimates; its variance (binomial CI for accuracy; bootstrap CIs); why "one number" is not enough.
2. **Cross-validation done right.** k-fold, stratified, repeated; nested CV for selection plus assessment; replicate the ESL "wrong way" on pure-noise labels.
3. **Mirror deployment in the split ★.** Grouped CV (per rack, server, site), forward-chaining time splits with gaps, spatial and blocked CV (`roberts2017-structured-cv`, `bergmeir2012-ts-cv`). Rule: the split should reproduce the deployment question.
4. **The leakage taxonomy ★.** Target and proxy leakage, temporal leakage (features computed with future data), preprocessing fit on all data, duplicates across splits, group leakage; Kaufman's legitimacy framing and a checklist in the spirit of Kapoor & Narayanan's model info sheets.
5. **Metrics that match the decision.** Confusion matrix, precision, recall, F-scores, ROC vs PR, cost-based thresholds; regression metrics (MAE, RMSE, MAPE's failure near zero, pinball loss).
6. **Probabilities ★.** Proper scoring rules (log loss, Brier); reliability diagrams and ECE pitfalls; Platt vs isotonic vs temperature scaling; calibrate on held-out data only.
7. **Imbalance.** Why accuracy misleads; class weights vs resampling vs threshold moving; resampling distorts probabilities (`vandengoorbergh2022-imbalance`); alarm fatigue as the operational cost.
8. **Comparing models honestly, plus capstone.** Paired comparisons and their pitfalls (`dietterich1998-tests`, `raschka2018-evaluation`), selection bias across many experiments, error analysis by slice. Capstone: evaluate a **CRAH/CRAC fault-detection classifier** using grouped forward-chaining CV, a cost-based alarm threshold, and calibration.

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| KFold, StratifiedKFold, GroupKFold and forward-chaining splitters (with gap) | split semantics | `sklearn.model_selection` splitters (exact index match where deterministic) |
| Nested-CV harness; optimism of non-nested selection on random labels (true AUC 0.5) | selection bias | `GridSearchCV` inside `cross_val_score` |
| ESL "wrong way" replication (feature screening outside CV) | leakage through selection | correct pipeline version |
| Metrics library: ROC with ties, AUC via Mann–Whitney, PR curve and average precision (step vs trapezoid), Brier, log loss, ECE variants | metric internals | `sklearn.metrics` (`roc_auc_score`, `average_precision_score`, `brier_score_loss`, `log_loss`, `calibration_curve`) |
| Calibrators: Platt (logistic on scores), isotonic via PAVA, temperature scaling | calibration mechanics | `CalibratedClassifierCV` (with internal CV) |
| **Leakage-hunt lab:** a telemetry dataset seeded with five leaks (centered rolling window, server-ID proxy, duplicate rows across splits, target encoding on all data, a post-outcome maintenance flag) | detection habits | the learner's fixed pipeline vs the leaky score |

**Mastery benchmarks**
- *Derive:* AUC = P(score of a random positive > score of a random negative) ★; the Bayes-optimal threshold for costs c_FP and c_FN (predict positive when p > c_FP/(c_FP + c_FN)) ★; propriety of log loss and Brier (expected score minimized by the true probability) ★; the variance of a held-out accuracy estimate; why nested CV is needed; Platt scaling as one-feature logistic regression.
- *Implement:* splitters, metrics, calibrators and nested CV, tested against scikit-learn.
- *Debug:* find all five leaks; spot shuffled time series; group leakage (same server in train and test); a high-ROC, useless-at-low-prevalence detector; calibration broken by oversampling; a threshold tuned on the test set; calibration fit on training predictions.
- *Explain:* which quantity each protocol estimates; why PR is more informative at low prevalence; discrimination vs calibration; when ECE misleads; how operations costs (missed fault vs false page) set the threshold.

**Misconceptions and pitfalls**
1. [P] "95% accuracy is good" at a 2% positive rate.
2. [E] "ROC-AUC is always the right metric because it ignores imbalance." Prevalence-invariance hides poor precision.
3. [S] "The best CV score is an unbiased estimate of the chosen model" (selection bias).
4. [D] Random k-fold on time series or grouped data.
5. [D] Imputation, scaling, feature selection or target encoding fit before splitting.
6. [P] "Higher AUC means better probabilities."
7. [S] "SMOTE improves probability estimates." Show reliability before and after.
8. [E] "0.5 is the natural threshold."
9. [P] "Lower RMSE means a better decision" (asymmetric costs; MAPE near zero load).
10. [D] Reusing the test set across many experiments.
11. [D] Calibrating on the training data.

**Mechanical-engineering bridges**
- **Verification vs validation** of CFD and FEA models ↔ model evaluation. "Validation domain" ↔ deployment distribution. Holdout experiments ↔ test sets.
- Instrument calibration curves (indicated vs true) ↔ reliability diagrams.
- **HVAC fault detection and diagnostics (FDD):** false alarms vs missed faults ↔ precision vs recall. Alarm fatigue in building management systems ↔ the cost of low precision.
- Time-based splits ↔ "you can't use next week's weather to forecast this week's chiller load."
- Grouped CV ↔ testing a correlation on a different rig, building or site than the one used to fit it (transferability, similitude).

**Primary references:** `kaufman2012-leakage`, `kapoor2023-leakage`, `varma2006-nested-cv`, `roberts2017-structured-cv`, `niculescu-mizil2005-probabilities`, `guo2017-calibration`. *Supporting:* `cawley2010-selection-bias`, `bergmeir2012-ts-cv`, `saito2015-pr-roc`, `gneiting2007-proper-scoring`, `zadrozny2002-isotonic`, `vandengoorbergh2022-imbalance`, `chawla2002-smote`, `dietterich1998-tests`, `raschka2018-evaluation`, `sklearn-common-pitfalls`, `sklearn-user-guide-1-9`, `hastie2009-esl`.

---

## Module 8 — Trees, random forests, gradient boosting (XGBoost/LightGBM internals)

**How leading resources sequence it**
- *ISLP ch. 8:* regression and classification trees (recursive binary splitting, cost-complexity pruning) → bagging → random forests → boosting (simple version) → BART.
- *ESL:* trees (§9.2) → boosting and additive trees (ch. 10: AdaBoost as forward-stagewise additive modeling with exponential loss, gradient boosting, shrinkage and subsampling, relative importance, partial dependence) → random forests (ch. 15) → ensembles (ch. 16).
- *CS229 Fall 2025:* decision trees (lecture 9) and boosting (lecture 10), after kernels and EM.
- *Primary papers:* `breiman2001-random-forests` (strength vs correlation, OOB estimates); `freund1997-adaboost`; `friedman2000-additive-logistic` (the statistical view of boosting); `friedman2001-gbm` (functional gradient descent with loss-specific leaf values); `friedman2002-stochastic-gb` (row subsampling); `chen2016-xgboost` (second-order objective, regularized leaves, sparsity-aware splits, weighted quantile sketch, cache-aware blocks); `ke2017-lightgbm` (histograms, GOSS, EFB, leaf-wise growth); `prokhorenkova2018-catboost` (prediction shift, ordered boosting, ordered target statistics); `strobl2007-importance-bias`; `lundberg2020-treeshap`; `grinsztajn2022-tabular-trees`.

**Where they disagree.** Intro texts treat boosting lightly. ESL and Friedman stress the statistical view (functional GD). Practitioners and interviewers care about the XGBoost/LightGBM/CatBoost internals and tuning. For interpretation, the options are impurity importance, permutation importance or SHAP, and each answers a different question.

**Recommended lesson sequence (8)**
1. **CART.** Greedy recursive partitioning; Gini, entropy and MSE criteria; O(n log n) split search with sorted cumulative sums; stopping rules and cost-complexity pruning; trees as piecewise-constant functions.
2. **Averaging to cut variance.** Bagging, random forests (feature subsampling, strength–correlation trade-off), OOB error, extra-trees.
3. **Boosting as additive modeling.** AdaBoost as forward-stagewise minimization of exponential loss; the margin view.
4. **Gradient boosting = gradient descent in function space.** Pseudo-residuals; per-leaf line search; squared, absolute, Huber, logistic and quantile losses; shrinkage and subsampling.
5. **Second-order boosting: XGBoost internals ★.** Taylor expansion of the loss; optimal leaf weight; the split-gain formula with λ and γ; min-child-weight as a Hessian budget; missing-value default directions; weighted quantile sketch.
6. **Scaling tricks ★.** Histogram binning; LightGBM's GOSS and EFB and the overfitting risk of leaf-wise growth; CatBoost's ordered boosting and ordered target statistics; native categorical handling; monotone and interaction constraints.
7. **Interpretation and its traps.** Impurity-importance bias; permutation importance under correlated features; PDP and ICE; TreeSHAP; extrapolation failure.
8. **Tuning and production capstone.** Early stopping on a time-ordered validation set; the learning-rate vs n_estimators trade-off; depth and leaves; regularization; quantile boosting for intervals; model size and latency. Capstone: predict **chiller-plant kW or PUE** from weather and IT load with LightGBM vs a physics-shaped baseline, enforcing physically sensible monotone constraints.

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| CART regressor/classifier with sorted-feature split search and pruning | greedy partitioning, complexity | `DecisionTreeRegressor/Classifier` (identical splits on toy data; check tie-breaking) |
| Random forest with OOB estimate | bagging + OOB | `RandomForestRegressor(oob_score=True)` |
| Gradient boosting with pluggable losses (squared/absolute/logistic/quantile) on your own trees | functional GD | `GradientBoostingRegressor`, `HistGradientBoostingRegressor` |
| **Second-order histogram booster** with λ, γ, min-child-weight; verify leaf values and gains against XGBoost on a depth-1, single-round model by dumping its JSON (target: exact match) ★ | the XGBoost objective | `xgboost` (3.4.x) model dump |
| Naive target encoding vs ordered (CatBoost-style) target statistics; measure the train/test gap | prediction shift/leakage | `catboost` behavior; `sklearn.preprocessing.TargetEncoder` |
| Impurity vs permutation vs SHAP importances on data with a random high-cardinality ID column | importance bias | `sklearn.inspection.permutation_importance`, `shap` TreeExplainer |

**Mastery benchmarks**
- *Derive:* impurity decrease for Gini and entropy; the optimal constant leaf for squared loss (mean) and absolute loss (median); bagged-ensemble variance ρσ² + (1−ρ)σ²/B ★; AdaBoost weights from exponential loss; pseudo-residuals as negative gradients; **the XGBoost leaf weight w* = −G/(H+λ) and the split gain ½[G_L²/(H_L+λ) + G_R²/(H_R+λ) − (G_L+G_R)²/(H_L+H_R+λ)] − γ** ★; logistic-loss gradient p − y and Hessian p(1 − p); why histograms cut per-node cost from O(n) to O(#bins) per feature.
- *Implement:* CART, RF with OOB, GBM with custom losses, and the second-order booster that matches XGBoost on toy cases.
- *Debug:* leaf-wise overfitting on small data; early stopping on shuffled time series; target-encoding leakage; an ID column topping impurity importance; flat predictions beyond the training range; `scale_pos_weight` distorting probabilities; categorical codes treated as ordered.
- *Explain:* why more RF trees don't overfit but more boosting rounds can; the learning-rate/rounds trade-off; invariance to monotone feature transforms; why trees win on typical tabular data (irregular target functions, uninformative features, no rotation invariance; `grinsztajn2022-tabular-trees`); why boosted probabilities need a calibration check.

**Misconceptions and pitfalls**
1. [S] "More trees make a random forest overfit." Error plateaus as trees are added.
2. [S] "More boosting rounds is always better" (early stopping; shrinkage).
3. [D] "Impurity importance is trustworthy" (`strobl2007-importance-bias`).
4. [P] "Trees need standardized features."
5. [P] "Trees extrapolate the trend." Predict the forecast for loads above the training maximum.
6. [E] "Boosting fits residuals." That is true only for squared loss. In general it fits negative gradients.
7. [D] "Label-encode the categories and LightGBM/XGBoost will cope." This imposes an artificial order, or leaks if encoded naively.
8. [E] "Permutation importance tells me what happens if I change the feature." It is not causal, and correlated features mask each other.
9. [S] "Deeper trees are better in boosting." Shallow trees often win; depth sets the order of interactions.
10. [E] "SHAP values are causal effects."

**Mechanical-engineering bridges**
- Decision trees ↔ troubleshooting flowcharts and fault trees, and HVAC sequences of operation ("if outdoor air < setpoint, open economizer...").
- Piecewise-constant models ↔ controller lookup tables (chiller performance maps, tabulated psychrometric properties).
- **Boosting ↔ iterative defect correction.** Each stage solves for the residual of the previous approximation, as in multigrid residual correction.
- Ensemble averaging ↔ sensor redundancy. The variance reduction depends on the correlation ρ, so common-mode error does not average out.
- Monotone constraints ↔ physics (power rises with load; efficiency curves have known shapes).
- Quantile boosting ↔ percentile-based design conditions (design days are defined by exceedance percentiles).

**Primary references:** `friedman2001-gbm`, `breiman2001-random-forests`, `chen2016-xgboost`, `ke2017-lightgbm`, `prokhorenkova2018-catboost`. *Supporting:* `hastie2009-esl`, `james2023-islp`, `freund1997-adaboost`, `friedman2000-additive-logistic`, `friedman2002-stochastic-gb`, `strobl2007-importance-bias`, `lundberg2020-treeshap`, `grinsztajn2022-tabular-trees`, `cs229-stanford-2025`.

---

## Module 9 — SVMs, kernels, k-NN

**How leading resources sequence it**
- *CS229:* kernels and SVM (lecture 7) after GDA/NB and before k-means/EM, using Lagrangian duality from the convex-optimization review.
- *ISLP ch. 9:* maximal-margin classifier → soft-margin support vector classifier → kernel SVM → relation to logistic regression (hinge vs logistic loss). k-NN appears early (ch. 2 and 4) as the nonparametric reference point.
- *ESL:* SVMs and flexible discriminants (ch. 12); prototypes and nearest neighbors (ch. 13); kernel smoothing (ch. 6).
- *MML ch. 12:* separating hyperplanes → primal → dual → kernels → numerical solution.
- *PML1:* exemplar methods (k-NN, metric learning, KDE) in ch. 16; kernel methods (Mercer kernels, **GPs**, SVMs) together in ch. 17.
- *Primary sources:* `cortes1995-svm`, `platt1998-smo`, `chang2011-libsvm`, `scholkopf2002-kernels`, `rahimi2007-random-features`, `cover1967-nn` (asymptotic 1-NN error is at most twice the Bayes error), `beyer1999-nn-meaningful` (distance concentration), `malkov2020-hnsw` and `johnson2021-faiss` (approximate nearest-neighbor search).

**Where they disagree.** Margin geometry first (ISLP, CS229) or "hinge loss + L2" first (ESL §12.3). How much RKHS theory. Whether k-NN is a teaching toy (intro texts) or core infrastructure (vector search in retrieval systems).

**Recommended lesson sequence (6)**
1. **k-NN and the geometry of distance.** Bias–variance in k; feature scaling and metric choice; the Cover–Hart bound; the curse of dimensionality and distance concentration (`beyer1999-nn-meaningful`).
2. **Fast neighbors ★.** KD-trees and ball trees; approximate NN with HNSW graphs and IVF/product quantization; recall vs latency vs memory.
3. **Max-margin linear classifiers.** Geometric margin; hard vs soft margin; SVM = hinge loss + L2; side-by-side with logistic regression; subgradient/SGD training.
4. **Duality and support vectors.** Lagrangian, KKT conditions, complementary slackness, the dual QP, SMO (`platt1998-smo`); which points become support vectors and why.
5. **Kernels.** Feature maps, the kernel trick, the PSD (Mercer) condition, RBF bandwidth γ vs C, kernel ridge regression, kernel-matrix conditioning and jitter.
6. **Scaling kernels and the GP bridge.** Random Fourier features (`rahimi2007-random-features`) and Nyström; kernel ridge ↔ the GP posterior mean (feeds Module 25); when kernels lose to boosting in practice.

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| Chunked, vectorized k-NN classifier/regressor; timing vs n and d | neighbors at scale | `KNeighborsClassifier` (brute / kd_tree / ball_tree) |
| Distance-concentration experiment: (max−min)/min distance vs dimension | curse of dimensionality | theory |
| IVF index (k-means coarse quantizer + inverted lists), plus a small HNSW-style graph ★; recall@k vs brute force | ANN trade-offs | `faiss`, `hnswlib` |
| Linear SVM by primal subgradient descent, then a simplified SMO for the dual; compare support vectors and decision values | primal/dual | `SVC(kernel="linear")`; `LinearSVC` (note its default squared-hinge loss) |
| Kernel ridge with RBF; random Fourier features approximation error vs number of features | kernels, approximation | `KernelRidge`, `RBFSampler`, `Nystroem` |
| PSD checks and jitter for kernel matrices | numerical hygiene | `np.linalg.eigvalsh`, `cholesky` |

**Mastery benchmarks**
- *Derive:* margin = 2/‖w‖; the soft-margin primal and its hinge-loss form; the Lagrangian dual; the KKT conditions with the meaning of αᵢ (0 → not a support vector, 0 < α < C → on the margin, α = C → violating) ★; the representer theorem (statement); the kernel ridge solution α = (K + λI)⁻¹y; the random-features construction from Bochner's theorem (sketch) ★; the Cover–Hart bound (statement and intuition).
- *Implement:* SMO-lite, kernel ridge, RFF, a KD-tree, and an IVF ANN index with a measured recall/latency curve.
- *Debug:* RBF on unscaled features; γ too large (memorizes) or too small (underfits); confusing C as regularization strength; `LinearSVC` vs `SVC` loss and penalty differences; `SVC(probability=True)` running internal-CV Platt scaling that can disagree with `predict`; Euclidean distance on mixed one-hot and continuous features.
- *Explain:* why only support vectors matter; how kernels give infinite-dimensional features at finite cost; O(n²) memory and roughly O(n²)–O(n³) training cost; when k-NN works (low intrinsic dimension).

**Misconceptions and pitfalls**
1. [P] "SVMs output probabilities." They output margins; Platt scaling is needed.
2. [E] "The kernel trick computes the high-dimensional features."
3. [D] "Any similarity is a kernel." It must be PSD; build an indefinite counterexample.
4. [P] "k-NN has no training, so it's cheap." Prediction cost and memory dominate.
5. [S] "k = 1 always overfits, larger k always helps" (noise, bias–variance).
6. [S] "Euclidean distance is fine in 500 dimensions."
7. [P] "Larger C means more regularization." It is the opposite.
8. [E] "SVMs are immune to imbalance and outliers."
9. [P] "ANN search returns exact neighbors" (recall < 1 by design).

**Mechanical-engineering bridges**
- Kernels ↔ Green's functions and influence coefficients. RBF interpolation for mesh morphing and response surfaces. **Kriging (GP regression) is the standard engineering surrogate model** for expensive simulations.
- Support vectors ↔ active constraints and contact points. Only the constraints at the boundary carry load, and their multipliers are the "reaction forces".
- k-NN ↔ analog forecasting (find historical days with similar weather to predict tomorrow's cooling load).
- Curse of dimensionality ↔ design-of-experiments coverage. Full factorial grids become impossible, which is why Latin-hypercube sampling exists.
- Random features ↔ truncated Fourier or modal superposition.

**Primary references:** `cortes1995-svm`, `scholkopf2002-kernels`, `rahimi2007-random-features`, `cover1967-nn`, `malkov2020-hnsw`. *Supporting:* `platt1998-smo`, `chang2011-libsvm`, `beyer1999-nn-meaningful`, `johnson2021-faiss`, `deisenroth2020-mml`, `murphy2022-pml1`, `james2023-islp`.

---

## Module 10 — Unsupervised learning (clustering, PCA, GMM/EM, dimensionality reduction)

**How leading resources sequence it**
- *ISLP ch. 12:* PCA (with matrix completion) → k-means and hierarchical clustering. It comes late in the book.
- *ESL ch. 14:* association rules → clustering → self-organizing maps → PCA and principal curves → NMF → ICA → MDS and nonlinear embeddings. EM is covered in ch. 8.
- *CS229 Fall 2025:* k-means, GMM and EM in lecture 8 (EM derived via Jensen's inequality, i.e. the ELBO); PCA much later (lecture 16).
- *MML:* PCA from four angles (maximum variance, projection, eigenvectors, low-rank approximation) plus probabilistic PCA; GMM fit with EM.
- *Bishop PRML:* mixture models and general EM (ch. 9); continuous latent variables: PCA, PPCA, factor analysis, kernel PCA, ICA (ch. 12).
- *Brunton & Kutz:* opens the whole book with the SVD/PCA/POD; clustering and classification in Part II.
- *VMLS:* k-means appears in ch. 4, before matrices.
- *Key papers:* `lloyd1982-kmeans`, `arthur2007-kmeanspp`, `dempster1977-em`, `ester1996-dbscan`, `campello2013-hdbscan`, `rousseeuw1987-silhouette`, `jolliffe2016-pca`, `halko2011-randomized`, `vandermaaten2008-tsne`, `mcinnes2018-umap`, `wattenberg2016-tsne`, `kobak2021-init`.

**Where they disagree.** PCA first (MML, ISLP, Brunton & Kutz) or clustering first (CS229, VMLS). Probabilistic latent-variable framing (Bishop: PPCA and GMM via EM) or algorithmic framing (Lloyd's k-means). Depth on t-SNE and UMAP: textbooks cover them thinly, while practitioners overuse and misread them.

**Recommended lesson sequence (7)**
1. **PCA two ways.** Maximum variance and minimum reconstruction error, unified by the SVD (built in Module 2); scree plots; the centering and scaling decisions; PCA is not feature selection.
2. **PCA in practice ★.** Randomized SVD (`halko2011-randomized`); incremental PCA for streaming telemetry; whitening; PCA-based sensor-fault detection (SPE/Q and Hotelling T² statistics); **POD of a temperature field**.
3. **k-means.** Objective; Lloyd's algorithm as coordinate descent; local minima; k-means++ seeding; choosing k (elbow, silhouette, gap) and the spherical-cluster assumption behind it.
4. **Gaussian mixtures and EM ★.** Latent variables; E and M steps derived; EM as coordinate ascent on the ELBO (Jensen); covariance types; singular collapse and regularization; BIC for choosing k.
5. **Density and hierarchy.** Agglomerative clustering and linkage choices; DBSCAN and HDBSCAN (core points, ε, noise label); which assumption suits which data.
6. **Evaluating clusters without labels.** Silhouette, stability under resampling, ARI when labels exist; the "clusters always appear" demo on pure noise.
7. **Nonlinear embeddings and capstone.** How t-SNE and UMAP work (perplexity, neighbors, initialization); what embedding distances do and do not mean (`wattenberg2016-tsne`, `kobak2021-init`). Capstone: **discover operating modes in chiller-plant data** (economizer vs partial vs full mechanical cooling) with PCA plus GMM/HDBSCAN, validated against the plant's logged mode.

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| PCA via SVD and via covariance eigen-decomposition; reconstruction error vs k; sign conventions | PCA mechanics | `sklearn.decomposition.PCA` (`svd_solver` options) |
| Randomized SVD with oversampling and power iterations | accuracy vs cost | `sklearn.utils.extmath.randomized_svd` |
| Lloyd + k-means++ with restarts; monotone-objective test | coordinate descent, seeding | `sklearn.cluster.KMeans` |
| GMM via EM with log-sum-exp responsibilities and covariance regularization; non-decreasing log-likelihood test | EM | `sklearn.mixture.GaussianMixture` (`reg_covar`, `lower_bound_`, `bic`) |
| DBSCAN with neighborhood queries | density clustering | `sklearn.cluster.DBSCAN`, `sklearn.cluster.HDBSCAN` |
| Vectorized silhouette | internal validation | `sklearn.metrics.silhouette_score` |
| Minimal exact t-SNE for small n (perplexity calibration, early exaggeration) | what the knobs do | `sklearn.manifold.TSNE`, `umap-learn` |

**Mastery benchmarks**
- *Derive:* the equivalence of max-variance, min-reconstruction and top-k SVD (via Eckart–Young); λᵢ = σᵢ²/(n−1); monotone decrease of the k-means objective; GMM E- and M-steps; ELBO = log p(x) − KL(q ‖ p(z|x)) and why EM never decreases the likelihood ★; k-means as the zero-variance limit of an isotropic GMM ★; the silhouette definition; why t-SNE uses a heavy-tailed kernel (the crowding problem) ★.
- *Implement:* all builds, with invariant tests (objective monotonicity, likelihood monotonicity, PCA reconstruction matching scikit-learn to ~1e-8).
- *Debug:* PCA without centering; one variable dominating because of units; GMM collapse onto a single point; k-means on elongated or varying-density clusters; "clusters" in t-SNE of noise; over-reading UMAP inter-cluster distances; label switching when comparing runs.
- *Explain:* PCA as rotation plus truncation; when PCA fails (nonlinear manifolds, outliers; robust PCA as the alternative); PCA vs factor analysis vs ICA; why EM is local; why t-SNE and UMAP are for looking, not measuring.

**Misconceptions and pitfalls**
1. [E] "PCA finds the most predictive features." Variance is not relevance to the target.
2. [D] "Centering and scaling don't matter for PCA."
3. [E] "Principal components are physical modes." Sometimes they resemble them, but they are data-optimal bases.
4. [S] "k-means discovers the true number of clusters." It partitions uniform noise just as confidently.
5. [S] "EM finds the global maximum." Run it with several seeds and compare.
6. [S] "Cluster sizes and gaps in t-SNE are meaningful" (`wattenberg2016-tsne`).
7. [E] "UMAP inherently preserves global structure better than t-SNE." This is largely an initialization effect (`kobak2021-init`).
8. [E] "A good silhouette proves the clusters are real."
9. [P] "Clusterings are stable across seeds."

**Mechanical-engineering bridges**
- **PCA/SVD = POD.** Snapshot matrices of flow or temperature fields; "energy" captured ↔ explained variance; truncation ↔ reduced-order models (`berkooz1993-pod`, `taira2017-modal`, `brunton2022-ddse`). DMD (`schmid2010-dmd`) extends this to dynamics, a pointer to the time-series modules.
- Principal stresses and Mohr's circle ↔ PCA of a 2-D covariance.
- GMM/EM ↔ separating operating regimes (part load vs full load; flow regimes). k-means ↔ clustering load profiles into "typical days" for energy modeling.
- PCA-based monitoring (SPE/Q and T²) is classic multivariate statistical process control from chemical and process plants, and applies directly to HVAC telemetry.

**Primary references:** `jolliffe2016-pca`, `dempster1977-em`, `arthur2007-kmeanspp`, `wattenberg2016-tsne`, `brunton2022-ddse`. *Supporting:* `halko2011-randomized`, `lloyd1982-kmeans`, `ester1996-dbscan`, `campello2013-hdbscan`, `rousseeuw1987-silhouette`, `vandermaaten2008-tsne`, `mcinnes2018-umap`, `kobak2021-init`, `bishop2006-prml`, `deisenroth2020-mml`, `berkooz1993-pod`, `taira2017-modal`, `schmid2010-dmd`.

---

## Module 11 — Feature engineering and data pipelines

**How leading resources sequence it**
- *Kuhn & Johnson, FES (2019):* the predictive-modeling process → exploratory visualization → encoding categorical predictors (dummies, hashing, supervised effect encodings) → engineering numeric predictors (transformations, splines; binning discouraged; projections) → interactions → missing data → **profile data** (repeated measurements such as sensor traces) → feature selection (overview, greedy, global search).
- *scikit-learn 1.9:* Pipelines and ColumnTransformer, preprocessing (including `TargetEncoder`, which cross-fits inside `fit_transform`), imputation, `set_output` for dataframe outputs, and "Common pitfalls".
- *Research and production literature:* target/impact encoding (`micci-barreca2001-target-encoding`) and evidence that regularized target encoding wins for high-cardinality features (`pargent2022-target-encoding`); dirty categories (`cerda2018-dirty-categories`, implemented in skrub); technical debt in ML systems: pipeline jungles, glue code, data dependencies, feedback loops (`sculley2015-tech-debt`); concrete production-readiness tests for data and features (`breck2017-ml-test-score`); leakage (`kaufman2012-leakage`).

**Where they disagree.** Hand-crafted domain features (FES; tabular practice) vs learned representations (deep learning). Binning: practitioners like it, FES argues against it. Scope: MDS-style courses stop at scikit-learn pipelines, while production courses add data validation, training–serving skew and point-in-time correctness.

**Recommended lesson sequence (7)**
1. **Pipelines as leak-proof experiments.** The fit/transform contract; Pipeline and ColumnTransformer; what may run upstream in Polars/DuckDB (stateless, row-local transforms) vs what must be fit inside CV (anything that learns from data).
2. **Numeric features and physics.** When scaling matters; log, Box–Cox, Yeo–Johnson and quantile transforms; splines vs binning; **physics-informed features** (approach temperatures, ΔT, wet-bulb and enthalpy, part-load ratio, dimensionless groups); interactions.
3. **Categorical features.** One-hot and the dummy trap; hashing; target encoding with smoothing and **out-of-fold cross-fitting**; high-cardinality IDs (server, rack, site); dirty strings.
4. **Missing data.** MCAR/MAR/MNAR; missing indicators; imputing inside CV; sensor dropouts vs true zeros; the danger of forward-filling across long outages.
5. **Time-aware features from telemetry ★.** Resampling, lags, rolling and expanding windows, calendar and weather joins; **point-in-time correctness** with as-of joins; centered windows as leakage.
6. **Feature selection.** Filter, wrapper and embedded methods (lasso, tree-based); selection *inside* CV; stability selection.
7. **Production pipelines, plus capstone.** Schema and data validation (ranges, units, monotonic timestamps, duplicate keys, distribution checks); training–serving skew; versioned, reproducible feature code; feature unit tests (`breck2017-ml-test-score`). Capstone: an end-to-end cooling-telemetry pipeline (Polars lazy → DuckDB → scikit-learn pipeline) with validation tests that fail loudly.

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| Minimal Pipeline/ColumnTransformer clone with `get_feature_names_out`, plus a **"spy" transformer test** that fails if validation rows ever reach `fit` | the leak-proof contract | `sklearn.pipeline`, `sklearn.compose` |
| Smoothed (m-estimate) target encoder with K-fold cross-fitting; show the gap between `fit().transform()` and `fit_transform()` | self-leakage | `sklearn.preprocessing.TargetEncoder` |
| Lag/rolling feature generator with as-of semantics; a synthetic "future spike" test for point-in-time correctness | temporal leakage | Polars `join_asof`/`rolling`, DuckDB `ASOF JOIN` and window functions |
| Imputers with missing indicators | missingness as signal | `SimpleImputer`, `IterativeImputer` |
| B-spline basis vs binning on a nonlinear chiller curve | smooth vs step features | `SplineTransformer`, `KBinsDiscretizer` |
| Data-validation suite (units, ranges, stuck-sensor detection, duplicate timestamps) as pytest + Hypothesis tests | data contracts | the learner's own CI |

**Mastery benchmarks**
- *Derive:* the smoothed target-encoding formula as empirical-Bayes shrinkage toward the global mean (prior weight m) ★; why cross-fitting removes self-leakage; how mean imputation biases variance and correlation; why trees ignore monotone transforms and linear models do not.
- *Implement:* the leak-proof pipeline with spy test, time-aware features with point-in-time tests, the cross-fitted encoder, the validation suite, and a Polars pipeline that handles more data than RAM (check the Polars 2.x streaming engine docs before writing this exercise).
- *Debug:* centered rolling windows; timezone/DST misalignment between BMS and IT telemetry; forward-fill across a 6-hour outage; target encoding fit on all rows; one-hot columns that differ between training and serving; °F vs °C or kW vs kWh mix-ups; duplicate timestamps after resampling.
- *Explain:* when feature engineering beats a bigger model; what MNAR implies; why dimensionless features transfer across sites; the sources of training–serving skew.

**Misconceptions and pitfalls**
1. [P] "Scaling matters for every model" (not for trees).
2. [D] "Impute before splitting; it's harmless."
3. [D] "Smoothing makes target encoding safe." It still leaks without out-of-fold fitting.
4. [S] "More features always help."
5. [E] "Missing values should always be imputed away" (missingness can carry information; use indicators).
6. [D] "Rolling means look only at the past by default." Check the centering and the label alignment.
7. [S] "Binning is harmless" (information loss; FES).
8. [D] One-hot encoding a 20,000-level server ID.
9. [D] Feature selection on all data, then CV (the ESL "wrong way" again).
10. [E] "If it works in the notebook, it works in production" (skew, schema drift).

**Mechanical-engineering bridges**
- **Buckingham π and similitude ↔ feature engineering.** Dimensionless groups (Re, Pr, Nu, NTU, effectiveness, approach temperature, part-load ratio) generalize across scales and sites in the same way they make lab correlations transferable. This is probably the most motivating hook in the module for this learner.
- **Psychrometrics:** derive wet-bulb, dew point and enthalpy from dry-bulb and RH as features for cooling load.
- Signal conditioning (anti-aliasing, filtering, resampling) ↔ rolling features and downsampling, including aliasing when telemetry is decimated.
- Instrument data validation (range checks, stuck or drifting sensors) ↔ pipeline data contracts.
- **Energy-balance residuals** (Q = ṁ·c_p·ΔT closure) work both as data-quality checks and as fault-detection features.

**Primary references:** `kuhn2019-fes`, `sklearn-user-guide-1-9`, `micci-barreca2001-target-encoding`, `sculley2015-tech-debt`, `breck2017-ml-test-score`. *Supporting:* `pargent2022-target-encoding`, `cerda2018-dirty-categories`, `kaufman2012-leakage`, `sklearn-common-pitfalls`, `polars-docs-2-1`, `duckdb-docs-2-0`, `maciver2019-hypothesis`.

---

## Module 25 — Bayesian methods and uncertainty quantification

**How leading resources sequence it**
- *McElreath 2026:* **Beginner** section: introduction → garden of forking data → Gaussian ("geocentric") models → categories and causes → estimands → elemental confounds → good and bad controls → MCMC and item-response models → modeling events (GLMs) → confounds and sensitivity. **Experienced** section: multilevel models → correlated varying effects → group-level confounds and social networks → Gaussian processes → measurement error → missing and censored data → GLM extensions → hidden Markov models.
- *BDA3:* fundamentals (single- and multi-parameter models, asymptotics, hierarchical models) → data-analysis fundamentals (model checking, evaluating and comparing models, modeling the data-collection process, decision analysis) → computation (simulation, MCMC, HMC, approximations) → regression → nonlinear and nonparametric models (GPs, mixtures). Taught with Python demos in Vehtari's Aalto course (2026 page).
- *GPML:* regression → classification → covariance functions → model selection and hyperparameters → relations to other models (splines, SVMs) → theory → large-data approximations.
- *Primary papers:* `betancourt2017-hmc`, `hoffman2014-nuts`, `gelman2020-workflow`, `vehtari2017-loo`, `vehtari2021-rhat`, `blei2017-vi`, `angelopoulos2023-conformal`, `romano2019-cqr`, `kendall2017-uncertainty`, `lakshminarayanan2017-ensembles`, `gneiting2007-calibration-sharpness`, `kennedy2001-calibration`.
- *Production software (2026-11-12):* PyMC 6.4, NumPyro 0.22, Stan (`carpenter2017-stan`), ArviZ 1.3, MAPIE 1.6, `sklearn.gaussian_process`.

**Where they disagree.** Workflow and model-checking emphasis (Gelman, McElreath) or ML-style predictive UQ (ensembles, distribution-free conformal methods). MCMC first or VI first. How much conjugate algebra to teach.

**Recommended lesson sequence (8)**
1. **Bayesian updating by computation.** Grid approximation; conjugacy recap; posterior predictive; priors as encoded engineering knowledge; prior predictive simulation.
2. **Bayesian linear regression.** Closed-form posterior and predictive distribution; the split into aleatoric and epistemic variance; the Laplace approximation.
3. **MCMC from scratch.** Random-walk Metropolis (detailed balance) → HMC intuition (energy, leapfrog, divergences; `betancourt2017-hmc`) → NUTS in practice.
4. **Diagnostics and workflow ★.** Rank-normalized R̂ and bulk/tail ESS (`vehtari2021-rhat`); divergences; trace and rank plots; posterior predictive checks; PSIS-LOO (`vehtari2017-loo`); the Bayesian workflow loop (`gelman2020-workflow`).
5. **Hierarchical models.** Partial pooling across racks, rooms and sites; non-centered parameterizations (Neal's funnel); shrinkage compared with ridge and random effects.
6. **Gaussian processes.** Kernels as priors over functions; prediction via Gaussian conditioning; hyperparameters by marginal likelihood; GPs as engineering surrogates (kriging); scalability limits.
7. **Predictive UQ for ML systems ★.** Quantile regression (pinball loss), ensembles, split conformal and CQR (`angelopoulos2023-conformal`, `romano2019-cqr`), "sharpness subject to calibration" (`gneiting2007-calibration-sharpness`), coverage under drift.
8. **Engineering-UQ capstone.** **Bayesian calibration of a lumped RC thermal model of a data hall** against sensor data, with a model-discrepancy term (`kennedy2001-calibration`); propagate posterior uncertainty to a cooling-capacity decision; compare ADVI with NUTS (`blei2017-vi`).

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| Grid/conjugate posterior explorer with prior and likelihood sliders | updating | PyMC model of the same problem |
| Closed-form Bayesian linear regression vs NUTS samples | correctness check | PyMC / NumPyro |
| Metropolis with adaptation; HMC with leapfrog; self-computed ESS and R̂ | how samplers work | `arviz.rhat`, `arviz.ess`; PyMC/NumPyro NUTS |
| Centered vs non-centered hierarchical model; count divergences | geometry problems | PyMC/Stan divergence reports |
| GP regression via Cholesky, plus the marginal-likelihood gradient for hyperparameters | GP mechanics | `sklearn.gaussian_process.GaussianProcessRegressor` |
| Split conformal and CQR; empirical coverage over many random splits; break exchangeability with seasonal drift | distribution-free guarantees and their limits | MAPIE |
| Mean-field ADVI with the reparameterization trick vs NUTS on logistic regression | VI's variance underestimation | PyMC ADVI |

**Mastery benchmarks**
- *Derive:* conjugate posteriors; the Bayesian linear-regression posterior and predictive; the Laplace approximation; the Metropolis acceptance ratio from detailed balance; leapfrog volume preservation (statement); the ELBO identity ★; GP predictive mean and variance from Gaussian conditioning; the marginal likelihood as data fit plus complexity penalty ★; the split-conformal coverage bound (≥ 1−α under exchangeability) and its quantile-index rule ★.
- *Implement:* Metropolis, HMC, GP, conformal and ADVI, each with diagnostics and a simulation-based check (does a 90% interval cover about 90%?).
- *Debug:* divergences in hierarchical models; non-identifiability (label switching, collinearity); an improper posterior from an improper prior; badly scaled data slowing HMC; an ill-conditioned GP kernel matrix (jitter); conformal applied to non-exchangeable time series; reading credible intervals as guaranteed frequentist coverage.
- *Explain:* aleatoric vs epistemic uncertainty; credible vs confidence intervals; why HMC beats random-walk samplers in high dimension; what R̂ does and does not certify; when VI is good enough; calibration vs sharpness; model discrepancy in engineering calibration.

**Misconceptions and pitfalls**
1. [E] "Flat priors are uninformative." They are not invariant to reparameterization and can be very informative on a transformed scale. Show with prior predictive simulation.
2. [S] "More draws fix a sampler that hasn't converged." Bias from divergences does not shrink with more draws.
3. [E] "R̂ ≈ 1 guarantees convergence."
4. [S] "A 95% credible interval covers 95% of the time" (only under a correct model and prior).
5. [E] "GP uncertainty covers model misspecification." It covers only the assumed kernel family.
6. [S] "Conformal gives 90% coverage for every input." The guarantee is marginal and assumes exchangeability.
7. [S] "VI uncertainty matches MCMC" (mean-field underestimates variance; reverse KL seeks a mode).
8. [E] "Disagreement within an ensemble is calibrated uncertainty."
9. [E] "Bayesian just means 'with a prior'; checking is optional."
10. [E] "A passing posterior predictive check validates the model." It only fails to detect misfit in the statistics you checked.

**Mechanical-engineering bridges**
- **Kalman filtering = recursive Bayesian estimation** with Gaussian conjugate updates (`kalman1960-filter`), e.g. estimating zone temperature from noisy sensors.
- **Calibrating simulation models (EnergyPlus, CFD, thermal RC networks) to measurements** is exactly Kennedy–O'Hagan Bayesian calibration with model discrepancy (`kennedy2001-calibration`). Engineering UQ texts (`smith2013-uq`) give the bridge vocabulary: forward propagation, inverse problems, sensitivity analysis.
- GUM-style measurement uncertainty ↔ posterior predictive propagation.
- Reliability-based design (probability of failure, safety factors) ↔ decisions that minimize expected loss under the posterior.
- Hierarchical models ↔ fleet reliability (pooling failure data across similar CRAHs or pumps).
- **HMC ↔ Hamiltonian mechanics.** Energy conservation and symplectic (Verlet/leapfrog) integrators are already familiar from dynamics, so HMC's mechanics can be taught as physics.

**Primary references:** `gelman2013-bda3`, `mcelreath2020-rethinking`, `rasmussen2006-gpml`, `gelman2020-workflow`, `angelopoulos2023-conformal`. *Supporting:* `mcelreath2026-rethinking-course`, `vehtari2026-bda-course`, `betancourt2017-hmc`, `hoffman2014-nuts`, `vehtari2017-loo`, `vehtari2021-rhat`, `blei2017-vi`, `romano2019-cqr`, `kendall2017-uncertainty`, `lakshminarayanan2017-ensembles`, `gneiting2007-calibration-sharpness`, `kennedy2001-calibration`, `smith2013-uq`, `abrilpla2023-pymc`, `carpenter2017-stan`, `kumar2019-arviz`, `phan2019-numpyro`, `kalman1960-filter`.

---

## Module 26 — Causal inference basics

**How leading resources sequence it**
- *Hernán & Robins, What If:* Part I without models (causal effects, randomized experiments, observational studies, effect modification, interaction, causal graphs, confounding, selection bias, measurement bias, random variability) → Part II with models (IP weighting and marginal structural models, standardization and the g-formula, outcome regression and propensity scores, IV, survival, variable selection) → Part III complex longitudinal data (time-varying treatments, g-methods, target trials).
- *Cunningham (2nd ed. "The Remix", online and in progress):* foundations → choosing a causal inference approach → potential outcomes and randomization → DAGs → unconfoundedness → RDD → IV → panel designs → DiD (basic and complex) → synthetic control.
- *Brady Neal (2020):* potential outcomes → graphical models → backdoor adjustment → estimation (including CATE) → sensitivity analysis → IV, RDD, DiD, synthetic control → causal discovery (observational and interventional) → transportability → counterfactuals and mediation.
- *McElreath 2026:* confounds taught *inside* Bayesian regression (forks, pipes, colliders, good and bad controls, sensitivity).
- *Facure, Brave and True (Python):* Part I classic designs (experiments, regression, IV, matching, propensity, doubly robust, DiD, synthetic control, RDD); Part II heterogeneous effects with ML.
- *Rigor and industry texts:* `pearl2016-primer`, `pearl2009-causal-overview`, `imbens2015-causal-inference`, `huntington-klein2021-effect`, `kohavi2020-online-experiments`.
- *Methods papers:* `rosenbaum1983-propensity`, `chernozhukov2018-dml`, `kunzel2019-metalearners`, `wager2018-causal-forests`, `brodersen2015-causalimpact`, `abadie2021-synthetic-control`, `deng2013-cuped`, `hernan2016-target-trial`; software: DoWhy (`sharma2020-dowhy`), EconML.

**Where they disagree.** Potential outcomes (Rubin, Imbens, Hernán) or DAGs/SCMs (Pearl) as the entry point. Design-based econometrics (Cunningham) or ML estimation of nuisance functions (Neal, Facure, DML). Bayesian causal modeling (McElreath). Causal discovery: optional in most courses, central in Neal's.

**Recommended lesson sequence (8)**
1. **Prediction vs intervention.** Potential outcomes; estimands (ATE, ATT, CATE); the fundamental problem; consistency, exchangeability, positivity, no interference (SUTVA).
2. **DAGs and identification.** Forks, pipes, colliders; d-separation; the backdoor criterion; good and bad controls; selection bias; Simpson's paradox.
3. **Experiments at scale ★.** Randomization inference; power; variance reduction with pre-period covariates (CUPED, `deng2013-cuped`); interference and cluster randomization (**racks share cooling**); **switchback experiments** for infrastructure; peeking (`kohavi2020-online-experiments`).
4. **Adjusting for observed confounding.** Standardization (g-formula), propensity scores (`rosenbaum1983-propensity`), IPW, matching, overlap diagnostics, doubly robust AIPW.
5. **ML for causal estimation ★.** Cross-fitting and Neyman orthogonality intuition via residual-on-residual regression (`chernozhukov2018-dml`); S/T/X-learners (`kunzel2019-metalearners`); causal forests (`wager2018-causal-forests`); DoWhy and EconML.
6. **Quasi-experiments for infrastructure.** Interrupted time series and Bayesian structural time series (`brodersen2015-causalimpact`); DiD across sites; synthetic control (`abadie2021-synthetic-control`); RDD around control-policy thresholds.
7. **When assumptions fail.** Unmeasured confounding and sensitivity analysis; instrumental variables; target-trial emulation (`hernan2016-target-trial`); transportability across sites.
8. **Capstone.** *"Did raising the chilled-water supply setpoint by 2 °C reduce plant energy without increasing IT inlet-temperature violations?"* Design a switchback experiment, analyze historical data observationally (DiD or synthetic control across halls), and reconcile the two estimates.

**From-scratch builds → production comparison**

| Build | Teaches | Compare against |
|---|---|---|
| SCM simulator with confounders, mediators and colliders; regression estimates under different adjustment sets; a d-separation/backdoor checker | identification | DoWhy identification |
| A/B analysis: difference in means, randomization inference, CUPED, simulated power | experiments | statsmodels power tools |
| Propensity + IPW + AIPW with bootstrap CIs and overlap plots, checked on simulated ground truth | adjustment estimators | DoWhy / EconML estimators |
| DML with cross-fitted gradient-boosting nuisance models | orthogonalization | EconML `LinearDML`, `CausalForestDML` |
| T-, S- and X-learners on simulated heterogeneous effects; uplift/Qini curves | heterogeneity | EconML meta-learners |
| DiD and synthetic control on a multi-site panel with placebo tests; interrupted time series with a structural time-series model | quasi-experiments | `statsmodels.tsa.UnobservedComponents` |

**Mastery benchmarks**
- *Derive:* the adjustment formula from exchangeability and positivity; IPW unbiasedness; AIPW double robustness ★; the backdoor criterion on concrete DAGs; collider bias; DiD identification under parallel trends; the CUPED variance-reduction factor (1 − ρ²) ★; Frisch–Waugh–Lovell as the core of DML ★.
- *Implement:* all estimators, verified by **coverage simulations on synthetic ground truth** (does the 95% CI cover the true effect about 95% of the time?).
- *Debug:* adjusting for a mediator or collider; positivity violations that make IPW weights explode; post-treatment variables in the feature set; interference between A/B arms through shared chilled-water loops; seasonal confounding in an interrupted time series; p-hacking across many outcome metrics.
- *Explain:* correlation vs causation in DAG terms; why predictive accuracy does not validate a causal estimate; when randomization is feasible in a data center; the assumptions behind each method; what a sensitivity analysis says about robustness.

**Misconceptions and pitfalls**
1. [S] "Adding controls always reduces bias" (colliders and mediators add bias).
2. [E] "SHAP or feature importance from a good model gives causal effects."
3. [P] "Randomization guarantees balance in this sample." It does so in expectation; check, then adjust.
4. [E] "Propensity matching turns observational data into an experiment" (only for observed confounders).
5. [P] "No correlation means no causation" (cancelling paths).
6. [D] DiD without parallel pre-trends; synthetic control with a poor pre-period fit.
7. [D] "A/B tests on infrastructure have no interference."
8. [E] "Statistically significant means operationally significant."
9. [E] "Causal discovery recovers the true DAG from observational data without assumptions."
10. [E] "Granger causality is causation."

**Mechanical-engineering bridges**
- **Feedback control creates confounding.** In a closed loop, inputs respond to outputs (fan speed rises *because* temperature rose), so naively regressing temperature on fan speed can even get the sign wrong. This is the well-known closed-loop system-identification bias, and the classical fix (external excitation used as an instrument) is an IV design. This may be the single best hook for this learner.
- Lab design of experiments (randomization, blocking, factorial designs) ↔ RCTs. Blocking ↔ stratification and CUPED.
- Commissioning bump tests and step tests ↔ interventions (the do-operator in practice).
- Measurement and verification (M&V) of energy-conservation measures uses baseline models, i.e. counterfactual prediction. Interrupted time series and synthetic control formalize that practice.
- Free-body diagrams ↔ DAGs: both make explicit what acts on what before any equation is written.

**Primary references:** `hernan2020-what-if`, `cunningham2021-mixtape`, `neal2020-causal-course`, `kohavi2020-online-experiments`, `chernozhukov2018-dml`. *Supporting:* `mcelreath2026-rethinking-course`, `facure-brave-true`, `pearl2016-primer`, `pearl2009-causal-overview`, `imbens2015-causal-inference`, `huntington-klein2021-effect`, `rosenbaum1983-propensity`, `kunzel2019-metalearners`, `wager2018-causal-forests`, `brodersen2015-causalimpact`, `abadie2021-synthetic-control`, `deng2013-cuped`, `hernan2016-target-trial`, `sharma2020-dowhy`.

---

## Learning science → app design rules

### A. What the evidence supports (verified records only)

| Principle | Key findings (from the records I loaded) | Strength | Caveat that shapes the design |
|---|---|---|---|
| **Retrieval practice** | Testing beat restudying on tests 2 days and 1 week later, while restudying won at 5 minutes and inflated confidence (`roediger2006-test-enhanced-learning`). Retrieval beat concept mapping, including on inference questions (`karpicke2011-retrieval-practice`). Recall tests give larger benefits than recognition tests (`rowland2014-testing-meta`). Practice tests beat restudying and every other comparison condition in a large meta-analysis (`adesope2017-practice-testing-meta`). Repeated testing improves transfer (`butler2010-testing-transfer`). | Strong | Benefits show up on *delayed* tests. Same-session scores can mislead. |
| **Spacing** | 839 assessments from 317 experiments: the best gap grows with the retention interval (`cepeda2006-distributed-practice`). In over 1,350 learners, the optimal gap was about **20–40% of a 1-week** retention interval and about **5–10% of a 1-year** interval (`cepeda2008-spacing-ridgeline`). | Strong | The best spacing depends on how long the knowledge must last. |
| **Interleaving** | Mixed practice was far better at 1 week (`rohrer2007-shuffling`). d = 0.42 immediately and 0.79 at 30 days (`rohrer2015-interleaving`). A preregistered RCT across 54 classes scored 61% vs 38%, d = 0.83 (`rohrer2020-interleaving-rct`). Meta-analysis: overall g = 0.42, math g = 0.34, word learning favored blocking (g = −0.39); interleaving helps more when categories are similar to each other and the material is complex (`brunmair2019-interleaving-meta`). Learners judged massing as *more* effective even when it was worse (`kornell2008-interleaving`). | Moderate–strong for "which method applies?" tasks | Do not interleave vocabulary drills. Interleave confusable problem types. |
| **Worked examples, fading, self-explanation** | Worked examples beat unguided problem solving for novices (`sweller1985-worked-examples`, `sweller1988-cognitive-load`). Gradual fading improves near transfer (`renkl2002-fading`). Fading combined with prompts to name the principle behind each step gave medium-to-large near and far transfer with no extra time (`atkinson2003-fading-self-explanation`). Self-explanation drives example-based learning (`chi1989-self-explanation`). The benefit reverses as expertise grows (`kalyuga2003-expertise-reversal`); see also `renkl2003-transition`. | Strong | Fade faster where the learner is already strong (calculus) and slower where new (probabilistic modeling). |
| **Mastery learning and tutoring granularity** | 108 controlled evaluations: positive effects, strongest for weaker students, more time on task, and *self-paced mastery programs often lower college completion rates* (`kulik1990-mastery-meta`; see `bloom1984-two-sigma`, `keller1968-psi`). Human tutoring d = 0.79 and step-based tutoring systems d = 0.76; the popular "2 sigma" belief was not confirmed (`vanlehn2011-tutoring`). Knowledge tracing gives per-skill mastery probabilities (`corbett1995-knowledge-tracing`). | Moderate | Gates need pacing safeguards. Feedback should be step-level, not answer-only. |
| **Predict before observe** | Students who only watched demonstrations understood no better than those who saw none; predicting the outcome first improved understanding (`crouch2004-predict-demos`). How learners *engage* with a visualization matters more than what it shows (`hundhausen2002-av-meta`), formalized as an engagement taxonomy (`naps2002-engagement`). POE originates in `white1992-poe`. | Moderate | Every visualization needs a committed prediction first. |
| **Productive failure** | 53 studies / 166 comparisons: problem-solving-then-instruction beat the reverse, g = 0.36; high-fidelity PF g = 0.37–0.58; bias-corrected estimate g = 0.87. Younger learners and domain-general skills favored instruction first (`sinha2021-pf-meta`). It works when instruction builds on student solutions or uses contrasting cases (`loibl2017-ps-i`). Counterpoint: `kirschner2006-minimal-guidance`. See also `kapur2008-productive-failure`, `kapur2016-pf-design`. | Moderate, design-sensitive | Use it rarely and deliberately, for concept invention, not tool syntax. |
| **Erroneous examples (debugging)** | Mixing correct and incorrect solutions improved far transfer only for learners with good prior knowledge; weaker learners did better with correct examples only (`grosse2007-erroneous-examples`). | Moderate | Introduce "debug this model" after the correct procedure is secure. |
| **Parsons problems** | Introduced in `parsons2006-parsons-puzzles`; work as exam items (`denny2008-parsons-exam`); in an experiment, solving Parsons problems produced learning comparable to fixing or writing the equivalent code in less time (`ericson2017-parsons`); adaptive variants studied in `ericson2018-adaptive-parsons`; reviewed in `du2020-parsons-review`. | Moderate, mostly novice-programmer samples | Use as the code-level fading step, not as the endpoint. |
| **Feedback** | Feedback aimed at the task and process works; feedback aimed at the person does not (`hattie2007-feedback`). Formative feedback should be specific and manageable (`shute2008-formative-feedback`). Many feedback interventions actually *lowered* performance (`kluger1996-feedback`). Help helps, but only up to a point, and learners misuse on-demand hints (`aleven2016-help-seeking`). Too much vs too little assistance is a real dilemma (`koedinger2007-assistance-dilemma`). Contingent scaffolding origin: `wood1976-scaffolding`. | Strong but heterogeneous | Tiered, attempt-first hints. |
| **Active learning and metacognition** | Lecture-based STEM courses had 55% higher failure rates than active-learning courses (`freeman2014-active-learning`). Students in active classes learned more but *felt* they learned less (`deslauriers2019-feeling-of-learning`). Learners hold systematic illusions about how they learn (`bjork2013-self-regulated`). | Strong | The app must explain why effective practice feels harder. |
| **Deliberate practice** | The original claim (`ericsson1993-deliberate-practice`) is contested: deliberate practice explained 26% of performance variance in games, 21% in music, 18% in sports, 4% in education and under 1% in professions (`macnamara2014-dp-meta`). | Contested | Use its mechanics (target weaknesses, immediate feedback); don't promise it is sufficient. |
| **Consensus guides** | IES practice guide: space learning, pair worked examples with problems, combine graphics with words, link concrete and abstract representations, quiz (including pre-questions), help learners allocate study, ask deep questions (`pashler2007-ies-guide`). Dunlosky et al. rate practice testing and distributed practice as high utility, interleaving and self-explanation as moderate, and rereading and highlighting as low (`dunlosky2013-learning-techniques`). Classroom summary: `weinstein2018-science-of-learning`. | Consensus | |

### B. Rules for the app

**R1 — Daily session structure.** (Retrieval, spacing, interleaving, active learning: `roediger2006-test-enhanced-learning`, `cepeda2008-spacing-ridgeline`, `rohrer2020-interleaving-rct`, `freeman2014-active-learning`, `pashler2007-ies-guide`.) Default weekday session is 45–60 minutes:
1. **Warm-up (2–3 min):** two or three pre-questions or predictions about today's lesson. Answers are recorded but not graded.
2. **Due reviews (≤ 15 min, hard cap):** FSRS cards mixed across all modules, which gives spacing and interleaving at no extra cost.
3. **New material (25–30 min):** one or two cycles of the course loop. Each cycle is: *interactive visualization with predict–observe–explain → derivation with a faded worked example and self-explanation prompts → code (Parsons or fill-in, then from scratch) → production-library comparison.* The learner must act at least every 3–5 minutes. (This interval is a design choice informed by `freeman2014-active-learning`, not a tested constant.)
4. **Mixed practice (8–10 min):** 5–8 items split roughly 40% today's lesson, 30% earlier lessons in this module, 30% earlier modules. Include at least one "which method?" item. Learner rates confidence before each reveal.
5. **Exit (3–5 min):** two closed-book recall items, then approve or edit today's draft review cards, then a calibration readout (confidence vs correctness).

Variants: **lite day** (15 min: reviews plus 3 mixed items) for heavy MDS weeks; **weekend lab** (90–150 min: a from-scratch build or capstone, a weakness drill, and delayed mastery confirmations).

**R2 — Retrieval format and feedback.** Default to *generative* retrieval: free-response numbers, derivation steps, short code, explanations. Use multiple choice mainly for discrimination items and misconception probes with diagnostic distractors (`rowland2014-testing-meta`, `karpicke2011-retrieval-practice`). Always show the correct answer and a short process-level explanation after an attempt (`hattie2007-feedback`, `shute2008-formative-feedback`). Never give person-level praise or blame (`kluger1996-feedback`).

**R3 — Spacing at two levels.**
- *Cards:* use FSRS (R4).
- *Lessons and skills:* every module gets **spiral checkpoints**: a delayed mastery confirmation 3–7 days after the gate, then a mixed "module retrieval set" about 3–4 weeks later, then items in later modules' warm-ups. Rationale: for a retention horizon of a few months (exams, interviews), the gap data suggest re-exposure on the order of days to a few weeks rather than hours (`cepeda2008-spacing-ridgeline`). Full re-derivations and re-implementations are *not* flashcards. Schedule them as **re-derive / re-implement drills** at roughly 1 week, 1 month and 3 months (a design choice consistent with `cepeda2006-distributed-practice`).

**R4 — Scheduler: FSRS-7 via ts-fsrs, not SM-2.**
- *Why not SM-2:* SM-2 (`wozniak1990-sm2`) uses fixed formulas with a per-item ease factor. It does not model recall probability, so it cannot target a retention level, and repeated failures can push items into "ease hell" (`anki-manual-fsrs`).
- *Why FSRS:* FSRS models each card's memory state as difficulty, stability and retrievability. It schedules the next review when predicted recall drops to the desired retention and fits its parameters to the learner's own review log (`fsrs-abc-wiki`). The FSRS project reports roughly 20–30% fewer reviews than SM-2 for the same retention; the wiki notes this figure comes from simulation (`fsrs-abc-wiki`). On the open benchmark (about 10k Anki collections, ~350M evaluated reviews, time-ordered splits), FSRS-7 with per-user optimization reached log loss 0.3401 / AUC 0.7167, vs 0.3620 / 0.7029 with default parameters and 0.3460 / 0.7034 for FSRS-6 (no same-day reviews; `fsrs-srs-benchmark`). Personalization therefore matters. Research lineage: `ye2022-ssp-mmc`, `su2023-fsrs-tkde`. Alternatives in the benchmark (e.g. Duolingo's half-life regression, `settles2016-hlr`) predict much worse.
- *Implementation:* **ts-fsrs v6** (`fsrs-ts-fsrs`). `DefaultScheduler()` uses FSRS-7 when no version is given. It needs Node ≥ 24, which matters for where scheduling runs; for browser or WASI setups and other languages (including a possible Swift client), see the repo's notes and the awesome-fsrs implementation list. `review()` returns a new card plus a review-log entry without mutating the input, so **persist both**. FSRS-7 state includes `stability`, `stabilityFast` and `difficulty`, and uses fractional elapsed days, so same-day relearning is modeled properly.

| FSRS setting | Recommended value | Basis |
|---|---|---|
| `desiredRetention` (default deck) | **0.90** | Anki default. Above 0.90 workload rises quickly, above 0.97 it becomes overwhelming (`anki-manual-fsrs`). 0.70–0.97 is the "reasonable" range (`fsrs-abc-wiki`). |
| Gate-critical cards (prerequisite identities, leakage rules, core derivation steps) | **0.92–0.93** | Design choice: these are dependencies for later modules. |
| Peripheral facts (API names, history) | **0.85** | Saves workload (`anki-manual-fsrs` workload curve). |
| `learningSteps` / `relearningSteps` | `['1m','10m']` / `['10m']`, all under one day | Steps of a day or more are discouraged with FSRS (`anki-manual-fsrs`). The relearning value follows the ts-fsrs README example. |
| `enableShortTerm` | `true` | Same-day steps are modeled by FSRS-7 (`fsrs-ts-fsrs`). |
| `enableFuzz` | `true` | Spreads due dates. Optional in ts-fsrs (`fsrs-ts-fsrs`). |
| `maximumInterval` | **365 days** during MDS and job search, raised later (library default 36,500) | Design choice: every core card resurfaces at least yearly before interviews. A shorter cap costs some workload (`anki-manual-fsrs`). |
| Weights | FSRS-7 presets at first, then **optimize monthly** with `@open-spaced-repetition/binding` once enough reviews exist (check its minimum) | Monthly optimization is sufficient (`anki-manual-fsrs`). Optimized parameters beat defaults (`fsrs-srs-benchmark`). |
| Grade mapping from auto-graded items | Wrong, or a tier-3/4 hint used → **Again**; correct but slow or with a tier-2 hint → **Hard**; correct → **Good**; correct, fast, confidence 4/4 → **Easy** | Design choice. Note that FSRS treats *Hard as a successful recall*, so any bottom-out help must map to Again. |
| Daily caps | 10–15 new cards/day; pause new cards when the due backlog exceeds 2 days of review time | Design choice to keep reviews ≤ 15 min/day (R1). |
| Leeches | Suspend after ~8 lapses and route to "rewrite card or re-teach" | Design choice (card-quality signal; `wozniak1999-twenty-rules`). |
| Prioritizing overdue cards | Sort by retrievability from `forgettingCurve` (lowest first) | `fsrs-ts-fsrs` API; the FSRS equivalent of overdue sorting (`anki-manual-fsrs`). |

**R5 — Mastery gates.** (Evidence: `kulik1990-mastery-meta`, `bloom1984-two-sigma`, `keller1968-psi`, `vanlehn2011-tutoring`, `corbett1995-knowledge-tracing`.)
- **Immediate gate (end of module):** a fresh, *unhinted*, interleaved form of 10–14 items covering every module objective. Pass requires **≥ 85% overall**, **100% on items flagged critical** (e.g. a leak-free split, a correct gradient, a correct estimand), at least one **transfer item** in a new engineering context, and at least one **explain item** scoring ≥ 3/4 on a rubric. Grade step by step (derivation steps checked individually; code checked by unit tests per function), not just final answers (`vanlehn2011-tutoring`). The 85% threshold sits inside the 80–90% band traditionally used in mastery learning and is a design choice to revisit with the learner's own retention data.
- **Delayed confirmation:** a parallel form 3–7 days later. Pass requires **≥ 80%**. Failing it re-opens only the failed objectives.
- **Failing a gate:** targeted remediation (new worked example plus 3–5 practice items per failed objective), then a retake after ≥ 24 h on new items. **After two failed attempts, allow provisional advancement** with the remediation items pinned into daily reviews. This guards against the completion drop seen in self-paced mastery programs (`kulik1990-mastery-meta`).
- **Per-skill mastery estimate (optional):** Bayesian knowledge tracing per tagged skill, treating P(known) ≥ 0.95 as mastered (`corbett1995-knowledge-tracing`). FSRS retrievability of the skill's cards can serve as a second signal.

**R6 — Hint tiers (attempt first, then escalate).** (`wood1976-scaffolding`, `aleven2016-help-seeking`, `koedinger2007-assistance-dilemma`, `hattie2007-feedback`.)
- **T0 — attempt required.** No hints before a first submission or about 60 s of work. This guards against hint abuse.
- **T1 — orient.** Restate the goal and the known quantities. ("Which quantity must be stationary at the optimum?")
- **T2 — principle.** Name the concept or equation and link to the lesson segment.
- **T3 — next step.** Show the next derivation step solved, or a Parsons-style skeleton for code.
- **T4 — bottom-out.** Show the full worked solution. The item is graded **Again**, and an isomorphic variant is scheduled within 1–3 days.
- Hints fade as the skill estimate rises (expertise reversal: `kalyuga2003-expertise-reversal`). The app records hint use per skill so weakness drills (R13) can target it.

**R7 — Interleaving in practice sets.** (`brunmair2019-interleaving-meta`, `rohrer2015-interleaving`, `rohrer2020-interleaving-rct`.)
- **First exposure is blocked:** 3–5 items on the new procedure. After that, mix.
- **Mixed sets:** roughly 40% current lesson / 30% current module / 30% earlier modules (design choice). Each set includes at least one *discrimination* item where choosing the method is the task.
- **Interleave confusable pairs on purpose:** ridge vs lasso; L1 vs L2; precision vs recall; ROC vs PR; bagging vs boosting; GroupKFold vs time-series split; Platt vs isotonic; PCA vs ICA vs t-SNE; MLE vs MAP; confounder vs mediator vs collider; confidence vs prediction vs credible interval; aleatoric vs epistemic.
- **Do not interleave terminology drills.** The meta-analysis found blocking better for word learning (`brunmair2019-interleaving-meta`).

**R8 — Worked-example fading (math and code).** (`atkinson2003-fading-self-explanation`, `renkl2002-fading`, `renkl2003-transition`, `parsons2006-parsons-puzzles`, `ericson2017-parsons`, `pashler2007-ies-guide`.)
- *Derivations:* full worked example with a "which principle justifies this step?" prompt on each step → backward fading (last step blank, then the last two…) → full problem. Pair each worked example with a matched practice problem.
- *Code:* annotated reference implementation → **Parsons problem** (shuffled lines, later with distractor lines) → fill in the key lines → write from scratch → compare with the library.
- *Adaptive skip:* if the first faded item is solved correctly, quickly and without hints, jump straight to full problems. This should happen often for calculus-heavy steps (`kalyuga2003-expertise-reversal`).

**R9 — Predict–observe–explain on every visualization.** (`crouch2004-predict-demos`, `white1992-poe`, `hundhausen2002-av-meta`, `naps2002-engagement`.) No slider unlocks until the learner commits a prediction: a number, a sketch on axes, or a choice. After observing, the learner writes one or two sentences reconciling prediction and outcome. **A wrong prediction automatically drafts a review card** targeting that misconception. The misconception lists in each module above are the seed bank for these items.

**R10 — Productive failure, used sparingly.** (`sinha2021-pf-meta`, `loibl2017-ps-i`, `kirschner2006-minimal-guidance`.) At most one 10–15 minute invention task per module, *before* instruction, on a concept worth reinventing:
- invent a dispersion measure (→ variance and MAD);
- invent a metric for a rare-fault detector (→ precision/recall and PR-AUC);
- invent a split-quality score (→ impurity);
- invent an interval that covers 90% of future errors (→ split conformal);
- invent an estimate of a setpoint change's effect from historical data (→ adjustment and DiD).

The instruction that follows must explicitly contrast the learner's attempt with the canonical solution. Never use PF for tooling or syntax (uv, Polars API), which benefit from direct instruction.

**R11 — Debugging and erroneous examples after competence.** (`grosse2007-erroneous-examples`.) "Find the bug" and "why is this model lying?" items unlock only after the matching correct procedure has been mastered. On first exposure, highlight the region that contains the error, then remove the highlight. Each module's [D] items are the bank. Leakage hunts (Module 7), divergent samplers (Module 25) and collider adjustment (Module 26) work best as full labs.

**R12 — Self-explanation prompts.** (`chi1989-self-explanation`, `atkinson2003-fading-self-explanation`.) Ask "which principle licenses this step?" and "what would break if this assumption failed?" rather than generic "explain this". The app can grade short explanations with a rubric (keywords plus an LLM rubric grader if available). Show the model explanation afterwards.

**R13 — Weakness drills (deliberate-practice mechanics, modest claims).** (`ericsson1993-deliberate-practice`, `macnamara2014-dp-meta`.) A weekly 20-minute drill is assembled automatically from the error log: the lowest-retrievability cards, skills with the most hint use, and misconceptions repeated in POE predictions. Each drill item gives immediate feedback and a near-isomorphic retry. Do not present this as the main engine of expertise. The meta-analytic effect in education is small.

**R14 — Make learning visible and correct illusions.** (`bjork2013-self-regulated`, `deslauriers2019-feeling-of-learning`, `kornell2008-interleaving`, `roediger2006-test-enhanced-learning`.)
- Before each reveal, collect a 1–4 confidence rating; show weekly calibration curves.
- Show delayed-retention evidence (gate confirmations, FSRS retention), not time spent or streaks.
- Explain once, briefly, why spaced and mixed practice feels slower but works better.

**R15 — Pacing and the MDS calendar.** (`kulik1990-mastery-meta`, `keller1968-psi`.)
- Set weekly targets tied to the MDS block calendar; during heavy assessment weeks, switch to lite days automatically.
- Prefer preview-or-deepen alignment with current MDS courses (§0.1, item 8).
- Show a gentle "behind plan" indicator instead of streak pressure.

**R16 — Pair representations.** (`pashler2007-ies-guide`, `weinstein2018-science-of-learning`.) Every visualization is paired with its equation and a concrete engineering instance (e.g. the covariance ellipse ↔ Mohr's circle ↔ rack temperature sensors). Bridges from each module's "Mechanical-engineering bridges" list should appear both in lessons and as review cards.

**R17 — Generating review cards from lessons.** (`matuschak2020-prompts`, `wozniak1999-twenty-rules`, `nielsen2018-ltm`, `rowland2014-testing-meta`.)
- **Pipeline:** lesson authors tag "card-worthy" elements (claims, derivation steps, shapes, code lines, misconceptions, bridges). The app drafts cards automatically, and the learner approves or edits them in the exit step (R1). Every card links back to its lesson segment and carries tags: module, lesson, objective, skill, card type, critical flag.
- **Card types and per-lesson quota (8–15 cards):**
  - *Concept why/when* (2–4): "Why does ridge shrink the directions with small singular values the most?"
  - *Derivation step* (2–4): exactly one non-obvious step per card.
  - *Predict-the-output / shape* (1–3): broadcast shapes, metric values on a tiny confusion matrix, sign of a gradient.
  - *Code cloze* (1–2): one expression or line, such as the log-sum-exp responsibility line in EM.
  - *Discrimination* (1–2): "3% positive rate; operators review the top 50 alerts per day: which curve and metric?"
  - *Bridge* (1): "Fixed-step GD on a quadratic is which classical integrator, and what limits its step?"
  - *Bug spotting* (1): "A centered 1-hour rolling mean feeds a 15-minute-ahead forecast. What's wrong?"
- **Writing rules:**
  - One retrieval target per card (minimum-information principle).
  - No yes/no prompts. No lists longer than three; use one cloze per element.
  - Prompts must be precise enough to have one defensible answer, and effortful enough to need real retrieval (`matuschak2020-prompts`).
  - Write two or three cards per important idea from different angles.
  - Prefer recall over recognition (`rowland2014-testing-meta`).
  - Where possible, use **parameterized variants** (new numbers or contexts on each review) so retrieval targets the concept, not the surface form. This is a design choice; monitor whether it slows FSRS fitting.
- **Not cards:** whole derivations and whole implementations. They become re-derive / re-implement drills (R3).
- **Mnemonic-medium framing:** embedding prompts in the lesson text, rather than a separate deck, follows the approach described in `nielsen2018-ltm` and `matuschak2020-prompts`.

**R18 — Instrument everything and let the app tune itself.** Log for every attempt: item id, skill tags, latency, hint tier used, correctness per step, confidence, and the FSRS card and review-log entry. Uses:
- monthly FSRS re-optimization;
- per-skill mastery estimates;
- spotting bad items (high error *and* high confidence → misleading item or real misconception);
- reviewing gate thresholds against delayed-confirmation pass rates. If many immediate passes fail the delayed check, raise the threshold or lengthen fading.

### C. Parameter cheat sheet

| Decision | Default | Range / adapt rule |
|---|---|---|
| Session length | 45–60 min weekday; 15 min lite; 90–150 min weekend lab | Auto-lite in MDS crunch weeks |
| Review time cap | 15 min/day | Pause new cards if backlog > 2 days |
| New cards/day | 10–15 | 5 during crunch weeks |
| FSRS desired retention | 0.90 | 0.92–0.93 for critical cards; 0.85 for peripheral; never above 0.97 |
| FSRS max interval | 365 d | Raise after the job search |
| Learning / relearning steps | 1m, 10m / 10m | Keep under 1 day |
| Mixed-set composition | 40/30/30 (lesson / module / earlier) | ≥ 1 discrimination item per set |
| Blocked practice on new skill | 3–5 items | Skip if first two are correct, fast and unhinted |
| Immediate gate | ≥ 85% overall + 100% critical + transfer + explain ≥ 3/4 | Revisit with delayed-pass data |
| Delayed confirmation | ≥ 80% at 3–7 days | Fail → re-open failed objectives only |
| Retake cooldown | ≥ 24 h, new items | Provisional advance after 2 fails |
| Skill mastery (BKT) | P(known) ≥ 0.95 | — |
| Hint ladder | T0 attempt → T1 orient → T2 principle → T3 next step → T4 bottom-out | T3/T4 map to "Again" |
| Productive failure | ≤ 1 per module, 10–15 min | Concept invention only |
| Activity density | ≥ 1 learner action per 3–5 min of content | — |

### D. Where the evidence is thin (validate inside the app)
- Most Parsons-problem evidence comes from introductory programming. Whether it carries over to advanced numerical code is untested; check that drills transfer to writing code from scratch.
- Interleaving evidence is strongest for math problem types and visual categories. Whether method-selection interleaving in ML carries over is plausible but not directly studied.
- The optimal desired retention for *conceptual* cards (as opposed to vocabulary, which dominates the Anki benchmark) is unknown. The learner's own FSRS log will show it after a few months.
- The specific thresholds above (85%, 80%, 3–7 days, 40/30/30) are reasoned design choices anchored in the cited ranges, not experimentally optimized constants. Treat them as defaults to tune with R18 data.
