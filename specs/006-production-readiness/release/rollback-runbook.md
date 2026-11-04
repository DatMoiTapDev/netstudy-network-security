# Sổ Tay Khôi Phục Khẩn Cấp (Production Rollback Runbook)
## NetStudy · An toàn mạng máy tính
**Repository**: `DatMoiTapDev/netstudy-network-security`  
**Known Good Production Commit SHA**: `74e58c3f560aab6a0552115b5368845aceb63f1f`  
**Thời Gian Khôi Phục Mục Tiêu (RTO)**: $\le 5\text{ phút}$  
**Bảo Toàn Dữ Liệu Học Tập (RPO)**: 0 dữ liệu bị mất

---

## 1. Khi Nào Bắt Buộc Phải Rollback (Rollback Triggers)

Lập tức kích hoạt rollback nếu gặp một trong các sự cố sau trên trang sản xuất:
1. **Lỗi Trắng Trang (Blank Screen)**: Lỗi cú pháp hoặc runtime exception khiến router không thể khởi động.
2. **CSP Chặn Tài Nguyên**: Chính sách Meta CSP vô tình chặn các script hoặc stylesheet nội bộ, làm mất giao diện.
3. **Mất Khả Năng Nộp Bài Thi**: Đề thi 40 câu không thể nộp bài hoặc bộ đếm thời gian bị treo.
4. **Lỗi Tràn Bộ Nhớ / Treo Trình Duyệt**: Thao tác mở sơ đồ hoặc làm bài thi gây crash tab trình duyệt.

---

## 2. Kịch Bản Khôi Phục 1: Tái Triển Khai Bản Build Cũ Qua GitHub Actions (Dưới 3 phút)

Đây là phương pháp nhanh nhất và không cần đụng chạm mã nguồn Git:
1. Truy cập: `https://github.com/DatMoiTapDev/netstudy-network-security/actions/workflows/pages.yml`
2. Tìm workflow run thành công gần nhất trước thời điểm triển khai lỗi (Run ứng với commit `74e58c3`).
3. Nhấp vào run đó, bấm vào nút **Re-run all jobs**.
4. GitHub Pages sẽ tải lại gói artifact đã được kiểm định của bản phát hành trước và xuất bản ngay lập tức.

---

## 3. Kịch Bản Khôi Phục 2: Hoàn Tác Commit Trên Nhánh Main Qua Git Revert (Dưới 5 phút)

Nếu cần đưa nhánh `main` về lại trạng thái mã nguồn cũ:
1. Mở terminal và chuyển về nhánh `main`:
   ```powershell
   git checkout main
   git pull origin main
   ```
2. Thực hiện lệnh revert commit phát hành vừa rồi:
   ```powershell
   git revert -m 1 <commit-merge-sha> -m "revert: emergency rollback production"
   ```
3. Đẩy commit revert lên `main`:
   ```powershell
   git push origin main
   ```
4. Workflow GitHub Pages sẽ tự động kích hoạt, kiểm tra và xuất bản phiên bản đã hoàn tác.

---

## 4. Tác Động Dữ Liệu Học Tập Khi Rollback (Critical Data Architecture Note)

- **Nguyên lý Local-First**: Dữ liệu người học lưu tại trình duyệt (`localStorage`), không lưu tại server.
- **Tương thích ngược Schema**:
  - Mã nguồn cũ (`74e58c3`) chỉ nhận diện `version: 1`.
  - Nếu người dùng đã mở bản mới (đã được nâng cấp lên `version: 2`), mã nguồn cũ khi tải lại sẽ bắt lỗi và thông báo: `Không đọc được dữ liệu đã lưu. Hãy nhập bản sao lưu nếu có.`
  - Dữ liệu `version: 2` trong `localStorage` **KHÔNG BỊ XÓA**.
  - Ngay khi sản phẩm được nâng cấp lại lên bản sửa lỗi, toàn bộ dữ liệu sẽ tự động hiển thị bình thường.
