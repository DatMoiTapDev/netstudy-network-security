# Tasks: NetStudy Automated Testing & Reliability

**Input**: Design documents from `specs/005-testing-reliability/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`)  
**Prerequisites**: `spec.md`, `plan.md`, `.specify/memory/constitution.md` (ratified)  
**Organization**: Tasks are structured across 7 engineering phases (Phase A through Phase G) mapping directly to Test Infrastructure, Critical User Journeys (US1), Smart Learning (US3), Data Resilience (US2), UI/Accessibility & SVG Models (US4/US5), GitHub Actions CI (US6), and Final Acceptance.

---

## Task Format Reference
`- [ ] [TaskID] [P?] [Story?] Description with file path`
- **[P]**: Parallelizable (different files, no incomplete dependencies)
- **[Story]**: Mapped User Story (`[US1]`, `[US2]`, `[US3]`, `[US4]`, `[US5]`, `[US6]`)
- Each task includes: **File**, **Dependencies**, **Requirement Reference**, **Acceptance Criteria**, and **Verification Method**.

---

## Phase A: Baseline & Test Infrastructure (Nền tảng & Hạ tầng Kiểm thử)

**Purpose**: Thẩm định bộ test hiện tại, thiết lập `package.json` cho devDependencies, cấu hình Playwright, xây dựng máy chủ tĩnh nội bộ và tạo synthetic fixtures.

- [X] T001 Execute pre-implementation regression suite across all existing checks
  - **File**: `checks.cjs`, `checks-models.cjs`, `checks-perf.cjs`, `checks-learning.cjs`
  - **Dependencies**: None
  - **Requirement Reference**: Principle VIII, FR-007
  - **Acceptance Criteria**: Tất cả 4 bài kiểm thử hiện có đều PASS với mã thoát 0 (264 câu hỏi, 27 mô hình SVG, tải script < 20ms, payload $\le 735\text{ KB}$).
  - **Verification Method**: `node checks.cjs && node checks-models.cjs && node checks-perf.cjs && node checks-learning.cjs`.

- [X] T002 Survey static web serving requirements and MIME types for distribution files
  - **File**: `dist/`
  - **Dependencies**: None
  - **Requirement Reference**: Principle I, FR-001
  - **Acceptance Criteria**: Xác định đầy đủ các định dạng tệp cần phục vụ: HTML, CSS, JavaScript, SVG, PNG, JSON và đảm bảo không có tài nguyên nào bị thiếu.
  - **Verification Method**: Kiểm tra danh mục tệp và MIME mapping.

- [X] T003 Initialize root `package.json` with scripts and devDependencies
  - **File**: `package.json`
  - **Dependencies**: T001
  - **Requirement Reference**: NFR-001, `contracts/testing-cli-contract.md`
  - **Acceptance Criteria**: Khai báo `package.json` ở cấp độ thư mục gốc: `private: true`, các npm scripts chuẩn (`test:syntax`, `test:whitespace`, `test:units`, `test:e2e`, `test:serve`, `test`), các devDependencies (`@playwright/test`, `@axe-core/playwright`); tuyệt đối không thêm runtime dependencies vào `dist/`.
  - **Verification Method**: `npm test:syntax`.

- [X] T004 Implement zero-dependency local static HTTP server in `scripts/test-server.cjs`
  - **File**: `scripts/test-server.cjs`
  - **Dependencies**: T003
  - **Requirement Reference**: NFR-001, NFR-004, `contracts/testing-cli-contract.md`
  - **Acceptance Criteria**: Xây dựng máy chủ HTTP tĩnh Node.js thuần túy (dùng module `http`, `fs`, `path` có sẵn); phục vụ thư mục `dist/` tại cổng 3000 (hoặc biến `TEST_PORT`); trả về đúng Content-Type; khởi động trong dưới $20\text{ms}$; thoát an toàn khi nhận `SIGINT`/`SIGTERM`.
  - **Verification Method**: Chạy `node scripts/test-server.cjs 3000` và kiểm tra phản hồi HTTP bằng curl/fetch.

- [X] T005 [P] Create Playwright central configuration in `playwright.config.js`
  - **File**: `playwright.config.js`
  - **Dependencies**: T003, T004
  - **Requirement Reference**: FR-001, NFR-002, `contracts/testing-cli-contract.md`
  - **Acceptance Criteria**: Cấu hình Playwright test runner: `baseURL: 'http://127.0.0.1:3000'`, `webServer` tự động khởi chạy `node scripts/test-server.cjs 3000`, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, dự án `chromium` (desktop $1440\text{px}$) và `mobile-chrome` ($375\text{px}$).
  - **Verification Method**: `npx playwright test --version`.

- [X] T006 Create synthetic test fixtures in `tests/fixtures/`
  - **File**: `tests/fixtures/storage-v1-legacy.json`, `tests/fixtures/storage-v2-populated.json`, `tests/fixtures/storage-over-capacity.json`
  - **Dependencies**: T003
  - **Requirement Reference**: FR-003, `data-model.md`
  - **Acceptance Criteria**: Tạo 3 bộ fixture synthetic: `storage-v1-legacy.json` (chứa dữ liệu v1 chuẩn), `storage-v2-populated.json` (chứa 15 mục đã học, 8 bài thi, thống kê 264 câu), `storage-over-capacity.json` (chứa 120 bài thi để kiểm thử không xóa ngầm).
  - **Verification Method**: Thẩm định cú pháp JSON và cấu trúc lược đồ qua Node.js assert.

- [X] T007 [P] Implement test isolation and storage initialization helpers in `tests/helpers/storage.js`
  - **File**: `tests/helpers/storage.js`
  - **Dependencies**: T005, T006
  - **Requirement Reference**: FR-003, NFR-003
  - **Acceptance Criteria**: Viết hàm `seedStorage(page, fixtureData)` sử dụng `page.addInitScript()` để nạp dữ liệu vào `localStorage['netstudy-atmmt-v1']` trước khi DOM được tải; viết hàm `getStorage(page)` để đọc trạng thái state hiện tại.
  - **Verification Method**: Unit test helper trong một bài test mẫu.

- [X] T008 [P] Implement deterministic clock fast-forward helper in `tests/helpers/clock.js`
  - **File**: `tests/helpers/clock.js`
  - **Dependencies**: T005
  - **Requirement Reference**: FR-001, EC-01, NFR-003
  - **Acceptance Criteria**: Viết hàm `installFastClock(page, initialTime)` và `fastForward(page, milliseconds)` tận dụng Playwright Virtual Clock API để kiểm thử thời gian đếm ngược và tự nộp bài mà không dùng `sleep`.
  - **Verification Method**: Kiểm thử tua nhanh 75 phút trong dưới 50ms.

---

## Phase B: Core User Journeys (US1 — Hành trình Người học Cốt lõi)

**Purpose**: Tự động hóa kiểm thử hành trình người học toàn trình bằng Playwright trên trình duyệt thực tế.

- [X] T009 [US1] Implement 10-route navigation, header and layout tests in `tests/smoke.spec.js`
  - **File**: `tests/smoke.spec.js`
  - **Dependencies**: T005, T007
  - **Requirement Reference**: FR-001, SC-001, US1
  - **Acceptance Criteria**: Kiểm tra 10 route chính (`#home`, `#courses`, `#lesson/1`, `#terms`, `#models`, `#practice`, `#exam`, `#review`, `#history`, `#settings`): URL hash thay đổi, tiêu đề trang hiển thị đúng, navigation active class cập nhật đồng bộ, Zero-state onboarding hiển thị khi state rỗng.
  - **Verification Method**: `npx playwright test tests/smoke.spec.js`.

- [X] T010 [US1] Implement lesson reading, section scrolling and outline expansion in `tests/learning-journey.spec.js`
  - **File**: `tests/learning-journey.spec.js`
  - **Dependencies**: T005, T007
  - **Requirement Reference**: FR-001, US1
  - **Acceptance Criteria**: Mở Bài 1 (`#lesson/1`), mở thẻ `<details>` cấu trúc slide gốc, cuộn đến Mục 1.1, kiểm tra nội dung giải thích, ví dụ, điểm dễ sai và phần tự giải thích hiển thị đầy đủ.
  - **Verification Method**: `npx playwright test tests/learning-journey.spec.js -g "lesson reading"`.

- [X] T011 [US1] Implement section completion toggle and live DOM checkmark update in `tests/learning-journey.spec.js`
  - **File**: `tests/learning-journey.spec.js`
  - **Dependencies**: T010
  - **Requirement Reference**: FR-001, US1
  - **Acceptance Criteria**: Nhấn nút "Đánh dấu đã học", xác nhận nút chuyển sang "Đã học mục này", icon tích xanh (`.nav-check`) xuất hiện tức thì trong danh sách mục bên phải mà không cần reload trang; kiểm tra giá trị được lưu vào `localStorage`.
  - **Verification Method**: `npx playwright test tests/learning-journey.spec.js -g "section completion"`.

- [X] T012 [US1] Implement practice quiz mode with instant rationale in `tests/practice-adaptive.spec.js`
  - **File**: `tests/practice-adaptive.spec.js`
  - **Dependencies**: T005, T007
  - **Requirement Reference**: FR-001, US1
  - **Acceptance Criteria**: Bắt đầu bài luyện tập Bài 1 ở chế độ học (`learn`), chọn phương án A: xác nhận phương án được đánh dấu, hiển thị lời giải thích chi tiết ngay lập tức, nút phương án bị vô hiệu hóa để chống đổi đáp án.
  - **Verification Method**: `npx playwright test tests/practice-adaptive.spec.js -g "practice mode"`.

- [X] T013 [US1] Implement 40-question / 75-minute exam simulation with option selection in `tests/exam-simulation.spec.js`
  - **File**: `tests/exam-simulation.spec.js`
  - **Dependencies**: T005, T007, T008
  - **Requirement Reference**: FR-001, FR-008, US1
  - **Acceptance Criteria**: Khởi tạo đề cố định A: xác nhận đúng 40 câu hỏi, đồng hồ hiển thị 75:00, chọn đáp án câu 1, nhấn đánh dấu xem lại (`flag`), kiểm tra nút tương ứng trên bảng điều hướng `.qnav` nhận lớp `answered` và `flagged`.
  - **Verification Method**: `npx playwright test tests/exam-simulation.spec.js -g "exam simulation"`.

- [X] T014 [US1] Implement timer countdown, active deadline check and auto-submit on timeout in `tests/exam-simulation.spec.js`
  - **File**: `tests/exam-simulation.spec.js`
  - **Dependencies**: T013
  - **Requirement Reference**: FR-001, FR-008, EC-01, US1
  - **Acceptance Criteria**: Sử dụng `fastForward(page, 75 * 60 * 1000 + 1000)`: xác nhận bài thi tự động kết thúc, chuyển hướng sang trang kết quả (`#result/:id`), hiển thị huy hiệu "Hết giờ" màu đỏ và tính điểm chính xác.
  - **Verification Method**: `npx playwright test tests/exam-simulation.spec.js -g "auto submit"`.

- [X] T015 [US1] Implement exam result page verification with score, breakdown and per-question explanation review in `tests/exam-simulation.spec.js`
  - **File**: `tests/exam-simulation.spec.js`
  - **Dependencies**: T014
  - **Requirement Reference**: FR-001, FR-005, US1
  - **Acceptance Criteria**: Trang kết quả hiển thị điểm số thang 10, bảng thống kê theo từng chủ đề, tỷ lệ đúng toàn bài; danh sách 40 câu hỏi hiển thị đầy đủ đáp án học viên chọn, đáp án đúng và lời giải thích.
  - **Verification Method**: `npx playwright test tests/exam-simulation.spec.js -g "result page"`.

---

## Phase C: Learning Experience (US3 — Trải nghiệm Học tập Thông minh)

**Purpose**: Kiểm chứng máy trạng thái thành thạo, luyện tập thích ứng, Dashboard và biểu đồ phân tích.

- [X] T016 [US3] Implement Learning Dashboard metrics and chapter cards verification in `tests/learning-journey.spec.js`
  - **File**: `tests/learning-journey.spec.js`
  - **Dependencies**: T007
  - **Requirement Reference**: FR-001, US3
  - **Acceptance Criteria**: Nạp `storage-v2-populated.json`: mở `#home` và `#dashboard`, xác thực 4 thẻ tổng quan (% lý thuyết, số câu đã chạm tới, tỷ lệ đúng toàn cục, số câu thành thạo) khớp chính xác với số liệu tính toán.
  - **Verification Method**: `npx playwright test tests/learning-journey.spec.js -g "dashboard metrics"`.

- [X] T017 [US3] Implement weak chapter detection (< 70%) and warning badge rendering in `tests/learning-journey.spec.js`
  - **File**: `tests/learning-journey.spec.js`
  - **Dependencies**: T016
  - **Requirement Reference**: FR-001, US3
  - **Acceptance Criteria**: Với dữ liệu có Bài 2 đạt dưới 70% độ chính xác: xác nhận thẻ Bài 2 hiển thị huy hiệu `.weak-badge` ("Chương yếu") và banner cảnh báo vùng kiến thức yếu xuất hiện trên Dashboard.
  - **Verification Method**: `npx playwright test tests/learning-journey.spec.js -g "weak chapter"`.

- [X] T018 [US3] Implement Smart Wrong-Answer Review 4-tab interface and question counts in `tests/review-mastery.spec.js`
  - **File**: `tests/review-mastery.spec.js`
  - **Dependencies**: T007
  - **Requirement Reference**: FR-003, US3
  - **Acceptance Criteria**: Mở `#review`: chuyển đổi giữa 4 tabs ("Cần ôn tập", "Đang củng cố", "Đã khắc phục", "Đã đánh dấu"), kiểm tra số lượng câu hỏi trên từng tab badge và danh sách câu hỏi tương ứng hiển thị chuẩn xác.
  - **Verification Method**: `npx playwright test tests/review-mastery.spec.js -g "review tabs"`.

- [X] T019 [US3] Implement CL-01 2-streak mastery state machine lifecycle transitions in `tests/review-mastery.spec.js`
  - **File**: `tests/review-mastery.spec.js`
  - **Dependencies**: T018
  - **Requirement Reference**: FR-002, CL-01, US3
  - **Acceptance Criteria**: Thực hiện luồng làm bài: làm sai câu $X$ $\rightarrow$ câu vào tab "Cần ôn tập" $\rightarrow$ làm đúng lần 1 trong luyện tập $\rightarrow$ câu chuyển sang "Đang củng cố" (chuỗi $= 1$) $\rightarrow$ làm đúng lần 2 trong phiên riêng biệt $\rightarrow$ chuyển sang "Đã khắc phục" (`mastered`, chuỗi $= 2$). Làm sai ở bất kỳ bước nào lập tức reset chuỗi về 0.
  - **Verification Method**: `npx playwright test tests/review-mastery.spec.js -g "mastery transition"`.

- [X] T020 [US3] Implement boundary test: exam correct answer does not auto-master in `tests/review-mastery.spec.js`
  - **File**: `tests/review-mastery.spec.js`
  - **Dependencies**: T019
  - **Requirement Reference**: FR-002, CL-01, US3
  - **Acceptance Criteria**: Với câu hỏi đang ở chuỗi đúng $= 1$: trả lời đúng câu này trong bài thi thử 40 câu, xác nhận sau khi nộp bài thi trạng thái vẫn giữ nguyên `in_review`, không tự động chuyển thành `mastered`.
  - **Verification Method**: `npx playwright test tests/review-mastery.spec.js -g "exam non auto master"`.

- [X] T021 [US3] Implement 4 Adaptive Practice presets and 3-stage fallback in `tests/practice-adaptive.spec.js`
  - **File**: `tests/practice-adaptive.spec.js`
  - **Dependencies**: T007
  - **Requirement Reference**: FR-004, US3
  - **Acceptance Criteria**: Kiểm tra 4 preset thích ứng: Unseen (toàn bộ câu chưa làm), Frequent Wrong (sắp xếp theo tỷ lệ sai), Weak Chapter (thuộc chương yếu), và Adaptive Mixed 50/30/20. Kiểm tra trường hợp thiếu câu sai thì cơ chế bù trừ 3 cấp tự động lấy đủ số lượng và $0\%$ câu trùng lặp.
  - **Verification Method**: `npx playwright test tests/practice-adaptive.spec.js -g "adaptive presets"`.

- [X] T022 [US3] Implement inline SVG score trend chart and verified cognitive breakdown in `tests/learning-journey.spec.js`
  - **File**: `tests/learning-journey.spec.js`
  - **Dependencies**: T007
  - **Requirement Reference**: FR-005, US3
  - **Acceptance Criteria**: Mở `#history`: kiểm tra thẻ `<svg class="score-chart">` render các điểm số, đường ngưỡng 7.0 (Đạt), mốc điểm hover; kiểm tra thống kê năng lực phản ánh chính xác 73 câu Nhận biết, 128 câu Thông hiểu, 63 câu Vận dụng.
  - **Verification Method**: `npx playwright test tests/learning-journey.spec.js -g "svg chart"`.

- [X] T023 [US3] Implement Learning History multi-criteria filters in `tests/learning-journey.spec.js`
  - **File**: `tests/learning-journey.spec.js`
  - **Dependencies**: T022
  - **Requirement Reference**: FR-006, US3
  - **Acceptance Criteria**: Lọc theo Loại hoạt động ("Thi thử"), Khoảng thời gian ("7 ngày qua"), Kết quả ("Đạt chuẩn"): bảng lịch sử lập tức cập nhật danh sách các phiên thỏa mãn mà không reload trang; click vào một phiên mở xem lại chi tiết `#result/:id`.
  - **Verification Method**: `npx playwright test tests/learning-journey.spec.js -g "history filters"`.

---

## Phase D: Persistence & Migration (US2 — Bền vững Dữ liệu & An toàn Bộ nhớ)

**Purpose**: Kiểm chứng tính an toàn của `localStorage`, di chuyển lược đồ, sao lưu JSON và xử lý hạn mức.

- [X] T024 [US2] Implement idempotent storage migration v1 to v2 E2E test in `tests/data-resilience.spec.js`
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T007
  - **Requirement Reference**: FR-003, CL-02, US2
  - **Acceptance Criteria**: Nạp `storage-v1-legacy.json`: mở trang web, xác thực state được tự động nâng cấp lên `version: 2`, toàn bộ mục đã học, câu đánh dấu, lịch sử làm bài được bảo lưu $100\%$, `questionStats` được khởi tạo đầy đủ.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "migration v1 to v2"`.

- [X] T025 [US2] Implement JSON backup export and import validation E2E test in `tests/data-resilience.spec.js`
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T024
  - **Requirement Reference**: FR-003, CL-02, US2
  - **Acceptance Criteria**: Vào `#settings`, click "Xuất bản sao lưu JSON": kiểm tra sự kiện tải tệp; xóa sạch `localStorage`, nạp lại tệp JSON vừa xuất qua input file: xác nhận toàn bộ tiến độ và lịch sử được khôi phục nguyên vẹn.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "export import json"`.

- [X] T026 [US2] Implement malformed and oversized (> 10MB) JSON upload rejection in `tests/data-resilience.spec.js`
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T025
  - **Requirement Reference**: FR-003, Principle VII, US2
  - **Acceptance Criteria**: Tải lên tệp JSON sai cú pháp hoặc tệp vượt quá 10MB: ứng dụng ném lỗi thân thiện qua toast notification, từ chối nạp và không làm hỏng dữ liệu hiện tại.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "malformed json"`.

- [X] T027 [US2] Implement `QuotaExceededError` modal simulation and export prompt in `tests/data-resilience.spec.js`
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T024
  - **Requirement Reference**: FR-003, CL-03, EC-04, US2
  - **Acceptance Criteria**: Giả lập ngoại lệ `QuotaExceededError` khi gọi `setItem`: xác nhận modal cảnh báo dung lượng (`#quotaModal`) hiển thị, cung cấp nút tải sao lưu JSON và nút xác nhận trước khi dọn dẹp; kiểm tra không tự ý xóa ngầm dữ liệu.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "quota exceeded"`.

- [X] T028 [US2] Implement history retention over 100 sessions test in `tests/data-resilience.spec.js`
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T024
  - **Requirement Reference**: FR-003, CL-03, US2
  - **Acceptance Criteria**: Nạp `storage-over-capacity.json` (120 phiên): mở `#history`, xác nhận toàn bộ 120 phiên tồn tại đầy đủ, banner cảnh báo vượt quá 100 phiên xuất hiện; chỉ khi bấm "Dọn dẹp về 100 phiên" và xác nhận thì mảng `history` mới cắt về 100 phiên.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "retention over 100"`.

- [X] T029 [US2] Implement active session recovery and deadline persistence across page reload in `tests/data-resilience.spec.js`
  - **File**: `tests/data-resilience.spec.js`
  - **Dependencies**: T007, T008
  - **Requirement Reference**: FR-001, EC-03, US2
  - **Acceptance Criteria**: Đang làm dở bài thi, reload trang: xác nhận bài thi tiếp tục tại đúng câu hỏi đang làm dở, các câu đã trả lời trước đó giữ nguyên, và hạn chót `deadline` không bị reset.
  - **Verification Method**: `npx playwright test tests/data-resilience.spec.js -g "session recovery"`.

---

## Phase E: UI, Accessibility & Interactive SVG Models (US4 & US5 — Giao diện, Trợ năng & 27 Mô hình)

**Purpose**: Kiểm thử trực quan Theme Engine, Responsive di động, điều hướng bàn phím, quét axe-core và 27 mô hình SVG.

- [X] T030 [P] [US4] Implement Theme Engine E2E test in `tests/learning-journey.spec.js`
  - **File**: `tests/learning-journey.spec.js`
  - **Dependencies**: T005
  - **Requirement Reference**: FR-001, Principle V, US4
  - **Acceptance Criteria**: Nhấn nút đổi theme: kiểm tra chu trình chuyển đổi Sáng $\rightarrow$ Tối $\rightarrow$ Tự động, thuộc tính `data-theme` trên thẻ `<html>` thay đổi tương ứng, màu nền và màu chữ thay đổi theo Design Tokens.
  - **Verification Method**: `npx playwright test tests/learning-journey.spec.js -g "theme engine"`.

- [X] T031 [P] [US4] Implement responsive viewport layout tests in `tests/responsive-mobile.spec.js`
  - **File**: `tests/responsive-mobile.spec.js`
  - **Dependencies**: T005
  - **Requirement Reference**: FR-006, Principle VI, US4
  - **Acceptance Criteria**: Chạy kiểm thử trên các kích thước: Desktop $1440\text{px}$, Tablet $768\text{px}$, Mobile $375\text{px}$ và Extreme $320\text{px}$; xác nhận không có thanh cuộn ngang ngoài ý muốn, touch targets $\ge 44\text{px}$, bottom nav hiển thị trên mobile.
  - **Verification Method**: `npx playwright test tests/responsive-mobile.spec.js -g "responsive layout"`.

- [X] T032 [P] [US4] Implement mobile drawer navigation sheet open/close/focus trap in `tests/responsive-mobile.spec.js`
  - **File**: `tests/responsive-mobile.spec.js`
  - **Dependencies**: T031
  - **Requirement Reference**: FR-006, Principle VI, US4
  - **Acceptance Criteria**: Trên màn hình mobile, click nút "Thêm": drawer menu trượt lên với `aria-hidden="false"`, click nút đóng hoặc backdrop thì drawer đóng lại, phím `Escape` tự động đóng menu.
  - **Verification Method**: `npx playwright test tests/responsive-mobile.spec.js -g "mobile drawer"`.

- [X] T033 [US4] Implement keyboard navigation and shortcut test suite in `tests/accessibility.spec.js`
  - **File**: `tests/accessibility.spec.js`
  - **Dependencies**: T005
  - **Requirement Reference**: FR-006, Principle VI, US4
  - **Acceptance Criteria**: Thực hiện toàn bộ bài thi thuần túy bằng bàn phím: nhấn phím `1`/`2`/`3`/`4` hoặc `A`/`B`/`C`/`D` để chọn đáp án, phím `F` để gắn cờ, phím `ArrowRight`/`ArrowLeft` để chuyển câu, phím `Tab` để di chuyển tiêu điểm; xác thực viền `:focus-visible` luôn hiển thị.
  - **Verification Method**: `npx playwright test tests/accessibility.spec.js -g "keyboard navigation"`.

- [X] T034 [US4] Implement `@axe-core/playwright` automated WCAG 2.2 AA scan across all 10 routes in `tests/accessibility.spec.js`
  - **File**: `tests/accessibility.spec.js`
  - **Dependencies**: T005
  - **Requirement Reference**: FR-005, SC-002, Principle VI, US4
  - **Acceptance Criteria**: Tích hợp `axe-core`: quét toàn bộ 10 route chính (`#home`, `#courses`, `#lesson/1`, `#terms`, `#models`, `#practice`, `#exam`, `#review`, `#history`, `#settings`) trên cả Light và Dark Theme; xác nhận **0 vi phạm ở mức `critical` hoặc `serious`**.
  - **Verification Method**: `npm run test:a11y`.

- [X] T035 [US5] Implement 27 interactive SVG models step transition and highlight verification in `tests/svg-models.spec.js`
  - **File**: `tests/svg-models.spec.js`
  - **Dependencies**: T005
  - **Requirement Reference**: FR-002, Principle II, US5
  - **Acceptance Criteria**: Lặp qua tất cả 27 mô hình trực quan: click nút "Bước tiếp theo", kiểm tra các phần tử `<g class="model-node">` và `<path class="model-edge">` nhận đúng lớp `is-active` qua từng bước trong tổng số 112 bước.
  - **Verification Method**: `npx playwright test tests/svg-models.spec.js -g "svg models step transition"`.

- [X] T036 [US5] Implement cryptographic worked examples verification in `tests/svg-models.spec.js`
  - **File**: `tests/svg-models.spec.js`
  - **Dependencies**: T035
  - **Requirement Reference**: FR-002, Principle II, US5
  - **Acceptance Criteria**: Kiểm tra hiển thị công thức số học và kết quả tính toán chi tiết trên mô hình RSA (Mô hình 3.1) và Diffie-Hellman (Mô hình 3.2), đảm bảo dữ liệu số học khớp chính xác với ví dụ trong slide giáo trình.
  - **Verification Method**: `npx playwright test tests/svg-models.spec.js -g "crypto worked examples"`.

---

## Phase F: Continuous Integration (US6 — Tích hợp Đường ống CI GitHub Actions)

**Purpose**: Xây dựng workflow GitHub Actions tự động kiểm thử toàn diện, lưu trữ artifacts và bảo đảm an toàn quyền hạn.

- [X] T037 [US6] Create GitHub Actions CI workflow file in `.github/workflows/ci.yml`
  - **File**: `.github/workflows/ci.yml`
  - **Dependencies**: None
  - **Requirement Reference**: FR-008, `contracts/ci-workflow-contract.md`, US6
  - **Acceptance Criteria**: Khai báo tệp workflow YAML kích hoạt trên `push` và `pull_request` nhánh `main` và `feat/**`; loại trừ các thay đổi chỉ liên quan đến tài liệu (`docs/**`, `*.md`).
  - **Verification Method**: Kiểm tra cấu trúc YAML hợp lệ qua linter.

- [X] T038 [US6] Configure Stage 1: syntax checks and unit regression suite in `.github/workflows/ci.yml`
  - **File**: `.github/workflows/ci.yml`
  - **Dependencies**: T037
  - **Requirement Reference**: FR-008, Principle VIII, US6
  - **Acceptance Criteria**: Thiết lập job `validate` chạy trên `ubuntu-latest`: checkout mã nguồn, cài đặt Node.js 20, chạy `npm ci`, thực thi `npm run test:syntax`, `npm run test:whitespace` và `npm run test:units`.
  - **Verification Method**: Kiểm tra cú pháp workflow action.

- [X] T039 [US6] Configure Playwright browser caching in `.github/workflows/ci.yml`
  - **File**: `.github/workflows/ci.yml`
  - **Dependencies**: T038
  - **Requirement Reference**: NFR-002, US6
  - **Acceptance Criteria**: Cấu hình `actions/cache@v4` cho đường dẫn `~/.cache/ms-playwright` dựa trên mã băm của `package-lock.json`; chỉ tải browser binaries khi cache bị miss.
  - **Verification Method**: Kiểm tra logic cache key.

- [X] T040 [US6] Configure Stage 2: Playwright E2E and axe-core execution in `.github/workflows/ci.yml`
  - **File**: `.github/workflows/ci.yml`
  - **Dependencies**: T039
  - **Requirement Reference**: FR-008, SC-004, US6
  - **Acceptance Criteria**: Thiết lập job `e2e` (phụ thuộc vào `validate` pass): chạy `npx playwright install-deps chromium`, chạy `npm run test:e2e` với máy chủ nội bộ tự động khởi chạy.
  - **Verification Method**: Kiểm tra cấu trúc job `e2e`.

- [X] T041 [US6] Configure failure artifact upload with 7-day retention in `.github/workflows/ci.yml`
  - **File**: `.github/workflows/ci.yml`
  - **Dependencies**: T040
  - **Requirement Reference**: FR-008, `contracts/ci-workflow-contract.md`, US6
  - **Acceptance Criteria**: Sử dụng `actions/upload-artifact@v4` với điều kiện `if: failure()`: tự động đóng gói `playwright-report/` và `test-results/` thành artifact `playwright-failure-artifacts`, lưu trữ trong 7 ngày.
  - **Verification Method**: Kiểm tra cấu hình artifact retention.

- [X] T042 [US6] Configure least privilege permissions, timeouts and retry policies in `.github/workflows/ci.yml`
  - **File**: `.github/workflows/ci.yml`
  - **Dependencies**: T041
  - **Requirement Reference**: NFR-005, Principle X, US6
  - **Acceptance Criteria**: Khai báo quyền hạn tối thiểu `permissions: { contents: read }`; thiết lập timeout 5 phút cho job `validate`, 10 phút cho job `e2e`; không có bước tự động deploy production; không chứa secret tokens.
  - **Verification Method**: Rà soát quyền hạn bảo mật trong YAML.

---

## Phase G: Reliability, Performance Regression & Final Acceptance (Độ tin cậy & Nghiệm thu)

**Purpose**: Chạy toàn bộ kiểm thử, thẩm định chống flaky, đo lường ngân sách hiệu năng và hoàn thiện tài liệu.

- [X] T043 Execute full local test suite via `npm test`
  - **File**: Repository root
  - **Dependencies**: T009 through T036
  - **Requirement Reference**: SC-001, SC-002, SC-003
  - **Acceptance Criteria**: Lệnh `npm test` thực thi liên hoàn: kiểm tra cú pháp $\rightarrow$ kiểm tra khoảng trắng $\rightarrow$ 4 bộ test unit hiện có $\rightarrow$ toàn bộ bộ kiểm thử Playwright E2E & axe-core; tất cả đều PASS với exit code 0.
  - **Verification Method**: `npm test`.

- [X] T044 Verify CI repeatability and anti-flakiness across multiple test runs
  - **File**: `tests/`
  - **Dependencies**: T043
  - **Requirement Reference**: NFR-002, NFR-003
  - **Acceptance Criteria**: Chạy 3 lần liên tiếp bộ test Playwright E2E mà không có bài test nào thất bại ngẫu nhiên; thời gian hoàn thành dưới 2.5 phút.
  - **Verification Method**: `npm run test:e2e` (3 iterations).

- [X] T045 Verify Core Web Vitals and performance budget SLA in `checks-perf.cjs`
  - **File**: `checks-perf.cjs`
  - **Dependencies**: T043
  - **Requirement Reference**: FR-007, Principle VIII
  - **Acceptance Criteria**: Xác nhận tổng dung lượng uncompressed toàn bộ `dist/` duy trì $\le 735.00\text{ KB}$ (ngưỡng 752,640 bytes); thời gian đánh giá script ban đầu $\le 20.0\text{ms}$; thời gian render route $\le 0.50\text{ms}$; $\text{CLS} = 0.00$.
  - **Verification Method**: `node checks-perf.cjs`.

- [X] T046 [P] Audit documentation integrity and update `quickstart.md`
  - **File**: `specs/005-testing-reliability/quickstart.md`, `README.md`
  - **Dependencies**: T043
  - **Requirement Reference**: Quality standard
  - **Acceptance Criteria**: Hướng dẫn chạy test và chẩn đoán lỗi bằng Playwright Trace Viewer được cập nhật đầy đủ, rõ ràng và có thể sao chép lệnh chạy ngay lập tức.
  - **Verification Method**: Rà soát tài liệu hướng dẫn.

- [X] T047 Execute Git whitespace check and verify clean repository status
  - **File**: Repository root
  - **Dependencies**: All tasks
  - **Requirement Reference**: Quality standard
  - **Acceptance Criteria**: Lệnh `git diff --check` trả về mã thoát 0, không có trailing whitespace; trạng thái repository sạch sẽ, sẵn sàng tạo Pull Request.
  - **Verification Method**: `git diff --check && git status`.

---

## Dependencies & Execution Order

### Phase Dependencies Flow

```text
Phase A (Baseline & Test Infrastructure)
   │
   ▼
Phase B (Core User Journeys - US1) ──┐
   │                                 │
   ▼                                 ▼
Phase C (Smart Learning - US3)     Phase D (Persistence & Migration - US2)
   │                                 │
   ├─────────────────────────────────┘
   ▼
Phase E (UI, Accessibility & SVG Models - US4/US5)
   │
   ▼
Phase F (Continuous Integration Pipeline - US6)
   │
   ▼
Phase G (Reliability, Performance Regression & Final Acceptance)
```

### Critical Path

`T001` $\rightarrow$ `T003` $\rightarrow$ `T004` $\rightarrow$ `T005` $\rightarrow$ `T006` $\rightarrow$ `T007` $\rightarrow$ `T009` $\rightarrow$ `T013` $\rightarrow$ `T014` $\rightarrow$ `T019` $\rightarrow$ `T024` $\rightarrow$ `T027` $\rightarrow$ `T033` $\rightarrow$ `T034` $\rightarrow$ `T037` $\rightarrow$ `T040` $\rightarrow$ `T043` $\rightarrow$ `T045`.

### Parallel Opportunities

- **Trong Phase A**: `T005` (Playwright config), `T007` (Storage helpers), `T008` (Clock helper) có thể chạy song song độc lập.
- **Trong Phase B & C**: Sau khi hạ tầng Phase A hoàn thành, các bài test độc lập cho từng hành trình (`T009`, `T010`, `T012`, `T016`, `T021`) có thể được xây dựng song song trên các tệp `.spec.js` khác nhau.
- **Trong Phase E**: `T030` (Theme), `T031` (Responsive layout), `T032` (Mobile drawer), `T035` (27 mô hình SVG) nằm trên các tệp kiểm thử riêng biệt, có thể viết song song.
- **Trong Phase F**: Thiết lập cache `T039` và cấu hình artifact `T041` có thể làm việc song song sau khi cấu hình workflow cơ bản `T037`.

---

## Implementation Strategy

### MVP First (Phases A & B & C)
1. Hoàn thành **Phase A** (Khởi tạo `package.json`, Playwright, máy chủ nội bộ `scripts/test-server.cjs`, synthetic fixtures).
2. Hoàn thành **Phase B** (E2E core user journeys: đọc bài, luyện tập, thi thử 40 câu, tự nộp khi hết giờ).
3. Hoàn thành **Phase C** (Kiểm chứng Sổ ôn tập, Mastery CL-01, Adaptive Practice).
4. **Nghiệm thu độc lập MVP**: Có thể chạy `npm run test:e2e` kiểm chứng 100% các luồng cốt lõi trên trình duyệt Chromium.

### Incremental Delivery Steps
1. **Increment 1**: Test Infrastructure & Headless Server (`Phase A`).
2. **Increment 2**: E2E Core Journeys & Smart Learning Suite (`Phase B & C`).
3. **Increment 3**: Data Persistence, Migration v1 $\rightarrow$ v2 & Quota Protection (`Phase D`).
4. **Increment 4**: WCAG 2.2 AA axe-core Scans, Keyboard Controls & 27 SVG Models (`Phase E`).
5. **Increment 5**: GitHub Actions CI Pipeline, Caching & Artifacts (`Phase F & G`).
