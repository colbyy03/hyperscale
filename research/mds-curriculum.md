# UBC MDS Vancouver curriculum and 2026-27 calendar

Accessed 2026-11-12. Block dates are mostly inferred; verify against the private MDS calendar the learner can see.

## Calendar

| Label | Start | End | Status | Notes |
|---|---|---|---|---|
| Orientation | 2026-08-26 | 2026-08-28 | published | MDS dinner Aug 28. Source: MDS event calendar. |
| Block 1 (DSCI 511,521,523,551) | 2026-09-08 | 2026-10-02 | inferred | 4 teaching weeks; UBC Term 1 starts Tue Sep 8 (Sep 7 Labour Day). MDS says it usually runs about a week off UBC dates; exact start unpublished. |
| Block 1 week 5 (no lectures/labs) | 2026-10-05 | 2026-10-09 | inferred | Derived from 5-week cadence. |
| Block 2 (DSCI 512,531,552,571) | 2026-10-12 | 2026-11-06 | inferred | CURRENT BLOCK on 2026-11-12 just ended; matches learner's recent 531/552/571 labs. Oct 12 is Thanksgiving, so real start may be Oct 13. |
| Block 2 week 5 / Semester 1 midterm break | 2026-11-09 | 2026-11-13 | published | Published as Semester 1 midterm break Nov 9-13 (UBC midterm break Nov 9-11 incl. Remembrance Day). This is the week the learner is in on 2026-11-12. |
| Block 3 (DSCI 513,522,561,573) | 2026-11-16 | 2026-12-11 | inferred | Teaching weeks; deadlines and quizzes may spill into week 5. |
| Block 3 week 5 / end of Semester 1 | 2026-12-14 | 2026-12-21 | published | Last day of Semester 1 is Dec 21 (published); week 5 Dec 14-18 inferred. |
| Winter break | 2026-12-22 | 2027-01-04 | inferred | Between published Dec 21 and Jan 5 dates; ~2 weeks free for Hyperscale. |
| Block 4 (DSCI 524,541,562,572) | 2027-01-05 | 2027-02-05 | inferred | Semester 2 starts Jan 5 (published); 4 teaching weeks plus week 5 (Feb 1-5) inferred. |
| Semester 2 midterm break | 2027-02-08 | 2027-02-12 | published | Published Feb 8-12 for Blocks 4-6. UBC's own break is Feb 15-19; MDS differs. |
| Block 5 (DSCI 525,553,563,574) | 2027-02-15 | 2027-03-12 | inferred | Program page says Block 5 is 4 weeks plus a 1-week break; exact placement unconfirmed (could instead start Feb 1 with break inside). Week 5 ~Mar 15-19. |
| Block 6 (DSCI 532,542,554,575) | 2027-03-22 | 2027-04-16 | inferred | Good Friday Mar 26 and Easter Monday Mar 29, 2027 (calendar fact) fall inside; week 5 ~Apr 19-23. |
| Capstone (DSCI 591) | 2027-04-26 | 2027-06-24 | published | Kickoff hackathon Apr 26-28 at Point Grey. Source: capstone timeline page. |
| End-of-program celebration | 2027-06-24 | 2027-06-30 | published | 'End of June 2027' per MDS event calendar. |
| Convocation | 2027-11-01 | 2027-11-30 | published | Late November 2027, date TBC. |

**Current block on 2026-11-12:** Between blocks: Block 2 (DSCI 512/531/552/571, Oct 12-Nov 6, inferred) has ended and Nov 9-13 is its week 5 / published Semester 1 midterm break. Block 3 begins ~Nov 16.

## Courses

| Code | Title | Block | Lang | Topics | Depth | Tools |
|---|---|---|---|---|---|---|
| DSCI 511 | Programming for Data Science | 1 | Python | control flow, functions, classes; unit tests, style, scripts; NumPy intro; pandas wrangling | applied, intro | Python, NumPy, pandas, Jupyter |
| DSCI 521 | Computing Platforms for Data Science | 1 | Python/R | Unix shell; git/GitHub; environments, IDEs; literate programming | applied, intro | bash, git, conda, Jupyter |
| DSCI 523 | Programming for Data Manipulation | 1 | R | tidyverse wrangling: filter, group, reshape, clean | applied | R, tidyverse |
| DSCI 551 | Descriptive Statistics and Probability for Data Science | 1 | R | descriptive stats; random variables, distributions; joint/conditional/marginal probability; missing data | intro-moderate, some math | R |
| DSCI 512 | Algorithms and Data Structures | 2 | Python | Big-O; search/sort/hash tables; recursion; graphs; discrete optimization; dynamic programming, speeding up Python | applied analysis with CLRS-style references | Python, Jupyter |
| DSCI 531 | Data Visualization I | 2 | R and Python | principles of visualization; static plots; EDA; ggplot2 and Altair | applied | ggplot2, Altair |
| DSCI 552 | Statistical Inference and Computation I | 2 | R | sampling, bootstrap; CIs via bootstrap and CLT; simulation-based hypothesis tests; t-tests, ANOVA; error types and power | introductory, simulation-first | R, ModernDive |
| DSCI 571 | Supervised Learning I | 2 | Python | baselines, decision trees; ML fundamentals, overfitting, golden rule; kNN, SVM RBF; preprocessing, pipelines, ColumnTransformer, text features; hyperparameter search, optimization bias; naive Bayes; logistic regression, multiclass | applied library use, intuition-first; no from-scratch | scikit-learn, Jupyter, Gradescope |
| DSCI 513 | Databases and Data Retrieval | 3 | SQL (Python/R clients) | relational schemas; SQL queries; embedded SQL; XML/XQuery | applied | SQL |
| DSCI 522 | Data Science Workflows | 3 | Python and R | scripts vs notebooks; Make pipelines; Docker environments; git PR workflow; reproducibility | practical, project-based (team of 3-4) | git, Make, Docker, Jupyter, docopt |
| DSCI 561 | Regression I | 3 | R | linear models in matrix form; categorical/continuous predictors, interactions; least squares, CIs, prediction intervals; diagnostics, multicollinearity, influence; bootstrap | applied statistical inference with some matrix math | R, broom |
| DSCI 573 | Feature and Model Selection | 3 | Python | classification metrics, class imbalance; regression metrics; feature engineering; feature importance and selection; loss functions, L1/L2 regularization; ensembles; SHAP interpretability | applied; explains regularization but mostly library use | scikit-learn, SHAP, spaCy |
| DSCI 524 | Collaborative Software Development | 4 | Python (likely; repo not explicit) | software life cycle; unit testing, CI; packaging and distribution; licenses; abstraction | practical (course page lacks lecture list) | git, pytest (inferred), GitHub Actions (inferred) |
| DSCI 541 | Privacy, Ethics, and Security | 4 | n/a (non-coding) | privacy law, ethics boards; data security, social engineering; anonymization, encryption; case studies | conceptual |  |
| DSCI 562 | Regression II | 4 | R | GLMs, count regression; multinomial/ordinal logistic; linear mixed-effects; survival analysis; local, quantile regression; missing data | applied, assumes solid stats background | R |
| DSCI 572 | Supervised Learning II | 4 | Python | floating point errors; gradient descent, SGD; intro neural nets in PyTorch; training neural nets; CNNs, transfer learning; GANs high level | applied; implement small nets in PyTorch, backprop conceptual | PyTorch, Jupyter |
| DSCI 525 | Web and Cloud Computing | 5 | Python and R | scraping, APIs; how the internet works; cloud computing (EC2); MapReduce, NoSQL; parallel computing | introductory (repo seen is 2019; current offering may differ) | scrapy, BeautifulSoup, EC2, Docker, Spark |
| DSCI 553 | Statistical Inference and Computation II | 5 | R | multiple testing, FDR; Bayesian prior-to-posterior; beta-binomial; MCMC; Bayesian regression and logistic; hierarchical models, diagnostics | applied Bayesian, Bayes Rules! textbook | R, Stan/rstan |
| DSCI 563 | Unsupervised Learning | 5 | Python | k-means, GMM/EM; DBSCAN, hierarchical; PCA, LSA, NMF, autoencoders; word2vec embeddings; topic models; recommender systems | applied with intuition; no from-scratch stated | scikit-learn, Jupyter |
| DSCI 574 | Spatial and Temporal Models | 5 | R (2019 repo) or Python; unconfirmed | time series, ARIMA; state space, change-point detection; hidden Markov models; Gaussian processes, kriging | 2019 repo had formal derivations (MA/AR moments, stationarity); current depth unconfirmed | R/gstat (2019) |
| DSCI 532 | Data Visualization II | 6 | Python | interactive dashboards; multiple views; design choices | applied | Dash/Shiny (unconfirmed), Altair |
| DSCI 542 | Communication and Argumentation | 6 | n/a | claims, evidence; written/oral presentation | soft skills |  |
| DSCI 554 | Experimentation and Causal Inference | 6 | R | multiple comparisons; randomization, blocking, power; A/B testing, early stopping; observational data, confounding; matched case-control | applied frequentist, regression-based | R, Stan |
| DSCI 575 | Advanced Machine Learning | 6 | Python | Markov models, language models, PageRank; HMMs, Viterbi, Baum-Welch; RNNs; transformers, self-attention; applications, LLMs (overview) | conceptual-to-applied; one lecture each on transformers/LLMs | PyTorch/HF (inferred), Jupyter |
| DSCI 591 | Capstone Project | 7 | Python/R | partner project, reproducible pipeline, report, presentation | team project, Apr 26 - Jun 24 2027 | git, Docker, partner stack |

Caveat: several course repos are older offerings (DSCI 574 and 525 from 2019, 522 from 2019-20); 2026-27 content may differ.

## Coverage map

| # | Module | MDS courses | Coverage | Timing | Recommendation | Notes |
|---|---|---|---|---|---|---|
| 1 | Python for ML engineering | DSCI 511, 512, 524, 522 | light | B1 Sep-Oct; B2 Oct-Nov; B3 Nov-Dec; B4 Jan | deepen | MDS teaches basic Python, pandas (not Polars/DuckDB), unit tests, Make/Docker. Hyperscale: NumPy vectorization/broadcasting/perf, typing, pytest, uv, Polars, DuckDB. |
| 2 | Linear algebra | DSCI 561, 563 | light | B3 (matrix form of OLS); B5 (PCA) | teach-fully | Only matrix notation for regression and PCA use; no SVD/eigen theory. |
| 3 | Calculus & optimization | DSCI 572, 512 | light | B4 Jan; B2 | deepen | 572 covers GD/SGD and float error applied; add convexity, second-order methods, constrained optimization. Learner's calculus is strong. |
| 4 | Probability & statistics | DSCI 551, 552, 553, 561, 562 | strong | B1-B5 (R) | accelerate | Heavy frequentist and Bayesian coverage in R. Diagnostic plus Python equivalents (scipy, statsmodels, bootstrap in NumPy); add MLE/asymptotics if missing. |
| 5 | Information theory | DSCI 571 | none | - | teach-fully | Entropy appears only implicitly in trees. |
| 6 | Linear/logistic regression, regularization, bias-variance | DSCI 561, 562, 571, 573 | strong | B2 logistic; B3 OLS/regularization | deepen | Covered as inference (R) and applied sklearn. Add from-scratch GD, closed form, probabilistic derivations. Python equivalent of R GLM material. |
| 7 | Model evaluation | DSCI 571, 573 | strong | B2-B3 | accelerate | Metrics, CV, imbalance, SHAP covered. Add calibration, leakage case studies, grouped/time-series CV. |
| 8 | Trees, forests, boosting | DSCI 571, 572, 573 | moderate | B2, B3, B4 | deepen | Trees and RF applied; boosting internals (XGBoost/LightGBM) mostly absent. |
| 9 | SVMs, kernels, kNN | DSCI 571, 572 | moderate | B2, B4 | accelerate | Applied usage; add kernel math and dual form briefly. |
| 10 | Unsupervised learning | DSCI 563 | strong | B5 Feb-Mar | accelerate | k-means, GMM/EM, PCA, NMF, hierarchical, topic models, recsys. Targeted extensions: t-SNE/UMAP, EM from scratch. |
| 11 | Feature engineering & data pipelines | DSCI 571, 573, 522 | moderate | B2-B3 | deepen | sklearn pipelines and feature work; add production pipelines, Polars/DuckDB, leakage-safe design. |
| 12 | Autograd from scratch | DSCI 572 | light | B4 Jan | teach-fully | Backprop is conceptual; no engine built. |
| 13 | Training deep nets | DSCI 572 | light | B4 | deepen | Basic training recipes only; add init, normalization, schedules, debugging. |
| 14 | PyTorch fluency | DSCI 572 | light | B4 | deepen | Basic PyTorch; add GPU, AMP, custom modules/data loaders. |
| 15 | CNNs, RNNs/LSTMs, attention | DSCI 572, 575 | moderate | B4 CNN; B6 RNN/attention | deepen | Conceptual/applied; add from-scratch implementations. |
| 16 | Transformers from scratch | DSCI 575 | light | B6 Mar-Apr | teach-fully | One-two lectures, applied. |
| 17 | Pretraining, scaling laws, fine-tuning, RLHF | DSCI 575 | light | B6 | teach-fully | LLM overview only. |
| 18 | Inference & serving optimization |  | none | - | teach-fully |  |
| 19 | Building with LLMs | DSCI 575 | light | B6 | teach-fully | No RAG/agents/MCP expected; confirm with 2026-27 syllabus. |
| 20 | Generative models | DSCI 572, 563 | light | B4 (GANs high level); B5 autoencoders | teach-fully | No VAEs/diffusion. |
| 21 | Time series | DSCI 574 | moderate | B5 Feb-Mar | deepen | ARIMA, state space, HMMs, GPs. Add GBM and DL forecasters, probabilistic forecasting, backtesting. Check whether 574 is R or Python. |
| 22 | Anomaly detection & fault diagnosis | DSCI 574 | light | B5 | teach-fully | Change-point detection only. |
| 23 | Reinforcement learning |  | none | - | teach-fully |  |
| 24 | Optimization & control | DSCI 512 | light | B2 | teach-fully | Only discrete optimization/DP. |
| 25 | Bayesian methods & UQ | DSCI 553, 574 | moderate | B5 | accelerate | Stan in R; give PyMC/NumPyro equivalents; add conformal prediction, ensembles, calibration. |
| 26 | Causal inference | DSCI 554 | moderate | B6 | deepen | Frequentist/regression in R; add DAGs, potential outcomes, DoWhy/EconML in Python. |
| 27 | ML system design | DSCI 591 | light | Capstone Apr-Jun | teach-fully | Interview-style design not covered. |
| 28 | MLOps | DSCI 522, 524, 525 | light | B3, B4, B5 | deepen | Docker, Make, CI, intro cloud (EC2); add tracking, serving, monitoring, AWS/Azure ML. |
| 29 | Scaling & distributed training | DSCI 525 | light | B5 | teach-fully | Intro parallel computing only. |
| 30 | Responsible AI | DSCI 541 | light | B4 | deepen | Privacy/ethics/security; add fairness, model risk. |

## R-taught topics needing Python equivalents
DSCI 523 (tidyverse), 551, 552, 553 (Stan/rstan), 561, 562 (GLMs, mixed effects, survival, quantile), 554 (experiments, causal), likely 574 labs. Provide statsmodels, scipy, PyMC/NumPyro, lifelines, DoWhy/EconML equivalents.