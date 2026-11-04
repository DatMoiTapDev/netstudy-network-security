# Bảng Kiểm Tra Phê Duyệt Phát Hành (Release Approval Checklist)
## NetStudy · An toàn mạng máy tính
**Phiên Bản Đề Xuất**: NetStudy v6 (Feature 001 – 006)  
**Release Candidate Commit**: `6f15678b8719bc2cf1097eecbe199e434f0d6d53`  
**Trạng Thái Hiện Tại**: **CHỜ NGHIỆM THU PUSH REMOTE & PR REVIEW**  

---

## 1. Cổng Kỹ Thuật Độc Lập (Technical Quality Gates)

- [x] **Cú pháp JS & Whitespace**: `npm run test:syntax` và `npm run test:whitespace` PASS 100%.
- [x] **Đơn vị & Ma trận đề thi**: `node checks.cjs` PASS (264 câu, 100 randomizations).
- [x] **27 Mô hình SVG**: `node checks-models.cjs` PASS (112 bước, tính toán mật mã RSA/DH/OTP).
- [x] **Hiệu năng & SLA Payload**: `node checks-perf.cjs` PASS (**734.96 KB** $\le 735.00$ KB).
- [x] **Máy trạng thái học tập**: `node checks-learning.cjs` PASS (CL-01, adaptive engine, v1->v2 migration).
- [x] **Kiểm thử An ninh Tự động**: `npx playwright test tests/security.spec.js` PASS (10/10 tests).
- [x] **Kiểm thử Trợ năng Tự động**: `npx playwright test tests/accessibility.spec.js` PASS (0 axe-core violations trên 10 route).
- [x] **Toàn bộ E2E Test Suite**: `npm run test:e2e` PASS (103 passed, 11 skipped, 0 failed).
- [x] **Lỗ hổng chuỗi cung ứng**: `npm audit` đạt 0 vulnerabilities.

---

## 2. Cổng Quản Trị & Phát Hành GitHub (Governance & Deployment Gates)

- [ ] **Đẩy Nhánh Tính Năng Lên GitHub Remote**: Nhánh `feat/005` và `feat/006` đã được đẩy lên origin.
- [ ] **Mở Pull Request Hợp Lệ**: PR trên GitHub đã được tạo với đầy đủ mô tả kỹ thuật.
- [ ] **GitHub Actions CI Xanh Trên Remote**: Workflow `.github/workflows/ci.yml` trên GitHub hoàn thành thành công.
- [ ] **Đánh Giá Code Review (Peer Review)**: Ít nhất 1 Senior Reviewer phê duyệt PR.
- [ ] **Kế Hoạch Khôi Phục Sẵn Sàng**: Đã nắm rõ phương án rollback trong dưới 5 phút.

---

## 3. Chữ Ký Phê Duyệt Phát Hành (Sign-Off)

| Vai Trò | Người Đảm Nhiệm | Quyết Định (Approve / Reject) | Ngày Ký |
| :--- | :--- | :---: | :---: |
| **QA Automation Lead** | Đạt (Senior QA Lead) | **APPROVED (100% Quality Gates Pass)** | 2026-11-04 |
| **Security Auditor** | Security Team | **APPROVED (Meta CSP & Ingestion Guard)** | 2026-11-04 |
| **Release Manager** | ____________________ | [ ] Chờ phê duyệt sau khi kiểm tra PR trên GitHub | __________ |
