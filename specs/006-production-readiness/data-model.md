# Data Model: Production Readiness & Security Hardening

**Feature**: `006-production-readiness`
**Date**: 2026-11-04
**Status**: Completed

---

## 1. Content Security Policy Entity

### Structure
```typescript
interface ContentSecurityPolicy {
  defaultSrc: ["'self'"];
  scriptSrc: ["'self'", "'unsafe-inline'"];
  styleSrc: ["'self'", "'unsafe-inline'"];
  imgSrc: ["'self'", "data:"];
  connectSrc: ["'self'"];
  objectSrc: ["'none'"];
  baseUri: ["'self'"];
}
```

### Constraints & Invariants
- Khai báo tại thẻ `<meta http-equiv="Content-Security-Policy">` trong `<head>` của `dist/index.html`.
- Cấm hoàn toàn mọi kết nối mạng ra ngoài máy chủ lưu trữ (Zero External Telemetry).
- Cấm nhúng plugin và script từ nguồn bên thứ ba.

---

## 2. Ingestion Security & Validation Schema

### File Ingestion Envelope
```typescript
interface FileIngestionGuard {
  maxSizeBytes: 10485760; // 10MB
  allowedMimeTypes: ["application/json", "text/json", ".json"];
  validate(file: File): { ok: boolean; error?: string };
}
```

### Storage Backup Structure (Schema v2)
```typescript
interface BackupPayload {
  app: "NetStudy-Network-Security";
  exportedAt: string; // ISO 8601 string
  schemaVersion: 2;
  data: {
    version: 2;
    completed: string[];       // e.g. ["1:1.1", "2a:2a.3.1"]
    marked: string[];          // e.g. ["1-q1", "3-q2"]
    history: ExamSession[];    // up to 100 sessions recommended
    questionStats: Record<string, QuestionStatRecord>;
    savedExams: SavedExam[];
    active: ActiveExamSession | null;
  };
}
```

### Validation Rules
1. `file.size` $\le 10,485,760$ bytes.
2. `JSON.parse` hợp lệ.
3. Cấu trúc phải chứa đầy đủ các trường cốt lõi của Schema v2.
4. Mọi question ID trong `marked`, `history`, và `active` phải tồn tại trong `bank` (264 câu).
5. Xác nhận rõ ràng từ người dùng (`window.confirm`) trước khi ghi đè vào `localStorage`.

---

## 3. Web App Manifest Structure (PWA)

```json
{
  "name": "NetStudy · An toàn mạng máy tính",
  "short_name": "NetStudy",
  "description": "Giáo trình An toàn mạng máy tính tiếng Việt. Học bản chất, luyện tập và thi thử 40 câu / 75 phút.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#15634f",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "favicon.png",
      "sizes": "32x32",
      "type": "image/png"
    },
    {
      "src": "apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    }
  ]
}
```

---

## 4. Modal Focus Trap State Machine

```typescript
interface ModalFocusTrapState {
  isOpen: boolean;
  activeDialog: HTMLElement | null;
  triggerElement: HTMLElement | null;
  focusableElements: HTMLElement[];
  firstElement: HTMLElement | null;
  lastElement: HTMLElement | null;

  open(dialogId: string, triggerEl: HTMLElement): void;
  close(): void;
  handleKeyDown(event: KeyboardEvent): void;
}
```

### Transitions
- **Mở modal**: Lưu `triggerElement = document.activeElement` $\rightarrow$ gán `aria-hidden="false"` $\rightarrow$ đặt focus vào `firstElement`.
- **Nhấn phím `Tab`**: Nếu đang ở `lastElement`, nhảy về `firstElement`.
- **Nhấn phím `Shift + Tab`**: Nếu đang ở `firstElement`, nhảy về `lastElement`.
- **Nhấn phím `Escape`**: Đóng modal $\rightarrow$ gán `aria-hidden="true"` $\rightarrow$ gọi `triggerElement.focus()`.

---

## 5. Production Release Gate Quality Contract

```typescript
interface ProductionReleaseGate {
  syntaxCheck: boolean;            // node --check dist/*.js === 0
  whitespaceCheck: boolean;        // git diff --check === 0
  nodeRegressions: {
    coreLogic: boolean;            // checks.cjs PASS (264 questions, 95 sections)
    svgModels: boolean;            // checks-models.cjs PASS (27 models, 112 steps)
    performanceSLA: boolean;       // checks-perf.cjs PASS (<= 735.00 KB, eval <= 20ms)
    smartLearning: boolean;        // checks-learning.cjs PASS (9 groups pass)
  };
  crossBrowserE2E: {
    playwrightPassRate: 1.0;       // 100% active E2E tests pass
    axeCoreViolations: 0;          // 0 critical / serious violations
    viewportsCovered: ["1440px", "768px", "375px", "320px"];
  };
  securityAudit: {
    npmAuditVulnerabilities: 0;    // 0 vulnerabilities in devDependencies
    metaCspPresent: boolean;       // CSP tag present in dist/index.html
    ingestionSizeGuarded: boolean; // file.size <= 10MB guard present
  };
  deploymentGate: {
    workflowVersionValid: boolean; // actions/checkout@v4 in pages.yml
    approvalGranted: boolean;      // Manual user authorization required
  };
}
```
