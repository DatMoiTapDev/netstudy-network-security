# Bảng Kiểm Tra Điều Kiện Phát Hành (Release Candidate Checklist)
## Feature 006 — Production Readiness & Security Hardening
**Repository**: `DatMoiTapDev/netstudy-network-security`
**Nhánh Phát Hành**: `feat/006-production-readiness`
**Phiên bản ứng dụng**: `v6` (Asset Cache Buster `?v=6`)
**Ngày kiểm định**: 2026-11-04
**Trạng thái chung**: **ALL GATES PASS (SẴN SÀNG CHO RELEASE CANDIDATE)**

---

## 1. Cổng Kiểm Soát Chất Lượng & Tuân Thủ (Quality Gates Matrix)

| STT | Cổng Kiểm Soát (Gate) | Lệnh Thực Thi / Phương Pháp | Kết Quả Ghi Nhận | Đánh Giá |
| :---: | :--- | :--- | :--- | :---: |
| **G1** | **Cú pháp & Whitespace** | `git diff --check` | 0 lỗi whitespace, 0 conflict marker | **PASS** |
| **G2** | **Lỗ hổng Dependencies** | `npm audit` | 0 vulnerabilities (0 critical, 0 high) | **PASS** |
| **G3** | **Bộ Kiểm Thử Học Liệu Cơ Bản** | `node checks.cjs` | 9 chương, 95 mục, 264 câu hỏi, 100 randomization pass | **PASS** |
| **G4** | **Bộ Kiểm Thử 27 Mô Hình SVG** | `node checks-models.cjs` | 27 mô hình, 112 bước, pass toàn bộ liên kết | **PASS** |
| **G5** | **Bộ Kiểm Thử Hiệu Năng & Kích Thước**| `node checks-perf.cjs` | Payload: **734.96 KB** (752,596 bytes $\le 752,640$ bytes budget); script eval: 17.5ms | **PASS** |
| **G6** | **Bộ Kiểm Thử Học Tập & Máy Trạng Thái**| `node checks-learning.cjs`| 9/9 nhóm kiểm thử học tập, thuật toán adaptive và di trú v1->v2 pass 100% | **PASS** |
| **G7** | **Bộ Kiểm Thử An Ninh Thông Tin** | `npx playwright test tests/security.spec.js` | 10/10 tests pass (XSS hash, upload 10MB limit, CSP, eval check) | **PASS** |
| **G8** | **Bộ Kiểm Thử Trợ Năng WCAG 2.2 AA** | `npx playwright test tests/accessibility.spec.js` | 0 critical/serious violations trên 10 route | **PASS** |
| **G9** | **Toàn Bộ Bài Kiểm Thử E2E** | `npm run test:e2e` | 103 passed, 11 skipped (desktop-only trên mobile viewport), 0 failed | **PASS** |
| **G10**| **Tập Tin Hạ Tầng GitHub Pages** | Kiểm tra `dist/` | `dist/404.html`, `dist/.nojekyll`, `dist/manifest.webmanifest` hiện diện đầy đủ | **PASS** |
| **G11**| **Chính Sách CSP Meta Tag** | Kiểm tra `dist/index.html` | Meta tag CSP với đầy đủ 7 directives nghiêm ngặt | **PASS** |
| **G12**| **Cổng Phê Duyệt Triển Khai (Pages)**| Kiểm tra `.github/workflows/pages.yml` | Đã sửa `actions/checkout@v4`, tích hợp đầy đủ 4 bài check, môi trường `github-pages` kiểm soát chặt | **PASS** |

---

## 2. Chi Tiết Kích Thước Thư Mục Phân Phối (`dist/`)

| Tên Tập Tin | Kích thước (Bytes) | Giới hạn / Ghi chú |
| :--- | :---: | :--- |
| `index.html` | 3,115 | Chứa Meta CSP, Manifest link, theme init script siêu nhẹ |
| `style.css` | 24,179 | Đã tối ưu hóa, hỗ trợ `prefers-reduced-motion` |
| `models.css` | 3,787 | Kiểu dáng cho 27 mô hình tương tác SVG |
| `app.js` | 63,803 | Đã bổ sung bẫy tiêu cự, phím Escape, chặn upload 10MB |
| `core.js` | 16,285 | Lược đồ dữ liệu v2, máy trạng thái CL-01, engine thi cử |
| `data.js` | 515,026 | Toàn bộ 9 chương học liệu, 264 câu hỏi và giải thích chi tiết |
| `models.js` | 115,730 | Dữ liệu cấu trúc 27 mô hình an toàn mạng |
| `model-ui.js` | 10,684 | Bộ dựng đồ họa SVG, hỗ trợ accessibility |
| **Tổng uncompressed payload** | **752,596 bytes** | **Ngưỡng SLA: 752,640 bytes (735.00 KB) — ĐẠT TIÊU CHUẨN** |

---

## 3. Xác Nhận Không Có Thay Đổi Ngoài Phạm Vi (Clean Working Scope)

- Không sửa đổi nội dung học liệu 9 chương PDF.
- Không sửa đổi ngân hàng 264 câu hỏi trắc nghiệm hoặc đáp án.
- Không sửa đổi thuật toán sinh đề thi giả lập ngẫu nhiên có định hướng (seed 533).
- Không tự ý commit, push, merge hoặc deploy.
