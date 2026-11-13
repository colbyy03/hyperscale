# ML for data centers, building energy and HVAC: literature catalog

Accessed 2026-11-12. Full records (DOI, access, verification flag) are in `sources-domain-ml.json`; ids below are the record ids. "Verified" means I confirmed title/authors/year through Crossref, the arXiv API or the page itself. Items marked (unverified) are from memory.

## 1. ML in data centers

| Problem | Method and result | Informs |
|---|---|---|
| Cooling efficiency, Google (2014-2016) | Neural-network model of PUE from plant telemetry, used to test setpoint what-ifs (gao2014-ml-dc-optimization, unverified). The 2016 DeepMind post reports up to 40 percent cooling energy reduction from a recommendation system (evans-gao2016-deepmind-cooling-40, verified). | Module 0, 24, capstone 1 |
| Autonomous cooling control (2018) | Same system moved to direct control with safety layers (gamble-gao2018-safety-first-cooling, verified). | 23, 24 |
| MPC for DC cooling | Linear time-varying model learned from about two years of data, plus constrained MPC (lazic2018-dc-cooling-mpc, unverified record). Data-efficient vs deep RL; the template for capstone 1's MPC. | 24 |
| RL on commercial chillers | Live trials at two Trane sites: about 9 and 13 percent energy savings; paper centres on evaluation, offline learning and constraints (luo2022-rl-commercial-cooling, verified). | 23, 24 |
| Simulator-based RL, Meta | Physics simulator for outside-air and evaporative cooling; in a pilot region supply-fan energy fell about 20 percent and water use 4 percent (meta2024-sim-rl-dc-cooling, verified; company blog, not peer reviewed). | 23, 24, capstone 1 |
| Carbon-aware computing | Day-ahead load and carbon forecasts feed a risk-aware optimizer producing hourly capacity limits for flexible jobs (radovanovic2023-carbon-aware-computing, verified). | 21, 24 |
| Power oversubscription and capping | Facebook Dynamo (wu2016-dynamo-fb-power, verified); Google's medium-voltage plane with priority-aware capping (sakalkar2020-dc-power-oversubscription, partly unverified), accompanied by public power traces. A Google Thunderbolt (OSDI 2020) paper exists but I did not verify it; Microsoft power-management papers were not surveyed. | 21, 24, 27 |
| Workload prediction | Azure Resource Central: gradient boosting predicts VM lifetime, size and utilization to guide placement (cortez2017-resource-central, verified). | 8, 21, 27 |
| Disk failure prediction | Botezatu 2016 (verified) plus the Backblaze data; high class imbalance, drive-level splits. Other classic work (Google 2007, Schroeder and Gibson 2007) not verified here. | 7, 8, 22 |
| 2023-2026 liquid cooling, AI-cluster power, DC digital twins | Not covered with verified credible sources in this pass. Treat as a gap to fill before writing module 0/24 content on direct-to-chip cooling and GPU-cluster power. The NASEM digital-twin report (nasem2024-digital-twins, verified) gives the definitional framework. | 0, 24 |

## 2. Forecasting
- **GEPIII and BDG2.** Miller et al. 2020 (miller2020-gepiii, miller2020-bdg2, verified). Winners used gradient-boosted trees with heavy data cleaning; the competition is a leakage and validation lesson (site-wise and time-wise splits, meter anomalies, weather alignment).
- **GEFCom2014.** Quantile forecasts scored by pinball loss for load, price, wind and solar (hong2016-gefcom2014, verified). Use for probabilistic evaluation (module 25).
- **M4 and M5.** M4: hybrids and ensembles beat pure ML; M5: LightGBM-style gradient boosting with strong features led (makridakis2020-m4, makridakis2022-m5, verified). Supports "start with a strong tabular GBM and a seasonal-naive baseline".
- **Foundation forecasters.** Chronos, TimesFM, Moirai, TimeGPT (ansari2024-chronos, das2024-timesfm, woo2024-moirai, garza2023-timegpt1, verified). Claims: zero-shot accuracy near or occasionally above per-dataset models (Chronos on 42 datasets). Counter-evidence and cautions: GIFT-Eval provides a non-leaking pretraining set precisely because earlier evaluations can overlap with pretraining data (aksu2024-gifteval); Tan et al. show LLM-adapted forecasters often do not need the LLM (tan2024-llm-ts-useful). I did not find in this pass a clean head-to-head showing foundation models beating tuned GBMs on building-energy data; the course should run that experiment itself on BDG2 with a leakage check (pretraining corpora may include building data).

## 3. Anomaly detection and fault diagnosis
- Foundations: Chandola 2009 (chandola2009-anomaly-detection), Isolation Forest (liu2008-isolation-forest), Katipamula and Brambley 2005 (katipamula2005-fdd-review-i), APAR rules (house2001-apar, unverified).
- Data: LBNL labeled FDD datasets and their data descriptor (granderson2020-lbnl-fdd-data, lbnl-fdd-oedi); RP-1043 availability unclear.
- Benchmarks: NAB (lavin2015-nab); Wu and Keogh 2021 argue Yahoo/Numenta/NASA benchmarks are flawed (trivial examples, unrealistic anomaly density, mislabeling, run-to-failure bias) and propose the UCR archive (wu2021-keogh-flawed-benchmarks); Schmidl et al. 2022 evaluate 71 detectors and show no method dominates and rankings depend on the metric (schmidl2022-tsad-eval).
- Deep-learning FDD reviews: not surveyed here.
- Course use: module 22 should pair point-adjusted F1 criticism with range-based or event-based metrics and run detectors on both NAB and UCR.

## 4. Physics-informed ML and digital twins
PINNs (raissi2019-pinn), the Karniadakis review (karniadakis2021-piml), SINDy (brunton2016-sindy), neural ODEs (chen2018-neural-ode), grey-box RC building models (bacher2011-greybox), structured neural building thermal models (drgona2021-physics-constrained), and the NASEM digital-twin report (nasem2024-digital-twins). Suggested ordering for module 24: RC grey-box first (interpretable, few parameters), then SINDy, then neural state-space with physics constraints, with PINNs presented as one option with known optimization difficulties.

## 5. Control
- MPC reviews: drgona2020-mpc-buildings, afram2014-hvac-mpc-review.
- RL for buildings: wang2020-rl-building-controls, wei2017-drl-hvac, chen2019-gnurl (differentiable MPC policy).
- Benchmarks and environments: BOPTEST (blum2021-boptest), Sinergym (jimenez2021-sinergym), CityLearn (vazquez2019-citylearn, nweye2024-citylearn-v2).
- Safe learning: brunke2022-safe-learning-robotics.
- MPC versus RL head-to-head: I did not verify a decisive benchmark. BOPTEST is the credible common ground; capstone 1 should compare PID/rule baseline, MPC and RL on the same simulator with the same KPIs.

## 6. LLMs for facilities and industrial operations
- AssetOpsBench (IBM; patel2025-assetopsbench, verified): 140+ queries, simulated IoT environment, metrics for agent designs; Apache-2.0 code; vendor-authored.
- Cloud-incident root causing with retrieval and GPT-4 (zhang2024-cloud-incident-rca, verified): closest to retrieval-based diagnosis.
- LogEval (cui2024-logeval, verified) for log-analysis LLM evals.
- Industrial fault consultation (boonmee2024-industrial-fault-llm): low-credibility preprint.
- Credibility note: this area is dominated by preprints and vendor papers; arXiv search also surfaced several 2025-2026 industrial-LLM preprints (e.g. 2603.08048, 2610.19131) that I did not read. Weight any claim by whether the eval set is public, whether faults come from real equipment, and whether a non-LLM baseline is reported.

## Gotchas
1. Anomaly benchmark flaws and point-adjusted F1 inflation (Wu and Keogh; Schmidl).
2. Forecast leakage: random splits on autocorrelated data, weather leaking the future, same-site buildings across train/test, and foundation-model pretraining overlap with the test sets (GIFT-Eval motivation).
3. Backblaze: split by drive; SMART schema changes between quarters.
4. Sim-to-real: vendor results (Google, Meta, Trane) come from single sites or pilots and are best-case; the lesson in Luo et al. is that evaluation, constraints and offline data limits dominate. Our simulator must be validated against real building data and labeled as a sim-based claim.
5. Synthetic maintenance logs can be unrealistically clean and favour LLMs.
6. Licensing: SKAB is GPL-3.0; the Kaggle GEPIII terms were not verified; Electricity Maps and WattTime data likely cannot be redistributed.

## Paywalled: fetch via library (priority order)
1. Drgona et al. 2020, MPC for buildings: 10.1016/j.arcontrol.2020.09.001
2. Blum et al. 2021, BOPTEST: 10.1080/19401493.2021.1986574
3. Wang and Hong 2020, RL for building controls: 10.1016/j.apenergy.2020.115036
4. Drgona et al. 2021, physics-constrained building dynamics: 10.1016/j.enbuild.2021.110992
5. Bacher and Madsen 2011: 10.1016/j.enbuild.2011.02.005
6. Karniadakis et al. 2021: 10.1038/s42254-021-00314-5
7. Katipamula and Brambley 2005 Part I: 10.1080/10789669.2005.10391133 (Part II: 10.1080/10789669.2005.10391134, unverified)
8. Cortez et al. 2017 Resource Central: 10.1145/3132747.3132772
9. Hong et al. 2016 GEFCom2014: 10.1016/j.ijforecast.2016.02.001
10. Makridakis M4 and M5: 10.1016/j.ijforecast.2019.04.014, 10.1016/j.ijforecast.2021.11.013
11. Chandola 2009: 10.1145/1541880.1541882; Liu 2008: 10.1109/ICDM.2008.17
12. Afram 2014: 10.1016/j.buildenv.2013.11.016; Chen 2019 Gnu-RL: 10.1145/3360322.3360849; Wei 2017: 10.1145/3061639.3062224; Sinergym: 10.1145/3486611.3488729; CityLearn: 10.1145/3360322.3360998
13. Wu 2016 Dynamo: 10.1109/ISCA.2016.48; Botezatu 2016: 10.1145/2939672.2939699
14. Raissi 2019 PINN: 10.1016/j.jcp.2018.10.045
15. Not yet located with DOI: Lazic 2018 (NeurIPS, open proceedings), House 2001 APAR (ASHRAE Transactions), RP-1043 report, Gao 2014 whitepaper, Thunderbolt OSDI 2020.
Likely open copies to try first: Wang and Hong (LBNL eScholarship), Drgona papers (OSTI), Miller GEPIII (arXiv).
