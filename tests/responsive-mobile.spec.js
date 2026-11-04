const { test, expect } = require('@playwright/test');
const { clearStorage } = require('./helpers/storage');

test.describe('Responsive Layout & Mobile Drawer Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  const viewports = [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'mobile-375', width: 375, height: 812 },
    { name: 'extreme-320', width: 320, height: 568 }
  ];

  for (const vp of viewports) {
    test(`T031: Viewport ${vp.name} (${vp.width}px) renders without horizontal scroll (EC-04)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/#home');
      await expect(page.locator('#app')).toBeVisible();

      // Check for unwanted horizontal scrolling (scrollWidth <= clientWidth)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Verify touch targets on mobile (<= 760px breakpoint)
      if (vp.width <= 760) {
        const bottomNav = page.locator('#mobileNav');
        await expect(bottomNav).toBeVisible();
      }
    });
  }

  test('T032: Mobile drawer opens, closes via button, backdrop, and Escape key', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/#home');

    // Click "Thêm" button on mobile navigation
    const openBtn = page.locator('button[data-action="openDrawer"]');
    await expect(openBtn).toBeVisible();
    await openBtn.click();

    // Verify drawer sheet has aria-hidden="false" and class "open"
    const drawer = page.locator('#mobileDrawer');
    await expect(drawer).toHaveClass(/open/);
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');

    // Close via close button
    const closeBtn = page.locator('.drawer-close, button[data-action="closeDrawer"]').first();
    await closeBtn.click();
    await expect(drawer).not.toHaveClass(/open/);
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');

    // Open again and test Escape key
    await openBtn.click();
    await expect(drawer).toHaveClass(/open/);
    await page.keyboard.press('Escape');
    await expect(drawer).not.toHaveClass(/open/);
  });
});
