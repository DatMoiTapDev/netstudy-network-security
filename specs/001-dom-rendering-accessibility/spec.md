# Feature Specification: Improve DOM Rendering & Keyboard Accessibility

**Feature Directory**: `specs/001-dom-rendering-accessibility`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "Improve DOM Rendering & Keyboard Accessibility. Mục tiêu: 1. Giảm cập nhật DOM không cần thiết trong thao tác chọn đáp án, đánh dấu câu hỏi và theo dõi tiến độ học tập. 2. Bảo toàn keyboard focus sau mỗi tương tác. 3. Bảo toàn scroll position một cách tự nhiên, không phụ thuộc vào giải pháp cuộn thủ công khi không cần thiết. 4. Duy trì hoạt động của screen reader và semantic HTML. 5. Không làm thay đổi hành vi chức năng đang có."

---

## Codebase Facts vs. Audit Observations

Để bảo đảm tính chính xác kỹ thuật trước khi đặc tả, bảng dưới đây phân định rõ ràng giữa **sự thật kiểm chứng trực tiếp từ mã nguồn** và **nhận định/suy đoán từ báo cáo audit ban đầu**:

| Thành phần | Phát hiện đã kiểm chứng bằng mã nguồn (`dist/app.js`, `core.js`, `model-ui.js`) | Nhận định từ báo cáo audit ban đầu | Kết luận áp dụng vào Specification |
|:---|:---|:---|:---|
| **Cơ chế render khi chọn đáp án** | Dòng 35 `app.js`: Khi click đáp án (`case 'answer'`), mã nguồn lưu tọa độ cuộn `const y=scrollY;`, gọi hàm `render()`, rồi gọi `scrollTo(0,y);`. Hàm `render()` gán lại toàn bộ `app.innerHTML = ...`. | Toàn bộ trang web bị giật và chớp trắng khi chọn đáp án. | **Chính xác**: `app.innerHTML` tái tạo toàn bộ thẻ `<main id="app">`. Việc gán đè DOM làm mất toàn bộ đối tượng DOM cũ, tiêu điểm phím và trạng thái cuộn tự nhiên. |
| **Tiêu điểm bàn phím (Focus loss)** | Khi `app.innerHTML` bị gán lại, phần tử đang giữ focus (`document.activeElement`) bị xóa khỏi cây DOM, khiến focus tự động rơi về `<body>`. | Người dùng bị mất dấu vị trí khi dùng bàn phím. | **Chính xác**: Hiện tại `app.js` hoàn toàn không có cơ chế lưu vết hoặc khôi phục `activeElement` sau `render()`. (Khác với `model-ui.js` dòng 21 đã có sẵn cơ chế khôi phục focus cục bộ). |
| **Thao tác đánh dấu câu hỏi (`flag`)** | Dòng 35 `app.js`: `case 'flag': a.flags=...; save(); render();` — Thậm chí **không lưu lại `scrollY`**, khiến màn hình có thể bị nhảy cuộn lên đầu nếu nội dung câu hỏi dài. | Mọi thao tác đều giữ được vị trí bằng `scrollTo`. | **Chính xác**: Riêng nút đánh dấu câu hỏi (`flag`) bị nhảy cuộn mạnh hơn thao tác chọn đáp án vì thiếu `const y=scrollY`. |
| **Hỗ trợ phím tắt bàn phím** | Kiểm tra mã nguồn `dist/app.js`: Ứng dụng **chưa có bất kỳ trình lắng nghe sự kiện `keydown` nào**. Toàn bộ tương tác phím hiện tại hoàn toàn phụ thuộc vào việc người dùng nhấn phím `Tab` để di chuyển đến từng nút rồi nhấn `Enter/Space`. | Cần cải thiện khả năng tiếp cận bàn phím. | **Làm rõ**: Hiện tại chưa có phím tắt (1-4, A-D, Arrow keys). Việc bổ sung phím tắt là một yêu cầu mở rộng giá trị gia tăng, trong khi yêu cầu cốt lõi bắt buộc là **không làm mất focus khi dùng phím Tab/Enter/Space**. |
| **Cấu trúc ngữ nghĩa (Semantic HTML)** | Các phương án trắc nghiệm được cấu trúc dưới dạng thẻ `<button class="option ...">` có thuộc tính `aria-pressed="true/false"`. Không phải là form `<input type="radio">`. | Thiếu semantic HTML chuẩn radio. | **Đánh giá**: Cấu trúc `<button aria-pressed>` là hợp lệ theo chuẩn WAI-ARIA button toggle, screen reader vẫn đọc được trạng thái. Mục tiêu là duy trì và nâng cao khả năng tiếp cận mà không phá vỡ cấu trúc CSS hiện có. |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chọn Đáp án Mượt mà, Giữ nguyên Tiêu điểm & Vị trí Cuộn (Priority: P1)

Là một học viên đang làm bài thi hoặc luyện tập trắc nghiệm, tôi muốn khi nhấp chọn hoặc dùng bàn phím chọn một đáp án, chỉ có các nút lựa chọn và trạng thái câu hỏi đó được cập nhật, để vị trí cuộn trang không bị rung giật và tiêu điểm bàn phím tiếp tục nằm tại lựa chọn tôi vừa tương tác.

**Why this priority**: Đây là tương tác cốt lõi nhất của toàn bộ ứng dụng NetStudy. Loại bỏ việc re-render toàn bộ `app.innerHTML` tại đây sẽ giải quyết 90% cảm giác gián đoạn của người dùng.

**Independent Test**: Mở một bài luyện tập bất kỳ, dùng phím `Tab` di chuyển đến lựa chọn `B`, nhấn phím `Space` để chọn. Kiểm tra:
1. Nút `B` nhận trạng thái `selected` ngay lập tức.
2. Tiêu điểm bàn phím vẫn ở nguyên tại nút `B` (đường viền focus không biến mất).
3. Vị trí cuộn trang giữ nguyên tự nhiên mà không cần lệnh cưỡng bức `scrollTo`.
4. Vùng hiển thị giải thích (ở chế độ học) xuất hiện mượt mà ngay bên dưới.

**Acceptance Scenarios**:

1. **Given** học viên đang làm bài ở chế độ "Học có giải thích" tại câu hỏi có nội dung dài cần cuộn màn hình, **When** học viên chọn phương án A (bằng chuột hoặc bàn phím), **Then** phương án A hiển thị trạng thái đúng/sai, khung lời giải chi tiết hiển thị, vị trí cuộn trang giữ nguyên $100\%$, tiêu điểm bàn phím không bị rơi về `<body>`.
2. **Given** học viên đang thi thử 40 câu / 75 phút, **When** học viên chọn một đáp án, **Then** nút lựa chọn đổi sang trạng thái đã chọn, ô số thứ tự tương ứng trong bảng điều hướng `qnav` chuyển sang màu xanh (`answered`), đồng hồ đếm ngược trên thanh bên tiếp tục đếm giây mượt mà không bị ngắt nhịp DOM.
3. **Given** học viên nhấp thay đổi liên tục giữa các phương án A, B, C, D trong cùng một câu hỏi, **Then** trạng thái `selected` chuyển đổi tức thì giữa các nút, không có hiện tượng chớp trắng (white flash) của vùng chứa chính.

---

### User Story 2 - Đánh dấu Cờ Xem lại & Lưu Câu hỏi Không Gây Nhảy Cuộn (Priority: P1)

Là một học viên đang phân vân một câu hỏi khó trong đề thi, tôi muốn nhấn nút "Đánh dấu xem lại" (hoặc lưu câu hỏi trong phần xem lại kết quả) mà màn hình không bị nhảy cuộn lên đỉnh hay tải lại giao diện.

**Why this priority**: Hiện tại nút `flag` gọi thẳng `render()` không lưu tọa độ cuộn, gây trải nghiệm rất khó chịu khi học viên đang đọc dở câu hỏi dài ở phần dưới màn hình.

**Independent Test**: Cuộn xuống một câu hỏi ở vị trí thấp trên màn hình, bấm nút "☆ Đánh dấu xem lại". Quan sát nhãn nút chuyển thành "★ Đã đánh dấu", ô tương ứng trên thanh điều hướng nhận gạch chân vàng, và màn hình đứng yên tuyệt đối.

**Acceptance Scenarios**:

1. **Given** học viên đang ở câu hỏi số 20, **When** học viên nhấp nút hoặc dùng bàn phím kích hoạt nút đánh dấu cờ (`flag`), **Then** nút chuyển đổi nhãn sang "★ Đã đánh dấu", ô số 20 trong lưới `qnav` nhận class `flagged`, tiêu điểm bàn phím vẫn nằm tại nút cờ, vị trí cuộn không xê dịch.
2. **Given** học viên đang xem lại kết quả thi tại trang `result`, **When** học viên bấm "☆ Lưu câu này", **Then** nút chuyển thành "★ Bỏ đánh dấu" tại chỗ mà không kích hoạt tải lại toàn bộ danh sách 40 câu kết quả.

---

### User Story 3 - Theo dõi & Cập nhật Tiến độ Mục học Từng phần (Priority: P2)

Là một học viên đang đọc bài học lý thuyết dài (ví dụ Bài 3 - Mật mã học với 15 mục), tôi muốn khi bấm "Đánh dấu đã học" ở cuối một mục, trạng thái hoàn thành được cập nhật ngay tại mục đó và trên menu điều hướng phụ mà không phải tải lại toàn bộ nội dung bài học.

**Why this priority**: Các bài học có dung lượng DOM rất lớn (hàng chục đoạn văn bản, bảng so sánh và sơ đồ SVG). Tái tạo toàn bộ bài học chỉ để đổi 1 nút bấm gây tốn CPU không cần thiết.

**Independent Test**: Mở Bài 3, cuộn đến Mục 3.4, bấm "Đánh dấu đã học". Nút chuyển sang "✓ Đã học mục này", mục 3.4 ở thanh menu phụ bên phải xuất hiện dấu tick "✓", không có bất kỳ độ trễ hay giật trang nào.

**Acceptance Scenarios**:

1. **Given** học viên đang đọc mục 3.4 của Bài 3, **When** học viên bấm nút "Đánh dấu đã học", **Then** nút hiện tại cập nhật thành "✓ Đã học mục này", thanh điều hướng bên phải hiển thị dấu "✓" cạnh mục 3.4, tiến độ tổng quan được ghi nhận vào `localStorage`, trang không bị cuộn lại từ đầu.

---

### User Story 4 - Điều hướng Bàn phím & Tương tác Trợ năng Toàn diện (Priority: P2)

Là một người dùng điều hướng hoàn toàn bằng bàn phím hoặc sử dụng trình đọc màn hình (Screen Reader), tôi muốn mọi phần tử tương tác trong quy trình làm bài đều có thể tiếp cận tuần tự qua phím `Tab`, có đường viền `:focus-visible` rõ ràng và thông báo trạng thái chính xác qua WAI-ARIA.

**Why this priority**: Đảm bảo tiêu chuẩn tiếp cận WCAG 2.2 AA theo đúng Nguyên tắc VI của Hiến chương dự án (Constitution).

**Independent Test**: Khởi động trình đọc màn hình hoặc dùng bàn phím duyệt qua các câu hỏi trong đề thi:
- Phím `Tab` di chuyển tuần tự qua 4 phương án $\rightarrow$ nút câu trước $\rightarrow$ nút đánh dấu $\rightarrow$ nút tiếp theo $\rightarrow$ bảng điều hướng số câu $\rightarrow$ nút nộp bài.
- Trình đọc màn hình đọc rõ nội dung câu hỏi, nhãn phương án, và trạng thái `selected / not selected`.

**Acceptance Scenarios**:

1. **Given** người dùng điều hướng bằng phím `Tab`, **When** tiêu điểm di chuyển vào vùng câu hỏi, **Then** thứ tự focus diễn ra logic, mạch lạc; mỗi phương án khi được focus đều có đường viền focus tương phản cao ($\ge 3:1$).
2. **Given** người dùng chọn một đáp án, **When** trạng thái câu hỏi thay đổi, **Then** thuộc tính `aria-pressed="true"` được cập nhật ngay trên nút đó để Screen Reader thông báo cho người dùng khiếm thị mà không gây đọc lại toàn bộ trang từ đầu.

---

### Edge Cases

- **EC-01: Nhấn chọn đáp án liên tục với tốc độ cao (Rapid-fire Selection)**: Người dùng hoặc bot test nhấn liên tục vào các phương án khác nhau trong khoảng thời gian $<50\text{ms}$. Cập nhật DOM vi mô phải đảm bảo tính đồng bộ (idempotent), không để sót trạng thái class `selected` cũ hoặc ghi đè sai dữ liệu `state.active.answers`.
- **EC-02: Hết thời gian làm bài trong lúc phần tử đang được focus**: Khi đồng hồ đếm ngược hết giờ đúng lúc người dùng đang focus vào nút đáp án, sự kiện hết giờ (`submit(true)`) phải diễn ra bình thường, chuyển sang trang kết quả (`#result/:id`) và đặt tiêu điểm an toàn tại phần tiêu đề kết quả (h1) thay vì bị kẹt tiêu điểm.
- **EC-03: Chuyển câu hỏi (Next / Previous / Jump) khi đang focus**: Khi chuyển sang câu hỏi khác, việc render nội dung câu hỏi mới phải chủ động chuyển tiêu điểm đến phần tử hợp lý (ví dụ: nút phương án đầu tiên hoặc vùng nội dung câu hỏi mới) để người dùng bàn phím không phải Tab lại từ đầu trang.
- **EC-04: Tải lại trang (Reload / Refresh F5)**: Khi người dùng reload trang khi đang làm bài dở, cấu trúc DOM phải được dựng lại đầy đủ từ `state.active` lưu trong `localStorage` mà không làm mất bất kỳ câu trả lời hay cờ đánh dấu nào trước đó.
- **EC-05: Chế độ "Học có giải thích" đã trả lời thì không được đổi đáp án**: Ở chế độ `learn`, khi đã chọn một đáp án, các nút lựa chọn bị vô hiệu hóa (`disabled`) và hiển thị giải thích. Cập nhật DOM vi mô phải bảo đảm khóa tương tác đúng quy định và giữ focus an toàn.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Targeted Quiz Option Update)**: Khi người dùng chọn một phương án trong màn hình làm bài (`session`), hệ thống CHỈ ĐƯỢC cập nhật các nút phương án trong câu hỏi hiện tại, vùng giải thích (`rationale` - nếu có) và nút số câu tương ứng trong lưới `qnav`. Tuyệt đối không xóa hay gán lại `app.innerHTML`.
- **FR-002 (Targeted Flag Toggle)**: Khi người dùng nhấn nút cắm cờ (`flag`), hệ thống CHỈ ĐƯỢC cập nhật nhãn/icon của nút cờ hiện tại và class `flagged` của ô số câu tương ứng trên lưới `qnav`.
- **FR-003 (Targeted Section Completion)**: Khi người dùng nhấn nút đánh dấu hoàn thành mục học trong trang giáo trình (`lesson`), hệ thống CHỈ ĐƯỢC cập nhật nút bấm đó và biểu tượng tích xanh tương ứng trên menu phụ `lesson-nav`.
- **FR-004 (Focus Retention)**: Hệ thống PHẢI duy trì tiêu điểm bàn phím (`document.activeElement`) trên phần tử vừa được tương tác sau mỗi lần cập nhật trạng thái (chọn đáp án, bật/tắt cờ, đánh dấu hoàn thành).
- **FR-005 (Focus Management on Question Change)**: Khi người dùng chuyển sang câu hỏi khác (qua nút Trước, Tiếp theo hoặc nhấp vào số câu trên `qnav`), hệ thống PHẢI di chuyển tiêu điểm bàn phím một cách có chủ đích đến vùng câu hỏi mới (ví dụ: nút phương án đầu tiên hoặc thẻ thân câu hỏi), tránh để tiêu điểm bị lạc.
- **FR-006 (Natural Scroll Preservation)**: Hệ thống PHẢI loại bỏ hoàn toàn việc lưu và khôi phục cuộn cưỡng bức `const y=scrollY; render(); scrollTo(0,y);` trong các thao tác tương tác nội bộ của câu hỏi và bài học. Vị trí cuộn của trình duyệt phải được giữ nguyên tự nhiên 100%.
- **FR-007 (Semantic & ARIA Consistency)**: Trạng thái lựa chọn và cờ đánh dấu PHẢI tiếp tục phản ánh chính xác qua các thuộc tính WAI-ARIA (`aria-pressed="true/false"`, `role="status"`, `aria-live`).
- **FR-008 (Core & Data Invariance)**: Toàn bộ logic lõi trong `core.js` (thuật toán sinh đề, seed `533`, ma trận 40 câu, tính điểm, cấu trúc backup) và dữ liệu học liệu trong `data.js` PHẢI giữ nguyên 100%, không bị sửa đổi.
- **FR-009 (Storage Invariance)**: Định dạng và cấu trúc dữ liệu lưu trong `localStorage` (khóa `netstudy-atmmt-v1`) PHẢI giữ nguyên vẹn, đảm bảo tính tương thích xuôi và ngược hoàn toàn với các bản sao lưu hiện có.

### Non-Functional Requirements

- **NFR-001 (Zero External Dependencies)**: Giải pháp kỹ thuật PHẢI được viết bằng Vanilla JavaScript thuần (ES2022+), không được thêm bất kỳ framework hay thư viện npm nào vào runtime trình duyệt (tuân thủ Constitution Principle I).
- **NFR-002 (Performance - 60 FPS Response)**: Thời gian phản hồi của DOM khi nhấp chọn đáp án PHẢI đạt dưới $16\text{ms}$ trên các thiết bị phổ thông (không gây giật khung hình, CPU spike $<5\%$).
- **NFR-003 (Zero Layout Shift)**: Điểm Cumulative Layout Shift (CLS) trong suốt quá trình người dùng chọn đáp án và đánh dấu cờ trong một câu hỏi PHẢI bằng $0$.
- **NFR-004 (Accessibility Compliance)**: Đường viền hiển thị trạng thái focus (`:focus-visible`) trên tất cả các nút bấm tương tác PHẢI đạt tỷ lệ tương phản tối thiểu $3:1$ so với nền theo chuẩn WCAG 2.2 AA.
- **NFR-005 (Backward Compatibility with Test Suite)**: Toàn bộ các bộ kiểm thử tự động `checks.cjs` và `checks-models.cjs` PHẢI chạy vượt qua (PASS 100%) mà không phải sửa đổi nội dung bài test hiện có.

---

## Areas at Risk of Regression (Chức năng có nguy cơ bị ảnh hưởng)

Khi chuyển từ cơ chế "render lại toàn bộ" (`render()`) sang "cập nhật từng phần" (targeted DOM updates), các chức năng sau đây có nguy cơ phát sinh lỗi hồi quy (regression) và cần được kiểm soát chặt chẽ:

| Chức năng có nguy cơ | Rủi ro tiềm ẩn | Biện pháp phòng ngừa bắt buộc |
|:---|:---|:---|
| **Đồng bộ lưới câu hỏi (`qnav`)** | Ô số câu trên lưới điều hướng không cập nhật đúng màu xanh (`answered`) hoặc gạch vàng (`flagged`) khi người dùng thay đổi lựa chọn. | Kiểm tra cập nhật đồng bộ cả nút phương án lẫn nút chỉ số câu tương ứng trong `qnav`. |
| **Đồng hồ đếm ngược (`timer`)** | Quá trình cập nhật DOM có thể vô tình hủy hoặc tạo trùng lặp `setInterval(updateTimer)` gây chạy sai nhịp thời gian thi. | Tách biệt hoàn toàn luồng đếm giờ của timer khỏi luồng cập nhật phương án trắc nghiệm. |
| **Logic khóa câu hỏi ở chế độ `learn`** | Ở chế độ học có giải thích, sau khi chọn đáp án thì 4 nút phải bị vô hiệu hóa (`disabled`) và hiển thị khung giải thích. Nếu cập nhật thiếu sót, người dùng có thể nhấp chọn lại được. | Đảm bảo logic khóa `disabled` và chèn khối `rationale` được thực thi chính xác như hàm `session()` hiện tại. |
| **Tự động nộp bài khi hết giờ (`submit(true)`)** | Nếu timer hết giờ trong khi người dùng đang tương tác, việc không gọi `render()` đầy đủ có thể làm chậm trễ việc chuyển hướng sang trang kết quả `#result/:id`. | Đảm bảo sự kiện hết hạn thời gian luôn kích hoạt chuyển route đầy đủ thông qua `go('result/'+a.id)`. |
| **Trang Sổ ôn tập (`review`) và Kết quả (`result`)** | Các nút "Lưu câu này" / "Bỏ đánh dấu" nếu cập nhật cục bộ không khéo có thể gây lệch trạng thái giữa mảng `state.marked` và giao diện. | Kiểm tra kỹ lưỡng hàm toggle bookmark ở cả 3 view: `session`, `result` và `review`. |

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (Zero Screen Flicker / CLS = 0)**: Không có hiện tượng giật màn hình hoặc chớp trắng khi chọn đáp án; điểm Cumulative Layout Shift đo được trong phiên làm bài bằng $0$.
- **SC-002 (100% Focus Retention)**: Tiêu điểm bàn phím giữ nguyên tại phần tử vừa tương tác trong $100\%$ các lần click hoặc nhấn phím chọn đáp án / cắm cờ.
- **SC-003 (Zero Scroll Jitter)**: Loại bỏ hoàn toàn mã `const y=scrollY; render(); scrollTo(0,y);` trong các thao tác chọn đáp án, cắm cờ và đánh dấu mục học; độ lệch vị trí cuộn tự nhiên bằng $0\text{px}$.
- **SC-004 (Full Keyboard Operability)**: Học viên có thể hoàn thành trọn vẹn 40 câu hỏi thi thử bằng bàn phím (Tab, Shift+Tab, Enter/Space) từ câu đầu tiên đến khi nộp bài mà không gặp bất kỳ điểm nghẽn focus nào (no keyboard trap).
- **SC-005 (100% Automated Regression Test Pass)**: Chạy `node checks.cjs` và `node checks-models.cjs` đạt kết quả PASS tuyệt đối, bảo toàn toàn bộ 100 kịch bản sinh đề, ma trận câu hỏi và tính toán mật mã.
- **SC-006 (Zero Dependency Growth)**: Không bổ sung bất kỳ file bundle hoặc thư viện npm nào vào thư mục `dist/`.

---

## Assumptions

- Trình duyệt mục tiêu của người dùng là các trình duyệt hiện đại (Chrome, Edge, Firefox, Safari) hỗ trợ đầy đủ các phương thức DOM chuẩn (`classList`, `querySelector`, `setAttribute`).
- Cấu trúc layout HTML và CSS hiện tại của NetStudy đủ tốt để áp dụng cập nhật class/attribute trực tiếp mà không cần viết lại CSS từ đầu.
- Trình kiểm thử Node.js VM trong `checks.cjs` (sử dụng đối tượng DOM giả lập `el()`) sẽ tiếp tục tương thích tốt với các cập nhật DOM mới mà không làm gãy test harness.

---

## Clarification Points (Điểm cần làm rõ trước giai đoạn Plan)

Hiện tại, đặc tả đã bao quát toàn diện các yêu cầu kỹ thuật. Tuy nhiên, có **2 điểm tinh chỉnh trải nghiệm (UX clarification)** cần lưu ý để xác nhận trước khi lập kế hoạch kiến trúc:

### Điểm làm rõ 1: Hành vi Tiêu điểm khi Chuyển Câu hỏi mới (Next / Prev / Jump)
- **Bối cảnh**: Khi người dùng đang ở câu 1 và bấm nút "Tiếp theo →" (hoặc bấm vào ô câu 2 trên bảng điều hướng `qnav`), câu hỏi 2 được hiển thị.
- **Lựa chọn A (Khuyến nghị)**: Đặt tiêu điểm tự động vào vùng nội dung câu hỏi mới (hoặc nút lựa chọn A của câu mới). Điều này giúp người dùng bàn phím có thể bấm ngay phím Tab hoặc phím tắt để chọn đáp án mà không phải di chuyển từ cuối trang lên.
- **Lựa chọn B**: Giữ nguyên tiêu điểm tại nút "Tiếp theo →" (để người dùng có thể bấm phím Space nhiều lần liên tiếp để duyệt nhanh qua các câu hỏi).
- *Đề xuất mặc định cho Spec*: Áp dụng **Lựa chọn B** khi dùng nút "Tiếp theo" (thuận tiện cho việc bấm lướt), và áp dụng **Lựa chọn A** khi nhấp chọn trực tiếp từ bảng lưới `qnav`.

### Điểm làm rõ 2: Phạm vi Phím tắt Bàn phím (Keyboard Shortcuts 1-4 / A-D)
- **Bối cảnh**: Người dùng yêu cầu tăng cường khả năng tiếp cận bàn phím.
- **Lựa chọn A (Khuyến nghị cho Phase này)**: Tập trung bảo toàn tiêu điểm chuẩn cho các phím tương tác gốc (`Tab`, `Shift+Tab`, `Space`, `Enter`). Bổ sung listener phím tắt 1-4 / A-D ở mức non-intrusive (chỉ kích hoạt trong màn hình quiz và tự ngắt khi focus vào input text).
- **Lựa chọn B**: Chỉ giải quyết triệt để vấn đề mất tiêu điểm (Focus retention) với phím chuẩn Tab/Space/Enter; dời các phím tắt nâng cao (1-4, Arrow keys) sang một feature chuyên biệt về Keyboard Shortcuts sau này.
- *Đề xuất mặc định cho Spec*: Triển khai theo **Lựa chọn A** với phạm vi hẹp và an toàn.
