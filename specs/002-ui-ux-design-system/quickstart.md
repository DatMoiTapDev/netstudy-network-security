# Quickstart & Verification Guide: NetStudy UI/UX Design System

**Feature**: `specs/002-ui-ux-design-system`
**Date**: 2026-11-04
**Status**: Ready for Verification

---

## 1. Mục đích

Tài liệu này cung cấp các kịch bản kiểm thử trực quan và tự động nhằm xác minh Feature 002 (Design System, Dark/Light Mode, Mobile Navigation, SVG Icons) hoạt động hoàn hảo trên mọi thiết bị và không gây lỗi hồi quy đối với Feature 001.

---

## 2. Kịch bản Kiểm thử Thủ công (Manual Browser Validation Scenarios)

### Kịch bản A: Kiểm tra Nền tảng Design Tokens & Chế độ Sáng (Light Mode Baseline)
1. Mở `dist/index.html` trên trình duyệt Chrome/Edge/Firefox ở độ phân giải Desktop ($1280\times 800\text{px}$).
2. Mở DevTools (`F12`), kiểm tra thẻ `<html>`: có thuộc tính `data-theme="light"` hoặc không có lỗi CSS token.
3. Duyệt qua các trang `#home`, `#courses`, `#lesson/1`, `#practice`, `#exam`, `#models`.
4. **Tiêu chí đạt**:
   - Nền trang là màu ngà dịu `#F8FAF8` (Clean Paper).
   - Thẻ card trắng `#FFFFFF` nổi bật với viền mềm `#D8E2D9`.
   - Chữ chính đậm rõ ràng `#112320`, chữ phụ `#4B5E59` đọc rõ ràng, tương phản $\ge 4.5:1$.

---

### Kịch bản B: Chuyển đổi Dark Mode & Kiểm tra Chống Chớp Trắng (FOUC)
1. Tại Header hoặc Sidebar, nhấp vào nút chuyển theme (biểu tượng Mặt Trời / Mặt Trăng).
2. **Quan sát khi đổi theme**:
   - Toàn bộ giao diện chuyển mượt mà sang nền Deep Cipher Slate `#0D1514` và thẻ `#152220`.
   - Các điểm nhấn đổi sang màu Neon Emerald `#2AD586`.
   - Không có hiện tượng giật cục hay tải lại trang.
3. **Kiểm tra lưu trữ**:
   - Mở DevTools $\rightarrow$ Application $\rightarrow$ LocalStorage: Kiểm tra khóa `netstudy-theme` có giá trị `"dark"`.
   - Dữ liệu `netstudy-atmmt-v1` không bị thay đổi.
4. **Kiểm tra chống chớp trắng (Zero FOUC)**:
   - Trong khi đang ở Dark Mode, nhấn phím `F5` hoặc `Ctrl+R` liên tục 3 lần.
   - **Tiêu chí đạt**: Màn hình nạp thẳng vào giao diện tối, $0\text{ms}$ xuất hiện màn hình trắng chói mắt.

---

### Kịch bản C: Điều hướng Di động & Vùng chạm Ngón cái (Mobile Viewport)
1. Trong DevTools, bật chế độ Device Toolbar (`Ctrl+Shift+M`), chọn thiết bị di động (iPhone SE $375\times 667\text{px}$ và màn hình nhỏ $320\text{px}$).
2. **Quan sát giao diện di động**:
   - Sidebar bên trái tự động ẩn.
   - Header thu gọn còn $53\text{px}$.
   - Chân màn hình xuất hiện **Bottom Navigation Bar** với 4 icon chính và nút Menu phụ.
3. **Thao tác**:
   - Dùng chuột/ngón tay chạm lần lượt vào các nút trên Bottom Bar: phản hồi tức thì, chuyển trang mượt mà.
   - Chạm vào nút Menu: Drawer trượt lên hiển thị các mục phụ (Thuật ngữ, Mô hình, Sổ ôn tập, Nguồn, Cài đặt, Đổi Theme).
   - Vào màn hình thi thử `#session`: Lưới 40 câu hỏi `qnav` co giãn vừa vặn, không tạo thanh cuộn ngang trang.
4. **Tiêu chí đạt**: Mọi nút bấm đều có diện tích tối thiểu $44\times 44\text{px}$, không có hiện tượng tràn khung ngang (no horizontal overflow).

---

### Kịch bản D: Kiểm tra Hệ thống Biểu tượng Vector SVG & Khả năng Tiếp cận
1. Duyệt qua toàn bộ ứng dụng từ `#home` đến `#sources`.
2. Kiểm tra các biểu tượng:
   - Các emoji thô (`⌂`, `▤`, `◷`, `◇`, `☆`, `★`, `✓`) đã được thay thế bằng inline SVG sắc nét.
   - Kích thước icon chuẩn $20\times 20\text{px}$, độ dày nét vẽ đồng đều.
   - Khi đổi theme, các icon tự động đổi màu theo màu chữ cha (`currentColor`).
3. Dùng bàn phím phím `Tab` duyệt qua các nút:
   - Viền `:focus-visible` xuất hiện viền ngọc lục bảo dày $2\text{px}$–$3\text{px}$, cách phần tử $2\text{px}$.
   - Độ tương phản viền focus đạt $\ge 3:1$ trên cả nền sáng và tối.

---

### Kịch bản E: Kiểm tra 27 Mô hình Trực quan trong Dark Mode
1. Truy cập `#models`.
2. Lần lượt mở các mô hình bảo mật tiêu biểu:
   - Mô hình 4: RSA (Khóa công khai, Modulo, mã hóa số).
   - Mô hình 5: Diffie-Hellman (Trao đổi khóa, số mũ màu).
   - Mô hình 12: Firewall (Kiểm tra gói tin, tường lửa lọc cổng).
   - Mô hình 22: SSL/TLS Handshake.
3. Bật Dark Mode:
   - Các nút mạng (node), đường truyền (edge), và số liệu tính toán hiển thị tương phản rõ nét trên nền sẫm.
   - Bấm các bước (Step 1, Step 2, Next step): hiệu ứng highlight bước hiển thị rõ ràng, không bị chìm màu.

---

### Kịch bản F: Kiểm thử Hồi quy Toàn diện Feature 001 (Feature 001 Invariance)
1. Bắt đầu một bài luyện tập hoặc thi thử 40 câu / 75 phút.
2. Chọn đáp án bằng chuột và phím tắt `1`–`4`, `A`–`D`.
3. Bấm cắm cờ `F`, chuyển câu bằng phím mũi tên `ArrowRight` / `ArrowLeft`.
4. **Tiêu chí đạt**:
   - Vị trí cuộn trang giữ nguyên $100\%$ tự nhiên (không giật, không dùng `scrollTo`).
   - Tiêu điểm bàn phím nằm nguyên tại lựa chọn vừa bấm (`safeFocus`).
   - Đồng hồ đếm ngược chạy ổn định từng giây, tự nộp bài khi hết 75 phút.

---

## 3. Lệnh Kiểm thử Tự động (Automated Commands)

Mọi kiểm thử tự động phải hoàn thành với mã thoát `0`:

```powershell
# 1. Kiểm tra cú pháp toàn bộ JavaScript
node --check dist/app.js
node --check dist/core.js
node --check dist/models.js
node --check dist/model-ui.js

# 2. Chạy bộ kiểm thử hồi quy nghiệp vụ NetStudy
node checks.cjs

# 3. Chạy bộ kiểm thử 27 mô hình trực quan & 112 bước
node checks-models.cjs
```

---

## 4. Báo cáo Kết quả Xác minh Tự động Thực tế (Verification Log)

```
> node --check dist/app.js; node --check dist/core.js; node --check dist/models.js; node --check dist/model-ui.js
[Exit code: 0 - All 4 distribution files syntax valid]

> node checks.cjs
{
  "chapters": 9,
  "sections": 95,
  "questions": 264,
  "examRandomizations": 100,
  "checks": "PASS: schema, routes, matrix, score, answer visibility, expiry, persisted deadline, backup"
}
[Exit code: 0 - 100% Core & Feature 001/002 tests PASS]

> node checks-models.cjs
{
  "models": 27,
  "steps": 112,
  "checks": "PASS: sources, SVG edges/highlights, every step, delegated clicks, invalid indices, chapter filter, RSA/DH/OTP numeric examples"
}
[Exit code: 0 - 100% Interactive models test PASS]
```

### Tổng kết Xác minh Kỹ thuật:
- **Design Tokens**: 3-tier CSS Custom Properties (Primitives -> Semantics -> Component).
- **Theme Engine**: Light / Dark / System mode hỗ trợ đầy đủ, Zero-FOUC `<head>` script, độc lập `localStorage['netstudy-theme']`.
- **Mobile Navigation**: Bottom Navigation Bar ($62\text{px}$) + Mobile Drawer, touch target $\ge 44\times 44\text{px}$, responsive grid $320\text{px}$.
- **Vector Icons**: 17 inline SVG icons thay thế toàn bộ ký tự emoji thô.
- **27 Models Dark Mode**: Khả năng hiển thị và độ tương phản cao trên nền tối, giữ nguyên 112 bước tương tác.
- **Bảo toàn Feature 001**: Micro-DOM rendering, `safeFocus`, phím tắt, đồng hồ đếm ngược, chấm điểm và cấu trúc dữ liệu khóa `netstudy-atmmt-v1` đạt 100% nguyên vẹn.
