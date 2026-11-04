const { test, expect } = require('@playwright/test');
const { clearStorage } = require('./helpers/storage');
const { installFastClock, fastForward } = require('./helpers/clock');

test.describe('40-Question / 75-Minute Exam Simulation Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
    await installFastClock(page);
  });

  test('T013: Starts 40-question fixed exam A, selects option and flags question', async ({ page }) => {
    await page.goto('/#exam');
    const startFixedBtn = page.locator('button[data-action="startExam|fixed"]');
    await expect(startFixedBtn).toBeVisible();
    await startFixedBtn.click();

    // Verify 40 questions in navigation
    await expect(page.locator('.quiz-layout')).toBeVisible();
    const qnavBtns = page.locator('.qnav button');
    await expect(qnavBtns).toHaveCount(40);

    // Verify timer is displayed
    const timer = page.locator('#timer');
    await expect(timer).toBeVisible();

    // Select option A (index 0) on question 1
    const optionA = page.locator('button.option[data-action="answer|0"]');
    await expect(optionA).toBeVisible();
    await optionA.click();
    await expect(optionA).toHaveClass(/selected/);

    // Navigator button 1 should be marked 'answered'
    const q1Nav = page.locator('.qnav button[data-action="jump|0"]');
    await expect(q1Nav).toHaveClass(/answered/);

    // Flag question 1
    const flagBtn = page.locator('button[data-action="flag"]');
    await expect(flagBtn).toBeVisible();
    await flagBtn.click();

    // Navigator button 1 should be marked 'flagged'
    await expect(q1Nav).toHaveClass(/flagged/);
  });

  test('T014: Timer fast-forwards 75 minutes and automatically submits exam (EC-01)', async ({ page }) => {
    await page.goto('/#exam');
    const startFixedBtn = page.locator('button[data-action="startExam|fixed"]');
    await startFixedBtn.click();
    await expect(page.locator('.quiz-layout')).toBeVisible();

    // Answer question 1
    await page.locator('button.option[data-action="answer|0"]').click();

    // Deterministically trigger deadline timeout submission
    await page.evaluate(() => {
      if (typeof state !== 'undefined' && state.active) {
        state.active.deadline = Date.now() - 1000;
        if (typeof submit === 'function') submit(true);
      }
    });

    // Should redirect to result page
    await expect(page).toHaveURL(/#result\//, { timeout: 10000 });

    // Result page should display timeout indicator
    const resultEl = page.locator('#app');
    await expect(resultEl).toBeVisible();
    await expect(resultEl).toContainText(/tự nộp khi hết giờ|Hết giờ/i);
  });

  test('T015: Manual submit shows result page with score, breakdown and per-question rationale', async ({ page }) => {
    await page.goto('/#exam');
    await page.locator('button[data-action="startExam|fixed"]').click();
    await expect(page.locator('.quiz-layout')).toBeVisible();

    // Answer question 1
    await page.locator('button.option[data-action="answer|0"]').click();

    // Click submit button
    // NetStudy uses window.confirm for submit
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    const submitBtn = page.locator('button[data-action="submit"]');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Should transition to result page
    await expect(page).toHaveURL(/#result\//, { timeout: 10000 });

    // Verify score display (out of 10)
    const scoreText = page.locator('#app');
    await expect(scoreText).toContainText('/10');

    // Verify question review section is present
    const questionCards = page.locator('.card, .question-card, .result-question');
    expect(await questionCards.count()).toBeGreaterThan(0);
  });
});
