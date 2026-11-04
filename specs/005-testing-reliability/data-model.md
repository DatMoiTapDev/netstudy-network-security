# Data Model: Automated Testing & Reliability

**Feature Directory**: `specs/005-testing-reliability`  
**Date**: 2026-11-04  
**Status**: Ratified  

---

## 1. Cấu trúc Bộ Dữ liệu Kiểm thử (Test Fixtures Schema)

Các bộ dữ liệu mẫu tổng hợp (Synthetic Fixtures) được lưu trữ tại `tests/fixtures/` để nạp vào môi trường `localStorage` trước khi thực thi từng kịch bản kiểm thử Playwright.

### 1.1. `SyntheticStorageV1` (Lược đồ Version 1 Cũ)
Đại diện cho trạng thái lưu trữ của học viên được tạo từ các phiên bản Feature 001/002/003, phục vụ việc kiểm thử khả năng nâng cấp tự động (Idempotent Migration) lên Version 2.

```typescript
interface SyntheticStorageV1 {
  version: 1;
  completed: string[];                     // Mảng các mục đã học (ví dụ: ["1:1.1", "2a:2a.1"])
  marked: string[];                        // Mảng mã câu hỏi đã đánh dấu (ví dụ: ["1-q1", "1-q5"])
  history: Array<{                         // Danh sách phiên làm bài cũ
    id: string;                            // Timestamp ID
    mode: 'learn' | 'test' | 'exam';       // Chế độ bài làm
    title: string;                         // Tên bài làm
    ids: string[];                         // Danh sách câu hỏi trong phiên
    answers: Record<string, number>;       // Câu trả lời của người học
    started: number;                       // Thời điểm bắt đầu (ms)
    ended: number;                         // Thời điểm nộp bài (ms)
    auto?: boolean;                        // Nộp tự động do hết giờ
  }>;
  active: null | {
    id: string;
    ids: string[];
    mode: 'learn' | 'test' | 'exam';
    title: string;
    answers: Record<string, number>;
    flags: string[];
    index: number;
    started: number;
    deadline: number | null;
  };
  seen: string[];                          // Các câu hỏi đã từng xuất hiện
}
```

### 1.2. `SyntheticStorageV2Populated` (Lược đồ Version 2 Đã Có Dữ liệu)
Đại diện cho trạng thái của học viên đã ôn tập tích lũy, có đầy đủ các câu thành thạo, câu cần ôn, bài thi thử và các chỉ số tiến độ để kiểm chứng Dashboard, Sổ ôn tập 4 tabs, Biểu đồ SVG và Adaptive Practice.

```typescript
interface SyntheticStorageV2Populated {
  version: 2;
  completed: string[];                     // 15 mục lý thuyết đã hoàn thành
  marked: string[];                        // 4 câu hỏi được gắn sao
  history: Array<{                         // 8 phiên làm bài chi tiết (5 bài thi thử, 3 bài luyện tập)
    id: string;
    mode: 'learn' | 'test' | 'exam';
    title: string;
    ids: string[];
    answers: Record<string, number>;
    started: number;
    ended: number;
    auto?: boolean;
  }>;
  seen: string[];                          // Danh sách câu đã thi
  questionStats: Record<string, {          // Bảng thống kê tích lũy cho 264 câu hỏi
    questionId: string;
    chapter: string;
    level: string;
    attempts: number;
    correctCount: number;
    wrongCount: number;
    consecutiveCorrect: number;
    masteryStatus: 'needs_practice' | 'in_review' | 'mastered';
    lastAttempted: number | null;
    lastResult: boolean | null;
    marked: boolean;
  }>;
  savedExams: string[];
  bookmarks: string[];
  active: null;
}
```

### 1.3. `SyntheticStorageOverCapacity` (Dữ liệu Lịch sử Vượt 100 Phiên)
Chứa 120 phiên thi thử hợp lệ để kiểm chứng:
1. `migrateStorageToV2` giữ nguyên toàn bộ 120 phiên, $0\%$ dữ liệu bị mất mát.
2. Trang `#history` hiển thị banner cảnh báo vượt quá 100 phiên.
3. Không có hành vi tự ý cắt tỉa dữ liệu khi chưa có sự xác nhận của người học qua nút "Dọn dẹp về 100 phiên gần nhất".

---

## 2. Mô hình Báo cáo Kiểm thử Trợ năng (Accessibility Audit Model)

Cấu trúc đối tượng vi phạm do `@axe-core/playwright` trả về khi quét trên từng route của ứng dụng.

```typescript
interface AccessibilityAuditResult {
  route: string;                           // Route được quét (ví dụ: '#exam', '#review')
  theme: 'light' | 'dark';                 // Giao diện khi quét
  timestamp: string;                       // Thời điểm quét
  passesCount: number;                     // Số quy tắc đạt chuẩn WCAG
  violations: Array<{                      // Danh sách vi phạm (nếu có)
    id: string;                            // Mã quy tắc (ví dụ: 'color-contrast', 'button-name')
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    description: string;                   // Mô tả lỗi bằng tiếng Anh
    helpUrl: string;                       // Đường dẫn tham chiếu tài liệu W3C
    nodes: Array<{                         // Các phần tử DOM vi phạm
      html: string;                        // Đoạn mã HTML vi phạm
      target: string[];                    // CSS Selector trỏ tới phần tử
      failureSummary: string;              // Nguyên nhân thất bại cụ thể
    }>;
  }>;
}
```

*Quy tắc chất lượng*: `violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0`.

---

## 3. Mô hình Giám sát Hiệu năng Tự động (Performance Benchmark Sample)

Dữ liệu do script `checks-perf.cjs` và Playwright Performance Runner ghi nhận:

```typescript
interface PerformanceBenchmarkSample {
  timestamp: string;
  environment: 'local-node' | 'github-actions-ubuntu';
  totalPayloadBytes: number;               // Ngân sách: <= 752,640 bytes (735.00 KB)
  scriptEvaluationMs: number;              // Ngưỡng: <= 20.0 ms
  avgRouteRenderMs: number;                // Ngưỡng: <= 0.50 ms
  avgModelSvgMs: number;                   // Ngưỡng: <= 2.0 ms
  cumulativeLayoutShift: number;           // Ngưỡng: == 0.00
  status: 'PASS' | 'FAIL';
}
```

---

## 4. Mô hình Báo cáo CI Pipeline (CI Workflow Execution State)

Dữ liệu tổng hợp vòng đời kiểm thử tự động trên GitHub Actions:

```typescript
interface CIWorkflowRunSummary {
  runId: string;
  triggerEvent: 'pull_request' | 'push';
  branch: string;
  commitSha: string;
  stages: {
    staticAndSyntax: { status: 'PASS' | 'FAIL'; durationSeconds: number };
    headlessUnits: { status: 'PASS' | 'FAIL'; durationSeconds: number };
    playwrightE2E: { status: 'PASS' | 'FAIL'; durationSeconds: number };
    axeAccessibility: { status: 'PASS' | 'FAIL'; durationSeconds: number };
  };
  overallStatus: 'SUCCESS' | 'FAILURE';
  artifactsUploaded: string[];             // ['playwright-report', 'traces', 'screenshots']
}
```
