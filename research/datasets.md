# Public datasets for the Hyperscale capstones

Accessed 2026-11-12. "Verified" means I loaded the landing page, README or API record; unverified entries are from memory and flagged. Machine-readable version: `datasets.json`.

## Key finding: no public data-center cooling telemetry
I found no public dataset of full facility telemetry (chillers, CRAHs, supply/return temperatures, PUE) from an operating data center. The closest public pieces are:
- Google PowerData2019: power for 57 power domains in Google data centers, CC-BY 4.0 (power only).
- Backblaze Drive Stats: daily SMART data per drive (includes drive temperature).
- Building HVAC data: BDG2 (meter-level), LBNL FDD (labeled HVAC faults, including chiller plant).
This gap justifies the course's own simulator. The simulator should be calibrated against these sources and validated on BOPTEST-style benchmarks, with the sim-to-real limit stated plainly.

## Recommended core set
| Need | Dataset | License | Verified |
|---|---|---|---|
| Building load forecasting, feature engineering | BDG2 (3,053 meters, 1,636 buildings, hourly 2016-17; 595 MB) | CC BY 4.0 | yes |
| IT power / peak behaviour | Google PowerData2019 | CC-BY 4.0 | yes |
| Workload arrivals incl. LLM serving | Azure Public Dataset (VM + LLM inference traces) | CC BY 4.0 | yes |
| Cluster workload | Google ClusterData2019 | CC-BY 4.0 | yes |
| Hardware failure prediction | Backblaze Drive Stats | cite; no resale of data | yes |
| HVAC FDD ground truth | LBNL FDD datasets (OEDI, DOI 10.25984/1881324) | OEDI public; read page | yes |
| Streaming anomaly demos | NAB (MIT), SKAB (GPL-3.0) | as listed | yes |
| Grid demand / fuel mix | EIA-930 via EIA API | free, API key, ToS | yes |
| Marginal emissions | WattTime API | registration/terms | page yes, terms no |

## Catalog

### Buildings and HVAC
- **BDG2** https://github.com/buds-lab/building-data-genome-project-2 (Zenodo 10.5281/zenodo.3887306). Electricity, chilled water, hot water, steam and irrigation meters, plus metadata and weather. Modules 7, 11, 21, 22. Caveat: not data-center data; many zero runs and gaps. Includes the GEPIII subset (2,380 meters, 1,449 buildings).
- **ASHRAE GEPIII on Kaggle** https://www.kaggle.com/competitions/ashrae-energy-prediction. Kaggle rules page did not render for me, so the terms are unverified. Competition data usually carries competition-only terms; use the CC BY 4.0 BDG2 release for anything redistributed in the course.
- **LBNL FDD datasets** https://data.openei.org/submissions/5763. Faults at multiple severities plus fault-free baselines for RTU, single-duct AHU, dual-duct AHU, VAV box, fan coil, chiller plant, boiler plant; each with PDF documentation and Brick TTL. Modules 22, 26. Caveat: mix of simulation, lab and field; per-dataset conventions differ.
- **ASHRAE RP-1043** (Comstock and Braun, chiller faults). No free official download found; treat as unavailable until the library confirms. Unverified.
- **NREL ComStock/ResStock End-Use Load Profiles** (OEDI). Simulated stock-level load profiles; used by CityLearn v2. Unverified URL and license; likely CC BY 4.0.
- **NREL NSRDB** https://nsrdb.nrel.gov/. Solar/weather features; API key. Unverified.

### Compute and data-center
- **Google cluster-data** https://github.com/google/cluster-data. ClusterData2011, ClusterData2019 (8 cells, May 2019, CC-BY 4.0), PowerData2019 (57 power domains, CC-BY 4.0; the README asks users to join the mailing list and give a reason, and to cite the ASPLOS 2020 paper).
- **Alibaba clusterdata** https://github.com/alibaba/clusterdata. v2017: about 1,300 machines for 12 hours. No license file; read per-trace terms.
- **Azure Public Dataset** https://github.com/Azure/AzurePublicDataset. VM traces, LLM inference traces (Nov 2023, May 2024), multimodal inference (Oct 2024), Copilot coding-agent trace; CC BY 4.0 per GitHub API. Useful as the workload driver for the simulator's IT load.
- **Backblaze Drive Stats** https://www.backblaze.com/cloud-storage/resources/hard-drive-test-data. Quarterly zips (Q2 2026: 2.1 GB zipped, 11.7 GB on disk); Q2 2026 AFR 1.73 percent, lifetime 1.41 percent. Schema changes between quarters; split by drive to avoid leakage.

### Anomaly detection
- **NAB** (MIT), **SKAB** (GPL-3.0), **UCR Anomaly Archive** (unverified download), **NASA C-MAPSS** (unverified URL/terms). See the Wu and Keogh critique in the literature file before using NAB or C-MAPSS for any performance claim.

### Grid, price and carbon
- **EIA-930 / EIA Open Data** https://www.eia.gov/opendata/ (free, registered API key, ToS; reuse policy).
- **WattTime** (co2_moer marginal emissions, lbs/MWh; registration; free scope not verified).
- **Electricity Maps** free tier page did not load for my read; terms unverified. Likely non-redistributable.
- **Open Power System Data**, **CAISO OASIS**, **ERCOT**: public sources, unverified in this pass.

### Maintenance logs / work orders (capstone 2)
I did not verify any public corpus of data-center or HVAC maintenance logs. Lead to check: the UWA NLP-TLP group's MaintNet/MaintIE maintenance work-order resources (https://github.com/nlp-tlp), unverified. Plan on synthetic logs generated from the simulator's injected faults and LBNL fault labels. Use templated text with abbreviations, typos, omitted fields and some wrong technician diagnoses so the LLM eval does not reward trivial matching. IBM's AssetOpsBench (Apache-2.0 code) offers a public scenario/query format to imitate.
