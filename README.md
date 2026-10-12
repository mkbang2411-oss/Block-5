# Quán Ba Cô Gái – SSR Express + Sequelize + Supabase

Ghép **frontend "ba-co-gai"** (phố, bàn tròn, bếp) lên **backend Block-5** (Express + EJS + Sequelize + Supabase).
Toàn bộ dữ liệu lấy từ database của Block-5; trang nào cũng render phía server (EJS).

## Chạy
1. `npm install`
2. Copy `.env.example` -> `.env`, dán chuỗi kết nối Supabase vào `DATABASE_URL` (nên dùng **Session pooler**, port 5432).
3. `npm run db:seed` – tạo bảng từ model và thêm dữ liệu mẫu (10 món, 4 đầu bếp, 16 nguyên liệu; **xóa dữ liệu cũ**).
4. `npm start` (hoặc `npm run dev`) → http://localhost:3000

## Các trang

| Trang | URL | Ghi chú |
|---|---|---|
| Phố Ba Cô Gái | `GET /` | Kéo để dạo phố, bấm quán Ba Cô Gái -> chọn vai (form `POST /login`) |
| Khách – bàn tròn | `GET /khach` | Các món lấy từ DB; xoay bàn, bấm món để xem/đặt |
| Danh sách món | `GET /dishes?q=` | Tìm theo tên, có link chi tiết |
| Chi tiết món | `GET /dishes/:id` | id sai/không có -> **404** |
| Đăng nhập | `GET/POST /login`, `POST /logout` | Chọn role `user` (khách) hoặc `admin` (đầu bếp), không cần mật khẩu |
| Quản trị | `/admin/{dishes,chefs,ingredients}` | Chỉ role admin (chưa chọn role -> redirect `/login`, role user -> 403) |

CRUD quản trị (không dùng fetch/AJAX; PATCH/DELETE qua `method-override`):

| Việc | Method | URL | Kết quả |
|---|---|---|---|
| Danh sách (lưới 3x3, `?page=`) | GET | `/admin/:r` | |
| Form thêm | GET | `/admin/:r/new` | |
| Thêm | POST | `/admin/:r` | 303; input sai -> 400 giữ giá trị |
| Form sửa | GET | `/admin/:r/:id/edit` | id sai -> 404 |
| Sửa | PATCH | `/admin/:r/:id` | 303; sai -> 400; id sai -> 404 |
| Xác nhận xóa | GET | `/admin/:r/:id/delete` | |
| Xóa | DELETE | `/admin/:r/:id` | 303; đầu bếp còn món -> 409 |

## Chỗ khác với bản frontend gốc (vì dữ liệu giờ nằm ở DB)
- **Món**: DB chỉ có tên, mô tả, giá, danh mục, còn bán, đầu bếp, nguyên liệu. Icon emoji tự chọn theo tên/danh mục (`dishIcon` trong `src/utils/format.js`); nguyên liệu hiện tên + đơn vị (DB không lưu số lượng).
- **Đầu bếp**: DB chỉ có tên + chuyên môn (không có chức vụ/SĐT/kinh nghiệm).
- **Quản trị**: popup thêm/sửa/xóa bằng JS được thay bằng trang form thật (SSR) để đúng yêu cầu server-side. Lưới 3x3 + phân trang giữ nguyên giao diện, nhưng phân trang là link `?page=`.
- **Đặt món / hàng chờ** ở `/khach` vẫn chỉ lưu tạm trên trình duyệt (DB chưa có bảng đơn hàng).
- Món `available = false` hiện mờ "(hết)" trên bàn và không đặt được.

## Âm thanh
`public/js/am-thanh.js` – tự tổng hợp bằng WebAudio, không cần file mp3, **không còn nền rè như tivi**:
- Hiệu ứng thao tác: bấm nút (cộc gỗ), mở popup, xoay bàn (gỗ lăn + đĩa sứ chạm nhau), chuông gọi món "ting-ting", thêm hàng chờ, gió lướt khi chuyển cảnh.
- Tiếng đời sống rời rạc theo trang (`data-am` trên `<body>`): phố = chim, xe máy chạy ngang + còi, chuông xe đạp; khách = chén đĩa, chảo xèo; bếp = dao thớt, chảo xèo.
- Nút 🔊 góc trái dưới để tắt/bật (nhớ trong localStorage). Âm thanh chỉ bật sau lần bấm đầu tiên (quy định của trình duyệt) và phải bật lại ở mỗi trang vì web chuyển trang kiểu SSR.
- Muốn dùng file âm thanh thật: thêm vào `public/sounds/` rồi sửa hàm trong `SFX`/`DOI` thành `new Audio('/sounds/xxx.mp3').play()`.

## Cấu trúc
```
src/app.js              Express, middleware, 404/500
src/server.js           kết nối DB, sequelize.sync(), listen
src/models/             Dish, Chef, Ingredient + quan hệ
src/routes/pages.js     /  và  /khach   (trang frontend)
src/routes/public.js    /dishes, /dishes/:id
src/routes/admin.js     CRUD quản trị
src/routes/auth.js      /login, /logout
src/admin/resources.js  field, validate, quan hệ, ô hiển thị của từng model
src/utils/pho.js        sinh con phố ngẫu nhiên
src/views/              EJS (home, khach, login, error, public/, admin/, partials/)
public/css/style.css    giao diện (từ ba-co-gai + phần SSR ở cuối file)
public/js/              am-thanh.js, common.js, home.js, khach.js
scripts/seed.js         dữ liệu mẫu
```
