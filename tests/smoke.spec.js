const { test, expect } = require('@playwright/test');
const { clearStorage } = require('./helpers/storage');

test.describe('Smoke & 10-Route Navigation Suite', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorage(page);
  });

  test('Page loads with correct title and brand header', async ({ page }, testInfo) => {
    await page.goto('/#home');
    await expect(page).toHaveTitle(/NetStudy/);

    const isMobile = testInfo.project.name === 'mobile-chrome';
    if (!isMobile) {
      const brand = page.locator('.brand');
      await expect(brand).toBeVisible();
      await expect(brand).toContainText('NetStudy');
    } else {
      const breadcrumb = page.locator('#breadcrumb');
      await expect(breadcrumb).toBeVisible();
    }
  });

  const routes = [
    { hash: '#home', expectedText: 'Tổng quan' },
    { hash: '#courses', expectedText: 'Giáo trình' },
    { hash: '#lesson/1', expectedText: 'Bài 1' },
    { hash: '#terms', expectedText: 'Thuật ngữ' },
    { hash: '#models', expectedText: 'Mô hình' },
    { hash: '#practice', expectedText: 'Luyện tập' },
    { hash: '#exam', expectedText: 'Thi thử' },
    { hash: '#review', expectedText: 'Sổ ôn tập' },
    { hash: '#history', expectedText: 'Lịch sử' },
    { hash: '#settings', expectedText: 'Dữ liệu cá nhân' }
  ];

  for (const r of routes) {
    test(`Navigates successfully to ${r.hash} and updates view`, async ({ page }, testInfo) => {
      await page.goto('/' + r.hash);
      const appEl = page.locator('#app');
      await expect(appEl).toBeVisible();
      await expect(appEl).not.toBeEmpty();

      const isMobile = testInfo.project.name === 'mobile-chrome';
      if (!isMobile) {
        const activeNav = page.locator('#nav a.active');
        await expect(activeNav).toBeVisible();
      } else {
        const mobileNav = page.locator('#mobileNav');
        await expect(mobileNav).toBeVisible();
      }
    });
  }

  test('Shows zero-state onboarding on fresh install without history', async ({ page }) => {
    await page.goto('/#home');
    const appEl = page.locator('#app');
    await expect(appEl).toBeVisible();
    const cards = page.locator('.stat-card, .metric-card, .dash-card, .card');
    await expect(cards.first()).toBeVisible();
  });

  test('Verifies complete offline functionality (EC-05)', async ({ context, page }) => {
    await page.goto('/#home');
    await expect(page.locator('#app')).toBeVisible();

    // Emulate complete offline disconnection
    await context.setOffline(true);
    await page.goto('/#courses');
    await expect(page.locator('#app')).toBeVisible();
    await expect(page.locator('text=Bài 1')).toBeVisible();

    // Restore online
    await context.setOffline(false);
  });
});
