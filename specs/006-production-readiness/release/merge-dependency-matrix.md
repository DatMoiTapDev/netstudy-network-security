# Ma Trận Phụ Thuộc Hợp Nhất Nhánh Git (Merge Dependency Matrix)
## NetStudy · An toàn mạng máy tính
**Repository**: `DatMoiTapDev/netstudy-network-security`  
**Ngày lập**: 2026-11-04  
**Trạng thái phân tích**: **LINEAR STACK IDENTIFIED (CẦN PUSH LÊN REMOTE TRƯỚC KHI MERGE)**

---

## 1. Bảng Ma Trận Phụ Thuộc Từng Feature

| Feature | Nhánh Nguồn (Source Branch) | Nhánh Cơ Sở (Base Branch) | Pull Request URL | Trạng Thái Merge | Các Commit Còn Thiếu Trên Remote | Hành Động Đề Xuất (Recommended Action) |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **001** | `chore/setup-ai-workflow` | `main` (`74e58c3`) | *Chưa mở* | Chưa merge vào `origin/main` | `f63f2a5`, `59ff588` | Nhánh đã có trên origin. Đã được kế thừa tuyến tính trong các feature tiếp theo. |
| **002** | `feat/002-ui-ux-design-system` | `chore/setup-ai-workflow` | *Chưa mở* | Chưa merge vào `origin/main` | `a091ad3` | Nhánh chỉ có ở local. Đã được tích hợp vào `local main`. |
| **003** | `feat/003-performance-optimization` | `feat/002-ui-ux-design-system` | *Chưa mở* | Chưa merge | `8baf1f2` | Nhánh chỉ có ở local. Là base trực tiếp của Feature 004. |
| **004** | `feat/004-learning-experience-smart-review` | `feat/003-performance-optimization` | *Chưa mở* | Chưa merge | `c3373fc` | Nhánh chỉ có ở local. Là base trực tiếp của Feature 005. |
| **005** | `feat/005-testing-reliability` | `feat/004-learning-experience-smart-review` | *Chưa mở* | Chưa merge | `f3c99b2` | Nhánh chỉ có ở local. **Bắt buộc đẩy lên origin trước để làm base cho Feature 006**. |
| **006** | `feat/006-production-readiness` | `feat/005-testing-reliability` | *Chưa mở* | Chưa merge | `6f15678` | Nhánh chỉ có ở local. **Ứng viên phát hành tổng thể (Release Candidate)**. |

---

## 2. Thứ Tự Merge An Toàn Khuyến Nghị (Safe Merge Sequence)

Do toàn bộ 7 commits tạo thành một chuỗi tuyến tính hoàn hảo không xung đột:

### Lựa Chọn A — Hợp Nhất Trực Tiếp Qua Release PR (Khuyến nghị cao nhất)
Thay vì phải mở 6 PR nối tiếp nhau và đợi CI chạy 6 lần, Release Manager có thể:
1. Đẩy nhánh `feat/006-production-readiness` lên remote.
2. Mở 1 PR duy nhất: `feat/006-production-readiness` $\rightarrow$ `main`.
3. PR này chứa đầy đủ toàn bộ 7 commits từ Feature 001 đến Feature 006.
4. CI workflow sẽ kiểm tra toàn diện một lượt duy nhất.
5. Merge PR này vào `main` để kích hoạt triển khai lên GitHub Pages an toàn.

### Lựa Chọn B — Mô Hình Stacked PRs (Nếu quy trình bắt buộc nghiệm thu từng nhánh)
1. Đẩy `feat/005-testing-reliability` lên origin $\rightarrow$ Mở PR vào `main` $\rightarrow$ Chờ CI pass $\rightarrow$ Merge.
2. Đẩy `feat/006-production-readiness` lên origin $\rightarrow$ Mở PR vào `main` $\rightarrow$ Chờ CI pass $\rightarrow$ Merge.
