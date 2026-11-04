# Implementation Plan: Production Readiness & Security Hardening

**Branch**: `feat/006-production-readiness` | **Date**: 2026-11-04 | **Spec**: [`spec.md`](./spec.md)
**Input**: Feature specification from `specs/006-production-readiness/spec.md`

---

## 1. Summary

Kế hoạch kỹ thuật Feature 006 nhằm thiết lập trạng thái sẵn sàng phát hành công khai an toàn (Production Readiness & Security Hardening) cho NetStudy trên nền tảng GitHub Pages:
1. **Bảo mật Phía Client**: Thêm thẻ `<meta http-equiv="Content-Security-Policy">` cô lập ranh giới tài nguyên nội bộ, thêm guardrail kiểm tra `file.size <= 10MB` trước khi đọc tệp JSON vào RAM, rà soát 27 điểm `innerHTML` đảm bảo khử nhiễm tuyệt đối qua `e()`.
2. **Trợ năng Tiếp cận Chuẩn WCAG 2.2 AA**: Cài đặt bẫy giữ tiêu điểm bàn phím (`focus trap`) và đóng bằng phím `Escape` cho `#quotaModal` và `#mobileDrawer`, hỗ trợ CSS `prefers-reduced-motion`, bổ sung `role="img"` và nhãn tiếp cận cho 27 mô hình SVG và biểu đồ xu hướng.
3. **Bản dựng Phát hành & Điều hướng GitHub Pages**: Tạo `dist/404.html` điều hướng mượt mà, tệp `dist/.nojekyll`, tệp `dist/manifest.webmanifest`, và đồng bộ hóa hậu tố phiên bản tài nguyên (`?v=6`).
4. **Chuẩn hóa Workflow GitHub Pages**: Sửa lỗi `actions/checkout@v6` thành `v4` trong `.github/workflows/pages.yml`, bổ sung bước kiểm thử toàn diện (`checks-perf.cjs`, `checks-learning.cjs`), và thiết lập cổng phê duyệt phát hành.

---

## 2. Technical Context

- **Ngôn ngữ/Môi trường**: Vanilla HTML5, CSS3, Modern JavaScript (ES2022+), Node.js 20 LTS.
- **Phụ thuộc Runtime**: **0 runtime dependencies** ($100\%$ thuần túy trong `dist/`).
- **Phụ thuộc Kiểm thử (devDependencies)**: `@playwright/test` 1.49+, `@axe-core/playwright` 4.10+.
- **Nền tảng Lưu trữ**: GitHub Pages (Static Site Hosting).
- **Mục tiêu Hiệu năng**:
  - Tổng uncompressed payload `dist/` duy trì $\le 735.00\text{ KB}$ (ngưỡng 752,640 bytes).
  - Đánh giá mã nguồn ban đầu $\le 20.0\text{ms}$.
  - Render route trung bình $\le 0.50\text{ms}$.
  - Cumulative Layout Shift ($\text{CLS}$) $= 0.00$.
- **Ràng buộc An toàn**:
  - Local-first: 100% dữ liệu nằm trong `localStorage`, zero telemetry ra máy chủ bên ngoài.
  - XSS defense-in-depth: Meta CSP + ngữ cảnh `e()` escaping.

---

## 3. Constitution Check

*GATE: Toàn bộ 10 nguyên tắc Hiến pháp được thẩm định trước khi chuyển sang Task Breakdown.*

| Nguyên tắc | Đánh giá | Ràng buộc Tuân thủ Kế hoạch |
| :--- | :---: | :--- |
| **I. Vanilla-First Architecture** | **PASS** | Không thêm bất kỳ framework hay thư viện runtime nào vào `dist/`. |
| **II. Feature Preservation** | **PASS** | Bảo lưu 100% 9 chương, 95 bài học, 264 câu hỏi, 27 mô hình SVG, bài thi 40 câu/75 phút, và Sổ ôn tập. |
| **III. Deterministic Exam Engine** | **PASS** | Hạt giống ngẫu nhiên 533, ma trận hạn mức câu hỏi, và công thức tính điểm giữ nguyên tuyệt đối. |
| **IV. Local-First & Privacy** | **PASS** | Zero telemetry, không gửi log ra máy chủ ngoại vi, dữ liệu người dùng hoàn toàn cục bộ. |
| **V. UI/UX Pro Max Standard** | **PASS** | Giao diện tối giản, tinh tế, đồng bộ Light/Dark themes, phản hồi tức thì. |
| **VI. Accessibility & Responsiveness** | **PASS** | Đạt WCAG 2.2 AA, focus trapping, focus visibility $\ge 2\text{px}$, reduced motion. |
| **VII. Zero-Dependency & Strict XSS** | **PASS** | Khai báo Meta CSP, kiểm tra 10MB file size, rà soát khử nhiễm 100% điểm `innerHTML`. |
| **VIII. Mandatory Headless Regressions**| **PASS** | Tất cả 4 bộ test logic và SLA (`checks*.cjs`) phải pass trong pre-deployment gate. |
| **IX. Spec-Driven Development** | **PASS** | Tuân thủ nghiêm ngặt lộ trình Spec $\rightarrow$ Plan $\rightarrow$ Tasks $\rightarrow$ Implement $\rightarrow$ Converge. |
| **X. Controlled Git Operations** | **PASS** | Không tự ý commit, push, merge hay deploy; yêu cầu phê duyệt thủ công rõ ràng. |

---

## 4. Project Structure & Touch-Points

### Cấu trúc Tài liệu Kỹ thuật (`specs/006-production-readiness/`)
```text
specs/006-production-readiness/
├── spec.md              # Feature specification
├── plan.md              # Technical implementation plan (this file)
├── research.md          # Security decisions, CSP, and accessibility patterns
├── data-model.md        # Security schemas, ingestion guard, and release contract
├── quickstart.md        # Security audit & release verification guide
├── contracts/           # Security, A11Y and deploy contracts
│   ├── security-hardening-contract.md
│   ├── accessibility-contract.md
│   └── deployment-workflow-contract.md
├── checklists/
│   └── requirements.md  # Spec quality validation checklist (16/16 pass)
└── tasks.md             # Sequenced task breakdown across 8 phases
```

### Các Tệp Mã nguồn & Cấu hình Trong Phạm vi (Scope Touch-Points)
- `dist/index.html`: Khai báo thẻ Meta CSP, cập nhật versioning `?v=6`, liên kết `manifest.webmanifest`.
- `dist/app.js`: Thêm kiểm tra `file.size <= 10MB` trước khi đọc file, tích hợp bẫy focus modal và sự kiện Escape.
- `dist/style.css`: Bổ sung `@media (prefers-reduced-motion: reduce)`.
- `dist/models.js` / `dist/model-ui.js`: Bổ sung thuộc tính `role="img"` và nhãn tiếp cận SVG.
- `dist/404.html`: Tạo mới trang 404 fallback với meta redirect và giao diện NetStudy.
- `dist/.nojekyll`: Tạo mới tệp rỗng chỉ thị cho GitHub Pages không chạy Jekyll.
- `dist/manifest.webmanifest`: Tạo mới cấu hình PWA.
- `.github/workflows/pages.yml`: Hiệu chỉnh `actions/checkout@v4`, bổ sung bước kiểm thử hồi quy trước khi deploy.
- `tests/security.spec.js`: Bài test E2E mới kiểm thử CSP, XSS injection, 10MB file upload guardrail.
- `tests/accessibility.spec.js`: Mở rộng kiểm thử modal focus trap, phím Escape và reduced motion.
