# Feature Specification: NetStudy Automated Testing & Reliability

**Feature Directory**: `specs/005-testing-reliability`  
**Feature Branch**: `feat/005-testing-reliability`  
**Created**: 2026-11-04  
**Status**: Draft (Ready for Clarification & Planning)  
**Input**: User description: "Khởi tạo Feature 005 — Automated Testing & Reliability. Thiết kế hệ thống kiểm thử toàn diện gồm End-to-End Testing (Playwright), Data Integrity Testing (Schema v2 migration, import/export, quota), Smart Learning Testing (Mastery, Adaptive Practice, Dashboard, Analytics, History), Accessibility Testing (Keyboard, Focus, ARIA, axe-core, WCAG 2.2 AA), Performance Regression (Feature 003 metrics, payload budget), và Continuous Integration (GitHub Actions workflow). Bảo toàn tuyệt đối kiến trúc Vanilla HTML/CSS/JavaScript trong dist/."

---

## 1. Bối cảnh & Mục tiêu Kỹ thuật (Context & Goals)

NetStudy đã hoàn thành 4 giai đoạn phát triển nền tảng:
- **Feature 001**: Kiến trúc Micro-DOM, điều hướng bàn phím tiếp cận và cuộn tự nhiên.
- **Feature 002**: Hệ thống Design Tokens 3 tầng, Theme Engine (Sáng/Tối/Tự động) và 17 vector SVG icons.
- **Feature 003**: Tối ưu hóa hiệu năng Core Web Vitals ($\text{CLS} = 0.00$, render route $< 0.5\text{ms}$), CSS Containment và bộ đệm 27 mô hình tương tác SVG.
- **Feature 004**: Trải nghiệm học tập thông minh (Learning Dashboard, Sổ ôn tập 4 tabs, Máy trạng thái Mastery 2 chuỗi đúng theo CL-01, Luyện tập thích ứng 4 presets, Biểu đồ xu hướng điểm số SVG và Schema v2).

Tuy nhiên, toàn bộ hệ thống kiểm thử hiện tại chủ yếu là các bài kiểm tra headless chạy trong môi trường Node.js mô phỏng (`vm` context và chuỗi regex DOM). Mặc dù các script `checks.cjs`, `checks-models.cjs`, `checks-perf.cjs`, và `checks-learning.cjs` đã thực hiện rất tốt việc kiểm chứng logic thuần túy, dự án vẫn thiếu:
1. **Kiểm thử Trình duyệt Thực tế (Real Browser E2E Testing)**: Chưa kiểm chứng hành vi click, hover, cuộn trang, đổi viewport (di động $320\text{px}$ đến màn hình rộng $1440\text{px}$) và tương tác đa trình duyệt (Chromium, Firefox, WebKit) trên môi trường DOM thực tế.
2. **Kiểm thử Tương tác Mô hình Cơ chế Thực tế**: 27 mô hình SVG với 112 bước tuần tự cần được kích hoạt sự kiện click nút bấm, chuyển bước, kiểm tra thuộc tính đồ họa và hiển thị trực quan trên trình duyệt.
3. **Kiểm tra Trợ năng Tự động (Automated Accessibility Scans)**: Chưa tích hợp bộ quét trợ năng tự động tiêu chuẩn công nghiệp (như `axe-core`) để phát hiện sớm các vi phạm WCAG 2.2 Level AA về màu sắc, nhãn accessible name, và cấu trúc cây DOM.
4. **Hệ thống Tích hợp Liên tục (Continuous Integration - CI)**: Chưa có GitHub Actions workflow tự động kích hoạt bộ kiểm thử, thu thập Playwright traces/screenshots khi có lỗi, và chặn các Pull Request gây suy giảm chất lượng hoặc phá vỡ các nguyên tắc Hiến pháp (Constitution).

**Mục tiêu của Feature 005**: Thiết lập khung kiểm thử và đảm bảo độ tin cậy tự động hóa toàn diện, chuyên nghiệp cho NetStudy; tích hợp Playwright, axe-core và GitHub Actions CI; cam kết duy trì tuyệt đối kiến trúc thuần khiết (Vanilla JS/HTML/CSS trong `dist/`, 0 runtime dependencies).

---

## 2. Quyết định Thiết kế & Giới hạn Phạm vi

- **Công cụ Kiểm thử Ngoại vi (Testing Stack as devDependencies)**:
  - Framework E2E: **Playwright** (chạy headless trên Chromium, Firefox, WebKit và Mobile Emulation).
  - Quét Trợ năng: **@axe-core/playwright** kết hợp thẩm định thủ công các tiêu chí WCAG 2.2 AA.
  - Toàn bộ công cụ kiểm thử chỉ được khai báo trong `devDependencies` của `package.json`, tuyệt đối không đưa bất kỳ mã nguồn kiểm thử hay runtime framework nào vào thư mục phân phối `dist/`.
- **Cô lập Dữ liệu Kiểm thử (Test Data Isolation)**:
  - Mỗi kịch bản kiểm thử E2E khởi chạy trong một `browserContext` hoàn toàn độc lập, sử dụng `localStorage` sandbox được khởi tạo trước bằng dữ liệu fixture được kiểm soát, ngăn chặn hiện tượng rò rỉ trạng thái giữa các bài test.
- **Tính Bất biến của Hiệu năng & Dung lượng (Performance SLA)**:
  - Thư mục `dist/` phục vụ người dùng cuối giữ vững ngân sách $\le 735.00\text{ KB}$ (ngưỡng hiện tại $734.89\text{ KB}$). Các tệp kiểm thử nằm trong thư mục `tests/` hoặc `.github/` không ảnh hưởng đến dung lượng người dùng tải về.
- **Quy tắc Kiểm thử Thời gian (Deterministic Clock Testing)**:
  - Kiểm thử đồng hồ đếm ngược 75 phút và tự động nộp bài khi hết giờ phải sử dụng cơ chế tua nhanh thời gian (Playwright `page.clock.fastForward` hoặc fake timers) để kiểm chứng chính xác trong vài mili-giây, không được sử dụng lệnh chờ thời gian thực (`sleep`).

---

## 3. User Scenarios & Testing *(mandatory)*

### User Story 1 — Kiểm thử Trải nghiệm Toàn trình Đa Trình duyệt (Priority: P1) 🎯 MVP

Là một Kỹ sư Đảm bảo Chất lượng, tôi muốn một bộ kiểm thử E2E tự động mô phỏng chính xác toàn bộ hành trình của người học trên các trình duyệt hiện đại (Chromium, Firefox, WebKit) và thiết bị di động, để bảo đảm ứng dụng hoạt động không lỗi trước mỗi lần phát hành.

**Why this priority**: Đảm bảo học viên có trải nghiệm học tập và làm bài mượt mà trên mọi thiết bị và trình duyệt thực tế.

**Independent Test**: Chạy lệnh kiểm thử E2E:
1. Mở trang chủ, kiểm tra tiêu đề, navigation sidebar trên desktop và drawer menu trên mobile.
2. Đổi giao diện Sáng $\rightarrow$ Tối $\rightarrow$ Tự động, xác nhận thuộc tính `data-theme` trên `<html>` và màu nền thay đổi đồng bộ.
3. Học một bài học lý thuyết: mở Bài 1, đánh dấu "Đã học mục này", kiểm tra icon tích xanh cập nhật tức thì trong DOM mà không cần reload trang.
4. Luyện tập trắc nghiệm: trả lời câu hỏi, kiểm tra hiển thị giải thích đáp án ở chế độ học, kiểm tra điều hướng câu tiếp theo bằng cả chuột và phím tắt `1`/`2`/`3`/`4`.
5. Thi thử 40 câu: bắt đầu đề cố định A, chọn đáp án, đánh dấu câu xem lại, sử dụng đồng hồ tua nhanh thời gian đến khi hết giờ và xác nhận bài thi tự động nộp thành công với kết quả chính xác.

**Acceptance Scenarios**:
1. **Given** người học truy cập bằng trình duyệt di động (viewport $375\text{px}$), **When** nhấn vào nút menu "Thêm", **Then** drawer navigation trượt lên mượt mà, chứa đầy đủ các liên kết phụ và nút đổi giao diện.
2. **Given** học viên đang làm bài thi thử 40 câu, **When** thời gian làm bài vượt quá 75 phút, **Then** hệ thống tự động khóa bài thi, nộp bài, tính điểm và chuyển hướng học viên đến trang kết quả với chỉ dấu "Hết giờ".

---

### User Story 2 — Kiểm chứng An toàn Dữ liệu & Tính Toàn vẹn Lược đồ (Priority: P1) 🎯 MVP

Là một Kiến trúc sư Hệ thống, tôi muốn kiểm thử tự động toàn diện các tình huống di chuyển dữ liệu, lưu trữ, phục hồi và xử lý tràn bộ nhớ, để bảo đảm dữ liệu học tập của học viên không bao giờ bị mất mát hoặc hư hỏng.

**Why this priority**: NetStudy là ứng dụng Local-First. Dữ liệu tiến độ là tài sản quý giá nhất của học viên; bất kỳ lỗi mất dữ liệu nào đều là lỗi nghiêm trọng mức độ Critical.

**Independent Test**: Bộ test kiểm thử dữ liệu:
1. Nạp fixture dữ liệu Version 1 vào `localStorage`, tải lại trang và xác thực dữ liệu tự động nâng cấp lên Schema v2 với $100\%$ các trường được bảo toàn.
2. Xuất bản sao lưu JSON, xóa trắng `localStorage`, nhập lại tệp JSON vừa xuất và xác nhận toàn bộ lịch sử, thống kê câu hỏi và tiến độ được khôi phục nguyên vẹn.
3. Giả lập ngoại lệ `QuotaExceededError` khi lưu vào `localStorage`: xác nhận hiển thị modal cảnh báo thân thiện hướng dẫn người học xuất sao lưu JSON và xác nhận trước khi dọn dẹp lịch sử; kiểm tra không có hành vi âm thầm xóa dữ liệu.
4. Nạp dữ liệu JSON bị hỏng hoặc chứa câu hỏi không hợp lệ: xác nhận hệ thống từ chối an toàn, hiển thị thông báo lỗi rõ ràng và giữ nguyên trạng thái hợp lệ hiện tại.

**Acceptance Scenarios**:
1. **Given** một tệp sao lưu JSON chứa 120 phiên thi thử cũ, **When** người học nhập tệp vào hệ thống, **Then** toàn bộ 120 phiên được nạp đầy đủ vào bộ nhớ mà không bị cắt tỉa ngầm; banner cảnh báo hiển thị trên trang Lịch sử để người học chủ động chọn thời điểm dọn dẹp.
2. **Given** học viên đóng tab trình duyệt khi đang làm dở một bài luyện tập thích ứng, **When** mở lại trang web, **Then** thông báo "Bạn có bài đang làm dở" xuất hiện và học viên có thể tiếp tục làm bài mà không mất câu trả lời đã chọn.

---

### User Story 3 — Kiểm chứng Chức năng Học tập Thông minh & Tính Chân thực (Priority: P2)

Là một Nhà thiết kế Trải nghiệm Học tập, tôi muốn kiểm chứng máy trạng thái thành thạo (Mastery), thuật toán gợi ý thích ứng (Adaptive Practice), và các số liệu trên Dashboard / Analytics để đảm bảo tính đúng đắn sư phạm và không có số liệu giả tạo.

**Why this priority**: Đảm bảo các thuật toán gợi ý sư phạm hoạt động đúng cam kết, không đưa ra số liệu ảo hoặc câu hỏi trùng lặp gây ức chế cho học viên.

**Independent Test**:
1. Kiểm tra vòng đời câu hỏi: làm sai $\rightarrow$ `needs_practice` $\rightarrow$ làm đúng lần 1 trong luyện tập $\rightarrow$ `in_review` $\rightarrow$ làm đúng lần 2 trong phiên riêng biệt $\rightarrow$ `mastered`.
2. Kiểm tra biên làm bài thi: trả lời đúng trong bài thi thử 40 câu không làm câu hỏi tự động chuyển thành `mastered`.
3. Kiểm tra 4 preset thích ứng: Unseen (0 lần làm), Frequent Wrong (sắp xếp theo tỷ lệ sai), Weak Chapter (chương $< 70\%$), và Adaptive Mixed 50/30/20 với cơ chế fallback 3 cấp đảm bảo đủ số lượng và $0\%$ trùng lặp.
4. Kiểm tra trang Phân tích: biểu đồ đường SVG vẽ đúng tọa độ điểm thực tế; bảng phân bổ nhận thức phản ánh đúng 73 câu Nhận biết, 128 câu Thông hiểu, 63 câu Vận dụng.

**Acceptance Scenarios**:
1. **Given** một câu hỏi đang ở trạng thái `in_review` (chuỗi đúng $= 1$), **When** học viên trả lời sai ở lần tiếp theo, **Then** chuỗi đúng lập tức reset về 0 và câu hỏi quay lại danh sách "Cần ôn tập".
2. **Given** học viên mới chưa làm bất kỳ bài thi thử nào, **When** truy cập mục Lịch sử và Phân tích thi thử, **Then** giao diện hiển thị thông báo hướng dẫn làm bài thi đầu tiên, không hiển thị biểu đồ rỗng hay giá trị `NaN`.

---

### User Story 4 — Kiểm thử Trợ năng Tự động (WCAG 2.2 AA) & Quét axe-core (Priority: P2)

Là một Chuyên gia Trợ năng Web, tôi muốn chạy công cụ quét tự động axe-core trên tất cả các trang giao diện kết hợp kiểm thử điều hướng bàn phím chuyên sâu, để đảm bảo ứng dụng có thể sử dụng dễ dàng bởi người khuyết tật.

**Why this priority**: Tuân thủ Nguyên tắc VI của Hiến pháp NetStudy và tiêu chuẩn quốc tế WCAG 2.2 Level AA.

**Independent Test**:
1. Tích hợp `@axe-core/playwright` quét toàn bộ các route chính (`#home`, `#courses`, `#lesson/1`, `#practice`, `#exam`, `#review`, `#history`, `#models`, `#terms`, `#settings`).
2. Xác nhận 0 vi phạm ở mức nghiêm trọng (Critical/Serious) về độ tương phản, thiếu nhãn accessible name, sai vai trò ARIA hoặc cấu trúc danh sách.
3. Kiểm thử bàn phím thuần túy: duyệt toàn bộ trang chỉ bằng phím `Tab`, `Shift+Tab`, `Enter`, `Space`, `ArrowUp/Down`, `Escape` và kiểm tra viền focus hiển thị rõ ràng trên mọi thành phần tương tác.

**Acceptance Scenarios**:
1. **Given** học viên chỉ sử dụng bàn phím để làm bài trắc nghiệm, **When** nhấn các phím `1`, `2`, `3`, `4` hoặc `A`, `B`, `C`, `D`, **Then** phương án tương ứng được chọn ngay lập tức, nút nộp bài nhận focus hợp lệ khi chuyển câu.
2. **Given** trang Sổ ôn tập `#review`, **When** quét bằng axe-core, **Then** các thẻ tab có vai trò `role="tablist"` và `role="tab"` với trạng thái `aria-selected` hợp lệ, không có lỗi cấu trúc ARIA.

---

### User Story 5 — Kiểm thử Tương tác 27 Mô hình SVG An toàn Mạng (Priority: P3)

Là một Giảng viên An toàn Mạng, tôi muốn tự động hóa kiểm thử tương tác trên toàn bộ 27 mô hình trực quan (từ Mô hình 1.1 đến 8.2), để đảm bảo các bước diễn giải cơ chế, highlight đồ họa SVG và bài toán số học (RSA, Diffie-Hellman, OTP) luôn hoạt động chuẩn xác.

**Why this priority**: 27 mô hình trực quan là tài sản sư phạm độc đáo nhất của NetStudy; các bước chuyển động và giải thích toán học cần được bảo vệ chống hồi quy.

**Independent Test**:
1. Truy cập trang danh mục mô hình `#models` và từng trang bài học chứa mô hình.
2. Lặp qua tất cả 27 mô hình: nhấn nút "Bước tiếp theo", "Bước trước", và các nút nhảy bước trực tiếp.
3. Kiểm tra các phần tử `<g class="model-node">` và `<path class="model-edge">` nhận đúng lớp `is-active` và thuộc tính highlight theo từng bước.
4. Kiểm tra bài toán tính toán số học trên mô hình RSA (Mã hóa/Giải mã với khóa công khai/bí mật) và Diffie-Hellman (tính khóa chung bí mật qua modulo) hiển thị kết quả chính xác theo từng bước minh họa.

**Acceptance Scenarios**:
1. **Given** học viên mở mô hình Trao đổi khóa Diffie-Hellman (Mô hình 3.2), **When** nhấn chuyển qua cả 5 bước, **Then** các công thức lũy thừa modulo $(g^a \bmod p, g^b \bmod p, g^{ab} \bmod p)$ hiển thị giá trị số học tương ứng, không có lỗi render SVG.

---

### User Story 6 — Đường ống Tích hợp Liên tục (CI Workflow & Quality Gates) (Priority: P3)

Là một Trưởng nhóm Kỹ thuật (Lead Engineer), tôi muốn một workflow GitHub Actions tự động thực thi toàn bộ kiểm thử unit, kiểm thử hiệu năng, kiểm thử trợ năng và kiểm thử E2E mỗi khi có Pull Request mới, để ngăn chặn tuyệt đối mã lỗi lọt vào nhánh chính.

**Why this priority**: Tự động hóa hoàn toàn cổng kiểm soát chất lượng, giảm thiểu rủi ro con người và bảo đảm tính tuân thủ Hiến pháp của dự án.

**Independent Test**:
1. Tạo tệp cấu hình `.github/workflows/ci.yml`.
2. Thiết lập job chạy trên môi trường Ubuntu mới nhất: cài đặt Node.js, cài đặt Playwright browsers, chạy `node checks.cjs`, `node checks-models.cjs`, `node checks-perf.cjs`, `node checks-learning.cjs`, cú pháp `node --check` và Playwright test suite.
3. Kiểm tra cơ chế lưu trữ báo cáo (HTML report, Playwright traces, screenshots) dưới dạng GitHub Actions Artifacts khi có bài test thất bại để phục vụ gỡ lỗi nhanh chóng.
4. Cam kết không tự động deploy production, không yêu cầu secret token nhạy cảm ngoài quyền `contents: read` mặc định.

**Acceptance Scenarios**:
1. **Given** một Pull Request làm tăng dung lượng phân phối vượt quá ngân sách hoặc làm sai lệch ma trận đề thi 40 câu, **When** CI kích hoạt, **Then** workflow lập tức thất bại (exit code khác 0), chặn merge và xuất thông báo lỗi chi tiết trong pull request check.

---

## 4. Edge Cases & Boundary Conditions

- **EC-01: Kiểm thử thời gian thực của đồng hồ thi 75 phút**: Tránh việc chờ 75 phút thật gây timeout CI. Sử dụng cơ chế tua nhanh thời gian giả lập (`page.clock.fastForward(75 * 60 * 1000)`) để kích hoạt sự kiện hết giờ trong dưới $100\text{ms}$.
- **EC-02: Bộ nhớ `localStorage` bị vô hiệu hóa hoặc bị từ chối quyền truy cập**: Giả lập trình duyệt ở chế độ Private Browsing chặn ghi `localStorage`, kiểm tra ứng dụng hiển thị thông báo lỗi thân thiện (`storageError`) thay vì sụp đổ toàn bộ giao diện (White Screen of Death).
- **EC-03: Trình duyệt bị tắt đột ngột (Crash / Unexpected Close)**: Kiểm thử phục hồi trạng thái bài đang làm (`active session`) khi mở lại trình duyệt.
- **EC-04: Thiết bị màn hình siêu nhỏ ($320\text{px}$)**: Kiểm thử bố cục trên màn hình nhỏ nhất theo chuẩn WCAG, đảm bảo không có thanh cuộn ngang ngoài ý muốn (Horizontal Scrolling Bug), các nút bấm không bị tràn hoặc che khuất nội dung.
- **EC-05: Mạng chập chờn hoặc ngoại tuyến hoàn toàn (Offline Mode)**: Mở ứng dụng qua giao thức `file:///` hoặc ngắt kết nối mạng hoàn toàn; đảm bảo 100% chức năng học tập, luyện tập, thi thử và 27 mô hình hoạt động bình thường mà không cần mạng.
- **EC-06: Tránh hiện tượng bài test không ổn định (Flaky Tests)**: Không sử dụng `page.waitForTimeout()` cứng; chỉ sử dụng `expect().toBeVisible()` và bộ chờ sự kiện dựa trên trạng thái DOM xác định.

---

## 5. Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Playwright E2E Core User Journeys)**:
  Hệ thống kiểm thử PHẢI bao phủ toàn bộ các luồng người dùng cốt lõi bằng Playwright:
  - Điều hướng qua lại giữa 10 route chính (`#home`, `#courses`, `#lesson/:id`, `#terms`, `#models`, `#practice`, `#exam`, `#review`, `#history`, `#settings`).
  - Thao tác học bài và đánh dấu hoàn thành 95 mục lý thuyết.
  - Chế độ luyện tập có giải thích (`learn`) và tự kiểm tra (`test`).
  - Chế độ thi thử 40 câu / 75 phút: đếm ngược, nộp bài chủ động, và tự nộp khi hết giờ.
  - Xem kết quả bài thi và mở lại bài làm trong lịch sử.

- **FR-002 (Playwright Interactive Mechanism Models)**:
  Hệ thống kiểm thử PHẢI kiểm tra tự động 27 mô hình tương tác SVG:
  - Kiểm tra kết xuất đồ họa SVG của cả 27 mô hình.
  - Kích hoạt tuần tự các bước (tổng số 112 bước) bằng các nút điều khiển.
  - Xác thực các nút và cạnh SVG nhận đúng trạng thái active theo từng bước.
  - Xác thực các công thức toán học và số liệu minh họa cụ thể trong các mô hình mật mã (RSA, DH, OTP).

- **FR-003 (Local-First Data Integrity & Quota Resilience)**:
  Hệ thống kiểm thử PHẢI xác minh tính toàn vẹn dữ liệu:
  - Tự động di chuyển dữ liệu v1 sang v2 chuẩn xác, bảo lưu 100% lịch sử và các mục đã học.
  - Kiểm tra xuất và nhập tệp JSON sao lưu (Round-trip Export/Import) không làm suy giảm dữ liệu.
  - Kiểm tra xử lý an toàn dữ liệu hỏng, dữ liệu thiếu trường, hoặc tệp nhập $> 10\text{MB}$.
  - Kiểm tra hành vi khi gặp `QuotaExceededError`: hiển thị modal hướng dẫn sao lưu và yêu cầu xác nhận trước khi dọn dẹp lịch sử; tuyệt đối không âm thầm xóa dữ liệu.

- **FR-004 (Smart Learning Pedagogical Verification)**:
  Hệ thống kiểm thử PHẢI kiểm chứng máy trạng thái học tập:
  - Quy tắc công nhận thành thạo: đúng 2 lần liên tiếp trong 2 phiên luyện tập riêng biệt (`consecutiveCorrect >= 2`).
  - Trả lời sai lập tức reset chuỗi về 0 và đưa câu hỏi về mục "Cần ôn tập".
  - Trả lời đúng trong thi thử không tự động chuyển trạng thái thành `mastered`.
  - 4 preset luyện tập thích ứng hoạt động chính xác theo tiêu chí và không bao giờ chọn trùng câu hỏi.
  - Dashboard và Phân tích thi thử không hiển thị số liệu giả tạo khi chưa có dữ liệu.

- **FR-005 (Automated Accessibility Scans with axe-core)**:
  Hệ thống kiểm thử PHẢI tích hợp `@axe-core/playwright`:
  - Thực hiện quét trợ năng trên tất cả các trang chính.
  - Xác nhận 0 vi phạm ở mức nghiêm trọng (`critical` và `serious`).
  - Đảm bảo độ tương phản màu sắc $\ge 4.5:1$ cho văn bản thường và $\ge 3:1$ cho giao diện/đồ họa trên cả Theme Sáng và Theme Tối.
  - Phân định rõ ràng giữa các hạng mục kiểm tra tự động được (contrast, alt, roles) và các hạng mục bắt buộc kiểm thử người dùng thủ công (ý nghĩa sư phạm, ngữ điệu đọc của screen reader).

- **FR-006 (Keyboard Navigation & Focus Trapping)**:
  Hệ thống kiểm thử PHẢI kiểm tra khả năng tiếp cận bằng bàn phím:
  - Điều hướng bằng phím `Tab` và `Shift+Tab` qua tất cả các phần tử tương tác theo thứ tự logic.
  - Phím tắt số `1`/`2`/`3`/`4` và chữ `A`/`B`/`C`/`D` chọn đáp án tức thì trong phòng thi.
  - Phím `F` gắn cờ đánh dấu câu hỏi; phím mũi tên `ArrowLeft`/`ArrowRight` chuyển câu.
  - Phím `Escape` đóng menu drawer trên di động và đóng các modal cảnh báo.
  - Viền `:focus-visible` hiển thị rõ nét trên mọi phần tử nhận tiêu điểm.

- **FR-007 (Performance SLA & Core Web Vitals Regression Prevention)**:
  Hệ thống kiểm thử PHẢI đo lường và duy trì các chỉ số hiệu năng đã thiết lập ở Feature 003:
  - Cumulative Layout Shift: $\text{CLS} = 0.00$.
  - Đánh giá mã JavaScript ban đầu $\le 20.0\text{ms}$.
  - Thời gian chuyển đổi route trung bình $\le 0.50\text{ms}$.
  - Thời gian kết xuất mô hình SVG $\le 2.0\text{ms}$.
  - Giám sát kích thước tệp trong `dist/`: duy trì ngân sách $\le 735.00\text{ KB}$ cho gói người dùng cuối.

- **FR-008 (Continuous Integration Pipeline with GitHub Actions)**:
  Hệ thống PHẢI cung cấp tệp workflow `.github/workflows/ci.yml`:
  - Kích hoạt tự động khi có `push` lên các nhánh hoặc mở `pull_request`.
  - Chạy song song hoặc tuần tự: Kiểm tra cú pháp JS $\rightarrow$ Kiểm thử Unit & Regression (`checks*.cjs`) $\rightarrow$ Kiểm thử E2E Playwright.
  - Thu thập và tải lên Playwright Trace, Screenshots và Báo cáo kiểm thử HTML khi có lỗi để phục vụ chẩn đoán.
  - Thiết lập thời gian timeout tối đa cho workflow (không quá 15 phút) để tránh lãng phí tài nguyên CI.

---

### Non-Functional Requirements

- **NFR-001 (Zero Runtime Pollution)**: Tuân thủ nghiêm ngặt Nguyên tắc I và VII của Hiến pháp NetStudy: Playwright, axe-core và các thư viện kiểm thử chỉ tồn tại dưới dạng `devDependencies`. Tuyệt đối không thêm runtime dependencies vào thư mục `dist/`.
- **NFR-002 (CI Execution Speed & Determinism)**: Toàn bộ bộ kiểm thử E2E phải hoàn thành trong vòng dưới 3 phút trên hạ tầng GitHub Actions standard runners. Không có bài test phụ thuộc vào độ trễ mạng bên ngoài.
- **NFR-003 (Zero Flakiness)**: Loại bỏ triệt để các bài test không ổn định (Flaky Tests). Không dùng hard sleep; chỉ sử dụng state-based assertions và Playwright auto-waiting.
- **NFR-004 (Offline Autonomous Testing)**: Tất cả bài test unit và E2E phải có khả năng thực thi độc lập 100% trong môi trường ngoại tuyến (Local Dev Machine không có Internet).
- **NFR-005 (Security & Least Privilege)**: Workflow GitHub Actions chỉ yêu cầu quyền tối thiểu `contents: read`; không sử dụng hay yêu cầu các secrets nhạy cảm không cần thiết.

---

## 6. Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (100% E2E Flow Coverage)**: Toàn bộ 10 route chính, 27 mô hình SVG, và 3 chế độ làm bài (học, luyện, thi) được bao phủ bởi các kịch bản kiểm thử Playwright tự động.
- **SC-002 (Zero Critical Accessibility Violations)**: $100\%$ các trang quét bởi `axe-core` đạt kết quả 0 lỗi vi phạm ở mức `critical` hoặc `serious` theo chuẩn WCAG 2.2 AA.
- **SC-003 (Zero Regression Guarantee)**: 100% các bài kiểm thử hiện có (`checks.cjs`, `checks-models.cjs`, `checks-perf.cjs`, `checks-learning.cjs`) tiếp tục PASS với mã thoát 0 trong mọi lần chạy CI.
- **SC-004 (Fast CI Turnaround)**: Toàn bộ quy trình kiểm thử CI (bao gồm cài đặt môi trường, chạy unit tests, quét trợ năng và chạy E2E Playwright) hoàn tất trong vòng dưới 5 phút trên GitHub Actions.
- **SC-005 (100% Data Loss Prevention)**: $0\%$ trường hợp mất dữ liệu hoặc hỏng state trong các tình huống migration, import, export và giả lập tràn hạn mức lưu trữ.

---

## 7. Assumptions & Technical Constraints

1. Môi trường phát triển cục bộ và CI runner có cài đặt Node.js phiên bản $\ge 18.0.0$.
2. Playwright và `@axe-core/playwright` được cài đặt qua npm ở chế độ `devDependencies`. Thư mục `node_modules` chỉ phục vụ việc chạy test và CI, không bao giờ được commit hay đưa vào gói phát hành client.
3. Ứng dụng NetStudy được phục vụ cục bộ trong lúc chạy Playwright bằng một máy chủ tĩnh siêu nhẹ (như `npx serve dist` hoặc máy chủ HTTP tĩnh Node.js nội bộ không cần package ngoài).
4. Ngân sách dung lượng mã nguồn cho người dùng cuối trong `dist/` duy trì ở mức $\le 735.00\text{ KB}$ (ngưỡng hiện tại $734.89\text{ KB}$). Bất kỳ sự thay đổi nào đối với mã phân phối trong tương lai sẽ yêu cầu đánh giá ngân sách chính thức.
5. Việc thẩm định WCAG 2.2 AA bằng `axe-core` tự động chỉ bao phủ khoảng $30\% - 40\%$ các tiêu chí trợ năng (chủ yếu là tương phản, nhãn, vai trò). Các tiêu chí còn lại (chất lượng ngôn ngữ diễn giải, tính trực quan sư phạm, luồng đọc hiểu của độc giả dùng screen reader) được xác minh qua quy trình thẩm định tài liệu chuyên môn.
