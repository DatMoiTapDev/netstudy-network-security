# Research & Technical Decisions: NetStudy Automated Testing & Reliability

**Feature Directory**: `specs/005-testing-reliability`  
**Date**: 2026-11-04  
**Status**: Completed & Ratified  

---

## 1. Decision 1: Lựa chọn Framework Kiểm thử Trình duyệt Thực tế (Real-Browser E2E)

- **Quyết định**: Sử dụng **Playwright** (`@playwright/test` làm `devDependencies`).
- **Lý do lựa chọn**:
  1. Hỗ trợ đa engine hiện đại: Chromium, Firefox và WebKit trên cùng một API đồng nhất.
  2. Tích hợp sẵn cơ chế **Virtual Clock** (`page.clock.fastForward` / `page.clock.setFixedTime`), cho phép tua nhanh bài thi 75 phút về 0 giây chỉ trong vài mili-giây mà không cần dùng lệnh `sleep` hay hack `Date.now` thủ công.
  3. Cơ chế Auto-waiting thông minh: tự động đợi các phần tử DOM hiển thị, không bị ảnh hưởng bởi timing của CPU, triệt tiêu nguy cơ Flaky Tests.
  4. Hỗ trợ tracing chuyên sâu: ghi lại toàn bộ DOM snapshot, network request, timeline và screenshot dưới dạng tệp `trace.zip` khi kiểm thử thất bại.
  5. Độc lập hoàn toàn với runtime bundle: chỉ cài đặt ở cấp độ root dự án dưới `devDependencies`, $100\%$ không gây ảnh hưởng tới thư mục phân phối `dist/`.
- **Các giải pháp thay thế đã xem xét**:
  - *Cypress*: Hạn chế trong việc hỗ trợ đa tab, hỗ trợ WebKit (Safari engine) còn ở mức thử nghiệm, tốc độ khởi động chậm hơn Playwright và cấu trúc kiến trúc nặng hơn.
  - *Puppeteer*: Chỉ hỗ trợ mạnh trên Chromium, thiếu runner kiểm thử song song tích hợp sẵn và bộ assertion phong phú so với `@playwright/test`.
  - *Selenium*: Cồng kềnh, đòi hỏi cài đặt WebDriver driver độc lập, tốc độ chậm và khó duy trì trong CI hiện đại.

---

## 2. Decision 2: Chiến lược Quét Trợ năng (Accessibility) & Ranh giới WCAG 2.2 AA

- **Quyết định**: Kết hợp **`@axe-core/playwright`** cho các quy tắc tự động hóa với **Tài liệu Hướng dẫn Thẩm định Bàn phím & Ngữ nghĩa (Manual Verification Guide)**.
- **Lý do lựa chọn**:
  1. `axe-core` là công cụ chuẩn mực công nghiệp, phát hiện chính xác các lỗi vi phạm WCAG 2.2 Level AA về: độ tương phản màu sắc (Color Contrast $\ge 4.5:1$ cho text, $\ge 3:1$ cho UI components), nhãn nút bấm (`aria-label`, accessible names), cấu trúc tiêu đề (`h1`-`h6`), và các thuộc tính ARIA (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-modal`).
  2. Nhận thức rõ ràng giới hạn kỹ thuật: `axe-core` tự động chỉ bao phủ khoảng $30\% - 40\%$ các tiêu chuẩn WCAG. Các yêu cầu như: thứ tự điều hướng phím Tab logic, trải nghiệm phím tắt bàn phím (`1`/`2`/`3`/`4`, `ArrowLeft`/`ArrowRight`, `Escape`), và ngữ nghĩa trực quan sư phạm bắt buộc phải được kiểm thử bằng các kịch bản hành vi Playwright chuyên biệt (`page.keyboard.press`).
- **Quy tắc nghiệm thu**:
  - Tự động: Quét bằng `@axe-core/playwright` trên toàn bộ 10 routes chính, bắt buộc **0 lỗi vi phạm ở mức `critical` và `serious`**.
  - Bàn phím: 100% kịch bản làm bài thi, mở drawer, đóng modal, chuyển tab ôn tập có thể thực hiện thuần túy bằng bàn phím.

---

## 3. Decision 3: Máy chủ Phục vụ Tĩnh Nội bộ (Local Test Server)

- **Quyết định**: Xây dựng một máy chủ HTTP tĩnh siêu nhẹ bằng Node.js thuần túy tại **`scripts/test-server.cjs`** (sử dụng thư viện `http`, `fs`, `path` có sẵn của Node.js).
- **Lý do lựa chọn**:
  1. **Zero External Dependency**: Không cần cài đặt các package như `serve`, `http-server`, `express` hay `live-server`, giữ cho `devDependencies` gọn nhẹ tối đa.
  2. **Khởi động siêu tốc**: Server Node.js nội bộ khởi động trong dưới $20\text{ms}$, sẵn sàng phục vụ Playwright mà không cần chờ đợi.
  3. **Hỗ trợ đầy đủ MIME types**: Tự động phục vụ đúng các Content-Type cần thiết (`text/html`, `text/css`, `application/javascript`, `image/svg+xml`, `image/png`, `application/json`).
  4. Hoạt động $100\%$ ngoại tuyến trong sandbox hoặc CI runner mà không cần truy cập Internet.
- **Các giải pháp thay thế đã xem xét**:
  - *Truy cập trực tiếp bằng `file:///`*: Bị trình duyệt chặn một số quyền lưu trữ `localStorage`, không kích hoạt được các sự kiện an toàn web và hạn chế Playwright context.
  - *Package `serve`*: Yêu cầu cài đặt thêm hàng chục package phụ thuộc vào `node_modules`, làm tăng thời gian `npm ci` trên GitHub Actions.

---

## 4. Decision 4: Chiến lược Kiểm thử Thời gian Ảo (Deterministic Clock) cho Bài thi 75 phút

- **Quyết định**: Sử dụng API **Playwright Clock** (`page.clock`) để kiểm soát thời gian tuyệt đối.
- **Lý do lựa chọn**:
  1. Bài thi chuẩn của NetStudy kéo dài chính xác 75 phút ($4,500,000\text{ms}$). Nếu sử dụng `sleep` thật trên CI, tiến trình sẽ timeout và tiêu tốn tài nguyên vô ích.
  2. Bằng cách gọi `await page.clock.fastForward(75 * 60 * 1000 + 1000)`, Playwright sẽ kích hoạt tức thì `setInterval` và sự kiện kiểm tra hạn chót (`state.active.deadline`) trong `app.js` trong vòng chưa đầy $50\text{ms}$.
  3. Cho phép kiểm thử các tình huống biên phức tạp: tua nhanh 30 phút, kiểm tra hiển thị đồng hồ "Còn 45 phút", nạp lại trang (reload), kiểm tra đồng hồ tiếp tục đếm từ hạn chót đã lưu trên `localStorage` mà không bị reset về 75 phút ban đầu.
- **Các giải pháp thay thế đã xem xét**:
  - *Sửa đổi mã nguồn `app.js` để truyền thời gian ngắn hơn*: Vi phạm nguyên tắc bảo toàn tính bất biến của mã sản phẩm (Production Invariance).

---

## 5. Decision 5: Cô lập Dữ liệu Kiểm thử & Fixture Sandbox

- **Quyết định**: Sử dụng cơ chế khởi tạo `localStorage` qua Playwright `page.addInitScript()` trước khi tải DOM.
- **Lý do lựa chọn**:
  1. Mỗi bài test chạy trong một browser context sạch, tự động nạp chính xác fixture cần thiết trước khi bất kỳ script nào của trang chạy:
     - `fixture-v1-legacy.json`: Kiểm thử migration v1 sang v2.
     - `fixture-v2-populated.json`: Kiểm thử Dashboard, Analytics, Sổ ôn tập 4 tabs.
     - `fixture-empty-state.json`: Kiểm thử Zero-state onboarding.
     - `fixture-over-100-sessions.json`: Kiểm thử an toàn dữ liệu khi có 120 phiên (không xóa ngầm).
  2. Tuyệt đối không để xảy ra hiện tượng rò rỉ trạng thái (State Pollution) giữa các bài kiểm thử.
  3. Hoàn toàn không sử dụng dữ liệu người dùng thật; 100% dữ liệu kiểm thử là dữ liệu tổng hợp (Synthetic Data).

---

## 6. Decision 6: Kiến trúc Đường ống CI GitHub Actions (`.github/workflows/ci.yml`)

- **Quyết định**: Thiết kế workflow 2 tầng (Fast-Fail Layered Pipeline) kích hoạt trên `pull_request` và `push` nhánh chính.
- **Cấu trúc Pipeline**:
  1. **Stage 1 — Static & Fast Unit Checks** ($\approx 15\text{s}$):
     - `node --check dist/*.js` (Kiểm tra cú pháp).
     - `git diff --check` (Kiểm tra khoảng trắng).
     - `node checks.cjs` (Kiểm tra đề thi 40 câu & ma trận).
     - `node checks-models.cjs` (Kiểm tra 27 mô hình SVG & 112 bước).
     - `node checks-perf.cjs` (Kiểm tra ngân sách dung lượng phân phối).
     - `node checks-learning.cjs` (Kiểm tra thuật toán học tập).
  2. **Stage 2 — Browser E2E & Accessibility Tests** ($\approx 90\text{s}$):
     - Cache thư mục `~/.cache/ms-playwright` để tránh tải lại browser binaries.
     - Khởi chạy static server nội bộ qua `webServer` của Playwright config.
     - Chạy toàn bộ Playwright suite (E2E journeys, mô hình SVG, axe-core scans).
  3. **Stage 3 — Artifact Reporting** (Khi có thất bại):
     - Thu thập `playwright-report/`, traces `.zip` và screenshots đăng ký vào GitHub Actions Artifacts (lưu trữ 7 ngày).
- **Quyền hạn bảo mật**:
  - `permissions: { contents: read }` (Quyền đọc tối thiểu).
  - Không có bước deploy tự động.
  - Không sử dụng secret tokens nhạy cảm.

---

## 7. Decision 7: Ngân sách Hiệu năng & Ranh giới Thư mục Phân phối

- **Quyết định**:
  1. **Thư mục phân phối `dist/`**: Giữ nguyên ngân sách nghiêm ngặt $\le 735.00\text{ KB}$ (dung lượng hiện tại: $734.89\text{ KB}$). Toàn bộ mã Playwright test, axe-core, fixture và CI workflow được tổ chức tại các thư mục `tests/`, `scripts/`, `.github/`, nằm ngoài `dist/`.
  2. **Bộ định vị E2E (Locators)**: Không thêm thuộc tính `data-testid` thừa vào HTML; sử dụng trực tiếp các thuộc tính ngữ nghĩa chuẩn mực có sẵn: `role="tab"`, `role="button"`, `data-action`, `aria-selected` và tiêu đề văn bản.
  3. **Ngưỡng đo lường SLA**:
     - $\text{CLS} = 0.00$.
     - Script load evaluation: $\le 20.0\text{ms}$.
     - Route transition latency: $\le 0.50\text{ms}$ (cho phép sai số biên trên CI runner $\le 1.0\text{ms}$ đối với kiểm thử ảo hóa để tránh fail ngẫu nhiên).
