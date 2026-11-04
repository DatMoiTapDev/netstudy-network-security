# Data Model & Schema Specification: Feature 004 — Learning Experience & Smart Review

**Feature**: `specs/004-learning-experience-smart-review`  
**Date**: 2026-11-04  
**Status**: Completed  

---

## 1. Tổng quan Mô hình Dữ liệu

Tài liệu này định nghĩa cấu trúc dữ liệu chính thức phiên bản 2 (**Schema Version 2**), các thực thể thống kê học tập, cỗ máy trạng thái thành thạo, và các ràng buộc toàn vẹn dữ liệu client-side lưu trữ tại `localStorage['netstudy-atmmt-v1']`.

---

## 2. Cấu trúc State Chính thức: `NetStudyStateV2`

```typescript
interface NetStudyStateV2 {
  version: 2;                              // Nâng cấp từ version 1 -> 2
  completed: string[];                     // Mảng mã mục lý thuyết đã học (ví dụ: ["1:1.1", "3:3.2"])
  marked: string[];                        // Mảng mã câu hỏi đánh dấu thủ công (ví dụ: ["q-1-1", "q-4-5"])
  history: SessionRecord[];                // Tối đa 100 phiên làm bài chi tiết gần nhất
  seen: string[];                          // Danh sách mã câu hỏi đã từng gặp trong bài thi ngẫu nhiên
  questionStats: Record<string, QuestionPerformanceRecord>; // Thống kê tích lũy từng câu hỏi (264 câu)
  active: ActiveSession | null;            // Phiên làm bài đang diễn ra dở dang
}
```

---

## 3. Các Thực thể Dữ liệu Chi tiết

### A. Thực thể `QuestionPerformanceRecord`
Đại diện cho nhật ký làm bài và trạng thái thành thạo của từng câu hỏi:

```typescript
interface QuestionPerformanceRecord {
  questionId: string;                      // Mã câu hỏi duy nhất (khớp với data.js, ví dụ: 'q-1-1')
  chapter: string;                         // Bài học: '1' | '2a' | '2b' | '3' | '4' | '5' | '6' | '7' | '8'
  level: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng'; // Mức độ nhận thức (trích xuất từ metadata câu hỏi)
  attempts: number;                        // Tổng số lần đã trả lời câu này qua tất cả các phiên
  correctCount: number;                    // Tổng số lần trả lời đúng
  wrongCount: number;                      // Tổng số lần trả lời sai
  consecutiveCorrect: number;              // Chuỗi số lần trả lời đúng liên tiếp trong các phiên luyện tập riêng biệt (reset về 0 khi sai)
  lastAnswered: number;                    // Thời điểm trả lời gần nhất (timestamp ms)
  masteryStatus: 'needs_practice' | 'in_review' | 'mastered' | 'unseen';
}
```

#### Ràng buộc & Quy tắc Dữ liệu:
- `attempts`: Số nguyên không âm, `attempts = correctCount + wrongCount`.
- `consecutiveCorrect`:
  - Reset về `0` ngay khi trả lời sai trong bất kỳ phiên nào.
  - Tăng thêm `1` khi trả lời đúng trong một phiên Luyện tập riêng biệt (`mode === 'learn'` hoặc `mode === 'test'`).
  - Không tăng khi làm đúng trong bài Thi thử (`mode === 'exam'`) nhằm bảo đảm tiêu chuẩn CL-01.
- `masteryStatus`:
  - `'unseen'`: `attempts === 0`.
  - `'needs_practice'`: Có ít nhất 1 lần sai và `consecutiveCorrect === 0`.
  - `'in_review'`: Từng sai và `consecutiveCorrect === 1` trong phiên luyện tập.
  - `'mastered'`: Từng sai và `consecutiveCorrect >= 2` trong các phiên luyện tập riêng biệt.

---

### B. Thực thể `SessionRecord` (Phiên Làm bài Chi tiết)

```typescript
interface SessionRecord {
  id: string;                              // Chuỗi số timestamp duy nhất tạo phiên (ví dụ: '1730700000000')
  title: string;                           // Tiêu đề phiên (ví dụ: 'THI THỬ / 40 CÂU · 75 PHÚT', 'LUYỆN TẬP BÀI 3')
  mode: 'learn' | 'test' | 'exam';         // Chế độ làm bài
  practiceType?: 'custom' | 'unseen' | 'frequent_wrong' | 'weak_chapter' | 'adaptive_mixed'; // Chế độ thích ứng (nếu có)
  started: number;                         // Thời điểm bắt đầu (timestamp ms)
  ended: number;                           // Thời điểm kết thúc / nộp bài (timestamp ms)
  ids: string[];                           // Danh sách mã câu hỏi trong phiên
  answers: Record<string, number>;         // Bản đồ câu trả lời { [questionId]: selectedOptionIndex (0..3) }
  flags?: string[];                        // Danh sách mã câu đã cắm cờ xem lại
  auto?: boolean;                          // Cờ đánh dấu tự động nộp do hết giờ (đối với exam)
  deadline?: number;                       // Thời điểm kết thúc tuyệt đối (đối với exam 75 phút)
}
```

---

### C. Thực thể `ChapterProgressSummary`
Dữ liệu tổng hợp tiến độ phục vụ hiển thị Dashboard:

```typescript
interface ChapterProgressSummary {
  chapterId: string;                       // '1' đến '8' (bao gồm '2a', '2b')
  title: string;                           // Tên chương
  totalSections: number;                   // Tổng số mục lý thuyết của chương (từ data.js)
  completedSections: number;               // Số mục học viên đã đánh dấu hoàn thành
  totalQuestions: number;                  // Tổng số câu hỏi của chương trong ngân hàng
  practicedQuestions: number;              // Số câu học viên đã làm ít nhất 1 lần
  correctCount: number;                    // Tổng số lượt trả lời đúng của chương
  totalAttempts: number;                   // Tổng số lượt làm câu hỏi của chương
  accuracyRate: number;                    // Tỷ lệ trả lời đúng = (correctCount / totalAttempts) * 100
  isWeak: boolean;                         // Cờ cảnh báo chương yếu: accuracyRate < 70% VÀ practicedQuestions >= 5
}
```

---

### D. Thực thể `ExamTrendPoint`
Điểm dữ liệu phục vụ dựng biểu đồ đường SVG xu hướng thi thử:

```typescript
interface ExamTrendPoint {
  sessionId: string;                       // Mã bài thi
  timestamp: number;                       // Thời điểm nộp bài
  formattedDate: string;                   // Chuỗi ngày giờ hiển thị (ví dụ: '04/11 08:30')
  score: number;                           // Điểm số thang 10 (0.00 - 10.00)
  correct: number;                         // Số câu đúng (0 - 40)
  wrong: number;                           // Số câu sai (0 - 40)
  blank: number;                           // Số câu bỏ trống (0 - 40)
  elapsedMinutes: number;                  // Số phút làm bài thực tế
  wasAutoSubmitted: boolean;               // Có phải bị nộp do hết giờ không
  levelStats: {                            // Phân bổ đúng/tổng theo 3 mức độ nhận thức
    recognize: { correct: number; total: number }; // Nhận biết (12 câu trong đề chuẩn)
    understand: { correct: number; total: number };// Thông hiểu (20 câu trong đề chuẩn)
    apply: { correct: number; total: number };     // Vận dụng (8 câu trong đề chuẩn)
  };
}
```

---

### E. Thực thể `AggregatedStatistics`
Bảng thống kê toàn cục phục vụ Learning Dashboard:

```typescript
interface AggregatedStatistics {
  totalSectionsCompleted: number;          // Tổng số mục lý thuyết đã học / 95
  totalQuestionsPracticed: number;         // Tổng số câu hỏi đã thử sức / 264
  coveragePercentage: number;              // Tỷ lệ bao phủ ngân hàng câu hỏi (%)
  overallAccuracyRate: number;             // Tỷ lệ trả lời đúng toàn bộ qua mọi phiên (%)
  totalExamsTaken: number;                 // Tổng số lượt thi thử đã nộp
  averageExamScore: number;                // Điểm thi thử trung bình
  masteryBreakdown: {
    unseen: number;                        // Số câu chưa từng gặp
    needsPractice: number;                 // Số câu đang cần ôn tập
    inReview: number;                      // Số câu đang củng cố (đúng 1 lần)
    mastered: number;                      // Số câu đã khắc phục hoàn toàn (đúng 2 lần liên tiếp)
  };
  weakChapters: string[];                  // Danh sách mã các chương yếu cần ưu tiên học
}
```

---

## 4. Quy tắc Nâng cấp Schema & Xử lý Dung lượng (Migration & Quota Policy)

### A. Idempotent Migration Algorithm (`StudyCore.migrate`)
```typescript
function migrate(savedData: any, bank: Question[]): NetStudyStateV2 {
  if (!savedData || typeof savedData !== 'object') {
    return freshV2();
  }
  // Nếu đã là version 2 và có cấu trúc hợp lệ, trả về nguyên vẹn
  if (savedData.version === 2 && savedData.questionStats) {
    return validateV2(savedData);
  }

  // Khởi tạo state v2 từ dữ liệu v1
  const v2: NetStudyStateV2 = {
    version: 2,
    completed: Array.isArray(savedData.completed) ? savedData.completed : [],
    marked: Array.isArray(savedData.marked) ? savedData.marked : [],
    history: Array.isArray(savedData.history) ? savedData.history.slice(-100) : [],
    seen: Array.isArray(savedData.seen) ? savedData.seen : [],
    active: savedData.active || null,
    questionStats: {}
  };

  // Khởi tạo bảng questionStats cho 264 câu từ bank
  const qmap = new Map(bank.map(q => [q.id, q]));
  for (const q of bank) {
    v2.questionStats[q.id] = {
      questionId: q.id,
      chapter: q.chapter,
      level: q.level,
      attempts: 0,
      correctCount: 0,
      wrongCount: 0,
      consecutiveCorrect: 0,
      lastAnswered: 0,
      masteryStatus: 'unseen'
    };
  }

  // Tổng hợp lại stats từ mảng history cũ
  for (const h of v2.history) {
    if (!h.answers || typeof h.answers !== 'object') continue;
    for (const [qid, ansIdx] of Object.entries(h.answers)) {
      const q = qmap.get(qid);
      const stat = v2.questionStats[qid];
      if (!q || !stat) continue;
      stat.attempts++;
      const isCorrect = (ansIdx === q.correct);
      if (isCorrect) {
        stat.correctCount++;
      } else {
        stat.wrongCount++;
      }
      stat.lastAnswered = Math.max(stat.lastAnswered, h.ended || h.started || 0);
    }
  }

  // Xác định masteryStatus khởi tạo ban đầu an toàn từ dữ liệu v1:
  // Nếu câu chưa từng sai -> unseen / đạt.
  // Nếu câu từng sai -> kiểm tra phiên gần nhất có chứa câu đó:
  for (const stat of Object.values(v2.questionStats)) {
    if (stat.attempts === 0) {
      stat.masteryStatus = 'unseen';
    } else if (stat.wrongCount === 0) {
      stat.masteryStatus = 'unseen';
    } else {
      // Tìm câu trả lời trong phiên gần nhất
      const lastSession = [...v2.history].reverse().find(h => h.answers && Object.hasOwn(h.answers, stat.questionId));
      const q = qmap.get(stat.questionId);
      if (lastSession && q && lastSession.answers[stat.questionId] === q.correct) {
        stat.consecutiveCorrect = 1;
        stat.masteryStatus = 'in_review';
      } else {
        stat.consecutiveCorrect = 0;
        stat.masteryStatus = 'needs_practice';
      }
    }
  }

  return v2;
}
```

### B. Chính sách Bảo vệ Bộ nhớ & Quota
- Hạn chế `state.history` tối đa **100 phiên**.
- Khi phát hiện dung lượng chuỗi lưu trữ $> 3.5\text{ MB}$ hoặc kích hoạt ngoại lệ `QuotaExceededError`:
  - Hệ thống ngắt lệnh ghi đè.
  - Hiển thị thông báo hướng dẫn xuất file sao lưu JSON.
  - Không xóa ngầm bất kỳ dữ liệu nào.
