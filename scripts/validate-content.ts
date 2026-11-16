/**
 * Validates everything under content/ (schemas, ids, sources, concepts, required files).
 * Exits non-zero on any error so CI and `npm run build` refuse to ship broken content.
 *
 *   npm run validate            # errors fail; warnings are listed (use --quiet to hide them)
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildContentIndex } from "./content-index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const quiet = process.argv.includes("--quiet");
const { index, errors, warnings } = buildContentIndex(root);

const nModules = Object.keys(index.modules).length;
console.log(`content: ${nModules} modules, ${index.lessons.length} lessons, ${index.exercises.length} exercises`);
if (!quiet && warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, 50)) console.log(`  - ${w}`);
  if (warnings.length > 50) console.log(`  ... and ${warnings.length - 50} more`);
}
if (errors.length) {
  console.error(`${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log("content OK");
