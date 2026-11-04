const STORAGE_KEY = 'netstudy-atmmt-v1';

/**
 * Seeds localStorage before the DOM is loaded to ensure clean test isolation.
 * @param {import('@playwright/test').Page} page
 * @param {object} fixtureData
 */
async function seedStorage(page, fixtureData) {
  const jsonString = JSON.stringify(fixtureData);
  await page.addInitScript(({ key, data }) => {
    try {
      window.localStorage.setItem(key, data);
    } catch (e) {
      console.warn('seedStorage initScript error:', e);
    }
  }, { key: STORAGE_KEY, data: jsonString });
}

/**
 * Reads the current state from localStorage.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<object|null>}
 */
async function getStorage(page) {
  return await page.evaluate((key) => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, STORAGE_KEY);
}

/**
 * Clears localStorage safely without leaving persistent reload hooks.
 * @param {import('@playwright/test').Page} page
 */
async function clearStorage(page) {
  try {
    await page.evaluate((key) => {
      try {
        window.localStorage.removeItem(key);
        window.localStorage.clear();
      } catch (e) {}
    }, STORAGE_KEY);
  } catch (e) {
    // If page is on about:blank, fresh context is already 100% empty
  }
}

module.exports = {
  STORAGE_KEY,
  seedStorage,
  getStorage,
  clearStorage
};
