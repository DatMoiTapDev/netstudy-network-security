# Feature Specification: NetStudy Learning Experience & Smart Review

**Feature Directory**: `specs/004-learning-experience-smart-review`
**Feature Branch**: `feat/004-learning-experience-smart-review`
**Created**: 2026-11-04
**Status**: Ready for Planning
**Input**: User description: "Khởi tạo Feature 004 — Learning Experience & Smart Review. Learning Dashboard, Smart Wrong-Answer Review, Adaptive Practice, Exam Analytics, Learning History, Data Integrity. Bảo toàn toàn bộ chức năng Feature 001–003, dữ liệu học tập 9 chương, 264 câu hỏi và hình thức thi thử 40 câu trong 75 phút."

---

## 1. Bối cảnh & Mục tiêu Sản phẩm (Context & Vision)

Trải qua 3 giai đoạn nền tảng:
- **Feature 001**: Kiến trúc DOM vi mô, phím tắt tiếp cận và cuộn tự nhiên.
- **Feature 002**: Hệ thống Design System 3 tầng, Theme Engine (Sáng/Tối/Tự động) và 17 vector SVG icons.
- **Feature 003**: Tối ưu hóa hiệu năng toàn diện, CSS Containment, Debounced Search, và bộ đệm 27 mô hình SVG đạt chuẩn Core Web Vitals (CLS = 0.00).

NetStudy hiện đã có một nền tảng kỹ thuật mượt mà và giao diện chuẩn mực. Tuy nhiên, về mặt **Trải nghiệm Học tập (Learning Experience - LX)**, người học vẫn còn gặp những hạn chế:
1. Thiếu một **Bảng điều khiển Tổng quan (Dashboard)** trực quan thể hiện bức tranh toàn cảnh: đã học được bao nhiêu % lý thuyết, đã làm bao nhiêu trong số 264 câu hỏi, chương nào là "vùng trũng" kiến thức cần tập trung.
2. Sổ ôn tập (`#review`) hiện tại mới chỉ lọc câu sai dựa trên lượt làm gần nhất một cách thô sơ; chưa có cơ chế theo dõi chuỗi đúng/sai (streak), chưa ghi nhận mức độ thành thạo (mastery) hay vinh danh khi câu sai đã được khắc phục hoàn toàn.
3. Chế độ luyện tập (`#practice`) còn phụ thuộc vào việc người học tự chọn bài thủ công, thiếu các **chế độ luyện tập thích ứng (Adaptive Practice)** dựa trên dữ liệu học tập thực tế (như luyện câu chưa làm bao giờ, luyện các câu hay sai nhất, luyện tập trung vào chương yếu).
4. Phân tích bài thi thử (`#exam`) chỉ dừng lại ở kết quả từng bài đơn lẻ, chưa có biểu đồ xu hướng điểm số (Score Trend) và phân tích năng lực tích lũy qua thời gian.

**Feature 004** tập trung nâng tầm trải nghiệm học tập thông minh, cá nhân hóa dựa trên dữ liệu thực tế lưu trữ cục bộ (Local-First), không cần máy chủ hay tài khoản, và tuyệt đối bảo toàn hình thức thi chuẩn 40 câu / 75 phút.

---

## 2. Clarifications (Các Quyết định Đã Phê duyệt)

### Session 2026-11-04

- **Q: Tiêu chuẩn công nhận một câu sai đã "Thành thạo / Khắc phục hoàn toàn" (CL-01)?**  
  → **A**: Chọn **Phương án A**. Một câu từng sai chỉ đạt trạng thái `mastered` sau khi được trả lời đúng **2 lần liên tiếp trong 2 phiên luyện tập riêng biệt** (`consecutiveCorrect >= 2`). Bất kỳ lần trả lời sai nào đều lập tức **reset chuỗi về 0** (`consecutiveCorrect = 0`). Kết quả làm đúng trong bài thi thử **không** tự động chuyển câu sang `mastered` (tránh hiện tượng đoán mò ngẫu nhiên trong phòng thi làm sai lệch quá trình ôn tập).
- **Q: Chiến lược nâng cấp Schema Versioning trong `localStorage` (CL-02)?**  
  → **A**: Chọn **Phương án A**. Nâng cấp schema lưu trữ lên `version: 2` (vẫn sử dụng khóa `netstudy-atmmt-v1`). Hàm migration phải bảo đảm tính **idempotent**, có **validation** cấu trúc, xử lý an toàn dữ liệu thiếu và **tuyệt đối không làm mất dữ liệu v1**. Không suy diễn dữ liệu lịch sử không thể xác minh. Cung cấp chức năng export JSON chuẩn v2, import tự động chuyển đổi từ v1 sang v2 và kiểm thử rollback an toàn.
- **Q: Quy định lưu trữ lịch sử và xử lý hạn mức bộ nhớ `localStorage` (CL-03)?**  
  → **A**: Chọn **Phương án A có điều chỉnh**. Lưu trữ tối đa **100 phiên chi tiết gần nhất** trong `state.history`. Duy trì bảng thống kê tổng hợp tích lũy (`questionStats`, `examStats`) lâu dài khi còn đủ dung lượng. Khi phát hiện dung lượng đạt ngưỡng cảnh báo hoặc gặp `QuotaExceededError`, hệ thống PHẢI chủ động nhắc học viên xuất file sao lưu JSON trước khi cắt giảm lịch sử chi tiết; **tuyệt đối không được âm thầm xóa dữ liệu** của người học.
- **Q: Chuẩn hóa thuật ngữ Luyện tập Thích ứng (Adaptive Practice)?**  
  → **A**: Phân biệt rõ rệt **Adaptive Practice** (lấy mẫu câu hỏi thích ứng dựa trên dữ liệu học tập) với **Spaced Repetition** (lịch ôn lặp lại ngắt quãng theo thời gian thực). Do NetStudy là ứng dụng tĩnh không thiết lập lịch hẹn giờ thực tế, hệ thống chuẩn hóa sử dụng duy nhất thuật ngữ **Adaptive Practice**, loại bỏ thuật ngữ Spaced Repetition để tránh hiểu lầm.
- **Q: Chiến lược bù đắp (Fallback) khi các nhóm câu trong Luyện hỗn hợp không đủ tỷ lệ 50/30/20?**  
  → **A**: Trong chế độ Luyện hỗn hợp thích ứng (mục tiêu 50% câu sai + 30% câu chưa làm + 20% câu ngẫu nhiên), nếu nhóm câu sai hoặc nhóm câu chưa làm không đủ số lượng, hệ thống tự động bù đắp theo thứ tự ưu tiên xác định: (1) Lấy thêm câu chưa làm $\rightarrow$ (2) Lấy thêm câu sai $\rightarrow$ (3) Lấy ngẫu nhiên các câu còn lại trong ngân hàng câu hỏi để luôn đảm bảo đủ tổng số lượng câu yêu cầu (10 hoặc 20 câu).
- **Q: Xác thực dữ liệu phân loại mức độ Nhận biết / Thông hiểu / Vận dụng?**  
  → **A**: Đã xác minh thực nghiệm $100\%$ các câu hỏi trong `dist/data.js` đều có sẵn trường metadata `level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng'`. Toàn bộ biểu đồ và thống kê phân bổ mức độ được trích xuất trực tiếp từ metadata có sẵn này, tuyệt đối không tự suy đoán.
- **Q: Ràng buộc bảo toàn cấu hình thi thử và tính năng Feature 001–003?**  
  → **A**: Tuyệt đối giữ nguyên $100\%$ bài thi thử 40 câu / 75 phút, hạt giống `seeded(533)`, ma trận quota 9 chương (4, 3, 3, 6, 5, 5, 6, 5, 3), công thức tính điểm thang 10, cùng toàn bộ thành quả của Feature 001 (Micro-DOM, accessibility), Feature 002 (Design Tokens, Theme Engine, SVG icons) và Feature 003 (CSS Containment, Debounce, Precomputed SVG Cache).

---

## 3. User Scenarios & Testing *(mandatory)*

### User Story 1 — Bảng Điều khiển Tiến độ Toàn diện (Priority: P1) 🎯 MVP

Là một học viên ôn thi An toàn mạng máy tính, tôi muốn xem một bảng điều khiển tổng hợp thể hiện tiến độ học lý thuyết, tỷ lệ trả lời đúng và các chương còn yếu, để tôi biết chính xác mình đang ở đâu và cần học gì tiếp theo.

**Why this priority**: Đây là màn hình trung tâm định hướng học tập cho học viên ngay khi mở ứng dụng, tạo động lực và giúp phân bổ thời gian ôn thi khoa học.

**Independent Test**: Truy cập trang Tổng quan (`#home` hoặc `#dashboard`):
1. Hiển thị tổng số câu đã làm trên tổng 264 câu, tỷ lệ % câu hỏi đã chạm tới.
2. Hiển thị tỷ lệ trả lời đúng trung bình (Accuracy Rate).
3. Hiển thị thanh tiến độ hoàn thành cho từng chương trong 9 chương học.
4. Tự động gắn nhãn cảnh báo (Warning Badge) đối với các chương có tỷ lệ đúng dưới $70\%$.

**Acceptance Scenarios**:
1. **Given** học viên mới chưa làm bài nào, **When** vào Dashboard, **Then** hiển thị trạng thái bắt đầu học tập: 0/264 câu đã làm, 0/95 mục lý thuyết, và gợi ý bắt đầu từ Bài 1.
2. **Given** học viên đã hoàn thành 3 bài thi và 5 lượt luyện tập, **When** xem Dashboard, **Then** số liệu được tính toán chính xác $100\%$ từ `localStorage`: số câu đã thử sức, tỷ lệ đúng toàn cục, số câu chưa từng làm, và danh sách các chương yếu cần ưu tiên ôn.

---

### User Story 2 — Sổ Ôn tập Thông minh & Theo dõi Chuỗi Thành thạo (Priority: P1)

Là một học viên muốn lấp lỗ hổng kiến thức, tôi muốn xem lại danh sách tất cả các câu đã từng làm sai, xem lời giải thích chi tiết, và luyện lại chúng trong các phiên luyện tập riêng biệt cho đến khi làm đúng 2 lần liên tiếp để được công nhận đã khắc phục hoàn toàn.

**Why this priority**: Cốt lõi của việc ôn thi hiệu quả là sửa chữa sai lầm. Chuyển đổi từ "sai $\rightarrow$ hiểu $\rightarrow$ làm lại đúng 2 lần liên tiếp $\rightarrow$ thành thạo" là tính năng giáo dục giá trị nhất của NetStudy.

**Independent Test**: Mở Sổ ôn tập (`#review`):
1. Danh sách câu hỏi được phân loại theo mức độ:
   - "Cần ôn tập" (`needs_practice`): Câu vừa làm sai hoặc chuỗi đúng $< 1$.
   - "Đang củng cố" (`in_review`): Câu từng sai đã làm đúng lại 1 lần trong phiên luyện tập (`consecutiveCorrect = 1`).
   - "Đã khắc phục" (`mastered`): Câu đã làm đúng liên tiếp $\ge 2$ lần trong 2 phiên luyện tập riêng biệt (`consecutiveCorrect >= 2`).
2. Mỗi câu hiển thị đầy đủ: đề bài, phương án đã chọn trong quá khứ, đáp án đúng, lời giải thích từng phương án A/B/C/D và nguồn slide gốc.
3. Bấm "Luyện lại câu sai": khởi tạo phiên luyện tập; làm đúng tăng chuỗi đúng, làm sai lập tức reset chuỗi về 0; làm đúng trong bài thi thử không tự động chuyển câu sang `mastered`.

**Acceptance Scenarios**:
1. **Given** học viên làm sai câu `q-3-12` trong bài thi thử hoặc bài luyện tập, **When** mở Sổ ôn tập, **Then** câu `q-3-12` xuất hiện ở mục "Cần ôn tập" với chuỗi đúng $= 0$.
2. **Given** học viên bấm luyện lại câu `q-3-12` trong một phiên luyện tập và chọn đúng đáp án, **When** xem lại Sổ ôn tập, **Then** câu này chuyển sang trạng thái "Đang củng cố" (chuỗi đúng $= 1$).
3. **Given** học viên tiếp tục làm đúng câu `q-3-12` trong một phiên luyện tập riêng biệt tiếp theo, **When** nộp bài, **Then** câu này đạt chuỗi đúng $= 2$ và chuyển sang danh mục "Đã khắc phục" (`mastered`).
4. **Given** một câu đang ở trạng thái `in_review` (chuỗi đúng $= 1$) nhưng học viên trả lời sai ở lần làm tiếp theo, **When** cập nhật, **Then** chuỗi đúng lập tức reset về 0 và câu quay lại danh mục "Cần ôn tập" (`needs_practice`).

---

### User Story 3 — Các Chế độ Luyện tập Thích ứng (Priority: P2)

Là một học viên có thời gian biểu bận rộn, tôi muốn hệ thống đề xuất các bộ câu hỏi thông minh theo cơ chế Adaptive Practice (câu chưa làm, câu hay sai nhất, hoặc tập trung vào chương yếu nhất) mà không cần tôi phải tự lọc tìm thủ công.

**Why this priority**: Giảm tải nhận thức trong việc lựa chọn học liệu, tối đa hóa hiệu quả trên từng phút học tập của sinh viên.

**Independent Test**: Mở trang Luyện tập (`#practice`):
1. Cung cấp các chế độ Adaptive Practice:
   - "Luyện câu chưa làm bao giờ" (Unpracticed Focus).
   - "Luyện câu hay sai nhất" (High-Error Focus).
   - "Củng cố chương yếu nhất" (Weak Chapter Focus).
   - "Luyện hỗn hợp thích ứng" (Adaptive Mixed: phân bổ mục tiêu 50% câu sai + 30% câu chưa làm + 20% câu ngẫu nhiên).
2. Khi nhóm câu sai hoặc chưa làm không đủ số lượng để đạt tỷ lệ 50/30/20, hệ thống tự động bù đắp theo thứ tự ưu tiên xác định: lấy thêm câu chưa làm $\rightarrow$ lấy thêm câu sai $\rightarrow$ lấy câu ngẫu nhiên.
3. Cho phép học viên chọn số lượng câu linh hoạt (10 câu, 20 câu hoặc toàn bộ câu phù hợp).

**Acceptance Scenarios**:
1. **Given** học viên chọn "Luyện câu chưa làm (10 câu)", **When** bắt đầu, **Then** 10 câu hỏi được chọn ngẫu nhiên từ tập hợp các câu mà học viên chưa từng trả lời trong bất kỳ phiên nào trước đây.
2. **Given** học viên chọn "Luyện hỗn hợp thích ứng (20 câu)" nhưng chỉ có 4 câu sai trong lịch sử, **When** khởi tạo đề, **Then** hệ thống lấy 4 câu sai, bù thêm 10 câu chưa làm và 6 câu ngẫu nhiên khác để đủ chính xác 20 câu.
3. **Given** học viên đã làm hết toàn bộ 264 câu trong ngân hàng, **When** chọn chế độ "Luyện câu chưa làm", **Then** hệ thống thông báo chúc mừng đã hoàn thành 100% ngân hàng câu hỏi và gợi ý chuyển sang "Luyện câu hay sai nhất".

---

### User Story 4 — Phân tích Điểm thi Thử & Xu hướng Tiến bộ (Priority: P2)

Là một học viên chuẩn bị thi kết thúc học phần, tôi muốn xem lại biểu đồ điểm thi qua các lần làm bài, thời gian làm bài trung bình, tỷ lệ điểm theo các mức độ nhận thức thực tế (Nhận biết, Thông hiểu, Vận dụng) và độ sẵn sàng thi, để tôi tự tin bước vào kỳ thi chính thức.

**Why this priority**: Cung cấp phản hồi định lượng (Quantitative Feedback) giúp học viên đánh giá khách quan năng lực bản thân so với ngưỡng đạt điểm cao.

**Independent Test**: Mở trang Thi thử (`#exam` hoặc `#analytics`):
1. Hiển thị bảng tổng kết các lần thi thử 40 câu / 75 phút đã nộp.
2. Hiển thị biểu đồ đường SVG trực quan (Score Progression Chart) thể hiện điểm số qua các lần thi.
3. Thống kê thời gian làm bài trung bình (ví dụ: trung bình 48 phút / bài 75 phút).
4. Thống kê tỷ lệ điểm theo đúng metadata thực tế: Nhận biết, Thông hiểu, Vận dụng (lấy từ trường `q.level` có sẵn).

**Acceptance Scenarios**:
1. **Given** học viên đã làm 5 bài thi thử với các điểm số 5.5, 6.25, 7.0, 7.75, 8.5, **When** xem mục Phân tích thi thử, **Then** biểu đồ đường thể hiện xu hướng đi lên rõ rệt, điểm trung bình là 7.0, và hiển thị huy hiệu "Đã sẵn sàng thi".
2. **Given** học viên có bài thi bị nộp tự động khi hết giờ (`auto = true`), **When** xem chi tiết, **Then** hiển thị chỉ dấu nhận biết rõ ràng để học viên cải thiện tốc độ làm bài.

---

### User Story 5 — Nhật ký Hoạt động Học tập & Bộ lọc Lịch sử (Priority: P3)

Là một học viên muốn quản lý lịch sử học tập, tôi muốn lọc và tìm kiếm lại các bài luyện tập hoặc bài thi theo ngày, theo loại hoạt động hoặc theo kết quả đạt/chưa đạt.

**Why this priority**: Hỗ trợ việc tự đánh giá hồi cứu và quản lý lịch sử học tập cá nhân ngăn nắp.

**Independent Test**: Mở trang Lịch sử (`#history`):
1. Cung cấp bộ lọc:
   - Loại hoạt động: Tất cả, Thi thử (`exam`), Luyện có giải thích (`learn`), Tự kiểm tra (`test`).
   - Thời gian: Tất cả, 7 ngày qua, 30 ngày qua.
   - Kết quả: Tất cả, Đạt ($\ge 7.0$), Cần cải thiện ($< 7.0$).
2. Bấm vào bất kỳ lượt làm bài nào: mở trang chi tiết (`#result/:id`) với đầy đủ phân tích từng câu hỏi và lời giải.

**Acceptance Scenarios**:
1. **Given** học viên có 20 lượt làm bài trong lịch sử, **When** chọn lọc "Thi thử" trong "7 ngày qua", **Then** danh sách lập tức lọc đúng các bài thỏa mãn mà không cần tải lại trang.

---

## 4. Edge Cases & Boundary Conditions

- **EC-01: Học viên hoàn toàn mới (Zero-State)**: Khi mở ứng dụng lần đầu, `history = []`, `completed = []`. Dashboard và Analytics phải hiển thị giao diện hướng dẫn thân thiện, không báo lỗi `NaN`, không vẽ biểu đồ gãy, và có lời mời bắt đầu bài học đầu tiên.
- **EC-02: Học viên đã làm hết toàn bộ 264 câu hỏi**: Khi không còn câu nào chưa làm, chế độ "Luyện câu chưa làm" phải xử lý êm ái, hiển thị thông báo chúc mừng hoàn thành $100\%$ ngân hàng câu hỏi và chuyển hướng sang luyện câu hay sai.
- **EC-03: Dữ liệu sao lưu từ phiên bản cũ (v1) và Idempotent Migration**: Người dùng nhập tệp JSON sao lưu được xuất từ Feature 001/002/003 (chỉ có schema v1: `completed`, `marked`, `history`, `seen`). Hàm `StudyCore.migrate()` phải tự động chuyển đổi sang v2 một cách idempotent: tổng hợp lại `questionStats` từ `history` hiện có, không làm mất bất kỳ dữ liệu nào, và không suy diễn dữ liệu không thể xác minh.
- **EC-04: Xử lý QuotaExceededError & Giới hạn 100 Phiên**:
  - `state.history` lưu tối đa 100 phiên chi tiết gần nhất; số liệu thống kê tổng hợp tích lũy (`questionStats`) được lưu giữ vĩnh viễn.
  - Khi phát hiện bộ nhớ gần đầy hoặc gặp `QuotaExceededError`, hệ thống PHẢI hiển thị hộp thoại cảnh báo và cung cấp nút **"Xuất sao lưu JSON ngay"** trước khi cắt giảm các phiên cũ. **Tuyệt đối không âm thầm xóa dữ liệu** của người dùng mà không thông báo.
- **EC-05: Thiếu câu trong chế độ Adaptive Mixed**: Khi số câu sai hoặc chưa làm không đủ cho tỷ lệ 50/30/20, hệ thống tự động bù đắp theo thứ tự: thêm câu chưa làm $\rightarrow$ thêm câu sai $\rightarrow$ thêm câu ngẫu nhiên trong ngân hàng 264 câu để bảo đảm luôn đủ 10 hoặc 20 câu.
- **EC-06: Thoát ngang khi đang làm bài thích ứng**: Nếu học viên đóng trình duyệt khi đang làm bài luyện tập thích ứng, trạng thái `active` vẫn được lưu cục bộ. Khi mở lại, học viên có thể tiếp tục làm hoặc hủy phiên mà không làm hỏng dữ liệu thống kê.

---

## 5. Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Learning Dashboard & Progress Metrics)**:
  Hệ thống PHẢI hiển thị bảng điều khiển tiến độ tổng hợp bao gồm:
  - Tỷ lệ % hoàn thành mục lý thuyết (trên tổng 95 mục của 9 chương).
  - Số lượng câu hỏi đã từng trả lời ít nhất một lần (trên tổng 264 câu).
  - Tỷ lệ trả lời đúng tích lũy (Cumulative Accuracy Rate).
  - Thống kê tiến độ chi tiết theo từng chương (số mục đã học, số câu đã luyện, tỷ lệ đúng của chương).
  - Nhận diện và đánh dấu nổi bật các chương có kết quả $< 70\%$ để học viên ưu tiên ôn tập.

- **FR-002 (Question Mastery Tracking & Status Lifecycle)**:
  Hệ thống PHẢI duy trì trạng thái thành thạo cho từng câu hỏi theo các quy tắc đã phê duyệt:
  - `needs_practice` (Cần ôn): Câu trả lời sai gần nhất hoặc chuỗi đúng liên tiếp $= 0$.
  - `in_review` (Đang củng cố): Câu từng sai đã được làm lại đúng 1 lần trong phiên luyện tập (`consecutiveCorrect = 1`).
  - `mastered` (Đã thành thạo / Đã khắc phục): Câu từng sai đã được trả lời đúng **2 lần liên tiếp trong 2 phiên luyện tập riêng biệt** (`consecutiveCorrect >= 2`).
  - Bất kỳ lần trả lời sai nào đều lập tức **reset chuỗi về 0** (`consecutiveCorrect = 0`).
  - Làm đúng trong bài thi thử 40 câu **không** tự động chuyển câu sang `mastered`.

- **FR-003 (Smart Wrong-Answer Review Interface)**:
  Trang Sổ ôn tập (`#review`) PHẢI:
  - Cho phép xem toàn bộ danh sách câu hỏi theo các tab: "Cần ôn tập" (`needs_practice`), "Đang củng cố" (`in_review`), "Đã khắc phục" (`mastered`), và "Câu đánh dấu" (`marked`).
  - Hiển thị đầy đủ nội dung câu hỏi, đáp án đúng, lời giải thích của từng phương án (A/B/C/D), nguồn slide tài liệu và liên kết mở nhanh mục lý thuyết liên quan.
  - Cung cấp nút thao tác: "Luyện lại câu sai ngay", "Luyện câu đánh dấu", hoặc luyện từng câu đơn lẻ.

- **FR-004 (Adaptive Practice Engine - Rule-Based & Offline)**:
  Hệ thống PHẢI cung cấp 4 chế độ luyện tập thích ứng nội bộ thuần khiết (không phụ thuộc mạng, không dùng AI API):
  1. *Luyện câu chưa làm*: Ưu tiên các câu hỏi chưa có trong bất kỳ phiên nào của `state.history`.
  2. *Luyện câu hay sai nhất*: Sắp xếp theo số lần làm sai giảm dần (`wrongCount`).
  3. *Luyện củng cố chương yếu*: Lọc các câu thuộc chương có tỷ lệ đúng $< 70\%$.
  4. *Luyện hỗn hợp thích ứng (Adaptive Mixed)*: Mục tiêu phân bổ 50% câu sai + 30% câu chưa làm + 20% câu ngẫu nhiên. Nếu thiếu câu ở bất kỳ nhóm nào, tự động bù đắp theo thứ tự ưu tiên: thêm câu chưa làm $\rightarrow$ thêm câu sai $\rightarrow$ thêm câu ngẫu nhiên để đủ số lượng câu yêu cầu (10 hoặc 20 câu).

- **FR-005 (Exam Analytics & Verified Cognitive Level Metrics)**:
  Hệ thống PHẢI cung cấp trang Phân tích Thi thử:
  - Danh sách toàn bộ các bài thi thử 40 câu / 75 phút đã hoàn thành.
  - Biểu đồ đường (Line Chart) biểu diễn xu hướng điểm số theo thời gian được dựng bằng SVG / CSS thuần túy, có nhãn điểm và thời gian làm bài, tương thích Dark/Light theme.
  - Bảng thống kê phân bổ điểm số theo đúng 3 mức độ nhận thức có sẵn trong metadata câu hỏi: **Nhận biết**, **Thông hiểu**, **Vận dụng** (từ trường `q.level` trong `data.js`). Tuyệt đối không tự suy đoán mức độ.
  - Thời gian hoàn thành trung bình và tỷ lệ bài thi hoàn thành trước hạn.

- **FR-006 (History Multi-Criteria Filtering & Search)**:
  Trang Lịch sử (`#history`) PHẢI cho phép lọc danh sách bài làm theo:
  - Loại phiên: Tất cả, Thi thử (`exam`), Luyện có giải thích (`learn`), Tự kiểm tra (`test`).
  - Khoảng thời gian: Tất cả, 7 ngày gần nhất, 30 ngày gần nhất.
  - Kết quả: Tất cả, Đạt ($\ge 7.0$), Chưa đạt ($< 7.0$).
  - Bấm vào một bài bất kỳ để xem lại toàn bộ câu trả lời, phương án đã chọn và giải thích chi tiết.

- **FR-007 (Idempotent Schema Migration v2 & Quota Protection)**:
  Hệ thống PHẢI:
  - Nâng cấp schema lưu trữ lên `version: 2` với hàm `StudyCore.migrate(data)` idempotent.
  - Tự động nạp và chuyển đổi an toàn các bản sao lưu JSON phiên bản cũ (v1) mà không làm mất dữ liệu `completed`, `marked`, `history`, hay `seen`.
  - Quản lý hạn mức `localStorage`: lưu tối đa 100 phiên chi tiết gần nhất trong `history`; lưu giữ vĩnh viễn bảng thống kê tổng hợp `questionStats`.
  - Xử lý ngoại lệ `QuotaExceededError`: cảnh báo và hướng dẫn xuất JSON sao lưu trước khi dọn dẹp các phiên chi tiết cũ; tuyệt đối không âm thầm xóa dữ liệu.
  - Không thu thập hay gửi bất kỳ dữ liệu nào ra bên ngoài.

- **FR-008 (Preservation of 40-Question / 75-Minute Exam Engine)**:
  Hệ thống PHẢI bảo toàn nguyên vẹn 100%:
  - Thuật toán sinh đề `StudyCore.makeExam` trong `dist/core.js`.
  - Hạt giống giả ngẫu nhiên `seeded(533)`.
  - Ma trận quota 9 chương (4, 3, 3, 6, 5, 5, 6, 5, 3) và ma trận mức độ (12 NB, 20 TH, 8 VD).
  - Đồng hồ đếm ngược 75 phút, cơ chế tự động nộp bài khi hết giờ và công thức tính điểm thang 10.

- **FR-009 (Design System & Accessibility Invariance)**:
  Giao diện Dashboard, biểu đồ và các bảng thống kê mới PHẢI:
  - Tuân thủ hệ thống Design Tokens 3 tầng và Theme Engine của Feature 002.
  - Biểu đồ SVG và thanh tiến độ phải có độ tương phản $\ge 4.5:1$, hỗ trợ cả Light Mode và Dark Mode.
  - Mọi nút bấm, bộ lọc và thẻ tương tác phải có `:focus-visible` rõ ràng và hỗ trợ đầy đủ bàn phím.
  - Co giãn mượt mà từ màn hình di động $320\text{px}$ đến màn hình máy tính để bàn $1440\text{px}+$.

- **FR-010 (Performance SLAs & Core Web Vitals Invariance)**:
  Toàn bộ giao diện Dashboard và tính toán thống kê PHẢI:
  - Duy trì Cumulative Layout Shift: $\text{CLS} = 0.00$.
  - Thời gian tính toán thống kê và render Dashboard: $\le 10\text{ms}$ trên tập dữ liệu 100 bài thi.
  - Không làm tăng dung lượng phân phối quá $15\text{ KB}$ uncompressed.
  - Tiếp tục vượt qua 100% các bài kiểm thử `node checks.cjs`, `node checks-models.cjs`, và `node checks-perf.cjs`.

---

### Non-Functional Requirements

- **NFR-001 (Pure Vanilla & Zero Dependency)**: Tuân thủ Nguyên tắc I & VII của Hiến pháp: 0 runtime framework (không React, Vue, Chart.js, Lodash), 0 thư viện npm runtime trong `dist/`.
- **NFR-002 (Privacy & Offline Autonomy)**: Tuân thủ Nguyên tắc IV: 100% dữ liệu lưu tại client `localStorage`. Hoạt động trơn tru cả khi không có mạng Internet hoặc mở trực tiếp bằng giao thức `file:///`.
- **NFR-003 (Deterministic Logic)**: Các thuật toán gợi ý luyện tập thích ứng phải là luật xác định (Rule-Based), minh bạch, có thể giải thích được lý do gợi ý cho người học.
- **NFR-004 (WCAG 2.2 AA Compliance)**: Đạt chuẩn tương phản màu sắc, hỗ trợ người dùng chỉ sử dụng bàn phím hoặc công nghệ trợ năng.
- **NFR-005 (Mandatory Automated Test Gate)**: Mọi thay đổi phải đi kèm bộ test xác minh tính toàn vẹn dữ liệu và không gây lỗi hồi quy với exit code 0.

---

## 6. Key Entities & Data Model (Schema v2)

### `NetStudyStateV2` (Cấu trúc State Chính thức v2)
```typescript
interface NetStudyStateV2 {
  version: 2;                              // Nâng cấp chính thức lên version 2
  completed: string[];                     // Danh sách mục đã học ("1:1.1", "3:3.2", ...)
  marked: string[];                        // Danh sách mã câu hỏi đánh dấu
  history: SessionRecord[];                // Tối đa 100 phiên chi tiết gần nhất
  seen: string[];                          // Các câu hỏi đã từng xuất hiện trong đề thi ngẫu nhiên
  questionStats: Record<string, QuestionPerformanceRecord>; // Bảng thống kê tích lũy từng câu
  active: ActiveSession | null;            // Phiên đang làm dở
}
```

### `QuestionPerformanceRecord`
Lưu trữ thông tin thống kê tích lũy của từng câu hỏi:
- `questionId`: Mã câu hỏi duy nhất (ví dụ: `'q-1-1'`).
- `chapter`: Bài học (`'1'`, `'2a'`, `'2b'`, ..., `'8'`).
- `level`: Mức độ nhận thức (`'Nhận biết' | 'Thông hiểu' | 'Vận dụng'`).
- `attempts`: Tổng số lần người học đã trả lời câu này qua mọi phiên.
- `correctCount`: Số lần trả lời đúng.
- `wrongCount`: Số lần trả lời sai.
- `consecutiveCorrect`: Chuỗi số lần trả lời đúng liên tiếp trong các phiên luyện tập riêng biệt (reset về 0 khi sai).
- `lastAnswered`: Thời điểm trả lời gần nhất (timestamp).
- `masteryStatus`: `'needs_practice' | 'in_review' | 'mastered'`.

### `ChapterProgressSummary`
Thống kê tổng hợp theo từng chương:
- `chapterId`: Mã chương (`'1'` đến `'8'`).
- `totalSections`: Tổng số mục lý thuyết trong chương (ví dụ Bài 3 có 15 mục).
- `completedSections`: Số mục người học đã đánh dấu hoàn thành.
- `totalQuestions`: Tổng số câu hỏi trắc nghiệm của chương.
- `practicedQuestions`: Số câu hỏi đã từng làm ít nhất một lần.
- `correctRate`: Tỷ lệ trả lời đúng trung bình của chương (%).
- `isWeak`: Cờ đánh dấu chương yếu (nếu `correctRate < 70%` và `practicedQuestions >= 5`).

### `ExamTrendPoint`
Điểm dữ liệu biểu diễn xu hướng thi thử:
- `sessionId`: Mã phiên thi.
- `timestamp`: Thời điểm hoàn thành bài thi.
- `score`: Điểm số đạt được (0.00 – 10.00).
- `elapsedMinutes`: Thời gian hoàn thành tính bằng phút.
- `accuracyRate`: Tỷ lệ đúng (%).
- `levelBreakdown`: `{ recognize: number, understand: number, apply: number }`.
- `wasAutoSubmitted`: Cờ tự động nộp do hết giờ (`true / false`).

---

## 7. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (100% Real-Data Fidelity)**: $100\%$ các chỉ số trên Dashboard, Sổ ôn tập và Phân tích thi thử được tính toán từ dữ liệu học tập thực tế đã lưu; $0\%$ số liệu giả định hay phỏng đoán.
- **SC-002 (Strict 2-Streak Mastery Conversion)**: Người học chỉ chuyển câu sang `mastered` khi trả lời đúng **2 lần liên tiếp trong 2 phiên luyện tập riêng biệt**; làm sai reset về 0; không có hiện tượng chuyển trạng thái ảo từ thi thử.
- **SC-003 (Sub-10ms Analytics Computation)**: Thuật toán tổng hợp thống kê và dựng biểu đồ SVG hoàn tất trong vòng dưới $10\text{ms}$ ngay cả khi lịch sử có 100 phiên làm bài.
- **SC-004 (Zero Data Loss on Migration)**: $100\%$ người dùng có dữ liệu Version 1 nâng cấp lên phiên bản mới mà không mất bất kỳ mục đã học (`completed`), câu đánh dấu (`marked`), hay lịch sử thi (`history`).
- **SC-005 (100% Core Engine & Test Invariance)**: Toàn bộ bài kiểm thử `checks.cjs`, `checks-models.cjs`, và `checks-perf.cjs` tiếp tục PASS 100% với mã thoát 0.

---

## 8. Assumptions

- Người dùng sử dụng các trình duyệt hiện đại hỗ trợ SVG inline, CSS Grid/Flexbox và `localStorage` tiêu chuẩn (dung lượng tối thiểu 5MB).
- Dữ liệu 264 câu hỏi và 95 mục trong `data.js` là nguồn chân lý cố định của chương trình đào tạo.
- Biểu đồ xu hướng được vẽ bằng SVG inline thuần túy, không cần thư viện đồ thị bên ngoài nhằm bảo toàn tính siêu nhẹ và chuẩn WCAG 2.2 AA.
- Không áp dụng thuật toán lặp lại ngắt quãng (Spaced Repetition) vì không thiết lập lịch nhắc nhở/thời gian thực; chỉ áp dụng cơ chế lấy mẫu thích ứng (Adaptive Practice).
