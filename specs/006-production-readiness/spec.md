# Feature Specification: Production Readiness & Security Hardening

**Feature Branch**: `feat/006-production-readiness`
**Created**: 2026-11-04
**Status**: Draft
**Input**: User description: "FEATURE 006 — PRODUCTION READINESS & SECURITY HARDENING: Chuẩn bị NetStudy đạt điều kiện phát hành công khai an toàn, kiểm toán client-side security, CSP, data resilience, WCAG 2.2 AA accessibility, production build validation, GitHub Pages readiness, và release/rollback governance."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Client-Side Execution & Content Security Policy (Priority: P1)

Là một người học trực tuyến, tôi muốn ứng dụng NetStudy được bảo vệ bởi ranh giới bảo mật nghiêm ngặt của trình duyệt (Content Security Policy, khử nhiễm chuỗi động theo ngữ cảnh, loại bỏ triệt để các lỗ hổng thực thi mã ngoài ý muốn), để việc học tập và dữ liệu của tôi luôn an toàn tuyệt đối trước các cuộc tấn công Cross-Site Scripting (XSS), chèn mã độc hay dữ liệu độc hại.

**Why this priority**: Bảo mật là nền tảng sống còn của một ứng dụng đào tạo An toàn mạng máy tính. Đạt chuẩn bảo mật cấp độ production là điều kiện tiên quyết trước khi phát hành công khai trên GitHub Pages.

**Independent Test**: Có thể kiểm chứng độc lập bằng cách chèn các chuỗi tấn công XSS (vector script, sự kiện onerror, chuỗi đa hình) qua URL hash, từ khóa tìm kiếm và tệp sao lưu JSON; kiểm tra sự hiện diện và hiệu lực của thẻ Meta Content Security Policy (CSP) chặn mọi tài nguyên ngoài phạm vi.

**Acceptance Scenarios**:
1. **Given** Người dùng truy cập bất kỳ route nào với hash độc hại chứa thẻ `<script>` hoặc vector DOM XSS (ví dụ `#lesson/<script>alert(1)</script>`), **When** Ứng dụng thực hiện phân tích cú pháp và kết xuất route, **Then** Ký tự độc hại được khử nhiễm (escape) triệt để, không có script nào được thực thi, và ứng dụng chuyển hướng an toàn về trang hợp lệ.
2. **Given** Trang web được tải trên trình duyệt hiện đại, **When** Kiểm tra thẻ `<meta http-equiv="Content-Security-Policy">` trong `<head>`, **Then** Chính sách CSP hợp lệ được áp dụng: chỉ cho phép nạp tài nguyên nội bộ (`default-src 'self'`), chặn thực thi script từ nguồn ngoài (`script-src 'self'`), chặn nạp đối tượng nguy hiểm (`object-src 'none'`), và khóa base URI (`base-uri 'self'`).
3. **Given** Mã nguồn trong thư mục `dist/`, **When** Quét toàn bộ các tệp JavaScript, **Then** Không có sự xuất hiện của các hàm thực thi động nguy hiểm như `eval()`, `new Function()`, hoặc `setTimeout("string")`.

---

### User Story 2 - Resilient Data Ingestion & Privacy Hardening (Priority: P1)

Là một học viên lưu trữ tiến độ cá nhân cục bộ, tôi muốn quá trình nhập và xuất dữ liệu sao lưu JSON được kiểm soát dung lượng nghiêm ngặt, thẩm định cấu trúc lược đồ chặt chẽ, và bảo vệ quyền riêng tư tuyệt đối, để tránh việc tệp dữ liệu hỏng hoặc mã độc làm tê liệt trình duyệt hay ghi đè mất tiến độ học tập.

**Why this priority**: Dữ liệu tiến độ là tài sản quan trọng nhất của học viên. NetStudy cam kết mô hình Local-First và zero telemetry, do đó tính toàn vẹn và khả năng tự bảo vệ của dữ liệu tại client là yêu cầu cốt lõi.

**Independent Test**: Nạp các tệp sao lưu JSON với các điều kiện biên: tệp rỗng, tệp sai cú pháp JSON, tệp vượt quá 10MB, tệp chứa ID câu hỏi không có trong ngân hàng 264 câu, tệp chứa các trường độc hại; xác thực hệ thống từ chối an toàn và chỉ ghi đè khi có xác nhận rõ ràng của người dùng.

**Acceptance Scenarios**:
1. **Given** Người dùng chọn tệp nhập sao lưu có dung lượng > 10MB, **When** Sự kiện chọn tệp kích hoạt, **Then** Ứng dụng kiểm tra thuộc tính `file.size` ngay trước khi nạp vào bộ nhớ RAM, lập tức từ chối tệp và hiển thị thông báo lỗi thân thiện, bảo vệ trình duyệt khỏi nguy cơ cạn kiệt bộ nhớ.
2. **Given** Người dùng nhập một tệp sao lưu JSON hợp lệ nhưng khác với dữ liệu hiện tại, **When** Quá trình thẩm định hoàn tất, **Then** Hệ thống hiển thị hộp thoại xác nhận rõ ràng (`confirm`), chỉ khi người dùng đồng ý thì `localStorage` mới được cập nhật; tuyệt đối không tự động ghi đè hoặc âm thầm xóa lịch sử học tập.
3. **Given** Người dùng học bài, làm bài thi hoặc thao tác trên ứng dụng, **When** Giám sát lưu lượng mạng (Network panel) và console log, **Then** $0$ byte dữ liệu cá nhân hay tiến độ học tập được gửi ra ngoài máy chủ, không thu thập bất kỳ telemetry nào ngoài phạm vi.

---

### User Story 3 - WCAG 2.2 Level AA Accessibility & Assistive Usability (Priority: P2)

Là một học viên sử dụng phím bấm hoặc công cụ hỗ trợ tiếp cận (screen reader), tôi muốn tất cả các hộp thoại (modal), menu ngăn kéo (drawer), bảng điều hướng câu hỏi, biểu đồ xu hướng SVG và 27 mô hình cơ chế bảo mật có đầy đủ nhãn tiếp cận (accessible names), quản lý tiêu điểm bàn phím chuẩn xác và tuân thủ tùy chọn giảm chuyển động (reduced motion), để tôi có thể học tập trọn vẹn mà không bị rào cản thao tác.

**Why this priority**: Giáo dục mở phải dành cho tất cả mọi người. Tuân thủ chuẩn quốc tế WCAG 2.2 AA thể hiện chất lượng kỹ thuật chuyên nghiệp và trách nhiệm cộng đồng của dự án NetStudy.

**Independent Test**: Thao tác toàn bộ ứng dụng thuần túy bằng bàn phím (Tab, Shift+Tab, Enter, Space, Escape, phím mũi tên); kiểm tra tiêu điểm được giữ trong modal khi mở (`focus trapping`) và trả về nút kích hoạt khi đóng; kích hoạt `prefers-reduced-motion` và xác nhận các hiệu ứng động được giảm thiểu; quét tự động bằng `axe-core`.

**Acceptance Scenarios**:
1. **Given** Hộp thoại cảnh báo dung lượng (`#quotaModal`) hoặc menu di động (`#mobileDrawer`) mở ra, **When** Người dùng nhấn phím `Tab`, **Then** Tiêu điểm bàn phím chỉ di chuyển tuần hoàn bên trong hộp thoại; khi nhấn phím `Escape`, hộp thoại đóng lại và tiêu điểm tự động trả về phần tử kích hoạt trước đó.
2. **Given** Mọi phần tử tương tác trên giao diện (nút bấm, liên kết, thẻ trắc nghiệm, nút chuyển bước mô hình), **When** Nhận tiêu điểm bàn phím (`:focus-visible`), **Then** Luôn hiển thị viền tương phản cao tối thiểu 2px, không bị che khuất và đáp ứng tỷ lệ tương phản tối thiểu 3:1 so với nền.
3. **Given** Thiết bị người dùng bật chế độ `prefers-reduced-motion: reduce`, **When** Truy cập trang chủ, chuyển route hoặc tương tác với mô hình SVG, **Then** Tất cả hiệu ứng chuyển động (xoay biểu tượng, trượt float tag, chuyển cảnh drawer) tự động vô hiệu hóa hoặc chuyển sang chuyển đổi tức thì.
4. **Given** 27 mô hình trực quan SVG và biểu đồ xu hướng điểm số, **When** Trình đọc màn hình duyệt qua, **Then** Thẻ `<svg>` có đầy đủ thuộc tính `role="img"` và nhãn mô tả tiếp cận (`aria-label` hoặc thẻ `<title>`), các nút điều khiển bước có nhãn giải nghĩa rõ ràng.

---

### User Story 4 - Production Build Integrity & Asset Cache Busting (Priority: P2)

Là một người học quay lại NetStudy sau khi ứng dụng được cập nhật phiên bản mới, tôi muốn trình duyệt tự động nạp chính xác phiên bản mã nguồn mới nhất mà không bị lỗi xung đột bộ nhớ đệm (stale cache), không bị liên kết gãy (broken links), và có trang 404 thân thiện điều hướng về ứng dụng khi gõ sai đường dẫn trên GitHub Pages.

**Why this priority**: Trình duyệt có xu hướng cache các tệp `.js` và `.css` rất lâu. Nếu không có cơ chế quản lý phiên bản tài nguyên (cache busting), học viên cũ sẽ gặp lỗi không tương thích phiên bản dữ liệu hoặc giao diện bị vỡ.

**Independent Test**: Kiểm tra toàn bộ tham chiếu tệp tĩnh trong `dist/index.html`; kiểm tra sự hiện diện của tệp `404.html` điều hướng mượt mà về ứng dụng gốc; kiểm tra tệp `.nojekyll` và tệp `manifest.webmanifest`.

**Acceptance Scenarios**:
1. **Given** Tệp `dist/index.html`, **When** Kiểm tra tất cả thẻ `<link rel="stylesheet">` và `<script src="...">`, **Then** 100% tài nguyên (bao gồm `data.js`, `core.js`, `models.js`, `model-ui.js`, `app.js`, `style.css`, `models.css`) đều có gắn định danh phiên bản phát hành thống nhất (ví dụ `?v=6`).
2. **Given** Người dùng nhập sai một đường dẫn tĩnh trên GitHub Pages (ví dụ `/netstudy-network-security/tailieu-cu.html`), **When** Máy chủ trả về lỗi 404, **Then** Tệp `dist/404.html` được hiển thị với giao diện chuẩn NetStudy, tự động chuyển hướng an toàn về trang chủ ứng dụng thông qua meta refresh hoặc liên kết trực tiếp.
3. **Given** Người dùng truy cập NetStudy trên thiết bị di động, **When** Mở menu trình duyệt và chọn "Thêm vào màn hình chính" (Install PWA), **Then** Tệp `manifest.webmanifest` cung cấp đầy đủ tên ứng dụng, chế độ hiển thị `standalone`, màu sắc nhận diện `#15634f` và biểu tượng phù hợp.

---

### User Story 5 - Release Pipeline Gate & Deployment Approval (Priority: P3)

Là Release Engineer chịu trách nhiệm phát hành, tôi muốn quy trình triển khai lên GitHub Pages trên GitHub Actions được bảo vệ nghiêm ngặt: chỉ kích hoạt sau khi đã vượt qua toàn bộ các cổng chất lượng (Unit, E2E, Trợ năng, Ngân sách SLA) và có sự phê duyệt thủ công rõ ràng (approval gate), đồng thời có quy trình khôi phục phiên bản trước (rollback) khi phát hiện sự cố.

**Why this priority**: Bảo đảm không một phiên bản lỗi, hồi quy hiệu năng hay vi phạm bảo mật nào có thể tự ý xuất hiện trên môi trường sản xuất công khai.

**Independent Test**: Kiểm toán tệp `.github/workflows/pages.yml`; xác nhận phiên bản GitHub Actions chính xác; xác thực cổng kiểm tra toàn diện `npm test` và `checks*.cjs` được thực thi trước bước đóng gói; xác nhận bước deploy yêu cầu phân quyền môi trường rõ ràng.

**Acceptance Scenarios**:
1. **Given** Workflow GitHub Actions `.github/workflows/pages.yml`, **When** Rà soát các action sử dụng, **Then** Phiên bản action là chính thức và hợp lệ (`actions/checkout@v4`, `actions/deploy-pages@v4`), không sử dụng các phiên bản không tồn tại hoặc rủi ro.
2. **Given** Quá trình build production trong workflow Pages, **When** Bước kiểm thử thực thi, **Then** Toàn bộ 4 bài kiểm thử logic (`checks.cjs`, `checks-models.cjs`, `checks-perf.cjs`, `checks-learning.cjs`) đều phải PASS trước khi bước tạo artifact phát hành được thực hiện.
3. **Given** Một sự cố nghiêm trọng phát hiện trên production, **When** Nhóm kỹ thuật kích hoạt quy trình Rollback, **Then** Bản build từ commit ổn định trước đó có thể được kích hoạt lại ngay lập tức thông qua cơ chế `workflow_dispatch` hoặc hoàn tác commit mà không làm mất dữ liệu của người học (nhờ kiến trúc Local-First).

---

### Edge Cases

- **EC-01**: **Tệp JSON Nhập chứa chuỗi HTML/Script độc hại**: Khi người dùng nhập một bản sao lưu bị kẻ xấu cố tình chèn chuỗi `<script>alert('pwned')</script>` vào trường tiêu đề bài thi (`title`) hoặc ID câu hỏi, hàm `e()` và bộ thẩm định lược đồ phải vô hiệu hóa hoàn toàn mã này trước khi hiển thị ra DOM.
- **EC-02**: **Tệp Sao lưu vượt giới hạn 10MB**: Người dùng chọn nhầm tệp video/ISO có dung lượng 500MB vào ô tải lên sao lưu. Trình duyệt không được phép đọc toàn bộ tệp vào bộ nhớ (tránh crash tab); thuộc tính `file.size` phải chặn ngay tại tầng giao diện.
- **EC-03**: **Đường dẫn GitHub Pages có Subpath**: Ứng dụng chạy tại `https://datmoitapdev.github.io/netstudy-network-security/`. Toàn bộ liên kết tài nguyên phải là đường dẫn tương đối (không có gạch chéo đầu `/`), đảm bảo không bị lỗi 404 khi load tài nguyên trên project page.
- **EC-04**: **Điều hướng Tab phím khi Modal mở**: Người dùng nhấn `Tab` liên tục khi modal cảnh báo dung lượng đang mở. Tiêu điểm không được phép lọt ra các phần tử mờ phía sau modal (`focus trap`).
- **EC-05**: **Trình duyệt Tắt Javascript hoặc Không Hỗ trợ Web Crypto**: Hiển thị thông báo `<noscript>` thân thiện hướng dẫn người học bật JavaScript để tiếp cận giáo trình.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: **Khử nhiễm DOM & Chống XSS Toàn diện**: Mọi giá trị động được đưa vào DOM thông qua template literal hoặc `innerHTML` (bao gồm route hash, từ khóa tìm kiếm từ điển/bài học, tiêu đề phiên thi trong lịch sử, ghi chú sao lưu) BẮT BUỘC phải được khử nhiễm qua hàm `e()` hoặc hàm an toàn tương đương.
- **FR-002**: **Bảo mật Bằng Content Security Policy (CSP)**: Tệp `dist/index.html` BẮT BUỘC khai báo thẻ `<meta http-equiv="Content-Security-Policy">` với cấu hình nghiêm ngặt:
  ```text
  default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self';
  ```
  [NEEDS CLARIFICATION: Q1 - Inline Script Strategy for Theme Initialization]
- **FR-003**: **Bảo vệ Nhập Dữ liệu Sao lưu (Data Ingestion Hardening)**: Quá trình nhập JSON BẮT BUỘC:
  1. Kiểm tra kích thước tệp `file.size <= 10 * 1024 * 1024` (10MB) trước khi gọi `file.text()`.
  2. Thẩm định cấu trúc lược đồ Schema v2 (`StudyCore.validate()`).
  3. Kiểm tra tính hợp lệ của tất cả ID câu hỏi đối chiếu với ngân hàng câu hỏi hiện hành `bank`.
  4. BẮT BUỘC yêu cầu người dùng xác nhận thông qua hộp thoại trước khi thay thế dữ liệu `localStorage`.
- **FR-004**: **Tuyệt đối Không Telemetry & Bảo vệ Quyền riêng tư**: Ứng dụng BẮT BUỘC chạy $100\%$ phía client; KHÔNG gửi bất kỳ dữ liệu cá nhân, câu trả lời, điểm số, hoặc log phân tích nào ra bên ngoài.
- **FR-005**: **Quản lý Tiêu điểm Hộp thoại Chuẩn WCAG (Focus Trapping & Escape)**:
  1. Hộp thoại dung lượng (`#quotaModal`) và menu di động (`#mobileDrawer`) khi mở ra BẮT BUỘC tự động đưa tiêu điểm vào nút thao tác đầu tiên và khóa tiêu điểm (`focus trap`) bên trong hộp thoại.
  2. Nhấn phím `Escape` BẮT BUỘC đóng hộp thoại/menu và trả tiêu điểm về nút kích hoạt ban đầu.
- **FR-006**: **Trợ năng Khả năng Tiếp cận Toàn diện (WCAG 2.2 AA)**:
  1. Tất cả nút bấm và liên kết không có văn bản nhìn thấy BẮT BUỘC có `aria-label` mô tả rõ ràng hành động.
  2. Tất cả biểu tượng trang trí SVG BẮT BUỘC có `aria-hidden="true"`.
  3. Viền `:focus-visible` BẮT BUỘC hiển thị rõ ràng trên mọi thành phần tương tác với độ dày tối thiểu 2px.
  4. Hỗ trợ đầy đủ truy vấn `prefers-reduced-motion: reduce` trong CSS để vô hiệu hóa các chuyển động không cần thiết.
- **FR-007**: **Quản lý Phiên bản & Chống Cache Cũ (Asset Cache Busting)**: Tất cả tài nguyên `.js` và `.css` trong `dist/index.html` BẮT BUỘC được đánh dấu phiên bản phát hành thống nhất (ví dụ `?v=6`) để đảm bảo người học luôn nạp đúng bản cập nhật mới nhất.
- **FR-008**: **Trang 404 Dự phòng & Bỏ qua Jekyll trên GitHub Pages**:
  1. Cung cấp tệp `dist/404.html` thân thiện, tự động điều hướng an toàn về URL gốc của NetStudy. [NEEDS CLARIFICATION: Q2 - 404 Redirection Mechanism]
  2. Cung cấp tệp `dist/.nojekyll` rỗng để chỉ thị cho GitHub Pages không chạy bộ xử lý Jekyll.
- **FR-009**: **Hồ sơ Ứng dụng Web PWA (Web App Manifest)**: Cung cấp tệp `dist/manifest.webmanifest` khai báo metadata chuẩn mực, cho phép người dùng cài đặt NetStudy thành ứng dụng độc lập trên điện thoại và máy tính. [NEEDS CLARIFICATION: Q3 - PWA Scope & Service Worker]
- **FR-010**: **Chuẩn hóa Workflow Triển khai GitHub Pages**: Tệp `.github/workflows/pages.yml` BẮT BUỘC:
  1. Sửa lỗi phiên bản action: sử dụng `actions/checkout@v4` thay cho phiên bản không hợp lệ `actions/checkout@v6`.
  2. Bổ sung bước kiểm thử toàn diện (`checks.cjs`, `checks-models.cjs`, `checks-perf.cjs`, `checks-learning.cjs`) trước bước đóng gói artifact.
  3. Duy trì thiết lập quyền hạn tối thiểu: `permissions: { contents: read }` cho job build, và chỉ cấp `pages: write` cho job deploy.

---

### Key Entities *(include if feature involves data)*

- **SecurityPolicy**: Tập hợp các quy tắc Content Security Policy bảo vệ ứng dụng (các directive: `default-src`, `script-src`, `style-src`, `img-src`, `object-src`, `base-uri`).
- **BackupPayload**: Cấu trúc dữ liệu xuất/nhập sao lưu người dùng (`app`, `exportedAt`, `schemaVersion: 2`, `data: UserStorageState`).
- **AccessibilityState**: Trạng thái quản lý tiêu điểm và điều hướng hỗ trợ (phần tử đang giữ tiêu điểm `activeElement`, phần tử nguồn kích hoạt `triggerElement`, cờ modal mở `isModalOpen`).
- **ReleaseCandidate**: Phiên bản phát hành hoàn chỉnh của thư mục `dist/` thỏa mãn 100% các cổng kiểm thử Unit, E2E, WCAG và ngân sách hiệu năng.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **Không còn Lỗ hổng Bảo mật (Zero Vulnerabilities)**: 0 phát hiện lỗ hổng ở mức CRITICAL, HIGH, MEDIUM trong kiểm toán XSS, kiểm toán phụ thuộc `npm audit`, và kiểm tra rò rỉ dữ liệu.
- **SC-002**: **Tuân thủ WCAG 2.2 AA Tuyệt đối**: Quét tự động bằng `@axe-core/playwright` đạt **0 vi phạm critical và serious** trên toàn bộ các route; 100% các luồng modal và bàn phím đều đáp ứng kiểm tra thủ công.
- **SC-003**: **Ngân sách Payload & Hiệu năng được Duy trì**: Tổng dung lượng uncompressed toàn bộ thư mục `dist/` duy trì nghiêm ngặt **$\le 735.00\text{ KB}$** (752,640 bytes); thời gian đánh giá script $\le 20.0\text{ms}$; thời gian render route $\le 0.50\text{ms}$; điểm CLS giữ nguyên $0.00$.
- **SC-004**: **Độ tin cậy Phát hành 100%**: 100% các bài test (Node.js regression suites, Playwright E2E suites) đều PASS với mã thoát 0; không có liên kết gãy hoặc tệp tài nguyên bị lỗi 404 trên GitHub Pages.

---

## Assumptions

- **A-001**: NetStudy tiếp tục duy trì kiến trúc Vanilla HTML/CSS/JS thuần túy không dependencies tại runtime; không đưa bất kỳ framework frontend nào vào `dist/`.
- **A-002**: Máy chủ lưu trữ chính thức là GitHub Pages với mô hình Static Site Hosting, do đó CSP chỉ có thể thiết lập qua thẻ `<meta>` mà không thể can thiệp HTTP response headers của máy chủ.
- **A-003**: Dữ liệu tiến độ của người học hoàn toàn thuộc quyền sở hữu của người học trên thiết bị cá nhân; việc cập nhật mã nguồn không làm mất hoặc thay đổi cấu trúc `localStorage` hiện tại.
- **A-004**: Người dùng truy cập bằng các trình duyệt web hiện đại (Chrome, Edge, Firefox, Safari) có hỗ trợ đầy đủ ES2022 và các API web tiêu chuẩn.

---

## Clarification Questions *(max 3)*

### Question 1: CSP Inline Script Strategy for Theme Initialization

**Context**: NetStudy hiện có một khối script nội tuyến nhỏ trong thẻ `<head>` của `dist/index.html` để đọc `localStorage` và gán thuộc tính `data-theme` trước khi DOM được vẽ, nhằm chống hiện tượng nhấp nháy giao diện (FOUC). Nếu áp dụng CSP nghiêm ngặt:

**What we need to know**: Chúng ta nên chọn phương án nào để vừa áp dụng Content Security Policy nghiêm ngặt, vừa chống được FOUC?

**Suggested Answers**:

| Option | Answer | Implications |
| :--- | :--- | :--- |
| **A** *(Recommended)* | Cho phép `'unsafe-inline'` cho `script-src` trong meta CSP: `script-src 'self' 'unsafe-inline'` | Triển khai nhanh, không cần tách file, bảo đảm trải nghiệm không bị FOUC, trong khi vẫn khóa chặt `object-src 'none'`, `base-uri 'self'` và không cho tải script từ bên thứ ba. |
| **B** | Sử dụng mã băm SHA-256 cho inline script trong CSP: `script-src 'self' 'sha256-...'` | Nghiêm ngặt hơn phương án A, không cần `'unsafe-inline'`, nhưng mỗi lần nội dung script đổi thì mã băm phải được tính toán lại. |
| **C** | Tách khối code này ra thành tệp tĩnh độc lập `theme-init.js` với `script-src 'self'` | Không cần bất kỳ inline script nào, nhưng có thể xuất hiện độ trễ microsecond khi nạp tệp JS ngoài trên một số trình duyệt. |

---

### Question 2: Custom 404 Behavior on GitHub Pages

**Context**: Khi người học truy cập vào một đường dẫn không tồn tại trên GitHub Pages (ví dụ gõ nhầm URL), GitHub Pages sẽ tìm kiếm tệp `404.html` trong thư mục phát hành.

**What we need to know**: Cơ chế xử lý của tệp `404.html` nên hoạt động như thế nào?

**Suggested Answers**:

| Option | Answer | Implications |
| :--- | :--- | :--- |
| **A** *(Recommended)* | Tự động chuyển hướng về trang chủ ứng dụng với thông báo thân thiện (Meta Refresh 0s kèm thông báo Toast) | Bảo đảm người học không bị kẹt ở trang lỗi; tự động đưa người học về giao diện chính của NetStudy an toàn. |
| **B** | Trang thông báo lỗi 404 tĩnh chuyên biệt theo phong cách NetStudy kèm nút bấm "Quay lại Trang chủ" | Người học biết rõ đường dẫn vừa nhập không tồn tại và tự chủ động bấm nút quay về. |
| **C** | Chuyển hướng kèm bảo toàn URL hash để hỗ trợ khôi phục bài học đang mở | Linh hoạt hơn cho người học dùng bookmark cũ, nhưng cần thêm một đoạn script xử lý hash trong `404.html`. |

---

### Question 3: Web App Manifest & Offline Service Worker Scope

**Context**: NetStudy là ứng dụng Local-First. Việc bổ sung `manifest.webmanifest` giúp người dùng cài đặt ứng dụng lên màn hình chính (PWA).

**What we need to know**: Phạm vi triển khai PWA của Feature 006 có bao gồm Service Worker để cài đặt offline đầy đủ không?

**Suggested Answers**:

| Option | Answer | Implications |
| :--- | :--- | :--- |
| **A** *(Recommended)* | Chỉ tạo `manifest.webmanifest` (App Metadata, Icons, Standalone Display) mà KHÔNG dùng Service Worker phức tạp | Cực kỳ an toàn, nhẹ nhàng, không gây rủi ro kẹt cache khi cập nhật học liệu, hỗ trợ cài đặt app trên Android/iOS/Desktop. |
| **B** | Bao gồm Service Worker với chiến lược Cache-First | Hỗ trợ mở trang web ngay cả khi không có kết nối internet ban đầu, nhưng cần quản lý vòng đời Service Worker cẩn thận để tránh lỗi stale cache. |
