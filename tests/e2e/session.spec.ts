import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Two simulated days with a frozen clock: lessons, practice and exit recall on day 1;
// reviews and the mastery gate on day 2. Exercises the whole learning engine on sample content.
test.describe.configure({ timeout: 120_000 });

interface Item {
  kind: "choice" | "numeric" | "explain" | "exercise";
  id: string;
  answer?: number;
  options?: string[];
}
const checkpoint = JSON.parse(fs.readFileSync("content/modules/induction/checkpoint.json", "utf8")) as { items: Item[] };

const DAY1 = new Date("2026-11-18T17:00:00");
const DAY2 = new Date("2026-11-19T17:00:00");

const EXPLANATION =
  "PUE divides the total energy the facility draws by the energy that reaches the IT equipment, so the gap above 1.0 is the overhead for cooling, power conversion and lighting. Lower is better.";

/** Content wider than the device (clientWidth; on phones innerWidth grows to fit overflow). */
async function expectNoOverflow(page: Page, where: string) {
  const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth);
  expect(overflow, `horizontal overflow on ${where}`).toBeLessThanOrEqual(1);
}

async function completeLesson(page: Page, path: string, title: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await page.getByRole("button", { name: /Mark lesson complete/ }).click();
  await expect(page.getByText(/Lesson complete/)).toBeVisible();
}

async function answerCheckpoint(page: Page, correct: boolean) {
  await page.getByTestId("begin-checkpoint").click();
  for (const item of checkpoint.items) {
    const el = page.getByTestId(`cp-item-${item.id}`);
    if (item.kind === "choice") await el.getByRole("radio").nth(correct ? item.answer! : (item.answer! + 1) % item.options!.length).click();
    else if (item.kind === "numeric") await el.getByRole("textbox").fill(correct ? String(item.answer) : "0.5");
    else if (item.kind === "explain") await el.getByRole("textbox").fill(EXPLANATION);
  }
  await page.getByTestId("submit-checkpoint").click();
  for (const item of checkpoint.items.filter((i) => i.kind === "explain")) {
    const boxes = page.getByTestId(`cp-item-${item.id}`).getByRole("checkbox");
    for (const box of await boxes.all()) if (correct) await box.check();
  }
  await page.getByTestId("finish-checkpoint").click();
}

test("a full daily session runs end to end, then reviews and the gate the next day", async ({ page }) => {
  // Day 1: the plan is new material, then practice and exit recall.
  await page.clock.setFixedTime(DAY1);
  await page.goto("/");
  const plan = page.getByTestId("plan");
  await expect(plan.getByTestId("plan-lesson").first()).toContainText("Welcome to Kestrel Ridge");
  await page.getByTestId("start-session").click();

  await expect(page.getByRole("heading", { level: 1, name: "Welcome to Kestrel Ridge" })).toBeVisible();
  const predict = page.getByTestId("predict-why-predict");
  await predict.getByRole("radio", { name: /Re-reading/ }).click();
  await predict.getByRole("button", { name: "Commit prediction" }).click();
  await expect(predict.getByText("Not quite.")).toBeVisible();
  const check = page.getByTestId("check-it-heat");
  await check.getByRole("radio", { name: "About 4.8 MW" }).click();
  await check.getByRole("button", { name: "Check" }).click();
  await expect(check.getByText("Correct.")).toBeVisible();
  await page.getByRole("button", { name: /Mark lesson complete/ }).click();
  await expect(page.getByText(/3 cards added to your reviews/)).toBeVisible();
  await page.getByRole("link", { name: /Next in today's session: The data hall/ }).click();

  await expect(page.getByRole("heading", { level: 1, name: "The data hall in one picture" })).toBeVisible();
  await page.getByRole("button", { name: /Mark lesson complete/ }).click();
  await expect(page.getByText(/10 cards added to your reviews/)).toBeVisible();
  await page.getByRole("link", { name: /Next in today's session: Mixed practice/ }).click();

  for (;;) {
    const q = page.getByTestId("practice-question");
    await expect(q).toBeVisible();
    const radios = q.getByRole("radio");
    if ((await radios.count()) > 0) await radios.first().click();
    else await q.getByRole("textbox").fill("1");
    await q.getByRole("button", { name: "Fairly sure" }).click();
    await q.getByRole("button", { name: "Check" }).click();
    await expectNoOverflow(page, "practice question");
    const next = page.getByRole("button", { name: /Next question|See results/ });
    const label = await next.textContent();
    await next.click();
    if (label?.includes("See results")) break;
  }
  await expect(page.getByTestId("practice-summary")).toBeVisible();
  await page.getByRole("link", { name: /Next: Exit recall/ }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Exit recall" })).toBeVisible();
  const recall = page.getByTestId("exit-recall");
  await expect(recall).toHaveCount(2);
  for (const item of await recall.all()) {
    await item.getByRole("button", { name: /show the answer/ }).click();
    await item.getByRole("button", { name: "I had it" }).click();
  }
  await expect(page.getByTestId("draft-card")).toHaveCount(1);
  await expectNoOverflow(page, "exit recall");
  await page.getByTestId("draft-card").getByRole("button", { name: "Add to deck" }).click();
  await expect(page.getByTestId("draft-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Finish session" }).click();
  await expect(page.getByText(/Session complete/)).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("Today's session is done.")).toBeVisible();

  // Day 2: yesterday's cards are due (12 new per day), and the Induction gate is scheduled.
  await page.clock.setFixedTime(DAY2);
  await page.goto("/");
  await expect(page.getByTestId("plan-reviews")).toContainText("Review 12 cards");
  await expect(page.getByTestId("plan-checkpoint")).toBeVisible();
  await expectNoOverflow(page, "Today with a full plan");
  await page.getByTestId("start-session").click();

  for (let i = 0; i < 12; i++) {
    await expect(page.getByTestId("review-card")).toBeVisible();
    await page.getByRole("button", { name: /Show answer/ }).click();
    if (i === 0) await expectNoOverflow(page, "review card");
    await page.getByRole("button", { name: /^Good/ }).click();
  }
  await expect(page.getByText("Reviews done")).toBeVisible();
  await page.getByRole("link", { name: /Next: Checkpoint/ }).click();

  await answerCheckpoint(page, true);
  await expect(page.getByTestId("checkpoint-result")).toContainText("Passed");
  await expectNoOverflow(page, "checkpoint result");
  for (const path of ["/learn/induction", "/progress", "/practice"]) {
    await page.goto(path);
    await page.locator("main h1").first().waitFor();
    await page.waitForTimeout(150);
    await expectNoOverflow(page, path);
  }

  // Passing the gate opens Module 1, whose lesson now joins the plan.
  await page.goto("/");
  await expect(page.getByTestId("plan")).toContainText("Vectorization and broadcasting");
  await expect(page.getByTestId("plan-checkpoint")).toHaveAttribute("data-done", "true");
});

test("a failed gate waits 24 hours before a retake", async ({ page }) => {
  await page.clock.setFixedTime(DAY1);
  await completeLesson(page, "/learn/induction/welcome", "Welcome to Kestrel Ridge");
  await completeLesson(page, "/learn/induction/data-hall", "The data hall in one picture");

  await page.clock.setFixedTime(DAY2);
  await page.goto("/learn/induction/checkpoint");
  await answerCheckpoint(page, false);
  const result = page.getByTestId("checkpoint-result");
  await expect(result).toContainText("Not yet");
  await expect(result).toContainText(/Retake after 24 hours/);

  await page.goto("/learn/induction/checkpoint");
  await expect(page.getByText(/Retake opens/)).toBeVisible();
  await expect(page.getByTestId("begin-checkpoint")).toHaveCount(0);
  // Module 1 stays locked.
  await page.goto("/learn/python-mle/vectorization");
  await expect(page.getByRole("button", { name: "Open anyway" })).toBeVisible();

  await page.clock.setFixedTime(new Date(DAY2.getTime() + 25 * 3_600_000));
  await page.goto("/learn/induction/checkpoint");
  await expect(page.getByTestId("begin-checkpoint")).toHaveText(/Begin retake/);
});
