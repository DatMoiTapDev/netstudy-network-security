# Contract: Testing CLI & NPM Scripts

**Feature Directory**: `specs/005-testing-reliability`  
**Contract Name**: `testing-cli-contract`  
**Date**: 2026-11-04  
**Status**: Ratified  

---

## 1. Scripts Khai báo trong `package.json`

Toàn bộ các lệnh kiểm thử và phục vụ kiểm thử được chuẩn hóa trong `package.json` ở cấp độ thư mục gốc dự án:

```json
{
  "name": "netstudy-network-security",
  "version": "1.0.0",
  "private": true,
  "description": "NetStudy Network Security Course & Testing Harness",
  "scripts": {
    "test:syntax": "node --check dist/core.js dist/app.js dist/data.js dist/models.js dist/model-ui.js",
    "test:whitespace": "git diff --check",
    "test:units": "node checks.cjs && node checks-models.cjs && node checks-perf.cjs && node checks-learning.cjs",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:a11y": "playwright test tests/accessibility.spec.js",
    "test:serve": "node scripts/test-server.cjs",
    "test": "npm run test:syntax && npm run test:whitespace && npm run test:units && npm run test:e2e"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.10.1",
    "@playwright/test": "^1.49.0"
  }
}
```

---

## 2. Giao thức Khởi chạy Máy chủ Thử nghiệm (`scripts/test-server.cjs`)

Máy chủ tĩnh nội bộ khởi chạy phục vụ thư mục `dist/`:

- **Cú pháp CLI**: `node scripts/test-server.cjs [PORT]`
- **Cổng mặc định**: `PORT=3000` (hoặc lấy từ biến môi trường `TEST_PORT`).
- **Địa chỉ phục vụ**: `http://127.0.0.1:3000` (hoặc `http://localhost:3000`).
- **Mã thoát (Exit Codes)**:
  - `0`: Tắt máy chủ bình thường khi nhận tín hiệu `SIGINT` hoặc `SIGTERM`.
  - `1`: Không thể lắng nghe cổng (ví dụ: cổng đang bị chiếm dụng) hoặc lỗi đọc thư mục `dist/`.

---

## 3. Cấu hình Playwright (`playwright.config.js`)

Tệp cấu hình trung tâm cho runner Playwright:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  webServer: {
    command: 'node scripts/test-server.cjs 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 10000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } }
    }
  ]
});
```

---

## 4. Quy ước Mã Thoát & Tiêu chí Lỗi

| Lệnh kiểm thử | Mã thoát `0` | Mã thoát khác `0` |
| :--- | :--- | :--- |
| `npm run test:syntax` | 100% tệp JavaScript hợp lệ cú pháp | Có ít nhất 1 lỗi cú pháp (SyntaxError) |
| `npm run test:units` | 4 kịch bản kiểm thử PASS | Có bất kỳ assertion lỗi hoặc vi phạm ngân sách SLA |
| `npm run test:e2e` | Toàn bộ kịch bản E2E PASS | Có ít nhất 1 kịch bản fail sau 2 lần retry trên CI |
| `npm run test:a11y` | 0 lỗi vi phạm `critical` hoặc `serious` | Phát hiện lỗi vi phạm trợ năng nghiêm trọng |
