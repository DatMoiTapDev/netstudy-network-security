# Tasks: NetStudy Learning Experience & Smart Review

**Input**: Design documents from `specs/004-learning-experience-smart-review/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/learning-experience-contract.md`, `quickstart.md`)  
**Prerequisites**: `spec.md`, `plan.md`, `.specify/memory/constitution.md` (ratified)  
**Organization**: Tasks are structured across 8 engineering phases (Phase A through Phase H) mapping directly to Foundational Data Infrastructure, User Stories (US1 through US5), UI/UX Pro Max Integration, and Regression Verification to ensure strictly ordered, test-driven, and verifiable implementation.

---

## Task Format Reference
`- [ ] [TaskID] [P?] [Story?] Description with file path`
- **[P]**: Parallelizable (different files, no incomplete dependencies)
- **[Story]**: Mapped User Story (`[US1]`, `[US2]`, `[US3]`, `[US4]`, `[US5]`)
- Each task includes: **File**, **Dependencies**, **Requirement Reference**, **Acceptance Criteria**, and **Verification Method**.

---

## Phase A: Baseline & Data Audit (Nền tảng & Khảo sát Dữ liệu)

**Purpose**: Thẩm định cấu trúc dữ liệu câu hỏi, lược đồ v1 hiện tại, ghi nhận số liệu benchmark ban đầu và tạo dữ liệu thử nghiệm có kiểm soát trước khi chỉnh sửa mã nguồn.

- [X] T001 Audit existing question bank structure, options, explanations, and cognitive levels in `dist/data.js`
  - **File**: `dist/data.js`
  - **Dependencies**: None
  - **Requirement Reference**: FR-005, FR-007, Principle II
  - **Acceptance Criteria**: Xác nhận toàn bộ 264 câu hỏi có stable ID (`1-q1` .. `8-q20`), mảng 4 options, explanations chi tiết từng phương án, và 100% câu hỏi có trường `level` hợp lệ ('Nhận biết': 73 câu, 'Thông hiểu': 128 câu, 'Vận dụng': 63 câu).
  - **Verification Method**: Chạy Node.js script thẩm định cấu trúc trường trên `COURSE.flatMap(c => c.questions)`.

- [X] T002 [P] Audit current v1 storage schema and active session structure in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: None
  - **Requirement Reference**: CL-02, FR-007
  - **Acceptance Criteria**: Phân tích chi tiết cấu trúc `fresh()`, `validate(s)` v1 và cách ghi nhận `history` trong `grade()` để xây dựng bản đồ ánh xạ sang Schema v2.
  - **Verification Method**: Kiểm tra mã nguồn và gọi thử nghiệm `StudyCore.fresh()`, `StudyCore.validate()`.

- [X] T003 [P] Execute pre-implementation baseline regression suite
  - **File**: `checks.cjs`, `checks-models.cjs`, `checks-perf.cjs`
  - **Dependencies**: None
  - **Requirement Reference**: Principle VIII, FR-010
  - **Acceptance Criteria**: Cả 3 bộ test hiện có đều PASS với mã thoát 0 (264 câu, 27 mô hình SVG, tải trang < 18ms, CLS = 0.00).
  - **Verification Method**: `node checks.cjs; node checks-models.cjs; node checks-perf.cjs`.

- [X] T004 Create synthetic test fixtures for v1 storage datasets in `checks-learning.cjs`
  - **File**: `checks-learning.cjs`
  - **Dependencies**: T001, T002
  - **Requirement Reference**: CL-02, CL-03, NFR-005
  - **Acceptance Criteria**: Tạo tệp `checks-learning.cjs` chứa sẵn các bộ dữ liệu mẫu giả lập: dữ liệu v1 chuẩn (5 phiên), dữ liệu v1 rỗng, dữ liệu vượt quá 100 phiên (120 phiên), và dữ liệu JSON bị hỏng để phục vụ kiểm thử tự động.
  - **Verification Method**: Chạy `node checks-learning.cjs` và xác nhận các bộ fixture được nạp thành công.

---

## Phase B: Persistence & Migration (Lưu trữ Bền vững & Nâng cấp Schema v2)

**Purpose**: Xây dựng nền tảng lưu trữ Schema v2 vững chắc trong `dist/core.js`, di chuyển dữ liệu v1 idempotent, xử lý dung lượng bộ nhớ an toàn và hỗ trợ sao lưu / phục hồi JSON.

- [X] T005 Define Schema v2 types and default generator `StudyCore.freshV2()` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T002, T004
  - **Requirement Reference**: CL-02, FR-007, `data-model.md`
  - **Acceptance Criteria**: Khai báo Schema v2: `version: 2`, `questionStats: {}`, `history: []` (tối đa 100 mục), `savedExams: []`, `bookmarks: []`, `completed: []`, `seen: []`.
  - **Verification Method**: Gọi `StudyCore.freshV2()` và kiểm tra sự hiện diện của các thuộc tính Schema v2.

- [X] T006 Implement pure schema validation function `StudyCore.validateV2(store)` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T005
  - **Requirement Reference**: CL-02, FR-007, `contracts/learning-experience-contract.md`
  - **Acceptance Criteria**: Kiểm tra tính hợp lệ của `store`: bắt buộc `version === 2`, `questionStats` là đối tượng, `history` là mảng; ném ngoại lệ rõ ràng khi cấu trúc bị biến dạng; trả về `true` khi hợp lệ.
  - **Verification Method**: Viết assertion trong `checks-learning.cjs` kiểm tra 5 trường hợp dữ liệu hợp lệ và không hợp lệ.

- [X] T007 Implement idempotent auto-migration function `StudyCore.migrateStorageToV2(raw)` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T005, T006
  - **Requirement Reference**: CL-02, FR-007
  - **Acceptance Criteria**: Chuyển đổi dữ liệu v1 sang v2 một cách an toàn: khởi tạo `questionStats` cho 264 câu, trích xuất số lần đúng/sai từ các phiên `history` có sẵn, bảo lưu 100% dữ liệu gốc; bảo đảm tính idempotent (`migrate(migrate(v1)) === migrate(v1)`); xử lý an toàn dữ liệu `null` hoặc chuỗi JSON hỏng.
  - **Verification Method**: Chạy kịch bản di chuyển trong `checks-learning.cjs` trên dữ liệu v1 giả lập và xác minh không mất dữ liệu.

- [X] T008 [P] Implement backup export and import utilities in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T006, T007
  - **Requirement Reference**: CL-02, CL-03, FR-007
  - **Acceptance Criteria**: Viết hàm `StudyCore.exportUserDataJSON(store)` sinh chuỗi JSON chuẩn Schema v2 kèm siêu dữ liệu thời gian; viết hàm `StudyCore.importUserDataJSON(jsonStr)` có thẩm định cấu trúc và tự động chạy migration nếu nhập tệp v1 cũ.
  - **Verification Method**: Kiểm thử xuất và nhập lại (round-trip) trong `checks-learning.cjs`, đối chiếu deep equality.

- [X] T009 Implement safe history pruning utility `StudyCore.pruneHistorySafely(store, maxSessions = 100)` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T005, T007
  - **Requirement Reference**: CL-03, FR-007
  - **Acceptance Criteria**: Cắt giảm mảng `store.history` chỉ giữ lại tối đa 100 phiên chi tiết gần nhất (`history.slice(-maxSessions)`); bảo lưu vĩnh viễn toàn bộ số liệu thống kê tích lũy trong `questionStats`.
  - **Verification Method**: Thử nghiệm trên dữ liệu 120 phiên trong `checks-learning.cjs`, xác nhận còn đúng 100 phiên và `questionStats` nguyên vẹn.

- [X] T010 Implement `QuotaExceededError` detection and user prompt dialog in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T008, T009
  - **Requirement Reference**: CL-03, FR-007, EC-04
  - **Acceptance Criteria**: Bọc lệnh ghi `localStorage.setItem` trong khối try/catch; khi gặp `QuotaExceededError`, kích hoạt modal thông báo thân thiện hướng dẫn người học xuất file JSON sao lưu trước khi thực hiện dọn dẹp phiên cũ; tuyệt đối không âm thầm xóa dữ liệu.
  - **Verification Method**: Mô phỏng ngoại lệ Quota trong môi trường thử nghiệm và xác nhận hộp thoại cảnh báo được gọi.

---

## Phase C: Question Performance & Mastery (US2 & CL-01 — Chuỗi Đúng & Mức độ Nắm vững)

**Purpose**: Hiện thực hóa máy trạng thái thành thạo câu hỏi theo quy tắc 2 chuỗi liên tiếp (CL-01), theo dõi hiệu suất từng câu hỏi và tích hợp vào quy trình làm bài.

- [X] T011 [US2] Implement `QuestionPerformanceRecord` initialization and normalization in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T005, T007
  - **Requirement Reference**: CL-01, FR-002, `data-model.md`
  - **Acceptance Criteria**: Khởi tạo cấu trúc bản ghi cho câu hỏi: `{ questionId, chapter, level, attempts: 0, correctCount: 0, wrongCount: 0, consecutiveCorrect: 0, masteryStatus: 'needs_practice', lastAttempted: null, lastResult: null, marked: false }`.
  - **Verification Method**: Assert cấu trúc bản ghi câu hỏi trong `checks-learning.cjs`.

- [X] T012 [US2] Implement pure mastery state machine function `StudyCore.updateQuestionMastery(record, isCorrect, sessionType)` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T011
  - **Requirement Reference**: CL-01, FR-002, `contracts/learning-experience-contract.md`
  - **Acceptance Criteria**:
    - Nếu `isCorrect === false`: `consecutiveCorrect = 0`, `masteryStatus = 'needs_practice'`, `wrongCount++`.
    - Nếu `isCorrect === true` và `sessionType !== 'exam'`: `consecutiveCorrect++`, `correctCount++`; nếu `consecutiveCorrect >= 2` $\rightarrow$ `masteryStatus = 'mastered'`; nếu `consecutiveCorrect === 1` $\rightarrow$ `masteryStatus = 'in_review'`.
    - Nếu `isCorrect === true` và `sessionType === 'exam'`: `consecutiveCorrect++`, `correctCount++`, nhưng trạng thái `masteryStatus` KHÔNG tự động chuyển sang `mastered` (giữ nguyên `in_review` hoặc `needs_practice`).
  - **Verification Method**: Chạy kịch bản chuyển đổi trạng thái chuỗi sai $\rightarrow$ đúng 1 lần $\rightarrow$ sai (reset) $\rightarrow$ đúng 2 lần liên tiếp trong `checks-learning.cjs`.

- [X] T013 [US2] Implement bookmark toggling function `StudyCore.toggleQuestionMarked(stats, questionId)` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T011
  - **Requirement Reference**: FR-002, FR-003
  - **Acceptance Criteria**: Đảo ngược giá trị boolean `record.marked` mà không làm thay đổi `masteryStatus` hay `consecutiveCorrect`.
  - **Verification Method**: Unit test chuyển đổi cờ `marked` trong `checks-learning.cjs`.

- [X] T014 [US2] Connect session grading and question performance updating in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T012, T013
  - **Requirement Reference**: CL-01, FR-002, US2
  - **Acceptance Criteria**: Khi nộp bài trong bất kỳ chế độ nào (`learn`, `test`, `exam`), lặp qua danh sách câu trả lời, gọi `updateQuestionMastery()` để cập nhật `state.questionStats`, sau đó lưu vào `localStorage`.
  - **Verification Method**: Nộp bài một phiên luyện tập thử nghiệm và kiểm tra các trường dữ liệu tương ứng trong `state.questionStats`.

- [X] T015 [US2] Implement review filter queries `StudyCore.getQuestionsByMastery` and `StudyCore.getMarkedQuestions` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T011, T012
  - **Requirement Reference**: FR-003, US2
  - **Acceptance Criteria**: Cung cấp hàm lọc danh sách câu hỏi theo trạng thái (`needs_practice`, `in_review`, `mastered`) và câu được đánh dấu (`marked === true`), trả về mảng Question kèm metadata.
  - **Verification Method**: Lọc danh sách theo từng trạng thái và kiểm tra số lượng trả về trong `checks-learning.cjs`.

- [X] T016 [US2] Implement mastery lifecycle and regression test suite in `checks-learning.cjs`
  - **File**: `checks-learning.cjs`
  - **Dependencies**: T012, T015
  - **Requirement Reference**: CL-01, FR-002, NFR-005
  - **Acceptance Criteria**: Viết kiểm thử toàn diện cho: quy tắc 2 chuỗi đúng, reset khi sai, làm đúng trong thi thử không chuyển mastered, độc lập của cờ đánh dấu; tất cả test case PASS.
  - **Verification Method**: `node checks-learning.cjs`.

---

## Phase D: Adaptive Practice Engine (US3 — Luyện tập Thích ứng Ngoại tuyến)

**Purpose**: Xây dựng thuật toán lựa chọn câu hỏi theo 4 preset ngoại tuyến deterministic, cơ chế bù trừ tuần tự (Fallback Hierarchy) và cam kết không lặp câu hỏi.

- [X] T017 [US3] Implement `StudyCore.selectAdaptiveQuestions(bank, stats, mode, count)` skeleton in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T011
  - **Requirement Reference**: FR-004, US3, `contracts/learning-experience-contract.md`
  - **Acceptance Criteria**: Thẩm định tham số `mode` thuộc `['unseen', 'frequent_wrong', 'weak_chapter', 'adaptive_mixed']`; thẩm định `count` hợp lệ; trả về mảng các đối tượng Question không trùng lặp.
  - **Verification Method**: Gọi hàm với tham số không hợp lệ và kiểm tra xử lý lỗi an toàn trong `checks-learning.cjs`.

- [X] T018 [US3] Implement `unseen` and `frequent_wrong` preset selectors in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T017
  - **Requirement Reference**: FR-004, US3
  - **Acceptance Criteria**:
    - Preset `unseen`: Lọc các câu hỏi có `attempts === 0` (chưa từng làm).
    - Preset `frequent_wrong`: Sắp xếp các câu hỏi có `wrongCount > 0` theo tỷ lệ sai `(wrongCount / attempts)` giảm dần; nếu bằng nhau ưu tiên câu có `wrongCount` lớn hơn.
  - **Verification Method**: Assert thứ tự và tính chất các câu hỏi được chọn trong `checks-learning.cjs`.

- [X] T019 [US3] Implement `weak_chapter` preset selector in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T017
  - **Requirement Reference**: FR-001, FR-004, US3
  - **Acceptance Criteria**: Nhận diện các chương có độ chính xác $< 70\%$; chọn ngẫu nhiên các câu hỏi thuộc các chương này; nếu không có chương nào $< 70\%$, chọn chương có độ chính xác thấp nhất.
  - **Verification Method**: Giả lập dữ liệu có Bài 2 đạt 40% và kiểm tra các câu hỏi được chọn thuộc Bài 2 trong `checks-learning.cjs`.

- [X] T020 [US3] Implement `adaptive_mixed` 50/30/20 preset and 3-stage fallback hierarchy in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T018, T019
  - **Requirement Reference**: FR-004, US3, Additional Decision 2
  - **Acceptance Criteria**: Phân bổ mục tiêu $50\%$ câu sai/đang ôn, $30\%$ câu chưa làm, $20\%$ câu đã nắm vững. Nếu thiếu hụt số lượng ở bất kỳ nhóm nào, tự động bù đắp tuần tự: (1) bù thêm câu chưa làm $\rightarrow$ (2) bù thêm câu sai $\rightarrow$ (3) bù thêm câu ngẫu nhiên từ ngân hàng chung; cam kết đủ số lượng yêu cầu và 0 câu trùng lặp.
  - **Verification Method**: Kiểm thử với trường hợp chỉ có 2 câu sai nhưng yêu cầu 20 câu; kiểm tra số lượng trả về chính xác 20 câu không trùng lặp trong `checks-learning.cjs`.

- [X] T021 [US3] Implement bank exhaustion edge cases handling (EC-01, EC-02) in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T018, T020
  - **Requirement Reference**: EC-01, EC-02, US3
  - **Acceptance Criteria**: Khi học viên đã làm hết 264 câu, chế độ `unseen` trả về danh sách rỗng kèm chỉ dấu hoàn thành $100\%$ ngân hàng câu hỏi để UI hiển thị thông báo chúc mừng và chuyển hướng gợi ý.
  - **Verification Method**: Giả lập ngân hàng không còn câu chưa làm và kiểm tra phản hồi của selector.

- [X] T022 [US3] Add adaptive selection deterministic and uniqueness test suite in `checks-learning.cjs`
  - **File**: `checks-learning.cjs`
  - **Dependencies**: T017, T020, T021
  - **Requirement Reference**: FR-004, NFR-003, NFR-005
  - **Acceptance Criteria**: Chạy 100 lần sinh đề ngẫu nhiên trên cả 4 chế độ; assert `new Set(ids).size === ids.length` (không trùng lặp) và số lượng luôn khớp yêu cầu.
  - **Verification Method**: `node checks-learning.cjs`.

---

## Phase E: Learning Dashboard (US1 — Bảng Điều khiển Tiến độ Toàn diện)

**Purpose**: Tính toán chỉ số tiến độ lý thuyết và thực hành trên 9 chương, 95 mục, 264 câu hỏi; nhận diện chương yếu ($< 70\%$) và render giao diện trực quan đạt chuẩn CSS Containment.

- [X] T023 [US1] Implement `StudyCore.computeChapterProgress(bank, stats, completedSections)` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T011
  - **Requirement Reference**: FR-001, US1, `data-model.md`
  - **Acceptance Criteria**: Tính toán cho từng chương trong 9 chương: số mục đã đọc trên tổng số mục, số câu đã làm trên tổng câu hỏi, số câu đúng, tỷ lệ chính xác (`correctCount / attempts * 100%`), và cờ `isWeak: true` khi tỷ lệ chính xác $< 70\%$.
  - **Verification Method**: Unit test tính toán tiến độ với dữ liệu giả lập trong `checks-learning.cjs`.

- [X] T024 [US1] Implement `StudyCore.computeOverallProgress(bank, stats, completedSections)` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T023
  - **Requirement Reference**: FR-001, US1
  - **Acceptance Criteria**: Trả về tổng số câu đã làm / 264, tỷ lệ bao phủ câu hỏi (%), tỷ lệ chính xác toàn cục (%), tổng số mục lý thuyết đã hoàn thành / 95, và số câu đã đạt trạng thái `mastered`.
  - **Verification Method**: Kiểm thử với dữ liệu trống (tránh lỗi chia cho 0) và dữ liệu đã làm 100% trong `checks-learning.cjs`.

- [X] T025 [US1] Render Learning Dashboard view component in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T023, T024
  - **Requirement Reference**: FR-001, US1
  - **Acceptance Criteria**: Dựng giao diện `#dashboard`: hiển thị các danh thiếp tổng quan (Độ bao phủ câu hỏi, Độ chính xác, Số câu thành thạo), bảng tiến độ 9 chương với thanh tiến độ phần trăm, và huy hiệu cảnh báo (Warning Badge) nổi bật trên các chương có tỷ lệ $< 70\%$.
  - **Verification Method**: Chuyển hướng tới `#dashboard` và kiểm tra sự hiển thị chính xác của các thành phần giao diện.

- [X] T026 [P] [US1] Add CSS styles and containment for Dashboard cards in `dist/style.css`
  - **File**: `dist/style.css`
  - **Dependencies**: None
  - **Requirement Reference**: FR-001, FR-009, FR-010
  - **Acceptance Criteria**: Bổ sung kiểu dáng cho Dashboard sử dụng Design Tokens (`--bg-card`, `--accent`, `--warning`, `--text-main`); khai báo `contain: content` trên các thẻ chương; bảo đảm tương thích Dark/Light theme và CLS = 0.00.
  - **Verification Method**: Kiểm tra bằng mắt trên trình duyệt và chạy `checks-perf.cjs`.

- [X] T027 [US1] Handle zero-state and insufficient-data states in Dashboard (EC-01) in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T025
  - **Requirement Reference**: EC-01, US1
  - **Acceptance Criteria**: Khi `history` hoàn toàn trống, hiển thị trạng thái bắt đầu học tập thân thiện ("Chào mừng bạn đến với NetStudy! Hãy bắt đầu với Bài 1"), không hiển thị lỗi `NaN` hay thanh tiến độ gãy.
  - **Verification Method**: Mở Dashboard khi `localStorage` rỗng và kiểm tra hiển thị.

- [X] T028 [US1] Add Dashboard metrics unit test suite in `checks-learning.cjs`
  - **File**: `checks-learning.cjs`
  - **Dependencies**: T023, T024
  - **Requirement Reference**: FR-001, NFR-005
  - **Acceptance Criteria**: Assert độ chính xác của các công thức tính % tiến độ, ngưỡng cờ chương yếu ($< 70\%$) và khả năng xử lý an toàn dữ liệu rỗng.
  - **Verification Method**: `node checks-learning.cjs`.

---

## Phase F: Exam Analytics & History (US4 & US5 — Phân tích Đề thi & Lịch sử Học tập)

**Purpose**: Xây dựng biểu đồ đường SVG xu hướng điểm thi thuần túy, phân tích năng lực theo 3 mức độ nhận thức thực tế (`q.level`), thời gian làm bài trung bình và bộ lọc lịch sử đa tiêu chí.

- [X] T029 [US4] Implement `StudyCore.computeExamTrend(history)` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T005
  - **Requirement Reference**: FR-005, US4, `data-model.md`
  - **Acceptance Criteria**: Trích xuất toàn bộ các phiên thi thử (`type === 'exam'`), sắp xếp theo thời gian tăng dần; tính toán điểm số thang 10, điểm trung bình, thời gian làm bài trung bình (phút) và tỷ lệ đạt chuẩn ($\ge 7.0$).
  - **Verification Method**: Unit test với 5 bài thi thử giả lập trong `checks-learning.cjs`.

- [X] T030 [US4] Implement `StudyCore.computeCognitiveBreakdown(bank, stats)` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T001, T011
  - **Requirement Reference**: FR-005, US4, Additional Decision 3
  - **Acceptance Criteria**: Phân nhóm 264 câu hỏi và tính tỷ lệ trả lời đúng theo 3 mức nhận thức có sẵn trong metadata `q.level`: Nhận biết (73 câu), Thông hiểu (128 câu), Vận dụng (63 câu); tuyệt đối không tự suy đoán hoặc gán nhãn giả định.
  - **Verification Method**: Assert tổng số câu ở 3 mức bằng đúng 264 và tỷ lệ chính xác được tính toán chuẩn xác trong `checks-learning.cjs`.

- [X] T031 [US4] Implement pure inline SVG score trend chart generator in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T029
  - **Requirement Reference**: FR-005, US4, NFR-001
  - **Acceptance Criteria**: Dựng thẻ `<svg viewBox="0 0 600 240">` inline thuần khiết: có các đường lưới ngang (ngưỡng 0, 5, 7, 10 điểm), đường nối polyline mượt mà, các điểm mốc `<circle>` có hiệu ứng hover và thẻ `<title>` hiển thị điểm và thời gian làm bài; tự động thích ứng Dark/Light theme qua stroke tokens.
  - **Verification Method**: Kiểm tra cấu trúc SVG được render trong DOM và xác thực tọa độ tỷ lệ điểm số $y = 210 - (\text{score} / 10 \times 180)$.

- [X] T032 [US5] Implement multi-criteria history filter logic `StudyCore.filterHistory(history, filters)` in `dist/core.js`
  - **File**: `dist/core.js`
  - **Dependencies**: T005
  - **Requirement Reference**: FR-006, US5
  - **Acceptance Criteria**: Lọc danh sách phiên theo `activityType` ('all', 'exam', 'learn', 'test'), `timeRange` ('all', '7days', '30days') và `resultStatus` ('all', 'pass', 'fail'); trả về danh sách phiên thỏa mãn.
  - **Verification Method**: Assert số lượng bài được lọc qua các tổ hợp điều kiện trong `checks-learning.cjs`.

- [X] T033 [US5] Render filtered history list and session review detail view in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T031, T032
  - **Requirement Reference**: FR-005, FR-006, US4, US5
  - **Acceptance Criteria**: Hiển thị các dropdown lọc trên trang `#history`, danh sách bài làm có huy hiệu điểm và thời lượng; khi bấm vào một bài làm thì mở chế độ xem lại chi tiết từng câu hỏi, phương án học viên đã chọn, đáp án đúng và lời giải thích.
  - **Verification Method**: Chọn các bộ lọc trong `#history` và bấm xem chi tiết một bài làm để xác thực giao diện.

- [X] T034 [US4] [US5] Add Analytics & History unit tests in `checks-learning.cjs`
  - **File**: `checks-learning.cjs`
  - **Dependencies**: T029, T030, T032
  - **Requirement Reference**: FR-005, FR-006, NFR-005
  - **Acceptance Criteria**: Kiểm tra tính toán xu hướng điểm, phân tích mức độ nhận thức thực tế và bộ lọc đa tiêu chí; toàn bộ test PASS.
  - **Verification Method**: `node checks-learning.cjs`.

---

## Phase G: UI/UX Integration & Smart Review (Tích hợp Giao diện Ôn tập & Trải nghiệm Người dùng)

**Purpose**: Xây dựng giao diện Sổ ôn tập 4 tabs (`#review`), bộ chọn chế độ Luyện tập thích ứng (`#practice`), bổ sung CSS tokens, phím tắt tiếp cận và thông điệp tiếng Việt học thuật chuẩn mực.

- [X] T035 [US2] Render Smart Wrong-Answer Review 4-Tab Interface (`#review`) in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T015, T026
  - **Requirement Reference**: FR-003, US2
  - **Acceptance Criteria**: Xây dựng giao diện `#review` với 4 tab chuyển đổi tức thì: "Cần ôn tập" (`needs_practice`), "Đang củng cố" (`in_review`), "Đã khắc phục" (`mastered`) và "Câu đánh dấu" (`marked`); hiển thị số lượng trên từng tab badge; mỗi câu hỏi hiển thị đầy đủ đề bài, đáp án đúng, giải thích 4 phương án, nguồn slide và nút chuyển cờ đánh dấu.
  - **Verification Method**: Mở `#review`, chuyển đổi giữa 4 tab và kiểm tra danh sách câu hỏi hiển thị tương ứng.

- [X] T036 [US2] Implement "Luyện tập danh sách này" action from Smart Review in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T035
  - **Requirement Reference**: FR-003, US2
  - **Acceptance Criteria**: Cung cấp nút bấm "Luyện tập danh sách này" ở từng tab; khi bấm sẽ kích hoạt ngay một phiên luyện tập (`active.type = 'learn'`) chứa chính xác các câu hỏi của tab đó.
  - **Verification Method**: Bấm nút luyện tập tại tab "Cần ôn tập" và xác nhận phiên làm bài được khởi tạo với đúng danh sách câu hỏi.

- [X] T037 [US3] Render Adaptive Practice selection interface in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T017, T020
  - **Requirement Reference**: FR-004, US3
  - **Acceptance Criteria**: Bổ sung khu vực chọn preset luyện tập thích ứng trên trang `#practice`: danh thiếp trực quan cho 4 chế độ (Chưa làm, Hay sai, Chương yếu, Hỗn hợp 50/30/20) kèm bộ chọn số lượng câu linh hoạt (10, 20, 30 hoặc Tất cả).
  - **Verification Method**: Chọn preset "Luyện câu hay sai (10 câu)", bấm bắt đầu và kiểm tra bài luyện tập được tạo đúng quy cách.

- [X] T038 [P] Add CSS styles for tabs, mastery badges, preset cards, and SVG chart in `dist/style.css`
  - **File**: `dist/style.css`
  - **Dependencies**: None
  - **Requirement Reference**: FR-009, V-UI/UX Pro Max
  - **Acceptance Criteria**: Bổ sung kiểu dáng cho huy hiệu mastery (`.badge-needs-practice`, `.badge-in-review`, `.badge-mastered`), kiểu dáng tab active, danh thiếp preset, đường stroke SVG chart; bảo đảm mục tiêu chạm $\ge 44\text{px}$ trên di động và tương thích Light/Dark theme.
  - **Verification Method**: Kiểm tra trực quan trên các độ phân giải màn hình khác nhau từ 320px đến 1440px.

- [X] T039 Integrate navigation shortcuts and ARIA accessibility roles in `dist/index.html` and `dist/app.js`
  - **File**: `dist/index.html`, `dist/app.js`
  - **Dependencies**: T025, T035, T037
  - **Requirement Reference**: FR-009, VI-Accessibility (WCAG 2.2 AA)
  - **Acceptance Criteria**: Bổ sung liên kết và phím tắt điều hướng nhanh tới `#dashboard` và `#review`; gán thuộc tính `role="tablist"`, `role="tab"`, `aria-selected` cho các tabs; bảo đảm viền `:focus-visible` sắc nét và giữ vững cơ chế `safeFocus`.
  - **Verification Method**: Thử nghiệm duyệt toàn bộ các tab và nút bấm mới chỉ bằng bàn phím (Tab, Enter, Space).

- [X] T040 [P] Polish Vietnamese microcopy, labels, and explanation formatting across all views in `dist/app.js`
  - **File**: `dist/app.js`
  - **Dependencies**: T025, T035, T037
  - **Requirement Reference**: FR-001, FR-003, FR-004, FR-005
  - **Acceptance Criteria**: Rà soát và chuẩn hóa toàn bộ câu chữ tiếng Việt: sử dụng thuật ngữ an toàn mạng chuẩn mực, hướng dẫn rõ ràng, không có từ ngữ kỹ thuật thô thiển hoặc thông báo khó hiểu.
  - **Verification Method**: Rà soát văn bản trong `dist/app.js`.

---

## Phase H: Regression, Invariance & Final Acceptance (Hồi quy, Tính Bất biến & Nghiệm thu Cuối cùng)

**Purpose**: Xác minh tuyệt đối không gây suy giảm chức năng hiện có, bảo toàn 100% đề thi chuẩn 40 câu / seed 533, 27 mô hình SVG, hiệu năng Core Web Vitals và đạt toàn bộ tiêu chí chất lượng.

- [X] T041 Verify 40-question / 75-minute exam engine and deterministic seed `533` invariance in `checks.cjs`
  - **File**: `checks.cjs`
  - **Dependencies**: T014, T033
  - **Requirement Reference**: FR-008, Principle III
  - **Acceptance Criteria**: Kiểm tra `StudyCore.makeExam(bank, true)` tiếp tục sinh ra đúng 40 câu hỏi cố định theo hạt giống 533, thỏa mãn ma trận hạn ngạch 9 chương (4, 3, 3, 6, 5, 5, 6, 5, 3) và ma trận nhận thức (12 NB, 20 TH, 8 VD) qua 100 lần thử ngẫu nhiên.
  - **Verification Method**: `node checks.cjs`.

- [X] T042 Verify 27 SVG interactive models and 112 steps functionality in `checks-models.cjs`
  - **File**: `checks-models.cjs`
  - **Dependencies**: None
  - **Requirement Reference**: Principle II, Feature 003
  - **Acceptance Criteria**: Toàn bộ 27 mô hình tương tác an toàn mạng kết xuất trơn tru, không có lỗi SVG DOM, 112 bước tuần tự chuyển động chính xác.
  - **Verification Method**: `node checks-models.cjs`.

- [X] T043 Execute comprehensive headless learning test suite in `checks-learning.cjs`
  - **File**: `checks-learning.cjs`
  - **Dependencies**: T016, T022, T028, T034
  - **Requirement Reference**: NFR-005, Principle VIII
  - **Acceptance Criteria**: 100% các bài kiểm thử tự động mới trong `checks-learning.cjs` (Migration v1 $\rightarrow$ v2, Máy trạng thái Mastery, Adaptive Selection Fallback, Analytics & Quota Pruning) PASS với mã thoát 0.
  - **Verification Method**: `node checks-learning.cjs`.

- [X] T044 Verify Core Web Vitals, CSS Containment, and payload budget constraints in `checks-perf.cjs`
  - **File**: `checks-perf.cjs`
  - **Dependencies**: T026, T038
  - **Requirement Reference**: FR-010, Feature 003
  - **Acceptance Criteria**: Tổng dung lượng uncompressed toàn bộ `dist/` không vượt quá $735\text{ KB}$ (mức tăng $\le 15\text{ KB}$); thời gian đánh giá script ban đầu $\le 20.0\text{ms}$; thời gian render 100 routes $\le 0.5\text{ms/route}$; $\text{CLS} = 0.00$.
  - **Verification Method**: `node checks-perf.cjs`.

- [X] T045 Execute JavaScript syntax verification across all scripts
  - **File**: `dist/core.js`, `dist/app.js`, `dist/data.js`, `dist/models.js`, `dist/model-ui.js`
  - **Dependencies**: T014, T035, T037
  - **Requirement Reference**: Principle I, VII
  - **Acceptance Criteria**: Lệnh `node --check` thực thi thành công không có lỗi cú pháp trên tất cả 5 tệp JavaScript trong thư mục phân phối.
  - **Verification Method**: `node --check dist/core.js dist/app.js dist/data.js dist/models.js dist/model-ui.js`.

- [X] T046 Execute Git whitespace and formatting check
  - **File**: Repository root
  - **Dependencies**: All tasks
  - **Requirement Reference**: Quality standard
  - **Acceptance Criteria**: Lệnh `git diff --check` trả về mã thoát 0, không có bất kỳ khoảng trắng thừa (trailing whitespace) hay lỗi ngắt dòng nào.
  - **Verification Method**: `git diff --check`.

---

## Dependencies & Execution Order

### Phase Dependencies Flow

```text
Phase A (Baseline & Audit)
   │
   ▼
Phase B (Persistence & Schema v2 Migration)
   │
   ├───────────────────────────────┐
   ▼                               ▼
Phase C (Mastery State Machine)   Phase E (Dashboard Metrics Backend)
   │                               │
   ▼                               │
Phase D (Adaptive Practice)        │
   │                               │
   ├───────────────────────────────┘
   ▼
Phase F (Exam Analytics & SVG Chart)
   │
   ▼
Phase G (UI/UX Views & Review Tabs Integration)
   │
   ▼
Phase H (Regression & Final Acceptance)
```

### Critical Path

`T001` $\rightarrow$ `T002` $\rightarrow$ `T004` $\rightarrow$ `T005` $\rightarrow$ `T006` $\rightarrow$ `T007` $\rightarrow$ `T011` $\rightarrow$ `T012` $\rightarrow$ `T014` $\rightarrow$ `T017` $\rightarrow$ `T020` $\rightarrow$ `T025` $\rightarrow$ `T031` $\rightarrow$ `T035` $\rightarrow$ `T037` $\rightarrow$ `T041` $\rightarrow$ `T043` $\rightarrow$ `T044` $\rightarrow$ `T045`.

### Parallel Opportunities

- **Trong Phase A**: `T002` (Audit v1 schema) và `T003` (Chạy regression baseline) có thể chạy song song độc lập.
- **Trong Phase B**: `T008` (Backup export/import) có thể triển khai song song với `T009` (Pruning) sau khi `T006` và `T007` hoàn thành.
- **Trong Phase E & G**: `T026` (CSS Dashboard) và `T038` (CSS Tabs & Badges) là các tác vụ trên file `dist/style.css`, có thể thực hiện song song với việc viết logic dữ liệu trong `dist/core.js`.
- **Trong Phase G**: `T040` (Polish câu chữ tiếng Việt) có thể chạy song song độc lập.
- **Trong Phase H**: `T041` (Exam invariance) và `T042` (27 models) có thể chạy song song vì kiểm tra các khía cạnh hoàn toàn độc lập.

---

## Implementation Strategy

### MVP First (Minimum Viable Increment)
1. Hoàn thành **Phase A** (Khảo sát baseline) và **Phase B** (Schema v2 Migration an toàn).
2. Hoàn thành **Phase C** (Máy trạng thái Mastery 2-streak CL-01).
3. Hoàn thành **Phase E** (Dashboard tổng quan tiến độ 9 chương và cảnh báo yếu $< 70\%$).
4. **Nghiệm thu độc lập MVP**: Học viên có thể xem bảng điều khiển tiến độ và dữ liệu học tập được lưu trữ an toàn trong Schema v2.

### Incremental Delivery Steps
1. **Increment 1**: Schema v2 + Idempotent Migration + Quota Protection (Phase B).
2. **Increment 2**: Smart Review 4 Tabs + 2-Streak Mastery State Machine (Phase C & G).
3. **Increment 3**: Adaptive Practice 4 Presets + Fallback Hierarchy (Phase D & G).
4. **Increment 4**: Exam Analytics + Inline SVG Score Trend Chart + History Filters (Phase F).
5. **Increment 5**: Accessibility, Mobile Layout & Final Regression Verification (Phase G & H).
