# Quickstart Guide: Production Verification & Security Audit

**Feature**: `006-production-readiness`
**Date**: 2026-11-04

---

## 1. Kiểm toán Bảo mật Cục bộ (Local Security Audit)

Chạy kiểm toán phụ thuộc và quét mã nguồn:

```powershell
# 1. Kiểm tra lỗ hổng devDependencies
npm audit

# 2. Kiểm tra không có hàm thực thi nguy hiểm (eval / new Function)
Select-String -Path "dist\*.js" -Pattern "\beval\(|new\s+Function"

# 3. Kiểm tra thẻ Meta CSP trong index.html
Select-String -Path "dist\index.html" -Pattern "Content-Security-Policy"
```

---

## 2. Kiểm toán Trợ năng Tiếp cận (Accessibility Verification)

```powershell
# 1. Chạy bài kiểm thử quét tự động axe-core
npm run test:a11y

# 2. Chạy bài kiểm thử bàn phím và modal focus trap
npx playwright test tests/accessibility.spec.js
```

---

## 3. Kiểm toán Hiệu năng & Bản dựng Phát hành (Release Build Validation)

```powershell
# 1. Kiểm tra ngân sách payload <= 735.00 KB và thời gian nạp
node checks-perf.cjs

# 2. Kiểm tra tính toàn vẹn 4 tệp kiểm thử cốt lõi
node checks.cjs && node checks-models.cjs && node checks-perf.cjs && node checks-learning.cjs

# 3. Chạy toàn bộ chuỗi E2E tests
npm test
```
