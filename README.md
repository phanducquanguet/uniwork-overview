# UniWork Overview

Repo `UNIAI-TEAM/uniwork-overview`: nguồn của bộ slide **UniWork Architecture**.


Hồ sơ kiến trúc UniWork: bộ slide 10 trang, song ngữ **EN / VI** (mặc định EN), trình bày kiến trúc 5 tầng, nguyên tắc nền tảng và chương Work Graph (giữ tri thức doanh nghiệp, agent vào việc là có ngữ cảnh).

Toàn bộ nằm trong một file `index.html` (HTML, CSS, JS), không cần build.

## Xem và trình chiếu

- Mở `index.html` bằng trình duyệt, hoặc chạy `npm run serve` rồi vào http://localhost:8080. Cần mạng để tải font Google (Be Vietnam Pro, JetBrains Mono).
- Bản đăng trên Claude (riêng tư, chia sẻ từ menu Share): https://claude.ai/artifact/KkEP1nZ5NXjUrtaEGBDwCh

| Phím / thao tác | Kết quả |
|---|---|
| → · Space · nút **Next** · nhấp vào trang | Bước tiếp theo; hết bước thì sang trang |
| ← · nút **Back** | Lùi một bước; ở bước đầu thì về trang trước (hiện ở bước cuối) |
| ↓ / ↑ hoặc nút ‹ › trên thanh dẫn giải | Tiến / lùi một bước, không đổi trang |
| Bấm vạch bước | Nhảy tới bước đó |
| **▶ Autoplay** | Tự chạy các bước còn lại của trang |
| **L** hoặc nút **EN \| VI** | Đổi ngôn ngữ (trình duyệt nhớ lựa chọn) |
| **F** | Toàn màn hình (thanh điều khiển ẩn, hiện lại khi rê chuột) |
| Home / End | Trang đầu / trang cuối |

## Cấu trúc

```
index.html                    bộ slide
drafts/workgraph-review.html  bản duyệt chương Work Graph (đã ghép vào index.html, giữ để tham khảo)
tools/audit.cjs               kiểm tra tự động
.github/workflows/audit.yml   CI chạy kiểm tra cho mỗi push và pull request
```

## Sửa nội dung

- **Tiếng Việt là văn bản gốc**, viết thẳng trong HTML của `index.html`.
- **Tiếng Anh** nằm trong bảng `var EN = { ... }` trong `index.html`, mỗi dòng một cặp `"câu tiếng Việt": "English"`. Sửa hay thêm một câu tiếng Việt thì sửa hay thêm đúng dòng đó; câu thiếu bản dịch sẽ hiện tiếng Việt trên trang EN và bị `npm run audit` báo lỗi.
- Khi cùng một chữ tiếng Việt cần hai cách dịch (ví dụ "CUỘC HỌP" là tên mô-đun ở chỗ này nhưng là loại nút ở chỗ khác), đặt `data-en="..."` lên phần tử đó.
- **Đồ thị trang 7–9**: dữ liệu ở `GRAPHS` (mỗi nút: id, loại, nhãn, x, y, trạng thái theo bước; mỗi cạnh: từ, tới, nhãn, trạng thái). Câu dẫn giải từng bước ở `PAGES[].beats`.
- **Bước**: `data-st="2:in 4:hl"` nghĩa là từ bước 2 phần tử có class `in`, từ bước 4 có thêm `hl`.
- Trang được vẽ trên khung cố định 1600×900 rồi co giãn theo màn hình; mọi toạ độ trong file là toạ độ của khung này.

## Kiểm tra trước khi commit

```bash
npm install
npx playwright install chromium
npm run audit
```

`npm run audit` mở bộ slide ở cả hai ngôn ngữ, đi qua **mọi bước của mọi trang**, và báo lỗi khi:

- một phần tử nằm ngoài trang, hoặc chữ tràn khỏi khung chứa nó;
- chữ đè lên chữ; nút đồ thị, nhãn cạnh, huy hiệu va vào nhau;
- chữ nhỏ hơn 12.5px trong thiết kế 1600px (trang bị thu nhỏ trên laptop, chữ nhỏ hơn sẽ khó đọc);
- trang tiếng Anh còn chữ tiếng Việt (trừ tên người trong ví dụ).

Độ tương phản thấp chỉ là cảnh báo (`VERBOSE=1 npm run audit` để xem), vì vài trang cố ý làm mờ: người đã rời đi, nút đồ thị chưa tới lượt.

## Nội dung phải đúng với sản phẩm

Bộ slide chỉ nói điều sản phẩm đang làm được, và gắn nhãn **LỘ TRÌNH / ROADMAP** cho phần chưa có. Khi sản phẩm thay đổi, đối chiếu lại các điểm sau với repo `UNIAI-TEAM/uniwork` trước khi trình bày:

| Nội dung trên slide | Trạng thái (2026-11-26) | Nguồn trong `UNIAI-TEAM/uniwork` |
|---|---|---|
| Tên trợ lý: Mind / UniWork Mind / Thư ký Mind (EN: Mind Scribe) | đang dùng | `docs/conventions.md` (bảng từ vựng) |
| AI không ghi thẳng bảng nghiệp vụ: đề xuất → người duyệt | đang chạy | ADR 0010, ADR 0044 |
| Mọi lời gọi mô hình qua AI Gateway; không lưu khóa AI cá nhân | đang chạy | ADR 0051 |
| Dữ liệu tách theo tổ chức | đang chạy | ADR 0008 |
| Nhật ký kiểm toán chỉ thêm | đang chạy | ADR 0012 |
| Work Graph tự dựng từ việc, họp, dự án, người & agent, phòng ban, tài liệu, kênh | đang chạy | ADR 0019, `docs/superpowers/specs/2026-10-07-work-graph-foundation-design.md` |
| Quan hệ "được bàn trong" do người gắn | chưa làm (lát 3) | cùng spec, §1.2 và §13 |
| Context Engine: Mind và agent đọc đồ thị lấy ngữ cảnh | **lộ trình** | cùng spec, §2 (ngoài phạm vi) |
| Email Hub | đang chạy | `apps/web/app/[orgSlug]/[workspaceSlug]/email` |
| Quy trình (Workflows) | **sắp có** | chưa có route |
| uniOffice Desktop | bản beta | ghi chú phát hành trong `packages/core/i18n/locales/vi.json` |

Sơ đồ trang bìa là hình minh hoạ chung, nhưng mỗi đường nối phải đúng: AI Core chỉ nối tới mô-đun nghiệp vụ (đề xuất → người duyệt) và tới cloud qua AI Gateway; chỉ mô-đun nghiệp vụ đọc và ghi dữ liệu.

## Lịch sử

Các commit trước khi tách repo được giữ nguyên từ thư mục `docs/pitch` của `UNIAI-TEAM/uniwork` (nhánh `claude/serene-keller-0z1yfn`), nơi bộ slide được làm ra.
