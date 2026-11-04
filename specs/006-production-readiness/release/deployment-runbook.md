# Sổ Tay Triển Khai Phát Hành Sản Phẩm (Production Deployment Runbook)
## NetStudy · An toàn mạng máy tính
**Repository**: `DatMoiTapDev/netstudy-network-security`  
**Hạ Tầng Xuất Bản**: GitHub Pages qua GitHub Actions (`actions/deploy-pages@v4`)  
**Môi Trường Deployment**: `github-pages`  
**Tên Miền Mặc Định**: `https://DatMoiTapDev.github.io/netstudy-network-security/`  
**Trạng Thái**: **RUNBOOK SẴN SÀNG THỰC THI**

---

## 1. Giai Đoạn 1: Kiểm Tra Trước Triển Khai (Pre-Deployment Checks)

Kỹ sư phát hành kiểm tra các điều kiện tiên quyết trước khi thực hiện thao tác:
- [ ] Xác nhận toàn bộ 100% bài kiểm thử cục bộ đều PASS:
  ```powershell
  npm run test:syntax
  npm run test:whitespace
  npm run test:units
  npx playwright test tests/security.spec.js
  npx playwright test tests/accessibility.spec.js
  npm run test:e2e
  ```
- [ ] Xác nhận tổng uncompressed payload `dist/` không vượt quá 752,640 bytes (`checks-perf.cjs` PASS).
- [ ] Xác nhận tệp `dist/index.html` có thẻ Meta CSP và tham số asset query `?v=6`.
- [ ] Xác nhận tệp `dist/404.html`, `dist/.nojekyll`, `dist/manifest.webmanifest` hiện diện đầy đủ.

---

## 2. Giai Đoạn 2: Điểm Chốt Phê Duyệt (Approval Checkpoint)

> [!WARNING]
> Thao tác merge vào nhánh `main` sẽ **TỰ ĐỘNG KÍCH HOẠT QUY TRÌNH DEPLOY GITHUB PAGES**.
> Chỉ thực hiện merge khi đã có sự đồng thuận chính thức của Release Manager / Product Owner.

- [ ] Phê duyệt viên: Release Manager / Lead Engineer.
- [ ] Điều kiện mở khóa: Pull Request trên GitHub đã vượt qua CI và có ít nhất 1 phê duyệt (Approved Review).

---

## 3. Giai Đoạn 3: Thao Tác Đẩy Code & Hợp Nhất (Merge & Release Operation)

1. **Đẩy Nhánh Release Candidate Lên GitHub**:
   ```powershell
   git push origin feat/006-production-readiness
   ```
2. **Tạo Pull Request Trên GitHub**:
   - Truy cập: `https://github.com/DatMoiTapDev/netstudy-network-security/compare/main...feat/006-production-readiness`
   - Đặt tiêu đề: `feat(release): Release Candidate v6 — Feature 001-006 Production Readiness`
3. **Theo Dõi CI Pipeline**:
   - Chờ `.github/workflows/ci.yml` hoàn thành với trạng thái xanh.
4. **Hợp Nhất PR (Merge PR)**:
   - Chọn phương thức merge chuẩn: **Create a merge commit** hoặc **Rebase and merge**.

---

## 4. Giai Đoạn 4: Giám Sát Quá Trình Triển Khai (Deployment Monitoring)

1. Mở tab **Actions** trên GitHub: `https://github.com/DatMoiTapDev/netstudy-network-security/actions`
2. Kiểm tra workflow **Deploy NetStudy to GitHub Pages**:
   - Bước `Check JavaScript syntax`: Phải PASS.
   - Bước `Run full regression and SLA checks`: Phải PASS.
   - Bước `Upload site`: Phải PASS.
   - Bước `Deploy`: Phải PASS và xuất ra URL triển khai thành công.

---

## 5. Giai Đoạn 5: Kiểm Thử Khói Trên Môi Trường Live (Production Smoke Tests)

Thực hiện kiểm tra ngay sau khi GitHub Actions báo thành công theo [smoke-test-checklist.md](./smoke-test-checklist.md).

---

## 6. Giai Đoạn 6: Xử Lý Sự Cố & Rollback Khẩn Cấp (Incident Response)

Nếu phát hiện lỗi nghiêm trọng (màn hình trắng, lỗi hiển thị câu hỏi, chặn CSP):
1. Lập tức kích hoạt quy trình [rollback-runbook.md](./rollback-runbook.md).
2. Thời gian khôi phục mục tiêu: Dưới 5 phút.
