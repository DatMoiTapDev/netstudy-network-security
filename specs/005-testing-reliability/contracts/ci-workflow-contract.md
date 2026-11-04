# Contract: GitHub Actions CI Workflow

**Feature Directory**: `specs/005-testing-reliability`  
**Contract Name**: `ci-workflow-contract`  
**Date**: 2026-11-04  
**Status**: Ratified  

---

## 1. Sự kiện Kích hoạt (Triggers)

Workflow `.github/workflows/ci.yml` được kích hoạt tự động theo các sự kiện:

- **Pull Request**:
  - Nhánh đích (`base`): `main`, `feat/*`.
  - Các loại hành động: `opened`, `synchronize`, `reopened`.
- **Push**:
  - Nhánh: `main`, `feat/*`.

*Tuyệt đối không kích hoạt khi push tags hoặc sửa đổi các tệp tài liệu thuần túy* (loại trừ `docs/**`, `*.md`).

---

## 2. Quyền hạn (Permissions) & Bảo mật

Tuân thủ nguyên tắc quyền tối thiểu (Least Privilege):

```yaml
permissions:
  contents: read          # Chỉ cho phép checkout và đọc mã nguồn repository
```

- Không yêu cầu `write` permissions.
- Không yêu cầu các secrets nhạy cảm hoặc personal access tokens (PAT).
- Không tự động thực hiện deploy lên bất kỳ môi trường production nào.

---

## 3. Cấu trúc Job & Thứ tự Thực thi

```yaml
name: NetStudy CI Pipeline

on:
  push:
    branches: [ main, 'feat/**' ]
  pull_request:
    branches: [ main, 'feat/**' ]

jobs:
  validate:
    name: Lint, Units & Headless Regressions
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Check JavaScript Syntax
        run: npm run test:syntax

      - name: Check Git Whitespace & Formatting
        run: npm run test:whitespace

      - name: Execute Headless Unit & Performance Regression Suite
        run: npm run test:units

  e2e:
    name: Cross-Browser E2E & Accessibility Tests
    needs: validate
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Cache Playwright Browsers
        id: playwright-cache
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}

      - name: Install Playwright Browsers
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps chromium

      - name: Install OS Dependencies Only
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        run: npx playwright install-deps chromium

      - name: Run Playwright E2E & axe-core Tests
        run: npm run test:e2e

      - name: Upload Test Artifacts on Failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-failure-artifacts
          path: |
            playwright-report/
            test-results/
          retention-days: 7
```

---

## 4. Quy ước Đăng ký Artifacts (Artifact Upload Contract)

- **Khi bài test PASS**: Không upload artifacts nhằm tiết kiệm băng thông và dung lượng lưu trữ của GitHub Actions.
- **Khi bài test FAIL**: Tự động đóng gói và upload:
  - `playwright-report/`: Báo cáo HTML trực quan với ảnh chụp màn hình từng bước.
  - `test-results/`: Chứa các tệp `trace.zip` có thể mở trực tiếp bằng `npx playwright show-trace` để tái hiện chính xác thao tác chuột, bàn phím và trạng thái DOM tại thời điểm xảy ra lỗi.
  - **Thời gian lưu trữ**: Tự động hết hạn sau 7 ngày (`retention-days: 7`).
