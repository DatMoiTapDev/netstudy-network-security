# Technical Research & Architecture Decisions: Feature 004 — Learning Experience & Smart Review

**Feature**: `specs/004-learning-experience-smart-review`  
**Date**: 2026-11-04  
**Status**: Completed  

---

## 1. Bối cảnh Nghiên cứu Kỹ thuật

Tài liệu này ghi nhận các quyết định kiến trúc, thuật toán và giải pháp kỹ thuật cho **Feature 004 — Learning Experience & Smart Review**, tuân thủ nghiêm ngặt 10 nguyên tắc của Hiến pháp dự án (Project Constitution v1.0.0):
- **Nguyên tắc I & VII**: 0 runtime framework, 0 runtime npm dependency. Toàn bộ tính toán diễn ra bằng Vanilla JavaScript ES2022+ thuần.
- **Nguyên tắc II & III**: Bảo toàn $100\%$ ngân hàng 264 câu hỏi, 95 mục lý thuyết, 27 mô hình SVG, thuật toán sinh đề `StudyCore.makeExam`, seed `533`, và bài thi thử 40 câu / 75 phút.
- **Nguyên tắc IV**: Local-First & Quyền riêng tư tuyệt đối. Dữ liệu lưu trong `localStorage['netstudy-atmmt-v1']`, không gửi telemetry ra bên ngoài.
- **Nguyên tắc V & VI**: UI/UX Pro Max & WCAG 2.2 AA. Biểu đồ đường SVG trực quan, độ tương phản $\ge 4.5:1$, hỗ trợ Light/Dark mode và bàn phím đầy đủ.
- **Nguyên tắc VIII**: Kiểm thử tự động bắt buộc với `node checks.cjs` và `node checks-perf.cjs`.

---

## 2. Các Quyết định Kỹ thuật Cốt lõi (Decisions & Trade-offs)

### Quyết định 1: Kiến trúc Lưu trữ & Idempotent Schema Migration (v1 $\rightarrow$ v2)

#### Vấn đề:
- Cấu trúc `localStorage` hiện tại (v1) chỉ có:
  `{ version: 1, completed: [], marked: [], history: [], active: null, seen: [] }`
- Để theo dõi tiến độ từng câu hỏi, tỷ lệ đúng/sai và chuỗi thành thạo mà không phải duyệt lại toàn bộ mảng `history` ở mỗi lần render, cần có bảng thống kê tích lũy `questionStats`.
- Đồng thời, nếu học viên làm hàng trăm bài thi, kích thước `localStorage` có thể tăng lên gây lỗi `QuotaExceededError` trên trình duyệt di động (hạn mức thường từ 4MB đến 5MB, không cố định).

#### Quyết định:
1. **Nâng cấp Schema Version 2**:
   - Trường `version` nâng lên `2` (vẫn dùng khóa lưu trữ ổn định `netstudy-atmmt-v1`).
   - Bổ sung trường `questionStats: Record<string, QuestionPerformanceRecord>`.
2. **Hàm Migration Idempotent (`StudyCore.migrate`)**:
   - Khi ứng dụng khởi động, kiểm tra `state.version`:
     - Nếu `version === 1`: Quét qua toàn bộ mảng `history` hiện có (nếu có) để tổng hợp lại `attempts`, `correctCount`, `wrongCount`, và xác định `masteryStatus`.
     - Đặt `version = 2` và lưu lại.
     - Nếu chạy lại `migrate(state_v2)`, hàm trả về nguyên vẹn `state_v2` mà không làm thay đổi dữ liệu (tính chất Idempotent).
   - Tuyệt đối không suy diễn dữ liệu không thể xác minh: Các phiên trong quá khứ chỉ ghi nhận `ids` và `answers`. Do không thể biết chắc chắn thứ tự thời gian giữa các câu trong cùng một ngày nếu thiếu timestamp vi mô, chuỗi `consecutiveCorrect` từ lịch sử v1 chỉ được khởi tạo dựa trên kết quả của phiên làm bài gần nhất có chứa câu đó (đúng $\rightarrow 1$, sai $\rightarrow 0$).
3. **Giới hạn 100 Phiên & Xử lý `QuotaExceededError`**:
   - Mảng `state.history` chỉ lưu tối đa **100 phiên chi tiết gần nhất**. Khi nộp phiên thứ 101, hệ thống cắt giảm phiên cũ nhất trong `history` NHƯNG toàn bộ chỉ số tích lũy trong `questionStats` vẫn được giữ nguyên vẹn.
   - Khi bắt được lỗi `QuotaExceededError` trong `save()`:
     - Không được âm thầm xóa dữ liệu của người học!
     - Kích hoạt thông báo cảnh báo và mở modal hướng dẫn học viên: *"Bộ nhớ trình duyệt đã đầy. Hãy bấm Xuất bản sao lưu JSON để lưu trữ toàn bộ lịch sử trước khi dọn dẹp các phiên cũ."*

---

### Quyết định 2: Cỗ máy Trạng thái Thành thạo (Mastery State Machine)

#### Vấn đề:
Làm thế nào để phân biệt học viên thực sự hiểu bản chất câu hỏi với việc chỉ chọn đúng 1 lần do may mắn hoặc nhớ đáp án tạm thời trong phòng thi?

#### Quyết định (Bám sát Clarification CL-01):
Thiết lập State Machine nghiêm ngặt với 3 trạng thái:
1. **`needs_practice`** (Cần ôn tập):
   - Mặc định cho câu vừa làm sai, hoặc câu từng sai mà chưa có chuỗi làm đúng lại.
   - Điều kiện: `consecutiveCorrect === 0` và `attempts > 0` và có ít nhất 1 lần sai.
2. **`in_review`** (Đang củng cố):
   - Câu từng sai đã được trả lời đúng **1 lần** trong một phiên luyện tập (`mode === 'learn'` hoặc `mode === 'test'`).
   - Điều kiện: `consecutiveCorrect === 1`.
3. **`mastered`** (Đã thành thạo / Đã khắc phục):
   - Câu từng sai đã được trả lời đúng **2 lần liên tiếp trong 2 phiên luyện tập riêng biệt** (`consecutiveCorrect >= 2`).
   - Vinh danh câu hỏi đã được sửa chữa triệt để, chuyển sang danh mục "Đã khắc phục".

#### Bảng Chuyển Trạng thái (Mastery State Transition Matrix):

| Trạng thái hiện tại | Sự kiện / Hành động | Điều kiện phiên | Trạng thái mới | Thay đổi `consecutiveCorrect` | Ghi chú |
|:---|:---|:---|:---:|:---:|:---|
| *Chưa từng làm* | Làm đúng | Luyện tập / Thi thử | `unseen` $\rightarrow$ Đạt | `0` (chưa từng sai) | Không vào hàng đợi ôn |
| *Bất kỳ* | Làm sai | Luyện tập / Thi thử | **`needs_practice`** | **Reset về 0** | Đưa vào hàng đợi cần ôn |
| `needs_practice` | Làm đúng | **Phiên Luyện tập** | **`in_review`** | Tăng lên $1$ | Đã củng cố lần 1 |
| `needs_practice` | Làm đúng | **Bài Thi thử (40 câu)** | `needs_practice` | Giữ nguyên $0$ | **Thi thử không tự chuyển state** |
| `in_review` | Làm đúng | **Phiên Luyện tập mới** | **`mastered`** | Tăng lên $2$ | **Đạt chuẩn khắc phục** |
| `in_review` | Làm đúng | **Bài Thi thử (40 câu)** | `in_review` | Giữ nguyên $1$ | Thi thử không tăng chuỗi |
| `in_review` | Làm sai | Luyện tập / Thi thử | **`needs_practice`** | **Reset về 0** | Tái phát lỗi sai |
| `mastered` | Làm sai | Luyện tập / Thi thử | **`needs_practice`** | **Reset về 0** | Bị giáng cấp, cần ôn lại |
| `mastered` | Làm đúng | Luyện tập / Thi thử | `mastered` | Tăng lên ($3, 4...$) | Tiếp tục duy trì thành thạo |

*Ràng buộc phiên*: Các lần bấm đổi đáp án nhiều lần trong cùng một phiên đang làm dở (`session()`) chỉ được tính kết quả cuối cùng tại thời điểm nộp bài (`submit()`), không tính mỗi cú click là một lần thử độc lập.

---

### Quyết định 3: Động cơ Luyện tập Thích ứng (Adaptive Practice Engine)

#### Vấn đề:
Làm thế nào để tạo các đề luyện tập thông minh phù hợp với nhu cầu học viên mà không cần gọi API AI bên ngoài (tránh vi phạm Nguyên tắc I, IV, VII)?

#### Quyết định (Bám sát Clarification Additional Requirement 1 & 2):
Thiết kế thuật toán chọn mẫu thích ứng (Adaptive Sampling) xác định (deterministic), thuần quy tắc (rule-based), hoạt động 100% offline:

1. **Chế độ 1: Luyện câu chưa làm bao giờ (Unseen Questions Focus)**:
   - Tập ứng viên: Các câu trong ngân hàng 264 câu mà `questionStats[id].attempts === 0` (hoặc chưa xuất hiện trong bất kỳ phiên nào của `state.history`).
   - Sắp xếp ngẫu nhiên hoặc theo thứ tự chương, lấy đúng số câu yêu cầu ($N = 10, 20$).
   - Fallback: Nếu số câu chưa làm $< N$, lấy toàn bộ số câu chưa làm, phần còn lại bổ sung các câu có `masteryStatus === 'needs_practice'`.
2. **Chế độ 2: Luyện câu hay sai nhất (High-Error Focus)**:
   - Tập ứng viên: Các câu có `wrongCount > 0`.
   - Sắp xếp ưu tiên: Sắp xếp giảm dần theo tỷ lệ sai $\frac{\text{wrongCount}}{\text{attempts}}$, sau đó theo số lần sai tuyệt đối `wrongCount`.
   - Lấy $N$ câu đầu tiên.
   - Fallback: Nếu không có câu sai, gợi ý học viên chuyển sang chế độ câu chưa làm.
3. **Chế độ 3: Luyện củng cố chương yếu (Weak Chapter Focus)**:
   - Tập ứng viên: Lọc các câu thuộc các chương có tỷ lệ đúng tích lũy $< 70\%$ (với điều kiện chương đó đã làm ít nhất 5 câu).
   - Ưu tiên câu sai trong chương yếu trước, sau đó đến câu chưa làm trong chương yếu.
4. **Chế độ 4: Luyện hỗn hợp thích ứng (Adaptive Mixed Practice - 50/30/20)**:
   - Mục tiêu phân bổ cho $N$ câu:
     - Nhóm A (50% = $0.5N$ câu): Câu sai cần ôn (`needs_practice` hoặc `in_review`).
     - Nhóm B (30% = $0.3N$ câu): Câu chưa từng làm bao giờ (`unseen`).
     - Nhóm C (20% = $0.2N$ câu): Câu ngẫu nhiên trong ngân hàng để duy trì phản xạ.
   - **Thuật toán Bù đắp Fallback xác định**:
     ```text
     1. Lấy tối đa 0.5N câu từ Nhóm A.
     2. Lấy tối đa 0.3N câu từ Nhóm B.
     3. Tính số câu còn thiếu: K = N - (đã lấy từ A + đã lấy từ B).
     4. Nếu thiếu (do A hoặc B không đủ):
        - Bù đắp ưu tiên 1: Lấy thêm từ Nhóm B (câu chưa làm).
        - Bù đắp ưu tiên 2: Nếu B hết, lấy thêm từ Nhóm A (câu sai còn lại).
        - Bù đắp ưu tiên 3: Lấy ngẫu nhiên từ ngân hàng 264 câu (loại trừ các câu đã chọn).
     5. Trộn ngẫu nhiên danh sách cuối cùng để tránh người học đoán biết phân bổ.
     ```

---

### Quyết định 4: Phân tích Điểm thi Thử & Biểu đồ SVG Trực quan

#### Vấn đề:
Hiển thị xu hướng điểm thi thử 40 câu / 75 phút qua các lần thi mà không dùng thư viện ngoài (như Chart.js hay D3) để đảm bảo không vi phạm Nguyên tắc I (Vanilla-first) và Nguyên tắc VI (Accessibility, Light/Dark theme).

#### Quyết định:
- Dựng biểu đồ đường SVG trực quan (Inline Accessible SVG Line Chart) sinh động bằng hàm JavaScript thuần:
  - Khung SVG cố định viewBox `0 0 600 240`.
  - Trục tung: Điểm số từ 0.0 đến 10.0 với các vạch tham chiếu 5.0 (Trung bình), 7.0 (Khá), 8.5 (Giỏi).
  - Trục hoành: Các lần thi thử theo thứ tự thời gian (tối đa 15-20 bài gần nhất để không bị chật).
  - Đường nối `path d="M... L..."` sử dụng màu semantic `--accent-primary` (`#15634f` / `#2ad586`).
  - Điểm tròn trên mỗi mốc điểm có thẻ `<title>` và nhãn điểm số cố định, hỗ trợ tooltip hiển thị thời gian làm bài.
  - Tích hợp thuộc tính ARIA: `role="img" aria-label="Biểu đồ tiến độ điểm thi thử qua các lần làm bài"`.
- Thống kê tỷ lệ điểm theo đúng metadata thực tế: Nhận biết, Thông hiểu, Vận dụng được trích xuất trực tiếp từ trường `q.level` có sẵn trong `dist/data.js`.

---

## 3. Tổng kết Đánh giá Mức độ Tác động

| Quyết định | Mức độ phức tạp | Rủi ro | Lợi ích giáo dục & kỹ thuật |
|:---|:---:|:---:|:---|
| **1. Schema v2 & Migration** | Trung bình | Rất thấp (Idempotent) | Lưu trữ có cấu trúc, tương thích ngược 100%, bảo vệ Quota. |
| **2. 2-Streak Mastery Machine** | Thấp | Không | Loại bỏ đoán mò, vinh danh tiến bộ có kiểm chứng rõ ràng. |
| **3. Adaptive Practice Engine** | Trung bình | Không | Tối ưu hóa thời gian học, tự động cá nhân hóa lộ trình ôn thi. |
| **4. Inline SVG Analytics** | Thấp | Rất thấp | Trực quan hóa tiến độ, 0 thư viện ngoài, tải tức thì, chuẩn WCAG. |
