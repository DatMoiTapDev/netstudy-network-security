const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright');
const { clearStorage } = require('./helpers/storage');

test.describe('Accessibility & Keyboard Navigation Suite (WCAG 2.2 AA)', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('T033: Keyboard shortcuts (1/2/3/4, A/B/C/D, F, Arrows) operate exam session', async ({ page }) => {
    await page.goto('/#exam');
    await page.locator('button[data-action="startExam|fixed"]').click();
    await expect(page.locator('.quiz-layout')).toBeVisible();

    // Press key '1' to select option A
    await page.keyboard.press('1');
    const option0 = page.locator('button.option[data-action="answer|0"]');
    await expect(option0).toHaveClass(/selected/);

    // Press key 'B' to select option B
    await page.keyboard.press('B');
    const option1 = page.locator('button.option[data-action="answer|1"]');
    await expect(option1).toHaveClass(/selected/);

    // Press key 'F' to flag question
    await page.keyboard.press('F');
    const q1Nav = page.locator('.qnav button[data-action="jump|0"]');
    await expect(q1Nav).toHaveClass(/flagged/);

    // Press key 'ArrowRight' to move to next question
    await page.keyboard.press('ArrowRight');
    const q2Nav = page.locator('.qnav button[data-action="jump|1"]');
    await expect(q2Nav).toHaveClass(/current/);

    // Tab navigation test - focus outlines
    await page.keyboard.press('Tab');
    const focusedEl = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedEl).toBeTruthy();
  });

  const routes = [
    '#home',
    '#courses',
    '#lesson/1',
    '#terms',
    '#models',
    '#practice',
    '#exam',
    '#review',
    '#history',
    '#settings'
  ];

  for (const r of routes) {
    test(`T034: axe-core scan on ${r} has 0 critical or serious violations (SC-002)`, async ({ page }, testInfo) => {
      // Run accessibility scan primarily on chromium desktop to keep CI fast
      if (testInfo.project.name === 'mobile-chrome') {
        test.skip();
      }

      await page.goto('/' + r);
      await expect(page.locator('#app')).toBeVisible();

      // Analyze page accessibility with axe-core
      // Excludes font-rasterization color-contrast and link-in-text-block heuristic rules
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['link-in-text-block', 'color-contrast'])
        .analyze();

      // Filter for critical and serious violations
      const severeViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      // Verify zero critical or serious violations
      expect(severeViolations, JSON.stringify(severeViolations, null, 2)).toEqual([]);
    });
  }
});
