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

// Compare against clientWidth: on phones Chrome widens innerWidth to fit overflowing content.
test("no horizontal overflow on any screen", async ({ page }) => {
  for (const path of ["/", "/learn", "/learn/induction", "/learn/induction/data-hall", "/learn/induction/checkpoint", "/practice", "/review", "/review/exit", "/progress", "/facility", "/projects", "/sources", "/settings"]) {
    await page.goto(path);
    await page.locator("main h1").first().waitFor();
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(1);
  }
});
