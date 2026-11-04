/**
 * Deterministic clock fast-forward helpers using Playwright Clock API.
 * Eliminates flaky hard sleeps.
 */

/**
 * Installs Playwright Virtual Clock before navigating or starting a timed flow.
 * @param {import('@playwright/test').Page} page
 * @param {Date|number} [initialTime]
 */
async function installFastClock(page, initialTime) {
  if (page.clock) {
    await page.clock.install({
      time: initialTime || new Date('2026-11-04T12:00:00Z')
    });
  }
}

/**
 * Fast-forwards the clock by a specified number of milliseconds.
 * @param {import('@playwright/test').Page} page
 * @param {number} ms Milliseconds to jump forward
 */
async function fastForward(page, ms) {
  if (page.clock) {
    await page.clock.fastForward(ms);
  } else {
    // Fallback if clock not installed
    await page.evaluate((delta) => {
      if (window.__fastForwardClock) {
        window.__fastForwardClock(delta);
      }
    }, ms);
  }
}

module.exports = {
  installFastClock,
  fastForward
};
