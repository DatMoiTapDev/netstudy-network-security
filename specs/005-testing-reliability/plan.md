# Implementation Plan: NetStudy Automated Testing & Reliability

**Branch**: `feat/005-testing-reliability` | **Date**: 2026-11-04 | **Spec**: [`specs/005-testing-reliability/spec.md`](./spec.md)  
**Input**: Feature specification from `specs/005-testing-reliability/spec.md`  

---

## 1. Summary

Xây dựng hệ thống kiểm thử tự động hóa toàn diện cho NetStudy bao gồm:
1. **Kim tự tháp kiểm thử 3 tầng**: Duy trì các bộ kiểm thử unit hiện có (`checks.cjs`, `checks-models.cjs`, `checks-perf.cjs`, `checks-learning.cjs`), xây dựng bộ kiểm thử trình duyệt thực tế Playwright E2E cho 15 luồng người học quan trọng và 27 mô hình tương tác SVG, tích hợp công cụ quét trợ năng tiêu chuẩn công nghiệp `@axe-core/playwright`.
2. **Hạ tầng phục vụ kiểm thử nội bộ**: Tạo máy chủ HTTP tĩnh Node.js độc lập (`scripts/test-server.cjs`), không cài thêm runtime packages, hỗ trợ chạy 100% ngoại tuyến.
3. **Đường ống CI GitHub Actions**: Thiết lập workflow `.github/workflows/ci.yml` tự động kiểm tra cú pháp, unit tests, SLA ngân sách và Playwright E2E trên mỗi Pull Request, với cơ chế upload trace/screenshot khi có lỗi và quyền hạn tối thiểu an toàn (`contents: read`).
4. **Bảo toàn kiến trúc**: Giữ vững tuyệt đối $100\%$ kiến trúc Vanilla HTML/CSS/JavaScript trong `dist/`, 0 runtime dependencies, ngân sách phân phối duy trì ở mức $\le 735.00\text{ KB}$.

---

## 2. Technical Context

- **Language / Runtime**: Modern JavaScript (ES2022+), Node.js $\ge 18.0.0$ (Khuyến nghị Node.js 20 LTS).
- **Core Application Stack**: Pure Vanilla HTML5, CSS3, modern JavaScript trong `dist/` (0 framework, 0 runtime dependencies).
- **Test Harness Stack (devDependencies strictly)**:
  - `@playwright/test`: Framework kiểm thử tự động trình duyệt thực tế đa nền tảng (Chromium, Firefox, WebKit, Mobile).
  - `@axe-core/playwright`: Thư viện kiểm thử trợ năng chuẩn WCAG 2.2 AA.
- **Local Test Server**: `scripts/test-server.cjs` (sử dụng thư viện `http`, `fs`, `path` tích hợp sẵn của Node.js).
- **Storage Sandbox**: Browser `localStorage` sandbox với các synthetic fixtures (`tests/fixtures/`).
- **Target CI Platform**: GitHub Actions runner (`ubuntu-latest`).
- **Performance Budget**: Dung lượng uncompressed toàn bộ `dist/` duy trì $\le 735.00\text{ KB}$ (ngưỡng hiện tại $734.89\text{ KB}$).
- **Target Browser Matrix**: Chromium làm trình duyệt mặc định trên CI (kèm giả lập Mobile $375\text{px}$); Firefox và WebKit hỗ trợ chạy trên máy cục bộ và kiểm thử định kỳ.

---

## 3. Constitution Check

*GATE: Phải đáp ứng tuyệt đối toàn bộ 10 Nguyên tắc Hiến pháp trước khi triển khai.*

| Nguyên tắc Hiến pháp | Trạng thái | Đánh giá Tuân thủ & Biện pháp Kỹ thuật |
| :--- | :---: | :--- |
| **I. Vanilla-First Architecture** | **PASS** | Playwright và axe-core chỉ được khai báo trong `devDependencies` của `package.json`. Thư mục `dist/` tuyệt đối không bị bổ sung bất kỳ thư viện hay runtime framework nào. |
| **II. Feature & Capability Preservation** | **PASS** | Bộ test E2E kiểm chứng và bảo vệ toàn bộ 9 bài học, 95 mục, 264 câu hỏi, 27 mô hình SVG, 112 bước tương tác và chế độ thi thử 40 câu / 75 phút chống suy giảm chức năng. |
| **III. Deterministic Exam Engine Stability** | **PASS** | Duy trì kiểm thử hạt giống `seeded(533)`, ma trận quota 9 chương (4, 3, 3, 6, 5, 5, 6, 5, 3) và ma trận nhận thức trong `checks.cjs` như một cổng chặn bắt buộc trên CI. |
| **IV. Local-First & Privacy Preservation** | **PASS** | Kiểm thử xác nhận 100% dữ liệu lưu trữ tại client `localStorage`. Không gửi dữ liệu ra ngoài. Không upload dữ liệu cá nhân lên CI artifacts (chỉ dùng synthetic fixtures). |
| **V. UI/UX Pro Max Standard** | **PASS** | Kiểm thử tương thích Light / Dark / System Theme trên trình duyệt thực tế, kiểm tra độ tương phản Design Tokens và biến đổi giao diện mượt mà. |
| **VI. WCAG 2.2 AA Accessibility** | **PASS** | Tích hợp `@axe-core/playwright` quét 0 lỗi `critical`/`serious` trên toàn bộ 10 route chính, kiểm thử điều hướng bàn phím thuần túy, nhãn ARIA và `:focus-visible`. |
| **VII. Zero-Dependency & XSS Security** | **PASS** | 0 runtime dependencies. Kiểm thử bảo mật upload JSON $\le 10\text{MB}$ và hàm escape `e()` chống XSS khi render. Workflow CI chỉ cấp quyền `contents: read`. |
| **VIII. Mandatory Headless Regression Testing** | **PASS** | Toàn bộ 4 file `checks*.cjs` được đưa vào Stage 1 của CI Pipeline. CI sẽ fail ngay lập tức nếu bất kỳ bài test nào trả về exit code khác 0. |
| **IX. Spec-Driven Development (SDD)** | **PASS** | Thực thi tuần tự qua các giai đoạn Specification $\rightarrow$ Plan $\rightarrow$ Tasks $\rightarrow$ Implementation $\rightarrow$ Convergence. |
| **X. Controlled Git Operations** | **PASS** | Không tự ý commit, push, merge hoặc deploy production tự động từ CI. |

---

## 4. Project Structure

### 4.1. Tài liệu Thiết kế (Feature 005)

```text
specs/005-testing-reliability/
├── spec.md              # Đặc tả yêu cầu kiểm thử và độ tin cậy
├── plan.md              # Kế hoạch kỹ thuật này (/speckit-plan)
├── research.md          # 7 quyết định kỹ thuật và giải pháp thay thế
├── data-model.md        # Cấu trúc synthetic fixtures và mô hình báo cáo kiểm thử
├── quickstart.md        # Hướng dẫn chạy test cục bộ và chẩn đoán lỗi
├── checklists/
│   └── requirements.md  # Bảng thẩm định chất lượng đặc tả
└── contracts/
    ├── testing-cli-contract.md # Hợp đồng lệnh npm scripts và mã thoát
    └── ci-workflow-contract.md  # Hợp đồng workflow GitHub Actions và artifacts
```

### 4.2. Cấu trúc Mã nguồn & Kiểm thử (Repository Root)

```text
netstudy-network-security/
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI Workflow
├── dist/                              # 100% PURE VANILLA CLIENT BUNDLE (KHÔNG THAY ĐỔI)
│   ├── app.js
│   ├── core.js
│   ├── data.js
│   ├── models.js
│   ├── model-ui.js
│   ├── style.css
│   └── index.html
├── scripts/
│   └── test-server.cjs                # Zero-dependency local static HTTP server
├── tests/                             # PLAYWRIGHT TEST SUITE (devDependencies only)
│   ├── fixtures/                      # Dữ liệu synthetic cô lập
│   │   ├── storage-v1-legacy.json
│   │   ├── storage-v2-populated.json
│   │   └── storage-over-capacity.json
│   ├── helpers/
│   │   ├── storage.js                 # Helper khởi tạo localStorage sandbox
│   │   └── clock.js                   # Helper tua nhanh thời gian giả lập
│   ├── smoke.spec.js                  # 10 route navigation, title & layout
│   ├── learning-journey.spec.js       # Học lý thuyết, đánh dấu hoàn thành, đổi theme
│   ├── practice-adaptive.spec.js      # Luyện tập trắc nghiệm, 4 preset thích ứng
│   ├── exam-simulation.spec.js        # Thi thử 40 câu, đếm ngược, tự nộp khi hết giờ
│   ├── review-mastery.spec.js         # Sổ ôn tập 4 tabs, quy tắc 2 chuỗi đúng CL-01
│   ├── data-resilience.spec.js        # Migration v1->v2, export/import JSON, quota
│   ├── svg-models.spec.js             # 27 mô hình SVG, 112 bước, RSA/DH/OTP
│   ├── accessibility.spec.js          # Quét axe-core WCAG 2.2 AA & phím tắt bàn phím
│   └── responsive-mobile.spec.js      # Mobile drawer, 320px viewport, touch targets
├── checks.cjs                         # Tầng 1: Core exam & curriculum checks
├── checks-models.cjs                  # Tầng 1: 27 mô hình SVG logic checks
├── checks-perf.cjs                    # Tầng 1: Core Web Vitals & payload budget checks
├── checks-learning.cjs                # Tầng 1: Learning experience & mastery checks
├── playwright.config.js               # Cấu hình Playwright test runner
├── package.json                       # Khai báo devDependencies & test scripts
└── package-lock.json
```

---

## 5. Critical User Journeys (15 Hành trình Kiểm thử E2E)

Bộ kiểm thử Playwright bao phủ toàn diện 15 hành trình người học thực tế:

1. **Người dùng mới mở website (`smoke.spec.js`)**: Kiểm tra title, navigation desktop/mobile, thẻ Onboarding chào mừng khi chưa có dữ liệu (`Zero-state`).
2. **Đọc bài và đánh dấu hoàn thành (`learning-journey.spec.js`)**: Mở Bài 1, click "Đánh dấu đã học mục này", kiểm tra icon tích xanh cập nhật tức thì trên thanh điều hướng bên phải và tăng bộ đếm trên Dashboard.
3. **Làm bài luyện tập trắc nghiệm (`practice-adaptive.spec.js`)**: Mở `#practice`, chọn bài học, trả lời câu hỏi ở chế độ học (`learn`), xác nhận hiển thị giải thích đáp án ngay sau khi chọn.
4. **Làm bài thi thử 40 câu / 75 phút (`exam-simulation.spec.js`)**: Khởi tạo đề cố định A, chọn đáp án, đánh dấu xem lại (`flag`), chuyển câu bằng phím tắt và bảng điều hướng.
5. **Tự nộp bài khi hết giờ (`exam-simulation.spec.js`)**: Sử dụng `page.clock.fastForward(75 * 60 * 1000)` để kích hoạt tự động nộp bài khi hết giờ, kiểm tra trang kết quả hiển thị huy hiệu "Hết giờ".
6. **Xem kết quả và giải thích (`exam-simulation.spec.js`)**: Kiểm tra bảng điểm thang 10, phân tích theo chủ đề, danh sách câu hỏi kèm đáp án đúng và lời giải thích.
7. **Luyện lại câu sai (`review-mastery.spec.js`)**: Nhấn "Luyện lại câu sai / bỏ trống" từ trang kết quả, khởi tạo phiên làm bài chứa đúng các câu sai.
8. **Chuyển trạng thái Mastery theo quy tắc CL-01 (`review-mastery.spec.js`)**: Làm sai câu hỏi $\rightarrow$ câu vào tab "Cần ôn tập" (`needs_practice`) $\rightarrow$ làm đúng lần 1 trong luyện tập $\rightarrow$ chuyển sang "Đang củng cố" (`in_review`, chuỗi đúng $= 1$) $\rightarrow$ làm đúng lần 2 trong phiên luyện tập riêng biệt $\rightarrow$ chuyển sang "Đã khắc phục" (`mastered`, chuỗi đúng $= 2$). Làm sai reset chuỗi về 0. Làm đúng trong bài thi thử 40 câu không chuyển thành `mastered`.
9. **Sử dụng 4 preset Adaptive Practice (`practice-adaptive.spec.js`)**: Chọn lần lượt 4 preset: Luyện câu chưa làm, Luyện câu hay sai, Củng cố chương yếu, và Hỗn hợp 50/30/20. Kiểm tra số lượng trả về chính xác và $0\%$ câu hỏi bị trùng lặp.
10. **Bảng điều khiển & Phân tích điểm thi (`learning-journey.spec.js`)**: Mở `#home` và `#history`, kiểm tra 4 thẻ tổng quan tiến độ, bảng 9 chương, và biểu đồ đường SVG vẽ đúng tọa độ điểm thực tế.
11. **Xuất / Nhập bản sao lưu JSON (`data-resilience.spec.js`)**: Xuất sao lưu JSON từ `#settings`, xóa dữ liệu `localStorage`, nạp lại tệp JSON và xác nhận khôi phục $100\%$ lịch sử và tiến độ.
12. **Bảo toàn dữ liệu sau khi tải lại trang (`data-resilience.spec.js`)**: Đang làm dở bài thi, tải lại trang (`page.reload()`), xác nhận bài thi tiếp tục ở đúng câu hỏi đang làm và đồng hồ đếm ngược giữ nguyên hạn chót tuyệt đối.
13. **Đổi giao diện Sáng / Tối / Tự động (`learning-journey.spec.js`)**: Nhấn nút đổi theme, xác thực thuộc tính `data-theme` trên thẻ `<html>` và token màu sắc thay đổi đồng bộ.
14. **Điều hướng bàn phím thuần túy (`accessibility.spec.js`)**: Sử dụng phím `Tab`, `Shift+Tab`, `1`/`2`/`3`/`4` và `ArrowLeft`/`ArrowRight` để hoàn thành bài thi mà không dùng chuột; xác nhận viền `:focus-visible` hiển thị rõ nét.
15. **Tương tác với 27 mô hình SVG (`svg-models.spec.js`)**: Mở từng mô hình, click "Bước tiếp theo", xác nhận các nút và cạnh SVG nhận lớp `is-active`, công thức toán học và số liệu minh họa hiển thị chuẩn xác (RSA, Diffie-Hellman, OTP).

---

## 6. GitHub Actions CI Architecture

Workflow `.github/workflows/ci.yml` được tối ưu hóa tốc độ và độ tin cậy:

```text
PR / Push Event
      │
      ▼
Job: validate (Ubuntu, Node 20, Cache npm)
  ├── 1. node --check dist/*.js
  ├── 2. git diff --check
  └── 3. npm run test:units (checks.cjs, checks-models.cjs, checks-perf.cjs, checks-learning.cjs)
      │
      ▼ (chỉ chạy khi validate PASS)
Job: e2e (Ubuntu, Node 20, Cache ms-playwright)
  ├── 1. npx playwright install-deps chromium
  ├── 2. npm run test:e2e (Khởi chạy test-server nội bộ + Playwright Chromium & Mobile)
  └── 3. Upload failure artifacts (playwright-report/, traces.zip) khi thất bại
```

- **Thời gian mục tiêu**: $\le 2.5\text{ phút}$ trên standard runner.
- **Quyền hạn**: `permissions: { contents: read }` (0 secret tokens).
- **Phòng chống Flakiness**:
  - Không hard sleep; Playwright auto-waiting và virtual clock tua thời gian.
  - Cấu hình `retries: 2` trên CI đối với các bài E2E có render SVG phức tạp.

---

## 7. Performance Regression Strategy

- **Ngân sách Kích thước Mã nguồn**:
  - Thư mục phân phối `dist/`: Giữ nguyên ngân sách trần **$\le 735.00\text{ KB}$** ($752,640\text{ bytes}$).
  - Giám sát qua `checks-perf.cjs`: Bất kỳ thay đổi nào làm `dist/` vượt quá $735.00\text{ KB}$ sẽ lập tức làm thất bại bài test và chặn merge PR.
- **Độ trễ Chuyển Route & Render**:
  - Đo lường trung bình 100 lần chuyển route: $\le 0.50\text{ms/route}$ (ngưỡng cảnh báo trên CI runner ảo hóa: $\le 1.00\text{ms}$).
  - Render mô hình SVG: $\le 2.0\text{ms/model}$.
  - Cumulative Layout Shift: $\text{CLS} = 0.00$.

---

## 8. Phases & Task Breakdown Strategy (Preview for Phase 2)

Kế hoạch triển khai được chia thành 5 giai đoạn có thể kiểm chứng độc lập:
- **Phase A**: Thiết lập Hạ tầng Kiểm thử (`package.json`, `playwright.config.js`, `scripts/test-server.cjs`, Synthetic Fixtures).
- **Phase B**: Xây dựng Bộ Kiểm thử E2E Cốt lõi (Smoke, Learning Journey, Practice & Adaptive Engine).
- **Phase C**: Xây dựng Kiểm thử Phòng thi & Sổ ôn tập (Exam 75-min Fast-forward clock, CL-01 Mastery State Machine).
- **Phase D**: Kiểm thử Trợ năng & 27 Mô hình SVG (axe-core WCAG 2.2 AA, Keyboard navigation, 112 mechanism steps).
- **Phase E**: Xây dựng Kiểm thử An toàn Dữ liệu & Đường ống CI (Data resilience, QuotaExceededError, `.github/workflows/ci.yml`, Cache & Artifacts).
