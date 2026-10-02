# Tạo hợp đồng phần mềm
Nhập thông tin khách hàng (Bên B), chức năng, giá trị, thanh toán, tiến độ → sinh hợp đồng theo mẫu, xem trước, in / lưu PDF, xuất HTML.

## Chạy
Chép vào `C:\xampp\htdocs\hopdong\`, bật Apache, mở `http://localhost/hopdong/`. Mặc định `driver:'local'` (localStorage). Đổi sang KIO: `index.html?driver=kio` (tạo bảng bằng `docs/hopdong_tables.sql`).

## Kiến trúc (giống mamnon)
UI → `app.js` / `modules/mod-*.js` → `DB.*` → `api/contract-api.js` → `api/data-store.js` → `api/kio-api.js` (KioStore) → local | KIO

## Cấu trúc
index.html · css/style.css · docs/hopdong_tables.sql · js/app.js · js/api/{kio-config,kio-api,data-store,contract-api}.js · js/core/app.core.js · js/data/data.js (điều khoản cố định + mẫu trống) · js/modules/{mod-list,mod-contract}.js

## Quy tắc nghiệp vụ (calc trong app.core.js)
- Điều 2: Tổng = Σ chi phí; "Bằng chữ" tự sinh.
- Điều 3: mặc định nhập số tiền → tự tính tỷ lệ (dòng chưa nhập tay theo tỷ lệ mặc định 50/50); chuyển sang nhập tỷ lệ → tự tính số tiền. Giá trị đã tính được giữ nguyên khi chuyển. Cảnh báo nếu tổng ≠ giá trị hợp đồng / 100%.
- Bên A = khách hàng (để trống, gợi ý khách hàng đã lưu); Bên B autofill Quanh Ta. Điều 5–9 autofill theo hợp đồng gốc, sửa/thêm/xóa được. Bản xem trước, in, xuất HTML dùng chung CSS gốc (js/data/doc-style.js) qua js/core/doc-builder.js.
