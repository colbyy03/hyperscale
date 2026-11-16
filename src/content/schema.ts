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

/** One lesson as listed in the content index (the MDX body itself is loaded lazily). */
export interface LessonIndexEntry extends LessonFrontmatter {
  moduleId: string;
  order: number;
  file: string;
}

export interface ExerciseIndexEntry extends ExerciseContent {
  moduleId: string;
  dir: string;
  files: string[];
}

export interface ContentIndex {
  modules: Record<string, ModuleContent>;
  lessons: LessonIndexEntry[];
  exercises: ExerciseIndexEntry[];
}
