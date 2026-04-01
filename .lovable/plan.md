
Mục tiêu: mở rộng app theo đúng 3 nhóm chức năng bạn mô tả:
1) Trang cá nhân cho người dùng đã đăng nhập
2) Đánh giá món ăn ở dưới mỗi món
3) Khu quản trị riêng cho admin với 3 mục: Quản lý món ăn, Cập nhật món, Quản lý nguyên liệu

Phương án triển khai

1. Chuẩn hóa backend và quyền truy cập
- Giữ đăng nhập email/mật khẩu như hiện tại.
- Thêm bảng `profiles` để lưu hồ sơ người dùng: tên hiển thị, avatar, giới thiệu ngắn, thông tin cơ bản.
- Thêm bảng `user_roles` + enum role + hàm `has_role(...)` để phân quyền admin an toàn.
- Không dùng kiểm tra admin ở localStorage hay hardcode trong giao diện.
- Tài khoản admin sẽ là tài khoản email thật trong hệ thống xác thực; quyền admin được gán ở backend. Ghi chú: `admin01` hiện chưa phải email hợp lệ, nên lúc triển khai cần một email đầy đủ.

2. Trang cá nhân kiểu Facebook
- Tạo trang cá nhân mới, ví dụ `/profile`.
- Người dùng đã đăng nhập có thể:
  - đổi ảnh đại diện
  - cập nhật tên hiển thị
  - cập nhật giới thiệu ngắn
  - cập nhật thông tin cơ bản
  - đổi email
  - đổi mật khẩu
- Avatar sẽ dùng storage bucket riêng.
- Sidebar thêm mục “Trang cá nhân” cho user đã đăng nhập.

3. Chức năng đánh giá món ăn
- Thêm khu “Đánh giá” ở cuối trang chi tiết món.
- Chỉ user đã đăng nhập mới được gửi đánh giá.
- Mỗi đánh giá gồm:
  - số sao / mức độ hài lòng
  - tiêu đề ngắn hoặc cảm nhận
  - nội dung nhận xét
  - thời gian tạo
- Hiển thị danh sách đánh giá ngay dưới món ăn.
- Có thể giới hạn mỗi user 1 đánh giá cho mỗi món để tránh spam; nếu đã có thì cho sửa/xóa đánh giá cũ.

4. Chuyển dữ liệu món ăn từ code cứng sang backend
- Hiện recipes đang nằm trong `src/data/recipes.ts`, nên admin chưa thể thêm/sửa/xóa thật.
- Cần đưa dữ liệu sang các bảng backend để admin quản lý được:
  - `recipes`
  - `ingredients`
  - `recipe_ingredients`
  - có thể thêm `recipe_steps` hoặc dùng trường `steps` dạng mảng
- Seed dữ liệu món mẫu hiện có vào backend để không mất nội dung cũ.
- Sau đó cập nhật toàn bộ trang chủ, tìm kiếm, chi tiết món, AI gợi ý để đọc từ backend thay vì file cứng.

5. Khu quản trị riêng cho admin
- Khi admin đăng nhập, sidebar xuất hiện thêm 3 mục:
  - Quản lý món ăn
  - Cập nhật món
  - Quản lý nguyên liệu
- Quyền chỉ hiển thị và chỉ thao tác được với admin.

6. Chi tiết 3 màn admin
- Quản lý món ăn:
  - danh sách món
  - thêm món mới
  - sửa thông tin cơ bản
  - xóa món
- Cập nhật món:
  - chỉnh mô tả, thời gian, độ khó, danh mục
  - cập nhật công thức / các bước nấu
  - cập nhật ảnh món
- Quản lý nguyên liệu:
  - thêm/sửa/xóa nguyên liệu
  - gán nguyên liệu vào món
  - tái sử dụng nguyên liệu giữa nhiều món

7. Cập nhật UI hiện tại
- `Sidebar.tsx`: thêm mục Trang cá nhân và nhóm menu admin có điều kiện.
- `AuthContext.tsx`: nạp thêm profile/role sau đăng nhập.
- `RecipeDetail.tsx`: thêm khu đánh giá.
- `Index.tsx`, `SearchPage.tsx`, `SavedRecipes.tsx`, phần AI gợi ý: chuyển sang đọc dữ liệu món từ backend.
- Tạo các trang mới: `ProfilePage`, `AdminRecipesPage`, `AdminRecipeEditPage`, `AdminIngredientsPage`.

Chi tiết kỹ thuật
- Bảng mới cần có:
  - `profiles`
  - `user_roles`
  - `recipes`
  - `ingredients`
  - `recipe_ingredients`
  - `recipe_reviews`
  - có thể thêm `recipe_steps`
- RLS:
  - user chỉ sửa profile của chính mình
  - user chỉ tạo/xem/sửa/xóa review của chính mình
  - mọi thao tác quản trị trên món/nguyên liệu chỉ admin được phép
- Avatar:
  - tạo bucket lưu ảnh
  - user chỉ được sửa file avatar của mình
- Email/password:
  - đổi email dùng flow xác thực chuẩn
  - đổi mật khẩu dùng API auth chuẩn, không lưu mật khẩu trong DB app
- AI:
  - edge function vẫn dùng, nhưng nguồn `recipeOptions` sẽ lấy từ DB thay vì file cứng

Lưu ý quan trọng
- Với yêu cầu “admin01 / admin123”, phần đúng chuẩn bảo mật là:
  - không hardcode tài khoản/mật khẩu trong code
  - không kiểm tra admin ở client
  - phải gán role admin ở backend cho một tài khoản email thật
- Vì bạn muốn admin quản lý món/nguyên liệu thật, việc chuyển recipes từ file cứng sang backend là bước bắt buộc, không chỉ là chỉnh giao diện.

Thứ tự triển khai đề xuất
1) Tạo `profiles` + `user_roles` + storage avatar
2) Tạo trang cá nhân
3) Tạo schema món ăn/nguyên liệu trong backend và chuyển dữ liệu mẫu sang
4) Cập nhật app để dùng dữ liệu backend
5) Thêm đánh giá món ăn
6) Thêm sidebar admin và 3 trang quản trị
7) Kiểm tra toàn bộ flow user/admin end-to-end
