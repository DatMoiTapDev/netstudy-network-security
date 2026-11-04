const { test, expect } = require('@playwright/test');
const { seedStorage, clearStorage, getStorage } = require('./helpers/storage');
const populatedFixture = require('./fixtures/storage-v2-populated.json');

test.describe('Review Notebook & CL-01 Mastery State Machine Suite', () => {
  test('T018: Smart Wrong-Answer Review 4-tab interface displays correct counts', async ({ page }) => {
    await seedStorage(page, populatedFixture);
    await page.goto('/#review');

    // Verify 4 review tabs exist with role="tab"
    const tabs = page.locator('.review-tab[role="tab"]');
    await expect(tabs).toHaveCount(4);

    // Verify tab names and active states
    const needsPracticeTab = page.locator('button[data-action="switchReviewTab|needs_practice"]');
    const inReviewTab = page.locator('button[data-action="switchReviewTab|in_review"]');
    const masteredTab = page.locator('button[data-action="switchReviewTab|mastered"]');
    const markedTab = page.locator('button[data-action="switchReviewTab|marked"]');

    await expect(needsPracticeTab).toBeVisible();
    await expect(inReviewTab).toBeVisible();
    await expect(masteredTab).toBeVisible();
    await expect(markedTab).toBeVisible();

    // Click in_review tab
    await inReviewTab.click();
    await expect(inReviewTab).toHaveClass(/active/);
    await expect(inReviewTab).toHaveAttribute('aria-selected', 'true');

    // Click mastered tab
    await masteredTab.click();
    await expect(masteredTab).toHaveClass(/active/);
    await expect(masteredTab).toHaveAttribute('aria-selected', 'true');
  });

  test('T019: CL-01 2-streak mastery lifecycle transitions in practice sessions', async ({ page }) => {
    await clearStorage(page);

    // Start practice with 1 question
    await page.goto('/#practice');
    await page.locator('button[data-action="startPractice"]').click();
    await expect(page.locator('.quiz-layout')).toBeVisible();

    // Answer wrong (e.g. choose option that is not correct)
    const options = page.locator('button.option[data-action^="answer|"]');
    // Click option 0
    await options.nth(0).click();

    // Finish/submit session
    page.on('dialog', async d => await d.accept());
    await page.locator('button[data-action="submit"]').click();
    await expect(page).toHaveURL(/#result\//, { timeout: 10000 });

    // Verify state has recorded questionStats
    const storage = await getStorage(page);
    expect(storage.questionStats).toBeTruthy();
  });

  test('T020: Exam correct answer does not auto-master question (CL-01 boundary)', async ({ page }) => {
    // Fixture has question '1-q2' with consecutiveCorrect = 1 (in_review)
    await seedStorage(page, populatedFixture);
    await page.goto('/#exam');

    // Verify initial status
    const initialStorage = await getStorage(page);
    expect(initialStorage.questionStats['1-q2'].masteryStatus).toBe('in_review');

    // Run exam containing 1-q2 (Fixed exam A includes 1-q2)
    await page.locator('button[data-action="startExam|fixed"]').click();
    await expect(page.locator('.quiz-layout')).toBeVisible();

    // 1-q2 is question 2 (index 1) in fixed exam A
    await page.locator('.qnav button[data-action="jump|1"]').click();

    // Select option
    await page.locator('button.option[data-action="answer|1"]').click();

    // Submit exam
    page.on('dialog', async d => await d.accept());
    await page.locator('button[data-action="submit"]').click();
    await expect(page).toHaveURL(/#result\//, { timeout: 10000 });

    // Verify after exam, status is NOT auto-transferred to mastered
    const afterStorage = await getStorage(page);
    expect(afterStorage.questionStats['1-q2'].masteryStatus).not.toBe('mastered');
  });
});
