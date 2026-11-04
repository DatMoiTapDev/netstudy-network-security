# Tasks: Production Readiness & Security Hardening (Feature 006)

**Input**: Design documents from `specs/006-production-readiness/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`)
**Prerequisites**: `spec.md`, `plan.md`, `.specify/memory/constitution.md` (ratified)
**Organization**: Structured across 8 sequential engineering phases (Phase A through Phase H) covering Baseline & Inventory, Client-Side Security, CSP & Supply Chain, Data Integrity & Recovery, Accessibility Hardening, Release Validation, Reliability & Regression, and Release Readiness.

---

## Task Format Reference
`- [ ] [TaskID] [P?] Description with file path`
- **[P]**: Parallelizable (different files, no blocking dependencies)
- Each task includes: **File**, **Dependencies**, **Requirement Reference**, **Acceptance Criteria**, **Verification Method**, and **Expected Evidence**.

---

## Phase A: Baseline & Security Inventory (Nền tảng & Kiểm kê Bề mặt Tấn công)

**Purpose**: Xác lập đường cơ sở bảo mật, trợ năng và hiệu năng trước khi thực hiện bất kỳ thay đổi nào.

- [X] T001 Execute pre-hardening regression baseline across all existing suites
  - **File**: `checks.cjs`, `checks-models.cjs`, `checks-perf.cjs`, `checks-learning.cjs`
  - **Dependencies**: None
  - **Requirement Reference**: Principle VIII, FR-007, FR-010
  - **Acceptance Criteria**: Toàn bộ 4 bộ test unit hiện có đều PASS với mã thoát 0 (264 câu hỏi, 27 mô hình SVG, tải script $\le 20\text{ms}$, payload $\le 735.00\text{ KB}$).
  - **Verification Method**: `node checks.cjs; node checks-models.cjs; node checks-perf.cjs; node checks-learning.cjs`
  - **Expected Evidence**: Console JSON log trả về `"status": "PASS"` và 0 mã lỗi.

- [X] T002 Audit GitHub Actions workflows and Pages configuration
  - **File**: `.github/workflows/pages.yml`, `.github/workflows/ci.yml`
  - **Dependencies**: None
  - **Requirement Reference**: Principle X, FR-010, CTR-DEPLOY-001
  - **Acceptance Criteria**: Phát hiện chính xác lỗi `actions/checkout@v6` trong `pages.yml`, rà soát quyền hạn `permissions: { contents: read }`, và ghi nhận các bước kiểm thử còn thiếu trong luồng build deploy.
  - **Verification Method**: Đọc và đối chiếu cú pháp workflow với chuẩn GitHub Actions.
  - **Expected Evidence**: Bảng kiểm toán chỉ ra dòng 20 `pages.yml` và thiếu sót pre-deploy checks.

- [X] T003 Inventory client-side trust boundaries, dynamic DOM insertions and attack surfaces
  - **File**: `dist/app.js`, `dist/core.js`, `dist/model-ui.js`
  - **Dependencies**: None
  - **Requirement Reference**: Principle VII, FR-001, FR-003
  - **Acceptance Criteria**: Lập danh mục toàn bộ 27 điểm sử dụng `innerHTML`, các điểm bóc tách `location.hash`, sự kiện `onhashchange`, ô tìm kiếm `courseSearch` / `termSearch`, và luồng nạp tệp tại `#importFile`.
  - **Verification Method**: `Select-String -Path "dist\*.js" -Pattern "innerHTML|location\.hash|files\[0\]"`
  - **Expected Evidence**: Bảng kiểm kê chi tiết 27 vị trí `innerHTML` và xác nhận mức độ bao phủ của hàm `e()`.

- [X] T004 Audit npm devDependencies and lockfile integrity
  - **File**: `package.json`, `package-lock.json`
  - **Dependencies**: None
  - **Requirement Reference**: Principle VII, SC-001
  - **Acceptance Criteria**: Lệnh `npm audit` ghi nhận 0 lỗ hổng bảo mật (0 critical, 0 high, 0 moderate, 0 low); xác nhận thư mục phát hành `dist/` duy trì 0 dependencies.
  - **Verification Method**: `npm audit`
  - **Expected Evidence**: Output `found 0 vulnerabilities` từ npm registry.

- [X] T005 Record baseline accessibility, performance, and memory metrics
  - **File**: `specs/006-production-readiness/quickstart.md`
  - **Dependencies**: T001
  - **Requirement Reference**: Principle VI, Principle VIII, SC-002, SC-003
  - **Acceptance Criteria**: Ghi lại baseline uncompressed payload $734.89\text{ KB}$, script load time $17.25\text{ms}$, CLS $0.00$, và kết quả quét 10 route qua `npm run test:a11y`.
  - **Verification Method**: `node checks-perf.cjs && npm run test:a11y`
  - **Expected Evidence**: Hồ sơ dữ liệu đo lường ban đầu được lưu trữ cho việc đối chiếu hồi quy.

---

## Phase B: Client-Side Security (An ninh Phía Client & Chống XSS)

**Purpose**: Loại bỏ triệt để mọi rủi ro DOM-based XSS, HTML injection, URL injection và nạp tệp độc hại.

- [X] T006 Implement automated security test suite in `tests/security.spec.js`
  - **File**: `tests/security.spec.js`
  - **Dependencies**: T001
  - **Requirement Reference**: Principle VII, FR-001, SC-001, US1
  - **Acceptance Criteria**: Tạo bộ test Playwright chuyên biệt kiểm thử: chèn payload script qua URL hash (`#lesson/<script>`), chèn thẻ `<img>` lỗi vào tiêu đề sao lưu JSON, kiểm tra thuộc tính CSP meta, và kiểm tra từ chối tệp > 10MB.
  - **Verification Method**: `npx playwright test tests/security.spec.js`
  - **Expected Evidence**: Runner nhận diện và thực thi bộ test bảo mật.

- [X] T007 Implement client-side 10MB file size guardrail in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T006
  - **Requirement Reference**: Principle VII, FR-003, CTR-SEC-001, US2
  - **Acceptance Criteria**: Trong listener `onchange` của `#importFile`, bổ sung kiểm tra `if (f.size > 10 * 1024 * 1024)` trước khi gọi `f.text()`; hiển thị toast cảnh báo thân thiện và hủy tiến trình đọc file.
  - **Verification Method**: Chạy test case nạp tệp giả lập > 10MB trong `tests/security.spec.js`.
  - **Expected Evidence**: Tệp lớn bị từ chối ngay lập tức mà không tiêu tốn RAM trình duyệt.

- [X] T008 [P] Audit and sanitize all 27 `innerHTML` dynamic interpolation points in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T003
  - **Requirement Reference**: Principle VII, FR-001, CTR-SEC-001, US1
  - **Acceptance Criteria**: Rà soát 27 vị trí `innerHTML`: đảm bảo mọi biến từ dữ liệu người dùng (`title`, `stem`, `options`, `query`, `note`) đều được bọc qua `e()` hoặc hàm tạo phần tử an toàn; không có chuỗi thô nào được nối trực tiếp vào HTML.
  - **Verification Method**: Quét tĩnh regex và chạy test injection XSS.
  - **Expected Evidence**: Mã nguồn không còn bất kỳ chuỗi thô không qua `e()` nào trong template literal.

- [X] T009 [P] Sanitize route hash parsing and invalid route fallbacks in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T006
  - **Requirement Reference**: Principle VII, FR-001, US1
  - **Acceptance Criteria**: Bóc tách `location.hash` an toàn: nếu `id`, `sectionId`, hoặc `modelId` chứa ký tự đặc biệt không hợp lệ hoặc không khớp với dữ liệu, tự động điều hướng an toàn về trang danh mục tương ứng mà không in ký tự lỗi ra DOM.
  - **Verification Method**: Test các URL hash dị dạng: `#lesson/invalid<script>`, `#result/non-existent`.
  - **Expected Evidence**: Ứng dụng điều hướng về `#courses` hoặc `#history` mượt mà, không sinh lỗi DOM.

- [X] T010 Verify malicious JSON backup ingestion rejection in `dist/core.js` and `dist/app.js`
  - **File**: `dist/core.js`, `dist/app.js`
  - **Dependencies**: T007, T008
  - **Requirement Reference**: Principle VII, FR-003, EC-01, US2
  - **Acceptance Criteria**: Nạp tệp JSON có trường `title` chứa `<script>alert(1)</script>` hoặc ID câu hỏi không có trong `bank`: hệ thống từ chối an toàn hoặc khử nhiễm khi render, không kích hoạt script độc hại.
  - **Verification Method**: `npx playwright test tests/security.spec.js -g "malicious json"`
  - **Expected Evidence**: DOM hiển thị text escaped `&lt;script&gt;`, `dialog` alert không bị kích hoạt.

- [X] T011 Verify absolute absence of `eval`, `new Function`, and unsafe dynamic evaluation
  - **File**: `dist/*.js`
  - **Dependencies**: T008
  - **Requirement Reference**: Principle VII, SC-001, US1
  - **Acceptance Criteria**: Quét toàn bộ tệp JavaScript trong `dist/`: xác nhận 0 lần sử dụng `eval(`, `new Function(`, `setTimeout("string")`, `setInterval("string")`.
  - **Verification Method**: `Select-String -Path "dist\*.js" -Pattern "\beval\(|new\s+Function" | Measure-Object`
  - **Expected Evidence**: Count bằng 0.

---

## Phase C: CSP & Supply Chain (Content Security Policy & Chuỗi Cung ứng)

**Purpose**: Thiết lập ranh giới CSP thẻ meta trên GitHub Pages, rà soát quyền hạn workflow và bảo vệ chuỗi cung ứng.

- [X] T012 Evaluate and implement Meta Content Security Policy in `dist/index.html`
  - **File**: `dist/index.html`
  - **Dependencies**: T008
  - **Requirement Reference**: Principle VII, FR-002, CTR-SEC-001, US1
  - **Acceptance Criteria**: Thêm thẻ `<meta http-equiv="Content-Security-Policy">` vào `<head>` với cấu hình: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self';`.
  - **Verification Method**: Kiểm tra thẻ meta trong DOM và kiểm tra console không có lỗi vi phạm CSP.
  - **Expected Evidence**: Trình duyệt áp dụng chính sách CSP thành công, mọi tính năng ứng dụng chạy bình thường.

- [X] T013 Verify external resource isolation under CSP
  - **File**: `tests/security.spec.js`
  - **Dependencies**: T012
  - **Requirement Reference**: Principle VII, FR-002, SC-001, US1
  - **Acceptance Criteria**: Giả lập việc chèn một thẻ `<script src="https://evil.com/malicious.js">` hoặc `<iframe src="...">`: xác nhận trình duyệt chặn lại theo chính sách CSP.
  - **Verification Method**: `npx playwright test tests/security.spec.js -g "csp enforcement"`
  - **Expected Evidence**: Trình duyệt ghi nhận vi phạm CSP và chặn nạp tài nguyên từ nguồn ngoài.

- [X] T014 Fix GitHub Actions checkout action version in `.github/workflows/pages.yml`
  - **File**: `.github/workflows/pages.yml`
  - **Dependencies**: T002
  - **Requirement Reference**: Principle X, FR-010, CTR-DEPLOY-001, US5
  - **Acceptance Criteria**: Sửa đổi dòng 20 từ `actions/checkout@v6` thành phiên bản chính thức `actions/checkout@v4`.
  - **Verification Method**: Kiểm tra cú pháp YAML và xác thực action version tồn tại.
  - **Expected Evidence**: Tệp workflow sử dụng `actions/checkout@v4`.

- [X] T015 Harden GitHub Actions permissions in `.github/workflows/pages.yml`
  - **File**: `.github/workflows/pages.yml`
  - **Dependencies**: T014
  - **Requirement Reference**: Principle X, FR-010, CTR-DEPLOY-001, US5
  - **Acceptance Criteria**: Xác nhận quyền hạn cấp độ top-level là `permissions: { contents: read }`; chỉ cấp `permissions: { pages: write, id-token: write }` cho riêng job `deploy` liên kết với `environment: github-pages`.
  - **Verification Method**: Rà soát cấu trúc phân quyền trong YAML.
  - **Expected Evidence**: Không có quyền thừa ngoài phạm vi đọc mã nguồn và xuất bản trang tĩnh.

- [X] T016 Add pre-deployment regression quality gate to `.github/workflows/pages.yml`
  - **File**: `.github/workflows/pages.yml`
  - **Dependencies**: T014
  - **Requirement Reference**: Principle VIII, FR-010, CTR-DEPLOY-001, US5
  - **Acceptance Criteria**: Bổ sung bước thực thi `node checks-perf.cjs` và `node checks-learning.cjs` trong job `build` trước khi gọi `upload-pages-artifact`.
  - **Verification Method**: Kiểm tra các lệnh chạy trong job `build`.
  - **Expected Evidence**: Cả 4 bài kiểm thử `checks*.cjs` đều được thực thi và bắt buộc pass trước khi deploy.

- [X] T017 [P] Propose Dependabot configuration for automated dependency security monitoring
  - **File**: `.github/dependabot.yml`
  - **Dependencies**: T004
  - **Requirement Reference**: Principle VII, SC-001
  - **Acceptance Criteria**: Tạo tệp cấu hình `.github/dependabot.yml` quét định kỳ hàng tuần cho hệ sinh thái `npm` và `github-actions`.
  - **Verification Method**: Kiểm tra định dạng YAML hợp lệ của Dependabot.
  - **Expected Evidence**: Tệp `.github/dependabot.yml` sẵn sàng để GitHub tự động theo dõi bảo mật devDependencies.

---

## Phase D: Data Integrity & Recovery (Toàn vẹn Dữ liệu & Khôi phục)

**Purpose**: Đảm bảo an toàn bộ nhớ cục bộ, không mất mát dữ liệu, xử lý giới hạn dung lượng và sao lưu an toàn.

- [X] T018 Verify idempotent schema migration v1 to v2 under edge conditions
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T001
  - **Requirement Reference**: Principle IV, FR-003, CL-02, US2
  - **Acceptance Criteria**: Chạy kiểm thử di chuyển với: state rỗng, state có lịch sử trên 100 phiên, state thiếu trường, state đã ở v2; xác nhận hàm `migrateStorageToV2()` không làm mất bất kỳ mục đã học hoặc bài thi nào.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "migration"`
  - **Expected Evidence**: 100% dữ liệu nguyên vẹn sau khi nâng cấp lược đồ.

- [X] T019 Verify explicit user confirmation before state overwrite
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T007
  - **Requirement Reference**: Principle IV, FR-003, US2
  - **Acceptance Criteria**: Khi nhập tệp sao lưu, nếu người dùng bấm "Cancel" trên hộp thoại xác nhận `confirm`, dữ liệu `localStorage` giữ nguyên vẹn 100%; chỉ khi bấm "OK" thì dữ liệu mới được nạp.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "confirm overwrite"`
  - **Expected Evidence**: Trạng thái state cũ không bị thay thế khi người dùng từ chối.

- [X] T020 Verify QuotaExceededError non-destructive alert modal
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T001
  - **Requirement Reference**: Principle IV, FR-003, CL-03, EC-02, US2
  - **Acceptance Criteria**: Khi giả lập lỗi `QuotaExceededError`: modal `#quotaModal` xuất hiện, cung cấp nút tải sao lưu JSON và nút xác nhận trước khi dọn dẹp; tuyệt đối không tự động xóa ngầm dữ liệu.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "quota exceeded"`
  - **Expected Evidence**: Dữ liệu lịch sử giữ nguyên toàn bộ cho đến khi người dùng chủ động bấm dọn dẹp.

- [X] T021 Verify safe retention and explicit pruning of history over 100 sessions
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T020
  - **Requirement Reference**: Principle IV, FR-003, CL-03, US2
  - **Acceptance Criteria**: Nạp `storage-over-capacity.json` (120 phiên): xác nhận toàn bộ 120 phiên hiển thị đầy đủ, banner cảnh báo xuất hiện; chỉ cắt về 100 phiên khi người dùng xác nhận rõ ràng.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "retention over 100"`
  - **Expected Evidence**: Mảng `history` giữ 120 phiên trước khi xác nhận và 100 phiên sau khi xác nhận.

- [X] T022 Verify active exam session recovery and deadline persistence across reload
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T001
  - **Requirement Reference**: Principle III, Principle IV, EC-03, US2
  - **Acceptance Criteria**: Đang làm bài thi, reload trang: câu hỏi đang làm dở, các câu đã chọn trước đó, và hạn chót `deadline` không bị reset lại.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "session recovery"`
  - **Expected Evidence**: Trạng thái bài thi tiếp tục chính xác tại thời điểm trước khi reload.

- [X] T023 Verify complete offline functionality without network access (EC-05)
  - **File**: `tests/smoke.spec.js`
  - **Dependencies**: T001
  - **Requirement Reference**: Principle I, Principle IV, EC-05, US2
  - **Acceptance Criteria**: Thiết lập `context.setOffline(true)`: học viên vẫn có thể đọc toàn bộ 9 bài học, tra cứu 278 thuật ngữ, tương tác 27 mô hình, và làm bài thi 40 câu bình thường.
  - **Verification Method**: `npx playwright test tests/smoke.spec.js -g "offline functionality"`
  - **Expected Evidence**: Tất cả các tính năng cốt lõi hoạt động trơn tru không cần kết nối mạng.

---

## Phase E: Accessibility (Kiểm toán & Nâng cao Trợ năng WCAG 2.2 AA)

**Purpose**: Đạt chuẩn WCAG 2.2 AA toàn diện: bẫy tiêu điểm modal, hỗ trợ phím Escape, reduced motion, và nhãn tiếp cận SVG.

- [X] T024 Implement modal focus trap and Escape key dismissal helper in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T008
  - **Requirement Reference**: Principle VI, FR-005, CTR-A11Y-001, US3
  - **Acceptance Criteria**: Xây dựng cơ chế bẫy tiêu điểm (`trapFocus`): khi `#quotaModal` hoặc `#mobileDrawer` mở, tiêu điểm bàn phím tuần hoàn giữa các nút trong modal, phím `Escape` đóng modal và hoàn trả tiêu điểm về `triggerElement`.
  - **Verification Method**: Kiểm tra tương tác bàn phím với phím Tab và Escape trên modal.
  - **Expected Evidence**: Tiêu điểm không bị lọt ra ngoài nền; modal đóng ngay khi bấm Escape.

- [X] T025 Implement CSS `prefers-reduced-motion` media query in `dist/style.css`
  - **File**: `dist/style.css`
  - **Dependencies**: None
  - **Requirement Reference**: Principle VI, FR-006, CTR-A11Y-001, US3
  - **Acceptance Criteria**: Thêm media query `@media (prefers-reduced-motion: reduce)`: vô hiệu hóa chuyển động xoay của `.shield`, hiệu ứng lơ lửng của `.float-tag`, và chuyển đổi thời gian động thành tức thì ($0.01\text{ms}$).
  - **Verification Method**: Bật chế độ reduced motion trong Playwright `page.emulateMedia({ reducedMotion: 'reduce' })`.
  - **Expected Evidence**: Thuộc tính animation duration chuyển về $0.01\text{ms}$.

- [X] T026 [P] Add accessible descriptions and `role="img"` to all 27 SVG mechanism models in `dist/models.js` and `dist/model-ui.js`
  - **File**: `dist/models.js`, `dist/model-ui.js`
  - **Dependencies**: None
  - **Requirement Reference**: Principle II, Principle VI, FR-006, CTR-A11Y-001, US3
  - **Acceptance Criteria**: Mỗi thẻ `<svg class="model-svg">` được bổ sung thuộc tính `role="img"`, thẻ `<title id="model-title-{id}">[Tên mô hình]</title>`, và `aria-labelledby="model-title-{id}"`; nút chuyển bước có nhãn `aria-label` mô tả số bước.
  - **Verification Method**: Quét cấu trúc DOM của các mô hình trực quan trong Playwright.
  - **Expected Evidence**: Trình đọc màn hình nhận diện được tên và chức năng của từng mô hình SVG.

- [X] T027 [P] Add accessible description to inline SVG score trend chart in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T008
  - **Requirement Reference**: Principle VI, FR-006, CTR-A11Y-001, US3
  - **Acceptance Criteria**: Thẻ `<svg class="score-chart">` trong trang `#history` được bổ sung thuộc tính `role="img"` và `aria-label="Biểu đồ xu hướng điểm số thi thử"`.
  - **Verification Method**: Kiểm tra thuộc tính thẻ SVG trong `tests/learning-journey.spec.js`.
  - **Expected Evidence**: Thẻ SVG có đầy đủ thuộc tính trợ năng ngữ nghĩa.

- [X] T028 Verify keyboard-only navigation across exam, review and practice flows
  - **File**: `tests/accessibility.spec.js`
  - **Dependencies**: T024
  - **Requirement Reference**: Principle VI, FR-006, SC-002, US3
  - **Acceptance Criteria**: Thao tác toàn bộ bài thi 40 câu bằng phím tắt: chọn đáp án bằng `1`/`2`/`3`/`4` hoặc `A`/`B`/`C`/`D`, gắn cờ bằng `F`, chuyển câu bằng mũi tên, chuyển tab ôn tập bằng phím mũi tên.
  - **Verification Method**: `npx playwright test tests/accessibility.spec.js -g "Keyboard shortcuts"`
  - **Expected Evidence**: Toàn bộ luồng thi và ôn tập hoàn thành 100% không dùng chuột.

- [X] T029 Verify high-contrast `:focus-visible` outline visibility across all interactive elements
  - **File**: `tests/accessibility.spec.js`
  - **Dependencies**: T024
  - **Requirement Reference**: Principle VI, FR-006, SC-002, US3
  - **Acceptance Criteria**: Mọi nút bấm, liên kết, và input khi nhận focus bàn phím đều hiển thị viền `:focus-visible` độ dày $\ge 2\text{px}$, màu sắc tương phản cao $\ge 3:1$ so với nền.
  - **Verification Method**: `npx playwright test tests/accessibility.spec.js -g "focus visible"`
  - **Expected Evidence**: Computed style của phần tử có `outline-width >= 2px`.

- [X] T030 Execute comprehensive automated `@axe-core/playwright` scan across all 10 routes in Light and Dark themes
  - **File**: `tests/accessibility.spec.js`
  - **Dependencies**: T024, T025, T026, T027
  - **Requirement Reference**: Principle VI, FR-006, SC-002, US3
  - **Acceptance Criteria**: Quét axe-core trên toàn bộ 10 route chính (`#home`, `#courses`, `#lesson/1`, `#terms`, `#models`, `#practice`, `#exam`, `#review`, `#history`, `#settings`) trên cả Light và Dark Mode: ghi nhận **0 vi phạm ở mức `critical` hoặc `serious`**.
  - **Verification Method**: `npm run test:a11y`
  - **Expected Evidence**: Console output xác nhận 0 critical / 0 serious violations.

---

## Phase F: Release Validation (Xác thực Bản phát hành & GitHub Pages Readiness)

**Purpose**: Thẩm định tính toàn vẹn của thư mục `dist/`, quản lý phiên bản tài nguyên, cấu hình 404 và PWA metadata.

- [X] T031 Implement standardized asset cache busting query versioning in `dist/index.html`
  - **File**: `dist/index.html`
  - **Dependencies**: T012
  - **Requirement Reference**: Principle I, FR-007, US4
  - **Acceptance Criteria**: Cập nhật tất cả liên kết tài nguyên trong `dist/index.html` với hậu tố `?v=6` đồng bộ (bao gồm `data.js?v=6`, `core.js?v=6`, `models.js?v=6`, `model-ui.js?v=6`, `app.js?v=6`, `style.css?v=6`, `models.css?v=6`, `favicon.svg?v=6`).
  - **Verification Method**: Đọc nội dung `dist/index.html` và kiểm tra các chuỗi `src=` và `href=`.
  - **Expected Evidence**: 100% tệp script và style có hậu tố phiên bản thống nhất `?v=6`.

- [X] T032 Create branded fallback `dist/404.html` with automatic meta refresh
  - **File**: `dist/404.html`
  - **Dependencies**: None
  - **Requirement Reference**: Principle I, FR-008, US4
  - **Acceptance Criteria**: Tạo tệp `dist/404.html` mang nhận diện NetStudy, chứa thẻ `<meta http-equiv="refresh" content="0; url=./">`, thông báo chuyển hướng thân thiện, và nút bấm "Quay lại Trang chủ NetStudy".
  - **Verification Method**: Kiểm tra sự tồn tại của tệp và thử nghiệm mở đường dẫn 404 trên máy chủ tĩnh.
  - **Expected Evidence**: Truy cập đường dẫn sai tự động đưa người dùng về trang chủ NetStudy.

- [X] T033 Create `dist/.nojekyll` to bypass Jekyll processing on GitHub Pages
  - **File**: `dist/.nojekyll`
  - **Dependencies**: None
  - **Requirement Reference**: Principle I, FR-008, US4
  - **Acceptance Criteria**: Tạo tệp rỗng `dist/.nojekyll` để chỉ thị cho GitHub Pages không chạy Jekyll.
  - **Verification Method**: `Test-Path dist/.nojekyll`
  - **Expected Evidence**: Tệp tồn tại trong thư mục phát hành `dist/`.

- [X] T034 Create Web App Manifest in `dist/manifest.webmanifest` and link in `dist/index.html`
  - **File**: `dist/manifest.webmanifest`, `dist/index.html`
  - **Dependencies**: T031
  - **Requirement Reference**: Principle I, FR-009, US4
  - **Acceptance Criteria**: Tạo tệp `manifest.webmanifest` chuẩn PWA với `name`, `short_name`, `theme_color: "#15634f"`, `display: "standalone"`, `start_url: "./"`, và khai báo thẻ `<link rel="manifest" href="manifest.webmanifest">` trong `dist/index.html`.
  - **Verification Method**: Thẩm định cú pháp JSON và kiểm tra thẻ link trong `dist/index.html`.
  - **Expected Evidence**: Trình duyệt di động nhận diện được ứng dụng để cho phép cài đặt lên màn hình chính.

- [X] T035 Verify zero development-only code, secrets, or temporary test files in `dist/`
  - **File**: `dist/`
  - **Dependencies**: T031, T032, T033, T034
  - **Requirement Reference**: Principle I, Principle VII, SC-001, US4
  - **Acceptance Criteria**: Quét toàn bộ thư mục `dist/`: xác nhận không chứa tệp `.map`, không chứa secret tokens, không chứa mock test fixtures, và kích thước các tệp hoàn toàn hợp lệ.
  - **Verification Method**: Kiểm tra danh mục tệp trong `dist/`.
  - **Expected Evidence**: Danh mục tệp trong `dist/` chỉ bao gồm các tệp phát hành chuẩn của ứng dụng.

- [X] T036 Verify relative asset paths for GitHub Pages subpath compatibility (EC-03)
  - **File**: `dist/index.html`, `dist/404.html`, `dist/style.css`
  - **Dependencies**: T031, T032
  - **Requirement Reference**: Principle I, EC-03, US4
  - **Acceptance Criteria**: Xác nhận 100% đường dẫn tài nguyên không có dấu gạch chéo `/` ở đầu (sử dụng đường dẫn tương đối), đảm bảo hoạt động hoàn hảo khi lưu trữ tại subpath `/netstudy-network-security/`.
  - **Verification Method**: Kiểm tra regex các đường dẫn trong HTML và CSS.
  - **Expected Evidence**: Tất cả các asset link đều là đường dẫn tương đối (`favicon.svg`, `style.css`, v.v.).

---

## Phase G: Reliability & Regression (Độ tin cậy & Kiểm chứng Toàn diện)

**Purpose**: Thực thi toàn bộ chuỗi kiểm thử nhiều tầng, bảo chứng không có bất kỳ sự hồi quy nào.

- [X] T037 Execute full Node.js unit regression suite
  - **File**: `checks.cjs`, `checks-models.cjs`, `checks-learning.cjs`
  - **Dependencies**: T008, T026
  - **Requirement Reference**: Principle VIII, SC-004
  - **Acceptance Criteria**: Chạy 3 bộ kiểm thử logic: 264 câu hỏi, 27 mô hình SVG, và 9 nhóm tính năng học tập thông minh đều PASS với exit code 0.
  - **Verification Method**: `node checks.cjs; node checks-models.cjs; node checks-learning.cjs`
  - **Expected Evidence**: Toàn bộ các nhóm kiểm thử trả về kết quả PASS 100%.

- [X] T038 Execute Core Web Vitals and performance budget SLA verification
  - **File**: `checks-perf.cjs`
  - **Dependencies**: T031, T034
  - **Requirement Reference**: Principle VIII, FR-007, SC-003
  - **Acceptance Criteria**: Tổng uncompressed payload của toàn bộ thư mục `dist/` duy trì $\le 735.00\text{ KB}$ (ngưỡng 752,640 bytes); thời gian nạp script $\le 20.0\text{ms}$; render route trung bình $\le 0.50\text{ms}$; $\text{CLS} = 0.00$.
  - **Verification Method**: `node checks-perf.cjs`
  - **Expected Evidence**: `"status": "PASS"`, tổng dung lượng $\le 735.00\text{ KB}$.

- [X] T039 Execute security test suite in `tests/security.spec.js`
  - **File**: `tests/security.spec.js`
  - **Dependencies**: T006, T007, T010, T012, T013
  - **Requirement Reference**: Principle VII, SC-001, US1, US2
  - **Acceptance Criteria**: 100% test cases trong bộ kiểm thử bảo mật đều PASS: CSP meta tag active, XSS payload bị khử nhiễm, nạp file > 10MB bị chặn.
  - **Verification Method**: `npx playwright test tests/security.spec.js`
  - **Expected Evidence**: Tất cả các kịch bản kiểm thử bảo mật đều PASS.

- [X] T040 Execute accessibility test suite in `tests/accessibility.spec.js`
  - **File**: `tests/accessibility.spec.js`
  - **Dependencies**: T024, T025, T026, T028, T029, T030
  - **Requirement Reference**: Principle VI, SC-002, US3
  - **Acceptance Criteria**: 100% test cases trong bộ kiểm thử trợ năng đều PASS: bẫy tiêu điểm modal, phím Escape, viền `:focus-visible`, reduced motion, và quét axe-core.
  - **Verification Method**: `npx playwright test tests/accessibility.spec.js`
  - **Expected Evidence**: Toàn bộ các kịch bản kiểm thử trợ năng đều PASS.

- [X] T041 Execute responsive viewport layout tests in `tests/responsive-mobile.spec.js`
  - **File**: `tests/responsive-mobile.spec.js`
  - **Dependencies**: T024
  - **Requirement Reference**: Principle VI, US3
  - **Acceptance Criteria**: Kiểm thử trên 4 kích thước: Desktop $1440\text{px}$, Tablet $768\text{px}$, Mobile $375\text{px}$ và Extreme $320\text{px}$; xác nhận không có thanh cuộn ngang ngoài ý muốn, touch target $\ge 44\text{px}$.
  - **Verification Method**: `npx playwright test tests/responsive-mobile.spec.js`
  - **Expected Evidence**: Không phát hiện thanh cuộn ngang ở bất kỳ viewport nào.

- [X] T042 Execute complete cross-browser Playwright E2E suite
  - **File**: `tests/`
  - **Dependencies**: T037 through T041
  - **Requirement Reference**: Principle VIII, SC-004
  - **Acceptance Criteria**: Lệnh `npm run test:e2e` thực thi toàn bộ 10 tệp kiểm thử Playwright trên cả Desktop Chromium và Mobile-Chrome: 100% active tests PASS, 0 thất bại.
  - **Verification Method**: `npm run test:e2e`
  - **Expected Evidence**: Console báo cáo 0 failed tests.

- [X] T043 Execute Git whitespace check and verify clean repository status
  - **File**: Repository root
  - **Dependencies**: All tasks
  - **Requirement Reference**: Quality standard
  - **Acceptance Criteria**: Lệnh `git diff --check` trả về mã thoát 0, không có trailing whitespace hay lỗi định dạng dòng.
  - **Verification Method**: `git diff --check`
  - **Expected Evidence**: Lệnh kết thúc không có cảnh báo khoảng trắng.

---

## Phase H: Release Readiness (Tổng kết Nghiệm thu & Quản trị Phát hành)

**Purpose**: Tổng hợp kết quả kiểm toán, thiết lập cổng phê duyệt phát hành và quy trình khôi phục sự cố.

- [X] T044 [P] Compile comprehensive Security Threat Model and Sign-Off report
  - **File**: `specs/006-production-readiness/security-signoff.md`
  - **Dependencies**: T039
  - **Requirement Reference**: Principle VII, SC-001
  - **Acceptance Criteria**: Lập báo cáo ký duyệt bảo mật: xác nhận 0 lỗ hổng XSS, CSP active, 0 lỗ hổng `npm audit`, và cơ chế Local-First bảo vệ quyền riêng tư tuyệt đối.
  - **Verification Method**: Rà soát tài liệu báo cáo.
  - **Expected Evidence**: Báo cáo ký duyệt an ninh thông tin hoàn chỉnh.

- [X] T045 [P] Compile WCAG 2.2 Level AA Accessibility Audit report
  - **File**: `specs/006-production-readiness/accessibility-report.md`
  - **Dependencies**: T040
  - **Requirement Reference**: Principle VI, SC-002
  - **Acceptance Criteria**: Lập báo cáo kiểm toán trợ năng chi tiết: kết quả quét tự động axe-core trên 10 route, kết quả kiểm tra bẫy tiêu điểm bàn phím, tương phản màu sắc và hỗ trợ reduced motion.
  - **Verification Method**: Rà soát tài liệu báo cáo.
  - **Expected Evidence**: Báo cáo kiểm toán trợ năng WCAG 2.2 AA hoàn chỉnh.

- [X] T046 [P] Document Production Rollback and Emergency Recovery Procedure
  - **File**: `specs/006-production-readiness/rollback-procedure.md`
  - **Dependencies**: T014, T016
  - **Requirement Reference**: Principle X, FR-010
  - **Acceptance Criteria**: Hướng dẫn chi tiết quy trình khôi phục khi phát hiện lỗi nghiêm trọng trên production: cách kích hoạt lại bản build từ commit trước qua `workflow_dispatch` hoặc hoàn tác commit; xác nhận dữ liệu của người học trong `localStorage` không bị ảnh hưởng khi rollback.
  - **Verification Method**: Rà soát các bước khôi phục khẩn cấp.
  - **Expected Evidence**: Quy trình rollback rõ ràng, có thể thực hiện trong dưới 5 phút.

- [X] T047 Document Release Candidate Checklist and Quality Sign-Off
  - **File**: `specs/006-production-readiness/release-checklist.md`
  - **Dependencies**: T037 through T043
  - **Requirement Reference**: Principle IX, Principle X, SC-004
  - **Acceptance Criteria**: Bảng kiểm tra điều kiện phát hành với đầy đủ tiêu chí: Cú pháp, Whitespace, Unit regressions, E2E tests, Ngân sách SLA payload, CSP, A11Y, và Workflow Pages.
  - **Verification Method**: Rà soát checklist phát hành.
  - **Expected Evidence**: Tất cả các mục trong bảng kiểm tra đều đạt trạng thái sẵn sàng.

- [X] T048 Verify Deployment Approval Gate enforcement
  - **File**: `.github/workflows/pages.yml`
  - **Dependencies**: T015, T016, T047
  - **Requirement Reference**: Principle X, FR-010
  - **Acceptance Criteria**: Xác nhận quy trình phát hành yêu cầu phê duyệt thủ công rõ ràng; tuyệt đối không tự động kích hoạt deploy khi chưa có sự cho phép của người dùng.
  - **Verification Method**: Kiểm tra cấu hình môi trường deployment.
  - **Expected Evidence**: Cổng phê duyệt phát hành được kích hoạt và tuân thủ nguyên tắc Hiến pháp.

- [X] T049 Generate Final Production Readiness & Convergence Handover Report
  - **File**: `specs/006-production-readiness/readiness-report.md`
  - **Dependencies**: T044, T045, T046, T047, T048
  - **Requirement Reference**: Quality standard
  - **Acceptance Criteria**: Báo cáo tổng thể trình bày chi tiết trạng thái của 49 tasks, kết quả kiểm toán, và hướng dẫn người dùng thực hiện các thao tác Git bàn giao an toàn.
  - **Verification Method**: Rà soát tài liệu báo cáo tổng thể.
  - **Expected Evidence**: Báo cáo bàn giao phát hành hoàn chỉnh, sẵn sàng cho công tác nghiệm thu PR.

---

## Dependencies & Execution Order

### Phase Dependencies Flow

```text
Phase A (Baseline & Security Inventory)
   │
   ▼
Phase B (Client-Side Security) ─────────┐
   │                                    │
   ▼                                    ▼
Phase C (CSP & Supply Chain)         Phase D (Data Integrity & Recovery)
   │                                    │
   ├────────────────────────────────────┘
   ▼
Phase E (Accessibility Hardening - WCAG 2.2 AA)
   │
   ▼
Phase F (Release Validation & Pages Readiness)
   │
   ▼
Phase G (Reliability & Full Regression Suite)
   │
   ▼
Phase H (Release Readiness & Governance Sign-Off)
```

### Critical Path

`T001` $\rightarrow$ `T002` $\rightarrow$ `T003` $\rightarrow$ `T006` $\rightarrow$ `T007` $\rightarrow$ `T008` $\rightarrow$ `T012` $\rightarrow$ `T014` $\rightarrow$ `T016` $\rightarrow$ `T024` $\rightarrow$ `T028` $\rightarrow$ `T030` $\rightarrow$ `T031` $\rightarrow$ `T035` $\rightarrow$ `T037` $\rightarrow$ `T038` $\rightarrow$ `T042` $\rightarrow$ `T047` $\rightarrow$ `T049`.

### Parallel Opportunities

- **Trong Phase B & C**: Xử lý khử nhiễm DOM `T008` và rà soát bóc tách route `T009` có thể thực hiện song song với việc cấu hình Dependabot `T017`.
- **Trong Phase E**: Bổ sung `prefers-reduced-motion` `T025` và cập nhật nhãn tiếp cận cho 27 mô hình SVG `T026` nằm trên các tệp độc lập, có thể viết song song.
- **Trong Phase F**: Tạo tệp `404.html` `T032`, `.nojekyll` `T033`, và `manifest.webmanifest` `T034` hoàn toàn độc lập với nhau.
- **Trong Phase H**: Soạn thảo Báo cáo Bảo mật `T044`, Báo cáo Trợ năng `T045`, và Quy trình Khôi phục Rollback `T046` có thể tiến hành song song trước khi tổng hợp Báo cáo Sẵn sàng `T049`.

---

## Implementation Strategy

### MVP First (Phases A, B, C & E)
1. **Hoàn thành Kiểm toán Cơ sở** (`Phase A`).
2. **Khắc phục An ninh Client-Side & Bổ sung Guardrail 10MB** (`Phase B`).
3. **Khai báo Meta CSP & Sửa lỗi Workflow GitHub Pages** (`Phase C`).
4. **Hoàn thiện Bẫy tiêu điểm Modal & WCAG 2.2 AA** (`Phase E`).
5. **Nghiệm thu MVP**: 100% các lỗ hổng tiềm ẩn được giải quyết, CSP có hiệu lực, và quét axe-core đạt 0 vi phạm.

### Incremental Delivery Steps
1. **Increment 1**: Client-Side Security & CSP Meta Tag (`Phase A, B, C`).
2. **Increment 2**: Data Ingestion Resilience & Offline Verification (`Phase D`).
3. **Increment 3**: Modal Focus Trap & Accessible SVG Models (`Phase E`).
4. **Increment 4**: Asset Cache Busting, 404 Fallback & PWA Manifest (`Phase F`).
5. **Increment 5**: Full Regression Testing & Release Sign-Off (`Phase G, H`).
