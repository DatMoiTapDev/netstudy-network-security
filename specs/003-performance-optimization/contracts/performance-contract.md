# Performance & Architectural Interface Contract

**Feature**: `specs/003-performance-optimization`
**Date**: 2026-11-04
**Status**: Completed

---

## 1. Mục đích Hợp đồng Kỹ thuật

Hợp đồng này quy định các cam kết giao diện (APIs), ràng buộc ngân sách hiệu năng (SLAs), và các bất biến kiến trúc mà mã nguồn tối ưu hóa trong Feature 003 PHẢI tuân thủ nhằm đảm bảo tính ổn định, không gây lỗi hồi quy đối với Feature 001 và Feature 002.

---

## 2. Cam kết Ngân sách Hiệu năng (Performance SLA Contract)

| Chỉ số Hiệu năng | Ngưỡng Tối đa Cho phép (Upper Bound SLA) | Điều kiện Kiểm thử | Vi phạm SLA |
|:---|:---:|:---|:---:|
| **Cumulative Layout Shift (CLS)** | $\mathbf{0.00}$ (Tuyệt đối không xê dịch) | Tải lại trang, chuyển trang Desktop & Mobile | $> 0.00$ |
| **Interaction to Next Paint (INP)** | $\mathbf{< 50\text{ ms}}$ | Click chọn đáp án trắc nghiệm, cắm cờ | $\ge 50\text{ ms}$ |
| **Model Step Transition Latency** | $\mathbf{< 16.6\text{ ms}}$ (60 FPS) | Bấm chuyển bước trên sơ đồ SVG 27 mô hình | $\ge 16.6\text{ ms}$ |
| **Search Input Debounce Delay** | $\mathbf{120\text{ ms}} \pm 20\text{ ms}$ | Gõ phím liên tục vào `#courseSearch`, `#termSearch` | $> 150\text{ ms}$ |
| **Script Execution Overhead (Node VM)** | $\mathbf{< 20.0\text{ ms}}$ | Phân tích và thực thi toàn bộ script | $> 25.0\text{ ms}$ |
| **Total Uncompressed CSS Delta** | $\mathbf{< 5\text{ KB}}$ tăng thêm | So sánh kích thước `dist/style.css` | $> 5\text{ KB}$ |

---

## 3. Hợp đồng CSS Containment & GPU Layer Promotion

### A. Quy tắc Áp dụng CSS Containment
Để cô lập phạm vi tính toán lại kiểu dáng và bố cục của trình duyệt mà không gây lỗi cắt viền (clipping), các quy tắc sau là bắt buộc:

```css
/* Khối thành phần khép kín: Sử dụng contain: content */
.lesson-section,
.card.chapter-card,
.study-model {
  contain: content;
}

/* Khối phương án câu hỏi: Sử dụng contain: layout style */
.option {
  contain: layout style;
}

/* CẤM SỬ DỤNG contain: paint hoặc contain: strict trên:
   - header (chứa sticky và dropdown)
   - aside (chứa navigation)
   - .drawer-sheet (chứa modal)
   - các phần tử có focus outline tràn viền */
```

### B. Quy tắc Tăng tốc Phần cứng (GPU Layer Promotion)
```css
/* Chỉ áp dụng GPU Compositing trên các thành phần thực sự chuyển động */
.mobile-nav {
  transform: translateZ(0);
}

.drawer-sheet {
  will-change: transform;
  transform: translateZ(0);
}
```

---

## 4. Hợp đồng Hàm Trì hoãn & Tối ưu Hóa Sự kiện (Event Debouncing Contract)

Hàm debounce nội bộ trong `dist/app.js` phải là hàm thuần khiết, zero-dependency, tuân thủ chữ ký:

```javascript
function debounce(fn, delay = 120) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, delay);
  };
}
```

**Ràng buộc sử dụng**:
- Áp dụng độc quyền trên sự kiện `oninput` của trường tìm kiếm giáo trình và thuật ngữ.
- Tuyệt đối KHÔNG áp dụng debounce trên các tương tác làm bài thi (click chọn đáp án, bấm phím tắt, cắm cờ) nhằm đảm bảo phản hồi tức thì $100\%$.

---

## 5. Hợp đồng Tương thích Mô hình Trực quan (`ModelUI` Contract)

Hàm xuất bản `window.ModelUI` phải duy trì chữ ký giao diện $100\%$ tương thích ngược:

```typescript
interface ModelUIContract {
  renderSection(chapter: string, section: string): string;
  catalog(selected?: string): string;
  selectStep(id: string, index: number, doc?: Document): boolean;
  svg(m: ModelDefinition, index: number): string;
}
```

**Bảo toàn Bất biến Mô hình**:
1. Đảm bảo toàn bộ 27 mô hình (`id: '1'` đến `'27'`) và 112 bước tương tác hiển thị chính xác mọi nội dung.
2. Giữ nguyên toàn bộ các phép kiểm tra số học mật mã trong `checks-models.cjs` (RSA Modulo, Diffie-Hellman Key Exchange, One-Time Pad XOR).
3. Không làm thay đổi cấu trúc dữ liệu tạo bởi `build-models.py`.

---

## 6. Hợp đồng Bảo toàn Tính Năng Feature 001 & Feature 002

| Cơ chế | Hợp đồng Cam kết | Trạng thái |
|:---|:---|:---:|
| **Micro-DOM Updates** | `updateOptionSelection()`, `updateFlagState()`, `updateSectionCompletion()`, `updateBookmarkState()` giữ nguyên chữ ký và hành vi cập nhật tại chỗ, không re-render toàn trang. | **BẮT BUỘC** |
| **Keyboard Accessibility** | Phím tắt `1-4`, `A-D`, `F`, `ArrowRight`/`ArrowLeft`, `P`/`N`, `Escape` tiếp tục chặn sự kiện mặc định (`preventDefault`) và chuyển tiêu điểm an toàn (`safeFocus`). | **BẮT BUỘC** |
| **Scroll Stability** | Vị trí cuộn trang giữ nguyên $100\%$ tự nhiên khi làm bài thi; chỉ cuộn mượt khi nhảy mục bài học cụ thể. | **BẮT BUỘC** |
| **Theme Engine** | Chu trình chuyển đổi `light` $\leftrightarrow$ `dark` $\leftrightarrow$ `system`, script Zero-FOUC trong `<head>`, và khóa độc lập `localStorage['netstudy-theme']` giữ nguyên vẹn $100\%$. | **BẮT BUỘC** |
| **Inline Vector Icons** | Hệ thống 17 biểu tượng SVG nội tuyến với `stroke="currentColor"` và thuộc tính trợ năng tiếp tục hoạt động trên toàn bộ giao diện. | **BẮT BUỘC** |
