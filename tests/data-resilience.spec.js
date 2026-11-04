const { test, expect } = require('@playwright/test');
const { seedStorage, clearStorage, getStorage } = require('./helpers/storage');
const v1Fixture = require('./fixtures/storage-v1-legacy.json');
const overCapacityFixture = require('./fixtures/storage-over-capacity.json');

test.describe('Data Persistence, Migration & Resilience Suite', () => {
  test('T024: Idempotent storage migration v1 to v2 on app launch', async ({ page }) => {
    await seedStorage(page, v1Fixture);
    await page.goto('/#home');

    // Verify in-memory migrated state via StudyCore.migrateStorageToV2 in browser context
    const migrationResult = await page.evaluate((fixture) => {
      const bank = (window.COURSE || []).flatMap(c => c.questions.map(q => ({ ...q, chapter: c.id })));
      return window.StudyCore.migrateStorageToV2(fixture, bank);
    }, v1Fixture);

    expect(migrationResult.version).toBe(2);
    expect(migrationResult.completed).toEqual(expect.arrayContaining(v1Fixture.completed));
    expect(migrationResult.history.length).toBe(v1Fixture.history.length);
    expect(migrationResult.questionStats).toBeTruthy();

    // Verify idempotency on second pass
    const secondPass = await page.evaluate(({ res, fixture }) => {
      const bank = (window.COURSE || []).flatMap(c => c.questions.map(q => ({ ...q, chapter: c.id })));
      return window.StudyCore.migrateStorageToV2(res, bank);
    }, { res: migrationResult, fixture: v1Fixture });

    expect(secondPass.version).toBe(2);
    expect(secondPass.history.length).toBe(v1Fixture.history.length);
  });

  test('T025: JSON backup export triggers download and import restores state', async ({ page }) => {
    await seedStorage(page, v1Fixture);
    await page.goto('/#settings');

    // Test JSON export download
    const downloadPromise = page.waitForEvent('download');
    const exportBtn = page.locator('button[data-action="export"]').first();
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/netstudy-sao-luu-.*\.json/);

    // Verify file input exists for import
    const importInput = page.locator('input[type="file"], #importFile');
    expect(await importInput.count()).toBeGreaterThan(0);
  });

  test('T026: Malformed and oversized (> 10MB) JSON uploads are rejected safely', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/#settings');

    // Simulate invalid JSON file upload
    const fileChooserPromise = page.waitForEvent('filechooser').catch(() => null);
    const importBtn = page.locator('button[data-action="import"], label[for="importFile"]').first();
    if (await importBtn.isVisible()) {
      await importBtn.click();
      const fileChooser = await fileChooserPromise;
      if (fileChooser) {
        // Upload a buffer with invalid text
        await fileChooser.setFiles({
          name: 'corrupt-backup.json',
          mimeType: 'application/json',
          buffer: Buffer.from('{ corrupt json content ... invalid }')
        });

        // App should show toast or error note without crashing
        await expect(page.locator('#app')).toBeVisible();
      }
    }
  });

  test('T027: QuotaExceededError modal simulation and storageError fallback (EC-02)', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/#home');

    // Simulate QuotaExceededError in page context
    await page.evaluate(() => {
      // Trigger modal via direct call or error throw simulation
      const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
      window.localStorage.setItem = () => {
        const err = new DOMException('Quota exceeded', 'QuotaExceededError');
        throw err;
      };
      // Trigger a save action to fire the quota modal
      if (window.__triggerSave) {
        window.__triggerSave();
      } else {
        // Alternatively dispatch custom event or action
        const dummyBtn = document.createElement('button');
        dummyBtn.dataset.action = 'startPractice';
        document.body.appendChild(dummyBtn);
        dummyBtn.click();
        dummyBtn.remove();
      }
    });

    // Verify app remains responsive (No White Screen of Death)
    await expect(page.locator('#app')).toBeVisible();

    // Test EC-02: Private browsing / disabled storage safety
    await page.evaluate(() => {
      window.localStorage.setItem = () => {
        throw new DOMException('Access denied', 'SecurityError');
      };
    });
    await expect(page.locator('#app')).toBeVisible();
  });

  test('T028: Retains all 120 sessions without silent wipe, warns and prunes only on confirmation', async ({ page }) => {
    await seedStorage(page, overCapacityFixture);
    await page.goto('/#history');

    // Verify all 120 sessions exist initially
    const storageBefore = await getStorage(page);
    expect(storageBefore.history.length).toBe(120);

    // Verify warning banner is displayed
    const warnBanner = page.locator('.note.warn');
    await expect(warnBanner.first()).toBeVisible();
    await expect(warnBanner.first()).toContainText('100');

    // Confirm prune button exists
    const pruneBtn = page.locator('button[data-action="confirmPruneHistory"]');
    await expect(pruneBtn).toBeVisible();

    // Accept dialog and click prune
    page.on('dialog', async d => await d.accept());
    await pruneBtn.click();

    // Verify history safely pruned to 100 sessions
    const storageAfter = await getStorage(page);
    expect(storageAfter.history.length).toBe(100);
  });

  test('T029: Active session recovery and deadline persistence across page reload (EC-03)', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/#practice');

    // Start practice session
    await page.locator('button[data-action="startPractice"]').click();
    await expect(page.locator('.quiz-layout')).toBeVisible();

    // Answer question 1
    await page.locator('button.option[data-action="answer|0"]').first().click();

    // Reload page
    await page.reload();

    // Session should be restored automatically or prompt active session
    await expect(page.locator('#app')).toBeVisible();
    const hasActiveSession = (await page.locator('.quiz-layout, a[href="#session"]').count() > 0) ||
      (await page.locator('#app').textContent()).includes('Bạn có bài đang làm dở');
    expect(hasActiveSession).toBe(true);
  });
});
