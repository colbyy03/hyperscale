/**
 * Content schemas shared by the app, the Vite content plugin and the validation script.
 * Every file under content/ is validated against these before a build can succeed.
 */
import { z } from "zod";

export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case");

/** content/modules/<id>/module.json: teaching metadata for one module. */
export const moduleSchema = z.object({
  id: slug,
  title: z.string().min(3),
  summary: z.string().min(10),
  objectives: z.array(z.string().min(5)).min(1),
  concepts: z.array(slug).default([]),
  facilityUnlock: z.string().optional(),
  incidents: z.array(slug).default([]),
  sources: z.array(z.string()).default([]),
  build: z
    .object({ title: z.string(), summary: z.string() })
    .optional(),
});
export type ModuleContent = z.infer<typeof moduleSchema>;

/** Frontmatter of content/modules/<id>/lessons/NN-slug.mdx. */
export const lessonFrontmatterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, "must look like module-id/lesson-slug"),
  title: z.string().min(3),
  minutes: z.number().int().min(3).max(90),
  concepts: z.array(slug).default([]),
  sources: z.array(z.string()).default([]),
  cards: z.array(slug).default([]),
  summary: z.string().optional(),
});
export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;

export const exerciseTypes = [
  "code",
  "fill-in",
  "debug",
  "predict",
  "derivation",
  "parsons",
  "concept",
  "sql",
  "local",
] as const;

/** content/modules/<id>/exercises/<slug>/exercise.json */
export const exerciseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/),
  type: z.enum(exerciseTypes),
  language: z.enum(["python", "sql", "none"]).default("python"),
  title: z.string().min(3),
  prompt: z.string().min(1),
  concepts: z.array(slug).min(1),
  difficulty: z.number().min(0).max(1).default(0.5),
  minutes: z.number().int().min(1).max(120),
  critical: z.boolean().default(false),
  packages: z.array(z.string()).default([]),
  constraints: z
    .object({
      forbidImports: z.array(z.string()).default([]),
      requireVectorized: z.boolean().default(false),
      timeoutMs: z.number().int().positive().default(10000),
    })
    .default({ forbidImports: [], requireVectorized: false, timeoutMs: 10000 }),
  compare: z.object({ against: z.string(), tolerance: z.number().positive() }).optional(),
  hints: z.array(z.string().min(3)).length(3, "exactly three hint tiers (T1 orient, T2 principle, T3 next step)"),
  misconceptions: z.record(z.string(), z.string()).default({}),
  sources: z.array(z.string()).default([]),
  /** Parsons problems: the solution's lines in order (indentation included) and blocks that don't belong. */
  parsons: z
    .object({
      lines: z.array(z.string().min(1)).min(3),
      distractors: z.array(z.string().min(1)).default([]),
    })
    .optional(),
});
export type ExerciseContent = z.infer<typeof exerciseSchema>;

/** planning/curriculum.json entries (order, hours, MDS overlap): the single source of module order. */
export const curriculumModuleSchema = z.object({
  id: slug,
  title: z.string(),
  brief: z.number().int().nullable(),
  phase: z.number().int().min(1).max(6),
  hours: z.number().positive(),
  mds: z.enum(["teach-fully", "deepen", "accelerate"]).optional(),
  mdsCourses: z.array(z.string()).optional(),
  kind: z.enum(["project", "capstone"]).optional(),
});
export const curriculumSchema = z.object({
  modules: z.array(curriculumModuleSchema).min(1),
  milestones: z.array(z.object({ id: z.string(), after: slug, title: z.string() })),
});
export type CurriculumModule = z.infer<typeof curriculumModuleSchema>;
export type Curriculum = z.infer<typeof curriculumSchema>;

export const cardTypes = ["concept", "equation", "gotcha", "predict", "bug", "derivation", "bridge", "discrimination", "code"] as const;

/** content/modules/<id>/cards.json: spaced-repetition cards (one retrieval target each). */
export const cardSchema = z.object({
  id: slug,
  type: z.enum(cardTypes),
  /** Prompt; supports `code`, **bold** and $math$. */
  front: z.string().min(5),
  back: z.string().min(1),
  concepts: z.array(slug).min(1),
  /** Gate-critical cards are scheduled at higher retention. */
  critical: z.boolean().default(false),
});
export type CardContent = z.infer<typeof cardSchema>;

const questionBase = {
  id: slug,
  prompt: z.string().min(5),
  concepts: z.array(slug).min(1),
  critical: z.boolean().default(false),
  explain: z.string().min(3),
  /** false keeps a question out of mixed practice (diagnostics). */
  practice: z.boolean().optional(),
};
const choiceItem = z.object({ kind: z.literal("choice"), ...questionBase, transfer: z.boolean().default(false), options: z.array(z.string().min(1)).min(2), answer: z.number().int().min(0) });
const numericItem = z.object({ kind: z.literal("numeric"), ...questionBase, transfer: z.boolean().default(false), answer: z.number(), tolerance: z.number().positive().default(0.02), unit: z.string().optional() });
const explainItem = z.object({ kind: z.literal("explain"), ...questionBase, rubric: z.array(z.string().min(3)).length(4) });
const exerciseItem = z.object({ kind: z.literal("exercise"), id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/), critical: z.boolean().default(false), transfer: z.boolean().default(false) });

/** content/modules/<id>/questions.json: the module's question pool (lesson checks and mixed practice). */
export const questionItemSchema = z.discriminatedUnion("kind", [choiceItem, numericItem, explainItem]);
export type QuestionItem = z.infer<typeof questionItemSchema>;

/** One checkpoint item: a question, a self-rated explanation, or a code exercise. */
export const checkpointItemSchema = z.discriminatedUnion("kind", [choiceItem, numericItem, explainItem, exerciseItem]);
export type CheckpointItem = z.infer<typeof checkpointItemSchema>;

/** content/modules/<id>/checkpoint.json: the mastery gate. */
export const checkpointSchema = z.object({
  passThreshold: z.number().min(0.5).max(1).default(0.85),
  delayedThreshold: z.number().min(0.5).max(1).default(0.8),
  /** Modules MDS already covers well allow attempting the gate before the lessons. */
  allowTestOut: z.boolean().default(false),
  items: z.array(checkpointItemSchema).min(4),
  /** Parallel form for the delayed confirmation (3–7 days later); defaults to `items`. */
  delayedItems: z.array(checkpointItemSchema).optional(),
});
export type CheckpointContent = z.infer<typeof checkpointSchema>;

/** content/modules/<id>/build.mdx: the module build's brief (a project done on your own machine). */
export const buildFrontmatterSchema = z.object({
  title: z.string().min(3),
  hours: z.number().positive().max(40),
  sources: z.array(z.string()).default([]),
});
export interface BuildIndexEntry {
  title: string;
  hours: number;
  sources: string[];
  file: string;
}

/** One lesson as listed in the content index (the MDX body itself is loaded lazily). */
export interface LessonIndexEntry extends LessonFrontmatter {
  moduleId: string;
  order: number;
  file: string;
  /** Question-pool ids used by this lesson's <Check items={...}> blocks. */
  checks: string[];
}

/** A pool question as indexed: keyed by "module-id/question-id". */
export type PoolQuestion = QuestionItem & { moduleId: string; key: string };

export interface ExerciseIndexEntry extends ExerciseContent {
  moduleId: string;
  dir: string;
  files: string[];
}

export interface ContentIndex {
  modules: Record<string, ModuleContent>;
  lessons: LessonIndexEntry[];
  exercises: ExerciseIndexEntry[];
  cards: Record<string, CardContent & { moduleId: string }>;
  checkpoints: Record<string, CheckpointContent>;
  questions: Record<string, PoolQuestion>;
  /** content/concepts.json: titles for display. */
  concepts: Record<string, { title: string; module?: string }>;
  /** Module build briefs, by module id. */
  builds: Record<string, BuildIndexEntry>;
}
