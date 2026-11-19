/** Lazy access to exercise source files (starter, tests, solution) as raw text. */
const loaders = import.meta.glob<string>("/content/modules/*/exercises/*/*.{py,sql,json,csv}", { query: "?raw", import: "default" });

export async function loadExerciseFile(dir: string, name: string): Promise<string | null> {
  const loader = loaders[`${dir}/${name}`];
  return loader ? loader() : null;
}

const STANDARD = new Set(["exercise.json", "starter.py", "starter.sql", "solution.py", "solution.sql", "tests.py"]);

/** Support files written next to the learner's code when grading (data.py, CSVs, ...). */
export function supportFileNames(files: string[]): string[] {
  return files.filter((f) => /\.(py|sql|csv|json)$/.test(f) && !STANDARD.has(f));
}
