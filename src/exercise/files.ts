/** Lazy access to exercise source files (starter, tests, solution) as raw text. */
const loaders = import.meta.glob<string>("/content/modules/*/exercises/*/*.{py,sql,json}", { query: "?raw", import: "default" });

export async function loadExerciseFile(dir: string, name: string): Promise<string | null> {
  const loader = loaders[`${dir}/${name}`];
  return loader ? loader() : null;
}
