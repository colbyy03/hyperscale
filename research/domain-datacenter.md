# Hyperscale domain foundation: how a hyperscale data center works, plus the physics for the data-hall simulator

Research date: 2026-11-12. Companion file: `research/sources-domain-dc.json` (all ids in square brackets resolve there; a few ids such as `sakalkar2020-dc-power-oversubscription` live in `sources-domain-ml.json`).

**How to read the tags**

- `[id]` = the claim was checked against that source (page or PDF text loaded on 2026-11-12) unless the source record says `verified: false`.
- `[U]` = engineering estimate, derived value or general practice that I did not check against a source. These are reasonable starting values for a simulator, but the course should label them as assumptions and, where possible, have the learner calibrate them.
- `[derived: ...]` = computed from verified numbers with basic physics (the derivation is shown).
- SI units throughout; IP units in parentheses where the industry habitually uses them.

---

## Part 1. Primer outline (Module 0, "domain primer", and the running story)

### 1.1 Why the industry cares (macro context)

1. US data centers used about 60 TWh/yr in 2014-2016, 76 TWh in 2018 (1.9% of US electricity) and 176 TWh in 2023 (4.4%). LBNL's 2028 scenarios span 325-580 TWh (6.7-12.0%), which at 50% average utilization means 74-132 GW of demand. [shehabi2024-us-dc-energy]
2. The same report: average US PUE fell from about 1.6 (2014) to 1.4 (2023) and is projected at 1.15-1.35 by 2028, mostly because servers moved into hyperscale and colocation halls (74% of servers in 2023, 85% by 2028) and because AI servers are increasingly liquid cooled. Infrastructure (non-IT) energy fell from 40% to 30% of the total. [shehabi2024-us-dc-energy]
3. LBNL utilization and duty assumptions worth reusing in the load model: hyperscale server utilization 45% (2014) rising to 50% (2027); AI training servers run about 80% of the time, inference servers about 40%. [shehabi2024-us-dc-energy]
4. Water: LBNL estimates average US on-site WUE at about 0.36 L/kWh through 2023, rising to 0.45-0.48 L/kWh, and about 4.5 L/kWh of indirect (power-plant) water per kWh consumed, with about 0.34 kg CO2e/kWh. [shehabi2024-us-dc-energy]
5. Globally, data centers used about 415 TWh in 2024 (about 1.5% of world electricity; US 45%, China 25%, Europe 15%), growing about 12%/yr since 2017. The IEA base case reaches about 945 TWh by 2030 and about 1,200 TWh by 2035 (scenario range 700-1,700 TWh). A typical AI-focused facility draws as much as 100,000 households. [iea2025-energy-and-ai]
6. Grid friction: the IEA estimates about 20% of planned data-center projects risk delay; wait times for transformers and cables doubled in three years; using spare server capacity and on-site generation/storage flexibly is "underexplored". [iea2025-energy-and-ai]
7. EPRI's 2026 update projects data centers at 9-17% of US electricity by 2030 (its 2024 edition said 4.6-9.1%). These figures come from coverage of EPRI's product pages and were not checked against the reports. [epri2026-powering-intelligence] [epri2024-powering-intelligence]

### 1.2 The power chain (utility to chip)

Teach the chain as a sequence of conversions, each with a loss curve that depends on load fraction:

utility transmission and campus substation -> medium-voltage switchgear -> MV/LV transformers -> low-voltage switchgear (with generator paralleling and automatic transfer) -> UPS (battery-backed) -> PDUs / remote power panels (RPPs) or overhead busway -> rack PDU or rack power shelf -> server PSU -> on-board voltage regulators -> chips. [U for the generic topology]

Facts to teach:

1. Double-conversion UPS efficiency rose from roughly 85-90% (1990s) to 95% or more (2023). Eco/bypass modes reach up to about 99%. [femp2024-dc-best-practices]
2. UPS losses have three parts: a fixed no-load loss (transformers, capacitors, control electronics; often more than 40% of all UPS losses at typical loads), a loss proportional to load (switching and conduction), and a square-law (I^2 R) loss that becomes significant (1-4%) near full load. Base double-conversion efficiency is about 94-97%; the bypass path in eco-mode is about 98-99%. [schneider-wp108-large-ups-efficiency]
3. Redundancy pushes UPS modules to low load. Two units in N+1 run at 50% or less even at full build-out; serving the same load with three smaller units raises each unit's load factor (30% to 40% in FEMP's example), worth about 1.2 percentage points of efficiency. [femp2024-dc-best-practices]
4. Transformers tend to be most efficient at 20-50% load; dry-type units with an 80 °C (176 °F) rise use 13-21% less energy than 150 °C (302 °F) rise units. [femp2024-dc-best-practices]
5. Server PSUs are most efficient at about 40-60% of rated load; PSU losses sit inside the IT boundary of PUE, which is why PSU upgrades lower total energy without improving PUE. [femp2024-dc-best-practices]
6. Redundancy vocabulary: N (no spare), N+1 (one spare component), 2N (two full independent paths), 2N+1, and distributed/"block" redundancy (several systems each carrying part of the load with a reserve). [schneider-wp75-ups-configurations] (unverified) Uptime's Tier I-IV labels mean, roughly: basic capacity; redundant capacity components; concurrently maintainable (any component or path can be taken down for maintenance without dropping load); fault tolerant (survives any single failure, with compartmentalization). [uptime-tier-standard-topology] (unverified). Availability percentages often quoted next to the tiers are not part of the current Tier Standard; do not teach them as definitions. [U]
7. Generators: the UPS bridges the gap until diesel generators start and take load (Schneider's worked example assumes 60 s). Mechanical loads (CRAH fans, pumps, chillers) are often *not* on UPS, which is the root of the classic "temperature spike after a utility outage" incident. [schneider-wp179-cooling-outage-temp-rise]
8. Power problems remain the leading cause of impactful outages: 56% of operators who had one in the last three years blamed power (45% in 2025). [uptime2026-global-survey]
9. AI-era rack power: an NVIDIA GB200 NVL72 rack draws about 120 kW; it uses eight power shelves of six 5.5 kW PSUs (N+N redundancy, about 33 kW input per shelf) feeding a 50-51 V DC busbar, and its compute trays are liquid cooled through manifolds and cold plates while network and storage parts remain air cooled. [nvidia-dgx-gb200-user-guide]
10. Google moved racks to 48 V DC about a decade ago (scaling racks from 10 to 100 kW) and in 2025 announced +/-400 V DC distribution with sidecar power and battery racks for up to 1 MW per rack, saying ML racks will exceed 500 kW before 2030 (Mt Diablo collaboration with Meta and Microsoft). [google2025-1mw-racks-liquid-cooling]
11. Power capping and oversubscription let operators deploy more servers than the worst-case breaker budget: Facebook's Dynamo [wu2016-dynamo-fb-power], Microsoft's Flex "zero reserved power" design [zhang2021-flex-zero-reserved-power], Google's medium-voltage power-plane oversubscription [sakalkar2020-dc-power-oversubscription]. Microsoft's 2026 report calls reallocating stranded power inside existing halls "power harvesting". [microsoft2026-esr]

### 1.3 Cooling architectures

The heat path to teach (and to simulate): chip -> server air stream (or cold plate) -> room air -> CRAH coil -> chilled water -> chiller evaporator -> refrigerant -> chiller condenser -> condenser water -> cooling tower -> atmosphere. A waterside economizer (plate heat exchanger) lets the condenser-water loop cool the chilled water directly, skipping the compressor.

1. CRAC vs CRAH: a CRAC is a direct-expansion (refrigerant, compressor-in-unit) computer-room air conditioner common in small and mid-size rooms; a CRAH is a fan plus chilled-water coil served by a central plant. LBNL simulated nine common US system types: DX, air-cooled chiller, water-cooled chiller, airside and waterside economizers, dry coolers with or without adiabatic assist, and liquid cooling. [shehabi2024-us-dc-energy] [femp2024-dc-best-practices]
2. Air management: hot-aisle/cold-aisle layouts with blanking panels and sealed cable cut-outs; containment keeps exhaust from re-entering inlets. Server air temperature rise ranges from about 5.6 to over 22 K (10 to 40 °F) and rack exhaust can exceed 38 °C (100 °F); hotter return air extends economizer hours and lets supply airflow drop. [femp2024-dc-best-practices]
3. Containment trade-off: it improves efficiency in normal operation but shortens ride-through when cooling fans stop, because hot air leaks back through rack and containment openings. [schneider-wp179-cooling-outage-temp-rise]
4. Supply-air variants at hyperscale: Meta's halls use a two-level "penthouse" with 100% outside air, a mixing room, filters, an evaporative cooling and humidification stage, a fan wall and contained hot aisles exhausted by relief fans, holding 18-30 °C (65-85 °F) and 13-80% RH. [meta2024-sim-rl-dc-cooling] Microsoft has used direct outside-air cooling with evaporative assist since 2008, adding water only above 29.4 °C (85 °F). [microsoft2026-water-blog]
5. Chilled-water plant best practice: primary-only variable flow with two-way valves, differential-pressure setpoint reset, chilled-water supply (CHWS) temperature reset, variable-speed chillers, and condenser-water temperature reset with a 2.8-3.9 K (5-7 °F) approach tower. Keep coils dry by running chilled water above 10 °C (50 °F). Many cool-climate sites run on the waterside economizer alone, and towers can charge chilled-water storage at night. [femp2024-dc-best-practices]
6. Water vs energy: Microsoft lists cooling towers (evaporate year-round), hybrid fluid coolers (wet in summer, dry otherwise), direct air (water only on hot days), air-cooled chillers (no evaporation) and closed-loop liquid cooling. Replacing evaporative systems with mechanical cooling raises PUE slightly while cutting water. [microsoft2026-water-blog] [microsoft2026-esr]
7. Liquid cooling: direct-to-chip cold plates with a cooling distribution unit (CDU) that separates the rack-side technology cooling system (TCS) loop from the facility water system (FWS). [femp2024-dc-best-practices] Google has run liquid cooling since TPU v3 (2018), across more than 2,000 TPU pods at gigawatt scale with about 99.999% availability, using in-row CDUs with redundant pumps/heat exchangers on UPS; water carries roughly 4,000 times more heat per unit volume than air. [google2025-1mw-racks-liquid-cooling] Meta's newest AI halls use closed-loop water-glycol with dry coolers, plus rack-level "air-assisted liquid cooling" where buildings lack facility water. [meta2026-closed-loop-cooling] Microsoft's 2024 zero-evaporation design is expected to avoid more than 125 million litres of water per year per data center. [microsoft2026-esr]
8. Coolant temperature strategy (OCP accelerator guidance): Group 1 runs 40-45 °C secondary supply (no chillers, lowest water); Group 2 runs 30-37 °C with light chiller trim. [ocp2023-oai-liquid-cooling-guidelines]
9. Immersion (single- and two-phase) exists but is a minority; treat as enrichment. [ashrae2021-liquid-cooling-wp] (unverified)
10. Heat reuse: FEMP adds Energy Reuse Effectiveness (ERE) next to PUE; Microsoft notes that each MW of heat exported can remove up to a MW of cooling demand. [femp2024-dc-best-practices] [microsoft2026-esr]

### 1.4 ASHRAE thermal guidelines (5th edition, 2021) as taught by FEMP

| Class | Inlet dry-bulb (allowable) | RH (allowable) | Notes |
|---|---|---|---|
| Recommended (A1-A4) | 18-27 °C (64.4-80.6 °F) | see humidity notes | target for operation |
| A1 | 15-32 °C | 8-80% | |
| A2 | 10-35 °C | 8-80% | |
| A3 | 5-40 °C | 8-85% | |
| A4 | 5-45 °C | 8-90% | |
| H1 (new 2021 class for high-density parts) | narrower | | ranges not captured in my check [U] |

Source for rows A1-A4 and recommended: [femp2024-dc-best-practices]. Humidity notes: the recommended minimum is a -9 °C (15.8 °F) dew point (about 10% RH), and most halls need no humidification. [femp2024-dc-best-practices] The recommended upper limit (15 °C dew point, 70% RH, or 50% RH where corrosive gases are present) comes from secondary summaries; confirm in the paywalled book. [ashrae2021-thermal-guidelines-5e] Liquid-cooling facility-water classes were renamed by their upper supply limit: W17, W27, W32, W40 (new), W45 and W+. [femp2024-dc-best-practices] EnergyPlus can report time outside A1-A4 envelopes, which is a ready-made "constraint violation" counter. [energyplus96-io-ref-ite]

### 1.5 Metrics

1. **PUE** = total facility energy / IT energy (The Green Grid, 2007; standardized as ISO/IEC 30134-2). [uptime2026-global-survey] [femp2024-dc-best-practices] [iso-iec-30134-2-pue] Teach measurement boundary and averaging: Google reports an energy-weighted trailing-twelve-month PUE that counts substations, transformers, water treatment and even campus offices as overhead, noting it could report about 1.06 with a narrower boundary. [google-dc-pue-page]
2. **Partial PUE (pPUE)**: the same ratio restricted to a subsystem (for example the AI pod). [tgg2012-wp49-pue] (unverified)
3. **WUE** = annual site water / IT energy (L/kWh); a source-based variant adds power-plant water. [femp2024-dc-best-practices] [tgg2011-wp35-wue] Definitions differ between companies: AWS reports litres *withdrawn* per kWh of IT load. [aws-cloud-sustainability-page]
4. **CUE** = CO2e from facility energy / IT energy (kg/kWh), equal to grid emission factor times PUE when all energy is grid electricity. [femp2024-dc-best-practices] [tgg2010-wp32-cue]
5. **ERE/ERF** for heat reuse. [femp2024-dc-best-practices]
6. **Plant efficiency** in kW/ton: 1.1 (standard), 0.8 (good), 0.6 (better). **Air-handler efficiency** in W/cfm: 1.25, 0.75, 0.5. [femp2024-dc-best-practices]
7. **Airflow metrics**: Supply Heat Index SHI = (T_inlet - T_supply)/(T_outlet - T_supply) (0 is perfect; Return Heat Index = 1 - SHI) [sharma2002-dimensionless-thermal-metrics] [energyplus96-eng-ref-ite]; Rack Cooling Index (RCI_HI, RCI_LO) measures how far rack inlets stray above/below the recommended range relative to the allowable range [herrlin2005-rack-cooling-index] [femp2024-dc-best-practices]; Return Temperature Index RTI = (T_return - T_supply)/(T_out,IT - T_in,IT) x 100%, under 100% means bypass, over 100% means recirculation [U].
8. **Industry averages vs hyperscale**: Uptime's survey average PUE is 1.52 in 2026 (n=644) after about seven flat years (1.54 in 2025). [uptime2026-global-survey] [google-dc-pue-page] Hyperscalers report 1.08-1.17 (table in 1.7).

### 1.6 AI-era trends (2024-2026)

1. Densities: the average "most common" rack density in Uptime's 2026 survey passed 11 kW (9 kW in 2025), or 7.8 kW excluding a few new very dense sites; 24% of operators now have some racks at 30 kW or more (19% in 2025), and about one in seven has 50+ kW racks, some above 100 kW. [uptime2026-global-survey] NVL72-class racks are about 120 kW [nvidia-dgx-gb200-user-guide]; Google targets 1 MW racks. [google2025-1mw-racks-liquid-cooling]
2. Liquid cooling is becoming default for accelerators (Google, Meta, Microsoft above). Uptime expects direct liquid cooling at elevated temperatures to help PUE over the longer term, while new builds in hot climates temper the average. [uptime2026-global-survey]
3. Grid constraints, on-site generation and storage: see 1.1 item 6. [iea2025-energy-and-ai] Google says it uses demand response and flexibility "when possible" to help grids at peak. [google2026-environmental-report]
4. Flexible-load headroom: a 2025 Duke study estimated that the US grid could absorb about 76, 98 or 126 GW of new flexible load if those loads accept curtailment of 0.25%, 0.5% or 1% of their annual energy. [norris2025-rethinking-load-growth] (unverified)
5. Carbon-aware computing: Google's system shifts flexible compute in time to cleaner hours [radovanovic2023-carbon-aware-computing]; moving load between sites can absorb curtailed renewables. [zheng2020-load-migration-curtailment]

### 1.7 Hyperscaler snapshot (latest editions as of 2026-11-12)

| Company | Fleet PUE | WUE (L/kWh) | Water / energy notes | Source |
|---|---|---|---|---|
| Google | 1.09 TTM, 2025 (quarterly 1.08; campuses 1.04-1.22; The Dalles, Oregon 1.06-1.10; Mesa, Arizona 1.22) | not reported as a fleet WUE | 87% of freshwater from low/medium-risk sources; about 35 GW of clean-energy contracts since 2010 (12 GW in 2025); 24/7 carbon-free energy goal for 2030 | [google-dc-pue-page] [google2026-environmental-report] |
| Microsoft | 1.17 (FY2025) | 0.27 (2025), down from 2.3 in early 2000s | WUE intensity -25% vs 2022 (goal -40% by 2030); replenished more water than withdrawn in FY25; Quincy, Washington uses 74% recycled or non-potable water | [microsoft2026-esr] [microsoft2026-water-blog] |
| AWS / Amazon | 1.14 (2025; 1.15 in 2024) | 0.12 withdrawn per IT kWh (2025) | claims 7x better than an industry withdrawal WUE of 0.84; 75% of the way to water-positive by 2030 | [amazon2025-sustainability-report] [aws-cloud-sustainability-page] |
| Meta | 1.08 (2022-2024; 1.10 in 2020) | 0.19 (2024; 0.30 in 2020) | uses digital-twin models of cooling systems to forecast water use; RL now runs across its air-cooled fleet | [meta2025-environmental-data-index] [meta2025-sustainability-report] [meta2026-closed-loop-cooling] |

### 1.8 Where ML already runs in real facilities (motivation for later modules)

1. DeepMind/Google 2016: recommendation system cut cooling energy about 40%. [evans-gao2016-deepmind-cooling-40]
2. Google 2018: autonomous control. Every 5 minutes a cloud system pulls a snapshot from thousands of sensors, neural networks predict the energy effect of candidate actions, low-confidence actions are dropped, and the local control system re-checks every action against operator-defined limits (operators can exit AI mode any time). Savings grew from 12% to about 30% in kW/ton over nine months; the agent learned to make colder water in winter. [gamble-gao2018-safety-first-cooling]
3. Google/NeurIPS 2018: model-predictive control of a server floor. Controls are fan speed and valve opening per AHU; regulated states are cold-aisle temperature and hot/cold differential pressure (medians of sensor groups); disturbances are server power and entering water temperature; a linear model was learned from about 3 hours of safe random exploration and beat the existing per-AHU PID loops. [lazic2018-dc-cooling-mpc]
4. Meta 2024: offline reinforcement learning trained in a physics-based building-energy simulator sets the supply-airflow setpoint; pilot since 2021 cut supply-fan energy about 20% and water about 4%. [meta2024-sim-rl-dc-cooling]
5. AWS uses thousands of sensors and real-time data to find leaks and anomalies affecting water use. [aws-cloud-sustainability-page] Operators trust AI most for sensor analytics and predictive maintenance. [uptime2026-global-survey]

---

## Part 2. Numbers cheat-sheet

| Quantity | Typical value | Range | Units | Source |
|---|---|---|---|---|
| US DC electricity 2023 | 176 (4.4% of US) | | TWh | [shehabi2024-us-dc-energy] |
| US DC electricity 2028 scenarios | | 325-580 (6.7-12.0%) | TWh | [shehabi2024-us-dc-energy] |
| Global DC electricity 2024 / 2030 base | 415 / ~945 | 2035: 700-1,700 | TWh | [iea2025-energy-and-ai] |
| Industry average PUE (Uptime) | 1.52 (2026) | 1.54 (2025) | - | [uptime2026-global-survey] [uptime2025-global-survey] (2025 value confirmed via [google-dc-pue-page]) |
| US average PUE (LBNL) | 1.4 (2023) | 1.15-1.35 (2028) | - | [shehabi2024-us-dc-energy] |
| Hyperscale fleet PUE | 1.09-1.17 | campuses 1.04-1.22 | - | table 1.7 |
| Fleet WUE, hyperscalers | 0.12-0.27 | | L/kWh | table 1.7 |
| US average site WUE | 0.36 (2023) | 0.45-0.48 (post-2023) | L/kWh | [shehabi2024-us-dc-energy] |
| Indirect water / grid CO2 (US DC locations) | 4.5 / 0.34 | | L/kWh, kg/kWh | [shehabi2024-us-dc-energy] |
| Modal rack density (survey) | >11 | 7.8 excl. dense sites | kW/rack | [uptime2026-global-survey] |
| AI rack (NVL72 class) | ~120 | 120-140 [U] | kW/rack | [nvidia-dgx-gb200-user-guide] |
| Roadmap rack power | >500 before 2030 | up to 1,000 | kW/rack | [google2025-1mw-racks-liquid-cooling] |
| Recommended IT inlet | 18-27 | allowable A1 15-32 | °C | [femp2024-dc-best-practices] |
| Minimum dew point (recommended) | -9 | | °C | [femp2024-dc-best-practices] |
| Server air temperature rise | ~11 | 5.6-22 | K | [femp2024-dc-best-practices] |
| Server airflow per kW | 0.075 (160 cfm) at 11.4 K | 0.055-0.11 (115-235 cfm); 125 cfm/kW in Schneider example | m³/s per kW | [derived: V = P/(ρ cp ΔT)] [schneider-wp179-cooling-outage-temp-rise] |
| Server fan power vs inlet | doubles from 25 °C to 32.8 °C | | - | [femp2024-dc-best-practices] |
| Room heating rate with no cooling, before thermal mass engages | >= 5 | | K/min | [schneider-wp179-cooling-outage-temp-rise] |
| Chiller restart after power loss | 10-15 | fast-restart 4-5 | min | [schneider-wp179-cooling-outage-temp-rise] |
| Generator start-and-transfer (example) | 60 | 10-60 [U] | s | [schneider-wp179-cooling-outage-temp-rise] |
| Chiller savings per 1 K warmer CHWS | ~3.5 | 2-4 [U] | % of chiller power | [schneider-wp179-cooling-outage-temp-rise] |
| Plant efficiency benchmark | 0.8 good / 0.6 better | 1.1 standard | kW/ton | [femp2024-dc-best-practices] |
| Air-handler fan benchmark | 0.75 good / 0.5 better | 1.25 standard | W/cfm | [femp2024-dc-best-practices] |
| Cooling-tower approach (efficient plant) | 3.3 | 2.8-3.9 (5-7 °F) | K | [femp2024-dc-best-practices] |
| Plate HX approach (oversized tower + HX) | <1.7 (3 °F) | 1-3 [U] | K | [femp2024-dc-best-practices] |
| Chilled water to keep coils dry | >10 (50 °F) | modern DC 14-20 [U] | °C | [femp2024-dc-best-practices] |
| Tower cycles of concentration | 3 | 2-6 [U] | - | [aws-cloud-sustainability-page] |
| Evaporation per kWh of heat (all-latent bound) | 1.48 | 1.1-1.5 at 75-100% latent [U] | L/kWh(th) | [derived: 3.6 MJ / 2.43 MJ/kg] |
| UPS efficiency, double conversion | 95-97 | eco/bypass 98-99 | % | [schneider-wp108-large-ups-efficiency] [femp2024-dc-best-practices] |
| UPS no-load share of losses | >40 | | % | [schneider-wp108-large-ups-efficiency] |
| UPS square-law loss near full load | | 1-4 | % | [schneider-wp108-large-ups-efficiency] |
| Transformer best-efficiency load band | | 20-50 | % load | [femp2024-dc-best-practices] |
| PSU best-efficiency load band | | 40-60 | % load | [femp2024-dc-best-practices] |
| TCS coolant flow (PG25) | 1.5 (ΔT ≈ 10 K) | 1.25-2.0 (ΔT 7.5-12 K) | L/min per kW | [ocp2023-oai-liquid-cooling-guidelines] |
| Cold-plate resistance, case to coolant inlet, 1 kW device | <0.02 | 0.015-0.016 best (DI water, high flow) | K/W | [ocp2023-oai-liquid-cooling-guidelines] |
| DLC secondary supply temperature | 30-37 (Group 2) | 40-45 (Group 1) | °C | [ocp2023-oai-liquid-cooling-guidelines] |
| CDU approach (TCS supply minus FWS supply) | 3 | 2-6 [U] | K | [U] |
| CDU fleet availability (Google) | ~99.999 | | % | [google2025-1mw-racks-liquid-cooling] |
| ML cooling savings reported | 30% kW/ton (Google), 20% fan energy and 4% water (Meta) | 12-40% | | [gamble-gao2018-safety-first-cooling] [meta2024-sim-rl-dc-cooling] |
| Planned DC projects at risk of grid delay | ~20 | | % | [iea2025-energy-and-ai] |
| Impactful outages caused by power | 56 (2026) | 45 (2025) | % | [uptime2026-global-survey] |

---

## Part 3. Simulator spec seed

### 3.1 Purpose and design rules

The learner returns to one in-browser simulator all course long: tune setpoints by hand (Module 0/24), replace the baseline controller (24), forecast load and weather-driven PUE (21), detect injected faults (22), train an RL agent that beats their controller (23), and design the production ML system around it (27). Design rules:

1. Lumped-parameter, physically interpretable states (about 25-32), so every state has a story ("hot aisle of Pod 3 is heating").
2. Fast: physics step of 1-5 s, controller step 10-60 s, logged "BMS snapshot" every 60 s (5-minute snapshots for the DeepMind-style RL observation). [gamble-gao2018-safety-first-cooling]
3. Same structure as the open, verified references: EnergyPlus's IT-equipment, chiller and cooling-tower models [energyplus96-eng-ref-ite] [energyplus96-eng-ref-chillers] [energyplus96-eng-ref-cooling-towers], and Schneider's well-mixed room model for outages. [schneider-wp179-cooling-outage-temp-rise] [zhang-vangilder2011-transient-analysis]
4. Separate the true plant from the measurement layer, so sensor faults (bias, drift, stuck-at) can be injected without changing physics.
5. Levels of fidelity: Level 1 (hand tuning: Carnot-fraction chiller, approach-curve tower, no humidity), Level 2 (controller and FDD work: Gordon-Ng or EIR chiller, e-NTU coils, humidity, water), Level 3 (AI pod with liquid loop, power chain detail, carbon/price signals).

### 3.2 Reference facility: "Hall A", fictional inland Pacific Northwest campus

- IT design load 4.8 MW air-cooled in 4 contained pods of 1.2 MW (120 racks x 10 kW each). Rack density matches today's survey "modal" values. [uptime2026-global-survey] [U for the layout]
- 16 fan-wall CRAH units, 4 per pod (3 duty + 1 redundant), each about 0.40 MW sensible at design. [U]
- Water-cooled chilled-water plant: 3 variable-speed centrifugal chillers of 2.8 MW (about 800 tons) in N+1, primary-only variable-flow pumping, plate-and-frame waterside economizer (WSE) piped in series ahead of the chillers, 4 hybrid cooling-tower cells that can run wet or dry. [femp2024-dc-best-practices] [microsoft2026-water-blog] [U for sizes]
- Design temperatures (modern, warm): supply air 24 °C, hot aisle about 36 °C, CHWS 16 °C, CHW return 26 °C, condenser water 25/30 °C at design wet-bulb 20 °C. [U, consistent with the guidance in 1.3-1.4]
- Electrical: 2N UPS (two systems of 4 x 1.5 MW modules), MV/LV transformers, PDUs; generators with about 60 s start-and-transfer. [U] [schneider-wp179-cooling-outage-temp-rise]
- Act 3 upgrade, "AI pod": Pod 4 is rebuilt as 8 liquid-cooled racks of 130 kW (about 1.04 MW) on a CDU with a warm facility-water loop (W32 class), served by a dedicated plate HX on the tower loop or by dry coolers. [nvidia-dgx-gb200-user-guide] [ocp2023-oai-liquid-cooling-guidelines] [U]

Expected behaviour of the baseline design (sanity targets, [derived] from the parameter table): mechanical-cooling PUE about 1.25-1.35; full-economizer PUE about 1.10-1.16; annual PUE in an inland PNW climate about 1.15-1.20, leaving room for the learner's controller and RL agent to move toward hyperscale values (1.06-1.10, [google-dc-pue-page]).

### 3.3 State vector (Level 2-3: 31 states)

| # | State | Symbol | Notes |
|---|---|---|---|
| 1-4 | Cold-aisle air temperature, pods 1-4 | T_ca,z | includes supply path volume |
| 5-8 | Hot-aisle/return air temperature, pods 1-4 | T_ha,z | includes return plenum |
| 9-12 | Lumped IT-equipment (server solid) temperature, pods 1-4 | T_it,z | gives ride-through and fan-ramp dynamics |
| 13-16 | CRAH leaving-air temperature (coil lag), per pod group | T_la,z | per-unit availability and commands stay algebraic |
| 17 | Building structure (slab, walls, ceiling) temperature | T_s | hours-scale slow mode |
| 18 | Hall humidity ratio | W_r | for dew-point limits, condensation and humidity events |
| 19 | CHW supply header temperature | T_chws | piping + buffer volume |
| 20 | CHW return header temperature | T_chwr | |
| 21 | CHW storage tank temperature (optional, ride-through) | T_tk | stratification ignored in Level 2 |
| 22-24 | Chiller loading fraction (ramp-limited), chillers 1-3 | PLR_j | plus discrete on/off/restart timers |
| 25 | Cooling-tower basin (condenser supply) temperature | T_cws | |
| 26 | UPS battery state of charge | SOC | for utility-outage scenarios |
| 27 | AI pod: TCS supply manifold temperature | T_tcs,s | Act 3 |
| 28 | AI pod: TCS return temperature (coolant + cold-plate mass) | T_tcs,r | Act 3 |
| 29 | AI pod: lumped accelerator junction temperature | T_j | Act 3, seconds-scale |
| 30 | AI pod: facility-water (FWS) supply temperature | T_fws | Act 3 |
| 31 | Sensor states (bias/drift random walks), one per faulted sensor | b_k | measurement layer only |

Level 1 drops 18, 21, 26-31 (about 21 states). Discrete states (not counted): economizer mode, chiller on/off/restart countdown, unit availabilities, generator state, alarms.

### 3.4 Inputs, actions, outputs

- **Disturbances**: outdoor dry-bulb T_oa and humidity (dew point or RH, giving wet-bulb T_wb and humidity ratio W_oa), optional solar; IT power per pod P_IT,z(t) (services with daily/weekly cycles plus training jobs as long flat blocks; hyperscale utilization about 50%, training duty about 80%, inference about 40% [shehabi2024-us-dc-energy]); grid carbon intensity and price; utility availability.
- **Actions** (learner/controller): supply-air setpoint or valve commands, containment-ΔP setpoint or fan speeds, CHWS setpoint, condenser-water approach setpoint or tower fan speed, economizer mode request, chiller staging request (advanced), FWS/TCS setpoint (Act 3), IT power cap or deferral of flexible jobs (advanced).
- **Outputs**: synthetic sensor vector (3.9), PUE(t), cumulative PUE, WUE, CUE, constraint violations (inlet above 27 °C recommended and 32 °C A1 allowable, dew point outside -9 to 15 °C), RCI_HI, RTI, SHI, throttled IT power.

### 3.5 Equations

Constants: air density ρ_a = p/(R_a T) (about 1.13 kg/m³ at 400 m elevation and 30 °C), c_pa = 1006 J/(kg·K); water ρ_w = 998 kg/m³, c_pw = 4186 J/(kg·K); propylene glycol 25% (PG25) about 1020 kg/m³ and 3.9 kJ/(kg·K) [U].

**(a) IT load and server airflow (per pod z).** Following the EnergyPlus ITE structure [energyplus96-eng-ref-ite]:

- P_IT,z = P_srv,z + P_sfan,z, where P_srv,z = P_cap,z·[p_idle + (1 - p_idle)·u_z(t)] with p_idle = 0.35 [U], and u_z is utilization.
- Server fans speed up with inlet temperature: g(T_in) = 1 + k_g·max(0, T_in - T_ramp), with T_ramp = 25 °C and k_g = 0.033 K⁻¹ [derived: the femp2024 statement that fan power more than doubles between 25 and 32.8 °C, with power proportional to g³].
- P_sfan,z = f_sfan·P_cap,z·g³ (f_sfan = 0.04 [U]). This power is inside the IT boundary, so warmer inlets can lower PUE while raising total energy, a deliberate trap for the RL reward.
- Server airflow V_srv,z = v_kW·P_IT,z·g(T_in,z), with v_kW = 0.075 m³/s per kW [derived].

**(b) Airflow balance and containment.**

- CRAH supply V_sup,z = Σ_{i in z} a_i·s_i·V_crah,d, with availability a_i in {0,1} and fan speed s_i in [s_min, 1].
- Net flow V_net = V_sup - V_srv; bypass V_byp = max(V_net, 0); recirculation V_rec = max(-V_net, 0).
- Leakage exchange through imperfect containment: V_x = r_0·V_srv in both directions (r_0 = 0.03 contained, 0.15 open hall) [U].
- Containment pressure ΔP_ca-ha = sign(V_net)·(ρ_a/2)·(V_net/(C_d A_leak))². Cold-aisle over-pressure is the variable Google and Meta regulate to keep exhaust from recirculating. [lazic2018-dc-cooling-mpc] [meta2024-sim-rl-dc-cooling]

**(c) Air-node energy balances** (well-mixed nodes, as in Schneider's outage model [schneider-wp179-cooling-outage-temp-rise]):

- Cold aisle: C_ca dT_ca/dt = ρ_a c_pa [V_sup (T_sa - T_ca) + (V_rec + V_x)(T_ha - T_ca)] + hA_ca (T_s - T_ca)
- IT mass: C_it dT_it/dt = P_IT,air - Q_srv, with Q_srv = ε_srv ρ_a c_pa V_srv (T_it - T_in) and T_in = T_ca
- Server exhaust: T_out = T_in + Q_srv/(ρ_a c_pa V_srv) (in steady state this reduces to EnergyPlus's T_out = T_in + Q/(ρ c_p V) [energyplus96-eng-ref-ite])
- Hot aisle: C_ha dT_ha/dt = ρ_a c_pa [V_srv (T_out - T_ha) + (V_byp + V_x)(T_ca - T_ha)] + hA_ha (T_s - T_ha) + Q_resid
- Structure: C_s dT_s/dt = Σ_z [hA_ca (T_ca,z - T_s) + hA_ha (T_ha,z - T_s)] + UA_env (T_oa - T_s)
- Hot-spot output for sensors and RCI: T_in,top,z = T_ca,z + β·(T_ha,z - T_ca,z)·(V_rec,z + V_x,z)/V_srv,z, with β about 1-2 [U]. Per-rack synthetic sensors add fixed position offsets φ_k (drawn once per sensor) so RCI has a realistic spread.
- Index outputs: SHI = (T_in - T_sa)/(T_out - T_sa) [energyplus96-eng-ref-ite]; RTI = (T_ha - T_sa)/(T_out - T_in).

**(d) CRAH coil (unit i in pod z)**, effectiveness-NTU, sensible (dry coil):

- Air capacity rate C_a = ρ_a a_i s_i V_crah,d c_pa; water C_w = m_w,i c_pw, with m_w,i = m_w,d·Φ(v_i) for valve opening v_i (equal-percentage Φ(v) = R^(v-1), R = 50) [U].
- UA_i = f_foul,i·UA_d / [x_a (m_a/m_a,d)^-0.6 + (1 - x_a)(m_w/m_w,d)^-0.8], x_a = 0.7 [U, standard practice].
- NTU = UA_i/C_min; C_r = C_min/C_max; ε = [1 - exp(-NTU(1 - C_r))]/[1 - C_r exp(-NTU(1 - C_r))] (ε = NTU/(1+NTU) when C_r = 1).
- Q_coil,i = ε C_min (T_ha,z - T_chws); steady leaving air T_la,ss = T_ha - Q_coil/C_a; leaving water T_lw,i = T_chws + Q_coil/C_w.
- Coil and water-in-coil lag (per pod group): dT_la,z/dt = (T_la,ss,z - T_la,z)/τ_coil, τ_coil = 60 s [U].
- Fan heat enters the air stream: T_sa,i = T_la,i + P_fan,i/C_a.
- Fan power by affinity law: P_fan,i = P_fan,d s_i^n_fan, with n_fan = 2.7 (ideal 3) [femp2024-dc-best-practices for the cube law; exponent U].
- Optional latent removal (Level 2): if coil surface temperature (approximated by T_chws + 0.3(T_ha - T_chws)) is below the return dew point, remove moisture m_cond = m_a (W_r - W_sat(T_surf))(1 - BF) with bypass factor BF = 0.1-0.2 [U]. Designs with CHWS above 10 °C normally stay dry. [femp2024-dc-best-practices]

**(e) Hall humidity.** M_air dW_r/dt = Σ (moisture sources) - Σ m_cond + infiltration m_inf (W_oa - W_r). Dew point from W_r and pressure via standard psychrometrics. [psychrolib] (unverified)

**(f) Chilled-water loop** (primary-only variable flow):

- Plant flow m_chw = Σ_i m_w,i (+ minimum-flow bypass when below chiller minimum).
- Return header: C_chwr dT_chwr/dt = Σ_i m_w,i c_pw (T_lw,i - T_chwr) + m_byp c_pw (T_chws - T_chwr).
- WSE (series, upstream of chillers) when enabled: T_hx,out = T_chwr - ε_hx (T_chwr - T_cws), with ε_hx set so the design approach is 1.5 K. [femp2024-dc-best-practices]
- Chillers then trim to the setpoint: requested Q_req = m_chw c_pw max(0, T_ch,in - T_chws,sp) shared equally among running chillers; available Q_avail = Σ_on Q_ref·CAPFT. If Q_req > Q_avail the plant leaving temperature floats above setpoint.
- Supply header: C_chws dT_chws/dt = m_chw c_pw (T_plant,out - T_chws) (plus tank exchange when the tank is in the circuit).
- Chiller loading PLR_j follows Q_req,j/Q_ref with a ramp limit (about 10% per minute [U]); trips set availability to 0; restarts take 10-15 minutes (4-5 for fast-restart machines). [schneider-wp179-cooling-outage-temp-rise]

**(g) Chiller power, three fidelity options.**

- Level 1, Carnot fraction: COP = η_C·T_evap/(T_cond - T_evap)·f_PLR(PLR), with T_evap = T_chws - 1.5 K and T_cond = T_cw,leaving + 1.5 K (absolute temperatures), η_C = 0.55 [U]. Check: at CHWS 16 °C and condenser water leaving 30 °C, the Carnot COP is about 16.9 and the model gives about 9.3, which is plausible for a modern low-lift chiller. [derived, U]
- Level 2a, DOE-2/EnergyPlus EIR model: P = (Q_avail/COP_ref)·EIRFT(T_chws, T_cw,in)·EIRFPLR(PLR), with CAPFT and EIRFT biquadratic in leaving chilled-water and entering condenser temperature and EIRFPLR quadratic in part-load ratio. [energyplus96-eng-ref-chillers] Use a published EnergyPlus dataset curve for a variable-speed centrifugal chiller; illustrative EIRFPLR = 0.20 + 0.20 PLR + 0.60 PLR² [U].
- Level 2b, Gordon-Ng thermodynamic model (best for FDD lessons because its three parameters are physical): in the commonly used simplified form, (T_chw,in/T_cw,in)(1 + 1/COP) - 1 = a_1 (T_chw,in/Q_e) + a_2 (T_cw,in - T_chw,in)/(T_cw,in Q_e) + a_3 (1 + 1/COP) Q_e/T_cw,in, with absolute temperatures. a_1 relates to internal entropy generation, a_2 to heat leaks, a_3 to heat-exchanger resistance. It is linear in the parameters, so the learner can fit it by least squares and watch a_3 drift as tubes foul. Confirm the exact variable conventions in the papers. [gordon-ng-chua1995-centrifugal-chillers] [gordon-ng1995-universal-chiller-model]
- Condenser heat Q_cond = Σ_j (Q_e,j + P_ch,j).
- Sensitivity check to expect: about 3.5% chiller power per 1 K of CHWS change. [schneider-wp179-cooling-outage-temp-rise]

**(h) Condenser-water loop and cooling towers.**

- Water returning to the towers: T_cwr = T_cws + (Q_cond + Q_hx)/(m_cw c_pw).
- Level 1 approach curve: tower leaving water T_ct,out = T_wb + A(·), with A = A_d·(Q_rej/Q_rej,d)^0.7·max(s_ct, 0.2)^-0.7, A_d = 3.5 K at design [U]. Fan off: free convection gives small capacity (about 10%) [U].
- Level 2: Merkel/effectiveness-NTU tower or EnergyPlus's CoolTools/YorkCalc approach correlations (35 terms, inputs: wet-bulb, range, water-flow ratio, air-flow ratio). [energyplus96-eng-ref-cooling-towers]
- Dry (hybrid) mode: T_ct,out = T_oa + A_dry, A_dry = 8 K at design airflow [U]; no evaporation. [microsoft2026-water-blog] for the hybrid concept.
- Basin: C_basin dT_cws/dt = m_cw c_pw (T_ct,out - T_cws) + Q_basin,heater (winter).
- Tower fans: P_ct = Σ_cells P_ct,d s_ct³ (VFD). Chiller minimum entering condenser temperature T_cws,min = 15 °C is enforced with a tower bypass [U].
- Water: evaporation m_evap = f_lat Q_rej/h_fg (f_lat = 0.85 [U], h_fg = 2.43 MJ/kg); blowdown m_bd = m_evap/(CoC - 1) with CoC = 3 [aws-cloud-sustainability-page]; drift m_dr = 2e-5·m_cw [U]; makeup = evaporation + blowdown + drift. EnergyPlus models the same three components. [energyplus96-eng-ref-cooling-towers]

**(i) Pumps.** P_pump = ρ_w g H V/(η_p η_m η_vfd), with system curve H = H_sp + k_sys V² for loops held at a remote differential-pressure setpoint (H_sp about 8 m), design heads about 30 m (CHW) and 22 m (CW), overall efficiency about 0.65 [U]. FEMP recommends variable flow with DP setpoint reset. [femp2024-dc-best-practices]

**(j) Electrical chain and losses.**

- UPS module loss: L_u = P_rated,u (a_0 + a_1 ℓ_u + a_2 ℓ_u²), with ℓ_u = P_out,u/P_rated,u and illustrative a_0 = 0.012, a_1 = 0.015, a_2 = 0.008 (gives about 94.6% at 30% load, 95.9% at 50%, 96.6% at 100%) [U; structure from schneider-wp108-large-ups-efficiency]. Eco-mode: L = P_out (1/η_eco - 1), η_eco = 0.985. [schneider-wp108-large-ups-efficiency]
- EnergyPlus applies a similar supply-efficiency-versus-part-load curve to ITE objects, with a fraction of the loss released into the zone. [energyplus96-eng-ref-ite]
- Distribution (PDU, RPP, busway): L_dist = c_dist P_IT, c_dist = 0.01 [U]. Transformers: L_tx = P_nl + P_ll (S/S_rated)², with P_nl = 0.2% and P_ll = 1.0% of rating [U].
- UPS losses and electrical-room heat are cooling loads too (route them to a separate electrical-room cooling term or to the hall). Which mechanical loads sit on UPS is a design choice that matters for outage ride-through. [schneider-wp179-cooling-outage-temp-rise]
- Battery: dSOC/dt = -P_battery/E_batt during outages (5-10 min runtime at full load [U]).

**(k) Metrics computed each step.**

- P_cool = Σ P_ch + P_chw,pump + P_cw,pump + Σ P_ct + Σ P_fan + P_cdu,pump (+ humidifiers).
- P_fac = P_IT + P_cool + L_UPS + L_dist + L_tx + P_misc (lighting, BMS, offices; about 1% of IT [U]).
- PUE(t) = P_fac/P_IT; period PUE = ∫P_fac dt / ∫P_IT dt (energy weighted, like Google's TTM figure [google-dc-pue-page]); pPUE_cooling = (P_IT + P_cool)/P_IT.
- WUE_site = Σ makeup water (L)/Σ IT energy (kWh); also report a consumption-based variant (evaporation + drift only). [femp2024-dc-best-practices] [aws-cloud-sustainability-page]
- CUE = Σ P_fac·CI(t)·Δt / Σ P_IT·Δt. [femp2024-dc-best-practices]
- Plant kW/ton for comparison with FEMP and DeepMind results. [femp2024-dc-best-practices] [gamble-gao2018-safety-first-cooling]

**(l) AI pod, direct-to-chip liquid loop (Act 3).**

- Liquid capture fraction φ_liq = 0.85 (0.80-0.95) of rack power goes to coolant; the rest heats pod air as Q_resid (network and storage stay air cooled [nvidia-dgx-gb200-user-guide]; capture value U).
- TCS flow m_tcs = 1.5 L/min per kW of design rack power. [ocp2023-oai-liquid-cooling-guidelines]
- Two-node TCS loop. Return node (coolant in the cold plates and return manifold) gains chip heat: C_tcs,r dT_tcs,r/dt = m_tcs c_p (T_tcs,s - T_tcs,r) + φ_liq P_IT,pod. The CDU removes Q_cdu = ε_cdu C_min (T_tcs,r - T_fws), with ε_cdu set for a 3 K design approach [U]. Supply node (CDU outlet and supply manifold): C_tcs,s dT_tcs,s/dt = m_tcs c_p (T_tcs,r - T_tcs,s) - Q_cdu.
- Chip: C_j dT_j/dt = P_chip - (T_j - T_tcs,s)/(R_jc + R_cp), with R_cp = 0.018 K/W per 1 kW device at design flow, rising roughly as (m/m_d)^-0.5 at low flow [ocp2023-oai-liquid-cooling-guidelines for the value; flow exponent U], R_jc = 0.015 K/W and C_j giving τ of 5-20 s [U].
- Throttling: if T_j > T_throttle (about 88 °C [U]) the chip power drops (simulate as a proportional cap), which reduces delivered compute; RL reward should charge for lost throughput.
- FWS: from a dedicated plate HX on the tower loop or dry coolers (W32: supply at most 32 °C [femp2024-dc-best-practices]); C_fws dT_fws/dt = Q_cdu - Q_rejection,fws.
- CDU pumps: about 1% of pod IT power [derived: 2 bar × 0.025 L/s per kW / 0.5 efficiency ≈ 10 W per kW; U], redundant, on UPS (as in Google's design [google2025-1mw-racks-liquid-cooling]).
- Ride-through check: with C_tcs about 5 MJ/K per MW, losing CDU heat rejection heats coolant about 12 K/min [derived], so a pump failure becomes a sub-minute incident.

### 3.6 Parameter table (reference Hall A)

| Symbol | Meaning | Default | Range | Units | Source / basis |
|---|---|---|---|---|---|
| N_pod | pods (contained zones) | 4 | 1-8 | - | [U] |
| P_cap,z | design IT per pod | 1.2 | 0.5-2 | MW | [U]; density per [uptime2026-global-survey] |
| p_idle | idle fraction of server power | 0.35 | 0.2-0.5 | - | [U] |
| v_kW | server airflow per kW | 0.075 | 0.055-0.11 | m³/s/kW | [derived]; ΔT range [femp2024-dc-best-practices]; 125 cfm/kW in [schneider-wp179-cooling-outage-temp-rise] |
| T_ramp, k_g | server fan ramp start, slope | 25, 0.033 | 24-27, 0.02-0.05 | °C, 1/K | [derived from femp2024-dc-best-practices] |
| f_sfan | server fan share at nominal | 0.04 | 0.02-0.08 | - | [U] |
| r_0 | leakage exchange fraction | 0.03 | 0.01-0.05 contained; 0.1-0.3 open | - | [U] |
| C_d A_leak | containment leakage area (per pod) | 4 | 2-8 | m² | [U]; gives about 3 Pa at 10% excess air |
| ΔP_sp | containment over-pressure setpoint | 3 | 1-5 | Pa | [U]; concept from [lazic2018-dc-cooling-mpc] [meta2024-sim-rl-dc-cooling] |
| V_ca, V_ha | air volumes per pod | 1,000, 2,000 | 500-4,000 | m³ | [U] |
| m_air | capacity multiplier for light fixtures in air nodes | 2 | 1-4 | - | [U] |
| C_it | server thermal mass | 13.6 | 5-35 | kJ/K per kW IT | [derived: 545 kg rack mass from the schneider-wp179-cooling-outage-temp-rise example, half thermally active at 500 J/(kg·K), applied to a 10 kW rack; gives a server time constant of about 3 min] |
| ε_srv | server internal heat-transfer effectiveness | 0.8 | 0.6-0.95 | - | [U] |
| hA_ca, hA_ha | air-structure conductance per pod | 10 | 5-30 | kW/K | [U] |
| C_s | active structure capacitance (hall) | 0.6 | 0.2-2 | GJ/K | [U]; gives a 4-8 h time constant |
| UA_env | envelope conductance | 10 | 5-20 | kW/K | [U] |
| N_crah | CRAH units per pod | 4 (3+1) | | - | [U] |
| V_crah,d | design airflow per CRAH | 28.6 (60,600 cfm) | 10-40 | m³/s | [derived: 0.4 MW at 12 K] |
| UA_d | design coil UA per CRAH | 47 | 30-70 | kW/K | [derived for ε ≈ 0.6 at C_r ≈ 0.83] |
| x_a | air-side share of coil resistance | 0.7 | 0.5-0.8 | - | [U] |
| τ_coil | coil response time constant | 60 | 30-120 | s | [U] |
| P_fan,d | CRAH fan power at full speed | 30 (0.5 W/cfm) | 30-75 (0.5-1.25 W/cfm) | kW/unit | [femp2024-dc-best-practices] |
| n_fan | fan affinity exponent | 2.7 | 2.5-3.0 | - | [femp2024-dc-best-practices] (cube law) / [U] |
| s_min | minimum fan speed | 0.3 | 0.2-0.4 | - | [U] |
| T_sa,sp | supply-air setpoint | 24 | 18-27 | °C | [femp2024-dc-best-practices] |
| T_chws,sp | CHW supply setpoint | 16 | 7-20 | °C | [femp2024-dc-best-practices] (>10 °C); [U] |
| ΔT_chw,d | design CHW range | 10 | 6-12 | K | [U] |
| V_chws, V_chwr | header/piping volumes | 40 each | 15-100 | m³ | [U] |
| V_tk | CHW storage tank | 0 (off) / 300 | 0-1,000 | m³ | [schneider-wp179-cooling-outage-temp-rise] gives required storage by density |
| N_ch, Q_ref | chillers, capacity each | 3, 2.8 | | -, MW | [U] (N+1) |
| COP_ref | rated COP (AHRI-like conditions) | 6.5 | 5.5-7.5 | - | [U] |
| η_C | Carnot fraction (Level 1) | 0.55 | 0.45-0.7 | - | [U] |
| PLR_min | minimum chiller load before cycling | 0.15 | 0.1-0.3 | - | [U] |
| t_restart | chiller restart delay | 12 | 4-15 | min | [schneider-wp179-cooling-outage-temp-rise] |
| t_min,on/off | anti-short-cycle timers | 15 | 5-30 | min | [U] |
| ε_hx | WSE plate HX effectiveness (1.5 K design approach) | 0.85 | 0.7-0.92 | - | [femp2024-dc-best-practices] / [U] |
| T_wb,d | tower design wet-bulb (inland PNW) | 20 | 18-22 | °C | [U]; compute from TMYx in M21 |
| Range_d, A_d | tower design range, approach | 10, 3.5 | 8-12, 2.8-3.9 | K | [femp2024-dc-best-practices] for approach |
| P_ct,d | tower fan power per cell (4 cells) | 12 | 8-20 | kW | [U] |
| A_dry | dry-mode approach to dry-bulb | 8 | 5-12 | K | [U] |
| V_basin | basin volume | 100 | 50-200 | m³ | [U] |
| CoC | cycles of concentration | 3 | 2-6 | - | [aws-cloud-sustainability-page] |
| f_lat | latent share of tower heat rejection | 0.85 | 0.7-0.95 | - | [U] |
| T_cws,min | chiller minimum entering condenser water | 15 | 12-18 | °C | [U] |
| m_chw,d / H_chw | CHW design flow / head | 134 / 30 | | kg/s / m | [derived] / [U] |
| m_cw,d / H_cw | CW design flow / head | 155 / 22 | | kg/s / m | [derived] / [U] |
| η_pump,tot | pump wire-to-water efficiency | 0.65 | 0.5-0.75 | - | [U] |
| a_0, a_1, a_2 | UPS loss coefficients (per unit of rating) | 0.012, 0.015, 0.008 | ±50% | - | [U]; structure [schneider-wp108-large-ups-efficiency] |
| η_eco | UPS eco-mode efficiency | 0.985 | 0.98-0.99 | - | [schneider-wp108-large-ups-efficiency] |
| c_dist | PDU/busway loss fraction | 0.01 | 0.005-0.02 | - | [U] |
| P_nl, P_ll | transformer no-load / full-load losses | 0.2%, 1.0% | 0.1-0.3%, 0.7-1.5% | of rating | [U] |
| t_gen | generator start and transfer | 60 | 10-60 | s | [schneider-wp179-cooling-outage-temp-rise] |
| E_batt | UPS battery runtime at full load | 7 | 5-10 | min | [U] |
| P_misc | lighting/BMS/offices | 1% | 0.5-2% | of IT | [U] |
| AI pod racks × kW | Act 3 | 8 × 130 | 120-140 kW/rack | - | [nvidia-dgx-gb200-user-guide] |
| φ_liq | liquid capture fraction | 0.85 | 0.8-0.95 | - | [U] |
| q_tcs | TCS flow per kW | 1.5 | 1.25-2.0 | L/min/kW | [ocp2023-oai-liquid-cooling-guidelines] |
| T_tcs,s,sp | TCS supply setpoint | 35 | 30-45 | °C | [ocp2023-oai-liquid-cooling-guidelines] |
| ΔT_cdu | CDU approach at design | 3 | 2-6 | K | [U] |
| R_cp | cold-plate resistance, case to inlet (1 kW device) | 0.018 | 0.015-0.03 | K/W | [ocp2023-oai-liquid-cooling-guidelines] |
| R_jc, T_throttle | junction-to-case resistance, throttle threshold | 0.015, 88 | 0.01-0.03, 83-95 | K/W, °C | [U] (vendor specific) |
| C_tcs | coolant + cold-plate capacitance | 5 | 2-10 | MJ/K per MW | [U] |
| P_cdu,pump | CDU pump power | 1% | 0.5-2% | of pod IT | [derived, U] |

### 3.7 Control loops (the baseline "BMS v1" the learner later beats)

| Loop | Measured variable | Manipulated variable | Default setpoint / logic | Rate | Basis |
|---|---|---|---|---|---|
| L1 supply-air temperature | CRAH leaving/supply air (or median cold-aisle temp) | CHW valve per unit | 24 °C; PI with anti-windup | 10-30 s | per-AHU PID on leaving air in [lazic2018-dc-cooling-mpc] |
| L2 airflow / pressurization | cold-to-hot-aisle ΔP | CRAH fan speeds (all units in pod run together) | 3 Pa; PI; floor s_min | 10-30 s | [lazic2018-dc-cooling-mpc] [meta2024-sim-rl-dc-cooling] |
| L3 CHW pumping | remote coil ΔP | pump VFD speed | DP setpoint with reset from most-open valve | 10-30 s | [femp2024-dc-best-practices] |
| L4 CHWS reset | valve positions, max inlet temp | CHWS setpoint | raise 0.5 K every 10 min if all valves < 85% and inlets have margin; lower if any valve > 95% | 5-15 min | reset concept [femp2024-dc-best-practices]; thresholds [U] |
| L5 chiller staging | plant PLR, CHWS error | number of chillers on | stage up if PLR > 0.9 or CHWS > sp + 1 K for 10 min; stage down if PLR < 0.4 for 15 min; restart 12 min; lead/lag rotation | 1 min | [U]; restart [schneider-wp179-cooling-outage-temp-rise] |
| L6 condenser water | tower leaving water | tower fan speed, cell staging, bypass | CWS sp = max(T_wb + 3.5 K, T_cws,min) | 30-60 s | approach and reset [femp2024-dc-best-practices] |
| L7 economizer mode | predicted WSE leaving temp, T_wb/T_oa | mode: mechanical / partial WSE / full WSE (/ dry tower) | partial if T_wb + A + ΔT_hx < T_chwr - 1 K; full if predicted WSE leaving ≤ CHWS sp - 0.5 K for 15 min; 1 K hysteresis; 30 min dwell | 1-5 min | concept [femp2024-dc-best-practices]; thresholds [U] |
| L8 humidity | room dew point | humidifier / dehumidify via coil | keep -9 to 15 °C dew point | 5 min | [femp2024-dc-best-practices] |
| L9 DLC (Act 3) | TCS supply temp, TCS ΔP | CDU FWS valve, CDU pump speed | 35 °C; flow 1.5 L/min/kW | 1-5 s | [ocp2023-oai-liquid-cooling-guidelines] |
| L10 supervisory safety | max inlet temp, breaker loading | IT power cap | cap if inlet > 32 °C or circuit > limit | 1 s-1 min | [wu2016-dynamo-fb-power] [zhang2021-flex-zero-reserved-power] |

Safety pattern to copy for the RL module: candidate actions are filtered by model uncertainty, checked against operator limits in the cloud, and re-checked by the local controller, with an operator "exit to BMS" switch. [gamble-gao2018-safety-first-cooling]

### 3.8 Failure-mode table (for injection in Modules 22-23)

| Fault | Injection knob | Physical effect | Sensor signature | Timescale |
|---|---|---|---|---|
| Chiller trip (1 of 3) | a_ch,j = 0, then restart after t_restart | capacity drops; if remaining capacity < load, CHWS floats up | chiller kW and amps to 0, trip alarm; CHWS rises; all CRAH valves open toward 100%; supply air and cold-aisle temps follow; remaining chillers' PLR jumps; ΔT across tripped evaporator to 0 | seconds (trip), minutes (temperatures), 10-15 min (restart) [schneider-wp179-cooling-outage-temp-rise] |
| Utility outage, mechanical loads not on UPS | grid = 0; fans/pumps/chillers off until generator (60 s); chillers restart after 12 min | no airflow and no CHW circulation for 1 min, then airflow but warming water until chillers return | room temps spike several K in the first minute (up to about 5 K/min), recover partly when fans return, climb as loop water warms, peak around chiller restart; UPS on battery, SOC falls; generator status | 1-20 min [schneider-wp179-cooling-outage-temp-rise] |
| CRAH fan failure | a_i = 0 | pod airflow falls; other units ramp; if they saturate, ΔP falls and recirculation rises | fan status/VFD fault, unit airflow and kW to 0; neighbours' speed and kW up (cubic); pod ΔP down; inlet-temperature spread and top-of-rack temps up; RTI rises above 100% | seconds to minutes |
| Fouled coil (gradual) | f_foul,i ramps 1.0 -> 0.6 over weeks | UA falls; same duty needs more water flow and a larger valve opening | valve position drifts up for the same load; coil approach (supply air minus CHWS) widens; CHW ΔT shrinks ("low ΔT syndrome"); pump power up; at peak load supply air cannot reach setpoint | weeks to months |
| Stuck valve | v_i,actual = constant (open or closed) | closed: unit gives airflow but no cooling; open: overcooling and low CHW ΔT | command vs feedback mismatch; supply air unresponsive; PI output saturates (integrator wind-up); stuck-closed unit's supply air ≈ return air | immediate |
| Sensor bias | y = x + b | controller drives the true value off setpoint (a supply-air sensor reading 2 K low makes air 2 K warmer) | disagreement with redundant sensors; air-side vs water-side energy balance mismatch (Q_air ≠ Q_water); residual vs model | step |
| Sensor drift | y = x + δ·t or random walk | slow mis-control; humidity sensors are notorious for drift [femp2024-dc-best-practices] | slowly growing residual; seasonal-looking trend not explained by weather or load | weeks |
| Sensor stuck-at / dropout | y = y(t0) or NaN | controller sees no change; may wind up | zero variance, flat line, repeated values, gaps; correlation with neighbours collapses | immediate |
| Cooling-tower degradation (fill scale, fan belt slip, nozzle clogging) | A_d += ΔA (1-3 K) or NTU × 0.7 | warmer condenser water; higher chiller lift; fewer economizer hours | approach residual (CWS minus T_wb at given load and fan speed) trends up; tower fans at 100% more often; chiller kW/ton up about 2-4% per K [U] | weeks to months |
| Heat wave | weather scenario (e.g., late-June 2021 Pacific Northwest heat dome) | WSE unavailable, high lift, tower capacity limits, possible chiller capacity derate; envelope load up | PUE up; CWS high; all chillers on; valve and fan saturation; inlet temps creep toward 27 °C then 32 °C | days |
| High-humidity / wet-bulb event | high outdoor dew point (or airside-economizer intake) | tower approach to wet-bulb worsens; room dew point can approach coil temperature | room dew point/RH up; coil condensate appears (latent load); CRAH capacity for sensible cooling drops | hours |
| Containment breach (door propped, blanking panels missing) | r_0 from 0.03 to 0.2 | more recirculation and bypass | inlet temps up while CRAH return temp falls; SHI and RTI move away from ideal; fans speed up to restore ΔP | immediate |
| CHW or CDU pump failure | pump availability 0; standby starts after 5-30 s [U] | flow loss; in the AI pod, coolant heats about 12 K/min [derived] | flow and ΔP collapse; TCS return temp and GPU temps spike within tens of seconds; throttling reduces IT power | seconds |
| Tower freeze risk (inland winters) | T_oa < -10 °C, low load | basin and fill icing; minimum CW temperature control | tower fans off and bypass open; basin heater kW; CWS pinned at minimum | hours |
| IT load surge or training-job start | step in P_IT,z | sudden heat step | step in UPS output and pod power, then temperature transients | seconds |

### 3.9 Sensor list and sampling (synthetic BMS/DCIM points)

| Point | Where | Count (Hall A) | Typical sampling | Noise / accuracy default | Notes |
|---|---|---|---|---|---|
| Rack inlet temperature (top/middle/bottom) | front of racks | ~3 per 4 racks (~360) | 1 min (DCIM), 5 min snapshot for ML | ±0.3 K, plus position offsets | basis for RCI; server onboard inlet sensors are an alternative [femp2024-dc-best-practices] |
| Cold-aisle temperature (CAT) groups, hot-aisle temperature | aisles | 8 per pod | 1 min | ±0.3 K | medians used for control [lazic2018-dc-cooling-mpc] |
| Cold-to-hot-aisle differential pressure | containment | 2-4 per pod | 10 s-1 min | ±0.5 Pa | [lazic2018-dc-cooling-mpc] |
| CRAH entering/leaving air temp, fan speed, fan kW, valve command/feedback, airflow | each unit | 16 units × 6 | 10 s-1 min | ±0.3 K; ±2% | [lazic2018-dc-cooling-mpc] (EAT, LAT) |
| CHW supply/return temps, flow, ΔP | plant and headers | ~10 | 10 s-1 min | matched pair ±0.1-0.3 K; magnetic or ultrasonic flow ±1% | FEMP: ±0.8 K (1.5 °F) sensors are useless for a 2.8 K (5 °F) ΔT [femp2024-dc-best-practices] |
| Chiller: kW, % load, CHW in/out, CW in/out, refrigerant pressures/saturation temps, approaches, alarms | each chiller | 3 × ~12 | 1 min | ±1% kW | Gordon-Ng fitting and FDD |
| Tower: CW in/out, fan speed/kW, basin temp, makeup and blowdown flow | each cell | 4 × ~6 | 1 min (water totals 15 min) | ±1% | WUE accounting |
| Weather: dry-bulb, RH or dew point, wet-bulb (computed), pressure | roof station | 4 | 1-5 min (hourly from public datasets) | ±0.3 K, ±2-3% RH | |
| Power: utility, transformer, UPS in/out per module, PDU/branch, mechanical loads | electrical rooms | ~60 | 1 s-1 min, true-RMS meters | ±0.5-1% | FEMP: true-RMS three-phase meters [femp2024-dc-best-practices] |
| IT telemetry: server power, CPU/GPU temps, fan RPM, utilization | servers via IPMI/Redfish | aggregated per pod | 10 s-1 min | | |
| AI pod: TCS supply/return temps, flow, ΔP, leak detection, FWS temps, CDU pump status | CDU and manifolds | ~20 | 1-5 s | ±0.2 K | |
| Events: status changes, trips, alarms, mode changes | all | - | event-driven | - | labels for FDD |

The ML observation in Module 23 should mimic Google's practice: a snapshot of all points every 5 minutes. [gamble-gao2018-safety-first-cooling]

### 3.10 Numerics and validation tests

- Integrate air nodes with an exponential (exact-for-linear) update per node using frozen inputs, which is stable at 5 s steps; otherwise RK4 at 1 s. Plant algebra (coils, chillers, towers) is solved explicitly each step from current states (no iteration needed when coil and tower lags are states).
- Test 1, energy closure at steady state: Σ coil duty ≈ P_IT + fan heat + envelope (within 1%).
- Test 2, design point: supply air 24 °C, hot aisle about 36 °C, CHW 16/26 °C; PUE about 1.3 mechanical and about 1.12 full economizer.
- Test 3, Schneider outage replication: a 30 × 24 × 4 m room with 0.6 m plenum, 400 kW, 45 m³/s CRAH flow, CHW 7.2 °C with 8.3 K range, supply 20 °C, generator at 60 s, chiller restart at 12 min should show an early spike, recovery when fans return, a peak near 40 °C around 11 minutes and return below 32 °C about 17 minutes after the event. [schneider-wp179-cooling-outage-temp-rise]
- Test 4, chiller sensitivity about 3.5%/K of CHWS. [schneider-wp179-cooling-outage-temp-rise]
- Test 5, fan affinity: 20% less speed gives about 45-49% less fan power. [femp2024-dc-best-practices]
- Test 6, opening containment (r_0 = 0.2) at constant supply air raises inlet temps by several kelvin and lowers CRAH return temperature.

### 3.11 Hooks into course modules

- **21 (time series)**: forecast pod IT load (daily/weekly cycles plus training-job blocks); forecast PUE from weather; Google's quarterly campus PUE table is a small real series with clear seasonality. [google-dc-pue-page]
- **22 (anomaly detection/FDD)**: inject the faults in 3.8; residuals from the physics model; Gordon-Ng parameter drift; energy-balance sensor validation; compare with LBNL's labeled HVAC fault datasets. [granderson2023-hvac-fault-dataset]
- **23 (RL)**: Gymnasium-style environment; reward = -(price × facility energy + water price × makeup + carbon price × emissions) - penalties (inlets above 27/32 °C, dew-point limits, chiller short-cycling, throttled compute); offline/simulator RL as at Meta [meta2024-sim-rl-dc-cooling]; MPC baseline as at Google [lazic2018-dc-cooling-mpc].
- **24 (optimization, control, PIML, digital twins)**: PI tuning, chiller sequencing, CHWS and CWS reset optimization, system identification from safe exploration [lazic2018-dc-cooling-mpc], grey-box calibration of UA and Gordon-Ng parameters, digital-twin water forecasting as at Meta. [meta2025-sustainability-report]
- **27 (ML system design)**: telemetry pipeline for thousands of points, safety layers and fallback [gamble-gao2018-safety-first-cooling], data quality and sensor health, carbon-aware and demand-response scheduling [radovanovic2023-carbon-aware-computing].

---

## Part 4. Weather inputs and site climate

| Dataset | What it gives | Resolution | License | Source |
|---|---|---|---|---|
| ECCC Historical Climate Data (Canada) | station hourly temperature, dew point, RH, pressure, wind; bulk CSV | hourly, decades | Open Government Licence - Canada (not checked on the page) | [eccc-historical-climate-data] |
| NOAA NCEI Integrated Surface Database (Global Hourly) | hourly and synoptic observations incl. temperature and dew point from 100+ sources | hourly, global | US public domain for US data (not checked; some non-US data carry WMO restrictions) | [noaa-isd-global-hourly] |
| NSRDB (now under the National Laboratory of the Rockies, formerly NREL) | satellite-derived solar plus temperature, dew point, RH, pressure, wind; TMY products; API | 30-60 min, 4 km | CC BY 4.0 | [nsrdb] |
| TMYx EPW files (climate.onebuilding.org) | typical-year EnergyPlus weather files built from ISD through 2023 (2026 release, 17,315 locations) | hourly | not stated in the part of the site I checked | [onebuilding-tmyx] |

Wet-bulb is not always reported: compute it from dry-bulb, dew point (or RH) and station pressure with psychrometric routines [psychrolib] or Stull's approximation for sea-level pressure. [stull2011-wet-bulb] (both unverified)

**Recommended climate for the fictional site.** An inland, semi-arid Pacific Northwest site: the Columbia Plateau (Quincy/Moses Lake or Wenatchee, Washington; The Dalles, Oregon) or the BC Interior (Kamloops, Kelowna, Penticton). These give hot, dry summers with low wet-bulb, cold winters (tower freeze protection, dry-mode hours), and very many economizer hours. Real hyperscale anchors make the story credible: Google's three The Dalles campuses report PUE 1.06-1.10 [google-dc-pue-page], and Microsoft's Quincy, Washington site runs mostly on recycled or non-potable water. [microsoft2026-water-blog] Suggested files: a TMYx file for Moses Lake or Wenatchee (US) or Kamloops (Canada) as the "normal year", and the actual hourly record for late June to early July 2021 (Pacific Northwest heat dome) from ECCC or ISD as the heat-wave incident. Candidate ISD stations by airport code: KMWH (Moses Lake), KEAT (Wenatchee), KDLS (The Dalles), KYKM (Yakima). [U for station codes and climate statistics: have the learner compute design wet-bulb, economizer hours and freeze hours as a Module 21 exercise.]

---

## Part 5. Paywalled or registration-gated references to fetch through the library

Highest priority first:

1. ASHRAE TC 9.9, *Thermal Guidelines for Data Processing Environments*, 5th ed. (2021), ISBN 9781947192645 (another catalog ISBN listed: 9781947192652). Needed for exact humidity limits, H1 class, rate-of-change limits, server power/airflow vs inlet temperature. [ashrae2021-thermal-guidelines-5e]
2. ASHRAE TC 9.9, *Liquid Cooling Guidelines for Datacom Equipment Centers* (2nd ed.; 3rd ed. announced by FEMP 2024). W classes, TCS/FWS design, CDU approach. ISBN not captured. [ashrae-liquid-cooling-guidelines-book]
3. ASHRAE Handbook, HVAC Applications (2023), chapter 20 "Data Centers and Telecommunication Facilities"; plus Handbook Fundamentals (psychrometrics) and HVAC Systems and Equipment (coils, towers, pumps, fans). [ashrae2023-handbook-applications-ch20]
4. Gordon, Ng and Chua (1995), "Centrifugal chillers: thermodynamic modelling and a diagnostic case study", International Journal of Refrigeration, DOI 10.1016/0140-7007(95)96863-2; and Gordon and Ng (1995), International Journal of Heat and Mass Transfer, DOI 10.1016/0017-9310(94)00208-d. [gordon-ng-chua1995-centrifugal-chillers] [gordon-ng1995-universal-chiller-model]
5. Zhang and VanGilder (2011), "Real-Time Data Center Transient Analysis", ASME InterPACK, DOI 10.1115/ipack2011-52088 (the well-mixed outage model behind Schneider WP 179). [zhang-vangilder2011-transient-analysis]
6. Sharma, Bash and Patel (2002), "Dimensionless Parameters for Evaluation of Thermal Design and Performance of Large-scale Data Centers", AIAA, DOI 10.2514/6.2002-3091 (SHI/RHI). [sharma2002-dimensionless-thermal-metrics]
7. Herrlin (2005), Rack Cooling Index, ASHRAE Transactions 111(2) (no DOI). [herrlin2005-rack-cooling-index]
8. ANSI/ASHRAE Standard 90.4 (Energy Standard for Data Centers; mechanical and electrical loss components). [ashrae-90-4-2022]
9. ISO/IEC 30134-2 (PUE) and the companion WUE and CUE parts. [iso-iec-30134-2-pue]
10. Uptime Institute Tier Standard: Topology (free with registration; do not register on the learner's behalf). [uptime-tier-standard-topology]
11. EPRI *Powering Intelligence* 2024 and 2026 (product pages; may require an account). [epri2024-powering-intelligence] [epri2026-powering-intelligence]

Open but not yet read: ASHRAE TC 9.9's free white paper "Emergence and Expansion of Liquid Cooling in Mainstream Data Centers" (2021) [ashrae2021-liquid-cooling-wp]; The Green Grid white papers 49 (PUE), 35 (WUE), 32 (CUE), which need free registration. [tgg2012-wp49-pue] [tgg2011-wp35-wue] [tgg2010-wp32-cue]

---

## Part 6. Gaps and cautions

- Many simulator parameters are engineering estimates ([U]); the most important to calibrate against a library source are coil UA and exponents, chiller curves (use an EnergyPlus dataset chiller), tower approach curves, server fan curves (ASHRAE book) and CDU approach.
- EPRI 2026, Duke 2025, Uptime Tier definitions and The Green Grid metric papers were not read directly.
- Hyperscaler water metrics are not comparable as-is: AWS reports withdrawal per IT kWh, Microsoft reports withdrawal intensity changes per MW, Meta reports annual data-center WUE; Google does not publish a fleet WUE.
- Inland-PNW climate statistics (design wet-bulb, economizer hours, heat-dome peak temperatures at the chosen station) should be computed from the datasets rather than quoted.
