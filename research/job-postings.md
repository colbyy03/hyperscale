# Job-posting analysis: ML for data center, energy, sustainability and infrastructure efficiency

Accessed 2026-11-12. Companies: Amazon/AWS, Microsoft, Google, Meta. Raw data: `job-postings.json` (36 postings); source records: `sources-jobs.json`.

## Method

- Amazon: amazon.jobs `search.json` endpoint (about 20 query terms x 2 pages, about 2,300 unique postings pulled), then filtered on title (scientist / ML / data scientist / SDE) and scored on domain keywords (data center, energy, cooling, carbon, sustainability, capacity, fleet, forecasting) in descriptions and qualifications.
- Microsoft: apply.careers.microsoft.com (Eightfold) JSON search and position-detail endpoints (about 20 queries; 337 unique postings pulled), filtered by title and keyword score.
- Google: Google Careers results pages for about 30 queries, about 430 unique postings listed, then detail pages read for about 20 shortlisted roles.
- Meta: metacareers.com search for 9 queries (about 60 unique postings listed), detail pages read for the shortlisted ones.
- Skill tags were first assigned by regex on posting text and then hand-curated per posting (regexes over-tag boilerplate). Percentages below are therefore approximate (a tag means the skill is named or clearly implied in the posting).
- Qualifications and responsibilities are paraphrased. Google posting dates and some locations were not exposed on the pages read (shown as null / not captured).

### Honest limitations

- Target was 40 postings; **36** were collected (30 tier A/B + 6 tier C). True tier-A roles (ML engineer or scientist primarily on data center power/cooling/energy) are rare on the four public careers sites right now: most data center and energy openings at these companies are facilities, controls, energy-procurement or program-management roles, not ML roles. I did not pad the set with those.
- Google yielded no genuine ML-for-cooling or ML-for-energy posting; its tier A/B entries are capacity-planning optimization, fleet analytics and ML-infrastructure roles. A Data Center Controls Engineer posting (BMS/SCADA, not ML) and a Data Center Power Optimization Engineer posting (electrical design) were seen and excluded.
- Meta's two Infrastructure Modeling and Reliability scientist postings (power demand, peak risk, uncertainty) are the best direct domain match found anywhere; both are 10+ years seniority.
- Microsoft energy roles seen (Energy Resource Manager, Senior Energy Markets Program Manager) are non-ML and excluded.

## Counts

| Company | Tier A | Tier B | Tier C | Total |
|---|---|---|---|---|
| Amazon | 4 | 4 | 2 | 10 |
| Microsoft | 1 | 7 | 1 | 9 |
| Google | 1 | 6 | 2 | 9 |
| Meta | 3 | 4 | 1 | 8 |
| **All** | 9 | 21 | 6 | 36 |

## Skill frequency

Counts are over all 36 postings; 'A' columns are over the 9 tier-A postings (small sample, treat as indicative); 'A+B' over 30.

| Skill | All n | All % | A n | A % | A+B % |
|---|---|---|---|---|---|
| python | 27 | 75% | 6 | 67% | 70% |
| stakeholder-communication | 25 | 69% | 9 | 100% | 77% |
| mlops-deployment | 24 | 67% | 5 | 56% | 63% |
| yoe-5plus | 19 | 53% | 7 | 78% | 63% |
| ml-system-design | 19 | 53% | 3 | 33% | 50% |
| statistics | 18 | 50% | 7 | 78% | 50% |
| distributed-systems | 18 | 50% | 2 | 22% | 50% |
| optimization-lp-mip | 17 | 47% | 5 | 56% | 57% |
| llm-genai | 15 | 42% | 3 | 33% | 40% |
| cpp | 15 | 42% | 2 | 22% | 33% |
| masters-required | 14 | 39% | 3 | 33% | 37% |
| time-series-forecasting | 12 | 33% | 5 | 56% | 40% |
| yoe-3-5 | 10 | 28% | 2 | 22% | 33% |
| sql | 10 | 28% | 2 | 22% | 27% |
| java | 10 | 28% | 1 | 11% | 20% |
| bayesian-uncertainty | 9 | 25% | 4 | 44% | 30% |
| data-pipelines-etl | 9 | 25% | 0 | 0% | 27% |
| r | 8 | 22% | 3 | 33% | 23% |
| dashboards-visualization | 8 | 22% | 3 | 33% | 23% |
| rag-agents | 8 | 22% | 3 | 33% | 23% |
| operations-research | 8 | 22% | 2 | 22% | 27% |
| simulation-digital-twin | 8 | 22% | 2 | 22% | 27% |
| phd-preferred | 8 | 22% | 1 | 11% | 20% |
| scala | 7 | 19% | 1 | 11% | 17% |
| yoe-0-2 | 6 | 17% | 0 | 0% | 3% |
| model-monitoring | 6 | 17% | 0 | 0% | 17% |
| deep-learning | 6 | 17% | 0 | 0% | 13% |
| anomaly-detection | 5 | 14% | 2 | 22% | 17% |
| cloud-aws | 4 | 11% | 1 | 11% | 13% |
| power-systems-electrical | 4 | 11% | 4 | 44% | 13% |
| pytorch | 4 | 11% | 1 | 11% | 7% |
| tensorflow | 4 | 11% | 1 | 11% | 7% |
| cloud-azure | 4 | 11% | 1 | 11% | 13% |
| causal-inference | 3 | 8% | 1 | 11% | 10% |
| cloud-gcp | 3 | 8% | 0 | 0% | 10% |
| physics-based-modeling | 2 | 6% | 1 | 11% | 7% |
| energy-markets | 2 | 6% | 2 | 22% | 7% |
| nlp | 2 | 6% | 1 | 11% | 3% |
| big-data | 2 | 6% | 0 | 0% | 3% |
| experimentation-ab-testing | 2 | 6% | 1 | 11% | 7% |
| azure-ml | 2 | 6% | 1 | 11% | 7% |
| kubernetes-docker | 2 | 6% | 0 | 0% | 7% |
| masters-preferred | 2 | 6% | 0 | 0% | 7% |
| jax | 2 | 6% | 0 | 0% | 3% |
| computer-vision | 1 | 3% | 1 | 11% | 3% |
| thermodynamics-hvac | 1 | 3% | 1 | 11% | 3% |
| scikit-learn | 1 | 3% | 1 | 11% | 3% |
| spark | 1 | 3% | 0 | 0% | 0% |
| ci-cd | 1 | 3% | 0 | 0% | 3% |
| reinforcement-learning | 1 | 3% | 0 | 0% | 0% |

## Top 15 skills (all postings, excluding degree/experience tags)

1. python: 27/36 (75%); tier A 6/9
2. mlops-deployment: 24/36 (67%); tier A 5/9
3. ml-system-design: 19/36 (53%); tier A 3/9
4. statistics: 18/36 (50%); tier A 7/9
5. distributed-systems: 18/36 (50%); tier A 2/9
6. optimization-lp-mip: 17/36 (47%); tier A 5/9
7. llm-genai: 15/36 (42%); tier A 3/9
8. cpp: 15/36 (42%); tier A 2/9
9. time-series-forecasting: 12/36 (33%); tier A 5/9
10. sql: 10/36 (28%); tier A 2/9
11. java: 10/36 (28%); tier A 1/9
12. bayesian-uncertainty: 9/36 (25%); tier A 4/9
13. data-pipelines-etl: 9/36 (25%); tier A 0/9
14. r: 8/36 (22%); tier A 3/9
15. dashboards-visualization: 8/36 (22%); tier A 3/9

(stakeholder-communication appears in 69% of postings and is the single most common tag overall.)

## Cloud ML services named

Very few postings name a specific managed ML service. Counts: sagemaker 0, bedrock 0, azure-ml 2, vertex-ai 0.
- Azure AI Foundry / Azure ML terms appear in 2 Microsoft data-science postings (Azure ML / AI Foundry-type tooling, matched by keyword; weak evidence). Vertex AI appears in 0 of the Google postings I curated (raw regex hits were boilerplate and were removed). SageMaker and Bedrock were not named in any Amazon posting in this set; Amazon postings say 'AWS' (4 postings) and QuickSight/Redshift-type tools.
- Cloud tags: cloud-aws 4, cloud-azure 4, cloud-gcp 3. Implication: learn the concepts (managed training, endpoints, pipelines, monitoring) on one cloud; the specific service names are unlikely to gate a screen.

## Degree and experience patterns

- Non-entry (tier A/B, n=30): Master's mentioned as a qualifying path in 11; PhD preferred or required in 6; 5+ years in 19; 3-5 years in 10.
- Every tier A/B posting found is mid-career or senior (roughly 3 to 10+ years; titles Senior, Staff, Principal). None targets a new grad. Domain-specific science roles at Amazon, Meta and Microsoft typically accept Master's plus 3-4 years in place of a PhD.
- Amazon Applied Scientist ladders: PhD, or Master's plus about 4 years; Data Scientist roles: Master's/Bachelor's plus 2-5 years of data science.
- Meta's infrastructure science roles cite 6-10+ years of operations research or quantitative modeling and an MS as the floor.

## Early-career postings (tier C)

- Amazon Data Scientist I: 1+ year SQL/Python/R, about 2 years quant experience on large data; Applied Scientist I: Master's, Python/Java/C++, SQL, recommendation-style modeling and ML deployment with engineers. Both prefer a PhD or publications.
- Microsoft Applied Scientist II: bachelor's plus 2 years or Master's plus 1 year; prefers 2 years coding in Python/C++, deep learning product work, PyTorch/TensorFlow-type frameworks.
- Google 'PhD, Early Career' software engineer roles: PhD required, with ML-infrastructure or RL experience; non-PhD new-grad roles on ML were not visible in results.
- Meta entry software engineer (systems ML): bachelor's in progress, accelerator exposure preferred.
- Takeaway: entry roles want Python + SQL, statistics, one deep learning framework, evidence of shipping a model (deploy, evaluate), and communication. A Master's is the realistic floor for scientist titles at Amazon; Google's early-career ML track is PhD-gated.

## Implications for curriculum ordering

**Must be solid by spring 2027 (the application window):**
1. Python, SQL, data wrangling and statistics/probability (named in the large majority of postings).
2. Time-series forecasting (including probabilistic forecasts and backtesting): the most recurring domain-specific modeling skill across Amazon, Meta and Microsoft capacity/energy roles.
3. Optimization and operations research (LP/MILP, stochastic optimization, solvers such as OR-Tools/Gurobi): dominant in Meta server-demand roles, Google data center planning and fleet analytics, Amazon CloudTune. This matches the learner's engineering background and is a differentiator.
4. Anomaly detection, causal inference and root-cause analysis for operational metrics (Amazon data center ops, Microsoft safe-changes).
5. ML system design and MLOps basics (deploy, monitor, evaluate, drift), on one cloud, plus communicating uncertainty to stakeholders.
6. Bayesian/uncertainty quantification: explicit in Meta power-peak modeling, Amazon, Microsoft.

**Can come later (valuable, rarely gating):** reinforcement learning and MPC (named rarely; mostly in public research on data center cooling rather than in postings), deep learning beyond the basics, computer vision, large-scale distributed training, JAX, Kubernetes, Spark-scale tooling.
**LLM/GenAI literacy is now a baseline:** it appears in a large minority of postings (RAG, agents, evaluation). Cover it enough to build and evaluate a RAG/agent workflow, but do not let it displace forecasting and optimization.
**Domain edge:** the physics/thermo/power-systems tags (HVAC, electrical) are explicitly requested in only a few postings, yet they are what makes the learner distinct; weave them into projects (cooling load forecasting, power-capacity optimization) rather than separate courses.

## Exemplary target-role postings

- `job-amazon-10513233`: Amazon Sr. Applied Scientist, Global Data Center Ops Central Insight and Analytics: causal inference + forecasting + anomaly detection + LLM reasoning on real data center operations; the closest skill-mix match.
- `job-meta-2689975688126702`: Meta Research Scientist, Infrastructure Modeling and Reliability: forecasts data center power demand and peak risk with uncertainty; the domain target even though seniority is far above entry.
- `job-meta-1487028006662011`: Meta Research Scientist, Server Demand Forecasting: forecasting plus OR to match demand to power, cooling and supply; shows exactly how optimization is valued.
- `job-amazon-10587034`: Amazon Principal Applied Scientist, AWS Data Center Services: computer vision and RAG applied inside physical data centers; shows the direction of GenAI/CV in operations.
- `job-microsoft-200065939`: Microsoft Principal Data Scientist Manager, datacenter power reclamation: metrics, forecasting and power utilization analytics at a hyperscaler.
- `job-amazon-10560313`: Amazon Research Scientist, WW Sustainability: carbon credit science; sustainability track with a Master's plus experience route.
- `job-amazon-10584232`: Amazon Data Scientist, CloudTune: stochastic optimization and time series for capacity; reachable seniority (2+ years) with Master's-friendly requirements.
- `job-google-141496697866855110`: Google SWE Fleet Analytics (PhD early career): MIP optimization for fleet; the only early-career route into infrastructure optimization seen.
- `job-microsoft-200065640`: Microsoft Sr Applied Scientist, AI for Safe Changes: anomaly detection, causal and time-series methods for infrastructure reliability.
- `job-google-138642076408390342`: Google Staff SWE, Data Center Planning: optimization of gigawatts of capacity; shows the engineering bar around planning systems.

## Appendix: postings

| ID | Company | Title | Tier | Level |
|---|---|---|---|---|
| job-amazon-10560313 | Amazon | Research Scientist, WW Sustainability | A | Research Scientist |
| job-amazon-10587034 | Amazon | Principal Applied Scientist, AWS Data Center Services | A | Principal |
| job-amazon-10513233 | Amazon | Senior Applied Scientist, Amazon Global Data Center Ops Central Insight and Analytics | A | Senior |
| job-amazon-10477487 | Amazon | Sr. Data Scientist, Capacity Planning | B | Senior |
| job-amazon-10415438 | Amazon | Applied Scientist, AWS Insights & Optimization | B | Applied Scientist |
| job-amazon-10584232 | Amazon | Data Scientist, CloudTune | B | Data Scientist |
| job-amazon-10585827 | Amazon | Software Development Engineer III, WW Sustainability | A | SDE III (senior) |
| job-amazon-10414903 | Amazon | Data Scientist II, Long Term Planning and Forecasting | B | Data Scientist II |
| job-amazon-10579474 | Amazon | Data Scientist I, PXT Central Science | C | Data Scientist I (early career) |
| job-amazon-10601943 | Amazon | Applied Scientist I, Tablet Product Software | C | Applied Scientist I (early career) |
| job-microsoft-200065939 | Microsoft | Principal Data Scientist Manager | A | Principal manager |
| job-microsoft-200066763 | Microsoft | Senior Data Scientist | B | Senior |
| job-microsoft-200063583 | Microsoft | Principal Software Engineer - HW/SW in Fleet Infrastructure | B | Principal |
| job-microsoft-200046174 | Microsoft | Principal Software Engineer, ML & Distributed Systems | B | Principal |
| job-microsoft-200063877 | Microsoft | Senior Software Engineer - AI Infrastructure | B | Senior |
| job-microsoft-200065640 | Microsoft | Senior Applied Scientist - AI for Safe Changes Health Gating | B | Senior |
| job-microsoft-200062684 | Microsoft | Senior Researcher - AI Systems and Infrastructure - Microsoft Research | B | Senior researcher |
| job-microsoft-200065126 | Microsoft | Software Engineer 2 - GPU COGS/Efficiency | B | SWE 2 |
| job-microsoft-200061655 | Microsoft | Applied Scientist II | C | Applied Scientist II (early career) |
| job-google-138642076408390342 | Google | Staff Software Engineer, Google Data Center Planning | A | Staff |
| job-google-136915934152401606 | Google | Senior Product Data Scientist, ML Resource Efficiency | B | Senior |
| job-google-141496697866855110 | Google | Software Engineer, Fleet Analytics, PhD, Early Career, 2026 | B | PhD early career |
| job-google-139663235753091782 | Google | Senior Staff Software Engineer, AI/ML, Google Cloud Compute Infrastructure | B | Senior Staff |
| job-google-80847978566165190 | Google | Staff Software Engineer, Core Systems and Capacity Assurance | B | Staff |
| job-google-136909835298841286 | Google | Staff Software Developer, Applied AI, Site Reliability Development | B | Staff |
| job-google-133367856568902342 | Google | Senior Staff Software Engineer, ML Performance, GPU | B | Senior Staff |
| job-google-127602843300307654 | Google | Software Engineer, AI/ML, PhD, Early Career, 2026 | C | PhD early career |
| job-google-123087196289671878 | Google | Software Engineer, AI/Machine Learning, PhD, Early Career, 2027 Start | C | PhD early career |
| job-meta-2689975688126702 | Meta | Research Scientist, Infrastructure Modeling and Reliability | A | Senior/principal (10+ yrs) |
| job-meta-1612727887131849 | Meta | Research Scientist, Infrastructure Modeling and Reliability (second listing) | A | Senior/principal (10+ yrs) |
| job-meta-1487028006662011 | Meta | Research Scientist, Server Demand Forecasting | B | Principal technical leader |
| job-meta-1117047447904510 | Meta | Research Scientist, Demand Forecasting | B | Senior (6+ yrs) |
| job-meta-1881878742790429 | Meta | Data Scientist, Infrastructure Finance | B | Senior (10+ yrs) |
| job-meta-2561197087738216 | Meta | Research Scientist, Systems ML - HW/SW Co-Design | B | Senior (7+ yrs) |
| job-meta-2097712830820463 | Meta | Energy Analyst, Data Center Portfolio | A | Senior (6+ yrs) |
| job-meta-1791619365408270 | Meta | Software Engineer, Systems Machine Learning | C | Entry (degree in progress or completed) |
