import { expect, test } from "@playwright/test";

// Boots the simulator (pure-Python hyperscale_sim) in its own Pyodide worker from the CDN,
// runs a whole simulated day and saves the result as a baseline.
test.describe.configure({ timeout: 180_000 });

test("the Control Room runs a simulated day in the browser and saves a baseline", async ({ page }) => {
  await page.goto("/facility/control-room");
  await page.getByTestId("power-on").click();
  await expect(page.getByTestId("run-day")).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId("pods")).toContainText("Pod 4");
  await expect(page.getByTestId("sim-clock")).toHaveText("00:00");

  await page.getByRole("radio", { name: "Max" }).click();
  await page.getByTestId("run-day").click();
  const summary = page.getByTestId("day-summary");
  await expect(summary).toBeVisible({ timeout: 120_000 });
  await expect(page.getByTestId("sim-clock")).toHaveText("24:00");
  await expect(summary).toContainText("valid run");
  await expect(summary).toContainText("same"); // default settings match the reference run exactly

  await page.getByTestId("save-baseline").click();
  await expect(page.getByTestId("leaderboard")).toContainText("MWh");
  const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
