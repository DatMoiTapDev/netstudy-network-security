# Implementation Plan: NetStudy Learning Experience & Smart Review

**Feature**: `specs/004-learning-experience-smart-review`  
**Branch**: `feat/004-learning-experience-smart-review`  
**Date**: 2026-11-04  
**Spec**: [specs/004-learning-experience-smart-review/spec.md](file:///d:/TIENDAT2024-2025/netstudy-network-security/specs/004-learning-experience-smart-review/spec.md)  
**Status**: Ready for Tasks Breakdown  

---

## 1. Summary

Nâng cấp toàn diện trải nghiệm học tập, hệ thống ôn tập thông minh (Smart Review), luyện tập thích ứng (Adaptive Practice), trực quan hóa dữ liệu tiến độ (Learning Dashboard & Exam Analytics) và quản trị dữ liệu an toàn (Schema v2) cho NetStudy:
1. **Schema v2 & Quản trị dữ liệu Idempotent**: Nâng cấp lược đồ lưu trữ `netstudy-atmmt-v1` lên `version: 2` với cơ chế di chuyển tự động (auto-migration) an toàn tuyệt đối, zero-data-loss, cô lập lịch sử tối đa 100 phiên (`history`) kết hợp thống kê tích lũy vĩnh viễn (`questionStats`), cảnh báo tràn dung lượng `QuotaExceededError` kèm xuất JSON thủ công (không bao giờ âm thầm xóa dữ liệu người dùng).
2. **Máy trạng thái Nắm vững kiến thức (Mastery State Machine)**: Chuẩn hóa 3 trạng thái câu hỏi (`needs_practice`, `in_review`, `mastered`) với quy tắc vàng CL-01: một câu từng sai chỉ đạt `mastered` khi được trả lời đúng **2 lần liên tiếp trong 2 phiên luyện tập riêng biệt** (`consecutiveCorrect >= 2`). Bất kỳ lần trả lời sai nào lập tức reset chuỗi về 0. Trả lời đúng trong chế độ thi thử **không** tự động nâng câu lên `mastered`. Hỗ trợ đánh dấu thủ công (`marked`).
3. **Bộ chọn Luyện tập Thích ứng (Adaptive Practice Engine)**: Cung cấp 4 preset luyện tập ngoại tuyến deterministic:
   - *Câu chưa làm (Unseen)*: Ưu tiên câu có `attempts === 0`.
   - *Câu hay sai (Frequent Wrong)*: Sắp xếp theo tỷ lệ sai (`wrongCount / attempts`) giảm dần.
   - *Chương yếu (Weak Chapter)*: Luyện tập tập trung vào các chương có độ chính xác $< 70\%$.
   - *Phối hợp thích ứng (Adaptive Mixed 50/30/20)*: $50\%$ câu sai/đang ôn, $30\%$ câu chưa làm, $20\%$ câu đã nắm vững; cơ chế bù đắp tuần tự nếu thiếu hụt: bù Unseen $\rightarrow$ bù Wrong $\rightarrow$ bù toàn bộ ngân hàng câu hỏi.
4. **Bảng điều khiển Học tập (Learning Dashboard)**: Trực quan hóa tổng thể tiến độ qua 9 chương, 95 mục, 264 câu hỏi; hiển thị tỷ lệ chính xác tổng thể, định danh các chương yếu ($< 70\%$) bằng thanh tiến độ trực quan và huy hiệu cảnh báo.
5. **Phân tích Đề thi & Biểu đồ Xu hướng Inline SVG (Exam Analytics)**: Biểu đồ đường SVG tương tác thuần (`viewBox="0 0 600 240"`), không dùng thư viện ngoài, thể hiện biến thiên điểm số qua các lần thi, phân tích độ chính xác theo 3 mức độ nhận thức (`Nhận biết`, `Thông hiểu`, `Vận dụng` từ siêu dữ liệu thực `q.level`), và thống kê thời gian làm bài trung bình.
6. **Lịch sử Học tập Đa tiêu chí (Multi-criteria Learning History)**: Cho phép lọc lịch sử theo loại hoạt động (Luyện tập / Thi thử), khoảng thời gian, và ngưỡng điểm; hỗ trợ xem chi tiết câu sai từng phiên và xuất bản sao lưu JSON.
7. **Bảo toàn Tuyệt đối (Absolute Preservation)**: Giữ nguyên 100% kiến trúc Vanilla JS, 0 runtime dependencies, Micro-DOM & phím tắt của Feature 001, Design Tokens & Theme Engine của Feature 002, CSS Containment & Precomputed SVG Models Cache của Feature 003, cùng thuật toán thi thử 40 câu / 75 phút / seed `533` / ma trận hạn ngạch 9 chương.

---

## 2. Technical Context

- **Language / Version**: HTML5 ngữ nghĩa, CSS3 hiện đại (CSS Custom Properties, Flexbox, Grid, CSS Containment), Vanilla JavaScript ES2022+.
- **Primary Dependencies**: Không có (**0 runtime dependencies**, không dùng React, Vue, Svelte, Tailwind runtime, Chart.js hay bất kỳ npm package nào).
- **Storage**: Client-side `localStorage`:
  - Khóa `netstudy-theme`: Lưu trạng thái giao diện (`'light' | 'dark' | 'system'`).
  - Khóa `netstudy-atmmt-v1`: Lưu lược đồ Schema v2 (`version: 2`, `questionStats`, `history` tối đa 100 mục, `savedExams`, `bookmarks`).
- **Testing**:
  - `checks.cjs`: Bộ kiểm thử hồi quy tĩnh và chức năng tổng thể.
  - `checks-models.cjs`: Bộ kiểm thử 27 mô hình tương tác SVG.
  - `checks-perf.cjs`: Bộ kiểm thử hiệu năng Core Web Vitals, CSS Containment và Precomputed Cache.
  - `checks-learning.cjs` (Mới): Bộ kiểm thử tự động Node.js headless cho migration Schema v2, máy trạng thái mastery, adaptive selector fallback, analytics aggregation và bảo vệ quota.
- **Target Platform**: Trình duyệt web hiện đại trên Desktop và Mobile (Chrome, Edge, Safari, Firefox), hỗ trợ từ $320\text{px}$ đến $1440\text{px}+$, hoạt động hoàn hảo ở chế độ offline cục bộ (`file:///`).
- **Project Type**: Ứng dụng web giáo dục tĩnh Single Page Application với cơ chế Vanilla Hash Routing.
- **Performance Goals**:
  - Thao tác lọc và chuyển tab Smart Review: $\le 5\text{ms}$.
  - Thuật toán sinh danh sách câu hỏi Adaptive Practice (40 câu): $\le 2\text{ms}$.
  - Thời gian render biểu đồ SVG Analytics: $\le 10\text{ms}$.
  - Thời gian chạy migration Schema v2: $\le 3\text{ms}$.
  - Giữ vững Core Web Vitals: $\text{CLS} = 0.00$, $\text{INP} \le 50\text{ms}$.
- **Constraints**:
  - Tuân thủ nghiêm ngặt 10 nguyên tắc của Hiến pháp dự án (`.specify/memory/constitution.md`).
  - Mọi hàm xử lý logic nghiệp vụ (Migration, Mastery, Adaptive Selection, Analytics) được tách thành các hàm thuần túy (pure functions) trong `StudyCore` (`dist/core.js`) để đảm bảo khả năng kiểm thử độc lập 100% không phụ thuộc DOM.
  - Xử lý triệt để ngoại lệ `QuotaExceededError` khi bộ nhớ `localStorage` chạm ngưỡng giới hạn (5MB).
- **Scale / Scope**:
  - 9 chương, 95 mục, 264 câu hỏi, 278 thuật ngữ, 27 mô hình.
  - Lịch sử lưu tối đa 100 phiên; `questionStats` theo dõi 264 bản ghi câu hỏi.

---

## 3. Constitution Check

*Kiểm tra tính tuân thủ 10 nguyên tắc cốt lõi của Hiến pháp dự án đối với Feature 004:*

| Nguyên tắc Hiến pháp | Yêu cầu bắt buộc | Đánh giá Kế hoạch Feature 004 | Trạng thái Gate |
|:---|:---|:---|:---:|
| **I. Vanilla-First Architecture** | HTML/CSS/JS thuần, không đưa framework/bundler vào client bundle. | Toàn bộ Dashboard, Review, Adaptive Selector, SVG Chart được lập trình bằng Vanilla JS thuần và CSS Custom Properties. | **PASS** |
| **II. Feature & Capability Preservation** | Bảo toàn 9 chương, 264 câu hỏi, 278 thuật ngữ, 27 mô hình, thi 40 câu/75 phút, lịch sử. | Không làm thay đổi nội dung câu hỏi, bài giảng hay mô hình; bảo toàn toàn bộ chức năng từ Feature 001, 002, 003. | **PASS** |
| **III. Deterministic Engine Stability** | Không đổi thuật toán sinh đề, seed `533`, ma trận quota, cách tính điểm. | Thuật toán sinh đề thi chuẩn `generateExam(seed = 533)` giữ nguyên 100%. Bộ chọn Adaptive Practice là một chế độ luyện tập riêng, không ghi đè chế độ thi thử. | **PASS** |
| **IV. Local-First & Privacy** | Lưu trữ cục bộ, không gửi dữ liệu người dùng ra máy chủ bên ngoài. | Lưu toàn bộ tiến độ trong `localStorage`. Cho phép xuất/nhập file JSON cục bộ. 0 telemetry, 0 API ngoài. | **PASS** |
| **V. UI/UX Pro Max Standard** | Design Tokens 3 tầng, bảng màu Cyber Emerald/Deep Slate, 17 inline SVG icons. | Mọi giao diện mới (Dashboard cards, Review tabs, SVG chart, Modal) sử dụng đúng biến `--accent`, `--bg-card`, `--text-main`, v.v. Biểu đồ dùng semantic stroke tokens. | **PASS** |
| **VI. Accessibility (WCAG 2.2 AA)** | Tương phản $\ge 4.5:1$, `:focus-visible` $\ge 3:1$, mobile $\ge 44\times 44\text{px}$, bàn phím đầy đủ. | Các tab, nút bấm lọc, thanh trượt có ARIA roles (`role="tablist"`, `aria-selected`), tooltip `<title>` trong SVG, hỗ trợ phím tắt và `safeFocus`. | **PASS** |
| **VII. Zero-Dependency & Security** | Zero npm dependencies, chống XSS, kiểm soát CSP. | Không cài đặt thêm bất kỳ thư viện npm runtime nào. Dữ liệu JSON nhập vào được thẩm định chặt chẽ chống XSS (`sanitizeHTML` / `textContent`). | **PASS** |
| **VIII. Mandatory Headless Testing** | `checks.cjs` và `checks-models.cjs` phải PASS 100% trước khi kết thúc. | Tạo thêm `checks-learning.cjs` kiểm thử 100% logic migration, mastery state machine, adaptive selection và analytics. Cả 4 bộ test phải PASS. | **PASS** |
| **IX. Spec-Driven Development** | Tuân thủ quy trình Spec $\rightarrow$ Plan $\rightarrow$ Tasks $\rightarrow$ Implement $\rightarrow$ Converge. | Đã hoàn thành `spec.md`, `research.md`, `data-model.md`, `contracts/`, `plan.md` và `quickstart.md`. | **PASS** |
| **X. Controlled Git Operations** | Không tự động commit, push, merge hay deploy khi chưa được phê duyệt. | Làm việc trên nhánh riêng `feat/004-learning-experience-smart-review`. Không thực hiện merge hay push trái phép. | **PASS** |

---

## 4. Project Structure & Touch-Points

### Documentation Artifacts (Feature 004)
```text
specs/004-learning-experience-smart-review/
├── spec.md                          # Đặc tả chức năng, User Stories & Acceptance Scenarios
├── plan.md                          # Tài liệu Kế hoạch Kỹ thuật này
├── research.md                      # Phase 0: 5 Quyết định kiến trúc & phân tích kỹ thuật
├── data-model.md                    # Phase 1: Lược đồ Schema v2 & đặc tả kiểu dữ liệu
├── contracts/
│   └── learning-experience-contract.md # Phase 1: Hợp đồng giao diện Storage, Mastery, Selector, Analytics
├── quickstart.md                    # Phase 1: Kịch bản kiểm thử độc lập & kịch bản nghiệm thu
├── checklists/
│   └── requirements.md              # Bảng kiểm tra chất lượng đặc tả (12/12 PASS)
└── tasks.md                         # Phase 2: Danh sách nhiệm vụ chi tiết (do /speckit-tasks tạo)
```

### Source Code Touch-Points (Mã nguồn dự kiến triển khai)
```text
dist/
├── core.js                          # Mở rộng StudyCore:
│                                    #   - migrateStorageToV2(raw): Migration idempotent v1 -> v2
│                                    #   - updateQuestionMastery(record, isCorrect, sessionType): Máy trạng thái 2 streak
│                                    #   - selectAdaptiveQuestions(allQuestions, stats, mode, count): 4 presets + fallback
│                                    #   - computeChapterProgress(allQuestions, stats): Thống kê 9 chương & yếu < 70%
│                                    #   - computeExamTrend(history): Điểm xu hướng và thời gian trung bình
│                                    #   - computeCognitiveBreakdown(allQuestions, stats): Phân tích theo q.level
│                                    #   - pruneHistorySafely(store, maxSessions): Cắt giảm an toàn max 100 sessions
│
├── app.js                           # Điều hướng và hiển thị giao diện:
│                                    #   - Khởi tạo & nạp dữ liệu Schema v2 khi app boot
│                                    #   - Render Learning Dashboard (#dashboard hoặc tab trong home)
│                                    #   - Render Smart Wrong-Answer Review (#review với 4 tabs)
│                                    #   - Render Adaptive Practice Selector (#practice)
│                                    #   - Render Inline SVG Exam Trend Chart & Cognitive breakdown (#analytics/#history)
│                                    #   - Render Learning History với bộ lọc đa tiêu chí
│                                    #   - Dialog QuotaExceededError kèm chức năng Export JSON
│
├── style.css                        # Bổ sung kiểu dáng mới:
│                                    #   - CSS Containment cho các danh thiếp tiến độ dashboard
│                                    #   - Badges cho trạng thái mastery (needs_practice, in_review, mastered)
│                                    #   - Tab styles cho Smart Review (accessible focus-visible, active indicator)
│                                    #   - Inline SVG Score Chart styles (stroke tokens, point hover glow, tooltips)
│                                    #   - Adaptive Practice preset selection cards
│                                    #   - Quota warning banner / dialog modal
│
├── index.html                       # Cập nhật menu điều hướng / liên kết nhanh tới Dashboard và Smart Review
│
├── checks-learning.cjs              # (Mới) Suite kiểm thử tự động headless:
│                                    #   - Test 1: Migration v1 -> v2 (idempotency, no data loss, validation)
│                                    #   - Test 2: Mastery state transitions (2 consecutive correct rule, reset on wrong)
│                                    #   - Test 3: Adaptive practice selection & fallback hierarchy
│                                    #   - Test 4: Analytics accuracy (chapter progress, cognitive levels, average time)
│                                    #   - Test 5: Storage quota protection & safe history pruning
│
├── checks.cjs                       # Bổ sung assertion kiểm tra tính tương thích Schema v2 & regression
└── checks-perf.cjs                  # Đảm bảo hiệu năng tải trang và kết xuất không suy giảm
```

---

## 5. Problem $\rightarrow$ Solution $\rightarrow$ Verification Matrix

| Vấn đề / Yêu cầu Nghiệp vụ | Quyết định Thiết kế / Giải pháp Kỹ thuật | Hợp đồng / Cấu trúc Dữ liệu | Phương pháp Kiểm chứng / Nghiệm thu |
|:---|:---|:---|:---|
| **CL-01: Quy tắc Nắm vững (Mastery)** | Yêu cầu 2 lần đúng liên tiếp trong 2 phiên luyện tập riêng biệt (`consecutiveCorrect >= 2`). Sai là reset về 0. Trả lời đúng trong thi thử không chuyển mastered. | `MasteryContract.updateQuestionMastery()` trong `dist/core.js`; lưu trữ trong `QuestionPerformanceRecord`. | Headless test mô phỏng chuỗi: sai $\rightarrow$ đúng 1 lần (in_review) $\rightarrow$ sai (needs_practice) $\rightarrow$ đúng 2 lần (mastered). |
| **CL-02: Schema Migration v2** | Hàm `migrateStorageToV2(raw)` chạy khi boot. Chuyển đổi dữ liệu `history` cũ, khởi tạo `questionStats`, kiểm tra tính hợp lệ, giữ nguyên vẹn dữ liệu gốc nếu có lỗi. | `StorageContract.migrateStorageToV2()`; Schema v2 chứa `version: 2`, `questionStats`, `history`. | Chạy test với dữ liệu v1 mẫu, dữ liệu hỏng, dữ liệu trống, dữ liệu v2 đã chuẩn (kiểm tra tính idempotent). |
| **CL-03: Giới hạn Lịch sử & Quota** | Cắt giảm lịch sử chi tiết tối đa 100 phiên (`history.slice(-100)`), bảo lưu vĩnh viễn `questionStats`. Bắt lỗi `QuotaExceededError` và hiển thị modal cảnh báo xuất JSON, không xóa âm thầm. | `StorageContract.pruneHistorySafely()`; hàm `exportUserDataJSON()`. | Test cắt giảm khi có 120 phiên lịch sử $\rightarrow$ còn đúng 100 phiên; `questionStats` không bị xóa. Giả lập `localStorage.setItem` ném lỗi Quota. |
| **FR-001..FR-004: Dashboard Tiến độ** | Tính toán tổng hợp tiến độ 9 chương, 95 mục, 264 câu. Tính % chính xác từng chương. Nhận diện chương yếu ($< 70\%$). Render thanh tiến độ có containment. | `AnalyticsContract.computeChapterProgress()`; trả về danh sách `ChapterProgressSummary`. | Test tính toán tiến độ với dữ liệu câu hỏi thực tế từ `dist/data.js`; xác nhận nhận diện chính xác chương yếu. |
| **FR-005..FR-008: Smart Review 4 Tabs** | Giao diện Smart Review gồm 4 tabs: `needs_practice`, `in_review`, `mastered`, `marked`. Cho phép đánh dấu bookmark `marked` độc lập. Nút "Luyện tập danh sách này". | Giao diện điều hướng `#review`; bộ lọc dựa trên `record.masteryStatus` và `record.marked`. | Test chuyển đổi 4 tab, đếm chính xác số lượng từng tab, lọc danh sách câu hỏi tương ứng. |
| **FR-009..FR-012: Adaptive Practice** | Cung cấp 4 preset luyện tập với thuật toán phân bổ câu hỏi deterministically: Unseen, Frequent Wrong, Weak Chapter, Adaptive Mixed (50/30/20) kèm cơ chế bù trừ nếu thiếu. | `AdaptiveSelectorContract.selectAdaptiveQuestions()`; trả về danh sách `Question[]`. | Test chọn câu hỏi ở từng preset với các điều kiện ngân hàng câu hỏi khác nhau (ít câu sai, nhiều câu chưa làm, v.v.). |
| **FR-013..FR-015: SVG Exam Analytics** | Biểu đồ đường SVG thuần (`viewBox="0 0 600 240"`), responsive, có hover tooltip qua `<title>`, thể hiện điểm số qua các kỳ thi; bảng phân tích theo 3 mức độ nhận thức (`q.level`). | `AnalyticsContract.computeExamTrend()`, `computeCognitiveBreakdown()`. Dựng thẻ `<svg>` inline. | Test tính toán trend điểm số, kiểm tra độ chính xác theo `q.level` (Nhận biết, Thông hiểu, Vận dụng), kiểm tra SVG a11y. |
| **Bảo toàn Chức năng Hiện có** | Giữ nguyên 100% thuật toán thi thử 40 câu / 75 phút / seed `533`, 27 mô hình tương tác SVG, phím tắt, CSS Containment và CLS = 0.00. | Invariance SLA trong `learning-experience-contract.md`. | Chạy toàn bộ bộ test `checks.cjs`, `checks-models.cjs` và `checks-perf.cjs` bảo đảm PASS 100%. |

---

## 6. Implementation Phases & Work Breakdown

### Phase 1: Storage Layer & Schema v2 Idempotent Auto-Migration
- **Mục tiêu**: Xây dựng nền tảng dữ liệu Schema v2 vững chắc, không làm mất bất kỳ dữ liệu v1 nào của người dùng.
- **Nhiệm vụ cụ thể**:
  1. Thêm hàm `StudyCore.migrateStorageToV2(raw)` trong `dist/core.js`.
  2. Xây dựng hàm thẩm định cấu trúc dữ liệu (`validateSchemaV2`).
  3. Cài đặt hàm `StudyCore.pruneHistorySafely(store, maxSessions = 100)`.
  4. Viết hàm hỗ trợ sao lưu / phục hồi: `exportUserDataJSON(store)` và `importUserDataJSON(jsonStr)`.
  5. Viết suite kiểm thử tự động `checks-learning.cjs` kiểm tra migration v1 $\rightarrow$ v2, tính idempotent và an toàn dữ liệu.

### Phase 2: Mastery State Machine & Question Performance Tracking
- **Mục tiêu**: Hiện thực hóa máy trạng thái thông minh theo chuẩn CL-01.
- **Nhiệm vụ cụ thể**:
  1. Thêm hàm `StudyCore.updateQuestionMastery(record, isCorrect, sessionType)` trong `dist/core.js`.
  2. Đảm bảo quy tắc: đúng 2 lần liên tiếp trong 2 phiên luyện tập mới đạt `mastered`; sai reset về 0; thi thử đúng không auto-master.
  3. Thêm hàm quản lý cờ đánh dấu `StudyCore.toggleQuestionMarked(stats, questionId)`.
  4. Tích hợp cập nhật `questionStats` khi người dùng hoàn thành một phiên luyện tập hoặc thi thử trong `dist/app.js`.
  5. Bổ sung test case máy trạng thái trong `checks-learning.cjs`.

### Phase 3: Adaptive Practice Selection Engine
- **Mục tiêu**: Xây dựng thuật toán sinh danh sách câu hỏi luyện tập thích ứng theo 4 preset ngoại tuyến.
- **Nhiệm vụ cụ thể**:
  1. Thêm hàm `StudyCore.selectAdaptiveQuestions(allQuestions, stats, mode, count)` trong `dist/core.js`.
  2. Hiện thực 4 preset:
     - `unseen`: Lọc câu `attempts === 0`.
     - `frequent_wrong`: Sắp xếp theo tỷ lệ sai `wrongCount / attempts` giảm dần.
     - `weak_chapter`: Lọc câu thuộc các chương có accuracy $< 70\%$.
     - `adaptive_mixed`: 50% sai/đang ôn, 30% chưa làm, 20% đã nắm vững kèm thuật toán bù trừ tuần tự (Unseen $\rightarrow$ Wrong $\rightarrow$ Bank).
  3. Bổ sung test case kiểm tra thuật toán phân bổ câu hỏi và fallback trong `checks-learning.cjs`.

### Phase 4: UI Components & Views Integration
- **Mục tiêu**: Thiết kế và tích hợp giao diện người dùng theo chuẩn UI/UX Pro Max, hỗ trợ WCAG 2.2 AA.
- **Nhiệm vụ cụ thể**:
  1. **Dashboard Tiến độ (`#dashboard`)**: Hiển thị tổng quan 264 câu, số câu đã học, số câu mastered, thanh tiến độ 9 chương, huy hiệu cảnh báo chương yếu $< 70\%$.
  2. **Smart Review 4 Tabs (`#review`)**: Giao diện 4 tab (`needs_practice`, `in_review`, `mastered`, `marked`), danh sách thẻ câu hỏi kèm giải thích chi tiết, nút toggle bookmark và nút kích hoạt luyện tập nhanh danh sách đã lọc.
  3. **Adaptive Practice Selector (`#practice`)**: Các danh thiếp chọn preset luyện tập, cho phép chọn số lượng câu (10, 20, 30, hoặc toàn bộ) và bắt đầu phiên luyện tập.
  4. **Exam Analytics & Inline SVG Score Trend Chart (`#analytics` hoặc `#history`)**: Biểu đồ đường SVG mượt mà thể hiện xu hướng điểm qua các lần thi, phân tích tỷ lệ chính xác theo 3 mức nhận thức (`Nhận biết`, `Thông hiểu`, `Vận dụng` từ `q.level`), thời gian làm bài trung bình.
  5. **Lịch sử Luyện tập Đa tiêu chí**: Bộ lọc theo loại hoạt động (practice/exam), khoảng ngày, mức điểm; nút xem chi tiết từng phiên và nút xuất bản sao lưu JSON.
  6. **Xử lý Quota & Cảnh báo Bộ nhớ**: Modal cảnh báo thân thiện khi gặp `QuotaExceededError`, hướng dẫn người dùng xuất JSON và giải phóng các phiên lịch sử cũ.
  7. **Style & Accessibility (`dist/style.css`)**: Áp dụng Design Tokens từ Feature 002, CSS Containment từ Feature 003, `:focus-visible`, tương phản $\ge 4.5:1$, mobile viewport $\ge 320\text{px}$.

### Phase 5: Verification, Benchmarking & Regression Testing
- **Mục tiêu**: Nghiệm thu toàn diện tất cả các tiêu chí chất lượng, hiệu năng và tính toàn vẹn.
- **Nhiệm vụ cụ thể**:
  1. Chạy toàn bộ bộ test `checks-learning.cjs` (100% PASS).
  2. Chạy bộ test hồi quy `checks.cjs` và `checks-models.cjs` (100% PASS).
  3. Chạy `checks-perf.cjs` kiểm tra Core Web Vitals, CSS Containment và tính toàn vẹn hiệu năng.
  4. Kiểm tra cú pháp toàn bộ tệp JavaScript: `node --check dist/core.js dist/app.js`.
  5. Kiểm tra định dạng và khoảng trắng Git: `git diff --check`.

---

## 7. Complexity Tracking & Design Trade-offs

| Thành phần Thiết kế | Giải pháp Lựa chọn | Giải pháp Thay thế Bị từ chối | Lý do Lựa chọn Giải pháp Hiện tại |
|:---|:---|:---|:---|
| **Cơ chế Vẽ Biểu đồ Xu hướng** | Inline SVG thuần với `viewBox="0 0 600 240"` và CSS Design Tokens. | Cài đặt Chart.js, D3.js hoặc Canvas API. | Tuân thủ tuyệt đối Nguyên tắc I & VII của Hiến pháp (0 runtime dependencies). Inline SVG nhẹ ($< 2\text{ KB}$), hiển thị sắc nét trên màn hình Retina, dễ dàng gán thẻ `<title>` cho trợ năng screen reader và áp dụng CSS theme biến đổi tức thì. |
| **Quy tắc Chuyển trạng thái Mastered** | 2 lần đúng liên tiếp trong 2 phiên luyện tập riêng biệt (`consecutiveCorrect >= 2`). | Spaced Repetition kiểu Anki/SuperMemo (SM-2 với khoảng cách thời gian ngày/tuần). | Người dùng ôn tập thi trắc nghiệm theo phiên (session-based) ngắn hạn trong vài ngày/tuần; thuật toán SM-2 đòi hỏi tính toán khoảng cách ngày thực tế gây phức tạp thừa thãi và không phù hợp với hành vi ôn thi tập trung. Quy tắc 2-streak đáp ứng hoàn hảo CL-01. |
| **Quản lý Giới hạn Lưu trữ Lịch sử** | Giới hạn 100 phiên chi tiết trong `history`, bảo lưu vĩnh viễn `questionStats`, cảnh báo xuất JSON khi lỗi Quota. | Xóa tự động không báo trước (silent FIFO purge) hoặc không giới hạn dẫn đến sập ứng dụng. | Tuân thủ tuyệt đối CL-03: không bao giờ âm thầm xóa dữ liệu của người dùng mà không có cảnh báo. Cung cấp nút xuất JSON trước khi dọn dẹp để bảo đảm chủ quyền dữ liệu của người học. |
| **Mức độ Nhận thức trong Analytics** | Trích xuất trực tiếp từ trường `q.level` (`Nhận biết`, `Thông hiểu`, `Vận dụng`) có sẵn trong `dist/data.js`. | Suy diễn hoặc gán nhãn giả định (mock data). | Dữ liệu `dist/data.js` đã có sẵn 100% trường `level` cho toàn bộ 264 câu hỏi. Sử dụng dữ liệu thực giúp bảng phân tích phản ánh chính xác ma trận cấu trúc đề thi an toàn mạng. |

---

## 8. Rollback & Contingency Plan

Nếu trong quá trình triển khai xảy ra sự cố dữ liệu hoặc xung đột logic:
1. **Dữ liệu Lưu trữ**: Mã di chuyển (Migration) luôn tạo bản snapshot v1 trước khi nâng cấp. Nếu người dùng chọn khôi phục, hệ thống có thể nhập lại file JSON v1 gốc một cách nguyên vẹn.
2. **Khả năng Tương thích Ngược**: Cấu trúc Schema v2 giữ nguyên các khóa cơ bản (`savedExams`, `bookmarks`, `history`) để nếu người dùng rollback về Feature 003, các màn hình cũ vẫn đọc được lịch sử cơ bản mà không bị crash.
3. **Mã nguồn**: Quá trình triển khai chia nhỏ thành các commit logic rõ ràng theo từng phase trên nhánh `feat/004-learning-experience-smart-review`. Dễ dàng revert từng commit độc lập nếu cần.
