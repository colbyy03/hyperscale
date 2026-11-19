/**
 * Builds the content index from files under content/ and validates it.
 * Used by the Vite plugin (virtual:hyperscale/content) and by scripts/validate-content.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
  buildFrontmatterSchema,
  cardSchema,
  checkpointSchema,
  curriculumSchema,
  exerciseSchema,
  lessonFrontmatterSchema,
  moduleSchema,
  questionItemSchema,
  type ContentIndex,
  type CardContent,
  type CheckpointContent,
  type ExerciseIndexEntry,
  type LessonIndexEntry,
  type BuildIndexEntry,
  type ModuleContent,
  type PoolQuestion,
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
  const cards: Record<string, CardContent & { moduleId: string }> = {};
  const checkpoints: Record<string, CheckpointContent> = {};
  const questions: Record<string, PoolQuestion> = {};
  const concepts: Record<string, { title: string; module?: string }> = {};
  const builds: Record<string, BuildIndexEntry> = {};

  const curriculum = curriculumSchema.safeParse(readJson(path.join(root, "planning", "curriculum.json")));
  if (!curriculum.success) {
    errors.push(`planning/curriculum.json: ${curriculum.error.message}`);
    return { index: { modules, lessons, exercises, cards, checkpoints, questions, concepts, builds }, errors, warnings };
  }
  const known = new Set(curriculum.data.modules.map((m) => m.id));
  const sourceIds = loadSourceIds(root);
  const conceptsFile = path.join(root, "content", "concepts.json");
  const conceptList = fs.existsSync(conceptsFile) ? (readJson(conceptsFile) as Array<{ id: string; title?: string; module?: string }>) : [];
  const conceptIds = new Set<string>(conceptList.map((c) => c.id));
  for (const c of conceptList) concepts[c.id] = { title: c.title ?? c.id, module: c.module };

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

    // cards
    const cardsFile = path.join(modulesDir, dirName, "cards.json");
    if (fs.existsSync(cardsFile)) {
      const raw = readJson(cardsFile);
      if (!Array.isArray(raw)) errors.push(`${rel}/cards.json: must be an array`);
      else
        raw.forEach((c, i) => {
          const parsed = cardSchema.safeParse(c);
          if (!parsed.success) {
            errors.push(`${rel}/cards.json[${i}]: ${parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
            return;
          }
          if (cards[parsed.data.id]) errors.push(`${rel}/cards.json: duplicate card id "${parsed.data.id}"`);
          checkConcepts(`${rel}/cards.json:${parsed.data.id}`, parsed.data.concepts);
          cards[parsed.data.id] = { ...parsed.data, moduleId: dirName };
        });
    }

    // question pool
    const qFile = path.join(modulesDir, dirName, "questions.json");
    if (fs.existsSync(qFile)) {
      const raw = readJson(qFile);
      if (!Array.isArray(raw)) errors.push(`${rel}/questions.json: must be an array`);
      else
        raw.forEach((q, i) => {
          const parsed = questionItemSchema.safeParse(q);
          if (!parsed.success) {
            errors.push(`${rel}/questions.json[${i}]: ${parsed.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
            return;
          }
          const key = `${dirName}/${parsed.data.id}`;
          if (questions[key]) errors.push(`${rel}/questions.json: duplicate question id "${parsed.data.id}"`);
          if (parsed.data.kind === "choice" && parsed.data.answer >= parsed.data.options.length) errors.push(`${rel}/questions.json:${parsed.data.id}: answer index out of range`);
          checkConcepts(`${rel}/questions.json:${parsed.data.id}`, parsed.data.concepts);
          questions[key] = { ...parsed.data, moduleId: dirName, key };
        });
    }

    // checkpoint (exercise references are checked after all modules are read)
    const cpFile = path.join(modulesDir, dirName, "checkpoint.json");
    if (fs.existsSync(cpFile)) {
      const cp = checkpointSchema.safeParse(readJson(cpFile));
      if (!cp.success) errors.push(`${rel}/checkpoint.json: ${cp.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
      else {
        for (const item of [...cp.data.items, ...(cp.data.delayedItems ?? [])]) {
          if (item.kind === "choice" && item.answer >= item.options.length) errors.push(`${rel}/checkpoint.json:${item.id}: answer index out of range`);
          if (item.kind !== "exercise") checkConcepts(`${rel}/checkpoint.json:${item.id}`, item.concepts);
        }
        if (!cp.data.items.some((i) => i.kind === "explain")) errors.push(`${rel}/checkpoint.json: needs at least one "explain" item`);
        if (!cp.data.items.some((i) => (i.kind === "choice" || i.kind === "numeric" || i.kind === "exercise") && i.transfer)) errors.push(`${rel}/checkpoint.json: needs at least one transfer item`);
        checkpoints[dirName] = cp.data;
      }
    }

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
      const source = fs.readFileSync(path.join(lessonDir, file), "utf8");
      const fm = lessonFrontmatterSchema.safeParse(frontmatterOf(source));
      if (!fm.success) {
        errors.push(`${lrel}: frontmatter ${fm.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
        return;
      }
      if (fm.data.id !== `${dirName}/${m[2]}`) errors.push(`${lrel}: id must be "${dirName}/${m[2]}"`);
      checkSources(lrel, fm.data.sources);
      checkConcepts(lrel, fm.data.concepts);
      if (/<Check\b[^>]*\bquestions=/.test(source)) errors.push(`${lrel}: <Check> takes items={[...]} from questions.json, not inline questions`);
      const checks = [...source.matchAll(/<Check\b[^>]*?\bitems=\{\[([^\]]*)\]\}/g)].flatMap((m) => [...(m[1] ?? "").matchAll(/["']([a-z0-9-]+)["']/g)].map((x) => x[1]!));
      lessons.push({ ...fm.data, moduleId: dirName, order: i, file: `/${lrel}`, checks });
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
        for (const need of [`starter.${ext}`, `solution.${ext}`, "tests.py"]) {
          if (!files.includes(need)) errors.push(`${erel}: missing ${need}`);
        }
        if (e.data.language === "sql") {
          if (!files.includes("data.py")) errors.push(`${erel}: SQL exercises need data.py with make_db()`);
          if (!e.data.packages.includes("duckdb")) errors.push(`${erel}: SQL exercises must list "duckdb" in packages`);
        }
      }
      if (e.data.type === "parsons") {
        if (!e.data.parsons) errors.push(`${erel}: a Parsons exercise needs a "parsons" block with its lines`);
        else {
          const dup = e.data.parsons.lines.find((l, i, all) => all.indexOf(l) !== i || e.data.parsons!.distractors.includes(l));
          if (dup) errors.push(`${erel}: Parsons block "${dup.trim()}" appears twice; every block must be unique`);
        }
      }
      checkSources(erel, e.data.sources);
      checkConcepts(erel, e.data.concepts);
      exercises.push({ ...e.data, moduleId: dirName, dir: `/${erel}`, files });
    }
    if (lessonFiles.length === 0) warnings.push(`${rel}: module has no lessons yet`);

    // build brief
    const buildFile = path.join(modulesDir, dirName, "build.mdx");
    if (fs.existsSync(buildFile)) {
      const fm = buildFrontmatterSchema.safeParse(frontmatterOf(fs.readFileSync(buildFile, "utf8")));
      if (!fm.success) errors.push(`${rel}/build.mdx: frontmatter ${fm.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ")}`);
      else {
        checkSources(`${rel}/build.mdx`, fm.data.sources);
        builds[dirName] = { ...fm.data, file: `/${rel}/build.mdx` };
      }
    }
  }

  // cross-references: lesson cards and checkpoint exercises
  for (const l of lessons) {
    for (const c of l.cards) {
      if (!cards[c]) errors.push(`${l.file.slice(1)}: card "${c}" is not defined in a cards.json`);
      else if (cards[c]!.moduleId !== l.moduleId) errors.push(`${l.file.slice(1)}: card "${c}" belongs to module ${cards[c]!.moduleId}`);
    }
  }
  for (const l of lessons) {
    for (const q of l.checks) if (!questions[`${l.moduleId}/${q}`]) errors.push(`${l.file.slice(1)}: <Check> item "${q}" is not in content/modules/${l.moduleId}/questions.json`);
  }
  const exerciseIds = new Set(exercises.map((e) => e.id));
  for (const [mid, cp] of Object.entries(checkpoints)) {
    for (const item of [...cp.items, ...(cp.delayedItems ?? [])]) {
      if (item.kind === "exercise" && !exerciseIds.has(item.id)) errors.push(`content/modules/${mid}/checkpoint.json: unknown exercise "${item.id}"`);
    }
  }
  const enrolled = new Set(lessons.flatMap((l) => l.cards));
  for (const id of Object.keys(cards)) if (!enrolled.has(id)) warnings.push(`card "${id}" is not listed in any lesson's frontmatter, so it never enters the deck`);

  for (const id of known) {
    if (!modules[id]) warnings.push(`module "${id}" has no content folder yet`);
  }
  return { index: { modules, lessons, exercises, cards, checkpoints, questions, concepts, builds }, errors, warnings };
}
