

# 🍳 Hệ thống gợi ý món ăn thông minh tích hợp AI

## Tổng quan
Xây dựng web app gợi ý món ăn dựa trên nguyên liệu có sẵn và cảm xúc khách hàng, tích hợp AI chatbot và nhận diện ảnh nguyên liệu. Giao diện theo phong cách ấm áp cam/trắng từ file upload.

## Các trang chính

### 1. Trang chủ
- **Hero section** với background ẩm thực, thanh tìm kiếm nguyên liệu (nhập chip nguyên liệu)
- **Bộ lọc cảm xúc**: Chọn tâm trạng (😊 Vui vẻ, 😢 Buồn, 😴 Mệt mỏi, 🥳 Hào hứng, 😌 Thư giãn) → AI gợi ý món phù hợp
- **Lưới công thức**: Hiển thị danh sách món ăn mẫu (hardcode ~15-20 món Việt Nam) với ảnh, tên, thời gian, độ khó
- **Khu vực AI gợi ý**: Nút "Nhận gợi ý AI" kết hợp nguyên liệu + cảm xúc đã chọn

### 2. Chi tiết món ăn
- Ảnh lớn, tên món, mô tả, danh sách nguyên liệu
- Hướng dẫn nấu từng bước
- Nút **Lưu món** (yêu cầu đăng nhập)

### 3. Món đã lưu
- Danh sách món yêu thích đã lưu (lưu trong Supabase)
- Chỉ hiển thị khi đã đăng nhập

### 4. Đăng nhập / Đăng ký
- Supabase Auth với email/mật khẩu
- Giao diện form đơn giản

### 5. Chat với AI (floating chatbot)
- Nút chat nổi góc phải dưới, mở panel chat
- Hỏi đáp về nấu ăn, công thức, mẹo bếp
- Hỗ trợ **upload ảnh nguyên liệu** → AI nhận diện và gợi ý món

## Tính năng AI (Lovable AI)
- **Gợi ý theo nguyên liệu**: Nhập nguyên liệu → AI đề xuất món có thể nấu
- **Gợi ý theo cảm xúc**: Chọn mood → AI chọn món phù hợp tâm trạng
- **Chat tự do**: Hỏi bất kỳ câu hỏi nấu ăn nào
- **Phân tích ảnh**: Upload ảnh nguyên liệu → AI nhận diện và gợi ý (dùng model multimodal)

## Backend
- **Supabase Auth**: Đăng nhập/đăng ký email
- **Supabase Database**: Bảng saved_recipes liên kết user
- **Edge Function**: Gọi Lovable AI Gateway cho tất cả tính năng AI (gợi ý, chat, phân tích ảnh)

## Thiết kế
- Tông màu cam ấm (#ff8c42) theo file CSS gốc
- Font Inter, bo tròn, shadow mềm
- Responsive mobile-first

