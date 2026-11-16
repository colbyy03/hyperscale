/** Campus zones of the fictional Kestrel Ridge site and the modules that unlock them. */
export interface Zone {
  id: string;
  name: string;
  blurb: string;
  modules: string[];
  /** Position on the 12 x 8 blueprint grid. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export const ZONES: Zone[] = [
  { id: "ops-console", name: "Ops Console", blurb: "Telemetry, data tools, the PUE dashboard.", modules: ["induction", "python-mle"], x: 0, y: 0, w: 3, h: 2 },
  { id: "sensor-network", name: "Sensor Network", blurb: "Thermal fields, redundant sensors, state estimation.", modules: ["linear-algebra", "probability-statistics", "information-theory"], x: 3, y: 0, w: 3, h: 2 },
  { id: "energy-desk", name: "Energy Desk", blurb: "Chiller models and day-ahead energy forecasts.", modules: ["calculus-optimization", "linear-models", "project-1"], x: 6, y: 0, w: 3, h: 2 },
  { id: "reliability-center", name: "Reliability Center", blurb: "Evaluation, pipelines, operating modes.", modules: ["model-evaluation", "feature-pipelines", "trees-boosting", "unsupervised"], x: 9, y: 0, w: 3, h: 2 },
  { id: "neural-lab", name: "Neural Lab", blurb: "Your autograd engine and learned plant models.", modules: ["autograd", "training-deep-nets", "pytorch"], x: 0, y: 2, w: 3, h: 2 },
  { id: "grid-desk", name: "Grid Desk", blurb: "Probabilistic load and carbon forecasts.", modules: ["time-series"], x: 3, y: 2, w: 3, h: 2 },
  { id: "planning-office", name: "Planning Office", blurb: "Plant scheduling, capacity and risk.", modules: ["optimization-or", "kernels-knn", "bayesian-uq", "project-2"], x: 6, y: 2, w: 3, h: 2 },
  { id: "fault-center", name: "Fault Detection Center", blurb: "Anomaly detection and diagnosis.", modules: ["anomaly-fdd", "causal"], x: 9, y: 2, w: 3, h: 2 },
  { id: "ops-copilot", name: "Ops Copilot", blurb: "LLM assistant for operators.", modules: ["llm-apps"], x: 0, y: 4, w: 3, h: 2 },
  { id: "platform-team", name: "Platform Team", blurb: "Serving, monitoring, MLOps.", modules: ["ml-system-design", "mlops", "project-3"], x: 3, y: 4, w: 3, h: 2 },
  { id: "ai-pod", name: "AI Pod", blurb: "Liquid-cooled GPU hall; models from scratch.", modules: ["cnn-rnn-attention", "transformers", "llm-training", "inference", "generative", "scaling"], x: 6, y: 4, w: 6, h: 2 },
  { id: "control-room", name: "Plant Control Room", blurb: "MPC and RL control of the cooling plant.", modules: ["rl", "control-piml", "responsible-ai", "capstone-1", "capstone-2"], x: 0, y: 6, w: 12, h: 2 },
];
