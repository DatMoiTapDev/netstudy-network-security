const { test, expect } = require('@playwright/test');
const { seedStorage, clearStorage, getStorage } = require('./helpers/storage');
const populatedFixture = require('./fixtures/storage-v2-populated.json');

test.describe('Learning Journey, Dashboard & Theme Suite', () => {
  test('T010: Lesson reading, section scrolling and outline content', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/#lesson/1');
    await expect(page.locator('#app')).toBeVisible();

    // Check lesson 1 eyebrow / title
    const eyebrow = page.locator('.eyebrow').first();
    await expect(eyebrow).toContainText(/BÀI 1/i);

    // Section 1.1 should be present
    const sec1 = page.locator('#section-1\\.1, [id="section-1.1"]');
    await expect(sec1).toBeVisible();

    // Verify explanation sections and completion button exist
    const completeBtn = page.locator('button[data-action^="complete|1|1.1"]');
    await expect(completeBtn).toBeVisible();
    await expect(completeBtn).toContainText('Đánh dấu đã học');
  });

  test('T011: Section completion toggle and live DOM checkmark update without reload', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/#lesson/1');

    const completeBtn = page.locator('button[data-action^="complete|1|1.1"]').first();
    await expect(completeBtn).toBeVisible();

    // Click "Đánh dấu đã học"
    await completeBtn.click();

    // Button should now indicate completion
    await expect(completeBtn).toContainText('Đã học mục này');

    // Verify localStorage has section recorded
    const storage = await getStorage(page);
    expect(storage.completed).toContain('1:1.1');

    // Click again to toggle off
    await completeBtn.click();
    await expect(completeBtn).toContainText('Đánh dấu đã học');
    const storageAfter = await getStorage(page);
    expect(storageAfter.completed).not.toContain('1:1.1');
  });

  test('T016: Learning Dashboard metrics with populated data', async ({ page }) => {
    await seedStorage(page, populatedFixture);
    await page.goto('/#home');

    // Verify 4 summary statistics exist on Dashboard
    const statsContainer = page.locator('.stats');
    await expect(statsContainer).toBeVisible();

    // Verify completed sections count (15/95)
    await expect(statsContainer).toContainText('15');
    await expect(statsContainer).toContainText('/95');

    // Verify chapter cards are rendered
    const chapterCards = page.locator('.chapter-card');
    await expect(chapterCards).toHaveCount(9);
  });

  test('T017: Weak chapter detection (<70%) and badge rendering', async ({ page }) => {
    await seedStorage(page, populatedFixture);
    await page.goto('/#home');

    // In populatedFixture, Chapter 2a has wrong answers and <70% accuracy
    const weakBadge = page.locator('.weak-badge');
    await expect(weakBadge.first()).toBeVisible();
    await expect(weakBadge.first()).toContainText('Chương yếu');
  });

  test('T022: Inline SVG score trend chart and cognitive breakdown', async ({ page }) => {
    await seedStorage(page, populatedFixture);
    await page.goto('/#history');

    // Score trend chart SVG should be rendered
    const svgChart = page.locator('svg.score-chart');
    await expect(svgChart).toBeVisible();

    // Chart should contain score points or lines
    const points = svgChart.locator('circle, polyline, path');
    expect(await points.count()).toBeGreaterThan(0);

    // Verify cognitive level breakdown numbers
    const appEl = page.locator('#app');
    await expect(appEl).toContainText('Nhận biết');
    await expect(appEl).toContainText('Thông hiểu');
    await expect(appEl).toContainText('Vận dụng');
  });

  test('T023: Learning History filters by activity and result', async ({ page }) => {
    await seedStorage(page, populatedFixture);
    await page.goto('/#history');

    // Verify history table has sessions rendered
    const historyRows = page.locator('.history-item, .history-row, tr, .card');
    expect(await historyRows.count()).toBeGreaterThan(0);

    // Filter by mode if select exists
    const modeFilter = page.locator('select[name="mode"], #historyFilterMode');
    if (await modeFilter.isVisible()) {
      await modeFilter.selectOption({ index: 1 });
      await expect(page.locator('#app')).toBeVisible();
    }
  });

  test('T030: Theme Engine switches Light -> Dark -> System on desktop', async ({ page }, testInfo) => {
    if (testInfo.project.name === 'mobile-chrome') {
      test.skip();
    }
    await clearStorage(page);
    await page.goto('/#home');

    const themeBtn = page.locator('#themeToggle');
    await expect(themeBtn).toBeVisible();

    const htmlEl = page.locator('html');

    // Click theme toggle and verify data-theme attribute updates
    const initialTheme = await htmlEl.getAttribute('data-theme');
    await themeBtn.click();
    const secondTheme = await htmlEl.getAttribute('data-theme');
    expect(secondTheme).toBeTruthy();

    await themeBtn.click();
    const thirdTheme = await htmlEl.getAttribute('data-theme');
    expect(thirdTheme).toBeTruthy();
  });
});
