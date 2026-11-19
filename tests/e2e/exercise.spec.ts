import { expect, test } from "@playwright/test";

// Loads the real Pyodide runtime from the CDN, so allow time for the first download.
test.describe.configure({ timeout: 120_000 });

test("a code exercise runs real pytest in the browser", async ({ page }) => {
  await page.goto("/learn/python-mle/vectorization");
  // Module 1 is locked until the Induction gate is passed; look ahead anyway.
  await page.getByRole("button", { name: "Open anyway" }).click();
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

test("a Parsons problem is assembled by tapping and graded by real tests", async ({ page }) => {
  await page.goto("/learn/python-mle/memory-model");
  await page.getByRole("button", { name: "Open anyway" }).click();
  const ex = page.getByTestId("exercise-rolling-window");
  for (const line of ["import numpy as np", "from numpy.lib.stride_tricks import sliding_window_view", "def rolling_mean(x, k):", "windows = sliding_window_view(x, k)", "return windows.mean(axis=-1)"]) {
    await ex.getByTestId("parsons-pool").getByRole("button", { name: `Add line: ${line}` }).click();
  }
  await expect(ex.getByTestId("parsons-answer").getByRole("listitem")).toHaveCount(5);
  await ex.getByRole("button", { name: "Check" }).click();
  await expect(ex.getByRole("status")).toHaveText(/All tests pass/, { timeout: 90_000 });
});

test("a derivation is graded step by step, accepting equivalent forms and naming slips", async ({ page }) => {
  await page.goto("/learn/linear-algebra/least-squares");
  await page.getByRole("button", { name: "Open anyway" }).click();
  const ex = page.getByTestId("exercise-normal-equations");
  await ex.getByRole("textbox", { name: "Step 1" }).fill("y - X @ w");
  await ex.getByRole("textbox", { name: "Step 2" }).fill("X.T @ y - X.T @ X @ w"); // equivalent to Xᵀ(y − Xw)
  await ex.getByRole("textbox", { name: "Step 3" }).fill("X.T @ y");
  await ex.getByRole("textbox", { name: "Step 5" }).fill("X @ inv(X.T @ X) @ X.T - eye(8)");
  await ex.getByRole("button", { name: "Check steps" }).click();
  await expect(ex.getByTestId("step-1").getByText("Correct.")).toBeVisible({ timeout: 90_000 });
  await expect(ex.getByTestId("step-2").getByText("Correct.")).toBeVisible();
  await expect(ex.getByTestId("step-3").getByText(/Not equal to the expected expression/)).toBeVisible();
  await expect(ex.getByTestId("step-4").getByText("No answer yet.")).toBeVisible();
  await expect(ex.getByTestId("step-5").getByText(/exactly the negative/)).toBeVisible();
});
