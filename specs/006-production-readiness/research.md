# Technical Research: Production Readiness & Security Hardening

**Feature**: `006-production-readiness`
**Date**: 2026-11-04
**Status**: Completed

---

## 1. Content Security Policy (CSP) for GitHub Pages Static Hosting

### Context & Constraints
NetStudy được lưu trữ trên GitHub Pages dưới dạng trang web tĩnh thuần túy (Static Site). GitHub Pages không cho phép cấu hình tùy biến HTTP Response Headers trên máy chủ (chẳng hạn như qua tệp `.htaccess` hay `_headers` của Netlify/Cloudflare). Do đó, Content Security Policy BẮT BUỘC phải được khai báo thông qua thẻ `<meta http-equiv="Content-Security-Policy" content="...">` trong `<head>` của `dist/index.html`.

### Technical Decisions
1. **CSP Directives**:
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self';">
   ```
2. **Inline Script Strategy**:
   - Khối script nội tuyến nhỏ trong `<head>` thực hiện đọc `localStorage.getItem('netstudy-theme')` và gán `data-theme` trước khi DOM được vẽ, nhằm ngăn chặn hoàn toàn hiện tượng nhấp nháy giao diện (FOUC).
   - Cho phép `'unsafe-inline'` cho `script-src` và `style-src` trong thẻ Meta CSP là giải pháp tối ưu cho ứng dụng tĩnh không có backend, trong khi vẫn khóa chặt tuyệt đối:
     - `object-src 'none'`: Vô hiệu hóa plugin Flash, Java, Silverlight.
     - `base-uri 'self'`: Chống tấn công Base Tag Injection làm đổi hướng nạp script tương đối.
     - `default-src 'self'`: Cấm nạp mọi script, worker, iframe từ domain bên thứ ba.
     - `connect-src 'self'`: Cấm gửi dữ liệu ra máy chủ ngoại vi qua `fetch`, `XMLHttpRequest` hay `WebSocket`.

---

## 2. Client-Side Input Sanitization & Memory Protection

### Threat Vector 1: Malformed / Oversized File Ingestion
- **Hiện trạng**: Trong `dist/app.js` (dòng 444), lệnh `candidate = C.importUserDataJSON(await f.text(), bank)` đọc toàn bộ tệp vào chuỗi string trước khi `dist/core.js` kiểm tra độ dài 10MB.
- **Giải pháp**: Kiểm tra thuộc tính `file.size` ngay trong listener `onchange` của thẻ input file:
  ```javascript
  const f = ev.target.files[0];
  if (!f) return;
  if (f.size > 10 * 1024 * 1024) {
    toast('Tệp sao lưu vượt quá dung lượng cho phép (10MB).');
    return;
  }
  ```
  Điều này ngăn chặn tình trạng tab trình duyệt bị tràn bộ nhớ hoặc treo khi người học vô tình chọn nhầm tệp dung lượng lớn.

### Threat Vector 2: XSS via URL Hash or Imported JSON
- **Nguyên lý bảo vệ**: Hàm `e()` (`s => String(s??'').replace(/[&<>"']/g, ...)`) đã được triển khai sẵn trong `dist/app.js`.
- **Rà soát toàn diện**: Đảm bảo tất cả 27 điểm sử dụng `innerHTML` đều bọc các giá trị chuỗi động qua `e()`. Các trường tiêu đề bài thi `h.title`, tên chủ đề `k`, câu hỏi `q.stem`, các phương án `q.options`, và từ khóa tìm kiếm đều được khử nhiễm triệt để trước khi render.

---

## 3. WCAG 2.2 AA Accessibility & Assistive Technologies

### Focus Trapping & Dismissal for Modals
- **Vấn đề**: Hộp thoại `#quotaModal` và ngăn kéo `#mobileDrawer` khi hiển thị chưa có cơ chế giữ tiêu điểm bàn phím bên trong, khiến phím `Tab` có thể lọt ra các phần tử bị mờ ở nền phía sau.
- **Giải pháp Kỹ thuật**:
  - Lưu giữ phần tử kích hoạt trước khi mở: `const triggerEl = document.activeElement;`.
  - Tìm tất cả các phần tử có thể nhận focus bên trong dialog: `a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])`.
  - Bắt sự kiện `keydown` trên dialog:
    - Nếu nhấn `Tab`: khi ở phần tử cuối cùng chuyển về phần tử đầu tiên; khi nhấn `Shift+Tab` ở phần tử đầu tiên chuyển về phần tử cuối cùng.
    - Nếu nhấn `Escape`: đóng dialog và gọi `safeFocus(triggerEl)`.

### Reduced Motion Support
- Khai báo CSS media query chuẩn:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```

### SVG Mechanism Models Accessibility
- 27 mô hình SVG và biểu đồ xu hướng điểm số được bổ sung thuộc tính `role="img"`, thẻ `<title>` và nhãn `aria-label` mô tả chức năng của mô hình.

---

## 4. Production Build, Asset Versioning & GitHub Pages Routing

### Cache Busting Strategy
- Để chống hiện tượng "stale cache" của trình duyệt khi phát hành phiên bản mới, tất cả các tệp tĩnh nạp trong `dist/index.html` được đồng bộ hậu tố phiên bản phát hành `?v=6`:
  - `favicon.svg?v=6`
  - `style.css?v=6`
  - `models.css?v=6`
  - `data.js?v=6`
  - `core.js?v=6`
  - `models.js?v=6`
  - `model-ui.js?v=6`
  - `app.js?v=6`

### GitHub Pages Routing Fallback
- **`dist/404.html`**: Trang dự phòng chuẩn phong cách NetStudy. Sử dụng meta refresh `0; url=./` kết hợp nút bấm quay về trang chủ để điều hướng người dùng khi gõ sai URL tĩnh.
- **`dist/.nojekyll`**: Tệp rỗng để báo hiệu cho GitHub Pages không chạy bộ xử lý Jekyll, tránh việc các tệp tài nguyên bị lọc bỏ.
- **`dist/manifest.webmanifest`**: Cung cấp cấu hình PWA chuẩn: `name`, `short_name`, `start_url: "./"`, `display: "standalone"`, `theme_color: "#15634f"`, `background_color: "#ffffff"`, biểu tượng favicon đa kích thước.

---

## 5. GitHub Actions Deploy Workflow Hardening

### Lỗi Hiện tại trong `.github/workflows/pages.yml`
- Dòng 20: `uses: actions/checkout@v6` $\rightarrow$ Action `actions/checkout` phiên bản mới nhất là `v4`. Cần sửa thành `actions/checkout@v4`.
- Bước kiểm tra: Chỉ chạy `checks.cjs` và `checks-models.cjs`. Cần tích hợp đầy đủ `checks-perf.cjs` và `checks-learning.cjs` để đảm bảo không có phiên bản nào vi phạm ngân sách payload $\le 735.00\text{ KB}$ hay logic học tập bị hồi quy trước khi phát hành lên môi trường GitHub Pages.
- Quyền hạn tối thiểu: `permissions: { contents: read }` cho job `build`, và chỉ cấp `pages: write` / `id-token: write` cho job `deploy` có ràng buộc môi trường `environment: github-pages`.
