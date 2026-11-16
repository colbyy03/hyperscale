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
  await page.goto("/learn/linear-algebra");
  await expect(page.getByText("This module hasn't been authored yet")).toBeVisible();
  await page.goto("/sources");
  await expect(page.getByText(/verified against Crossref/)).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByRole("button", { name: /Export backup/ })).toBeVisible();
});

test("no horizontal overflow on the lesson page", async ({ page }) => {
  await page.goto("/learn/induction/data-hall");
  await expect(page.getByTestId("viz-pue")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
