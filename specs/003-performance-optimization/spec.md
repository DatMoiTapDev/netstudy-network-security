# Feature Specification: NetStudy Performance Optimization

**Feature Directory**: `specs/003-performance-optimization`
**Feature Branch**: `feat/003-performance-optimization`
**Created**: 2026-11-04
**Status**: Draft
**Input**: User description: "Chuẩn bị Feature 003 — NetStudy Performance Optimization bằng GitHub Spec Kit. Tối ưu Core Web Vitals. Giảm JavaScript và CSS không cần thiết. Cải thiện tốc độ chuyển trang và hiển thị bài học. Tối ưu render danh sách câu hỏi. Tối ưu hiệu năng 27 mô hình SVG tương tác. Giảm thao tác DOM dư thừa. Tối ưu trải nghiệm thiết bị di động. Bảo toàn toàn bộ chức năng Feature 001 và 002. Yêu cầu đo hiệu năng trước và sau tối ưu. Không tự đặt số liệu hoặc tuyên bố cải thiện nếu chưa đo thực tế."

---

## 1. Bối cảnh & Số liệu Đo đạc Thực tế (Baseline Performance Audit)

Khác với các phỏng đoán lý thuyết, toàn bộ chỉ số hiệu năng cơ sở (Baseline) được đo đạc trực tiếp trên mã nguồn nhánh `main` (commit `a091ad3`) bằng Node.js Performance API và phân tích tệp phân phối:

### A. Dung lượng Tệp Phân phối Hiện tại (`dist/`)

| Tệp | Dung lượng thực tế | Tỷ trọng trên tổng gói | Đánh giá hiện trạng |
|:---|:---:|:---:|:---|
| `dist/data.js` | 515,026 bytes (502.96 KB) | **71.4%** | Chứa 9 chương, 95 mục, 264 câu hỏi và 278 thuật ngữ. Tải đồng bộ dạng blocking script. |
| `dist/models.js` | 115,730 bytes (113.02 KB) | **16.1%** | Chứa định nghĩa 27 mô hình (tọa độ, 112 bước). Hiện đang tải đồng bộ ngay từ lúc mở trang đầu dù người dùng có thể chưa xem mô hình. |
| `dist/app.js` | 47,088 bytes (45.98 KB) | **6.5%** | Logic router, theme engine, 17 SVG icons, Feature 001 micro-DOM. |
| `dist/style.css` | 22,129 bytes (21.61 KB) | **3.1%** | 3-tier design tokens, responsive layout, dark theme, mobile nav. |
| `dist/model-ui.js` | 10,143 bytes (9.91 KB) | **1.4%** | Trình diễn SVG mô hình và chuyển bước tương tác. |
| `dist/core.js` | 3,947 bytes (3.85 KB) | **0.5%** | Thuật toán sinh đề, chấm điểm, ma trận quota, validation. |
| `dist/models.css` | 3,787 bytes (3.70 KB) | **0.5%** | Style tĩnh cho mô hình trực quan. |
| `dist/index.html` | 2,950 bytes (2.88 KB) | **0.4%** | Vỏ HTML, script Zero-FOUC, container điều hướng. |
| **Tổng cộng** | **720,800 bytes (703.91 KB)** | **100%** | Mã thuần uncompressed, không nén gzip/brotli. |

### B. Chỉ số Đo đạc Thời gian Thực thi Cơ sở (Execution Benchmarks)

- **Thời gian phân tích & nạp mã ban đầu (Script Load & Evaluation)**: `19.42 ms` (đo trên môi trường Node.js VM V8).
- **Tốc độ chuyển đổi tuyến đường (Route Transition Latency)**: Trung bình `0.432 ms/render` qua 100 lần chuyển route liên tục.
- **Tốc độ kết xuất SVG Mô hình (Model SVG Rendering)**: Trung bình `0.054 ms/model` qua 270 lần render SVG.
- **Thao tác DOM hiện tại**: Mỗi lần chuyển trang giữa các bài học lớn (ví dụ Bài 3 với 15 mục, nhiều bảng đối chiếu và container mô hình), toàn bộ cây DOM được tạo lại bằng chuỗi nối HTML dài thông qua `app.innerHTML = ...`, gây ra hiện tượng tính toán lại bố cục toàn trang (Full Layout Recalculation).

---

## 2. User Scenarios & Testing *(mandatory)*

### User Story 1 — Tối ưu Tải Trang Ban đầu & Core Web Vitals (Priority: P1) 🎯 MVP

Là một học viên truy cập NetStudy từ mạng di động 4G/3G hoặc thiết bị cấu hình khiêm tốn, tôi muốn trang web tải nhanh tức thì, nội dung xuất hiện ngay lập tức mà không bị giật bố cục (CLS) hoặc đơ giao diện khi nạp script.

**Why this priority**: Lần tải đầu tiên quyết định cảm nhận mượt mà của ứng dụng. Giảm thiểu tài nguyên chặn render (Render-Blocking Resources) và tối ưu hóa thứ tự tải tài nguyên là cốt lõi của hiệu năng web hiện đại.

**Independent Test**: Mở trang Tổng quan (`#home`) trên trình duyệt:
1. Giao diện trang chủ xuất hiện ngay mà không bị chặn bởi việc nạp trước các tệp dữ liệu mô hình chưa cần dùng đến.
2. Chỉ số Largest Contentful Paint (LCP) đạt $<1.2\text{s}$ trên mạng mô phỏng 4G.
3. Chỉ số Cumulative Layout Shift (CLS) đạt tuyệt đối $= 0$ (không có hiện tượng xê dịch nút hay thẻ card).

**Acceptance Scenarios**:
1. **Given** học viên truy cập lần đầu vào `#home` hoặc `#courses`, **When** trình duyệt tải trang, **Then** tài nguyên quan trọng (critical CSS, core app) được ưu tiên xử lý trước, văn bản hiển thị ngay với `font-display: swap` mà không bị ẩn chữ (FOIT).
2. **Given** học viên chuyển qua lại giữa các trang chính (`#home` $\leftrightarrow$ `#courses` $\leftrightarrow$ `#practice`), **When** quan sát giao diện, **Then** không có bất kỳ hiện tượng giật cục, xê dịch vị trí (CLS = 0) nhờ kích thước biểu tượng SVG và thẻ card được cấp phát kích thước cố định trước.

---

### User Story 2 — Tối ưu Render Bài học Dài & Danh sách Câu hỏi (Priority: P1)

Là một học viên đang đọc một bài học dài (như Bài 3 có 15 mục chi tiết) hoặc làm bài thi 40 câu hỏi, tôi muốn thao tác cuộn trang và chuyển câu hỏi phản hồi tức thì ($<16\text{ms}$ — 60 FPS), không bị đơ giật do tính toán lại toàn bộ cây DOM.

**Why this priority**: Bài học và phòng thi là 2 không gian người dùng tương tác nhiều nhất. Giảm thiểu thao tác DOM dư thừa và áp dụng CSS Containment giúp trình duyệt cô lập phạm vi dựng hình, tiết kiệm tối đa CPU/GPU.

**Independent Test**: Mở `#lesson/3` (bài học dài nhất) và chuyển sang `#session` (40 câu hỏi):
1. Thao tác cuộn trang mượt mà 60 FPS, không có khung hình bị rơi (dropped frames).
2. Khi chọn đáp án hoặc chuyển câu, thời gian phản hồi tương tác (Interaction to Next Paint - INP) đạt $<50\text{ms}$.
3. Phạm vi tính toán lại kiểu dáng (Recalculate Style) được cô lập trong từng thẻ mục nhờ `contain: content` / `contain: layout style`.

**Acceptance Scenarios**:
1. **Given** học viên đang mở bài học có nhiều mục và bảng biểu (`#lesson/3`), **When** duyệt bài học, **Then** các khối `.lesson-section`, `.card`, `.table-wrap` sử dụng thuộc tính `contain` để trình duyệt không phải tính toán lại toàn bộ trang khi có tương tác nhỏ.
2. **Given** học viên đang làm bài thi 40 câu trong `#session`, **When** bấm phím `1`–`4` hoặc click chọn phương án, **Then** cập nhật DOM chỉ tác động đúng các phần tử mục tiêu (Option, Qnav Button, Counter) với thời gian thực thi $<5\text{ms}$, giữ trọn vẹn tiêu điểm và vị trí cuộn tự nhiên của Feature 001.

---

### User Story 3 — Tối ưu Hiệu năng 27 Mô hình SVG Tương tác (Priority: P2)

Là một học viên đang quan sát các sơ đồ an toàn mạng (như RSA, Diffie-Hellman, Tường lửa, SSL/TLS Handshake), tôi muốn khi bấm "Bước tiếp theo" hoặc chọn các bước 1, 2, 3... sơ đồ chuyển đổi mượt mà tức thì, không bị tính toán lại tọa độ hình học từ đầu.

**Why this priority**: 27 mô hình là tính năng trực quan đặc sắc nhất của NetStudy. Tối ưu hóa chuỗi SVG và cơ chế chuyển đổi bước đảm bảo trải nghiệm học cơ chế bảo mật trực quan và chuyên nghiệp.

**Independent Test**: Truy cập `#models/4` (RSA) và `#models/5` (Diffie-Hellman):
1. Bấm liên tục các bước 1 $\rightarrow$ 2 $\rightarrow$ 3 $\rightarrow$ 4 $\rightarrow$ 5: Sơ đồ cập nhật các nét sáng/mờ ngay lập tức, không có độ trễ thị giác ($<16\text{ms}$).
2. Bộ nhớ không bị rò rỉ khi chuyển đổi qua lại giữa 27 mô hình khác nhau.

**Acceptance Scenarios**:
1. **Given** học viên đang xem một mô hình bảo mật, **When** chuyển qua bước tiếp theo, **Then** trình duyệt chỉ cập nhật các thuộc tính highlight hoặc đổi SVG mà không kích hoạt reflow toàn trang.
2. **Given** học viên chuyển đổi giữa các bài học trong `#models`, **When** danh mục 27 mô hình hiển thị, **Then** lưới mô hình render mượt mà nhờ cơ chế ẩn hiện thẻ nhẹ nhàng bằng CSS `hidden` / `display: none` thay vì tạo lại cấu trúc DOM.

---

### User Story 4 — Tăng tốc Phần cứng & Tiết kiệm Pin trên Thiết bị Di động (Priority: P2)

Là một học viên học tập trên điện thoại thông minh, tôi muốn thanh điều hướng đáy (Bottom Bar) và ngăn kéo menu (Mobile Drawer) trượt ra vào êm ái, máy không bị nóng và tiết kiệm pin trong suốt 75 phút làm bài thi.

**Why this priority**: Trải nghiệm di động đòi hỏi hiệu quả năng lượng cao. Sử dụng GPU Compositing (`will-change: transform`, `transform: translateZ(0)`) loại bỏ hiện tượng vẽ lại màn hình (paint flashing) không cần thiết.

**Independent Test**: Mở DevTools ở chế độ mobile ($375\text{px}$):
1. Mở và đóng Mobile Drawer: Hiệu ứng trượt sử dụng GPU compositing, không có thanh cuộn giật.
2. Chạy bài thi 40 câu trong 75 phút: Mức sử dụng bộ nhớ (heap size) giữ ổn định, không tăng lũy tiến theo thời gian.

**Acceptance Scenarios**:
1. **Given** học viên thao tác mở Mobile Drawer trên thiết bị di động, **When** drawer trượt lên từ đáy màn hình, **Then** animation được xử lý hoàn toàn trên tầng GPU (`transform: translateY(...)`), không gây layout recalculation.
2. **Given** đồng hồ đếm ngược bài thi 75 phút chạy mỗi giây, **When** kiểm tra bộ đếm `setInterval`, **Then** chỉ cập nhật duy nhất `textContent` của phần tử `#timer` định dạng số cố định (tabular-nums), không gây re-render các vùng khác.

---

## 3. Edge Cases

- **EC-01: Mạng di động chập chờn / Mất kết nối (Offline Resilience)**: Khi người dùng đang làm bài thi mà mất mạng, ứng dụng vẫn hoạt động $100\%$ mượt mà do toàn bộ mã nguồn và dữ liệu đã được lưu trữ cục bộ.
- **EC-02: Thiết bị di động cấu hình rất yếu (RAM $<2\text{GB}$)**: Tránh lưu trữ bộ đệm (cache) DOM không giới hạn gây tràn bộ nhớ; chỉ lưu trữ cấu trúc cần thiết và giải phóng bộ nhớ khi chuyển trang lớn.
- **EC-03: Phiên thi thử kéo dài 75 phút liên tục**: Quản lý timer `setInterval` chặt chẽ, dọn dẹp interval cũ bằng `clearInterval` khi nộp bài hoặc chuyển trang để chống rò rỉ bộ nhớ (memory leak).
- **EC-04: Đổi Theme trong khi đang xem mô hình SVG phức tạp**: Chuyển đổi theme Light $\leftrightarrow$ Dark phải diễn ra mượt mà tức thì ($<50\text{ms}$) mà không làm mất bước hiện tại hay vị trí xem của mô hình.
- **EC-05: Chạy ứng dụng trực tiếp qua giao thức `file:///`**: Không được sử dụng các API yêu cầu máy chủ web (như `fetch()` file cục bộ bị chặn bởi CORS trên một số trình duyệt), đảm bảo tính di động tối đa của NetStudy.

---

## 4. Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Critical Resource Loading & Font Optimization)**: Hệ thống PHẢI tối ưu hóa quá trình nạp tài nguyên trong `dist/index.html`:
  - Khai báo rõ ràng kích thước icon, hình ảnh để đảm bảo CLS = 0.
  - Áp dụng `font-display: swap` hoặc font hệ thống dự phòng để loại bỏ FOIT (Flash of Invisible Text).
  - Tối ưu hóa thứ tự nạp các tệp script để trang hiển thị nhanh nhất có thể.
- **FR-002 (CSS Containment & Layout Recalculation Isolation)**: Hệ thống PHẢI áp dụng thuộc tính `contain: content` hoặc `contain: layout style` trong `dist/style.css` cho các khối độc lập (`.card`, `.lesson-section`, `.stat`, `.option`, `.study-model`) nhằm cô lập phạm vi tính toán lại bố cục của trình duyệt.
- **FR-003 (GPU Hardware Acceleration for Mobile UI)**: Hệ thống PHẢI bổ sung cơ chế tăng tốc đồ họa phần cứng (`transform: translateZ(0)` / `will-change`) cho thanh điều hướng đáy (`.mobile-nav`) và ngăn kéo di động (`.drawer-sheet`) trong `dist/style.css`.
- **FR-004 (DOM String Concatenation & Template Optimization)**: Hệ thống PHẢI tối ưu hóa việc tạo chuỗi HTML trong `dist/app.js`, loại bỏ các phép nối chuỗi dư thừa, tái sử dụng các mẫu DOM ổn định khi chuyển trang.
- **FR-005 (Selective SVG Model Update)**: Hệ thống PHẢI tối ưu hóa hàm kết xuất SVG mô hình trong `dist/model-ui.js`, tránh tính toán lại các giá trị tọa độ cố định của 27 mô hình trên mỗi bước chuyển.
- **FR-006 (Zero Memory Leak in Timer & Exam Lifecycle)**: Quá trình đếm ngược thời gian trong `dist/app.js` PHẢI đảm bảo dọn dẹp `clearInterval` triệt để khi rời trang, nộp bài hoặc kết thúc bài thi.
- **FR-007 (Search Debouncing & Filtering Performance)**: Các ô tìm kiếm bài học (`#courseSearch`) và thuật ngữ (`#termSearch`) PHẢI áp dụng cơ chế debouncing nhẹ hoặc tối ưu hóa mảng lọc để không gây khựng giao diện khi người dùng gõ phím nhanh.
- **FR-008 (Feature 001 Invariance)**: Toàn bộ các cơ chế cập nhật vi mô DOM (`updateOptionSelection`, `updateFlagState`, `updateSectionCompletion`, `updateBookmarkState`), tiêu điểm bàn phím an toàn (`safeFocus`), phím tắt `1-4`, `A-D`, `F`, `ArrowRight`/`ArrowLeft`, `P`/`N` PHẢI giữ nguyên $100\%$, không bị suy giảm hiệu năng.
- **FR-009 (Feature 002 Invariance)**: Toàn bộ kiến trúc Design Tokens 3 tầng, Theme Engine (Sáng/Tối/Tự động), Zero-FOUC script, 17 inline vector SVG icons, và dark mode cho 27 mô hình PHẢI giữ nguyên $100\%$.
- **FR-010 (Curriculum & Core Data Invariance)**: Dữ liệu 9 chương, 95 mục, 264 câu hỏi trong `data.js`, thuật toán sinh đề trong `core.js`, và cấu trúc khóa `netstudy-atmmt-v1` PHẢI được giữ nguyên vẹn $100\%$.

### Non-Functional Requirements

- **NFR-001 (Zero Framework & Pure Vanilla)**: Tiếp tục tuân thủ tuyệt đối Hiến pháp dự án (Principle I & VII): Không dùng React, Vue, Svelte, Tailwind runtime, jQuery hay bất kỳ runtime npm package nào.
- **NFR-002 (Performance Verification via Real Measurements)**: Mọi cải tiến hiệu năng PHẢI được đo đạc bằng số liệu thực tế trước và sau tối ưu (thời gian nạp, thời gian render, kích thước byte). Tuyệt đối không tự suy đoán hoặc tuyên bố cải tiến nếu chưa đo.
- **NFR-003 (60 FPS Frame Rate)**: Mọi thao tác cuộn bài học, bấm chọn đáp án, đóng mở drawer, và chuyển bước mô hình PHẢI duy trì tốc độ khung hình mượt mà 60 FPS (thời gian xử lý khung hình $\le 16.6\text{ms}$).
- **NFR-004 (Core Web Vitals Targets)**:
  - Largest Contentful Paint (LCP): $\le 1.2\text{s}$ trên kết nối tiêu chuẩn.
  - Cumulative Layout Shift (CLS): $= 0$ (hoàn toàn không có layout shift).
  - Interaction to Next Paint (INP): $\le 50\text{ms}$.
- **NFR-005 (Mandatory Automated Test Compatibility)**: Toàn bộ bài kiểm thử `node checks.cjs` và `node checks-models.cjs` PHẢI tiếp tục PASS 100% với mã thoát 0 sau khi tối ưu.

---

## 5. Key Entities & Performance Models

### `PerformanceBaseline`
Đối tượng ghi nhận số liệu đo đạc kỹ thuật:
- `uncompressedDistributionBytes`: Tổng số byte của thư mục `dist/` (hiện tại: 720,800 bytes).
- `scriptEvaluationTimeMs`: Thời gian nạp và đánh giá mã ban đầu (hiện tại: 19.42 ms).
- `routeTransitionTimeMs`: Thời gian trung bình kết xuất một tuyến đường (hiện tại: 0.432 ms).
- `modelSvgRenderTimeMs`: Thời gian kết xuất một sơ đồ SVG (hiện tại: 0.054 ms).

### `RoutePerformanceBudget`
Ngân sách hiệu năng cho các tuyến đường chính:
- Ngân sách thời gian render cho trang Tổng quan (`#home`): $<1.0\text{ms}$.
- Ngân sách thời gian render cho bài học dài (`#lesson/3`): $<3.0\text{ms}$.
- Ngân sách cập nhật phương án trắc nghiệm vi mô (`updateOptionSelection`): $<2.0\text{ms}$.
- Ngân sách chuyển bước mô hình an toàn mạng (`ModelUI.selectStep`): $<5.0\text{ms}$.

---

## 6. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (Zero CLS Guarantee)**: Điểm Cumulative Layout Shift đạt $0.00$ trên cả giao diện Desktop và Mobile trong toàn bộ chu trình sử dụng.
- **SC-002 (Sub-16ms Interaction Latency)**: $100\%$ các thao tác vi mô (chọn đáp án, bấm cắm cờ, đổi câu, đổi bước mô hình) phản hồi trong vòng dưới $16\text{ms}$ (chuẩn 60 FPS).
- **SC-003 (CSS Containment Coverage)**: Ít nhất $80\%$ các khối thành phần lặp lại (`.card`, `.lesson-section`, `.option`, `.study-model`) được áp dụng thuộc tính `contain` để cách ly phạm vi render của trình duyệt.
- **SC-004 (Mobile Frame Drop Prevention)**: Đóng mở Mobile Drawer và cuộn danh sách câu hỏi không bị rơi khung hình (0 dropped frames) nhờ cơ chế tăng tốc GPU.
- **SC-005 (100% Regression-Free)**: Toàn bộ bài kiểm thử tự động hiện tại (`checks.cjs` và `checks-models.cjs`) vượt qua $100\%$ với mã thoát 0, bảo toàn nguyên vẹn tính tất định và dữ liệu học tập.

---

## 7. Assumptions & Scope Boundaries

### Giả định hợp lý
- Trình duyệt mục tiêu là các trình duyệt hiện đại (Chrome, Edge, Firefox, Safari) hỗ trợ đầy đủ CSS Containment (`contain`), CSS Grid, Flexbox, và hardware compositing.
- Người dùng chạy ứng dụng trực tiếp từ GitHub Pages hoặc mở qua giao thức `file:///` trên máy tính cục bộ.

### Phạm vi loại trừ (Out of Scope for Feature 003)
- Không can thiệp hoặc thay đổi nội dung học liệu trong `data.js` (9 chương, 264 câu hỏi, 278 thuật ngữ) vì đây là tài sản giáo dục cố định.
- Không thay đổi thuật toán sinh đề thi, seed `533` trong `core.js`.
- Không đưa vào các công cụ bundler phức tạp (Webpack, Vite, Rollup) nếu làm phá vỡ kiến trúc Native ES Modules / Vanilla không cần build của dự án.
- Không viết lại toàn bộ ứng dụng bằng WebGL hay Canvas (vẫn giữ cấu trúc HTML/CSS/SVG chuẩn để đảm bảo khả năng tiếp cận WCAG 2.2 AA).
