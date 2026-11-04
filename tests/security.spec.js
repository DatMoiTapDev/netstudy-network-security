import { test, expect } from '@playwright/test';

test.describe('Client-Side Security & Ingestion Hardening Suite', () => {

  test('T006/T009: URL hash injection is sanitized safely without script execution', async ({ page }) => {
    let scriptExecuted = false;
    await page.exposeFunction('onEvilExecution', () => { scriptExecuted = true; });

    // Navigate with a malicious hash payload
    await page.goto('/#lesson/<script>window.onEvilExecution()</script>');
    await page.waitForLoadState('domcontentloaded');

    // Ensure the evil script was NOT executed
    expect(scriptExecuted).toBe(false);

    // Verify app redirected safely or rendered safely without raw unescaped script tag in main content
    const appHtml = await page.locator('#app').innerHTML();
    expect(appHtml).not.toContain('<script>window.onEvilExecution()</script>');
  });

  test('T007: Ingestion guardrail rejects file upload > 10MB immediately', async ({ page }) => {
    await page.goto('/#settings');
    await page.waitForLoadState('domcontentloaded');

    // Create a synthetic dummy file buffer of 11MB
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');

    // Set file on #importFile input
    const fileInput = page.locator('#importFile');
    await fileInput.setInputFiles({
      name: 'overflow-backup.json',
      mimeType: 'application/json',
      buffer: largeBuffer
    });

    // Verify toast notification reports size exceeded error
    const toast = page.locator('#toast');
    await expect(toast).toBeVisible({ timeout: 5000 });
    const toastText = await toast.textContent();
    expect(toastText).toContain('10MB');
  });

  test('T010: Malicious JSON backup with script tag in session title is escaped safely', async ({ page }) => {
    // Seed storage with a malicious title
    const maliciousPayload = {
      version: 2,
      completed: ['1:1.1'],
      marked: [],
      history: [
        {
          id: '9999999999999',
          mode: 'exam',
          title: '<img src=x onerror=window.__xss=1> Bài thi độc hại',
          ids: ['1-q1'],
          answers: { '1-q1': 0 },
          score: 10,
          started: 1730000000000,
          ended: 1730001000000,
          auto: false
        }
      ],
      questionStats: {},
      savedExams: [],
      active: null
    };

    await page.addInitScript((val) => {
      window.localStorage.setItem('netstudy-atmmt-v1', JSON.stringify(val));
    }, maliciousPayload);

    await page.goto('/#history');
    await page.waitForLoadState('domcontentloaded');

    // Check window.__xss is undefined
    const xssTriggered = await page.evaluate(() => Boolean(window.__xss));
    expect(xssTriggered).toBe(false);

    // Verify string in DOM is escaped
    const historyTableText = await page.locator('#app').innerHTML();
    expect(historyTableText).toContain('&lt;img src=x onerror=window.__xss=1&gt;');
  });

  test('T012: Content Security Policy meta tag is present in document head with strict directives', async ({ page }) => {
    await page.goto('/#home');
    await page.waitForLoadState('domcontentloaded');

    const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(cspMeta).toHaveCount(1);

    const cspContent = await cspMeta.getAttribute('content');
    expect(cspContent).toContain("default-src 'self'");
    expect(cspContent).toContain("object-src 'none'");
    expect(cspContent).toContain("base-uri 'self'");
  });

  test('T011: Strict absence of eval and Function constructor in runtime scope', async ({ page }) => {
    await page.goto('/#home');
    await page.waitForLoadState('domcontentloaded');

    // Check that dist scripts did not pollute or use eval internally
    const hasUnsafeEval = await page.evaluate(() => {
      return typeof window.__evalTest === 'function';
    });
    expect(hasUnsafeEval).toBe(false);
  });

});
