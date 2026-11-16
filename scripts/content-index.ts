/**
 * Builds the content index from files under content/ and validates it.
 * Used by the Vite plugin (virtual:hyperscale/content) and by scripts/validate-content.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
  curriculumSchema,
  exerciseSchema,
  lessonFrontmatterSchema,
  moduleSchema,
  type ContentIndex,
  type ExerciseIndexEntry,
  type LessonIndexEntry,
  type ModuleContent,
} from "../src/content/schema.ts";

export interface BuildResult {
  index: ContentIndex;
  errors: string[];
  warnings: string[];
}

const CODE_TYPES = new Set(["code", "fill-in", "debug", "sql"]);

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function frontmatterOf(source: string): unknown {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  return m ? parseYaml(m[1] ?? "") : undefined;
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/** Source ids (and aliases) from research/sources.json. */
export function loadSourceIds(root: string): Set<string> {
  const file = path.join(root, "research", "sources.json");
  const ids = new Set<string>();
  if (!fs.existsSync(file)) return ids;
  for (const r of readJson(file) as Array<{ id: string; aliases?: string[] }>) {
    ids.add(r.id);
    for (const a of r.aliases ?? []) ids.add(a);
  }
  return ids;
}

export function buildContentIndex(root: string): BuildResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const modules: Record<string, ModuleContent> = {};
  const lessons: LessonIndexEntry[] = [];
  const exercises: ExerciseIndexEntry[] = [];

  const curriculum = curriculumSchema.safeParse(readJson(path.join(root, "planning", "curriculum.json")));
  if (!curriculum.success) {
    errors.push(`planning/curriculum.json: ${curriculum.error.message}`);
    return { index: { modules, lessons, exercises }, errors, warnings };
  }
  const known = new Set(curriculum.data.modules.map((m) => m.id));
  const sourceIds = loadSourceIds(root);
  const conceptsFile = path.join(root, "content", "concepts.json");
  const conceptIds = new Set<string>(
    fs.existsSync(conceptsFile) ? (readJson(conceptsFile) as Array<{ id: string }>).map((c) => c.id) : [],
  );

  const checkSources = (where: string, ids: string[]) => {
    for (const s of ids) if (!sourceIds.has(s)) errors.push(`${where}: unknown source id "${s}" (add it to research/sources.json)`);
  };
  const checkConcepts = (where: string, ids: string[]) => {
    for (const c of ids) if (!conceptIds.has(c)) errors.push(`${where}: unknown concept "${c}" (add it to content/concepts.json)`);
  };

  const modulesDir = path.join(root, "content", "modules");
  for (const dirName of listDirs(modulesDir)) {
    const rel = `content/modules/${dirName}`;
    if (!known.has(dirName)) errors.push(`${rel}: "${dirName}" is not a module id in planning/curriculum.json`);
    const modFile = path.join(modulesDir, dirName, "module.json");
    if (!fs.existsSync(modFile)) {
      errors.push(`${rel}: missing module.json`);
      continue;
    }
    const parsed = moduleSchema.safeParse(readJson(modFile));
    if (!parsed.success) {
      errors.push(`${rel}/module.json: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      continue;
    }
    if (parsed.data.id !== dirName) errors.push(`${rel}/module.json: id "${parsed.data.id}" must equal the folder name`);
    modules[dirName] = parsed.data;
    checkSources(`${rel}/module.json`, parsed.data.sources);
    checkConcepts(`${rel}/module.json`, parsed.data.concepts);

    // lessons
    const lessonDir = path.join(modulesDir, dirName, "lessons");
    const lessonFiles = fs.existsSync(lessonDir) ? fs.readdirSync(lessonDir).filter((f) => f.endsWith(".mdx")).sort() : [];
    lessonFiles.forEach((file, i) => {
      const lrel = `${rel}/lessons/${file}`;
      const m = /^(\d{2})-([a-z0-9-]+)\.mdx$/.exec(file);
      if (!m) {
        errors.push(`${lrel}: file name must look like 01-some-slug.mdx`);
        return;
      }
      const fm = lessonFrontmatterSchema.safeParse(frontmatterOf(fs.readFileSync(path.join(lessonDir, file), "utf8")));
      if (!fm.success) {
        errors.push(`${lrel}: frontmatter ${fm.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
        return;
      }
      if (fm.data.id !== `${dirName}/${m[2]}`) errors.push(`${lrel}: id must be "${dirName}/${m[2]}"`);
      checkSources(lrel, fm.data.sources);
      checkConcepts(lrel, fm.data.concepts);
      lessons.push({ ...fm.data, moduleId: dirName, order: i, file: `/${lrel}` });
    });

    // exercises
    const exDir = path.join(modulesDir, dirName, "exercises");
    for (const ex of listDirs(exDir)) {
      const erel = `${rel}/exercises/${ex}`;
      const exFile = path.join(exDir, ex, "exercise.json");
      if (!fs.existsSync(exFile)) {
        errors.push(`${erel}: missing exercise.json`);
        continue;
      }
      const e = exerciseSchema.safeParse(readJson(exFile));
      if (!e.success) {
        errors.push(`${erel}/exercise.json: ${e.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
        continue;
      }
      if (e.data.id !== `${dirName}/${ex}`) errors.push(`${erel}: id must be "${dirName}/${ex}"`);
      const files = fs.readdirSync(path.join(exDir, ex)).filter((f) => f !== "exercise.json").sort();
      if (CODE_TYPES.has(e.data.type)) {
        const ext = e.data.language === "sql" ? "sql" : "py";
        for (const need of [`starter.${ext}`, `solution.${ext}`, e.data.language === "sql" ? "tests.json" : "tests.py"]) {
          if (!files.includes(need)) errors.push(`${erel}: missing ${need}`);
        }
      }
      checkSources(erel, e.data.sources);
      checkConcepts(erel, e.data.concepts);
      exercises.push({ ...e.data, moduleId: dirName, dir: `/${erel}`, files });
    }
    if (lessonFiles.length === 0) warnings.push(`${rel}: module has no lessons yet`);
  }

  for (const id of known) {
    if (!modules[id]) warnings.push(`module "${id}" has no content folder yet`);
  }
  return { index: { modules, lessons, exercises }, errors, warnings };
}
