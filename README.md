# NetStudy — An toàn mạng máy tính

Ứng dụng học tập bằng tiếng Việt, xây dựng bằng HTML, CSS và JavaScript thuần. Không cần framework, thư viện npm hoặc backend.

## Chức năng

- 9 bài, 95 mục học, 264 câu hỏi giải thích từng lựa chọn và 278 thuật ngữ.
- Luyện tập theo bài/chủ đề/mức độ; học có giải thích hoặc tự kiểm tra.
- Đề cố định và ngẫu nhiên: 40 câu / 75 phút, tự nộp khi hết giờ.
- Ma trận ôn tập đề xuất: 12 nhận biết, 20 thông hiểu, 8 vận dụng; không phải cấu trúc đề thật. Điểm = số câu đúng × 0,25, không trừ điểm sai.
- Lưu tiến độ, bài đang làm, lịch sử; ôn câu sai và câu đánh dấu.
- Xuất/nhập bản sao lưu; giao diện đáp ứng máy tính và điện thoại.
- Nguồn trang PDF và ghi chú nội dung cần xác minh.

## Chạy trên Windows

Cài Python 3 nếu chưa có. Giải nén, mở Terminal ở thư mục chứa README và chạy:

```powershell
py -m http.server 8000 --directory dist
```

Mở http://localhost:8000. Dừng server bằng Ctrl+C. macOS/Linux dùng `python3` thay `py`. Thư mục `dist/` đã sẵn sàng để chạy, không cần bước build.

## Cấu trúc

| Đường dẫn | Vai trò |
| --- | --- |
| `dist/index.html` | Khung giao diện |
| `dist/style.css` | Màu sắc, bố cục, responsive |
| `dist/app.js` | Bài học, luyện tập, lịch sử, nhập/xuất |
| `dist/core.js` | Sinh đề, chấm điểm, kiểm tra sao lưu |
| `dist/data.js` | Học liệu đã ghép từ JSON nguồn |
| `content-a.json` | Bài 1, 2a, 2b |
| `content-b.json` | Bài 3, 4, 5 |
| `content-c.json` | Bài 6, 7, 8 |
| `source-pages.json` | Danh mục 802 trang nguồn |
| `assemble.py` | Ghép học liệu, ánh xạ mục, trộn lựa chọn ổn định |
| `checks.cjs` | Kiểm thử bằng Node.js và DOM giả lập |
| `.github/workflows/pages.yml` | Kiểm tra và triển khai GitHub Pages |

## Sửa học liệu và kiểm thử

Sửa các JSON nguồn, sau đó chạy:

```powershell
py assemble.py
node --check dist/app.js
node --check dist/core.js
node checks.cjs
```

Dùng Python 3.10+ và Node.js 22+. Không cần `npm install`. Giữ mã bài, mục và câu cũ khi bổ sung học liệu. Không dùng lại một mã câu cho câu khác về bản chất. Không sửa riêng `dist/data.js` rồi chạy assemble vì thay đổi sẽ bị ghi đè.

Kiểm thử bao gồm schema, các trang chức năng, 100 lượt sinh đề, ma trận, chấm điểm, ẩn lời giải, hết giờ, lưu/khôi phục và sao lưu. DOM giả lập không thay thế kiểm tra trực quan trên trình duyệt. Trước khi phát hành bản sửa, thử thêm giao diện desktop/mobile, tìm kiếm, nút điều hướng và nhập/xuất file trên trình duyệt.

## Đưa lên GitHub và bật GitHub Pages

1. Tạo repository mới, ví dụ `netstudy-network-security`.
2. Đưa **nội dung bên trong** thư mục `netstudy-source` vào gốc repo. Giữ cả thư mục `.github`; `dist/`, README và `.github/` phải nằm ngay ở gốc.
3. Nếu dùng Git, mở Terminal tại thư mục này và chạy, thay URL bằng URL repo của bạn:

```sh
git init
git add .
git commit -m "Initial NetStudy learning app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

4. Trong repository, vào **Settings → Pages → Build and deployment → Source → GitHub Actions**.
5. Mở **Actions → Deploy NetStudy to GitHub Pages → Run workflow** trên nhánh `main` nếu cần chạy lại sau khi bật Pages.
6. Khi thành công, mở URL trong deployment `github-pages`, thường có dạng `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/`.

Workflow kiểm tra trước khi tải `dist/` lên Pages và chạy khi push vào `main`. Nếu dùng tên nhánh khác, sửa `branches` trong workflow. Asset dùng đường dẫn tương đối và điều hướng hash để chạy được dưới đường dẫn con của project Pages.

Tài liệu GitHub: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

## Lưu dữ liệu và chuyển từ website cũ

Lịch sử chỉ lưu trong localStorage của hồ sơ trình duyệt hiện tại, không gửi lên máy chủ. Xóa dữ liệu website, đổi trình duyệt hoặc dùng chế độ riêng tư có thể làm mất tiến độ. Người cùng dùng hồ sơ trình duyệt có thể xem lịch sử ở đó.

Khi chuyển từ Sites sang GitHub Pages, địa chỉ website thay đổi nên lịch sử **không tự chuyển sang**. Ở web cũ chọn **Dữ liệu cá nhân → Xuất bản sao lưu JSON**, sau đó ở web mới chọn **Nhập bản sao lưu**. Không đưa file sao lưu cá nhân lên repository.

Đồng hồ dùng thời hạn tuyệt đối: đóng trang không dừng thời gian thi. Giữ cùng khóa localStorage và các mã bài/câu khi cập nhật phiên bản để giữ lịch sử.

## Nguồn và phạm vi

Học liệu biên soạn từ 9 PDF môn An toàn mạng máy tính do người học cung cấp; tham chiếu chi tiết hiển thị trong ứng dụng. Bản xuất không kèm PDF gốc. Diễn giải, ví dụ và câu hỏi là học liệu bổ trợ được xây dựng với hỗ trợ AI, có ghi chú các phát biểu cần xác minh. Đây là dự án học tập cá nhân, không gắn nhãn đề thi thật.

Bản xuất không chứa kho Git cũ, cấu hình định danh Sites, thông tin xác thực hoặc lịch sử làm bài cá nhân.
