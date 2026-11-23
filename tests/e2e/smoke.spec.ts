import { expect, test } from "@playwright/test";

test("Today shows the session and the next lesson", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Today's session")).toBeVisible();
  await expect(page.getByRole("link", { name: /Start session/ })).toBeVisible();
});

test("a lesson renders, a prediction can be committed, and the lesson can be completed", async ({ page }) => {
  await page.goto("/learn/induction/welcome");
  await expect(page.getByRole("heading", { level: 1, name: "Welcome to Kestrel Ridge" })).toBeVisible();
  const predict = page.getByTestId("predict-why-predict");
  await predict.getByRole("radio", { name: /practice tests/ }).click();
  await predict.getByRole("button", { name: "Commit prediction" }).click();
  await expect(predict.getByText("You predicted it.")).toBeVisible();
  await page.getByRole("button", { name: /Mark lesson complete/ }).click();
  await expect(page.getByText("Lesson complete")).toBeVisible();
});

test("math and explainers render in the data hall lesson", async ({ page }) => {
  await page.goto("/learn/induction/data-hall");
  await expect(page.locator(".katex-display").first()).toBeVisible();
  await expect(page.getByTestId("pue-value")).toHaveText("1.30");
  await expect(page.getByTestId("viz-heatpath")).toBeVisible();
});

test("deep links, sources and settings load", async ({ page }) => {
  await page.goto("/learn/probability-statistics");
  await expect(page.getByText("This module hasn't been authored yet")).toBeVisible();
  await page.goto("/sources");
  await expect(page.getByText(/verified against Crossref/)).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByRole("button", { name: /Export backup/ })).toBeVisible();
});

// Compare against clientWidth: on phones Chrome widens innerWidth to fit overflowing content.
test("no horizontal overflow on any screen", async ({ page }) => {
  // Look ahead into locked modules so their lessons (and explainers) are measured, not the lock screen.
  await page.addInitScript(() => {
    for (const m of ["python-mle", "linear-algebra", "calculus-optimization"]) sessionStorage.setItem(`hs-peek:${m}`, "1");
  });
  const explainer: Record<string, string> = {
    "/learn/linear-algebra/vectors": "viz-projection",
    "/learn/linear-algebra/linear-maps": "viz-matrixmap",
    "/learn/linear-algebra/svd": "svd-steps",
    "/learn/linear-algebra/pca-pod": "viz-fieldmodes",
    "/learn/calculus-optimization/convexity-conditioning": "viz-optimizer-race",
  };
  for (const path of ["/", "/learn", "/learn/induction", "/learn/induction/data-hall", "/learn/induction/checkpoint", "/learn/linear-algebra", ...Object.keys(explainer), "/learn/linear-algebra/matrix-calculus", "/learn/calculus-optimization/jacobians-hessians", "/learn/calculus-optimization/autodiff", "/learn/calculus-optimization/momentum-adam", "/learn/calculus-optimization/newton", "/learn/calculus-optimization/constrained", "/practice", "/review", "/review/exit", "/progress", "/facility", "/projects", "/sources", "/settings"]) {
    await page.goto(path);
    await page.locator("main h1").first().waitFor();
    if (explainer[path]) await page.getByTestId(explainer[path]).waitFor();
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});

test("the POD explorer shows modes, a fit near the noise, and the centering pitfall", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("hs-peek:linear-algebra", "1"));
  await page.goto("/learn/linear-algebra/pca-pod");
  const viz = page.getByTestId("viz-fieldmodes");
  await expect(viz.getByTestId("field-summary")).toContainText("3 modes capture 99.");
  await viz.getByRole("button", { name: "Mode 2" }).click();
  await expect(viz.getByTestId("field-caption")).toHaveText(/^Mode 2: 1\d\.\d% of the energy/);
  await viz.getByLabel("Subtract the mean field first").uncheck();
  await viz.getByRole("button", { name: "Mode 1" }).click();
  await expect(viz.getByTestId("field-caption")).toHaveText(/^Mode 1: 99\.9\d% of the energy/);
  await expect(viz.getByRole("button", { name: "Mean field" })).toBeDisabled();
});

test("the optimizer race converges, and pure Newton gets trapped on the saddle", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("hs-peek:calculus-optimization", "1"));
  await page.goto("/learn/calculus-optimization/convexity-conditioning");
  const race = page.getByTestId("viz-optimizer-race");
  await expect(race.getByTestId("race-result-gd")).toContainText(/step \d+/);
  await race.getByRole("button", { name: "Saddle" }).click();
  await race.getByRole("checkbox", { name: "Newton" }).check();
  await expect(race.getByText("Newton jumps to the nearest point where the gradient vanishes")).toBeVisible();
  await expect(race.getByTestId("race-result-newton")).toContainText("not yet");
});
