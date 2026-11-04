# Interface & Theme Contract: NetStudy UI/UX Design System

**Feature**: `specs/002-ui-ux-design-system`
**Date**: 2026-11-04
**Status**: Completed

---

## 1. Theme Management API Contract

Giao diện JavaScript thuần quản lý trạng thái theme trên client.

```javascript
/**
 * @typedef {'light' | 'dark' | 'system'} ThemeMode
 */

/**
 * Lấy tùy chọn theme hiện tại của người dùng
 * @returns {ThemeMode}
 */
function getThemeMode();

/**
 * Đặt chế độ theme và cập nhật thuộc tính DOM ngay lập tức
 * @param {ThemeMode} mode
 */
function setThemeMode(mode);

/**
 * Chuyển đổi nhanh qua lại giữa các theme: light -> dark -> system -> light
 */
function cycleThemeMode();

/**
 * Phân giải theme thực tế thành 'light' hoặc 'dark'
 * @param {ThemeMode} [mode]
 * @returns {'light' | 'dark'}
 */
function getResolvedTheme(mode);
```

### Invariant Rules
1. `setThemeMode` PHẢI cập nhật `document.documentElement.dataset.theme = resolved` một cách đồng bộ.
2. `setThemeMode` PHẢI lưu vào `localStorage.setItem('netstudy-theme', mode)`.
3. Khi `mode === 'system'`, hệ thống PHẢI đăng ký lắng nghe sự kiện `change` trên `window.matchMedia('(prefers-color-scheme: dark)')` để tự động phản ứng khi hệ điều hành đổi theme.
4. Quá trình đổi theme KHÔNG ĐƯỢC làm mất tiêu điểm bàn phím hiện tại hoặc kích hoạt `render()` toàn trang (tránh gián đoạn bài thi đang làm).

---

## 2. Icon Component Contract

Hàm sinh chuỗi SVG an toàn, chuẩn ngữ nghĩa W3C.

```javascript
/**
 * Trả về chuỗi HTML SVG cho biểu tượng tương ứng
 * @param {string} name - Tên icon (home, book, term, model, practice, exam, notebook, history, sources, settings, sun, moon, star, check, menu, close)
 * @param {string} [cls=''] - Class CSS bổ sung
 * @param {number} [size=20] - Kích thước vuông (pixels)
 * @param {string} [label] - Nhãn trợ năng aria-label (nếu icon hoạt động như nút độc lập)
 * @returns {string} - Chuỗi thẻ <svg>...</svg>
 */
function icon(name, cls = '', size = 20, label = '');
```

### Invariant Rules
1. Nếu `label` rỗng hoặc không truyền: thẻ `<svg>` PHẢI có thuộc tính `aria-hidden="true"`.
2. Nếu `label` có giá trị: thẻ `<svg>` PHẢI có thuộc tính `role="img"` và `aria-label="${e(label)}"`.
3. Kích thước `width` và `height` phải đồng bộ với tham số `size`.
4. Màu nét vẽ (`stroke`) mặc định là `currentColor` để icon tự động kế thừa màu chữ của phần tử bao bọc nó.

---

## 3. CSS Variable Mapping Contract

Mọi quy tắc định kiểu trong `dist/style.css` và `dist/model-ui.js` PHẢI tuân thủ hợp đồng ánh xạ biến sau:

| Tên biến CSS | Mục đích sử dụng | Giá trị Fallback bắt buộc |
|:---|:---|:---|
| `--bg-canvas` | Màu nền trang chính | `#f8faf8` |
| `--bg-surface` | Màu nền thẻ card / modal | `#ffffff` |
| `--bg-surface-elevated` | Màu nền header / sidebar nổi | `#f0f4f1` |
| `--bg-subtle` | Màu nền bảng / ví dụ / code | `#edf4ef` |
| `--text-primary` | Màu văn bản tiêu đề & nội dung chính | `#112320` |
| `--text-secondary` | Màu văn bản phụ / nhãn | `#334641` |
| `--text-muted` | Màu văn bản ghi chú / footer | `#4b5e59` |
| `--border-default` | Đường phân cách / viền thẻ | `#d8e2d9` |
| `--border-focus` | Viền hiển thị khi focus bàn phím | `#15634f` |
| `--accent-primary` | Màu nhận diện thương hiệu nút chính | `#15634f` |
| `--status-success-bg` | Nền thông báo đúng / đã hoàn thành | `#edf6ee` |
| `--status-success-text` | Chữ trạng thái đúng | `#15803d` |
| `--status-error-bg` | Nền thông báo sai | `#fff0ed` |
| `--status-error-text` | Chữ trạng thái sai | `#b91c1c` |
| `--status-flag-color` | Màu cờ đánh dấu xem lại | `#d97706` |

---

## 4. Responsive Breakpoints & Navigation Contract

| Breakpoint Name | Media Query Range | Cấu trúc Navigation | Mục tiêu Trải nghiệm |
|:---|:---|:---|:---|
| **Desktop** | `min-width: 1100px` | Sidebar cố định trái ($242\text{px}$) + Header trên | Không gian rộng, hiển thị đầy đủ nhãn và mô hình |
| **Tablet** | `761px - 1099px` | Sidebar thu gọn ($205\text{px}$) + Main co giãn | Giữ vững luồng đọc lý thuyết và 2 cột làm bài thi |
| **Mobile** | `381px - 760px` | Bottom Navigation Bar ($60\text{px}$) + Header gọn ($53\text{px}$) | Thao tác 1 tay, vùng bấm $\ge 44\times 44\text{px}$, không cuộn ngang |
| **Small Mobile** | `max-width: 380px` | Bottom Navigation Bar + Grid `qnav` co giãn linh hoạt | Tránh tràn màn hình trên iPhone SE đời cũ |
