import { expect, test } from "@playwright/test";

// Loads the real Pyodide runtime from the CDN, so allow time for the first download.
test.describe.configure({ timeout: 120_000 });

test("a code exercise runs real pytest in the browser", async ({ page }) => {
  await page.goto("/learn/python-mle/vectorization");
  const ex = page.getByTestId("exercise-standardize-columns");
  await expect(ex.getByText("Python ready")).toBeVisible({ timeout: 90_000 });

  // The untouched starter fails with a clear message.
  await ex.getByRole("button", { name: "Check" }).click();
  await expect(ex.getByText("1 of 7 tests pass.")).toBeVisible({ timeout: 30_000 });
  await expect(ex.getByText("NotImplementedError: standardize is not written yet").first()).toBeVisible();

  // A correct solution, loaded as a saved draft, passes everything.
  await page.evaluate(() =>
    localStorage.setItem(
      "hs-draft:python-mle/standardize-columns",
      "import numpy as np\n\ndef standardize(X):\n    X = np.asarray(X, dtype=float)\n    sd = X.std(axis=0)\n    return (X - X.mean(axis=0)) / np.where(sd == 0, 1.0, sd)\n",
    ),
  );
  await page.reload();
  const ex2 = page.getByTestId("exercise-standardize-columns");
  await expect(ex2.getByText("Python ready")).toBeVisible({ timeout: 90_000 });
  await ex2.getByRole("button", { name: "Check" }).click();
  await expect(ex2.getByText("All 7 tests pass.")).toBeVisible({ timeout: 30_000 });
});
