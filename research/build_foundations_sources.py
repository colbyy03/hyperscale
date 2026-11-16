"""Build research/sources-pedagogy-foundations.json.

The foundations pedagogy stream cited ~220 sources by id in
research/pedagogy-foundations.md but was interrupted before writing its source
file. This script reconstructs the records:

- entries with a DOI are resolved through the Crossref API; Crossref metadata
  (title, authors, year, venue) is used and the record is marked verified when
  the returned title matches the expected title;
- entries without a DOI (books, courses, docs, preprints, web pages) are fetched
  and marked verified when the page loads and contains the expected phrase;
- module numbers (brief numbering) come from the module sections of the .md file
  in which each id is cited.

Usage:  python3 research/build_foundations_sources.py
"""

from __future__ import annotations

import concurrent.futures as cf
import difflib
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
UA = "hyperscale-course-research/0.1 (citation verification script)"
ACCESSED = "2026-11-16"

# (id, type, expected title, year, doi)
DOI = [
 ("abadie2021-synthetic-control", "paper", "Using Synthetic Controls: Feasibility, Data Requirements, and Methodological Aspects", 2021, "10.1257/jel.20191450"),
 ("abrilpla2023-pymc", "paper", "PyMC: a modern, and comprehensive probabilistic programming framework in Python", 2023, "10.7717/peerj-cs.1516"),
 ("adesope2017-practice-testing-meta", "paper", "Rethinking the Use of Tests: A Meta-Analysis of Practice Testing", 2017, "10.3102/0034654316689306"),
 ("akaike1974-aic", "paper", "A new look at the statistical model identification", 1974, "10.1109/TAC.1974.1100705"),
 ("aleven2016-help-seeking", "paper", "Help Helps, But Only So Much: Research on Help Seeking with Intelligent Tutoring Systems", 2016, "10.1007/s40593-015-0089-1"),
 ("angelopoulos2023-conformal", "paper", "Conformal Prediction: A Gentle Introduction", 2023, "10.1561/2200000101"),
 ("atkinson2003-fading-self-explanation", "paper", "Transitioning From Studying Examples to Solving Problems: Effects of Self-Explanation Prompts and Fading Worked-Out Steps", 2003, "10.1037/0022-0663.95.4.774"),
 ("belkin2019-double-descent", "paper", "Reconciling modern machine-learning practice and the classical bias-variance trade-off", 2019, "10.1073/pnas.1903070116"),
 ("benjamini1995-fdr", "paper", "Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing", 1995, "10.1111/j.2517-6161.1995.tb02031.x"),
 ("bergmeir2012-ts-cv", "paper", "On the use of cross-validation for time series predictor evaluation", 2012, "10.1016/j.ins.2011.12.028"),
 ("berkooz1993-pod", "paper", "The Proper Orthogonal Decomposition in the Analysis of Turbulent Flows", 1993, "10.1146/annurev.fl.25.010193.002543"),
 ("beyer1999-nn-meaningful", "paper", "When Is Nearest Neighbor Meaningful?", 1999, "10.1007/3-540-49257-7_15"),
 ("bishop2024-deep-learning", "book", "Deep Learning: Foundations and Concepts", 2024, "10.1007/978-3-031-45468-4"),
 ("bjork2013-self-regulated", "paper", "Self-Regulated Learning: Beliefs, Techniques, and Illusions", 2013, "10.1146/annurev-psych-113011-143823"),
 ("blei2017-vi", "paper", "Variational Inference: A Review for Statisticians", 2017, "10.1080/01621459.2017.1285773"),
 ("bloom1984-two-sigma", "paper", "The 2 Sigma Problem: The Search for Methods of Group Instruction as Effective as One-to-One Tutoring", 1984, "10.3102/0013189X013006004"),
 ("bottou2018-optimization", "paper", "Optimization Methods for Large-Scale Machine Learning", 2018, "10.1137/16M1080173"),
 ("breiman2001-random-forests", "paper", "Random Forests", 2001, "10.1023/A:1010933404324"),
 ("brodersen2015-causalimpact", "paper", "Inferring causal impact using Bayesian structural time-series models", 2015, "10.1214/14-AOAS788"),
 ("brunmair2019-interleaving-meta", "paper", "Similarity matters: A meta-analysis of interleaved learning and its moderators", 2019, "10.1037/bul0000209"),
 ("brunton2022-ddse", "book", "Data-Driven Science and Engineering: Machine Learning, Dynamical Systems, and Control", 2022, "10.1017/9781009089517"),
 ("butler2010-testing-transfer", "paper", "Repeated testing produces superior transfer of learning relative to repeated studying", 2010, "10.1037/a0019902"),
 ("campello2013-hdbscan", "paper", "Density-Based Clustering Based on Hierarchical Density Estimates", 2013, "10.1007/978-3-642-37456-2_14"),
 ("carpenter2017-stan", "paper", "Stan: A Probabilistic Programming Language", 2017, "10.18637/jss.v076.i01"),
 ("cepeda2006-distributed-practice", "paper", "Distributed practice in verbal recall tasks: A review and quantitative synthesis", 2006, "10.1037/0033-2909.132.3.354"),
 ("cepeda2008-spacing-ridgeline", "paper", "Spacing Effects in Learning: A Temporal Ridgeline of Optimal Retention", 2008, "10.1111/j.1467-9280.2008.02209.x"),
 ("cerda2018-dirty-categories", "paper", "Similarity encoding for learning with dirty categorical variables", 2018, "10.1007/s10994-018-5724-2"),
 ("chang2011-libsvm", "paper", "LIBSVM: A library for support vector machines", 2011, "10.1145/1961189.1961199"),
 ("chawla2002-smote", "paper", "SMOTE: Synthetic Minority Over-sampling Technique", 2002, "10.1613/jair.953"),
 ("chen2016-xgboost", "paper", "XGBoost: A Scalable Tree Boosting System", 2016, "10.1145/2939672.2939785"),
 ("chernozhukov2018-dml", "paper", "Double/debiased machine learning for treatment and structural parameters", 2018, "10.1111/ectj.12097"),
 ("chi1989-self-explanation", "paper", "Self-Explanations: How Students Study and Use Examples in Learning to Solve Problems", 1989, "10.1207/s15516709cog1302_1"),
 ("corbett1995-knowledge-tracing", "paper", "Knowledge tracing: Modeling the acquisition of procedural knowledge", 1995, "10.1007/BF01099821"),
 ("cortes1995-svm", "paper", "Support-vector networks", 1995, "10.1007/BF00994018"),
 ("cover1967-nn", "paper", "Nearest neighbor pattern classification", 1967, "10.1109/TIT.1967.1053964"),
 ("cover2006-elements-it", "book", "Elements of Information Theory", 2006, "10.1002/047174882X"),
 ("crouch2004-predict-demos", "paper", "Classroom demonstrations: Learning tools or entertainment?", 2004, "10.1119/1.1707018"),
 ("dempster1977-em", "paper", "Maximum Likelihood from Incomplete Data Via the EM Algorithm", 1977, "10.1111/j.2517-6161.1977.tb01600.x"),
 ("deng2013-cuped", "paper", "Improving the sensitivity of online controlled experiments by utilizing pre-experiment data", 2013, "10.1145/2433396.2433413"),
 ("denny2008-parsons-exam", "paper", "Evaluating a new exam question: Parsons problems", 2008, "10.1145/1404520.1404532"),
 ("deslauriers2019-feeling-of-learning", "paper", "Measuring actual learning versus feeling of learning in response to being actively engaged in the classroom", 2019, "10.1073/pnas.1821936116"),
 ("dietterich1998-tests", "paper", "Approximate Statistical Tests for Comparing Supervised Classification Learning Algorithms", 1998, "10.1162/089976698300017197"),
 ("du2020-parsons-review", "paper", "A Review of Research on Parsons Problems", 2020, "10.1145/3373165.3373187"),
 ("dunlosky2013-learning-techniques", "paper", "Improving Students' Learning With Effective Learning Techniques", 2013, "10.1177/1529100612453266"),
 ("efron1979-bootstrap", "paper", "Bootstrap Methods: Another Look at the Jackknife", 1979, "10.1214/aos/1176344552"),
 ("efron2016-casi", "book", "Computer Age Statistical Inference", 2016, "10.1017/CBO9781316576533"),
 ("ericson2017-parsons", "paper", "Solving parsons problems versus fixing and writing code", 2017, "10.1145/3141880.3141895"),
 ("ericson2018-adaptive-parsons", "paper", "Evaluating the Efficiency and Effectiveness of Adaptive Parsons Problems", 2018, "10.1145/3230977.3231000"),
 ("ericsson1993-deliberate-practice", "paper", "The role of deliberate practice in the acquisition of expert performance", 1993, "10.1037/0033-295X.100.3.363"),
 ("freeman2014-active-learning", "paper", "Active learning increases student performance in science, engineering, and mathematics", 2014, "10.1073/pnas.1319030111"),
 ("freund1997-adaboost", "paper", "A Decision-Theoretic Generalization of On-Line Learning and an Application to Boosting", 1997, "10.1006/jcss.1997.1504"),
 ("friedman2000-additive-logistic", "paper", "Additive logistic regression: a statistical view of boosting", 2000, "10.1214/aos/1016218223"),
 ("friedman2001-gbm", "paper", "Greedy function approximation: A gradient boosting machine", 2001, "10.1214/aos/1013203451"),
 ("friedman2002-stochastic-gb", "paper", "Stochastic gradient boosting", 2002, "10.1016/S0167-9473(01)00065-2"),
 ("friedman2010-glmnet", "paper", "Regularization Paths for Generalized Linear Models via Coordinate Descent", 2010, "10.18637/jss.v033.i01"),
 ("gneiting2007-calibration-sharpness", "paper", "Probabilistic forecasts, calibration and sharpness", 2007, "10.1111/j.1467-9868.2007.00587.x"),
 ("gneiting2007-proper-scoring", "paper", "Strictly Proper Scoring Rules, Prediction, and Estimation", 2007, "10.1198/016214506000001437"),
 ("goh2017-momentum", "web", "Why Momentum Really Works", 2017, "10.23915/distill.00006"),
 ("goldberg1991-floating-point", "paper", "What every computer scientist should know about floating-point arithmetic", 1991, "10.1145/103162.103163"),
 ("golub1979-gcv", "paper", "Generalized Cross-Validation as a Method for Choosing a Good Ridge Parameter", 1979, "10.1080/00401706.1979.10489751"),
 ("grosse2007-erroneous-examples", "paper", "Finding and fixing errors in worked examples: Can this foster learning outcomes?", 2007, "10.1016/j.learninstruc.2007.09.008"),
 ("halko2011-randomized", "paper", "Finding Structure with Randomness: Probabilistic Algorithms for Constructing Approximate Matrix Decompositions", 2011, "10.1137/090771806"),
 ("hansen1998-rank-deficient", "book", "Rank-Deficient and Discrete Ill-Posed Problems", 1998, "10.1137/1.9780898719697"),
 ("harris2020-numpy", "paper", "Array programming with NumPy", 2020, "10.1038/s41586-020-2649-2"),
 ("hattie2007-feedback", "paper", "The Power of Feedback", 2007, "10.3102/003465430298487"),
 ("hernan2016-target-trial", "paper", "Using Big Data to Emulate a Target Trial When a Randomized Trial Is Not Available", 2016, "10.1093/aje/kwv254"),
 ("hestenes1952-cg", "paper", "Methods of conjugate gradients for solving linear systems", 1952, "10.6028/jres.049.044"),
 ("hoerl1970-ridge", "paper", "Ridge Regression: Biased Estimation for Nonorthogonal Problems", 1970, "10.1080/00401706.1970.10488634"),
 ("hundhausen2002-av-meta", "paper", "A Meta-Study of Algorithm Visualization Effectiveness", 2002, "10.1006/jvlc.2002.0237"),
 ("imbens2015-causal-inference", "book", "Causal Inference for Statistics, Social, and Biomedical Sciences", 2015, "10.1017/CBO9781139025751"),
 ("james2023-islp", "book", "An Introduction to Statistical Learning", 2023, "10.1007/978-3-031-38747-0"),
 ("jaynes1957-maxent", "paper", "Information Theory and Statistical Mechanics", 1957, "10.1103/PhysRev.106.620"),
 ("johnson2021-faiss", "paper", "Billion-Scale Similarity Search with GPUs", 2021, "10.1109/TBDATA.2019.2921572"),
 ("jolliffe2016-pca", "paper", "Principal component analysis: a review and recent developments", 2016, "10.1098/rsta.2015.0202"),
 ("kalman1960-filter", "paper", "A New Approach to Linear Filtering and Prediction Problems", 1960, "10.1115/1.3662552"),
 ("kalyuga2003-expertise-reversal", "paper", "The Expertise Reversal Effect", 2003, "10.1207/S15326985EP3801_4"),
 ("kapoor2023-leakage", "paper", "Leakage and the reproducibility crisis in machine-learning-based science", 2023, "10.1016/j.patter.2023.100804"),
 ("kapur2008-productive-failure", "paper", "Productive Failure", 2008, "10.1080/07370000802212669"),
 ("kapur2016-pf-design", "paper", "Examining Productive Failure, Productive Success, Unproductive Failure, and Unproductive Success in Learning", 2016, "10.1080/00461520.2016.1155457"),
 ("karpicke2011-retrieval-practice", "paper", "Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping", 2011, "10.1126/science.1199327"),
 ("kaufman2012-leakage", "paper", "Leakage in data mining: Formulation, detection, and avoidance", 2012, "10.1145/2382577.2382579"),
 ("keller1968-psi", "paper", "Good-bye, teacher...", 1968, "10.1901/jaba.1968.1-79"),
 ("kennedy2001-calibration", "paper", "Bayesian calibration of computer models", 2001, "10.1111/1467-9868.00294"),
 ("kirschner2006-minimal-guidance", "paper", "Why Minimal Guidance During Instruction Does Not Work", 2006, "10.1207/s15326985ep4102_1"),
 ("kluger1996-feedback", "paper", "The effects of feedback interventions on performance", 1996, "10.1037/0033-2909.119.2.254"),
 ("kobak2021-init", "paper", "Initialization is critical for preserving global data structure in both t-SNE and UMAP", 2021, "10.1038/s41587-020-00809-z"),
 ("koedinger2007-assistance-dilemma", "paper", "Exploring the Assistance Dilemma in Experiments with Cognitive Tutors", 2007, "10.1007/s10648-007-9049-0"),
 ("kohavi2020-online-experiments", "book", "Trustworthy Online Controlled Experiments", 2020, "10.1017/9781108653985"),
 ("kornell2008-interleaving", "paper", "Learning Concepts and Categories: Is Spacing the Enemy of Induction?", 2008, "10.1111/j.1467-9280.2008.02127.x"),
 ("kulik1990-mastery-meta", "paper", "Effectiveness of Mastery Learning Programs: A Meta-Analysis", 1990, "10.3102/00346543060002265"),
 ("kullback1951-kl", "paper", "On Information and Sufficiency", 1951, "10.1214/aoms/1177729694"),
 ("kumar2019-arviz", "paper", "ArviZ a unified library for exploratory analysis of Bayesian models in Python", 2019, "10.21105/joss.01143"),
 ("kunzel2019-metalearners", "paper", "Metalearners for estimating heterogeneous treatment effects using machine learning", 2019, "10.1073/pnas.1804597116"),
 ("lloyd1982-kmeans", "paper", "Least squares quantization in PCM", 1982, "10.1109/TIT.1982.1056489"),
 ("loibl2017-ps-i", "paper", "Towards a Theory of When and How Problem Solving Followed by Instruction Supports Learning", 2017, "10.1007/s10648-016-9379-x"),
 ("lundberg2020-treeshap", "paper", "From local explanations to global understanding with explainable AI for trees", 2020, "10.1038/s42256-019-0138-9"),
 ("maciver2019-hypothesis", "paper", "Hypothesis: A new approach to property-based testing", 2019, "10.21105/joss.01891"),
 ("macnamara2014-dp-meta", "paper", "Deliberate Practice and Performance in Music, Games, Sports, Education, and Professions", 2014, "10.1177/0956797614535810"),
 ("malkov2020-hnsw", "paper", "Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs", 2020, "10.1109/TPAMI.2018.2889473"),
 ("mcelreath2020-rethinking", "book", "Statistical Rethinking", 2020, "10.1201/9780429029608"),
 ("micci-barreca2001-target-encoding", "paper", "A preprocessing scheme for high-cardinality categorical attributes in classification and prediction problems", 2001, "10.1145/507533.507538"),
 ("naps2002-engagement", "paper", "Exploring the role of visualization and engagement in computer science education", 2002, "10.1145/782941.782998"),
 ("niculescu-mizil2005-probabilities", "paper", "Predicting good probabilities with supervised learning", 2005, "10.1145/1102351.1102430"),
 ("nocedal2006-numerical-optimization", "book", "Numerical Optimization", 2006, "10.1007/978-0-387-40065-5"),
 ("pargent2022-target-encoding", "paper", "Regularized target encoding outperforms traditional methods in supervised machine learning with high cardinality features", 2022, "10.1007/s00180-022-01207-6"),
 ("pearl2009-causal-overview", "paper", "Causal inference in statistics: An overview", 2009, "10.1214/09-SS057"),
 ("polyak1964-heavy-ball", "paper", "Some methods of speeding up the convergence of iteration methods", 1964, "10.1016/0041-5553(64)90137-5"),
 ("raasveldt2019-duckdb", "paper", "DuckDB: an Embeddable Analytical Database", 2019, "10.1145/3299869.3320212"),
 ("renkl2002-fading", "paper", "From Example Study to Problem Solving: Smooth Transitions Help Learning", 2002, "10.1080/00220970209599510"),
 ("renkl2003-transition", "paper", "Structuring the Transition From Example Study to Problem Solving in Cognitive Skill Acquisition: A Cognitive Load Perspective", 2003, "10.1207/S15326985EP3801_3"),
 ("robbins1951-sgd", "paper", "A Stochastic Approximation Method", 1951, "10.1214/aoms/1177729586"),
 ("roberts2017-structured-cv", "paper", "Cross-validation strategies for data with temporal, spatial, hierarchical, or phylogenetic structure", 2017, "10.1111/ecog.02881"),
 ("roediger2006-test-enhanced-learning", "paper", "Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention", 2006, "10.1111/j.1467-9280.2006.01693.x"),
 ("rohrer2007-shuffling", "paper", "The shuffling of mathematics problems improves learning", 2007, "10.1007/s11251-007-9015-8"),
 ("rohrer2015-interleaving", "paper", "Interleaved practice improves mathematics learning", 2015, "10.1037/edu0000001"),
 ("rohrer2020-interleaving-rct", "paper", "A randomized controlled trial of interleaved mathematics practice", 2020, "10.1037/edu0000367"),
 ("rosenbaum1983-propensity", "paper", "The central role of the propensity score in observational studies for causal effects", 1983, "10.1093/biomet/70.1.41"),
 ("rousseeuw1987-silhouette", "paper", "Silhouettes: A graphical aid to the interpretation and validation of cluster analysis", 1987, "10.1016/0377-0427(87)90125-7"),
 ("rowland2014-testing-meta", "paper", "The effect of testing versus restudy on retention: A meta-analytic review of the testing effect", 2014, "10.1037/a0037559"),
 ("saad2003-iterative-methods", "book", "Iterative Methods for Sparse Linear Systems", 2003, "10.1137/1.9780898718003"),
 ("saito2015-pr-roc", "paper", "The Precision-Recall Plot Is More Informative than the ROC Plot When Evaluating Binary Classifiers on Imbalanced Datasets", 2015, "10.1371/journal.pone.0118432"),
 ("schmid2010-dmd", "paper", "Dynamic mode decomposition of numerical and experimental data", 2010, "10.1017/S0022112010001217"),
 ("scholkopf2002-kernels", "book", "Learning with Kernels", 2002, "10.7551/mitpress/4175.001.0001"),
 ("settles2016-hlr", "paper", "A Trainable Spaced Repetition Model for Language Learning", 2016, "10.18653/v1/P16-1174"),
 ("shannon1948-communication", "paper", "A Mathematical Theory of Communication", 1948, "10.1002/j.1538-7305.1948.tb01338.x"),
 ("shute2008-formative-feedback", "paper", "Focus on Formative Feedback", 2008, "10.3102/0034654307313795"),
 ("sinha2021-pf-meta", "paper", "When Problem Solving Followed by Instruction Works: Evidence for Productive Failure", 2021, "10.3102/00346543211019105"),
 ("smith2013-uq", "book", "Uncertainty Quantification: Theory, Implementation, and Applications", 2013, "10.1137/1.9781611973228"),
 ("strobl2007-importance-bias", "paper", "Bias in random forest variable importance measures: Illustrations, sources and a solution", 2007, "10.1186/1471-2105-8-25"),
 ("su2023-fsrs-tkde", "paper", "Optimizing Spaced Repetition Schedule by Capturing the Dynamics of Memory", 2023, "10.1109/TKDE.2023.3251721"),
 ("sweller1985-worked-examples", "paper", "The Use of Worked Examples as a Substitute for Problem Solving in Learning Algebra", 1985, "10.1207/s1532690xci0201_3"),
 ("sweller1988-cognitive-load", "paper", "Cognitive Load During Problem Solving: Effects on Learning", 1988, "10.1207/s15516709cog1202_4"),
 ("taira2017-modal", "paper", "Modal Analysis of Fluid Flows: An Overview", 2017, "10.2514/1.J056060"),
 ("tibshirani1996-lasso", "paper", "Regression Shrinkage and Selection Via the Lasso", 1996, "10.1111/j.2517-6161.1996.tb02080.x"),
 ("trefethen1997-nla", "book", "Numerical Linear Algebra", 1997, "10.1137/1.9780898719574"),
 ("vandengoorbergh2022-imbalance", "paper", "The harm of class imbalance corrections for risk prediction models: illustration and simulation using logistic regression", 2022, "10.1093/jamia/ocac093"),
 ("vanlehn2011-tutoring", "paper", "The Relative Effectiveness of Human Tutoring, Intelligent Tutoring Systems, and Other Tutoring Systems", 2011, "10.1080/00461520.2011.611369"),
 ("varma2006-nested-cv", "paper", "Bias in error estimation when using cross-validation for model selection", 2006, "10.1186/1471-2105-7-91"),
 ("vehtari2017-loo", "paper", "Practical Bayesian model evaluation using leave-one-out cross-validation and WAIC", 2017, "10.1007/s11222-016-9696-4"),
 ("vehtari2021-rhat", "paper", "Rank-Normalization, Folding, and Localization: An Improved R-hat for Assessing Convergence of MCMC", 2021, "10.1214/20-BA1221"),
 ("wager2018-causal-forests", "paper", "Estimation and Inference of Heterogeneous Treatment Effects using Random Forests", 2018, "10.1080/01621459.2017.1319839"),
 ("wasserman2004-all-of-statistics", "book", "All of Statistics", 2004, "10.1007/978-0-387-21736-9"),
 ("wasserstein2016-pvalues", "paper", "The ASA Statement on p-Values: Context, Process, and Purpose", 2016, "10.1080/00031305.2016.1154108"),
 ("wattenberg2016-tsne", "web", "How to Use t-SNE Effectively", 2016, "10.23915/distill.00002"),
 ("weinstein2018-science-of-learning", "paper", "Teaching the science of learning", 2018, "10.1186/s41235-017-0087-y"),
 ("wilson2014-sci-computing", "paper", "Best Practices for Scientific Computing", 2014, "10.1371/journal.pbio.1001745"),
 ("wood1976-scaffolding", "paper", "The role of tutoring in problem solving", 1976, "10.1111/j.1469-7610.1976.tb00381.x"),
 ("ye2022-ssp-mmc", "paper", "A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling", 2022, "10.1145/3534678.3539081"),
 ("zadrozny2002-isotonic", "paper", "Transforming classifier scores into accurate multiclass probability estimates", 2002, "10.1145/775047.775151"),
 ("zou2005-elastic-net", "paper", "Regularization and Variable Selection Via the Elastic Net", 2005, "10.1111/j.1467-9868.2005.00503.x"),
]

# (id, type, title, authors, year, venue, url, phrase-that-must-appear-on-page)
URL = [
 ("anki-manual-fsrs", "web", "Anki Manual: Deck Options (FSRS)", ["Ankitects"], 2026, "Anki Manual", "https://docs.ankiweb.net/deck-options.html", "fsrs"),
 ("arthur2007-kmeanspp", "paper", "k-means++: The Advantages of Careful Seeding", ["Arthur, David", "Vassilvitskii, Sergei"], 2007, "SODA 2007", "https://theory.stanford.edu/~sergei/papers/kMeansPP-soda.pdf", None),
 ("baydin2018-autodiff", "paper", "Automatic Differentiation in Machine Learning: a Survey", ["Baydin, Atilim Gunes", "Pearlmutter, Barak A.", "Radul, Alexey Andreyevich", "Siskind, Jeffrey Mark"], 2018, "Journal of Machine Learning Research 18(153)", "https://jmlr.org/papers/v18/17-468.html", "automatic differentiation"),
 ("betancourt2017-hmc", "paper", "A Conceptual Introduction to Hamiltonian Monte Carlo", ["Betancourt, Michael"], 2017, "arXiv:1701.02434", "https://arxiv.org/abs/1701.02434", "hamiltonian monte carlo"),
 ("bishop2006-prml", "book", "Pattern Recognition and Machine Learning", ["Bishop, Christopher M."], 2006, "Springer", "https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/", "pattern recognition"),
 ("blitzstein2019-probability", "book", "Introduction to Probability (2nd ed.)", ["Blitzstein, Joseph K.", "Hwang, Jessica"], 2019, "CRC Press", "http://probabilitybook.net/", "probability"),
 ("boyd2018-vmls", "book", "Introduction to Applied Linear Algebra: Vectors, Matrices, and Least Squares", ["Boyd, Stephen", "Vandenberghe, Lieven"], 2018, "Cambridge University Press", "https://web.stanford.edu/~boyd/vmls/", "least squares"),
 ("cawley2010-selection-bias", "paper", "On Over-fitting in Model Selection and Subsequent Selection Bias in Performance Evaluation", ["Cawley, Gavin C.", "Talbot, Nicola L. C."], 2010, "Journal of Machine Learning Research 11", "https://jmlr.org/papers/v11/cawley10a.html", "selection bias"),
 ("cs229-stanford-2025", "course", "CS229: Machine Learning (Stanford, Fall 2025 / Summer 2026)", ["Stanford University"], 2025, "Stanford University", "https://cs229.stanford.edu/", "machine learning"),
 ("cunningham2021-mixtape", "book", "Causal Inference: The Mixtape", ["Cunningham, Scott"], 2021, "Yale University Press", "https://mixtape.scunning.com/", "causal"),
 ("deisenroth2020-mml", "book", "Mathematics for Machine Learning", ["Deisenroth, Marc Peter", "Faisal, A. Aldo", "Ong, Cheng Soon"], 2020, "Cambridge University Press", "https://mml-book.github.io/", "mathematics for machine learning"),
 ("duckdb-docs-2-0", "software", "DuckDB documentation", ["DuckDB Foundation"], 2026, "duckdb.org", "https://duckdb.org/docs/", "duckdb"),
 ("ester1996-dbscan", "paper", "A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise", ["Ester, Martin", "Kriegel, Hans-Peter", "Sander, Jörg", "Xu, Xiaowei"], 1996, "KDD-96 (AAAI)", "https://cdn.aaai.org/KDD/1996/KDD96-037.pdf", None),
 ("facure-brave-true", "book", "Causal Inference for the Brave and True", ["Facure, Matheus"], 2022, "online book", "https://matheusfacure.github.io/python-causality-handbook/", "causal"),
 ("fsrs-abc-wiki", "web", "ABC of FSRS (FSRS wiki)", ["open-spaced-repetition"], 2025, "GitHub wiki", "https://github.com/open-spaced-repetition/fsrs4anki/wiki/ABC-of-FSRS", "fsrs"),
 ("fsrs-srs-benchmark", "software", "srs-benchmark: a benchmark for spaced repetition schedulers", ["open-spaced-repetition"], 2026, "GitHub", "https://github.com/open-spaced-repetition/srs-benchmark", "benchmark"),
 ("fsrs-ts-fsrs", "software", "ts-fsrs: TypeScript implementation of FSRS", ["open-spaced-repetition"], 2026, "GitHub", "https://github.com/open-spaced-repetition/ts-fsrs", "fsrs"),
 ("gelman2013-bda3", "book", "Bayesian Data Analysis (3rd ed.)", ["Gelman, Andrew", "Carlin, John B.", "Stern, Hal S.", "Dunson, David B.", "Vehtari, Aki", "Rubin, Donald B."], 2013, "CRC Press", "https://sites.stat.columbia.edu/gelman/book/", "bayesian data analysis"),
 ("gelman2020-workflow", "paper", "Bayesian Workflow", ["Gelman, Andrew", "Vehtari, Aki", "Simpson, Daniel", "et al."], 2020, "arXiv:2011.01808", "https://arxiv.org/abs/2011.01808", "bayesian workflow"),
 ("gorelick2025-hpp3", "book", "High Performance Python (3rd ed.)", ["Gorelick, Micha", "Ozsvald, Ian"], 2025, "O'Reilly Media", "https://www.oreilly.com/library/view/high-performance-python/9781098165956/", "high performance python"),
 ("grinsztajn2022-tabular-trees", "paper", "Why do tree-based models still outperform deep learning on typical tabular data?", ["Grinsztajn, Léo", "Oyallon, Edouard", "Varoquaux, Gaël"], 2022, "NeurIPS 2022 Datasets and Benchmarks", "https://arxiv.org/abs/2207.08815", "tree-based models"),
 ("hastie2009-esl", "book", "The Elements of Statistical Learning (2nd ed.)", ["Hastie, Trevor", "Tibshirani, Robert", "Friedman, Jerome"], 2009, "Springer", "https://hastie.su.domains/ElemStatLearn/", "elements of statistical learning"),
 ("hastie2015-sparsity", "book", "Statistical Learning with Sparsity: The Lasso and Generalizations", ["Hastie, Trevor", "Tibshirani, Robert", "Wainwright, Martin"], 2015, "CRC Press", "https://hastie.su.domains/StatLearnSparsity/", "sparsity"),
 ("hernan2020-what-if", "book", "Causal Inference: What If", ["Hernán, Miguel A.", "Robins, James M."], 2020, "Chapman & Hall/CRC", "https://miguelhernan.org/whatifbook", "what if"),
 ("hoffman2014-nuts", "paper", "The No-U-Turn Sampler: Adaptively Setting Path Lengths in Hamiltonian Monte Carlo", ["Hoffman, Matthew D.", "Gelman, Andrew"], 2014, "Journal of Machine Learning Research 15", "https://jmlr.org/papers/v15/hoffman14a.html", "no-u-turn"),
 ("huntington-klein2021-effect", "book", "The Effect: An Introduction to Research Design and Causality", ["Huntington-Klein, Nick"], 2021, "Chapman & Hall/CRC", "https://theeffectbook.net/", "effect"),
 ("ke2017-lightgbm", "paper", "LightGBM: A Highly Efficient Gradient Boosting Decision Tree", ["Ke, Guolin", "Meng, Qi", "Finley, Thomas", "et al."], 2017, "NeurIPS 2017", "https://papers.nips.cc/paper_files/paper/2017/hash/6449f44a102fde848669bdd9eb6b76fa-Abstract.html", "lightgbm"),
 ("kendall2017-uncertainty", "paper", "What Uncertainties Do We Need in Bayesian Deep Learning for Computer Vision?", ["Kendall, Alex", "Gal, Yarin"], 2017, "NeurIPS 2017", "https://arxiv.org/abs/1703.04977", "uncertainties"),
 ("kuhn2019-fes", "book", "Feature Engineering and Selection: A Practical Approach for Predictive Models", ["Kuhn, Max", "Johnson, Kjell"], 2019, "Chapman & Hall/CRC", "https://bookdown.org/max/FES/", "feature engineering"),
 ("lakshminarayanan2017-ensembles", "paper", "Simple and Scalable Predictive Uncertainty Estimation using Deep Ensembles", ["Lakshminarayanan, Balaji", "Pritzel, Alexander", "Blundell, Charles"], 2017, "NeurIPS 2017", "https://arxiv.org/abs/1612.01474", "deep ensembles"),
 ("mackay2003-itila", "book", "Information Theory, Inference, and Learning Algorithms", ["MacKay, David J. C."], 2003, "Cambridge University Press", "https://www.inference.org.uk/itila/", "information theory"),
 ("matuschak2020-prompts", "web", "How to write good prompts: using spaced repetition to create understanding", ["Matuschak, Andy"], 2020, "andymatuschak.org", "https://andymatuschak.org/prompts/", "prompts"),
 ("mcelreath2026-rethinking-course", "course", "Statistical Rethinking 2026 (course)", ["McElreath, Richard"], 2026, "GitHub", "https://github.com/rmcelreath/stat_rethinking_2026", "rethinking"),
 ("mcinnes2018-umap", "paper", "UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction", ["McInnes, Leland", "Healy, John", "Melville, James"], 2018, "arXiv:1802.03426", "https://arxiv.org/abs/1802.03426", "umap"),
 ("mckinney2022-pda3", "book", "Python for Data Analysis (3rd ed.)", ["McKinney, Wes"], 2022, "O'Reilly Media", "https://wesmckinney.com/book/", "python for data analysis"),
 ("murphy2022-pml1", "book", "Probabilistic Machine Learning: An Introduction", ["Murphy, Kevin P."], 2022, "MIT Press", "https://probml.github.io/pml-book/book1.html", "probabilistic machine learning"),
 ("neal2020-causal-course", "course", "Introduction to Causal Inference (course)", ["Neal, Brady"], 2020, "bradyneal.com", "https://www.bradyneal.com/causal-inference-course", "causal"),
 ("nielsen2018-ltm", "web", "Augmenting Long-term Memory", ["Nielsen, Michael"], 2018, "augmentingcognition.com", "http://augmentingcognition.com/ltm.html", "memory"),
 ("numpy-docs-2-5", "software", "NumPy documentation", ["NumPy developers"], 2026, "numpy.org", "https://numpy.org/doc/stable/", "numpy"),
 ("olah2015-visual-information", "web", "Visual Information Theory", ["Olah, Christopher"], 2015, "colah.github.io", "https://colah.github.io/posts/2015-09-Visual-Information/", "information"),
 ("parsons2006-parsons-puzzles", "paper", "Parson's programming puzzles: a fun and effective learning tool for first programming courses", ["Parsons, Dale", "Haden, Patricia"], 2006, "Proceedings of the 8th Australasian Computing Education Conference (ACE 2006), CRPIT 52", "https://dl.acm.org/doi/10.5555/1151869.1151890", None),
 ("pashler2007-ies-guide", "report", "Organizing Instruction and Study to Improve Student Learning (IES Practice Guide NCER 2007-2004)", ["Pashler, Harold", "Bain, Patrice M.", "Bottge, Brian A.", "et al."], 2007, "Institute of Education Sciences, U.S. Department of Education", "https://ies.ed.gov/ncee/wwc/PracticeGuide/1", "organizing instruction"),
 ("pearl2016-primer", "book", "Causal Inference in Statistics: A Primer", ["Pearl, Judea", "Glymour, Madelyn", "Jewell, Nicholas P."], 2016, "Wiley", "http://bayes.cs.ucla.edu/PRIMER/", "primer"),
 ("phan2019-numpyro", "paper", "Composable Effects for Flexible and Accelerated Probabilistic Programming in NumPyro", ["Phan, Du", "Pradhan, Neeraj", "Jankowiak, Martin"], 2019, "arXiv:1912.11554", "https://arxiv.org/abs/1912.11554", "numpyro"),
 ("platt1998-smo", "report", "Sequential Minimal Optimization: A Fast Algorithm for Training Support Vector Machines", ["Platt, John C."], 1998, "Microsoft Research Technical Report MSR-TR-98-14", "https://www.microsoft.com/en-us/research/publication/sequential-minimal-optimization-a-fast-algorithm-for-training-support-vector-machines/", "sequential minimal optimization"),
 ("polars-docs-2-1", "software", "Polars documentation", ["Polars developers"], 2026, "pola.rs", "https://docs.pola.rs/", "polars"),
 ("prokhorenkova2018-catboost", "paper", "CatBoost: unbiased boosting with categorical features", ["Prokhorenkova, Liudmila", "Gusev, Gleb", "Vorobev, Aleksandr", "Dorogush, Anna Veronika", "Gulin, Andrey"], 2018, "NeurIPS 2018", "https://arxiv.org/abs/1706.09516", "catboost"),
 ("pypi-versions-2026-11-12", "web", "Python Package Index (package versions as of 2026-11-12)", ["Python Software Foundation"], 2026, "pypi.org", "https://pypi.org/", "python package index"),
 ("pytest-docs-9", "software", "pytest documentation", ["pytest-dev"], 2026, "docs.pytest.org", "https://docs.pytest.org/", "pytest"),
 ("rahimi2007-random-features", "paper", "Random Features for Large-Scale Kernel Machines", ["Rahimi, Ali", "Recht, Benjamin"], 2007, "NeurIPS 2007", "https://papers.nips.cc/paper_files/paper/2007/hash/013a006f03dbc5392effeb8f18fda755-Abstract.html", "random features"),
 ("ramalho2022-fluent-python", "book", "Fluent Python (2nd ed.)", ["Ramalho, Luciano"], 2022, "O'Reilly Media", "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/", "fluent python"),
 ("raschka2018-evaluation", "paper", "Model Evaluation, Model Selection, and Algorithm Selection in Machine Learning", ["Raschka, Sebastian"], 2018, "arXiv:1811.12808", "https://arxiv.org/abs/1811.12808", "model evaluation"),
 ("rasmussen2006-gpml", "book", "Gaussian Processes for Machine Learning", ["Rasmussen, Carl Edward", "Williams, Christopher K. I."], 2006, "MIT Press", "https://gaussianprocess.org/gpml/", "gaussian processes"),
 ("romano2019-cqr", "paper", "Conformalized Quantile Regression", ["Romano, Yaniv", "Patterson, Evan", "Candès, Emmanuel J."], 2019, "NeurIPS 2019", "https://arxiv.org/abs/1905.03222", "conformalized quantile regression"),
 ("sanderson-3b1b-calculus", "course", "Essence of Calculus", ["Sanderson, Grant (3Blue1Brown)"], 2017, "3blue1brown.com", "https://www.3blue1brown.com/topics/calculus", "calculus"),
 ("sanderson-3b1b-linear-algebra", "course", "Essence of Linear Algebra", ["Sanderson, Grant (3Blue1Brown)"], 2016, "3blue1brown.com", "https://www.3blue1brown.com/topics/linear-algebra", "linear algebra"),
 ("sculley2015-tech-debt", "paper", "Hidden Technical Debt in Machine Learning Systems", ["Sculley, D.", "Holt, Gary", "Golovin, Daniel", "et al."], 2015, "NeurIPS 2015", "https://papers.nips.cc/paper_files/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html", "technical debt"),
 ("sharma2020-dowhy", "paper", "DoWhy: An End-to-End Library for Causal Inference", ["Sharma, Amit", "Kiciman, Emre"], 2020, "arXiv:2011.04216", "https://arxiv.org/abs/2011.04216", "dowhy"),
 ("sklearn-common-pitfalls", "software", "Common pitfalls and recommended practices (scikit-learn User Guide)", ["scikit-learn developers"], 2026, "scikit-learn.org", "https://scikit-learn.org/stable/common_pitfalls.html", "pitfalls"),
 ("sklearn-user-guide-1-9", "software", "scikit-learn User Guide", ["scikit-learn developers"], 2026, "scikit-learn.org", "https://scikit-learn.org/stable/user_guide.html", "user guide"),
 ("stat110-harvard-site", "course", "Statistics 110: Probability (Harvard)", ["Blitzstein, Joseph K."], 2026, "Harvard University", "https://stat110.hsites.harvard.edu/", "stat"),
 ("strang-mit1806-2010", "course", "18.06 Linear Algebra (Spring 2010)", ["Strang, Gilbert"], 2010, "MIT OpenCourseWare", "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/", "linear algebra"),
 ("strang-mit18065-2018", "course", "18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)", ["Strang, Gilbert"], 2018, "MIT OpenCourseWare", "https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/", "matrix methods"),
 ("strang2019-lalfd", "book", "Linear Algebra and Learning from Data", ["Strang, Gilbert"], 2019, "Wellesley-Cambridge Press", "https://math.mit.edu/~gs/learningfromdata/", "learning from data"),
 ("umap-learn", "software", "umap-learn documentation", ["McInnes, Leland", "et al."], 2026, "readthedocs", "https://umap-learn.readthedocs.io/", "umap"),
 ("uv-docs-0-13", "software", "uv documentation", ["Astral"], 2026, "docs.astral.sh", "https://docs.astral.sh/uv/", "uv"),
 ("vandermaaten2008-tsne", "paper", "Visualizing Data using t-SNE", ["van der Maaten, Laurens", "Hinton, Geoffrey"], 2008, "Journal of Machine Learning Research 9", "https://jmlr.org/papers/v9/vandermaaten08a.html", "t-sne"),
 ("vehtari2026-bda-course", "course", "Bayesian Data Analysis course (Aalto University)", ["Vehtari, Aki"], 2026, "Aalto University", "https://avehtari.github.io/BDA_course_Aalto/", "bayesian data analysis"),
 ("white1992-poe", "book", "Probing Understanding", ["White, Richard", "Gunstone, Richard"], 1992, "Falmer Press", "https://www.routledge.com/Probing-Understanding/White-Gunstone/p/book/9780750700481", "probing understanding"),
 ("wozniak1990-sm2", "web", "Optimization of learning (SuperMemo SM-2 algorithm)", ["Woźniak, Piotr"], 1990, "super-memory.com", "https://super-memory.com/english/ol/sm2.htm", "sm-2"),
 ("wozniak1999-twenty-rules", "web", "Effective learning: Twenty rules of formulating knowledge", ["Woźniak, Piotr"], 1999, "super-memory.com", "https://super-memory.com/articles/20rules.htm", "twenty rules"),
]

OPEN_PREFIXES = ("10.1371", "10.21105", "10.18637", "10.7717", "10.1186", "10.23915", "10.1073", "10.6028", "10.48550", "10.1613")
PAYWALLED_PREFIXES = ("10.1016", "10.1007", "10.1111", "10.1002", "10.1080", "10.1037", "10.1126", "10.1177", "10.1109",
                      "10.1093", "10.1017", "10.1162", "10.1023", "10.1006", "10.1207", "10.3102", "10.1146", "10.1137",
                      "10.1119", "10.1103", "10.1115", "10.1198", "10.1257", "10.2514", "10.1561", "10.1201", "10.1901", "10.1098", "10.7551")


def norm(t: str) -> str:
    t = re.sub(r"<[^>]+>", " ", t or "")
    return " ".join(re.sub(r"[^a-z0-9 ]+", " ", t.lower()).split())


def similar(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, norm(a), norm(b)).ratio()


def get(url: str, timeout: int = 25, retries: int = 4) -> tuple[int, str]:
    """GET with polite retries: Crossref's public pool answers 429 when hit concurrently."""
    import time, urllib.error
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                raw = r.read(600_000)
                return r.status, raw.decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < retries:
                time.sleep(float(e.headers.get("Retry-After") or 2 * (attempt + 1)))
                continue
            raise


def module_map() -> dict[str, list[int]]:
    md = (HERE / "pedagogy-foundations.md").read_text()
    out: dict[str, set[int]] = {}
    current = None
    for line in md.splitlines():
        m = re.match(r"^## Module (\d+)", line)
        if m:
            current = int(m.group(1))
        elif line.startswith("## "):
            current = None
        for sid in re.findall(r"`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`", line):
            out.setdefault(sid, set())
            if current is not None:
                out[sid].add(current)
    return {k: sorted(v) for k, v in out.items()}


def resolve_doi(entry):
    sid, typ, title, year, doi = entry
    rec = {"id": sid, "type": typ, "title": title, "authors": [], "year": year, "venue": None, "doi": doi,
           "url": f"https://doi.org/{doi}", "open_url": None, "license": None, "accessed": ACCESSED, "verified": False}
    try:
        _, body = get("https://api.crossref.org/works/" + urllib.parse.quote(doi))
        msg = json.loads(body)["message"]
        ctitle = (msg.get("title") or [""])[0]
        csub = (msg.get("subtitle") or [""])[0]
        full = f"{ctitle}: {csub}" if csub else ctitle
        # Crossref often stores "Main title" and "subtitle" separately; accept a full match or a clean prefix match.
        sim = max(similar(title, full), similar(title, ctitle))
        if sim < 0.8 and len(norm(ctitle)) >= 6 and (norm(title).startswith(norm(ctitle)) or norm(ctitle).startswith(norm(title))):
            sim = 0.99
        ctitle = full
        cyear = (msg.get("issued", {}).get("date-parts") or [[None]])[0][0]
        authors = [f"{a.get('family', '').strip()}, {a.get('given', '').strip()}".strip(", ")
                   for a in msg.get("author", []) if a.get("family")]
        venue = (msg.get("container-title") or [None])[0] or msg.get("publisher")
        if sim >= 0.8:
            rec.update(title=re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", ctitle)).strip() or title,
                       authors=authors or rec["authors"], venue=venue, verified=True)
            if cyear and abs(int(cyear) - int(year)) <= 2:
                rec["year"] = int(cyear)
        else:
            rec["note_check"] = f"Crossref title mismatch (similarity {sim:.2f}): {ctitle[:80]}"
    except Exception as e:  # noqa: BLE001
        rec["note_check"] = f"Crossref lookup failed: {type(e).__name__}"
    rec["access"] = "open" if doi.startswith(OPEN_PREFIXES) else "paywalled" if doi.startswith(PAYWALLED_PREFIXES) else "partial"
    return rec


def resolve_url(entry):
    sid, typ, title, authors, year, venue, url, phrase = entry
    rec = {"id": sid, "type": typ, "title": title, "authors": authors, "year": year, "venue": venue, "doi": None,
           "url": url, "open_url": None, "license": None, "accessed": ACCESSED, "verified": False,
           "access": "paywalled" if typ == "book" and any(p in url for p in ("oreilly.com", "routledge.com")) else "open"}
    try:
        status, body = get(url)
        if status == 200 and (phrase is None or phrase in body.lower()):
            rec["verified"] = phrase is not None  # PDFs / placeholder pages: loaded but not text-checked
            if phrase is None:
                rec["note_check"] = "page loaded (binary or no checkable text); metadata from the research notes"
        else:
            rec["note_check"] = f"page loaded (HTTP {status}) but expected text not found"
    except Exception as e:  # noqa: BLE001
        rec["note_check"] = f"fetch failed: {type(e).__name__}"
    return rec


def main():
    mods = module_map()
    recs = [resolve_doi(e) for e in DOI]  # sequential: Crossref public pool limits concurrency
    with cf.ThreadPoolExecutor(max_workers=6) as ex:
        recs += list(ex.map(resolve_url, URL))
    out = []
    for r in recs:
        m = mods.get(r["id"], [])
        r["modules"] = m
        where = ("module(s) " + ", ".join(map(str, m))) if m else "the learning-science design rules"
        note = f"Cited in research/pedagogy-foundations.md for {where}; see that file for how the course uses it."
        if r.get("note_check"):
            note += " Verification: " + r.pop("note_check") + "."
        r["notes"] = note
        out.append(r)
    cited = set(mods)
    built = {r["id"] for r in out}
    (HERE / "sources-pedagogy-foundations.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {len(out)} records; verified {sum(r['verified'] for r in out)}")
    unverified = [r["id"] for r in out if not r["verified"]]
    print("unverified:", ", ".join(unverified) or "none")
    print("cited but not built (expected only ids defined in other source files):", sorted(cited - built))


if __name__ == "__main__":
    main()
