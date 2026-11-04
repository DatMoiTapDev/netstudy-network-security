# Quickstart Guide: NetStudy Automated Testing & Reliability

**Feature Directory**: `specs/005-testing-reliability`  
**Date**: 2026-11-04  
**Status**: Ready for Verification  

Tài liệu này hướng dẫn cài đặt môi trường, thiết lập máy chủ thử nghiệm cục bộ và thực thi toàn bộ các tầng kiểm thử của NetStudy.

---

## 1. Yêu cầu Tiên quyết (Prerequisites)

- **Node.js**: Phiên bản `18.0.0` trở lên (Khuyến nghị Node.js 20 LTS).
- **Trình duyệt**: Hệ điều hành Windows, macOS hoặc Linux.
- **Git**: Đã cài đặt và trỏ tới nhánh `feat/005-testing-reliability`.

---

## 2. Cài đặt Môi trường Kiểm thử Cục bộ (Local Setup)

Chạy các lệnh sau tại thư mục gốc của repository:

```powershell
# 1. Cài đặt các devDependencies kiểm thử (Playwright, axe-core)
npm install

# 2. Cài đặt trình duyệt kiểm thử Chromium của Playwright
npx playwright install chromium
```

> [!NOTE]
> Thư mục `node_modules` hoàn toàn chỉ phục vụ runner kiểm thử cục bộ và runner CI. Thư mục phát hành `dist/` tuyệt đối không bị ảnh hưởng và giữ nguyên $100\%$ kiến trúc Vanilla không dependencies.

---

## 3. Thực thi Bộ Kiểm thử Cục bộ (Running Tests Locally)

### 3.1. Chạy Tầng 1: Kiểm thử Cú pháp & Unit/SLA Regressions (Siêu nhanh $\approx 1.5\text{s}$)

```powershell
# Kiểm tra cú pháp JavaScript
npm run test:syntax

# Kiểm tra định dạng khoảng trắng Git
npm run test:whitespace

# Chạy toàn bộ 4 bộ test logic, mô hình, SLA và thuật toán học tập
npm run test:units
```

### 3.2. Chạy Tầng 2: Kiểm thử Toàn trình Playwright E2E

Khởi chạy runner Playwright (tự động bật máy chủ tĩnh nội bộ tại cổng 3000):

```powershell
# Chạy toàn bộ E2E tests ở chế độ Headless (ngầm)
npm run test:e2e

# Chạy E2E tests có hiển thị giao diện trình duyệt trực quan (Headed mode)
npm run test:e2e:headed

# Mở Playwright Interactive UI Mode (giao diện đồ họa để debug từng bước)
npm run test:e2e:ui
```

### 3.3. Chạy Tầng 3: Quét Trợ năng Tự động (Accessibility Scans)

```powershell
# Quét tự động axe-core trên toàn bộ các trang giao diện
npm run test:a11y
```

### 3.4. Chạy Toàn bộ Pipeline Kiểm thử Tổng hợp

```powershell
npm test
```

---

## 4. Chẩn đoán Lỗi với Playwright Trace Viewer

Khi có một bài test E2E bị thất bại, Playwright sẽ tự động ghi lại toàn bộ hành trình tương tác, ảnh chụp màn hình và trạng thái DOM tại thời điểm lỗi dưới dạng tệp `trace.zip` trong thư mục `test-results/`.

Để mở và xem lại toàn bộ quá trình:

```powershell
# Mở Playwright Trace Viewer
npx playwright show-trace test-results/<test-folder-name>/trace.zip
```

Hoặc xem báo cáo HTML tổng quan:

```powershell
npx playwright show-report
```

---

## 5. Mô phỏng Thực thi GitHub Actions CI trên Máy Cục bộ

Nếu máy tính của bạn có cài đặt công cụ [act](https://github.com/nektos/act), bạn có thể chạy mô phỏng workflow GitHub Actions cục bộ:

```bash
act pull_request
```

Hoặc kiểm tra chuỗi lệnh tương đương mà CI thực thi:

```powershell
npm run test:syntax && npm run test:whitespace && npm run test:units && npm run test:e2e
```
