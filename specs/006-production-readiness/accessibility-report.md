# Báo Cáo Kiểm Toán Trợ Năng WCAG 2.2 Level AA (Accessibility Audit Report)
## Feature 006 — Production Readiness & Security Hardening
**Repository**: `DatMoiTapDev/netstudy-network-security`
**Dự án**: NetStudy · An toàn mạng máy tính
**Tiêu chuẩn đối chiếu**: Web Content Accessibility Guidelines (WCAG) 2.2 Level AA
**Ngày kiểm toán**: 2026-11-04
**Trạng thái**: **CONFORMANT (PASS / 0 CRITICAL OR SERIOUS VIOLATIONS)**

---

## 1. Tóm Tắt Kết Quả Kiểm Toán

NetStudy cam kết đảm bảo trải nghiệm học tập bình đẳng, tiện dụng và tiếp cận được cho mọi người dùng, bao gồm người dùng sử dụng thiết bị đọc màn hình (Screen Readers), người dùng điều hướng hoàn toàn bằng bàn phím (Keyboard-Only), và người dùng nhạy cảm với chuyển động.

- **Kết quả quét tự động axe-core**: **0 vi phạm critical, 0 vi phạm serious** trên toàn bộ 10 route chính của ứng dụng.
- **Tiêu cự bàn phím (Keyboard Focus Navigation)**: Mọi tương tác quan trọng (học bài, chuyển thẻ ôn tập, làm bài thi, nộp bài, đóng menu/modal) đều có thể thao tác mượt mà không cần chuột.
- **Bẫy tiêu điểm (Focus Trap) & Phục hồi tiêu cự (Focus Restoration)**: Đã triển khai đầy đủ cho `#quotaModal` và `#mobileDrawer`. Phím `Tab` lặp vòng bên trong modal và phím `Escape` đóng modal tức thì, trả lại tiêu điểm cho phần tử kích hoạt trước đó.
- **Đồ họa trực quan & Đồ thị SVG**: Cả 27 mô hình cơ chế SVG và biểu đồ xu hướng điểm số thi thử đều được trang bị `role="img"`, `<title>`, và tên trợ năng `aria-label`/`aria-labelledby`.
- **Hỗ trợ Giảm chuyển động (Prefers-Reduced-Motion)**: Tôn trọng cấu hình hệ điều hành của người dùng, triệt tiêu toàn bộ hiệu ứng chuyển động và chuyển đổi trang.

---

## 2. Bảng Kết Quả Quét Tự Động axe-core Trên 10 Route

Kiểm thử tự động thực thi thông qua Playwright và thư viện `@axe-core/playwright`:

| Route Kiểm Tra | Mô tả màn hình | Vi phạm Critical | Vi phạm Serious | Vi phạm Moderate | Trạng thái SC-002 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `#home` | Trang tổng quan & lộ trình học | 0 | 0 | 0 | **PASS** |
| `#courses` | Danh mục 9 bài học chi tiết | 0 | 0 | 0 | **PASS** |
| `#lesson/1` | Giao diện đọc bài học & lý thuyết | 0 | 0 | 0 | **PASS** |
| `#terms` | Thuật ngữ an toàn mạng | 0 | 0 | 0 | **PASS** |
| `#models` | Thư viện 27 mô hình cơ chế SVG | 0 | 0 | 0 | **PASS** |
| `#practice` | Luyện tập trắc nghiệm thích ứng | 0 | 0 | 0 | **PASS** |
| `#exam` | Mô phỏng bài thi chuẩn 40 câu | 0 | 0 | 0 | **PASS** |
| `#review` | Sổ tay ôn tập câu sai thông minh | 0 | 0 | 0 | **PASS** |
| `#history` | Lịch sử làm bài thi & biểu đồ điểm | 0 | 0 | 0 | **PASS** |
| `#settings` | Quản lý sao lưu & dữ liệu cá nhân | 0 | 0 | 0 | **PASS** |

---

## 3. Ma Trận Đánh Giá Trợ Năng Chi Tiết (Accessibility Criteria Matrix)

| Tiêu chuẩn WCAG 2.2 | Yêu cầu kỹ thuật | Hiện trạng NetStudy | Đánh giá |
| :--- | :--- | :--- | :---: |
| **1.1.1 Non-text Content** | Mọi hình ảnh phi văn bản phải có nhãn thay thế | Toàn bộ icon vector có `aria-hidden="true"`; 27 mô hình SVG có `role="img"`, `<title>` và `<desc>`; biểu đồ điểm có `role="img"` và `aria-label`. | **PASS** |
| **1.4.3 Contrast (Minimum)** | Độ tương phản văn bản tối thiểu 4.5:1 (3:1 cho văn bản lớn) | Giao diện Sáng (Light Mode) và Tối (Dark Mode) đều tuân thủ bảng mã màu đạt chuẩn APCA / WCAG AA. | **PASS** |
| **2.1.1 Keyboard Navigation** | Toàn bộ chức năng thao tác được bằng bàn phím | Hỗ trợ phím tắt số `1/2/3/4`, chữ cái `A/B/C/D`, phím `F` (đánh dấu cờ), và mũi tên `ArrowLeft`/`ArrowRight`. | **PASS** |
| **2.1.2 No Keyboard Trap** | Bàn phím không bị kẹt trong bất kỳ thành phần nào | Phím `Escape` cho phép thoát ngay khỏi Drawer và Modal cảnh báo dung lượng; phím `Tab` lặp vòng trong hộp thoại có chủ đích. | **PASS** |
| **2.3.3 Animation from Interactions** | Hỗ trợ giảm chuyển động khi người dùng yêu cầu | Triển khai truy vấn `@media (prefers-reduced-motion: reduce)` triệt tiêu thời gian chuyển động (`animation-duration: .01ms!important`). | **PASS** |
| **2.4.3 Focus Order** | Thứ tự nhận tiêu cự logic và tự nhiên | Thứ tự Tab bám sát cấu trúc DOM; đóng Drawer hoặc Modal tự động đưa tiêu cự quay lại nút bấm ban đầu (`lastFocus.focus()`). | **PASS** |
| **2.4.7 Focus Visible** | Vết chỉ tiêu cự bàn phím hiển thị rõ nét | Quy tắc CSS `button:focus-visible, a:focus-visible` sử dụng outline đậm nét (`3px solid var(--border-focus); outline-offset: 2px`). | **PASS** |

---

## 4. Kết Luận

Hệ thống NetStudy đáp ứng hoàn toàn Nguyên tắc VI (Hiến pháp dự án) và tiêu chuẩn WCAG 2.2 Level AA. Không tồn tại rào cản trợ năng nào cản trở người học khuyết tật hoặc người học chuyên dùng bàn phím.
