# Quy Trình Khôi Phục Khẩn Cấp & Rollback Production (Rollback Procedure)
## Feature 006 — Production Readiness & Security Hardening
**Repository**: `DatMoiTapDev/netstudy-network-security`
**Dự án**: NetStudy · An toàn mạng máy tính
**Hạ tầng**: GitHub Pages (`gh-pages` branch / GitHub Actions Artifacts)
**Mục tiêu thời gian khôi phục (RTO)**: $\le 5\text{ phút}$
**Mục tiêu điểm khôi phục (RPO)**: 0 dữ liệu học tập bị mất (Local-First preservation)

---

## 1. Nguyên Tắc An Toàn Khi Rollback

1. **Bảo tồn Dữ liệu Người dùng Tuyệt đối**: Vì NetStudy tuân thủ kiến trúc Local-First, toàn bộ tiến độ học và lịch sử thi thử nằm trong `localStorage` của trình duyệt người học. Việc rollback phiên bản mã nguồn tĩnh trên GitHub Pages tuyệt đối không làm ảnh hưởng hay xóa dữ liệu của người dùng.
2. **Không Tự Động Revert/Force-Push**: Mọi hành động hoàn tác mã nguồn hoặc kích hoạt lại phiên bản cũ phải được thực hiện có chủ đích và có sự xác nhận của Release Engineer.
3. **Tính Tương Thích Ngược của Lược Đồ (Schema Compatibility)**: Các phiên bản v2 duy trì khả năng đọc và xác thực dữ liệu đã lưu, đảm bảo người dùng có thể tiếp tục sử dụng ngay cả khi mã nguồn được khôi phục về phiên bản trước.

---

## 2. Kịch Bản Khôi Phục Nhanh (Fast Rollback Workflow)

Khi phát hiện sự cố nghiêm trọng trên production (ví dụ: màn hình trắng, lỗi hiển thị câu hỏi, chặn CSP ngoài dự kiến):

### Phương án A — Tái Triển Khai Bản Phát Hành Ổn Định Qua GitHub Actions (Dưới 3 phút)
Nếu bản build trước đó đã được tạo thành công:
1. Truy cập tab **Actions** trên GitHub repository: `https://github.com/DatMoiTapDev/netstudy-network-security/actions/workflows/pages.yml`.
2. Tìm workflow run thành công gần nhất trước thời điểm xảy ra sự cố (ví dụ: commit của Feature 005 hoặc bản phát hành trước).
3. Nhấn vào run đó và chọn **Re-run all jobs**.
4. GitHub Pages sẽ tải lại artifact đã được kiểm định của bản phát hành đó và phát hành ngay lập tức.

### Phương án B — Hoàn Tác Commit Mã Nguồn Qua Git Revert (Dưới 5 phút)
Nếu cần đưa mã nguồn của nhánh chính về trạng thái ổn định:
1. Kiểm tra lịch sử commit để xác định commit gây lỗi:
   ```bash
   git log -n 5 --oneline
   ```
2. Thực hiện lệnh `git revert` tạo một commit đảo ngược an toàn (không dùng `git reset --hard` hay force-push):
   ```bash
   git revert <commit-sha-gay-loi> -m "revert: rollback production to stable release"
   ```
3. Chạy toàn bộ các bài kiểm tra chất lượng trước khi đẩy lên main:
   ```bash
   node checks.cjs
   node checks-models.cjs
   node checks-perf.cjs
   node checks-learning.cjs
   npm run test:e2e
   ```
4. Đẩy commit revert lên nhánh `main` qua Pull Request hoặc merge an toàn:
   ```bash
   git push origin main
   ```
5. Workflow `.github/workflows/pages.yml` sẽ tự động kích hoạt, kiểm tra lại toàn bộ bài test và triển khai phiên bản đã revert lên GitHub Pages.

---

## 3. Danh Mục Kiểm Tra Sau Khi Khôi Phục (Post-Rollback Verification)

Ngay sau khi quá trình rollback hoàn tất:
1. Mở cửa sổ ẩn danh (Incognito Window) và truy cập trang sản xuất.
2. Nhấn `Ctrl + F5` để bỏ qua bộ nhớ đệm trình duyệt.
3. Kiểm tra Console trình duyệt (F12) để xác nhận không còn thông báo lỗi CSP hoặc JavaScript uncaught exceptions.
4. Mở tab `#settings` và kiểm tra khả năng nạp lại bản sao lưu JSON.
5. Thông báo cho người dùng về việc sự cố đã được xử lý và hướng dẫn làm mới trang nếu cần.
