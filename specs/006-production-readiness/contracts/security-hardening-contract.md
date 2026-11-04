# Contract: Security Hardening & Client Protection

**Contract ID**: `CTR-SEC-001`
**Feature**: `006-production-readiness`

---

## 1. Content Security Policy Meta Tag Specification

Thẻ meta CSP BẮT BUỘC nằm trong thẻ `<head>` của `dist/index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self';">
```

### Directives Guarantee
- `default-src 'self'`: Chỉ cho phép nạp tài nguyên từ cùng origin.
- `script-src 'self' 'unsafe-inline'`: Cho phép các tệp script nội bộ và khối script nội tuyến khởi tạo theme; cấm mọi script từ bên thứ ba.
- `style-src 'self' 'unsafe-inline'`: Cho phép stylesheet nội bộ và thuộc tính `style="..."` nội tuyến (thanh tiến độ, SVG chart).
- `img-src 'self' data:`: Cho phép hình ảnh nội bộ và data URI của SVG.
- `connect-src 'self'`: Cấm gửi request ngoại vi qua `fetch`, `XMLHttpRequest` hay `WebSocket`.
- `object-src 'none'`: Khóa hoàn toàn plugin nhúng (`<object>`, `<embed>`).
- `base-uri 'self'`: Chặn thay đổi base URL thông qua thẻ `<base>`.

---

## 2. Ingestion Size Guardrail Specification

Trong `dist/app.js`:

```javascript
const fi = document.querySelector('#importFile');
if (fi) {
  fi.onchange = async ev => {
    try {
      const f = ev.target.files[0];
      if (!f) return;
      if (f.size > 10 * 1024 * 1024) {
        toast('Tệp sao lưu vượt quá dung lượng cho phép (10MB).');
        return;
      }
      const candidate = C.importUserDataJSON(await f.text(), bank);
      // ... validation logic
    } catch (err) {
      toast(err.message);
    }
  };
}
```

---

## 3. Dynamic DOM Sanitization Contract

Tất cả các điểm kết xuất nội dung động BẮT BUỘC sử dụng hàm `e(string)`:
```javascript
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));
```
Tuyệt đối không chèn trực tiếp các chuỗi từ `location.hash` hay tệp JSON nhập vào DOM mà không qua `e()`.
