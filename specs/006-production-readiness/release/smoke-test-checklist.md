# Danh Mục Kiểm Thử Khói Sau Triển Khai (Production Smoke Test Checklist)
## NetStudy · An toàn mạng máy tính
**Môi Trường Kiểm Tra**: Production Live Site (`https://DatMoiTapDev.github.io/netstudy-network-security/`)  
**Phương Thức**: Cửa sổ ẩn danh (Incognito Window) để tránh ảnh hưởng bởi cache cũ  
**Ngày Kiểm Tra**: ____________________  
**Người Kiểm Tra**: ____________________  

---

## Danh Mục 17 Hạng Mục Kiểm Tra Thực Tế (Post-Deploy Smoke Tests)

| STT | Hạng Mục Kiểm Tra | Thao Tác Thực Hiện | Kết Quả Mong Đợi | Trạng Thái |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Trang Chủ NetStudy** | Mở URL gốc trang web | Tiêu đề hiển thị đúng, hero banner đầy đủ, tiến độ học tập hiển thị rõ ràng | [ ] PASS |
| **2** | **Danh Sách 9 Chương** | Nhấp vào mục `Giáo trình` (`#courses`) | Hiển thị đủ 9 bài học (từ Bài 1 đến Bài 8, bao gồm 2a và 2b) | [ ] PASS |
| **3** | **95 Mục Lý Thuyết** | Mở một bài học bất kỳ (`#lesson/1`) | Danh mục mục bài học cuộn mượt, hiển thị đầy đủ văn bản và nguồn PDF | [ ] PASS |
| **4** | **264 Câu Hỏi Trắc Nghiệm** | Mở phần luyện tập của Bài 1 | Đầy đủ các câu hỏi, 4 đáp án A/B/C/D, nhấn vào hiện giải thích chi tiết | [ ] PASS |
| **5** | **Điều Hướng Desktop & Mobile** | Thu nhỏ trình duyệt về kích thước điện thoại | Thanh điều hướng dưới cùng hiển thị, menu Drawer mở/đóng bằng nút và phím Escape | [ ] PASS |
| **6** | **Hệ Thống Theme Sáng/Tối/Tự Động**| Nhấn nút chuyển theme ở góc trên bên phải | Chuyển mượt mà qua Sáng -> Tối -> Tự động, lưu trạng thái vào localStorage | [ ] PASS |
| **7** | **Luyện Tập Trắc Nghiệm** | Làm 3 câu hỏi trong chế độ Luyện tập | Phím tắt 1/2/3/4 nhận đáp án, cập nhật tức thì màu sắc đúng/sai | [ ] PASS |
| **8** | **Kỳ Thi Thử 40 Câu / 75 Phút** | Nhấp vào nút `40 câu · 75 phút` (`#exam`) | Đồng hồ đếm ngược 75:00 bắt đầu chạy, danh sách 40 câu hỏi tải chuẩn ma trận | [ ] PASS |
| **9** | **Sổ Tay Ôn Tập (Smart Review)** | Nhấp vào mục `Sổ ôn tập` (`#review`) | 4 tab (Cần ôn tập, Đang củng cố, Đã thành thạo, Đánh dấu sao) hiển thị đúng số liệu | [ ] PASS |
| **10**| **Luyện Tập Thích Ứng (Adaptive)** | Chọn preset `10 câu hay sai nhất` | Khởi tạo phiên luyện tập chính xác, không trùng lặp câu hỏi | [ ] PASS |
| **11**| **Bảng Điều Khiển (Dashboard)** | Xem phần tiến độ tại trang chủ | Thanh phần trăm hoàn thành và tỷ lệ nắm vững hiển thị đúng | [ ] PASS |
| **12**| **Phân Tích Thi Cử (Exam Analytics)**| Xem kết quả sau khi nộp bài thi thử | Phân tích điểm theo từng chương, cảnh báo chương yếu (<70%) xuất hiện badge đỏ | [ ] PASS |
| **13**| **Lịch Sử Học Tập (History)** | Mở mục `Lịch sử` (`#history`) | Danh sách các phiên làm bài trước hiển thị, lọc theo dạng bài hoạt động tốt | [ ] PASS |
| **14**| **27 Mô Hình Tương Tác SVG** | Mở mục `Mô hình trực quan` (`#models`) | Đủ 27 mô hình, bấm nút bước tiếp theo làm sáng các mũi tên và thành phần | [ ] PASS |
| **15**| **Xuất / Nhập Sao Lưu JSON** | Vào `#settings`, xuất sao lưu và nhập lại | Tệp tải về thành công; nhập lại hiển thị thông báo xác nhận và khôi phục đúng | [ ] PASS |
| **16**| **Kiểm Tra Console Trình Duyệt** | Bấm `F12` kiểm tra tab Console | 0 lỗi uncaught exceptions, 0 cảnh báo vi phạm CSP | [ ] PASS |
| **17**| **Kiểm Tra Asset Loading & 404** | Kiểm tra tab Network và thử mở đường dẫn sai | 100% tài nguyên nạp mã 200/304; đường dẫn sai tự chuyển về trang chủ qua 404.html | [ ] PASS |
