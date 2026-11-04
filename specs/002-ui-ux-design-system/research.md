# Technical Research & Decision Log: NetStudy UI/UX Design System

**Feature**: `specs/002-ui-ux-design-system`
**Date**: 2026-11-04
**Status**: Completed

---

## 1. Research Overview

Tài liệu này tổng hợp các quyết định kỹ thuật và kiến trúc cho việc nâng cấp toàn diện giao diện NetStudy sang hệ thống thiết kế **UI/UX Pro Max**, hỗ trợ **Light/Dark Mode**, **Hệ thống Design Tokens 3 tầng**, **Biểu tượng vector SVG**, và **Điều hướng di động thân thiện**.

Toàn bộ các quyết định phải vượt qua các cổng kiểm soát (Gates) của [Hiến pháp dự án](file:///d:/TIENDAT2024-2025/netstudy-network-security/.specify/memory/constitution.md):
- **Nguyên tắc I (Vanilla-first)**: 100% HTML/CSS/JavaScript thuần, không đưa thêm bất kỳ framework hay build tool nào vào client bundle `dist/`.
- **Nguyên tắc II & III (Bảo toàn chức năng & Thuật toán)**: Giữ nguyên 9 chương, 264 câu trắc nghiệm, 27 mô hình, thuật toán sinh đề, seed `533`, tính điểm.
- **Nguyên tắc IV (Bảo vệ dữ liệu)**: Lưu trạng thái theme vào key riêng biệt, không tác động đến schema `netstudy-atmmt-v1`.
- **Nguyên tắc V & VI (UI UX Pro Max & WCAG 2.2 AA)**: Bảng màu Clean Cyber Emerald & Deep Cipher Slate, tương phản $\ge 4.5:1$, touch target $\ge 44\times 44\text{px}$.
- **Nguyên tắc VII & VIII (Bảo mật & Kiểm thử hồi quy)**: Zero runtime npm package, 100% test pass.

---

## 2. Technical Decisions & Rationale

### Decision 1: Kiến trúc Design Tokens 3 tầng bằng CSS Custom Properties thuần

- **Quyết định (Chosen)**: Triển khai 3 tầng biến CSS trực tiếp trong `dist/style.css`:
  1. *Primitive Tokens*: Hệ màu cơ bản (Emerald, Slate, Amber, Crimson), thang đo spacing (`4px` đến `48px`), radius (`4px` đến `9999px`), typography scale.
  2. *Semantic Tokens*: Biến ngữ nghĩa phụ thuộc ngữ cảnh và theme (`--bg-canvas`, `--bg-surface`, `--bg-surface-elevated`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-default`, `--border-focus`, `--accent-primary`, `--status-success`, `--status-warning`, `--status-danger`).
  3. *Component Tokens*: Biến chuyên biệt cho từng thành phần (`--btn-*`, `--card-*`, `--quiz-option-*`, `--qnav-*`, `--timer-*`, `--lesson-nav-*`).
- **Lý do chọn (Rationale)**:
  - Khả năng tương thích trình duyệt $100\%$ không cần thư viện bên ngoài.
  - Đổi màu toàn trang theo thời gian thực ($<16\text{ms}$, 60 FPS) chỉ bằng cách đổi thuộc tính `data-theme` trên thẻ `<html>`.
  - Phù hợp hoàn hảo với quy chuẩn thiết kế của `ui-ux-pro-max` và `design-system`.
- **Các giải pháp thay thế đã bị loại bỏ (Alternatives Rejected)**:
  - *Tailwind CSS CDN runtime*: Tải script JS nặng gần 300KB vào runtime, vi phạm Nguyên tắc I và VII.
  - *Sass / SCSS build tool*: Đòi hỏi thiết lập chuỗi công cụ Node build phức tạp, vi phạm nguyên tắc zero-overhead portable client.
  - *Hardcoded CSS utility classes*: Khó bảo trì, không thể chuyển đổi theme linh hoạt.

---

### Decision 2: Kiến trúc Chuyển đổi Theme (Light / Dark / System) & Chống Chớp Trắng (Zero FOUC)

- **Quyết định (Chosen)**:
  - Hỗ trợ 3 chế độ: `'light'`, `'dark'`, `'system'`.
  - Lưu cấu hình vào `localStorage.getItem('netstudy-theme')`.
  - **Cơ chế chống FOUC**: Đặt một đoạn script ngắn $<200\text{B}$ đồng bộ ngay trong thẻ `<head>` của `dist/index.html`:
    ```javascript
    (function(){
      const t = localStorage.getItem('netstudy-theme') || 'system';
      const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    })();
    ```
  - Khi người dùng chọn chế độ `system`, ứng dụng lắng nghe sự kiện `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ...)` để tự động đổi màu khi hệ điều hành thay đổi giữa ngày và đêm.
- **Lý do chọn (Rationale)**:
  - Chạy trước khi DOM Parser bắt đầu dựng cây và render, triệt tiêu $100\%$ hiện tượng chớp trắng (white flash).
  - Tách rời hoàn toàn khỏi khóa dữ liệu học tập `netstudy-atmmt-v1`, bảo toàn tính an toàn tuyệt đối cho lịch sử thi và bài làm dở.
- **Các giải pháp thay thế đã bị loại bỏ**:
  - *Gán class trong `app.js` khi DOMContentLoaded*: Khiến màn hình bị nhấp nháy sáng trắng trong 50-100ms đối với người dùng đang ở chế độ Dark Mode.
  - *Gộp trường `theme` vào `state` của `StudyCore`*: Phải sửa đổi hàm `C.validate()` và schema backup, tạo rủi ro làm hỏng dữ liệu của người dùng cũ.

---

### Decision 3: Hệ thống Biểu tượng Vector SVG Nội tuyến (Inline SVG Catalog)

- **Quyết định (Chosen)**:
  - Xây dựng một helper gọn nhẹ trong `dist/app.js`: `function icon(name, cls = '', size = 20)` trả về chuỗi SVG chuẩn hóa.
  - Quy chuẩn SVG:
    - `viewBox="0 0 24 24"`, `width="${size}"`, `height="${size}"`.
    - `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
    - `aria-hidden="true"` mặc định cho biểu tượng trang trí.
  - Danh mục 14 biểu tượng cốt lõi:
    1. `home`: Trang chủ / Tổng quan.
    2. `book`: Giáo trình.
    3. `term`: Thuật ngữ / Từ điển.
    4. `model`: Mô hình tương tác.
    5. `practice`: Luyện tập trắc nghiệm.
    6. `exam`: Thi thử / Đồng hồ.
    7. `notebook`: Sổ ôn tập.
    8. `history`: Lịch sử học tập.
    9. `sources`: Nguồn tài liệu PDF.
    10. `settings`: Dữ liệu cá nhân.
    11. `sun` / `moon`: Nút chuyển đổi Light/Dark theme.
    12. `star` / `star-filled`: Cắm cờ xem lại & lưu câu hỏi.
    13. `check`: Đánh dấu đã học mục lý thuyết.
    14. `menu` / `close`: Đóng mở menu di động.
- **Lý do chọn (Rationale)**:
  - Tổng kích thước mã JavaScript thêm vào chỉ khoảng $3.5\text{KB}$ uncompressed.
  - Tự động đổi màu theo màu chữ của phần tử cha nhờ `stroke="currentColor"`.
  - Hoạt động offline $100\%$, không cần kết nối internet hay CDN font ngoại vi.
  - Thay thế hoàn toàn các emoji thô (`⌂`, `▤`, `◷`, `◇`, `☆`, `★`, `✓`).
- **Các giải pháp thay thế đã bị loại bỏ**:
  - *Font Awesome / Lucide Webfont qua CDN*: Phụ thuộc kết nối mạng bên ngoài, vi phạm Nguyên tắc IV (Local-first & offline) và VII (Bảo mật CSP).
  - *Tệp `.svg` rời tải bằng thẻ `<img>`*: Gây ra hàng chục HTTP request tĩnh, khó đổi màu theo theme bằng CSS và gây giật layout khi tải trang chậm.

---

### Decision 4: Điều hướng Di động Thân thiện (Thumb-Zone Mobile Navigation)

- **Quyết định (Chosen)**:
  - Desktop ($\ge 1100\text{px}$): Sidebar bên trái rộng $242\text{px}$ cố định, bố cục thoáng đãng.
  - Tablet ($761\text{px}$ – $1099\text{px}$): Sidebar thu gọn $205\text{px}$.
  - Mobile ($\le 760\text{px}$):
    - Loại bỏ thanh cuộn ngang `nav { overflow-x: auto }` hiện tại.
    - Bổ sung **Bottom Navigation Bar** cố định ở chân màn hình chứa 4 lối tắt chính tiện bấm ngón cái: **Tổng quan (`home`)**, **Giáo trình (`courses`)**, **Luyện tập (`practice`)**, **Thi thử (`exam`)**, và nút **Thêm (`menu`)**.
    - Khi bấm nút "Thêm", một **Mobile Drawer** trượt mượt mà từ đáy hoặc cạnh bên để truy cập các mục còn lại: Thuật ngữ, Mô hình, Sổ ôn tập, Lịch sử, Nguồn, Cài đặt và Nút đổi Theme.
    - Mọi nút bấm trắc nghiệm và điều hướng đều có diện tích chạm tối thiểu $44\times 44\text{px}$.
- **Lý do chọn (Rationale)**:
  - Phù hợp với tư thế cầm điện thoại bằng một tay của học viên (quy tắc ngón cái — thumb zone).
  - Màn hình làm bài thi 40 câu không bị thanh cuộn làm che khuất hay phân tâm.
- **Các giải pháp thay thế đã bị loại bỏ**:
  - *Chỉ dùng một nút Hamburger trên cùng*: Màn hình điện thoại hiện đại quá dài, người dùng rất khó với ngón tay lên góc trên cùng bên trái.

---

### Decision 5: Tương thích 27 Mô hình Trực quan (SVG Interactive Models) trong Dark Mode

- **Quyết định (Chosen)**:
  - Kiểm tra `dist/model-ui.js` và `dist/models.js`:
    - Các mô hình trực quan (DES, AES, RSA, Diffie-Hellman, SHA-2, Firewall, v.v.) hiện sử dụng các màu stroke/fill cứng như `#1c3433`, `#ffffff`, `#edf2e8`.
    - Trong Dark Mode, các khung hộp SVG, đường nối node, và nhãn chữ kỹ thuật sẽ được liên kết với biến CSS:
      `stroke="var(--model-node-stroke)"`, `fill="var(--model-node-bg)"`, `color="var(--text-primary)"`.
    - Thêm các quy tắc CSS chuyên biệt trong `dist/style.css` cho các thẻ SVG của mô hình:
      ```css
      [data-theme="dark"] .model-stage svg { background: var(--bg-surface-elevated); }
      [data-theme="dark"] .model-node { fill: var(--bg-surface); stroke: var(--border-default); }
      [data-theme="dark"] .model-label { fill: var(--text-primary); }
      ```
- **Lý do chọn (Rationale)**:
  - Giữ nguyên cấu trúc dữ liệu của 27 mô hình trong `dist/models.js` mà không phải biên soạn lại từ nguồn.
  - Đảm bảo các ví dụ số học (RSA, DH, OTP) trong 112 bước đều tương phản sắc nét trên nền tối.

---

### Decision 6: Bảo toàn Tuyệt đối Cải tiến của Feature 001

- **Quyết định (Chosen)**:
  - Toàn bộ các hàm cập nhật DOM cục bộ đã phát triển trong Feature 001:
    - `safeFocus(el, preventScroll)`
    - `updateOptionSelection(optIdx, triggerEl)`
    - `updateFlagState(triggerEl)`
    - `updateSectionCompletion(chId, secId, triggerEl)`
    - `updateBookmarkState(qid, triggerEl)`
  - Bộ lắng nghe phím tắt `keydown` (1–4, A–D, F, Arrows, P/N) và bộ lọc bảo vệ ô nhập liệu.
  - Cơ chế đồng hồ đếm ngược và tự động nộp bài khi hết 75 phút.
  - **Tất cả các thành phần trên được bảo toàn nguyên vẹn 100%**. Thay đổi duy nhất là các class CSS được áp dụng hệ màu mới từ Design Tokens.

---

## 3. Bảng Tổng hợp Quyết định (Decision Matrix)

| Chủ đề | Quyết định đã chọn | Lý do chính | Rủi ro & Cách khắc phục |
|:---|:---|:---|:---|
| **Design Tokens** | CSS Custom Properties 3 tầng thuần | Chuẩn W3C, 0 byte thư viện, siêu nhanh | Thiếu fallback trình duyệt cổ $\rightarrow$ Không cần vì dự án nhắm tới trình duyệt hiện đại. |
| **Dark Mode** | Dual-Palette (Emerald / Slate) | Tính chuyên nghiệp cao của ngành an toàn thông tin | Chớp trắng (FOUC) $\rightarrow$ Khắc phục bằng script `<head>` đồng bộ. |
| **Icons** | Inline SVG helper `icon(name)` | 100% vector sắc nét, offline, đổi màu theo chữ | Dung lượng JS tăng nhẹ $\rightarrow$ Giới hạn 14 icon cốt lõi, tối ưu SVG path ($<4\text{KB}$). |
| **Mobile Nav** | Bottom Bar + Mobile Drawer | Chuẩn thumb-zone, vùng chạm $\ge 44\text{px}$ | Trùng lặp thanh điều hướng $\rightarrow$ Ẩn sidebar trên mobile, ẩn bottom bar trên desktop qua media query. |
| **27 Models** | CSS Variable Mapping cho SVG | Giữ nguyên dữ liệu mô hình, bảo vệ test logic | Một số SVG edge màu mờ $\rightarrow$ Thiết lập `--model-edge-active` tương phản cao. |
