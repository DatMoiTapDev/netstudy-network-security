# Feature Specification: NetStudy UI/UX Design System & Theme Engine

**Feature Directory**: `specs/002-ui-ux-design-system`
**Feature Branch**: `feat/002-ui-ux-design-system`
**Created**: 2026-11-04
**Status**: Draft
**Input**: User description: "Khởi tạo Feature 002 — NetStudy UI/UX Design System. Sử dụng ui-ux-pro-max để nghiên cứu thiết kế giao diện phù hợp với website học An toàn mạng máy tính. Xây dựng specification cho design tokens, light/dark mode, responsive navigation, SVG icons và accessibility. Giữ nguyên HTML/CSS/JavaScript thuần, bảo toàn chức năng học tập, thi thử và toàn bộ cải tiến Feature 001."

---

## 1. Bối cảnh & Hiện trạng Giao diện (Codebase Facts vs. UI/UX Audit)

Dựa trên kết quả phân tích mã nguồn thực tế tại `dist/index.html`, `dist/style.css`, `dist/app.js`, `dist/model-ui.js` và đối chiếu với tiêu chuẩn thiết kế UI UX Pro Max:

| Thành phần | Hiện trạng trong mã nguồn (`dist/`) | Vấn đề UI/UX & Trợ năng | Hướng giải quyết theo Design System |
|:---|:---|:---|:---|
| **Hệ thống màu & Biến CSS** | Định nghĩa trực tiếp 8 biến CSS đơn lẻ ở `:root` (`--ink`, `--muted`, `--green`, `--light`, `--line`, `--paper`, `--white`, `--accent`). Nhiều mã màu hex gõ cứng trong CSS (`#edf2e9`, `#dce3d9`, `#edf4e8`, `#fff0ed`, v.v.). | Thiếu phân tầng biến (Design Tokens), không thể mở rộng hay đổi chủ đề (theme) nhất quán. | Xây dựng kiến trúc 3 tầng Design Tokens (Primitive $\rightarrow$ Semantic $\rightarrow$ Component) hỗ trợ cả Light & Dark mode. |
| **Chế độ Sáng / Tối (Dark Mode)** | Chỉ hỗ trợ duy nhất giao diện nền sáng (`--paper: #f7f8f3`). Không có Dark Mode. | Học viên học ban đêm hoặc ôn thi kéo dài bị chói mắt, mỏi mắt; thiếu thẩm mỹ đặc trưng của ngành An toàn thông tin/Cybersecurity. | Triển khai bộ đôi bảng màu: **Clean Cyber Emerald** (Light) và **Deep Cipher Slate** (Dark) với chuyển đổi mượt mà, lưu vào `localStorage`. |
| **Hệ thống Icon** | Sử dụng ký tự Unicode/emoji thô (`⌂`, `▤`, `◷`, `◇`, `☆`, `★`, `✓`). | Ký tự Unicode hiển thị không đồng nhất giữa các hệ điều hành (Windows/macOS/iOS/Android), khó căn chỉnh lề, thiếu chuyên nghiệp và không hỗ trợ trợ năng tốt. | Thay thế bằng hệ thống biểu tượng vector SVG nội tuyến (Inline SVG) đồng nhất, sắc nét, tối ưu dung lượng và hỗ trợ `aria-hidden="true"`. |
| **Điều hướng Responsive** | Sidebar cố định (`aside: 242px`) trên Desktop. Dưới 760px chuyển thành thanh cuộn ngang `nav { overflow-x: auto }` nằm dưới header. | Thanh cuộn ngang mobile bị cắt cụt, ngón tay cái khó chạm (thumb-zone kém), mất nhãn khi cuộn, không có menu drawer/bottom navigation chuẩn mobile. | Tối ưu điều hướng di động: hỗ trợ Bottom Navigation bar hoặc Collapsible Drawer thân thiện với vùng bấm ngón cái ($\ge 44\times 44\text{px}$). |
| **Khả năng tiếp cận (Accessibility)** | Feature 001 đã cải thiện viền `:focus-visible` đạt chuẩn $\ge 3:1$ và điều hướng phím trong bài thi. | Màu chữ phụ (`--muted: #6c7976` trên nền `#f7f8f3` đạt tỷ lệ tương phản ~4.2:1, dưới ngưỡng 4.5:1 của WCAG 2.2 AA cho văn bản nhỏ). | Nâng chuẩn tương phản toàn diện $\ge 4.5:1$ cho mọi văn bản thông thường; duy trì đầy đủ tính năng bàn phím và DOM của Feature 001. |

---

## 2. Triết lý Thiết kế (Design Direction & Visual Identity)

Theo framework **UI UX Pro Max** cho chủ đề **An toàn mạng máy tính & Giáo dục bảo mật** (kết hợp phong cách *Cybersecurity Platform*, *Dark Mode OLED / Deep Slate*, và *Swiss Modernism 2.0*):
- **Cảm giác thị giác (Mood & Tone)**: Đáng tin cậy, sắc nét, chuyên nghiệp, bảo mật cao, giảm thiểu mệt mỏi thị giác cho các phiên học kéo dài 75 phút.
- **Bảng màu Sáng (Clean Cyber Emerald - Light Mode)**:
  - Nền Canvas: `#F8FAF8` (giấy ngà pha sắc xanh rêu nhẹ, dịu mắt hơn màu trắng tinh).
  - Nền Thẻ Surface: `#FFFFFF`.
  - Màu chữ chính (Ink): `#112320` (độ tương phản 14.8:1 trên nền canvas).
  - Màu chữ phụ (Muted): `#4B5E59` (độ tương phản 5.2:1 trên nền canvas, đạt chuẩn AA).
  - Màu chủ đạo (Primary Emerald): `#15634F` (nhận diện bảo mật vững chãi).
  - Đường viền (Border Line): `#D8E2D9`.
- **Bảng màu Tối (Deep Cipher Slate - Dark Mode)**:
  - Nền Canvas: `#0D1514` (Deep Cyber Slate, không dùng đen tuyệt đối để tránh blooming chữ).
  - Nền Thẻ Surface: `#152220` (nổi khối rõ ràng so với nền).
  - Nền Surface Elevated: `#1D2E2B`.
  - Màu chữ chính (Ink): `#EDF4F1` (độ tương phản 13.5:1).
  - Màu chữ phụ (Muted): `#9DB2AA` (độ tương phản 6.1:1).
  - Màu chủ đạo (Neon Emerald): `#2AD586` (điểm nhấn sáng rõ, sắc sảo).
  - Đường viền (Border Line): `rgba(74, 110, 98, 0.35)`.
- **Typography**:
  - Phông chữ giao diện: `Be Vietnam Pro`, `system-ui`, `-apple-system`, `sans-serif`.
  - Phông chữ số liệu & mã kỹ thuật: `ui-monospace`, `'SF Mono'`, `'Cascadia Code'`, `'JetBrains Mono'`, `monospace` (dành riêng cho đồng hồ bấm giờ tabular-nums, địa chỉ IP, giá trị modulo/RSA, bit/byte trong 27 mô hình).

---

## 3. User Scenarios & Testing *(mandatory)*

### User Story 1 — Hệ thống Design Tokens Nhất quán & Trực quan (Priority: P1)

Là một học viên NetStudy, tôi muốn toàn bộ giao diện bài giảng, câu hỏi, mô hình mạng và bảng điều khiển có sự phân cấp thị giác rõ ràng, màu sắc hài hòa và độ tương phản cao, giúp tôi tập trung tối đa vào nội dung kỹ thuật mà không bị mỏi mắt.

**Why this priority**: Đây là nền móng thị giác cốt lõi để chuẩn hóa toàn bộ CSS của ứng dụng, thay thế các mã màu gõ cứng bằng các biến ngữ nghĩa (Semantic Tokens).

**Independent Test**: Mở trang Tổng quan (`#home`), Giáo trình (`#courses`), Bài học (`#lesson/3`), và Làm bài (`#session`). Kiểm tra:
1. Mọi thẻ (`.card`), tiêu đề, văn bản, nút bấm đều sử dụng biến Design Tokens từ CSS.
2. Tỷ lệ tương phản của mọi văn bản nhỏ đều đạt $\ge 4.5:1$ theo WCAG 2.2 AA.
3. Không có bất kỳ thành phần nào bị vỡ bố cục hay sai màu.

**Acceptance Scenarios**:
1. **Given** học viên truy cập bất kỳ trang nào trong ứng dụng, **When** kiểm tra bảng màu qua công cụ trợ năng hoặc thanh tra DOM, **Then** toàn bộ màu nền, màu chữ, màu viền và màu trạng thái đều trỏ về biến token chuẩn (`var(--color-...)` / `var(--bg-...)`), không còn mã hex rời rạc.
2. **Given** học viên xem bài học có các khối ghi chú (`.plain`, `.example`, `.note`), **When** đọc nội dung, **Then** các khối phân biệt rõ ràng bằng màu viền và nền ngữ nghĩa, chữ đọc rõ ràng không bị nhạt nhòa.

---

### User Story 2 — Chế độ Sáng / Tối (Dark / Light Theme Engine) Mượt mà (Priority: P1)

Là một học viên thường xuyên học tập và luyện thi vào buổi tối hoặc trong môi trường thiếu sáng, tôi muốn có nút chuyển đổi giữa chế độ Sáng và Tối (hoặc tự động theo hệ điều hành), để bảo vệ thị lực và có trải nghiệm thị giác dễ chịu.

**Why this priority**: Yêu cầu trải nghiệm quan trọng nhất của học viên ngành công nghệ, đồng thời là tiêu chuẩn bắt buộc của Nguyên tắc V trong Hiến pháp dự án.

**Independent Test**: Nhấp vào nút chuyển Theme trên thanh tiêu đề/sidebar:
1. Toàn bộ trang web chuyển đổi ngay tức thì giữa Light Mode và Dark Mode mà không cần tải lại trang.
2. Không bị hiện tượng chớp sáng trắng (FOUC — Flash of Unstyled Content) khi tải lại trang (`F5`).
3. Lựa chọn theme được lưu vào `localStorage` và tự động khôi phục khi mở lại.

**Acceptance Scenarios**:
1. **Given** người dùng đang ở giao diện Sáng, **When** nhấn nút chuyển chế độ Dark Mode, **Then** thuộc tính `data-theme="dark"` được áp dụng trên thẻ `<html>` hoặc `<body>`, toàn bộ các biến CSS ngữ nghĩa tự động ánh xạ sang bảng màu Dark Slate/Emerald, các sơ đồ SVG trong 27 mô hình tương tác vẫn hiển thị sáng rõ, dễ đọc.
2. **Given** người dùng chọn chế độ "Hệ thống" (hoặc chưa chọn bao giờ), **When** hệ điều hành đổi giữa Dark/Light theme, **Then** ứng dụng tự động thích ứng theo media query `prefers-color-scheme`.
3. **Given** người dùng đang làm bài thi 40 câu / 75 phút, **When** đổi theme, **Then** câu trả lời đang chọn, đồng hồ đếm ngược, và tiêu điểm bàn phím giữ nguyên 100% (bảo toàn cải tiến của Feature 001).

---

### User Story 3 — Điều hướng Di động Thân thiện (Mobile-First Thumb-Zone Navigation) (Priority: P2)

Là một học viên sử dụng điện thoại thông minh để đọc tài liệu và làm trắc nghiệm an toàn mạng, tôi muốn thanh điều hướng di động dễ sử dụng bằng một tay, các nút bấm đủ lớn để không bị bấm nhầm.

**Why this priority**: Hiện tại ở màn hình $<760\text{px}$, sidebar biến thành thanh cuộn ngang khó quan sát. Tối ưu hóa điều hướng di động giúp người dùng học tập tiện lợi mọi lúc mọi nơi.

**Independent Test**: Mở ứng dụng trên viewport di động ($375\text{px}$ và $320\text{px}$):
1. Thanh điều hướng có cấu trúc gọn gàng, hỗ trợ nút mở menu hoặc thanh điều hướng đáy (Bottom Bar/Drawer) tiện dụng.
2. Mọi nút bấm trắc nghiệm, chuyển câu, nút nộp bài đều có kích thước vùng chạm tối thiểu $44\times 44\text{px}$.
3. Bảng điều hướng câu hỏi `qnav` sắp xếp dạng lưới hợp lý, không tràn màn hình.

**Acceptance Scenarios**:
1. **Given** học viên truy cập trên thiết bị di động với bề ngang $360\text{px}$, **When** điều hướng giữa các chức năng chính, **Then** menu được bố trí trong tầm với ngón cái, các mục menu có icon và nhãn văn bản sắc nét, không bị che khuất.
2. **Given** học viên làm bài trắc nghiệm trên màn hình nhỏ, **When** nhấp chọn phương án A, B, C, D, **Then** khoảng cách giữa các lựa chọn đủ rộng để không bấm nhầm, phản hồi cảm ứng nhạy bén.

---

### User Story 4 — Hệ thống Biểu tượng Vector SVG & Khả năng Tiếp cận WCAG 2.2 AA (Priority: P2)

Là một học viên sử dụng bàn phím hoặc trình đọc màn hình, tôi muốn các biểu tượng trong ứng dụng là vector SVG đồng bộ, đẹp mắt, có đường viền `:focus-visible` tương phản cao và nhãn trợ năng đầy đủ.

**Why this priority**: Thay thế các emoji thô (`⌂`, `▤`, `◷`, `◇`, `☆`, `★`, `✓`) bằng SVG chuẩn hóa, tăng tính chuyên nghiệp và đảm bảo chuẩn WCAG 2.2 AA (Criterion 2.1.1, Criterion 2.4.7).

**Independent Test**: Duyệt qua menu và các nút hành động:
1. Tất cả emoji được thay bằng inline SVG icons (kích thước $18\text{px}$ hoặc $20\text{px}$) có nét vẽ thanh mảnh, hiện đại.
2. Các icon trang trí có thuộc tính `aria-hidden="true"`, các icon dạng nút bấm có nhãn `aria-label` tương ứng.
3. Khi dùng phím `Tab`, mọi nút đều có viền `:focus-visible` màu ngọc lục bảo nổi bật trên cả nền sáng lẫn nền tối.

**Acceptance Scenarios**:
1. **Given** người dùng duyệt qua sidebar hoặc danh sách bài học, **When** nhìn vào các biểu tượng chức năng, **Then** toàn bộ biểu tượng hiển thị đồng nhất về kích thước, nét vẽ (stroke width 2px), màu sắc đồng bộ với text token.
2. **Given** học viên bấm nút "Đánh dấu xem lại" hoặc "Lưu câu này", **When** trạng thái thay đổi, **Then** biểu tượng ngôi sao SVG chuyển đổi trạng thái giữa viền rỗng (outline) và đặc ruột (filled) mượt mà.

---

## 4. Edge Cases

- **EC-01: Chớp giao diện khi tải trang (Theme FOUC)**: Nếu script đọc theme từ `localStorage` chạy sau khi DOM đã render, người dùng ở chế độ Dark Mode sẽ bị một tia chớp trắng chói mắt.
  *Yêu cầu*: Logic áp dụng theme phải được thực hiện đồng bộ ngay trong thẻ `<head>` hoặc đầu thẻ `<body>` trước khi paint giao diện.
- **EC-02: 27 Mô hình trực quan (SVG interactive models) trong Dark Mode**: Một số mô hình chứa đường viền màu đen, nhãn chữ hoặc nền nhạt có thể bị chìm khi nền chuyển sang Dark Slate.
  *Yêu cầu*: Các phần tử SVG trong `dist/models.js` và `dist/model-ui.js` phải sử dụng màu stroke/fill kế thừa biến CSS (currentColor hoặc biến semantic token) để tự động tương thích và giữ độ tương phản cao trong cả 2 chế độ.
- **EC-03: Trình duyệt hỗ trợ chế độ tương phản cao (Windows High Contrast / `forced-colors`)**: Khi người dùng bật High Contrast Mode trong Windows Settings, màu CSS tùy biến có thể bị ghi đè.
  *Yêu cầu*: Đảm bảo các đường viền, nút bấm và trạng thái lựa chọn giữ thuộc tính `outline: 2px solid transparent` hoặc dùng màu hệ thống để không bị vô hình hóa.
- **EC-04: Màn hình cực hẹp ($320\text{px}$ — iPhone SE đời cũ)**: Lưới 40 câu hỏi `qnav` có thể bị tràn nếu chia quá nhiều cột.
  *Yêu cầu*: CSS Grid của `qnav` trên màn hình $\le 380\text{px}$ tự động co giãn (`grid-template-columns: repeat(auto-fill, minmax(32px, 1fr))`) để không tạo thanh cuộn ngang ngoài ý muốn.
- **EC-05: Người dùng bật chế độ giảm chuyển động (`prefers-reduced-motion`)**:
  *Yêu cầu*: Giữ nguyên quy tắc tắt chuyển động chuyển màu theme và chuyển cảnh (`transition: none !important`) để người dùng nhạy cảm tiền đình không bị khó chịu.

---

## 5. Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (3-Tier Design Token Architecture)**: Hệ thống PHẢI thiết lập kiến trúc biến CSS 3 tầng tại `dist/style.css`:
  - *Tier 1 - Primitive Tokens*: Thang đo màu sắc cơ sở (Emerald, Slate, Amber, Crimson), khoảng cách (`--space-1` đến `--space-12`), độ bo góc (`--radius-sm` đến `--radius-full`), cỡ chữ (`--font-size-xs` đến `--font-size-3xl`).
  - *Tier 2 - Semantic Tokens*: Biến ngữ nghĩa phụ thuộc theme (`--bg-canvas`, `--bg-surface`, `--bg-subtle`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-default`, `--border-focus`, `--status-success`, `--status-warning`, `--status-danger`).
  - *Tier 3 - Component Tokens*: Biến chuyên biệt cho từng thành phần (`--option-bg-hover`, `--qnav-btn-size`, `--timer-urgent-color`).
- **FR-002 (Light & Dark Mode Support)**: Hệ thống PHẢI cung cấp đầy đủ bảng giá trị Semantic Tokens cho cả 2 theme: `light` (Clean Cyber Emerald) và `dark` (Deep Cipher Slate).
- **FR-003 (Theme Switching & Persistence)**: Hệ thống PHẢI cung cấp nút chuyển theme trực quan trên giao diện, hỗ trợ 3 tùy chọn: Sáng (`light`), Tối (`dark`), và Theo hệ điều hành (`system`). Lựa chọn của người dùng PHẢI được lưu trong `localStorage` (khóa `netstudy-theme`) và áp dụng ngay lập tức mà không cần reload trang.
- **FR-004 (FOUC Prevention)**: Hệ thống PHẢI áp dụng theme ngay từ đầu quá trình nạp tài liệu để loại bỏ 100% hiện tượng chớp trắng (Flash of Unstyled Content).
- **FR-005 (SVG Icon System)**: Toàn bộ các ký tự biểu tượng thô (`⌂`, `▤`, `◷`, `◇`, `☆`, `★`, `✓`) trong navigation, quiz buttons, và lesson sections PHẢI được thay thế bằng các biểu tượng vector SVG nội tuyến (Inline SVG) sắc nét, đồng bộ nét vẽ và kích thước.
- **FR-006 (Icon Accessibility)**: Mọi icon trang trí PHẢI có thuộc tính `aria-hidden="true"`; mọi icon đóng vai trò nút bấm độc lập PHẢI có thuộc tính `aria-label` mô tả rõ công dụng.
- **FR-007 (Mobile Navigation Optimization)**: Hệ thống PHẢI tái cấu trúc menu điều hướng trên màn hình nhỏ ($\le 760\text{px}$) với kích thước vùng chạm tối thiểu $44\times 44\text{px}$ và vị trí thuận tiện cho thao tác ngón cái.
- **FR-008 (WCAG 2.2 AA Contrast Compliance)**: Toàn bộ văn bản thông thường PHẢI đạt tỷ lệ tương phản $\ge 4.5:1$ so với nền; văn bản lớn ($\ge 18\text{pt}$ hoặc $\ge 14\text{pt}$ đậm) và các phần tử đồ họa tương tác PHẢI đạt tỷ lệ tương phản $\ge 3:1$.
- **FR-009 (Focus Visible Styling)**: Viền focus bàn phím (`:focus-visible`) PHẢI luôn hiển thị nổi bật với độ dày $2\text{px}$–$3\text{px}$, khoảng cách viền (`outline-offset: 2px`), màu sắc đạt độ tương phản $\ge 3:1$ trên cả nền sáng và tối.
- **FR-010 (Model Compatibility in Dark Mode)**: Cả 27 mô hình tương tác bảo mật trong `dist/model-ui.js` PHẢI hiển thị rõ ràng, không bị chìm màu nền hoặc mất chữ khi người dùng kích hoạt Dark Mode.
- **FR-011 (Feature 001 Invariance)**: Toàn bộ logic cập nhật DOM tại chỗ (`updateOptionSelection`, `updateFlagState`, `updateSectionCompletion`, `updateBookmarkState`, `safeFocus`), các phím tắt bàn phím (`1`–`4`, `A`–`D`, `F`, `ArrowRight`/`ArrowLeft`, `P`/`N`), và tính ổn định cuộn trang PHẢI được giữ nguyên vẹn 100%.
- **FR-012 (Core Logic & Storage Invariance)**: Dữ liệu học liệu trong `data.js`, thuật toán sinh đề trong `core.js`, và cấu trúc dữ liệu lưu trong `localStorage` (`netstudy-atmmt-v1`) PHẢI được giữ nguyên vẹn 100%.

### Non-Functional Requirements

- **NFR-001 (Zero Framework & Pure Vanilla)**: Không sử dụng bất kỳ thư viện CSS runtime hoặc framework nào (không Tailwind CDN runtime, không Bootstrap, không React/Vue). Chỉ sử dụng HTML5 thuần, CSS3 chuẩn hiện đại và Vanilla JavaScript ES2022+ (tuân thủ tuyệt đối Constitution Principle I).
- **NFR-002 (Zero Runtime Dependencies)**: Runtime ứng dụng không bổ sung bất kỳ gói npm nào (tuân thủ Constitution Principle VII).
- **NFR-003 (Lightweight Footprint)**: Toàn bộ phần mã CSS mở rộng cho Design System và Dark Mode PHẢI tối ưu, kích thước tăng thêm không vượt quá $15\text{KB}$ uncompressed.
- **NFR-004 (Performance 60 FPS)**: Thao tác chuyển đổi theme diễn ra tức thì trong vòng dưới $50\text{ms}$, không gây giật lag hoặc rò rỉ bộ nhớ.
- **NFR-005 (Automated Test Compatibility)**: Toàn bộ bài kiểm thử `node checks.cjs` và `node checks-models.cjs` PHẢI tiếp tục PASS 100% với mã thoát 0 (tuân thủ Constitution Principle VIII).

---

## 6. Key Entities & Data Model

### `ThemeMode`
Chuỗi xác định chế độ giao diện:
- Giá trị: `'light' | 'dark' | 'system'`.
- Lưu trữ: `localStorage.getItem('netstudy-theme')`.
- Thuộc tính DOM: `document.documentElement.setAttribute('data-theme', resolvedTheme)`.

### `DesignTokens` (CSS Custom Properties)
Cấu trúc cây biến CSS được quản lý tập trung tại `dist/style.css`:
- `:root`: Primitive Tokens + Light Semantic Tokens (mặc định).
- `[data-theme="dark"]`: Dark Semantic Tokens overrides.
- `@media (prefers-color-scheme: dark)`: Kích hoạt Dark Semantic Tokens khi theme được đặt là `system`.

### `SvgIconCatalog`
Bộ định nghĩa biểu tượng vector SVG kích thước chuẩn $20\times 20\text{px}$ với `viewBox="0 0 24 24"` và `stroke-width="2"`:
- `home`: Biểu tượng trang chủ / tổng quan.
- `book`: Biểu tượng giáo trình.
- `term`: Biểu tượng thuật ngữ / từ điển.
- `model`: Biểu tượng mô hình trực quan / sơ đồ an toàn.
- `practice`: Biểu tượng luyện tập / bài tập trắc nghiệm.
- `exam`: Biểu tượng thi thử / đồng hồ đo thời gian.
- `notebook`: Biểu tượng sổ ôn tập / củng cố câu sai.
- `history`: Biểu tượng lịch sử / kết quả học tập.
- `sources`: Biểu tượng nguồn tài liệu / đối chiếu trang PDF.
- `settings`: Biểu tượng dữ liệu cá nhân / sao lưu.
- `sun` / `moon`: Biểu tượng chuyển đổi chế độ sáng/tối.
- `flag` / `bookmark`: Biểu tượng cắm cờ xem lại và lưu câu hỏi (trạng thái outline và filled).

---

## 7. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (WCAG 2.2 AA Contrast 100%)**: $100\%$ các cặp màu chữ / màu nền trong ứng dụng đạt tỷ lệ tương phản tối thiểu $4.5:1$ đối với văn bản thông thường và $3:1$ đối với văn bản lớn / phần tử đồ họa ở cả Light Mode và Dark Mode.
- **SC-002 (Zero FOUC)**: $0\text{ms}$ hiện tượng chớp trắng (white flash) khi người dùng ở Dark Mode tải lại trang (`F5`) hoặc chuyển trang giữa các hash route.
- **SC-003 (100% Icon Modernization)**: Toàn bộ $100\%$ các biểu tượng emoji/Unicode thô trong ứng dụng được thay thế hoàn toàn bằng inline SVG icons có nét vẽ đồng bộ và nhãn trợ năng chuẩn xác.
- **SC-004 (Mobile Usability Target)**: $100\%$ các phần tử tương tác trên thiết bị di động (nút phương án, nút chuyển câu, nút danh mục) đạt diện tích bấm tối thiểu $44\times 44\text{px}$, thanh điều hướng nằm trọn vẹn trong vùng chạm ngón cái mà không đòi hỏi thao tác cuộn ngang bất tiện.
- **SC-005 (100% Regression-Free)**: Bộ test tự động `checks.cjs` và `checks-models.cjs` tiếp tục đạt kết quả **100% PASS** với 0 lỗi hồi quy.

---

## 8. Assumptions & Scope Boundaries

### Giả định hợp lý
- Người dùng sử dụng các trình duyệt hiện đại (Chrome, Edge, Firefox, Safari) hỗ trợ đầy đủ biến CSS (`var(--...)`), thuộc tính `data-*`, và media query `prefers-color-scheme`.
- Người dùng lưu trữ tùy chọn theme trực tiếp trên trình duyệt cá nhân thông qua `localStorage`.

### Phạm vi loại trừ (Out of Scope for Feature 002)
- Không chuyển đổi sang CSS-in-JS, Tailwind build step hoặc Sass/SCSS để bảo toàn kiến trúc Vanilla zero-build.
- Không thay đổi cấu trúc dữ liệu câu hỏi, thuật toán chấm điểm hoặc nội dung kiến thức của 9 chương học.
- Không đưa thêm các hiệu ứng 3D nặng (WebGL) hoặc animation phức tạp gây ảnh hưởng đến hiệu năng máy cấu hình yếu.
