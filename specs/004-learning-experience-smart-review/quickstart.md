# Quickstart & Verification Guide: NetStudy Learning Experience & Smart Review

**Feature**: `specs/004-learning-experience-smart-review`  
**Date**: 2026-11-04  
**Status**: Ready for Planning Verification  

---

## 1. Mục đích Hướng dẫn

Tài liệu này cung cấp kịch bản kiểm thử độc lập, các đoạn mã kiểm chứng tự động (automated test scripts) và quy trình nghiệm thu chi tiết cho toàn bộ các thành phần của **Feature 004 — Learning Experience & Smart Review**:
- Di chuyển lược đồ lưu trữ v1 sang Schema v2 (`migrateStorageToV2`).
- Máy trạng thái nắm vững kiến thức theo quy tắc 2 chuỗi liên tiếp (`updateQuestionMastery`).
- Bộ chọn câu hỏi luyện tập thích ứng với 4 presets và cơ chế bù trừ tuần tự (`selectAdaptiveQuestions`).
- Thống kê tiến độ 9 chương, nhận diện chương yếu và phân tích độ khó nhận thức theo `q.level`.
- Biểu đồ xu hướng điểm số bằng Inline SVG thuần.
- Quản trị dung lượng lưu trữ an toàn, cắt giảm tối đa 100 phiên và bắt ngoại lệ `QuotaExceededError`.
- Bảo toàn tuyệt đối tính bất biến của bộ máy thi thử 40 câu / seed `533` và 27 mô hình SVG.

---

## 2. Kịch bản Kiểm thử Nghiệp vụ (Core Test Scenarios)

### Kịch bản A: Kiểm thử Di chuyển Lược đồ Idempotent (Schema v1 $\rightarrow$ v2)
1. **Mục tiêu**: Đảm bảo người dùng nâng cấp từ phiên bản cũ không bị mất bất kỳ dữ liệu lịch sử nào; chạy nhiều lần không làm biến dạng dữ liệu.
2. **Các bước kiểm chứng**:
   - Khởi tạo dữ liệu v1 giả lập gồm 5 phiên thi thử và 10 câu hỏi trong `history`.
   - Gọi `StudyCore.migrateStorageToV2(v1Data)`.
   - Kiểm tra kết quả trả về có `version === 2`, `questionStats` được khởi tạo đầy đủ với 264 mục, và `history` giữ nguyên 5 phiên.
   - Gọi lại `StudyCore.migrateStorageToV2(v2Data)` lần thứ hai (idempotency check) $\rightarrow$ kết quả không thay đổi.
   - Thử nghiệm với dữ liệu hỏng (`"{invalid-json"`) $\rightarrow$ trả về Schema v2 mặc định an toàn, không gây crash ứng dụng.

### Kịch bản B: Kiểm thử Máy trạng thái Nắm vững Kiến thức (Mastery State Machine & CL-01)
1. **Mục tiêu**: Xác thực quy tắc vàng: đúng 2 lần liên tiếp trong 2 phiên luyện tập riêng biệt mới đạt `mastered`; sai lập tức reset chuỗi về 0; làm đúng trong thi thử không tự động chuyển câu sang `mastered`.
2. **Quy trình chuyển đổi trạng thái**:
   ```text
   Ban đầu (attempts: 0):
     -> Trả lời SAI trong Luyện tập
     -> attempts: 1, wrongCount: 1, consecutiveCorrect: 0, status: 'needs_practice'

   Phiên 2:
     -> Trả lời ĐÚNG trong Luyện tập
     -> attempts: 2, wrongCount: 1, consecutiveCorrect: 1, status: 'in_review'

   Phiên 3 (kịch bản rẽ nhánh 3a - lại làm sai):
     -> Trả lời SAI trong Luyện tập
     -> attempts: 3, wrongCount: 2, consecutiveCorrect: 0, status: 'needs_practice' (RESET!)

   Phiên 4:
     -> Trả lời ĐÚNG trong Luyện tập
     -> attempts: 4, wrongCount: 2, consecutiveCorrect: 1, status: 'in_review'

   Phiên 5:
     -> Trả lời ĐÚNG trong Luyện tập lần 2 liên tiếp
     -> attempts: 5, wrongCount: 2, consecutiveCorrect: 2, status: 'mastered' (ĐẠT CHUẨN!)

   Kịch bản rẽ nhánh 5b (Làm đúng trong Thi thử khi đang 'in_review'):
     -> consecutiveCorrect tăng lên 2, nhưng status VẪN LÀ 'in_review' (không tự động đạt mastered)
   ```

### Kịch bản C: Kiểm thử Bộ chọn Luyện tập Thích ứng & Bù trừ Tuần tự (Adaptive Presets & Fallback)
1. **Mục tiêu**: Đảm bảo 4 chế độ chọn câu hỏi hoạt động chuẩn xác, ngoại tuyến $100\%$ và luôn trả về đủ số câu yêu cầu:
   - `unseen`: Trả về các câu có `attempts === 0`.
   - `frequent_wrong`: Trả về các câu sắp xếp theo `wrongCount / attempts` giảm dần.
   - `weak_chapter`: Trả về câu hỏi thuộc các chương có accuracy $< 70\%$.
   - `adaptive_mixed`: Tỷ lệ $50\%$ sai/đang ôn, $30\%$ chưa làm, $20\%$ đã nắm vững.
2. **Kịch bản bù trừ thiếu hụt (Fallback Hierarchy)**:
   - Nếu ngân hàng câu hỏi chỉ có 2 câu sai/đang ôn nhưng yêu cầu 10 câu $\rightarrow$ lấy 2 câu sai, lấy tiếp 3 câu chưa làm, lấy 2 câu mastered; $3$ câu còn thiếu được bù từ `unseen`, nếu vẫn thiếu thì bù từ `wrong`, cuối cùng lấy từ ngân hàng chung.
   - Luôn đảm bảo không có câu hỏi trùng lặp trong một phiên luyện tập.

### Kịch bản D: Kiểm thử Thống kê Dashboard & Phân tích Đề thi (Analytics)
1. **Mục tiêu**: Kiểm tra tính toán % chính xác toàn diện, nhận diện đúng chương yếu, thống kê mức độ nhận thức (`q.level`) và vẽ biểu đồ SVG:
   - Tính tỷ lệ phần trăm chính xác theo từng chương: $\frac{\text{correctCount}}{\text{totalAttempts}} \times 100\%$.
   - Chương có tỷ lệ $< 70\%$ được gắn cờ `isWeak: true`.
   - Phân loại chính xác 264 câu vào 3 mức nhận thức: `Nhận biết`, `Thông hiểu`, `Vận dụng`.
   - Chuỗi điểm số thi thử sinh ra tọa độ các điểm `<circle>` và đường nối `<polyline>` chính xác trong khung `viewBox="0 0 600 240"`.

### Kịch bản E: Kiểm thử Giới hạn Dung lượng & Cắt giảm An toàn (CL-03)
1. **Mục tiêu**: Lịch sử chỉ lưu tối đa 100 phiên chi tiết; `questionStats` không bị xóa; xuất dữ liệu JSON khi cảnh báo tràn bộ nhớ.
2. **Các bước kiểm chứng**:
   - Thêm 120 phiên vào `store.history`.
   - Gọi `StudyCore.pruneHistorySafely(store, 100)`.
   - Xác nhận `store.history.length === 100` (giữ lại 100 phiên mới nhất).
   - Xác nhận `store.questionStats` vẫn giữ nguyên 264 bản ghi với đầy đủ số liệu tích lũy lâu dài.
   - Thử nghiệm xuất dữ liệu qua `exportUserDataJSON(store)` và kiểm tra chuỗi JSON hợp lệ.

---

## 3. Kịch bản Kiểm thử Tự động Chạy Ngay (Executable Headless Test Suite)

Bạn có thể chạy thử nghiệm toàn bộ logic lõi của Feature 004 ngay từ dòng lệnh Node.js bằng cách tạo tệp `checks-learning.cjs` hoặc chạy trực tiếp đoạn script sau:

```powershell
node -e "
const fs = require('fs');
const vm = require('vm');

console.log('=== NETSTUDY FEATURE 004 HEADLESS VERIFICATION ===\n');

// 1. Nạp dist/data.js và dist/core.js
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('dist/data.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('dist/core.js', 'utf8'), ctx);

const StudyCore = ctx.window.StudyCore;
console.log('1. Nạp mã nguồn thành công. StudyCore sẵn sàng:', typeof StudyCore === 'object');

// 2. Kiểm tra siêu dữ liệu q.level của 264 câu hỏi
const chapters = ctx.window.COURSE || [];
const bank = chapters.flatMap(c => c.questions.map(q => ({...q, chapter: c.id, file: c.file})));
console.log('Tổng số câu hỏi trong ngân hàng:', bank.length);
const levels = { 'Nhận biết': 0, 'Thông hiểu': 0, 'Vận dụng': 0, 'Khác': 0 };
for (const q of bank) {
  if (levels[q.level] !== undefined) levels[q.level]++;
  else levels['Khác']++;
}
console.log('Phân bố Cognitive Levels (q.level):', levels);
if (levels['Khác'] > 0 || bank.length !== 264) {
  console.error('FAIL: Siêu dữ liệu q.level không chuẩn hoặc thiếu câu hỏi!');
  process.exit(1);
} else {
  console.log('PASS: 100% câu hỏi có siêu dữ liệu mức độ nhận thức chuẩn xác!\n');
}

// 3. Kiểm tra tính bất biến của Deterministic Exam Engine
const exam1 = StudyCore.makeExam(bank, true);
const exam2 = StudyCore.makeExam(bank, true);
console.log('Đề thi chuẩn 40 câu có số lượng:', exam1.length);
let identical = (exam1.length === 40 && exam2.length === 40);
for (let i = 0; i < 40; i++) {
  if (exam1[i] !== exam2[i]) { identical = false; break; }
}
if (identical) {
  console.log('PASS: Thuật toán sinh đề thi seed 533 hoàn toàn bất biến và determinism 100%!\n');
} else {
  console.error('FAIL: Deterministic Exam Engine bị biến đổi!');
  process.exit(1);
}

console.log('=== TOÀN BỘ PRE-PLANNING ASSERTIONS ĐẠT YÊU CẦU! ===');
"
```

---

## 4. Hướng dẫn Chạy Kiểm thử Toàn diện Sau khi Triển khai (Post-Implementation Verification)

Sau khi hoàn tất bước triển khai mã nguồn (Implementation Phase), chạy các lệnh sau theo thứ tự:

### Bước 1: Kiểm tra Cú pháp JavaScript
```powershell
node --check dist/core.js
node --check dist/app.js
```

### Bước 2: Chạy Suite Kiểm thử Học tập & Ôn tập Thông minh (Mới)
```powershell
node checks-learning.cjs
```
*Kỳ vọng: Toàn bộ 5 nhóm kiểm thử (Migration, Mastery, Adaptive Selector, Analytics, Quota) PASS 100% với mã thoát 0.*

### Bước 3: Chạy Suite Kiểm thử Hồi quy Tổng thể
```powershell
node checks.cjs
node checks-models.cjs
node checks-perf.cjs
```
*Kỳ vọng: Không có bất kỳ lỗi hồi quy nào trên 9 chương, 27 mô hình SVG, tính toán điểm số hoặc hiệu năng Core Web Vitals.*

### Bước 4: Kiểm tra Định dạng & Khoảng trắng Git
```powershell
git diff --check
```
*Kỳ vọng: Không có lỗi khoảng trắng thừa ở cuối dòng.*

---

## 5. Danh mục Nghiệm thu Tính năng (Acceptance Verification Checklist)

- [ ] **Migration Schema v2**: Dữ liệu người dùng cũ được nâng cấp tự động, mượt mà khi mở ứng dụng lần đầu.
- [ ] **Quy tắc 2-Streak Mastery (CL-01)**: Câu sai chuyển sang `in_review` sau 1 lần đúng; đạt `mastered` khi đúng 2 lần liên tiếp trong 2 phiên luyện tập; làm sai ở bất kỳ đâu lập tức reset chuỗi về 0.
- [ ] **Smart Review 4 Tabs**: Hiển thị chính xác các tab `needs_practice`, `in_review`, `mastered`, `marked`; chuyển tab tức thì $\le 5\text{ms}$.
- [ ] **Adaptive Practice Presets**: 4 preset (`unseen`, `frequent_wrong`, `weak_chapter`, `adaptive_mixed`) tạo danh sách câu hỏi chính xác kèm fallback đầy đủ số lượng.
- [ ] **Learning Dashboard**: Trực quan hóa tiến độ 9 chương, 264 câu; gắn cờ cảnh báo rõ ràng các chương có độ chính xác $< 70\%$.
- [ ] **Inline SVG Trend Chart**: Biểu đồ điểm số mượt mà, responsive, hỗ trợ tooltip, không sử dụng thư viện ngoài.
- [ ] **Cognitive Level Breakdown**: Bảng thống kê độ chính xác theo 3 mức `Nhận biết`, `Thông hiểu`, `Vận dụng` phản ánh số liệu thực tế từ `q.level`.
- [ ] **Storage Management & Quota (CL-03)**: `history` giới hạn tối đa 100 phiên; `questionStats` lưu lũy kế vĩnh viễn; modal cảnh báo xuất JSON khi gặp sự cố lưu trữ.
- [ ] **Invariance Preservation**: Giữ nguyên vẹn 100% các tính năng của Feature 001, 002, 003 và đề thi chuẩn 40 câu / seed `533`.
