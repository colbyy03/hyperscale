# Hyperscale: pedagogy research for the advanced modules (12–24, 27–30)

Research date: 2026-11-12. Scope: how the strongest courses and textbooks teach each advanced module, and what that implies for Hyperscale's sequencing, rigor and runtime split. Source ids refer to `research/sources-pedagogy-advanced.json` (196 records; 188 verified this session through page loads or the arXiv, Crossref and GitHub APIs; the 8 marked `verified:false` were loaded but their year wasn't confirmed on the page). Everything below is written in original words. Nothing is copied from the sources: no text, exercises, figures or code.

**Runtime tags used in lesson plans**

| Tag | Meaning |
|---|---|
| **[B]** | Runs in the browser: Pyodide, NumPy/SciPy/pandas/scikit-learn and the other packages listed in §0.2 |
| **[B→L]** | Intuition and a small version in the browser, then finished in a local notebook or script |
| **[L]** | Local CPU or Apple-silicon (MPS) with PyTorch and a pytest suite |
| **[G]** | Needs a CUDA GPU (rented by the hour, or Colab). CS336's self-study note listed single-B200 prices of roughly $5–7.50/h in March 2026 (`stanford-cs336-2026`) |

---

## 0. Cross-cutting findings

### 0.1 What the leading courses look like in late 2026 (versions checked today)

| Source | Version observed | What matters for Hyperscale |
|---|---|---|
| Karpathy, Zero to Hero (`karpathy-zero-to-hero`) | 8 lectures, page says "ongoing" | Path: micrograd → makemore (bigram, MLP, activations/BatchNorm, manual tensor backprop, WaveNet-style) → GPT → tokenizer. There is no RNN lecture. |
| nanoGPT → nanochat (`karpathy-nanogpt`, `karpathy-nanochat`) | nanoGPT marked deprecated (Nov 2025); nanochat active (2026 leaderboard) | nanochat runs the full pipeline: tokenizer, pretraining, SFT, RL, eval and KV-cache inference. It trains a GPT-2-grade model in about 1.7–3 h on one 8×H100 node, has a CPU/MPS toy script, and manages dtypes explicitly. Its PR policy asks contributors to disclose LLM-written code. |
| autoresearch (`karpathy-autoresearch`) | March 2026 | An agent edits the training code, runs a 5-minute training, keeps or discards the change by metric, and repeats. The human only edits the agents' Markdown instructions. |
| fast.ai (`fastai-practical-deep-learning`) | Part 1 2022; Part 2 "Foundations to Stable Diffusion" | Top-down teaching. Part 2 builds a mini framework with callbacks, activation-statistics hooks and initialization experiments, then works up to DDPM/DDIM and the samplers. |
| CS231n (`stanford-cs231n-2026`) | Spring 2026 | Order: linear classifiers → optimization → backprop → CNNs → architectures → RNN → attention/transformers → … → distributed training → SSL → VAE/GAN → diffusion. A1–A3 run from kNN to diffusion and CLIP/DINO. The policy forbids using gen-AI to substantially complete assignments. |
| CS224n (`stanford-cs224n-2026`) | Winter 2026 (Yang, Choi) | Order: word vectors → backprop → RNN LMs → transformers → pretraining (scaling, systems, data) → post-training (RLHF/SFT/DPO) → prompting+PEFT → agents/tool use/RAG → benchmarking → reasoning ×2 → tokenization (guest). |
| CS336 (`stanford-cs336-2026`) | Spring 2026 (Liang, Hashimoto) | Lecture order: tokenization → PyTorch & resource accounting → architectures → MoE/attention variants → GPUs → kernels/Triton → parallelism → scaling laws → inference → evaluation → data → SFT/RLHF → RLVR. Assignments: A1 basics, A2 systems (Triton FlashAttention2, distributed), A3 scaling laws via a training API, A4 Common Crawl data, A5 SFT+RL for math (optional DPO). Each assignment is a pytest suite wired up through an adapters file. The linked repos still carry 2025 READMEs. |
| CMU 10-414/714 (`cmu-dlsys-2026`) | Fall 2026 (Dettmers, Chen) | Students build the "needle" framework across HW0–HW4: autodiff → NN library → normalization/dropout → CPU/GPU NDArray backends → CNN → RNN → transformer. |
| d2l.ai v1.0.3, UDL (PDF 9 Feb 2026, 68 fill-in notebooks), Goodfellow 2016 (`d2l-2023`, `prince2023-udl`, `goodfellow2016-deep-learning`) | — | Reading companions. UDL's notebooks are mostly NumPy, so they suit Pyodide-style exercises. |
| PyTorch docs/tutorials | build 2.15 | Production reference for 12.6, 14 and 29. |
| Raschka (`raschka2024-llms-from-scratch`) | Book Sept 2024; repo active Nov 2026 | Chapters 2–7 and appendices D/E map onto 16–17. Bonus folders cover BPE, KV cache, MoE, Llama/Qwen/Gemma "from scratch" and DPO, and there's a sequel on reasoning models. |
| SLP3 (`jurafsky-martin-slp3-2026`) | 19 Aug 2026 release | Vol I: tokens → n-grams → logistic regression → embeddings → neural nets → transformers+pretraining → post-training. Vol II: MLMs, interpretability, IR/RAG, agents (not yet written), and **RNNs/LSTMs after transformers**. |
| HF LLM course; HF Deep RL course | current | The LLM course now ends with fine-tuning LLMs and building reasoning models. The Deep RL course runs Q-learning → DQN → PG → A2C → PPO. |
| Sutton & Barto 2e; Spinning Up; CS 185/285; Silver 2015 | CS285 = Spring 2026 | CS285's 2026 homeworks: imitation learning, PG, Q-learning/actor-critic, **LLM RL**, offline RL. Spinning Up's code is legacy (repo last pushed 2024); its prose is still useful. |
| FPP3; **FPP, the Pythonic Way** (`hyndman-fpppy-2026`) | both updated Nov 2026 | The Python edition (with Nixtla co-authors) adds chapters on neural networks and foundation forecasting models. |
| Huyen DMLS / AI Engineering; CS329S | CS329S last run 2022 | DMLS is the spine for 27, AI Engineering for 19. |
| FSDL; Made With ML; Rules of ML; Sculley 2015; Breck 2017 | FSDL course 2022, bootcamp 2023 | Made With ML is the cleanest lesson order for 28. Breck's rubric works as a capstone mastery check. |
| Rawlings/Mayne/Diehl; EE364a; Brunton & Kutz 2e; fairmlbook | EE364a Summer 2025–26 | All free or partly free. Brunton & Kutz is the best single bridge text for this learner. |
| Anthropic engineering posts | Dec 2024 → Jan 2026 | "Building effective agents" now carries a banner saying the tooling has changed, so teach its patterns rather than its tools. "Demystifying evals for AI agents" (Jan 2026) is the most practical eval reference. |
| MCP spec | **2026-07-28** | Requests are now stateless and self-contained, with per-request capability negotiation. Servers offer resources, prompts and tools; clients offer elicitation. Opt-in extensions: Tasks, Skills over MCP, MCP Apps. Tutorials from 2025 describe the older stateful protocol. |
| Hamel Husain (+ Shreya Shankar) | FAQ dated 18 Sept 2026 | Eval method: error analysis on traces (open coding → axial coding), binary judgments, evaluators validated against human labels. |
| Ultra-Scale Playbook; Bekman open book; DeepMind "How to Scale Your Model" | Feb 2025; living; Feb 2025 | Spine for 29 and for the cost and latency arithmetic in 18. |
| Weng (policy gradients 2018, diffusion 2021→2024, reward hacking 2024); MIT 6.S184 2026 | — | Derivation companions for 20 and 23. |

### 0.2 In-browser vs local: measured, not assumed

I ran Pyodide's official console (Pyodide **314.0.7**, Python **3.14.2**; package list in `pyodide-packages-314`) in a background Chrome tab on the learner's Mac. The numbers are indicative only, since a background tab may be throttled.

**Throughput**
- Dense NumPy matmul reached only about **0.4–0.6 GFLOP/s**: 256² took ≈57 ms, 512² ≈0.6 s and 1024² ≈5.6 s. Native multithreaded BLAS is roughly 100–1000× faster.
- A 2-layer NumPy MLP (batch 256, 64→128→10) trained at **≈16 ms per step**, so 300 steps took 4.7 s.
- A micrograd-style scalar autograd cost **≈5–6 µs per scalar op**, forward plus backward. A 337-parameter MLP on 100 points (≈70k ops) therefore needs ≈0.4 s per step.

**Package checks**

| Status | Packages (tested 2026-11-12) |
|---|---|
| Worked | numpy 2.4.6, scipy 1.18 (`linprog` with HiGHS), pandas 3.0.2, scikit-learn 1.8 (IsolationForest), statsmodels 0.14.6 (Holt-Winters ETS), lightgbm 4.6.0, **cvxpy-base 1.8.2 with Clarabel** (solved a QP), **CasADi 3.7.2** (`sqpmethod` with `qrqp` solved a constrained NLP; the IPOPT plugin is missing), and, installed through micropip, **python-control 0.10.2**, **filterpy 2.0.0** and **pysindy 2.1.0**. The official package list also includes xgboost, highspy, duckdb, polars, pyarrow, pydantic, sympy, pywavelets, sentencepiece, nlopt and tiktoken. |
| Failed | **torch and jax** (not built for Pyodide); **numba-based libraries** (statsforecast and PyOD both failed: no wasm wheel for numba); **gymnasium** (imports `_multiprocessing`); **tiktoken vocab download** (the network fetch failed, so the app must serve the BPE files itself). |

**Budget rules that follow**
- Keep any interactive training step under ~50 ms, which means at most ~20 MFLOP per step.
- Keep in-browser training runs under about 60 s.
- Keep models at or below ~10⁵ parameters.
- A character-level transformer with d_model ≤ 64, context ≤ 32 and ≤ 2 layers is feasible as a demo. Ship a pre-trained checkpoint so the sampling demo looks good.
- Anything larger, any PyTorch, any GPU, and any numba-based library goes to **[L]** or **[G]**.

**Module consequences of the package checks**

| Module | Browser-friendly | Must be local |
|---|---|---|
| 12 autograd | All of it, scalar and small tensor engines | PyTorch parity check |
| 13 training | Optimizers, init, normalization, schedules on small MLPs | Tuning-methodology experiments at realistic scale |
| 14 PyTorch | Shape/broadcast drills in NumPy only | Everything with torch |
| 15 CNN/RNN/attention | im2col CNN on 8×8 digits, tiny RNN/LSTM, attention, SSM demos | ResNet transfer learning, cuDNN LSTMs |
| 16 transformers | Block-by-block NumPy, micro-LM | Real GPT training (MPS/GPU) |
| 17 LLM training | BPE from scratch, scaling-law fitting, DPO/GRPO toy math, LoRA SVD intuition | SFT/LoRA/DPO/GRPO on real models |
| 18 inference | KV cache, roofline, quantization error, speculative sampling simulation | vLLM, llama.cpp, quantized model benchmarks |
| 19 LLM apps | Structured outputs (pydantic), vector search, agent loop with a mock model, eval statistics | Live API calls (keys), MCP servers, real embeddings |
| 20 generative | 2D VAE, 2D diffusion and flow matching | Image diffusion |
| 21 forecasting | Decomposition, ETS/ARIMA (statsmodels), LightGBM global models, quantiles/conformal | Nixtla libraries, deep and foundation forecasters |
| 22 anomaly detection | Statistical/SPC, PCA, IsolationForest, evaluation pitfalls | PyOD, deep detectors at scale |
| 23 RL | Bandits, DP, tabular TD, NumPy policy gradients on tiny envs (custom env class) | Gymnasium, DQN/PPO with CleanRL/SB3 |
| 24 optimization & control | **Nearly all of it**: LP (HiGHS), CVXPY MPC, CasADi NMPC, python-control LQR/Kalman, SINDy | PINNs with PyTorch, IPOPT-based NMPC, RL baselines |
| 27/28/29/30 | 27 drift tests, DuckDB as-of joins, 29 calculators, 30 calibration/conformal/fairness metrics | 28 almost entirely (Docker, CI, MLflow, cloud); 29 profiling and distributed |

### 0.3 Sequencing findings (the ones that change the course plan)

1. **Policy gradients must come before RLHF, DPO and GRPO.** CS224n, CS336 and CS285 now all treat RL post-training of LLMs as core material. Module 17 depends on REINFORCE, baselines and KL-regularized objectives, which otherwise live in 23. Recommendation: put a one-lesson **policy-gradient primer inside 17** (bandit framing, REINFORCE with a baseline, KL to a reference policy), and have 23 revisit LLM RL as an application. The alternative is to teach 23.1 and 23.5 before 17.
2. **Transformers are no longer gated behind RNNs.** SLP3 (2026) moved RNNs/LSTMs to Volume II, and Karpathy never covers them. CS224n and CS231n still do a short RNN lecture before attention. For Hyperscale, teach RNNs in 15 as *discrete-time nonlinear state-space models*, which plays to the learner's control background, with a compact gradient-stability analysis. Defer heavy LSTM engineering to 21, where DeepAR-style models need it.
3. **Resource accounting starts early.** CS336 puts FLOP and memory accounting in lecture 2. Introduce the arithmetic (parameters, gradients, optimizer state, activations, 6·N·D) in 14 and reuse it in 16, 17, 18 and 29.
4. **Evaluation comes first.** Anthropic's Jan 2026 guidance and Husain & Shankar both put evals and error analysis before feature building. CS224n has a benchmarking lecture and CS336 an evaluation lecture. In 19, error analysis and a 20–50-task eval set come *before* RAG or agent work.
5. **Data is a first-class pretraining topic** (CS336 A4, CS224n "Pretraining (Scaling, Systems, Data)"). Give 17 a pretraining-data lesson covering dedup, filtering, mixing and contamination.
6. **Forecasting starts from baselines.** FPP-py, M4/M5 and Zeng et al. agree: seasonal naive, ETS/ARIMA and gradient boosting come before deep and foundation models, and every fancy model must beat those baselines under rolling-origin evaluation.
7. **Control is the learner's strongest bridge, and in-browser tooling for it is excellent.** Use 24 (and the controls framing in 15, 21, 22 and 23) to build confidence. LP, QP and MPC, LQR, Kalman filtering and SINDy all run in Pyodide.
8. **14 can split in two.** Module 13 is best taught on the learner's own NumPy engine in the browser (the CS231n A2 and fast.ai Part 2 pattern). Realistic debugging of training runs, though, needs PyTorch. Suggested order: 12 → (14a: a 2-hour PyTorch parity bridge at the end of 12) → 13 → 14b (data, devices, mixed precision, testing).
9. **Production modules follow the DMLS arc.** The order is framing → data → features → training/eval → serving → monitoring/drift → continual learning → infrastructure and people (DMLS/CS329S). Module 28 uses Google's MLOps maturity levels (0 manual → 1 continuous training → 2 CI/CD) as its scaffold.

### 0.4 Rigor conventions used in every "mastery benchmark"

- **Derive**: closed-book on paper, then check the result numerically in the browser (finite differences, Monte Carlo, or comparison with a library).
- **Implement**: from scratch against a hidden or visible test suite. For local work, copy CS336's pattern: tests fail with `NotImplementedError` until the learner's code is wired in through an adapters module. Gradients must pass finite-difference checks (relative error < 1e-6 in float64), and results must match the production library to a stated tolerance.
- **Debug**: a seeded broken implementation or a recorded broken training run (loss curve, activation statistics, config). The learner names the cause, then proves it with a minimal fix.
- **Explain**: a Feynman-style explanation scored against a rubric, plus one "interviewer follow-up" question.
- **Statistics**: compare results across at least 3–5 seeds with confidence intervals, a lesson Henderson et al. drew for RL that applies everywhere.

### 0.5 AI-native policy for the course (applies to every module)

The field is now explicit about AI assistance:
- CS231n 2026 treats AI like a human collaborator and forbids using it to substantially complete assignments.
- nanochat requires contributors to disclose LLM-written code.
- autoresearch shows agents running entire experiment loops.

**Recommendation:**
- **from-scratch stages are AI-off**, or AI as Socratic tutor only, with no code generation;
- **production stages are AI-on** with eval-driven review;
- each module's closing "how I'd do this with AI tools" segment shows a recorded agent session *and* the checks that caught its mistakes.

§19, §27 and §28 cover AI-native practice in detail.

---

## Module 12 — Autograd engine from scratch → neural nets on top of it

**How leading courses sequence it**
- *Karpathy* starts with a scalar value object that overloads arithmetic, records parents, topologically sorts the graph and runs local backward rules. A neuron, layer and MLP sit on top, trained on a toy 2D problem. Tensors arrive one lecture later (makemore). A dedicated lecture then has learners backprop by hand through a whole tensor MLP (cross-entropy, linear, tanh, BatchNorm, embedding) without calling autograd.
- *CMU dlsys* goes softmax regression → hand-derived MLP backprop → autodiff theory → autodiff implementation → library abstractions (modules, parameters, initializers, optimizers, data loaders) → hardware backends. Each homework extends one framework ("needle").
- *CS231n* teaches staged computation on graphs, local gradients and gradient checking, then has students write analytic gradients for a two-layer net in NumPy.
- *Baydin et al.* supply the rigor: forward vs reverse mode, dual numbers, cost as a function of input and output dimension.

**Recommended lesson sequence (6 lessons)**
1. **[B] Derivatives as sensitivities.** Graphs, the chain rule, and numerical vs analytic derivatives. A slider shows how finite-difference error rises at both large and tiny step sizes (truncation vs round-off).
2. **[B] Forward mode with dual numbers.** Build a dual-number class, get Jacobian columns one at a time, and see why forward mode is cheap when there are few inputs.
3. **[B] Reverse mode for scalars.** A value class, topological sort, gradient *accumulation* and a property-based gradient checker that tests random expression graphs.
4. **[B] Neural nets on the engine.** Neuron, layer and MLP; hinge and cross-entropy losses; training on 2D moons with a live decision-boundary plot.
5. **[B] From scalars to tensors.** Vectorized operations, vector-Jacobian products for matmul, sum, broadcast (via an "unbroadcast" sum), reshape, exp/log, tanh/ReLU and fused softmax-cross-entropy. The result is a ~300-line NumPy tensor engine in the spirit of needle.
6. **[B→L] Parity with PyTorch.** Rebuild the same model in torch, compare gradients to 1e-6, inspect `grad_fn` chains, use hooks, and contrast no-grad, inference and eval modes. This is the "14a bridge" from §0.3.

**From-scratch builds and the production comparison**
- *Scalar engine*: about 150 lines with operator overloading. Tests compare against central differences on randomly generated graphs that include shared subexpressions.
- *Tensor engine*: VJP rules plus a broadcasting-aware backward pass. Tests: finite differences, and parity with `torch.autograd` on identical random inputs.
- *Mini nn library*: parameter registration, `zero_grad`, SGD, and a training loop that reaches ≥ 97% on moons.
- *Production comparison*: `torch.autograd`, a dynamic tape whose saved tensors carry version counters that catch in-place misuse; `retain_graph`; `torch.func` jvp/vjp as the functional view; JAX `grad`/`vjp` conceptually. Measure speed on a 2-layer MLP so the learner sees why vectorization matters: at ~5 µs per scalar op in Pyodide, the scalar engine is a teaching tool, not a trainer.

**Mastery benchmarks**
- *Derive*:
  - VJPs for matmul, broadcasting add, tanh, and softmax+cross-entropy (gradient = p − onehot).
  - Why reverse mode needs one backward pass for a scalar loss while forward mode needs one pass per input.
  - The unbroadcast rule: sum over the expanded axes.
- *Implement*: both engines pass randomized gradient checks with relative error < 1e-6 in float64, and the tensor engine matches torch gradients on a 3-layer MLP.
- *Debug*: find the bug in three seeded engines (gradient overwritten instead of accumulated; backward without topological order; bias gradient not summed over the batch).
- *Explain*: what autograd records and when; why gradients must be zeroed; why an in-place edit can corrupt backward; gradient vs Jacobian vs VJP.

**Misconceptions, pitfalls and classic bugs (exercise candidates)**
1. Assigning gradients with `=` instead of `+=`: for `y = x*x` the engine reports `x` instead of `2x`. Predict the output.
2. Forgetting to zero gradients between steps, so updates grow each step and the loss oscillates or diverges.
3. Walking the graph without a topological sort, which silently drops gradient contributions in DAGs with reuse.
4. Not reducing broadcast dimensions in backward, which causes a shape error or a silently wrong bias gradient.
5. Running a gradient check in float32 with h = 1e-7. Round-off dominates, and the learner wrongly blames the engine.
6. "Autograd is symbolic differentiation" (or "numerical differentiation"). It is neither: it applies exact local rules to recorded numeric values.
7. Changing a tensor in place after it was saved for backward. PyTorch raises a version error; a naive engine silently gives wrong gradients.
8. Calling backward twice through freed buffers, or reusing a graph across iterations and growing memory without bound.
9. Thinking `torch.no_grad()` and `model.eval()` do the same thing. One controls gradient recording; the other switches dropout and BatchNorm behaviour.
10. The ReLU gradient at exactly 0 (subgradient choice) and dead units after a large negative bias update.

**Engineering bridges**
- **Reverse-mode AD is the discrete adjoint method.** It is the same idea as adjoint sensitivities in CFD shape optimization and the costate in Pontryagin's principle. Backprop through time is the discrete-time adjoint of a dynamical system.
- **Forward mode is linearized perturbation (small-signal) analysis.** Dual numbers carry the perturbation alongside the value.
- **Computational graphs resemble signal-flow and block diagrams.** Summing junctions and branch points are where gradients add.
- **Finite-difference error trade-offs** come straight from numerical-methods courses.

**Primary references:** `karpathy-micrograd`, `karpathy-zero-to-hero`, `cmu-dlsys-2026`, `baydin2015-autodiff-survey`, `pytorch-autograd-notes`.

---

## Module 13 — Training deep nets (initialization, optimizers, normalization, regularization, LR schedules, debugging)

**How leading courses sequence it**
- *Karpathy*, makemore part 3: start from a working MLP and look at activation and gradient statistics layer by layer. Fix a bad initial loss by shrinking the output layer, fix tanh saturation with principled scaling, then add BatchNorm. Diagnostic plots (activation histograms, update-to-data ratios) are part of the lesson, not an afterthought.
- *CS231n*: optimization (SGD, momentum, AdaGrad, Adam, schedules) comes right after linear classifiers. BatchNorm and dropout are implemented in NumPy in A2, before PyTorch.
- *fast.ai Part 2*: build the trainer (callbacks, hooks) first, then use it as an instrument for systematic experiments on initialization (Glorot, LSUV), activation choice, normalization variants (batch/layer/instance/group), optimizers written from scratch, and annealing schedules (cosine, one-cycle).
- *Tuning playbook / Karpathy's recipe*: method over tricks. Know the data, build an end-to-end skeleton with dumb baselines, overfit one batch, then regularize and tune incrementally, separating "scientific" from "nuisance" hyperparameters.

**Recommended lesson sequence (7 lessons)**
1. **[B] Optimizers on landscapes.** GD, momentum, Nesterov, RMSProp and Adam race on 2D surfaces (an ill-conditioned quadratic, Rosenbrock), with sliders for LR and the betas. Covers condition number and the stability limit.
2. **[B] Initialization and signal propagation.** Activation and gradient histograms against depth; Xavier/He derived from variance bookkeeping; saturation and dead units.
3. **[B] Normalization and residuals.** BatchNorm (train vs eval statistics), LayerNorm, RMSNorm; residual paths; pre-norm vs post-norm. Implement forward and backward.
4. **[B] Regularization and generalization.** Weight decay vs L2 under Adam (AdamW), inverted dropout, augmentation, early stopping. Demo: random labels can be memorized.
5. **[B] Learning-rate schedules and batch size.** Warmup, cosine and one-cycle schedules, an LR range test, and the linear scaling rule with its limits.
6. **[B→L] The training recipe and debugging lab.** Check the loss at initialization against ln C, overfit one batch, track update/weight ratios, apply gradient clipping, then diagnose eight recorded broken runs.
7. **[L] Tuning methodology at small scale.** Playbook-style incremental experiments in PyTorch on CPU/MPS (Fashion-MNIST or a CIFAR subset), with multiple seeds and confidence intervals. Compare manual search with Optuna.

**From-scratch builds and the production comparison**
- An optimizer zoo with a shared interface, validated against `torch.optim` to 1e-6 over 100 steps on identical parameters and gradients.
- An activation-statistics instrument: hooks record mean, standard deviation, fraction saturated and gradient norms per layer per step, rendered as heatmaps. This is the "look inside" habit Karpathy and fast.ai both stress.
- BatchNorm forward/backward with running statistics, compared with `nn.BatchNorm1d`. Note PyTorch's momentum convention: momentum is the weight given to the *new* statistic.
- An LR finder and a scheduler library, compared with `torch.optim.lr_scheduler` (warmup plus cosine via LambdaLR, OneCycleLR).

**Mastery benchmarks**
- *Derive*:
  - He and Xavier variances.
  - Adam's bias correction.
  - BatchNorm's backward pass.
  - Why decoupled weight decay differs from an L2 penalty under adaptive steps.
  - The expected initial cross-entropy (ln C) and why a big gap from it is a red flag.
  - The step-size stability bound for a quadratic (lr < 2/λ_max).
- *Implement*: optimizers and BatchNorm that match torch; a debugging checklist script that automatically flags initial-loss, dead-unit and update-ratio anomalies.
- *Debug*: name the cause of each recorded run from loss curves and activation statistics (LR too high, bad init, BatchNorm left in train mode during eval, unshuffled data, label leakage, missing `zero_grad`, double softmax, augmentation applied at eval).
- *Explain*: batch size vs LR trade-offs; why warmup stabilizes Adam and transformers; the competing explanations for BatchNorm (the original internal-covariate-shift story vs the landscape-smoothing account).

**Misconceptions, pitfalls and classic bugs**
1. An initial loss far above ln C means overconfident random logits from a badly scaled output layer. Predict the initial loss for a 27-class model.
2. Validating with BatchNorm in train mode, so metrics depend on batch composition; or training with batch size 1 under BatchNorm.
3. "BatchNorm works because it removes internal covariate shift." The evidence is contested; the landscape-smoothing explanation has empirical support.
4. Treating an L2 penalty under Adam as weight decay (it isn't; that's the point of AdamW).
5. Plain dropout without inverted scaling, which creates a train/test activation-scale mismatch.
6. Misreading a too-small LR as "the model can't learn", or a too-large LR as data noise.
7. Unshuffled, class-sorted data, which produces periodic loss spikes.
8. Computing normalization statistics or fitting augmentation on the full dataset, leaking validation information.
9. Gradient clipping hiding a real bug, such as a wrongly scaled loss.
10. Applying weight decay to norm gains and biases, which most recipes exclude.
11. Declaring an improvement from a single seed when it's within seed-to-seed variance.
12. Applying softmax before a loss that expects logits (double softmax), which slows and distorts training.

**Engineering bridges**
- **Normalization as nondimensionalization.** Scaling variables to O(1) improves conditioning, just as Reynolds or Nusselt groups make correlations well posed. BatchNorm and LayerNorm are adaptive, learned nondimensionalization.
- **Momentum as a second-order dynamical system.** The heavy-ball method is a damped mass-spring system. Learning rate and momentum set natural frequency and damping, and over- and under-damped convergence are visible in the 2D race.
- **The LR stability limit as explicit time-stepping stability.** Exceeding 2/λ_max diverges, like violating a CFL-type limit.
- **Adam as diagonal preconditioning**, like Jacobi preconditioning of iterative solvers.
- **LR annealing and warmup** map onto simulated-annealing cooling schedules and soft-start ramps that limit inrush transients.
- **Gradient clipping as actuator saturation or rate limiting.**

**Primary references:** `karpathy2019-recipe`, `godbole2023-tuning-playbook`, `he2015-init`, `loshchilov2017-adamw`, `santurkar2018-batchnorm` (supporting: `glorot2010-init`, `kingma2014-adam`, `ioffe2015-batchnorm`, `srivastava2014-dropout`, `goyal2017-large-minibatch`, `loshchilov2016-sgdr`, `zhang2016-rethinking-generalization`, `li2017-loss-landscape`, `liu2025-muon`, `fastai-practical-deep-learning`).

---

## Module 14 — PyTorch fluency (tensors, modules, datasets, training loops, GPU basics, mixed precision)

**How leading courses sequence it**
- *PyTorch's own "Learn the Basics"*: tensors → datasets and loaders → transforms → models → autograd → optimization loop → save and load.
- *Karpathy* introduces tensors through a bigram model and dwells on broadcasting traps.
- *CS336 A1* deliberately bans the high-level `torch.nn` layers at first. Students build linear, embedding, normalization, softmax, attention and the optimizer from tensor operations. CS336 also teaches einops and resource accounting in lecture 2.
- *fast.ai Part 2* builds Dataset, DataLoader, Module and a callback-driven Learner, then adds mixed precision through Accelerate.
- *dlsys* teaches the library abstractions by having students implement them.

**Recommended lesson sequence (7 lessons)**
1. **[B→L] Tensors and shapes.** Shapes, strides, views vs copies, contiguity, dtype and device, einsum/einops. Drill in browser NumPy first, then in torch locally.
2. **[L] `nn.Module` in practice.** Parameters vs buffers, `state_dict`, train vs eval, hooks. Port the module-12 MLP and confirm identical gradients.
3. **[L] Data pipelines.** Dataset/DataLoader, collate functions, `num_workers`, pinned memory, per-worker seeding, samplers for imbalance, and a sliding-window time-series dataset that feeds module 21.
4. **[L] The training loop as an artifact.** Evaluation, checkpointing of model+optimizer+scheduler+RNG state, logging, early stopping, and a test that resuming after interruption reproduces the uninterrupted loss curve.
5. **[L/MPS] Devices and performance basics.** CPU vs MPS vs CUDA; asynchronous execution and correct timing; `torch.compile`; FLOP and memory accounting (parameters, gradients, Adam's two moments, activations).
6. **[G] Mixed precision.** fp16 with gradient scaling vs bf16; autocast scope; overflow and underflow demos. Case study: nanochat skips autocast and manages a global compute dtype with fp32 master weights.
7. **[L] Testing ML code.** pytest for shapes, determinism and overfit-one-batch; finite-difference gradient tests; CS336-style adapters, so later modules can ship test suites the learner plugs into.

**From-scratch builds and the production comparison**
- Re-implement Linear, Embedding, LayerNorm/RMSNorm, softmax and cross-entropy (numerically stable via log-sum-exp) from tensor ops, and check them against `torch.nn` / `torch.nn.functional`.
- A mini Learner with callbacks, compared with HF Accelerate or Lightning: what you gain and what becomes invisible.
- A DataLoader throughput benchmark (workers × batch size × pinned memory) whose findings feed module 29.

**Mastery benchmarks**
- *Derive / compute*: training memory for a given model (weights + gradients + 2× Adam state + activations); bytes per dtype; ≈6·N·D training FLOPs for a transformer; the effective batch under gradient accumulation.
- *Implement*: a resumable training script with tests, where an interrupt-and-resume run matches the uninterrupted run on CPU.
- *Debug*: the seeded bugs below.
- *Explain*: view vs reshape vs contiguous; which calls force a device sync; why bf16 usually needs no loss scaling; train vs eval vs no-grad.

**Misconceptions, pitfalls and classic bugs**
1. A missing or misplaced `optimizer.zero_grad()`, so gradients accumulate across steps.
2. Assuming `model.eval()` disables autograd, or that `no_grad()` turns off dropout. Inference needs both.
3. Applying softmax before `CrossEntropyLoss`, or using NLLLoss without log-softmax.
4. Broadcasting surprises: predictions of shape (N,1) against targets of shape (N,) give an N×N loss matrix in `MSELoss`. Predict the loss value.
5. Timing GPU code without synchronizing, and calling `.item()` inside hot loops, which stalls the pipeline.
6. Workers with identical NumPy random states, which duplicate augmentations.
7. Checkpointing only model weights, so a resumed run restarts the LR schedule and loses momentum.
8. Accumulating `loss` tensors (graph attached) into running totals, which leaks memory.
9. fp16 without a gradient scaler, so small gradients underflow to zero; accumulating sums in low precision.
10. `.view()` on a transposed, non-contiguous tensor, and the reshape-vs-view confusion.
11. Mismatched model and data devices, or a model moved after optimizer construction in setups that rebuild parameters.
12. Benchmarking without warmup, so `torch.compile` and cuDNN autotuning are counted in step time.

**Engineering bridges**
- **Shapes as units.** Shape annotations do the job of dimensional analysis. einsum *is* Einstein index notation from continuum mechanics.
- **Precision and dynamic range** mirror instrument resolution, significant figures and fixed-point controller arithmetic.
- **Data loaders mirror DAQ pipelines**: buffering, sample-rate bottlenecks, back-pressure.
- **Checkpoint/restart files** play the same role as restart files in CFD.

**Primary references:** `pytorch-tutorials-2026`, `stanford-cs336-2026`, `pytorch-amp-docs`, `micikevicius2017-mixed-precision` (supporting: `paszke2019-pytorch`, `ansel2024-pytorch2`, `he2022-brrr`, `karpathy-nanochat`).

---

## Module 15 — CNNs, RNNs/LSTMs, attention

**How leading courses sequence it**
- *CS231n 2026*: CNNs (convolution, pooling) → architectures (BatchNorm, transfer learning, AlexNet/VGG/ResNet) → RNN/LSTM/GRU with language modeling and captioning → attention and transformers (including ViT). The A2/A3 split puts RNN captioning before transformer captioning.
- *d2l*: CNNs → modern CNNs → RNNs → modern RNNs (LSTM/GRU, seq2seq) → attention and transformers.
- *Karpathy*: MLP → a hierarchical, WaveNet-like convolutional model → GPT, skipping recurrence entirely.
- *dlsys*: CNN theory, then implementation (im2col-style), RNN implementation, transformer implementation.
- *SLP3 (2026)*: places RNNs/LSTMs after transformers.
- Attention entered through Bahdanau's fix for the fixed-length seq2seq bottleneck. That remains the clearest motivation.

**Recommended lesson sequence (7 lessons)**
1. **[B] Convolution as a structured linear map.** 1D/2D convolution; padding, stride and dilation; receptive fields; convolution as a Toeplitz matrix; im2col in NumPy; classic edge-filter demos.
2. **[B] A CNN from scratch on 8×8 digits** (sklearn digits fits the browser budget). Pooling and BatchNorm; parameter count vs an MLP; translation equivariance.
3. **[L] Modern CNNs and transfer learning.** ResNet blocks and why identity paths help. Fine-tune a pretrained torchvision ResNet on a small engineering image set (e.g., thermal images or spectrograms) on MPS.
4. **[B] RNNs as discrete-time state-space models.** Unrolling, BPTT, and gradients as products of Jacobians. An eigenvalue slider shows vanishing and exploding gradients; clipping.
5. **[B→L] LSTM/GRU gating.** Implement an LSTM cell in NumPy and match `nn.LSTM`. Copy and adding tasks. Compare a causal dilated 1D CNN with an LSTM on a sensor sequence.
6. **[B] Attention from first principles.** The bottleneck problem → additive attention → scaled dot-product attention as a differentiable soft lookup (kernel smoothing); masks; attention maps.
7. **[B] Bridge to state-space layers.** Linear recurrences, zero-order-hold discretization, and the convolution-kernel view of an LTI layer (the S4 idea); selectivity (Mamba) in brief; the Kalman filter as the optimal *linear* recurrent estimator. Choosing among CNN, RNN and attention for time series.

**From-scratch builds and the production comparison**
- im2col convolution forward/backward with a gradient check and a speed comparison against naive loops. Compare with `F.conv2d`, noting that it computes cross-correlation.
- A NumPy LSTM matching `nn.LSTM` outputs and gradients to about 1e-5. The learner must handle PyTorch's gate ordering and its two bias vectors.
- A masked multi-head attention module compared with `F.scaled_dot_product_attention`.
- A linear SSM layer: discretize a continuous (A, B, C), then show that running it as a recurrence and as a long convolution give the same output.

**Mastery benchmarks**
- *Derive*:
  - The conv output-size formula, and the conv backward pass as a convolution with a flipped kernel (and its link to transposed convolution).
  - The BPTT Jacobian product and the spectral-radius condition for vanishing gradients.
  - Why the LSTM's additive cell path eases gradient flow.
  - The softmax Jacobian, and the 1/√d_k scale from a variance argument.
- *Implement*: a browser CNN at ≥ 97% on 8×8 digits; an LSTM matching torch; attention matching SDPA.
- *Debug*: the seeded bugs below.
- *Explain*: the inductive biases of each family (locality and weight sharing; recurrence; permutation equivariance of attention without positional information).

**Misconceptions, pitfalls and classic bugs**
1. PyTorch's "convolution" doesn't flip the kernel. Predict the output of an asymmetric kernel.
2. Off-by-one output sizes under stride and padding; "same" padding with even kernels.
3. Assuming the receptive field grows quickly with depth. It grows linearly without pooling or dilation, so the model never sees enough context.
4. Not detaching the hidden state between truncated-BPTT segments, so the graph grows until it runs out of memory.
5. `batch_first` confusion with `(seq, batch, feature)` inputs, which silently mixes time and batch.
6. Carrying hidden state across independent sequences (stateful leakage).
7. Dropping the 1/√d_k scale, so softmax saturates as width grows. Predict the attention entropy.
8. Applying the mask after softmax, or with the wrong broadcast, which leaks the future.
9. "Attention weights explain the prediction." They aren't faithful attributions.
10. Augmentations that change labels: flipping 6/9 digits, or mirroring physical images where orientation carries meaning.
11. Applying ImageNet normalization statistics blindly to non-RGB sensor images.
12. Treating exploding gradients as only an LR problem when the recurrent Jacobian is the culprit.

**Engineering bridges**
- **An RNN is a nonlinear discrete-time state-space model**, x_{t+1} = f(x_t, u_t). Linearize, and the eigenvalues of the state Jacobian decide gradient stability exactly as they decide system stability.
- **LSTM gates behave like learned, input-dependent time constants**: leaky integrators, or a first-order lag with variable τ.
- **The Kalman filter is the optimal linear recurrent estimator.** A trained RNN is a nonlinear learned observer. S4/Mamba layers literally parameterize continuous LTI systems with ZOH discretization.
- **Convolution is an LTI impulse response.** CNN filters are FIR filters, and dilated causal convolutions resemble multi-rate filter banks.
- **Attention is kernel regression** (Nadaraya–Watson), like interpolating gain tables over operating points.

**Primary references:** `stanford-cs231n-2026`, `hochreiter1997-lstm`, `bahdanau2014-attention`, `gu2021-s4`, `he2015-resnet` (supporting: `d2l-2023`, `gu2023-mamba`, `kalman1960-filtering`, `cmu-dlsys-2026`).

---

## Module 16 — Transformers from scratch, then training a small language model

**How leading courses sequence it**
- *Karpathy*: bigram baseline → one self-attention head → multi-head → feed-forward → residual + LayerNorm (pre-norm) → dropout → scale up on a small Shakespeare corpus. nanochat is now the full-stack successor (nanoGPT is deprecated).
- *CS336 A1*: build every piece from primitives: BPE tokenizer, RMSNorm, SwiGLU, RoPE, causal multi-head attention, AdamW, warmup+cosine schedule, gradient clipping, data loading, checkpointing, decoding. Then train on TinyStories and an OpenWebText sample, all behind unit tests. Lectures cover architecture and hyperparameter choices and MoE/attention alternatives.
- *Raschka*: text data → attention → GPT model → pretraining, with appendix D adding warmup, cosine decay and clipping.
- *Phuong & Hutter*: pseudocode-level precision useful for mastery tests.

**Recommended lesson sequence (7 lessons)**
1. **[B] The language-modeling frame.** Counted bigrams → neural bigram; negative log-likelihood, perplexity and bits per byte; temperature and top-k sampling (character level).
2. **[B] A self-attention block in NumPy.** Causal mask, multiple heads, output projection; a shape drill; preview of the KV cache.
3. **[B] The full block.** The residual stream; pre-LN vs post-LN; MLP (GELU vs SwiGLU); positional information (learned, sinusoidal, RoPE); parameter and FLOP counting.
4. **[B, tiny] Train a micro-transformer in the browser.** d_model 32–64, 1–2 layers, context 32, a small corpus, under a minute. Watch the loss and the attention patterns. Then load a pre-trained, slightly larger checkpoint for sampling.
5. **[L] A GPT from primitives in PyTorch** (CS336-style, no `nn.Linear` in the first pass), with unit tests. Train on TinyStories on MPS with AdamW, warmup+cosine, clipping and checkpoint/resume.
6. **[L/G] Training properly at small scale.** Tokens per parameter, batch size in tokens, gradient accumulation, an eval loop, an MFU estimate. Optional rented-GPU nanochat run: a d12 model in minutes, or the full speedrun.
7. **[L] Ablations and interpretability-lite.** Remove positions, swap the norm placement, sweep LR; watch induction-style copying behaviour appear on repeated sequences.

**From-scratch builds and the production comparison**
- A GPT from primitives that loads GPT-2 small weights and reproduces the HF `transformers` logits within tolerance. This is the strongest single correctness test for the build.
- RoPE, with a numerical check that attention scores depend only on relative offset.
- Causal attention compared with `F.scaled_dot_product_attention` (and fused FlashAttention where available).
- Production comparison: HF `transformers` model classes and nanochat's `gpt.py`, judged on throughput, loss curves and features (KV cache, mixed precision, Muon+AdamW).

**Mastery benchmarks**
- *Derive*: attention's O(T²·d) cost; parameters ≈ 12·L·d² for standard blocks; training FLOPs ≈ 6·N·D; the 1/√d scale; correctness of causal masking; max-subtraction for softmax stability.
- *Implement*: a GPT that passes tests, reproduces GPT-2 logits from loaded weights, and reaches a target validation loss on TinyStories.
- *Debug*: mask off-by-one, unshifted targets, head reshape order, LN placement.
- *Explain*: the residual-stream view; why pre-norm trains more stably; what the KV cache stores; how cost scales with context length.

**Misconceptions, pitfalls and classic bugs**
1. Targets not shifted by one position, so the training loss collapses toward 0 (the model copies its input). Predict the curve.
2. A missing or wrong causal mask: validation loss looks great, but autoregressive generation is garbage.
3. Masking with −1e9 in fp16, which overflows to inf/NaN. Use the dtype minimum, or let SDPA handle masking.
4. No positional information, so the model is a bag of tokens. Show that it can't solve an order-dependent task.
5. An output layer initialized too large, so the initial loss sits far above ln(V).
6. Splitting heads with view and transpose in the wrong order, which silently mixes dimensions across heads.
7. Comparing perplexities across tokenizers. Use bits per byte.
8. Train/validation leakage from overlapping windows cut from the same documents.
9. No warmup with post-LN, so training diverges early.
10. Dropout left on during generation; dropout applied to the residual stream at the wrong place.
11. Repetition loops under greedy decoding, mistaken for a training failure.
12. Memorizing a tiny corpus and mistaking it for "learning language".

**Engineering bridges**
- **The residual stream as a bus or header.** Each block reads from it and writes small updates back. A ResNet layer is a forward-Euler step of an ODE (see `chen2018-neural-ode`).
- **Attention as content-addressable lookup** with interpolation weights.
- **6·N·D estimates as engineering back-of-envelope sizing**, Fermi problems in practice.
- **LayerNorm as per-sample nondimensionalization.**

**Primary references:** `vaswani2017-attention`, `stanford-cs336-2026`, `karpathy-nanochat`, `phuong2022-formal-transformers`, `raschka2024-llms-from-scratch` (supporting: `karpathy-zero-to-hero`, `xiong2020-preln`, `su2021-rope`, `ba2016-layernorm`).

---

## Module 17 — Tokenization, pretraining, scaling laws, fine-tuning, LoRA, RLHF and DPO concepts

**How leading courses sequence it**
- *CS336 2026*: tokenization in lecture 1. Scaling laws get two lectures, and A3 fits laws by querying a training API instead of training large models. Data gets two lectures (sources; filtering, dedup, mixing, synthetic data) and A4 builds a pipeline from raw Common Crawl. Post-training is SFT/RLHF, then RL with verifiable rewards; A5 is SFT and RL for math reasoning, with optional DPO/safety.
- *CS224n 2026*: pretraining (scaling, systems, data) → post-training (RLHF, SFT, DPO) → efficient adaptation (prompting + PEFT) → reasoning, plus a guest lecture on LoRA practice.
- *Karpathy's tokenizer lecture and minbpe*: byte-level BPE, regex pre-splitting, special tokens, and many "weird LLM behaviours" traced back to tokenization.
- *HF LLM course*: tokenizers, then fine-tuning LLMs, then reasoning models (GRPO).
- *Raschka*: classification fine-tuning → instruction fine-tuning → LoRA → DPO (bonus), with a reasoning-model sequel.
- *Papers*:
  - Kaplan (power laws) vs Chinchilla (compute-optimal allocation, with more tokens per parameter than Kaplan implied).
  - InstructGPT (SFT → reward model → PPO).
  - DPO (preferences without an explicit RL loop).
  - LoRA/QLoRA (parameter- and memory-efficient tuning).
  - DeepSeekMath's GRPO and DeepSeek-R1 (RL with verifiable rewards).
  - Tülu 3 (an open post-training recipe).

**Recommended lesson sequence (8 lessons)**
1. **[B] Tokenization from scratch.** Byte-level BPE training, encoding and decoding in pure Python on a small corpus. Compression ratio; pathologies (digits, whitespace, non-English text, rare strings). Compare with tiktoken, serving the vocabulary file from the app because Pyodide couldn't fetch it.
2. **[B] Pretraining data.** Next-token prediction as compression; exact and near-duplicate removal (MinHash); heuristic and model-based quality filters; mixture weights; benchmark contamination checks on a toy corpus.
3. **[B] Scaling laws.** Fit L(N, D) power laws to run tables in log space with bootstrap intervals. Solve the compute-optimal N and D under C ≈ 6·N·D. Show how badly fits extrapolate outside their range.
4. **[L] Supervised fine-tuning.** Chat templates; loss masking of prompt tokens; classification-head vs instruction tuning on a small model on MPS.
5. **[B→L] LoRA/QLoRA.** Low-rank update math, with an SVD demo in the browser showing how much of a weight delta a rank-r update captures; parameter and memory accounting. Then a local LoRA run with PEFT on a ~0.5B model, compared with full fine-tuning on a tiny model.
6. **[B] Policy-gradient primer for LMs** (the cross-module bridge from §0.3). REINFORCE with a baseline and a KL penalty to a reference policy, on a bandit-style "generate a string" task.
7. **[B→L] Preference learning.** Bradley–Terry reward models; the RLHF/PPO pipeline at the concept level; DPO derived from the KL-regularized objective and implemented on a tiny model. Reward over-optimization and hacking demos.
8. **[L/G] RL with verifiable rewards.** GRPO's group-relative advantages and verifier design; a small math-task run locally (e.g., a TRL-style trainer on a tiny model) or with nanochat's RL stage on a rented GPU.

**From-scratch builds and the production comparison**
- A minbpe-style tokenizer with round-trip property tests, checked against tiktoken's GPT-2 vocabulary (served locally).
- A scaling-law fitter (nonlinear least squares in log space, with bootstrap confidence intervals and a compute-optimal solver).
- A LoRA wrapper with merge/unmerge, verified against PEFT outputs.
- A DPO loss computed from sequence log-probabilities and matched to a reference trainer on a toy batch.
- GRPO advantage computation plus a clipped objective, unit-tested on hand-computed groups.
- Production comparison: tiktoken/HF tokenizers; HF transformers + PEFT + TRL (SFT, DPO and GRPO trainers); nanochat's `tok_train`, `base_train`, `chat_sft` and `chat_rl` scripts.

**Mastery benchmarks**
- *Derive*:
  - The BPE merge loop and its complexity.
  - Chinchilla-style optimal N and D from L = E + A/N^α + B/D^β under a compute constraint (a Lagrange-multiplier exercise).
  - The LoRA parameter count, and why one factor starts at zero.
  - DPO from the closed-form optimum of KL-regularized reward maximization.
  - GRPO's per-group normalization.
  - The role of the KL term.
- *Implement*: the tokenizer passes its tests; DPO matches the reference to 1e-5; a LoRA fine-tune measurably improves a held-out instruction eval.
- *Debug*: a chat-template mismatch; unmasked prompt loss; reward hacking in a toy RLHF loop; a scaling fit done in linear space.
- *Explain*: why tokenization hurts arithmetic and spelling; SFT vs RLHF vs DPO vs RLVR; what scaling laws can and can't predict.

**Misconceptions, pitfalls and classic bugs**
1. "Tokens are words." Predict token counts for numbers, code, units ("kW·h") and French text, and the resulting cost.
2. Tokenizer/model or chat-template mismatch, which silently degrades output.
3. SFT loss computed over prompt tokens, so the model learns to write the user's turns.
4. Comparing perplexity across tokenizers instead of using bits per byte.
5. Treating "about 20 tokens per parameter" as a law. Inference-heavy deployments deliberately over-train smaller models, and data-limited regimes change the optimum.
6. Extrapolating a scaling fit across architecture or data changes, or fitting in linear space.
7. "Higher LoRA rank is always better"; forgetting the α/r scaling; merging adapters into a quantized base without care.
8. DPO with a wrong or drifting reference model; misreading β as a learning rate.
9. Reward-model over-optimization: KL weight too small, so outputs game the reward.
10. Benchmark contamination in pretraining data, which inflates evals.
11. Catastrophic forgetting after narrow fine-tuning.
12. Fine-tuning at the pretraining learning rate, which wrecks the model.

**Engineering bridges**
- **Scaling laws resemble empirical heat-transfer correlations** (Nu = C·Re^m·Pr^n). Power laws are fitted in log-log space and only valid inside the tested range, and similitude explains why small runs predict big ones.
- **Compute-optimal allocation is constrained design optimization** with Lagrange multipliers.
- **BPE is dictionary compression**, related to LZ-family codes.
- **LoRA is reduced-order modeling.** A low-rank update is like keeping the leading POD/SVD modes (see Brunton & Kutz).
- **RLHF's KL penalty is regularized control.** It penalizes deviation from a nominal trajectory or policy.

**Primary references:** `stanford-cs336-2026`, `hoffmann2022-chinchilla`, `hu2021-lora`, `rafailov2023-dpo`, `shao2024-deepseekmath` (supporting: `karpathy-minbpe`, `sennrich2015-bpe`, `kaplan2020-scaling-laws`, `dettmers2023-qlora`, `ouyang2022-instructgpt`, `deepseek2025-r1`, `lambert2024-tulu3`, `brown2020-gpt3`, `grattafiori2024-llama3`, `hf-llm-course`, `weng2024-reward-hacking`).

---

## Module 18 — Inference (KV cache, quantization, batching, latency and cost trade-offs)

**How leading courses sequence it**
- *CS336* has a dedicated inference lecture after scaling laws; A2's systems work (profiling, a Triton FlashAttention2 kernel) supplies the hardware intuition.
- *Raschka's KV-cache bonus* and *nanochat's inference engine and benchmark script* show the cache in small, readable code.
- *Pope et al.* explain why decode is memory-bound and how partitioning trades latency against throughput.
- *vLLM (PagedAttention)* reframes KV memory as paged virtual memory to enable continuous batching.
- *FlashAttention* teaches IO-awareness.
- *Speculative decoding* gives exact sampling with a cheap draft model.
- *Quantization papers*: LLM.int8 (outliers), GPTQ (second-order post-training quantization), AWQ (activation-aware scaling).
- *MQA/GQA* shrink the cache.
- *"How to Scale Your Model"* provides roofline-based estimates.

**Recommended lesson sequence (7 lessons)**
1. **[B] Anatomy of generation.** Prefill vs decode; the sampling loop (greedy, temperature, top-k/top-p, stop conditions); latency metrics (time to first token, inter-token latency, throughput).
2. **[B] A KV cache from scratch** on the NumPy micro-LM. Test cached vs uncached outputs; derive memory = 2·layers·T·kv_heads·d_head·bytes; MQA/GQA variants.
3. **[B] Rooflines and arithmetic intensity.** An interactive calculator with real GPU specs showing why small-batch decode is bandwidth-bound and how batching moves the operating point.
4. **[B→L] Quantization.** Absmax and zero-point int8 schemes; per-tensor vs per-channel; outlier channels; GPTQ/AWQ intuition with error measured on small matrices in the browser. Then quantize a small model locally (llama.cpp GGUF or MLX on the Mac; bitsandbytes/torchao on CUDA) and measure perplexity and latency.
5. **[L/G] Batching and serving.** Static vs continuous batching, paged KV, prefix caching. Benchmark vLLM on a rented GPU (or llama.cpp/MLX locally): throughput vs p50/p99 latency under load.
6. **[B] Speculative decoding.** Simulate acceptance rates, verify that the output distribution is preserved (histogram test), and plot speedup against draft quality.
7. **[B] Cost and energy model (capstone).** $ per million tokens from GPU price, utilization and batch size; joules per token; links to data-center power and PUE.

**From-scratch builds and the production comparison**
- KV-cached generation (plus GQA), bitwise equal to uncached greedy decoding.
- An int8/int4 quantize-dequantize matmul with error analysis, and an outlier-channel ablation.
- A speculative sampler with an empirical distribution-equivalence test.
- A discrete-event simulator of request arrivals that compares static and continuous batching.
- Production comparison: vLLM, SGLang (prefix sharing, structured generation), llama.cpp/MLX, PyTorch SDPA/FlashAttention.

**Mastery benchmarks**
- *Derive*:
  - KV-cache memory.
  - The arithmetic intensity of decode (matrix-vector) vs prefill (matrix-matrix).
  - Expected tokens per speculative step, (1 − α^{k+1})/(1 − α).
  - Little's law for a serving queue.
  - Quantization error bounds for uniform quantizers.
- *Implement*: a cached generator plus a load-test harness that reports throughput and tail latency.
- *Debug*: a RoPE position offset that is wrong when using the cache; padding side and attention masks in batched decoding; quantization destroying outlier channels.
- *Explain*: why batching raises throughput but can hurt latency; what PagedAttention fixes; when to quantize weights vs activations vs KV.

**Misconceptions, pitfalls and classic bugs**
1. "Decoding is compute-bound." At small batch it is usually memory-bandwidth-bound.
2. A cache position or rotary offset bug, so output degrades after the first generated token.
3. Right padding in batched decoder-only generation, or a missing attention mask.
4. "Temperature 0 is deterministic everywhere." Batching and kernel nondeterminism can change outputs.
5. "Quantization error is uniform." A few outlier features dominate, so per-channel or mixed precision is needed.
6. Reporting throughput without latency percentiles under realistic load.
7. Benchmarking without warmup or compilation steps.
8. "Speculative decoding changes the distribution." With correct acceptance sampling it doesn't.
9. Ignoring KV memory, so long contexts or concurrency cause out-of-memory errors.
10. Assuming prefix caching helps when system prompts vary per request.
11. Cost models that assume 100% utilization.

**Engineering bridges**
- **Rooflines are pump-curve vs system-curve analysis.** The operating point sits at the binding constraint.
- **Little's law and queueing** carry straight over from traffic and process flow. Batching is batch processing in manufacturing.
- **Quantization is ADC resolution.** Each extra bit buys about 6 dB of SNR.
- **Energy per token** connects inference to PUE and data-center energy accounting, the learner's target domain.

**Primary references:** `pope2022-inference`, `kwon2023-pagedattention`, `dao2022-flashattention`, `leviathan2022-speculative`, `austin2025-scaling-book` (supporting: `dettmers2022-llm-int8`, `frantar2022-gptq`, `lin2023-awq`, `shazeer2019-mqa`, `ainslie2023-gqa`, `zheng2023-sglang`, `karpathy-nanochat`).

---

## Module 19 — Building with LLMs (tool use, structured outputs, RAG, embeddings and vector search, agents, MCP, evaluation)

**How leading courses sequence it**
- *CS224n 2026*: prompting + PEFT → agents, tool use, RAG → benchmarking and evaluation.
- *SLP3 2026*: an IR & RAG chapter; the agents chapter isn't written yet.
- *Huyen, AI Engineering*: foundation-model basics → **evaluation methodology and evaluating AI systems (early)** → prompting → RAG and agents → fine-tuning → dataset engineering → inference optimization → architecture and user feedback.
- *Anthropic*:
  - Distinguishes predefined *workflows* from model-directed *agents*, with a ladder of patterns: augmented LLM, prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer.
  - Says to start with the simplest thing that works. The post now warns that tooling has changed since 2024.
  - Later posts add tool design driven by agent-run evaluations, context engineering (compaction, notes, sub-agents, just-in-time retrieval), code execution with MCP, and a full agent-eval methodology (Jan 2026).
- *Husain & Shankar*: error analysis on real traces first (open coding, then axial coding into failure categories), binary pass/fail judgments, and LLM judges validated against human labels.
- *MCP 2026-07-28*: the integration standard; its current shape is in §0.1.

**Recommended lesson sequence (8 lessons)**
1. **[B] LLM API fundamentals.** Messages, system prompts, sampling parameters, token accounting and cost, streaming, retries, timeouts. Browser lessons use **recorded responses** (cassettes) so they're deterministic and no API key ever touches the browser; live calls happen in local scripts.
2. **[B] Structured outputs.** JSON Schema with pydantic validation (available in Pyodide); a toy constrained-decoding demo that masks invalid tokens with a finite-state machine; validate-and-repair loops.
3. **[B] Embeddings and vector search from scratch.** Cosine vs dot product, normalization, brute-force kNN, an IVF index (k-means coarse quantizer), HNSW intuition; recall@k vs latency on precomputed embeddings shipped with the lesson.
4. **[B→L] A RAG pipeline on engineering documents.** Chunking that respects tables and units, hybrid BM25+dense retrieval, reranking, citations. Retrieval metrics separate from answer metrics. A full local version uses a real embedding model over a public HVAC or controls manual corpus.
5. **[B] Tool use and the agent loop.** Tool schemas, the observe-act loop, step limits and transcript logging with a mock model, then a real model locally. Implement each Anthropic workflow pattern once.
6. **[L] MCP.** Build a minimal server exposing a read-only "building telemetry" resource and a "query sensor history" tool under the 2026-07-28 spec, and connect it to a client such as Claude Code. Cover consent, least privilege and prompt-injection surfaces.
7. **[B→L] Evaluating LLM systems.** Trace review and error analysis; code-based vs model-based vs human graders; validating an LLM judge against human labels (TPR/TNR with bootstrap CIs); pass@k vs pass^k; capability vs regression suites; wiring evals into CI.
8. **[L] Reliability, safety and operations.** Context engineering for long tasks; sandboxing; injection drills; cost and latency budgets; tracing with MLflow; mandatory human approval before any action on physical equipment (BMS writes).

**From-scratch builds and the production comparison**
- An agent loop of at most ~150 lines: tool registry, schema validation, step and cost guards, JSON transcript, and deterministic replay tests with a mock LLM.
- A vector index (brute force + IVF) with a recall benchmark, compared with FAISS/hnswlib locally.
- A toy grammar-constrained decoder.
- A judge-calibration notebook: confusion matrix against human labels, bootstrap CIs, and position-bias checks for pairwise judging.
- Production comparison: provider SDKs and their structured-output features; pydantic; FAISS, hnswlib or pgvector; rerankers; MCP SDKs; trace and eval tooling (MLflow tracing, plus the open-source and commercial frameworks Anthropic's eval post lists, such as Harbor, Braintrust, LangSmith, Langfuse and Phoenix, none of which were checked this session).

**Mastery benchmarks**
- *Derive*: recall@k and nDCG; the unbiased pass@k estimator and pass^k = p^k; cost per task from token counts; why normalized dot product equals cosine similarity.
- *Implement*: a RAG system with an eval suite that separates retrieval failures from generation failures; an MCP server with tests; an agent with replayable transcripts.
- *Debug*: seeded failures (chunking that splits a table, a judge biased by answer position, an ambiguous tool parameter, an injected instruction hidden in a retrieved document).
- *Explain*: workflow vs agent; RAG vs fine-tuning vs long context; why you must read transcripts.

**Misconceptions, pitfalls and classic bugs**
1. "More context is always better." Long-context use is position-sensitive (lost in the middle), and cost grows linearly.
2. "High embedding similarity means relevant." Unnormalized dot products also reward vector norm.
3. Evaluating RAG only end to end, so failures can't be localized.
4. Uncalibrated LLM judges; Likert scales that drift; pairwise position bias.
5. "JSON mode means schema-valid." Always validate and repair.
6. Reaching for an agent when a fixed workflow is cheaper and more reliable.
7. Vague tool names or descriptions, or tools that dump huge payloads into context.
8. Prompt injection through retrieved documents or tool outputs, where data gets treated as instructions.
9. Single-trial evals of nondeterministic systems. Use multiple trials and report pass^k for consistency.
10. API keys embedded in browser code.
11. Chunk boundaries that cut through units, tables or equations in technical manuals.
12. Saturated eval suites (100%) that no longer give signal. Add harder capability tasks.

**Engineering bridges**
- **The agent loop is supervisory control.** Sense, plan and act in an outer loop that issues setpoints to deterministic inner loops (tools).
- **Guardrails are interlocks and safety-instrumented functions.** Human approval is an operator permissive.
- **Eval suites are commissioning functional-performance tests.** Regression suites are re-commissioning.
- **Layered defenses** (Anthropic invokes the Swiss-cheese model) are layers-of-protection analysis from process safety.

**AI-native practice in 2026 for this module (with sources)**
- **Eval-driven development.** Write tasks and graders *before* features. Start with 20–50 tasks drawn from real failures, separate capability suites (low pass rate, a hill to climb) from regression suites (near 100%), run several trials per task, and read transcripts routinely (`anthropic2026-demystifying-evals`, `husain-shankar-2026-evals-faq`).
- **Error analysis as the core skill.** Sample traces, label failures in open form, cluster them into categories, and fix the largest category first (`husain2025-field-guide`, `husain-shankar-2026-evals-faq`).
- **Validate the validators.** Treat an LLM judge as a classifier, measure its agreement with human labels, and expect your criteria to evolve as you grade (`shankar2024-who-validates`, `zheng2023-llm-judge`).
- **Design tools for agents and with agents.** Prototype a tool, have an agent attempt generated tasks, then use the transcripts to refine names, descriptions and response sizes (`anthropic2025-writing-tools`).
- **Context engineering for long-horizon work**: compaction, external notes, sub-agents (`anthropic2025-context-engineering`).
- **MCP as the integration layer**, built to the current spec, with security principles taken from the spec itself (`mcp-spec-2026-07-28`, `anthropic2025-code-execution-mcp`).
- **Observability is the default.** Trace every call, using the same tools as ML tracking (`mlflow-docs`).

**Primary references:** `huyen2025-ai-engineering`, `anthropic2024-building-effective-agents`, `anthropic2026-demystifying-evals`, `husain-shankar-2026-evals-faq`, `mcp-spec-2026-07-28` (supporting: `husain2024-needs-evals`, `lewis2020-rag`, `yao2022-react`, `malkov2016-hnsw`, `reimers2019-sbert`, `liu2023-lost-in-middle`, `zheng2023-llm-judge`, `shankar2024-who-validates`, `anthropic2025-writing-tools`, `anthropic2025-context-engineering`).

---

## Module 20 — Generative models (VAEs, diffusion basics)

**How leading courses sequence it**
- *CS231n 2026*: Generative Models 1 (VAE, GAN, autoregressive), then Generative Models 2 (diffusion). A3 includes diffusion.
- *fast.ai Part 2* builds the whole stack in its own framework: autoencoders → VAEs → U-Nets → DDPM → DDIM → samplers (Euler, Heun, LMS) → conditioning and guidance → textual inversion/DreamBooth.
- *MIT 6.S184 (2026)* goes math-first: SDEs and ODEs, Fokker–Planck, flow matching and diffusion, with labs ending in a from-scratch latent diffusion model.
- *UDL* has VAE and diffusion chapters plus 2026 blog posts on ODEs and SDEs in ML.
- *Weng* and *Luo* give derivation-dense ELBO-based tutorials that unify VAEs, diffusion and score matching.
- *Papers*: VAE, DDPM, DDIM, score SDE, classifier-free guidance, flow matching.

**Recommended lesson sequence (6 lessons)**
1. **[B] Latent-variable models and the ELBO.** Gaussian mixtures, KL divergence, reparameterization; derive the ELBO and check it numerically.
2. **[B] A VAE from scratch** on 2D data and 8×8 digits, using the module-12 engine or NumPy. Reconstructions, latent traversals, the β trade-off, a posterior-collapse demo.
3. **[B] Diffusion on 2D toy data.** The forward noising process and closed-form marginals, noise schedules, ε-prediction training, DDPM sampling; animate the trajectories.
4. **[B] Score, SDE/ODE view and flow matching.** DDIM deterministic sampling, the probability-flow ODE with Euler vs Heun steps, flow-matching training on straight paths; quality against number of steps.
5. **[L/G] Image diffusion.** A small U-Net DDPM on MNIST or Fashion-MNIST (slow but feasible on MPS; faster on a rented GPU); caveats of FID-style evaluation.
6. **[L] Conditioning, guidance and production.** Classifier-free guidance; latent diffusion; HF diffusers pipelines and schedulers compared with your own sampler. Engineering uses: synthetic sensor scenarios for stress-testing controllers and detectors.

**From-scratch builds and the production comparison**
- A 2D VAE and 2D diffusion/flow-matching models with tiny NumPy MLPs that run in the browser.
- DDPM and DDIM samplers that share one trained ε-model, plus Euler and Heun ODE integrators for the probability-flow ODE.
- Production comparison: diffusers schedulers and pipelines; torchvision datasets.

**Mastery benchmarks**
- *Derive*:
  - The ELBO and the reparameterization gradient.
  - The closed form of q(x_t | x_0).
  - The simplified DDPM loss as weighted denoising score matching.
  - DDIM as an ODE discretization.
  - The classifier-free guidance combination.
  - The conditional-velocity target in flow matching.
- *Implement*: 2D diffusion that recovers the target density (an MMD or kNN two-sample statistic under a threshold); a VAE with KL annealing.
- *Debug*: schedule indexing off by one, variance vs standard deviation confusion, a sign error in the reverse step.
- *Explain*: mode coverage vs GANs; steps vs quality; likelihood vs sample quality; memorization risks.

**Misconceptions, pitfalls and classic bugs**
1. Using β_t where √β_t (a standard deviation) is needed, which gives the wrong SNR schedule.
2. Timestep off-by-one between training and sampling.
3. Inconsistent data scaling, e.g. training on [−1, 1] but sampling or clipping as if on [0, 1].
4. VAE KL term with the wrong sign or reduction (sum vs mean), causing posterior collapse or blur; β too high.
5. Sampling with the network still in train mode (dropout/BatchNorm noise).
6. "Diffusion must take hundreds of steps." ODE samplers, distillation and flow matching cut this sharply.
7. Comparing FID across different sample counts or preprocessing.
8. Guidance scale too high: saturated, low-diversity samples.
9. "VAE latents are automatically disentangled and interpretable."
10. Ignoring memorization and copying of training data.

**Engineering bridges**
- **The forward process is the heat equation.** Fokker–Planck dynamics will be familiar from diffusion PDEs. Reversing it requires the score, the gradient of the log-density.
- **Sampling is numerical ODE/SDE integration.** Euler vs Heun, step size and stiffness all apply directly.
- **Flow matching is transport by a velocity field.** Streamlines and the continuity equation come straight from fluid mechanics.
- **A VAE is a probabilistic nonlinear reduced-order model**: latent coordinates like nonlinear POD modes.

**Primary references:** `holderrieth-mit-6s184-2026`, `kingma2013-vae`, `ho2020-ddpm`, `lipman2022-flow-matching`, `weng2021-diffusion` (supporting: `song2020-score-sde`, `song2020-ddim`, `ho2022-cfg`, `luo2022-diffusion-tutorial`, `prince2023-udl`, `fastai-practical-deep-learning`, `kingma2019-vae-intro`).

---

## Module 21 — Time series (classical methods, gradient boosting, deep forecasters, probabilistic forecasting)

**How leading courses sequence it**
- *FPP (3rd ed. and the 2026 Pythonic edition)*: graphics → decomposition → features → **forecaster's toolbox (benchmarks, residual diagnostics, accuracy, time-series cross-validation)** → judgmental forecasts → regression → exponential smoothing → ARIMA → dynamic regression → hierarchical/grouped → advanced methods → practical issues. The Python edition adds neural-network and foundation-model chapters at the end and teaches through statsforecast and related libraries. So the leading text still puts *evaluation discipline and baselines before models*.
- *Nixtla docs*: organized by library:
  - statsforecast: AutoETS/ARIMA, MSTL, cross-validation, conformal intervals, intermittent demand, anomaly detection;
  - mlforecast: lag and target transforms, LightGBM CV;
  - neuralforecast: NHITS, NBEATS, TFT, PatchTST, DeepAR, DLinear, TSMixer;
  - hierarchicalforecast.
- *Evidence that shapes rigor*:
  - M4 rewarded combinations and hybrids.
  - M5 was dominated by gradient-boosted trees on hierarchical retail data.
  - Zeng et al. showed a one-layer linear model rivalling many transformer forecasters.
  - GIFT-Eval benchmarks foundation models with attention to leakage.
  - Hewamalage et al. catalogue evaluation pitfalls.
  - Hyndman & Koehler motivate scaled errors (MASE).
  - Gneiting & Raftery ground proper scoring rules (CRPS).

**Recommended lesson sequence (8 lessons)**
1. **[B] Time-series anatomy for energy data.** Trend, multiple seasonalities (daily, weekly, annual), calendar effects, weather drivers, autocorrelation, stationarity, STL/MSTL decomposition of a building or data-center load series.
2. **[B] Benchmarks and evaluation discipline.** Naive, seasonal naive, drift, mean; MASE/RMSSE; rolling-origin evaluation; errors by horizon; a leakage-trap gallery.
3. **[B] ETS and ARIMA as state-space models.** statsmodels in the browser; ARIMA with temperature regressors (dynamic regression); prediction intervals; the Kalman-filter view.
4. **[B] Gradient boosting for forecasting.** Lags, rolling statistics, calendar and weather features; recursive vs direct multi-step; global models across many meters; LightGBM in the browser (the M5 lesson).
5. **[B] Probabilistic forecasting.** Pinball/quantile loss, CRPS, PIT histograms and coverage, split-conformal intervals; quantile gradient boosting.
6. **[L] Deep forecasters with neuralforecast.** DeepAR (likelihood heads), N-BEATS/NHITS, TFT, PatchTST, with DLinear as a sanity baseline, trained globally on many series.
7. **[L] Foundation models.** Zero-shot Chronos/TimesFM/Moirai against tuned baselines; how pretraining-corpus overlap can contaminate the "zero-shot" claim; GIFT-Eval-style protocol.
8. **[L] Hierarchical and production forecasting (capstone).** Reconcile meter → building → campus forecasts; a backtesting pipeline; forecast-drift monitoring. Day-ahead cooling-load or IT-load forecasting with weather-forecast covariates.

**From-scratch builds and the production comparison**
- Seasonal naive, simple exponential smoothing → Holt → Holt–Winters in NumPy, matched against statsmodels.
- A local-level Kalman filter whose steady state reproduces simple exponential smoothing.
- A rolling-origin evaluation harness with MASE and horizon breakdowns, plus automatic leak detectors (feature timestamps later than the forecast origin).
- Quantile regression by pinball loss, and a split-conformal wrapper with a coverage test.
- A tiny DeepAR-style RNN with a Gaussian likelihood, local in PyTorch.
- Production comparison: statsforecast, mlforecast and neuralforecast (local only, since they need numba); statsmodels and LightGBM (browser); Chronos and TimesFM packages (local).

**Mastery benchmarks**
- *Derive*:
  - Simple exponential smoothing as an exponentially weighted average, and as the steady-state Kalman filter of a local-level model.
  - Backshift-operator algebra for ARIMA.
  - Why MASE is scale-free.
  - That the minimizer of pinball loss is the quantile.
  - CRPS as an integral of quantile losses.
- *Implement*:
  - Leak-free rolling-origin evaluation.
  - A global GBM that beats seasonal naive on a held-out horizon by a stated MASE margin.
  - Calibrated 80% intervals with empirical coverage within ±5 points.
- *Debug*: future weather *actuals* used where only forecasts would exist; timezone/DST misalignment; wrong seasonal period; random k-fold CV on time series.
- *Explain*: when deep models help (many related series, rich covariates) and when they don't; error accumulation in recursive vs direct strategies; leakage risks for foundation models.

**Misconceptions, pitfalls and classic bugs**
1. Random k-fold cross-validation on time series (look-ahead leakage) gives optimistic errors. Predict the gap vs rolling-origin.
2. Backtesting with observed future weather when production only has weather forecasts (oracle leakage).
3. Centered rolling windows that include future values.
4. MAPE on loads near zero (it explodes and is asymmetric), and averaging percentage errors across differently scaled series.
5. Ignoring DST and timezones in hourly building data, which shifts daily seasonality.
6. "Transformers always win." DLinear and the M4/M5 results are counterexamples.
7. Fitting scalers, differencing or Box-Cox on the full series; forgetting the bias correction when back-transforming logs.
8. Validating one step ahead when the operational need is day-ahead.
9. Intervals that are too narrow because parameter and model uncertainty are ignored.
10. Scoring a foundation model "zero-shot" on series it saw in pretraining.
11. Teacher-forced training paired with recursive inference (exposure-bias mismatch).
12. Imputing gaps with interpolation that reaches across the forecast origin.

**Engineering bridges**
- **ETS/ARIMA are state-space models**, and exponential smoothing is a first-order low-pass filter with a time constant. The learner's Kalman and observer background transfers directly.
- **Buildings and data halls are RC thermal networks.** Lagged temperature terms in dynamic regression are a grey-box surrogate for thermal mass, and degree-days are a crude integral of the load driver.
- **Seasonality is periodic forcing.** Fourier terms are harmonics.
- **Probabilistic forecasts are design-condition percentiles.** HVAC design conditions are already quantiles (e.g., 0.4% annual design temperatures), so quantile forecasts are a familiar idea.

**Primary references:** `hyndman-fpppy-2026`, `makridakis2022-m5`, `zeng2022-dlinear`, `hewamalage2022-forecast-eval`, `salinas2020-deepar` (supporting: `hyndman-fpp3`, `nixtla-nixtlaverse`, `makridakis2020-m4`, `gneiting2007-scoring-rules`, `hyndman2006-forecast-accuracy`, `oreshkin2019-nbeats`, `lim2021-tft`, `nie2022-patchtst`, `ansari2024-chronos`, `das2023-timesfm`, `woo2024-moirai`, `aksu2024-gift-eval`, `angelopoulos2021-conformal`).

---

## Module 22 — Anomaly detection and fault diagnosis on sensor data

**How leading courses sequence it** (there's no canonical course, so this draws on the literature and benchmarks)
- *Chandola et al.* frame the problem space: point, contextual and collective anomalies; supervised, semi-supervised and unsupervised settings; technique families.
- *Ruff et al.* unify the shallow and deep views: density, one-class, reconstruction.
- *Isolation Forest* is the canonical unsupervised baseline.
- *Hundman et al.* (NASA telemetry) show forecast-residual detection with nonparametric dynamic thresholds.
- *Evaluation critiques*:
  - Wu & Keogh show that popular time-series anomaly benchmarks are often trivially solvable or mislabeled.
  - Kim et al. show point-adjusted F1 can make random scores look state-of-the-art.
  - Schmidl et al.'s large comparison finds simple methods competitive.
- For this learner the best data is LBNL's labeled HVAC fault dataset (Granderson et al.).
- Nixtla's statsforecast includes interval-based anomaly detection.

**Recommended lesson sequence (7 lessons)**
1. **[B] What counts as anomalous?** Point, contextual and collective anomalies; base rates and alarm costs; alarm fatigue; label scarcity; rule-based HVAC fault detection as the baseline every model must beat.
2. **[B] Statistical baselines.** Robust z-scores (median/MAD); Shewhart, EWMA and CUSUM charts; residuals from STL or a forecast with prediction intervals.
3. **[B] Multivariate and ML detectors.** Mahalanobis distance; PCA monitoring (Hotelling T² and SPE/Q); Isolation Forest, LOF, one-class SVM; contamination settings; score calibration.
4. **[B→L] Reconstruction- and forecast-based deep detectors.** A small autoencoder in the browser; LSTM/TCN forecast residuals with dynamic thresholds, locally.
5. **[B] Evaluation done right.** Event-level precision and recall, the point-adjust trap, range-based metrics, detection delay, PR-AUC; triviality checks against one-line baselines.
6. **[B] Fault diagnosis.** From detection to isolation: residual generation with models (parity relations, observers), fault-signature matrices, and fault-type classification on the LBNL dataset with feature attribution for root-cause hints.
7. **[L] A production AFDD pipeline (capstone).** Streaming detection, separating drift from fault, alert grouping and routing, an operator-feedback loop. PyOD and statsforecast locally, on data-center CRAH/chiller-style telemetry (public or synthetic).

**From-scratch builds and the production comparison**
- Isolation Forest in NumPy (random splits, path lengths, the c(n) normalization), compared with scikit-learn's.
- PCA monitoring with T² and Q control limits; CUSUM with average-run-length analysis.
- An evaluator that computes point-wise, point-adjusted and range-based scores on the same predictions, exposing the inflation.
- A detector that runs a whiteness test on Kalman-filter innovations.
- Production comparison: scikit-learn (browser), PyOD and statsforecast anomaly APIs (local; numba).

**Mastery benchmarks**
- *Derive*: the expected path length c(n) = 2H(n−1) − 2(n−1)/n; the T² distribution and control limits; the CUSUM delay vs false-alarm trade-off; precision/recall at low base rates (Bayes).
- *Implement*: a detector plus evaluator on the LBNL data, with documented thresholds and event-level F1 that beats the rule baseline.
- *Debug*: a mis-set contamination parameter; a scaler fit on faulted data; seasonal false alarms; point-adjust inflation.
- *Explain*: anomaly vs fault vs novelty vs drift; why unsupervised scores need calibration; detection vs isolation vs identification.

**Misconceptions, pitfalls and classic bugs**
1. Point-adjusted evaluation makes a random detector look excellent. Predict its F1 before computing it.
2. Trusting benchmark rankings built on trivial or mislabeled anomalies. Always run a one-liner baseline.
3. "99.9% accuracy" at a 0.1% anomaly rate. Use event-level precision-recall.
4. Fitting the detector or scaler on data that already contains faults, so they're learned as normal.
5. Ignoring operating modes (occupied/unoccupied, economizer, defrost), which drowns operators in contextual false alarms.
6. Tuning thresholds on the test period.
7. Treating sensor faults (drift, stuck-at, bias) like process faults. Validate the sensors first.
8. An over-capacity autoencoder that reconstructs anomalies well and so misses them.
9. Isolation Forest fed raw timestamps or high-cardinality IDs.
10. Seasonal or operational change flagged as an anomaly forever, because there's no adaptive baseline.
11. Alert storms from many correlated sensors downstream of one root cause.

**Engineering bridges**
- **Model-based fault detection and isolation from controls engineering**: residual generation, parity space, observer-based detection (Luenberger/Kalman), innovation whiteness tests.
- **Statistical process control (Shewhart/CUSUM/EWMA)** from quality engineering.
- **Physical consistency checks as virtual sensors.** Chilled-water energy balances (Q = ṁ·c_p·ΔT) and mass balances catch faults that black-box detectors miss.
- **FMEA and fault trees** structure the diagnosis lesson.

**Primary references:** `liu2008-isolation-forest`, `chandola2009-anomaly-survey`, `kim2022-tsad-rigorous`, `wu2021-tsad-flawed`, `granderson2023-hvac-faults` (supporting: `schmidl2022-tsad-eval`, `hundman2018-telemanom`, `ruff2020-unifying-ad`, `kalman1960-filtering`, `brunton-kutz-2022`).

---

## Module 23 — Reinforcement learning (bandits, MDPs, Q-learning, policy gradients, PPO)

**How leading courses sequence it**
- *Sutton & Barto*: bandits → finite MDPs → dynamic programming → Monte Carlo → TD → n-step → planning and learning → function approximation → policy gradients.
- *Silver (2015)*: the same spine plus exploration and games.
- *CS 185/285 (Spring 2026)*: behavioral cloning (2 lectures) → RL basics → policy gradients → actor-critic → value-based → Q-learning in practice → advanced PG (2) → variational inference → control as inference → **LLM RL** → model-based (2) → offline (2) → exploration → theory. Homeworks: imitation, PG, Q/actor-critic, LLM RL, offline RL.
- *Spinning Up*: a compact concept primer plus algorithm docs.
- *HF Deep RL*: Q-learning → DQN → policy gradients → actor-critic → PPO.
- *Practice literature*: results depend heavily on seeds and implementation details (Henderson; Engstrom; the "37 details" catalogue), and single-file references (CleanRL) are the norm.
- *For a controls engineer*: Recht's tour reframes RL around LQR and compares model-based and model-free sample efficiency. Lattimore & Szepesvári give bandits their rigor.

**Recommended lesson sequence (8 lessons)**
1. **[B] Bandits.** ε-greedy, UCB and Thompson sampling with regret curves; contextual bandits, e.g. choosing among setpoint-reset strategies.
2. **[B] MDPs and dynamic programming.** Bellman equations; value and policy iteration on a gridworld and on a discretized single-zone thermal model; discounting as an effective horizon.
3. **[B] Model-free prediction and control.** MC, TD(0), SARSA and tabular Q-learning on NumPy environments with a small Gym-style `reset/step` class, since Gymnasium doesn't import in Pyodide.
4. **[B→L] Function approximation and DQN.** Linear approximation and the deadly triad; replay buffers and target networks; a single-file DQN on CartPole locally.
5. **[B] Policy gradients.** The REINFORCE derivation, baselines and variance, actor-critic, and GAE with a λ slider showing the bias-variance trade-off. Reuses the 17.6 primer.
6. **[L] PPO done properly.** Clipped objective, value loss, entropy bonus, advantage and observation normalization, and the implementation-detail checklist. Compare your code with CleanRL/SB3 across ≥ 5 seeds with CIs.
7. **[B→L] Model-based, offline and safe RL.** Dyna and MPC with learned models (bridge to 24); distribution shift in offline RL; constraints. Case studies: DeepMind's safety-first data-center cooling, Meta's offline simulator-based cooling RL, and RL control of commercial cooling plants.
8. **[L] RL for LLMs and for buildings.** RLHF/PPO vs GRPO/RLVR, reward hacking (closing the loop with 17); optionally a building-control environment (candidate open simulators exist but weren't checked this session).

**From-scratch builds and the production comparison**
- A bandit library with regret plots.
- Value iteration, policy iteration and tabular Q-learning in NumPy with a Gym-compatible interface.
- REINFORCE and actor-critic on a 1D linear thermal plant, compared with the LQR optimum from module 24 (the "how close does model-free get?" lesson).
- Local single-file DQN and PPO with unit tests (GAE against hand-computed returns; correct handling of `terminated` vs `truncated`).
- Production comparison: Gymnasium, CleanRL, Stable-Baselines3; TRL for LLM RL.

**Mastery benchmarks**
- *Derive*:
  - The Bellman optimality equation.
  - The policy-gradient theorem via the log-derivative trick.
  - Why a baseline is unbiased.
  - GAE as exponentially weighted TD residuals.
  - The PPO clipped surrogate.
  - Tabular Q-learning convergence conditions.
- *Implement*: PPO reaching reference returns on CartPole/Pendulum within seed variance (≥ 5 seeds, 95% CIs).
- *Debug*: seeded faults (truncation treated as termination, missing advantage normalization, a sign error, no target network, unscaled rewards).
- *Explain*: on- vs off-policy; exploration; sample inefficiency; when MPC or LQR beats RL.

**Misconceptions, pitfalls and classic bugs**
1. Treating time-limit truncation as a terminal state, which cuts bootstrapping and biases the values.
2. No advantage or observation normalization, so PPO becomes unstable.
3. Single-seed comparisons that lead to false conclusions.
4. Reward shaping that changes the optimal policy, or an agent that exploits simulator flaws (reward hacking).
5. Off-by-one errors in returns or GAE around episode boundaries.
6. Misreading γ. It sets an effective horizon of about 1/(1−γ) steps.
7. Off-policy learning + function approximation + bootstrapping diverging (the deadly triad) without stabilizers.
8. Evaluating with exploration noise still switched on.
9. Ignoring the sim-to-real gap.
10. Entropy coefficient set badly, giving either a random policy or premature collapse.
11. "Use RL for any control problem." With known linear dynamics and quadratic cost, LQR/MPC is optimal and far more sample-efficient.

**Engineering bridges**
- **RL is optimal control from samples.** The Bellman equation is the discrete form of Hamilton–Jacobi–Bellman. LQR is the special case with known linear dynamics and quadratic cost, solved by the Riccati recursion.
- **A value function is a cost-to-go, and a policy is a feedback law.** Actor-critic resembles adaptive control.
- **Exploration is persistent excitation** from system identification.
- **The discount factor plays the role of an MPC horizon length.**
- **Safe RL is constraint handling** with interlocks and supervisory overrides, exactly how the DeepMind and Meta deployments were structured.

**Primary references:** `sutton-barto-2018`, `berkeley-cs285-2026`, `recht2019-tour-rl`, `schulman2017-ppo`, `huang2022-ppo-37-details` (supporting: `openai-spinning-up-2018`, `silver2015-ucl-rl`, `hf-deep-rl-course`, `lattimore2020-bandits`, `mnih2015-dqn`, `schulman2015-gae`, `henderson2017-deep-rl-matters`, `engstrom2020-implementation-matters`, `huang2021-cleanrl`, `towers2024-gymnasium`, `weng2018-policy-gradient`, `deepmind2018-dc-cooling`, `meta2024-sim-rl-cooling`, `luo2022-cooling-rl`).

---

## Module 24 — Optimization and control (LP, MPC, RL for control, physics-informed ML, digital twins)

**How leading courses sequence it**
- *EE364a/Boyd & Vandenberghe*: convex sets and functions → problem classes (LP, QP, SOCP, SDP) → duality → applications → algorithms, practised in CVXPY.
- *Rawlings/Mayne/Diehl*: starts from linear-quadratic regulation and builds to constrained MPC, stability theory, state estimation (moving-horizon estimation) and numerical optimal control.
- *Brunton & Kutz*: SVD/POD/DMD → ML → dynamics and control (SINDy, Koopman, data-driven control, MPC) → reduced-order models. Close to an ideal "ML for engineers" arc.
- *Recht*: frames RL against LQR baselines.
- *Physics-informed ML*: PINNs (Raissi), a review (Karniadakis), failure modes (Krishnapriyan), and hybrid and continuous models (neural ODEs, universal differential equations), with operator learning (FNO) as the frontier.
- *Data-center cooling cases*:
  - DeepMind 2018: learned predictive models plus constrained optimization every 5 minutes, verified by local control.
  - Lazic et al.: MPC with a learned linear model.
  - Luo et al.: RL control of commercial cooling.
  - Meta 2024: offline simulator-based RL with reported fan-energy and water savings.

**Recommended lesson sequence (8 lessons; almost all browser-capable)**
1. **[B] Linear programming.** Formulate chiller-plant dispatch or load shifting under time-of-use prices with thermal storage. Simplex geometry; duality and shadow prices; SciPy `linprog` with HiGHS.
2. **[B] Convex optimization with CVXPY** (cvxpy-base with Clarabel ran in Pyodide). QPs, regularized regression as optimization, DCP rules, infeasibility and unboundedness diagnosis.
3. **[B] System identification.** ARX and grey-box RC thermal models; SINDy (pysindy ran in Pyodide); DMD.
4. **[B] Optimal control.** LQR via the discrete Riccati equation (python-control ran in Pyodide); PID vs LQR on a thermal zone; Kalman filter + LQR (LQG).
5. **[B] Model predictive control.** A receding-horizon QP in CVXPY with comfort bands, equipment and ramp limits; economic MPC driven by a price signal and a load forecast from module 21; nonlinear MPC in CasADi (SQP with its built-in QP solver in the browser; IPOPT locally).
6. **[B→L] RL for control vs MPC.** On the same thermal environment, compare LQR/MPC with PPO (local) on cost, constraint violations, robustness and data needs, then revisit the DeepMind and Meta cases.
7. **[L] Physics-informed ML.** A PINN for the 1D heat equation in PyTorch with a residual + boundary loss, loss weighting and failure modes; a neural-ODE/UDE grey-box thermal model; FNO overview.
8. **[L] Digital-twin capstone.** A calibrated data-hall cooling twin (RC model + learned residual), EKF state estimation, supervisory MPC with a safety layer and fallback, evaluation against baseline control, and monitoring for model-plant mismatch.

**From-scratch builds and the production comparison**
- Tableau simplex (small problems) or a basic interior-point method, compared with HiGHS.
- Finite-horizon LQR by backward Riccati recursion, compared with python-control.
- A condensed MPC QP built by hand (prediction matrices), solved with your own projected-gradient or ADMM routine, compared with CVXPY/Clarabel.
- A PINN loss for the heat equation using the module-12 engine (browser, tiny) or PyTorch (local).
- An EKF for a nonlinear thermal model.
- Production comparison: SciPy/HiGHS, CVXPY, CasADi (+IPOPT locally), python-control, PyTorch.

**Mastery benchmarks**
- *Derive*:
  - LP duality and complementary slackness; KKT conditions.
  - LQR via dynamic programming → Riccati.
  - MPC as a QP in condensed form, and the role of terminal cost and constraints in stability.
  - The PINN residual for a PDE.
  - The Kalman gain.
- *Implement*: an MPC that respects constraints under disturbance and forecast error and beats a rule-based controller on simulated energy by a stated margin; a PINN within tolerance of the analytical heat-equation solution.
- *Debug*: infeasible MPC (add slack variables); badly scaled problems; PINN loss imbalance; sim-to-real mismatch.
- *Explain*: when to use MPC, RL or PID; why forecast quality matters; how safety layers were designed in real data-center deployments.

**Misconceptions, pitfalls and classic bugs**
1. "MPC is optimal, so it's robust." Model mismatch and disturbances need feedback (re-planning every step) and state estimation.
2. Hard constraints plus measurement noise make the problem infeasible. Soften them with penalized slack.
3. Unscaled variables (kW, °C and $ in one problem) cause solver failures. Nondimensionalize.
4. Writing non-convex expressions in CVXPY and misreading the DCP error message.
5. "PINNs replace classical solvers." They're often slower and less accurate, sensitive to loss weighting, and fail on convection-dominated regimes.
6. Trusting a learned model outside its training envelope inside a control loop.
7. Ignoring actuator dynamics, rate limits and transport delays (chilled-water loop lag), which causes oscillation.
8. LP solutions that jump between vertices (bang-bang chatter) without ramp constraints or regularization.
9. "RL always beats MPC." Not with known dynamics and little data.
10. "A digital twin is a 3D visualization." It's a calibrated, continually updated model used to make decisions.
11. A mismatch between the discretization step and the control interval.

**Engineering bridges** (this module is home ground)
- **MPC is receding-horizon optimal control.** LQR/Riccati, Kalman filtering and LQG carry over directly.
- **PINNs are collocation methods that minimize PDE residuals.** Contrast them with the weak forms in FEM/FVM.
- **SINDy is first-principles modeling done by sparse regression.**
- **RC thermal networks are grey-box twins.**
- **Nondimensionalization fixes solver conditioning.**

**Primary references:** `rawlings2017-mpc`, `boyd2004-convex-optimization`, `brunton-kutz-2022`, `recht2019-tour-rl`, `lazic2018-dc-mpc` (supporting: `boyd-ee364a-2026`, `diamond2016-cvxpy`, `andersson2018-casadi`, `raissi2019-pinns`, `karniadakis2021-piml`, `krishnapriyan2021-pinn-failures`, `brunton2016-sindy`, `chen2018-neural-ode`, `rackauckas2020-ude`, `li2020-fno`, `kalman1960-filtering`, `deepmind2018-dc-cooling`, `meta2024-sim-rl-cooling`, `luo2022-cooling-rl`).

---

## Module 27 — ML system design (data, features, training, serving, monitoring, drift, retraining)

**How leading courses sequence it**
- *Huyen's DMLS / CS329S*: why production ML differs from research → requirements and framing → data engineering → training data (sampling, labeling, imbalance, augmentation) → feature engineering → model development and offline evaluation → deployment and prediction services (batch vs online) → distribution shift and monitoring → continual learning and testing in production → infrastructure → the human side.
- *Zinkevich's Rules of ML*: launch heuristics and metrics before ML, keep the first pipeline simple, then iterate on features and watch for skew.
- *Sculley et al.*: name the debt (entanglement, correction cascades, undeclared consumers, unstable data dependencies, feedback loops, glue code, pipeline jungles, configuration debt, a changing external world).
- *Breck et al.*: a scored rubric of tests for data, model development, infrastructure and monitoring.
- *Paleyes et al.* and *Shankar et al.*: survey real deployment pain (velocity, validation, versioning).
- *Rabanser et al.*: benchmark drift detectors.

**Recommended lesson sequence (7 lessons)**
1. **[B] Framing.** Business objective → ML task → offline metrics, online metrics and guardrails; when not to use ML. Worked comparison: an ML system for chiller-plant optimization vs one for load forecasting vs one for fault detection.
2. **[B] Data and labels.** Sources and sampling; label quality and delay; imbalance; leakage audits; data contracts and validation (schemas, ranges, **units**).
3. **[B] Features and training pipelines.** Point-in-time correctness (DuckDB as-of joins run in Pyodide), offline/online skew, reproducibility, batch vs streaming features.
4. **[B] Serving patterns.** Batch, online and edge (on-prem BMS gateways); latency budgets; heuristic fallbacks; shadow mode, canaries, champion/challenger; system-design interview drills.
5. **[B] Monitoring and drift.** Data drift vs concept drift vs label shift; detectors (PSI, KS, MMD with permutation tests, classifier two-sample tests); performance monitoring when labels arrive late; alert design.
6. **[B→L] Retraining and continual learning.** Triggers (schedule, drift or performance); backtests before promotion; feedback-loop hazards; a self-assessment with the ML Test Score.
7. **[B] Design reviews and technical debt.** Apply Sculley's categories to a reference architecture; write a design doc; mock interview ("design an ML system that cuts cooling energy in a data hall without violating thermal limits").

**From-scratch builds and the production comparison**
- A drift-detection library (PSI, KS, MMD, classifier two-sample test) benchmarked on synthetic shifts of known size, following the "failing loudly" methodology.
- A point-in-time join utility, with tests proving no future leakage.
- An ML Test Score checker for the learner's own capstones.
- Production comparison: cloud-native monitoring (SageMaker AI and Azure ML monitoring features) and open-source monitoring and feature-store tools. The learner should evaluate those tools; none were checked this session.

**Mastery benchmarks**
- *Derive*: PSI/KS/MMD statistics with permutation-test thresholds; estimating performance under label delay; choosing an alert threshold from costs.
- *Implement*: a design doc plus a prototype with monitoring and a retraining policy for one capstone, scoring at least "reasonably tested" on the ML Test Score rubric.
- *Debug*: a training/serving skew case, a feedback-loop case, and a silent unit change (°F to °C after a BMS firmware update).
- *Explain*: batch vs online trade-offs; Sculley's debt categories; which Rules of ML apply to a given scenario, and why.

**Misconceptions, pitfalls and classic bugs**
1. "Offline gains equal online gains."
2. Training/serving skew from two separate feature-code paths.
3. Point-in-time leakage in joins (using values revised after the prediction time).
4. "A drift alarm means performance dropped," and its mirror, "no drift alarm means we're fine" (concept drift can occur with stable inputs).
5. "Scheduled retraining fixes everything." It can amplify feedback loops.
6. Silent schema, unit or point-mapping changes from sensor or BMS updates.
7. No fallback when the model is unavailable or out of distribution. In physical systems that is a safety issue.
8. Optimizing a gameable proxy (e.g., PUE alone) while total energy rises.
9. "We'll add monitoring later."
10. A controller that shapes the data used to retrain its own model (closed-loop identification bias).

**Engineering bridges**
- **Systems engineering**: the V-model, requirements traceability and FMEA map directly onto ML design docs and failure analysis.
- **Closed-loop identification bias** is the control-theory name for ML feedback loops.
- **Commissioning and retro-commissioning** parallel validation and retraining.
- **Sensor calibration drift** is a physical analogue of data drift.

**AI-native practice in 2026 for this module (with sources)**
- **Write the acceptance tests first.** Apply eval-driven development to classical ML too: before building, define the backtest windows, slice metrics, guardrail metrics and promotion criteria, and store them as code (`anthropic2026-demystifying-evals`).
- **Use LLMs to draft, rubrics to verify.** An assistant can draft design docs, data contracts and threat models quickly, but the ML Test Score rubric and debt categories are the review checklist (`breck2017-ml-test-score`, `sculley2015-hidden-debt`).
- **Treat agent-proposed experiments with suspicion until they're measured.** Agentic research loops (`karpathy-autoresearch`) and agent benchmarks for ML engineering (`chan2024-mlebench`, `wijk2024-rebench`) show both what agents can do and the core failure mode: overfitting to whatever metric the loop sees. Keep a sealed test set and a human-owned promotion gate.
- **Error analysis applies beyond LLMs.** Husain & Shankar's trace-review and coding workflow transfers to monitoring incidents: sample the alerts, categorize root causes, fix the biggest bucket (`husain-shankar-2026-evals-faq`, `husain2025-field-guide`).

**Primary references:** `huyen2022-dmls`, `sculley2015-hidden-debt`, `breck2017-ml-test-score`, `zinkevich-rules-of-ml`, `rabanser2018-failing-loudly` (supporting: `stanford-cs329s-2022`, `paleyes2022-deploying-ml`, `shankar2022-operationalizing-ml`, `koh2020-wilds`, `deepmind2018-dc-cooling`).

---

## Module 28 — MLOps (experiment tracking, data versioning, Docker, CI/CD, model serving, monitoring, AWS and Azure ML)

**How leading courses sequence it**
- *Made With ML*: design (setup, product, systems) → data (preparation, exploration, preprocessing, distributed) → model (training, tracking, tuning, evaluation, serving) → develop (scripting, CLI) → utilities (logging, docs, styling, pre-commit) → **test (code, data, models)** → reproducibility (versioning) → production (jobs and services, CI/CD workflows, monitoring, data engineering).
- *Google's MLOps guide*: maturity level 0 (manual), level 1 (automated pipelines with continuous training), level 2 (CI/CD of the pipelines themselves).
- *Kreuzberger et al.*: principles, components and roles.
- *Tool docs*:
  - MLflow now has two halves: classic ML tracking and registry, and LLM/agent tracing and evaluation.
  - DVC covers data versioning, pipelines and experiments.
  - AWS has renamed SageMaker to "SageMaker AI".
  - Azure ML's docs are on SDK v2.
- *FSDL (2022)*: still useful for troubleshooting and team structure, but dated.

**Recommended lesson sequence (8 lessons; essentially all local)**
1. **[L] A reproducible project skeleton.** uv/pyproject with lockfiles, seeds, config files, a task runner, pre-commit, ruff, type hints.
2. **[L] Experiment tracking with MLflow.** Parameters, metrics and artifacts; run comparison; model registry with aliases.
3. **[L] Data and pipeline versioning with DVC.** Pipeline stages, a remote, and "reproduce this result from a commit hash".
4. **[L] Testing ML systems.** Unit tests for transforms; data-validation tests; behavioural model tests (invariance, directional expectations); training smoke tests (overfit a tiny batch); the CS336-style adapter pattern.
5. **[L] Packaging and serving.** A FastAPI model service, a Docker image (slim, pinned), health checks, batch vs online endpoints, load testing.
6. **[L] CI/CD for ML.** GitHub Actions running tests, data checks, a tiny training run and **evaluation gates** (block promotion if the challenger loses to the champion), plus image builds and scheduled continuous training.
7. **[L/cloud] Managed platforms.** Deploy the forecasting capstone on one platform and map it to the other: SageMaker AI (training jobs, endpoints, pipelines, monitoring) vs Azure ML (workspaces, jobs, managed online endpoints, MLflow integration). Cover IAM basics and cost control.
8. **[L] Production monitoring and incidents.** Metrics, logs and traces; drift dashboards; alert runbooks; blameless postmortems; trace-based observability for the module-19 LLM app.

**From-scratch builds and the production comparison**
- A minimal experiment tracker (SQLite + JSON artifacts) to learn what a tracker must store, then migrate to MLflow.
- A minimal model registry with promotion gates and lineage (data hash, code commit, config).
- A FastAPI + Docker service with a load-test report.
- Production comparison: MLflow, DVC, Docker, GitHub Actions, SageMaker AI, Azure ML.

**Mastery benchmarks**
- *Implement*: a repository where one command reproduces the data snapshot, model, metrics and container; CI passes with evaluation gates; a rollback drill works.
- *Debug*: CI failures caused by nondeterminism; Docker image bloat; dependency drift; a data-version mismatch between training and serving.
- *Explain*: maturity levels 0/1/2; CI vs CD vs CT; when a managed platform is worth its lock-in.

**Misconceptions, pitfalls and classic bugs**
1. "Docker makes it reproducible." Not with unpinned dependencies, nondeterministic training or unversioned data.
2. Tracked metrics with no link to data and code versions.
3. Tests for code but none for data or model behaviour.
4. Notebook-only workflows with hidden out-of-order state.
5. CI that trains full models on every push, instead of smoke tests plus scheduled training.
6. Secrets in code or images; IAM roles that are far too broad.
7. A model registry without lineage, so rollback is guesswork.
8. Always-on endpoints for batch workloads (cost).
9. Platform choices made with no exit plan.
10. Monitoring only infrastructure (CPU, latency) and not model quality.

**Engineering bridges**
- **Drawing revision control and document control** are the engineering analogue of data and model versioning.
- **Quality systems and calibration certificates** correspond to lineage and model cards.
- **Commissioning checklists** correspond to CI gates.
- **CMMS-style maintenance** corresponds to monitoring, alerting and runbooks.

**AI-native practice in 2026 for this module (with sources)**
- **Coding agents are part of the build loop, with humans owning review and gates.** Agents can scaffold pipelines, write tests and CI config, and fix failures. The skills to teach are giving them precise repository context, keeping them sandboxed with least privilege (`anthropic2025-claude-code-sandboxing`), and structuring long tasks so progress survives across sessions (`anthropic2025-long-running-harnesses`).
- **Evaluation gates cover LLM components as well as models.** Automated evals run in CI on every change and model upgrade as the first line of defence, backed by production monitoring and periodic human review (`anthropic2026-demystifying-evals`).
- **Tracing is first-class.** The same platform tracks training runs and traces LLM/agent calls (`mlflow-docs`).
- **Agent-run experiment loops need MLOps discipline**: fixed compute budgets, logged diffs, keep/discard by metric, a sealed test set (`karpathy-autoresearch`).
- **Disclosure and provenance.** Record which artifacts were AI-generated, as projects like nanochat now require of contributors (`karpathy-nanochat`).
- **Benchmarks for realistic expectations.** Agent results on ML-engineering and AI-R&D tasks help the learner calibrate where agents are strong (well-specified, test-graded tasks) and weak (open-ended judgment) (`chan2024-mlebench`, `wijk2024-rebench`, `jimenez2023-swebench`).

**Primary references:** `made-with-ml`, `google-mlops-cd`, `kreuzberger2023-mlops`, `mlflow-docs`, `aws-sagemaker-ai-docs` (supporting: `azure-ml-docs`, `dvc-docs`, `breck2017-ml-test-score`, `fsdl-the-full-stack`, `shankar2022-operationalizing-ml`).

---

## Module 29 — Scaling (distributed training concepts, efficient data loading, profiling)

**How leading courses sequence it**
- *Ultra-Scale Playbook*: start on one GPU (memory anatomy of weights, gradients, optimizer state and activations; recomputation; gradient accumulation; profiling) → data parallelism (overlapping communication, bucketing) → ZeRO stages → tensor → sequence/context → pipeline → expert parallelism → combining them → kernels, fused ops, FlashAttention, mixed precision.
- *CS336*: GPUs/TPUs, kernels and Triton, two lectures on parallelism. A2: profiling, a Triton FlashAttention2, DDP and optimizer-state sharding.
- *"How to Scale Your Model"*: rooflines first, then hardware, sharded matmuls, transformer arithmetic, training and inference parallelism.
- *Horace He*: classify every slowdown as compute-, bandwidth- or overhead-bound.
- *Bekman's open book*: operations (hardware, networking, storage, debugging, fault tolerance).
- *CMU dlsys and CS231n 2026*: each has hardware-acceleration or distributed-training lectures.

**Recommended lesson sequence (6 lessons)**
1. **[B] Performance first principles.** Compute vs bandwidth vs overhead regimes; rooflines; an arithmetic-intensity calculator loaded with real accelerator specs.
2. **[L] Profiling.** The PyTorch profiler and memory snapshots on MPS/CUDA; finding data-loader stalls and host-device syncs; measuring `torch.compile` gains.
3. **[L] Efficient data loading.** Columnar and sharded formats (Parquet/Arrow, tar shards, memory-mapped token arrays), prefetching, workers, pinned memory; a throughput benchmark tying back to 14.3.
4. **[B] Memory anatomy and the parallelism zoo.** A memory calculator (parameters, gradients, Adam state, activations; recomputation; ZeRO-1/2/3), a ring all-reduce cost model, and DP/TP/PP/CP/EP diagrams with interactive bubble and communication estimates.
5. **[G] Distributed training hands-on.** DDP on 2–8 rented GPUs (or a gloo multi-process CPU emulation locally), FSDP, a gradient-accumulation equivalence test, measured scaling efficiency.
6. **[G] Reliability and cost at scale.** Checkpoint strategy, fault tolerance, determinism, loss-spike triage; GPU-hours → kWh → cost and CO₂, connected to data-center capacity planning and cooling load.

**From-scratch builds and the production comparison**
- A ring all-reduce simulator (NumPy) with a latency/bandwidth model.
- A gradient-accumulation vs large-batch equivalence test, plus a DDP-equivalence check in single-process emulation.
- A memory estimator validated against peak allocated memory measured on a real run.
- Production comparison: `torch.distributed` (DDP/FSDP), DeepSpeed ZeRO, Megatron-style tensor parallelism, nanochat's distributed scripts.

**Mastery benchmarks**
- *Derive*:
  - Per-GPU memory under ZeRO stages.
  - Ring all-reduce time ≈ 2(N−1)/N · S/B (plus latency terms).
  - MFU.
  - The pipeline bubble fraction (p−1)/(m+p−1).
  - How activation memory scales with sequence length and batch.
- *Implement*: a ≥ 2× profiler-guided speed-up of a deliberately slow training script; DDP with documented scaling efficiency.
- *Debug*: hangs from mismatched collectives; rank-dependent randomness; activation out-of-memory errors; input-pipeline bottlenecks.
- *Explain*: choose a parallelism plan for a given model size and cluster topology, and defend it with numbers.

**Misconceptions, pitfalls and classic bugs**
1. "More GPUs give linear speed-up." Communication and overhead say otherwise (Amdahl).
2. "A bigger batch is always better." Generalization, critical batch size and LR scaling limits all intervene.
3. "nvidia-smi at 100% means efficient." MFU and achieved bandwidth are what count.
4. Fixing out-of-memory errors by shrinking the model before trying recomputation, accumulation, sharding or lower precision.
5. "Data loading is never the bottleneck."
6. Profiling without synchronization, or timing the first (compile or warmup) iterations.
7. Assuming gradient accumulation is identical to a larger batch. It isn't with BatchNorm, or with naive loss normalization.
8. Seed confusion across ranks (identical dropout masks, or divergent initializations).
9. Checkpointing sharded state from rank 0 only.
10. Ignoring network topology (NVLink vs Ethernet/InfiniBand).

**Engineering bridges**
- **Rooflines and Amdahl's law** are bottleneck analysis, like pump and fan curves against system curves.
- **Communication behaves like flow capacity and head loss in pipe networks.** Pipeline bubbles are an assembly-line balancing problem.
- **Energy and heat**: GPU power becomes heat rejection, which becomes cooling-plant load. Here the learner's HVAC expertise is directly valuable (liquid cooling, PUE, capacity planning).

**Primary references:** `tazi2025-ultrascale-playbook`, `austin2025-scaling-book`, `he2022-brrr`, `rajbhandari2019-zero`, `bekman-ml-engineering` (supporting: `stanford-cs336-2026`, `shoeybi2019-megatron`, `zhao2023-fsdp`, `pytorch-profiler-recipe`, `goyal2017-large-minibatch`, `cmu-dlsys-2026`).

---

## Module 30 — Responsible AI (fairness, robustness, failure modes)

**How leading courses sequence it**
- *fairmlbook*: when automated decisions are legitimate → classification criteria (independence, separation, sufficiency) and their incompatibilities → relative notions of fairness → causality → practice.
- *CS231n 2026*: ends with a human-centered AI lecture.
- *CS224n 2026*: has a social and broader impacts (risks) lecture plus interpretability; SLP3 adds an interpretability chapter.
- *Governance and documentation*: NIST's AI RMF (govern, map, measure, manage), model cards, datasheets.
- *Robustness literature*: adversarial examples (FGSM), real distribution shift (WILDS), shortcut learning, calibration (temperature scaling), distribution-free uncertainty (conformal prediction), reward hacking (Weng) for RL and LLMs.

**Recommended lesson sequence (6 lessons)**
1. **[B] A failure-mode taxonomy for infrastructure ML.** Distribution shift, shortcut learning, spurious correlation, feedback loops, automation bias, specification gaming. Case studies from cooling control and forecasting.
2. **[B] Fairness formalisms.** Independence, separation and sufficiency; the impossibility results; group metrics. Energy-domain stakes: demand-response targeting, outage-restoration prioritization, tariff and program design. Computed on synthetic data.
3. **[B] Robustness and uncertainty.** Reliability diagrams and temperature scaling; split conformal prediction; OOD detection; an FGSM demo on a small NumPy classifier, plus sensor spoofing and data-poisoning analogues.
4. **[B] Evaluating under shift.** WILDS-style splits by site, building or season; worst-group metrics; leave-one-building-out evaluation.
5. **[B→L] Documentation and governance.** A model card, a datasheet and a NIST AI RMF mapping for one capstone; incident reporting; designing human oversight for control systems.
6. **[L] Red-teaming the module-19 LLM app.** Prompt injection, data exfiltration through tools, unsafe physical actions; safety eval suites.

**From-scratch builds and the production comparison**
- A fairness-metric calculator with equalized-odds threshold post-processing.
- Temperature scaling and split conformal, each with a coverage or calibration test.
- FGSM on a small classifier.
- A shift-split evaluator.
- Production comparison: scikit-learn calibration utilities, plus open-source fairness and conformal libraries the learner can evaluate (not checked this session).

**Mastery benchmarks**
- *Derive*: the incompatibility of calibration with equal error rates under different base rates; the split-conformal coverage guarantee and its exchangeability assumption; the temperature-scaling objective; FGSM's linearization argument.
- *Implement*: a model card + RMF mapping + robustness report (worst-group, shift and calibration metrics) for one capstone.
- *Debug*: a high-accuracy but miscalibrated model; a leakage-driven shortcut; a fairness metric computed on the wrong subgroup.
- *Explain*: when ML should not sit in a control loop; what meaningful human oversight looks like.

**Misconceptions, pitfalls and classic bugs**
1. "Dropping the sensitive attribute makes a model fair." Proxies remain.
2. "High accuracy means calibrated." Modern networks are often overconfident.
3. "One fairness metric can be satisfied along with all the others." The impossibility results say no.
4. "IID test accuracy predicts deployment accuracy." WILDS-style gaps say no.
5. "Adversarial robustness only matters for images." Sensors can be spoofed and data poisoned.
6. Responsible AI treated as a final checklist rather than a property of the whole lifecycle.
7. "Conformal intervals hold under any shift." They need exchangeability.
8. Saliency maps or attention weights treated as causal explanations.
9. "Human-in-the-loop guarantees safety." Automation bias undermines it.
10. "The reward function captures intent." Reward hacking shows otherwise.

**Engineering bridges**
- **Safety engineering practice**: HAZOP, FMEA, LOPA and SIL, fail-safe defaults, the Swiss-cheese model.
- **Codes and standards culture** (ASHRAE, ASME) parallels AI governance frameworks.
- **Instrument calibration** parallels probabilistic calibration.
- **The professional engineer's duty to public safety** is the ethical anchor.

**Primary references:** `barocas-hardt-narayanan-2023`, `nist2023-ai-rmf`, `koh2020-wilds`, `guo2017-calibration`, `mitchell2019-model-cards` (supporting: `angelopoulos2021-conformal`, `geirhos2020-shortcut`, `goodfellow2014-adversarial`, `gebru2021-datasheets`, `weng2024-reward-hacking`, `rabanser2018-failing-loudly`).

---

## Appendix A — Cross-module capstones that reuse the runtime split

| Capstone | Modules | Browser part | Local / GPU part |
|---|---|---|---|
| Day-ahead cooling-load forecast with calibrated intervals | 21, 27, 30 | Decomposition, ETS, LightGBM, conformal | neuralforecast/foundation models, MLflow/DVC, deployment |
| AFDD for a chilled-water plant | 22, 27 | Rules, SPC, PCA, Isolation Forest, event-level evaluation | PyOD and deep detectors, streaming service |
| Supervisory MPC with a learned thermal model ("mini digital twin") | 21, 24, 23, 30 | SINDy/RC identification, CVXPY MPC, Kalman filter | PPO comparison, PINN residual model, safety analysis |
| GPT from primitives to served model | 12, 14, 16, 17, 18, 29 | Engine, micro-transformer, tokenizer, KV-cache math | TinyStories training, LoRA/DPO, quantized serving, profiling |
| Telemetry assistant over building data | 19, 28, 30 | Mock-model agent loop, vector search, eval statistics | MCP server, live LLM, CI eval gates, red-teaming |

## Appendix B — Open items and checks not done this session

- Not checked (mentioned only as candidates): Sinergym/BOPTEST building-control environments, do-mpc/acados, Feast, Evidently/alibi-detect, fairlearn, MAPIE, DeepXDE, torchtitan, the HF Agents course, and the specific eval frameworks named in Anthropic's appendix.
- Years that weren't confirmed on the page (records marked `verified:false`): Zero to Hero, d2l, HF Deep RL course, FPP3 edition year, Made With ML version, Rules of ML, Google MLOps guide, Rawlings MPC 2nd ed.
- The CS336 2026 site links assignment repos whose READMEs still say "Spring 2025". Re-check before copying task structure.
- The in-browser throughput numbers come from a background tab, which may be throttled. Re-measure in a foreground tab of the actual app before fixing model-size limits. Also check whether a WebGPU path is wanted for inference-only demos (out of scope here).
- tiktoken loads in Pyodide but its vocabulary download failed. The app should bundle and serve the BPE files.
