# Contract: Accessibility & WCAG 2.2 AA Compliance

**Contract ID**: `CTR-A11Y-001`
**Feature**: `006-production-readiness`

---

## 1. Modal Focus Trap Contract

### Interface
```javascript
function trapFocus(modalEl, closeCallback) {
  const focusables = modalEl.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!focusables.length) return () => {};

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCallback();
      return;
    }
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  modalEl.addEventListener('keydown', handleKeyDown);
  first.focus();

  return function cleanup() {
    modalEl.removeEventListener('keydown', handleKeyDown);
  };
}
```

### Applied Targets
1. Hộp thoại dung lượng: `#quotaModal`.
2. Menu ngăn kéo di động: `#mobileDrawer`.

---

## 2. Reduced Motion Contract

CSS Media Query BẮT BUỘC có trong `dist/style.css`:

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

---

## 3. SVG Mechanism Models Accessibility Contract

1. Tất cả 27 thẻ `<svg>` mô hình:
   - Thêm thuộc tính `role="img"`.
   - Có thẻ `<title id="model-title-{id}">[Tên mô hình]</title>`.
   - Có thuộc tính `aria-labelledby="model-title-{id}"`.
2. Biểu đồ điểm số SVG:
   - Thêm `role="img"` và `aria-label="Biểu đồ xu hướng điểm số thi thử"`.
3. Nút điều khiển bước:
   - Có `aria-label="Chuyển đến bước {N}: {Tên bước}"`.
