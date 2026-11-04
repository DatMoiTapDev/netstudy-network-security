const { test, expect } = require('@playwright/test');
const { seedStorage, clearStorage } = require('./helpers/storage');
const populatedFixture = require('./fixtures/storage-v2-populated.json');

test.describe('Practice Mode & Adaptive Engine Suite', () => {
  test('T012: Practice quiz mode displays instant rationale on option click', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/#practice');

    // Start manual practice
    const startBtn = page.locator('button[data-action="startPractice"]');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify session view loaded
    await expect(page.locator('.quiz-layout')).toBeVisible();

    // Click first option
    const firstOption = page.locator('button.option[data-action^="answer|"]').first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();

    // Verify option selected and rationale/explanation box displayed
    await expect(firstOption).toHaveClass(/selected/);
    const rationale = page.locator('.rationale, .explanation, .card p');
    expect(await rationale.count()).toBeGreaterThan(0);
  });

  test('T021: 4 Adaptive Practice presets start valid non-empty sessions with zero duplicates', async ({ page }) => {
    await seedStorage(page, populatedFixture);

    page.on('dialog', async d => {
      await d.accept();
    });

    const presets = [
      { mode: 'unseen', btn: 'startAdaptive|unseen|10', title: 'Luyện câu chưa làm' },
      { mode: 'frequent_wrong', btn: 'startAdaptive|frequent_wrong|10', title: 'Luyện câu hay sai' },
      { mode: 'weak_chapter', btn: 'startAdaptive|weak_chapter|10', title: 'Củng cố chương' },
      { mode: 'adaptive_mixed', btn: 'startAdaptive|adaptive_mixed|10', title: 'Hỗn hợp thích ứng' }
    ];

    for (const p of presets) {
      await page.goto('/#practice');
      const adaptiveBtn = page.locator(`button[data-action="${p.btn}"]`);
      await expect(adaptiveBtn).toBeVisible();
      await adaptiveBtn.click();

      // Session should load
      await expect(page.locator('.quiz-layout')).toBeVisible();

      // Check question count in navigator
      const qnavBtns = page.locator('.qnav button');
      const count = await qnavBtns.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(10);

      // Verify no duplicate question numbers
      const texts = await qnavBtns.allTextContents();
      const uniqueTexts = new Set(texts);
      expect(uniqueTexts.size).toBe(texts.length);
    }
  });
});
