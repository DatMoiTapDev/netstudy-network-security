# Learning Experience & Architecture Interface Contract

**Feature**: `specs/004-learning-experience-smart-review`  
**Date**: 2026-11-04  
**Status**: Completed  

---

## 1. Mục đích Hợp đồng Kỹ thuật

Hợp đồng này quy định các hàm giao diện (APIs), kiểu dữ liệu đầu vào / đầu ra, và các cam kết kiến trúc giữa tầng dữ liệu cốt lõi (`StudyCore` trong `core.js`), tầng điều khiển ứng dụng (`app.js`), và hệ thống giao diện UI nhằm đảm bảo tính toàn vẹn, bảo toàn tuyệt đối các chức năng của Feature 001, Feature 002 và Feature 003.

---

## 2. Hợp đồng Lưu trữ & Quản lý Schema (`StorageContract`)

### A. Khóa Lưu trữ & Phiên bản Schema
- Khóa lưu trữ cục bộ: `KEY = 'netstudy-atmmt-v1'`.
- Thuộc tính `version`: `2`.
- Khóa lưu trữ giao diện: `THEME_KEY = 'netstudy-theme'` (hoàn toàn tách biệt).

### B. Hàm `StudyCore.migrate(savedData, bank)`
```typescript
function migrate(savedData: any, bank: Question[]): NetStudyStateV2;
```
- **Cam kết**:
  - Nhận vào dữ liệu thô từ `localStorage.getItem('netstudy-atmmt-v1')`.
  - Nếu dữ liệu là Schema v1: Tự động chuyển đổi thành Schema v2 đầy đủ, bảo toàn $100\%$ các mảng `completed`, `marked`, `history`, `seen`.
  - Tính chất Idempotent: `migrate(migrate(data, bank), bank) === migrate(data, bank)`.
  - Trả về đối tượng `NetStudyStateV2` chuẩn chỉnh, không bao giờ ném lỗi ra ngoài làm crash ứng dụng.

### C. Hàm `StudyCore.validateV2(state)`
```typescript
function validateV2(state: any): NetStudyStateV2;
```
- **Cam kết**:
  - Xác thực cấu trúc tệp sao lưu JSON nhập vào.
  - Kiểm tra tính hợp lệ của `version === 2`, `questionStats`, `history` (mỗi phiên có `ids`, `answers` hợp lệ), và `completed`.
  - Ném ngoại lệ có thông điệp rõ ràng bằng tiếng Việt nếu tệp JSON bị hỏng hoặc sai cấu trúc.

---

## 3. Hợp đồng Cỗ máy Trạng thái Thành thạo (`MasteryContract`)

### A. Hàm `StudyCore.updateMastery(questionStats, session, qmap)`
```typescript
function updateMastery(
  questionStats: Record<string, QuestionPerformanceRecord>,
  session: SessionRecord,
  qmap: Map<string, Question>
): void;
```
- **Cam kết**:
  - Được kích hoạt duy nhất một lần tại thời điểm nộp bài (`submit()`).
  - Cập nhật số lần thử `attempts`, số lần đúng `correctCount`, số lần sai `wrongCount` cho các câu trong phiên.
  - **Quy tắc chuỗi đúng `consecutiveCorrect` (CL-01)**:
    - Nếu trả lời sai: `consecutiveCorrect = 0`, `masteryStatus = 'needs_practice'`.
    - Nếu trả lời đúng trong phiên Luyện tập (`mode === 'learn' | 'test'`):
      - Tăng `consecutiveCorrect += 1`.
      - Nếu `consecutiveCorrect === 1`: `masteryStatus = 'in_review'`.
      - Nếu `consecutiveCorrect >= 2`: `masteryStatus = 'mastered'`.
    - Nếu trả lời đúng trong bài Thi thử (`mode === 'exam'`):
      - Giữ nguyên `consecutiveCorrect`.
      - **Không** tự động chuyển trạng thái sang `'mastered'`.

---

## 4. Hợp đồng Động cơ Luyện tập Thích ứng (`AdaptiveSelectorContract`)

### A. Hàm `StudyCore.selectAdaptive(bank, questionStats, history, options, rng)`
```typescript
interface AdaptiveOptions {
  mode: 'unseen' | 'frequent_wrong' | 'weak_chapter' | 'adaptive_mixed';
  count: number; // 10 | 20 | Infinity (toàn bộ)
  targetChapter?: string; // Nếu lọc theo chương
}

function selectAdaptive(
  bank: Question[],
  questionStats: Record<string, QuestionPerformanceRecord>,
  history: SessionRecord[],
  options: AdaptiveOptions,
  rng?: () => number
): string[]; // Trả về mảng các questionId
```
- **Cam kết**:
  - Thuần khiết, xác định (deterministic nếu truyền `rng` có seed).
  - Không bao giờ trả về câu hỏi trùng lặp trong cùng một đề (`new Set(result).size === result.length`).
  - Số lượng câu hỏi trả về tối đa bằng `options.count`, và không vượt quá tổng số câu có sẵn trong ngân hàng.
  - Tuân thủ thứ tự bù đắp Fallback xác định khi nhóm câu không đủ tỷ lệ 50/30/20:
    1. Thêm câu chưa làm.
    2. Thêm câu sai.
    3. Thêm câu ngẫu nhiên còn lại.

---

## 5. Hợp đồng Phân tích & Tính toán Thống kê (`AnalyticsContract`)

### A. Hàm `StudyCore.computeDashboardStats(state, bank, chapters)`
```typescript
function computeDashboardStats(
  state: NetStudyStateV2,
  bank: Question[],
  chapters: Chapter[]
): {
  overall: AggregatedStatistics;
  chapters: ChapterProgressSummary[];
};
```
- **Cam kết**:
  - Thời gian thực thi $\le 5\text{ms}$ trên tập dữ liệu 100 phiên thi.
  - Nhận diện chính xác các chương yếu: tỷ lệ đúng $< 70\%$ và đã luyện ít nhất 5 câu.
  - Trích xuất tỷ lệ hoàn thành 95 mục lý thuyết và 264 câu hỏi không sai lệch.

### B. Hàm `StudyCore.computeExamTrends(history, qmap)`
```typescript
function computeExamTrends(
  history: SessionRecord[],
  qmap: Map<string, Question>
): ExamTrendPoint[];
```
- **Cam kết**:
  - Lọc các phiên có `mode === 'exam'`.
  - Phân bổ câu hỏi theo 3 mức độ nhận thức thực tế: Nhận biết, Thông hiểu, Vận dụng dựa trên `q.level` có sẵn trong `data.js`.
  - Trả về mảng điểm xu hướng theo thứ tự thời gian tăng dần để vẽ biểu đồ SVG.

---

## 6. Cam kết Bất biến Kỹ thuật (Invariance SLAs)

1. **Bảo toàn Bài thi Thử 40 câu / 75 phút**:
   - `StudyCore.makeExam(bank, fixed, seen)` giữ nguyên $100\%$ logic phân bổ ma trận quota 9 chương (4, 3, 3, 6, 5, 5, 6, 5, 3), seed `533`, và công thức tính điểm `correct / total * 10`.
2. **Bảo toàn Vi mô DOM (Feature 001)**:
   - Các hàm `updateOptionSelection`, `safeFocus`, phím tắt `1-4`, `A-D`, `F`, `ArrowRight`/`ArrowLeft` tiếp tục hoạt động nguyên bản.
3. **Bảo toàn Design System & Theme Engine (Feature 002)**:
   - Biểu đồ và các card Dashboard mới sử dụng đúng 3-tier CSS variables (`--bg-surface`, `--accent-primary`, `--border-default`, `--status-success-bg`, v.v.).
4. **Bảo toàn Tối ưu Hiệu năng (Feature 003)**:
   - Áp dụng `contain: content` cho các thẻ Dashboard.
   - Giữ vững cam kết **Cumulative Layout Shift (CLS) = 0.00**.
