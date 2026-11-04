const { test, expect } = require('@playwright/test');
const { clearStorage } = require('./helpers/storage');

test.describe('27 Interactive SVG Mechanism Models Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('T035: Model catalog lists 27 models and step controls update active highlights', async ({ page }) => {
    await page.goto('/#models');
    await expect(page.locator('#app')).toBeVisible();

    // Verify all 27 model cards exist in catalog
    const modelCards = page.locator('.model-catalog-card');
    await expect(modelCards).toHaveCount(27);

    // Navigate to Lesson 1 with Model 1.1
    await page.goto('/#lesson/1');
    const modelFigure = page.locator('#model-1-1, figure.study-model').first();
    await expect(modelFigure).toBeVisible();

    // Verify SVG diagram is present
    const svgEl = modelFigure.locator('svg').first();
    await expect(svgEl).toBeVisible();

    // Verify step buttons exist
    const nextStepBtn = modelFigure.locator('button[data-model-target][data-model-step="1"]').first();
    if (await nextStepBtn.count() > 0) {
      await nextStepBtn.scrollIntoViewIfNeeded();
      await nextStepBtn.click({ force: true, timeout: 5000 });

      // Verify active node or edge is present in SVG
      const activeElements = modelFigure.locator('.model-node.is-active, .model-edge.is-active');
      expect(await activeElements.count()).toBeGreaterThan(0);
    }
  });

  test('T036: Cryptographic worked examples (RSA, Diffie-Hellman) display numeric steps', async ({ page }) => {
    // Navigate to Lesson 3 (Mật mã bất đối xứng - RSA & Diffie-Hellman)
    await page.goto('/#lesson/3');
    await expect(page.locator('#app')).toBeVisible();

    // Verify worked example sections exist
    const workedExamples = page.locator('.model-example');
    expect(await workedExamples.count()).toBeGreaterThan(0);

    // Verify cryptographic formulas or descriptions (mod, e, d, p, g)
    const pageText = await page.locator('#app').textContent();
    expect(pageText).toMatch(/(mod|RSA|Diffie-Hellman|khóa|mã hóa)/i);
  });
});
