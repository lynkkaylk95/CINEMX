# CineMax MX — bật quản trị trực tuyến

Phần mã đã hỗ trợ `/admin`, Cloudflare D1 và đăng nhập bằng user/password. Các bước dưới đây chỉ cần thực hiện một lần trên tài khoản Cloudflare đang vận hành website.

## 1. Tạo D1

```powershell
npx wrangler d1 create cinemax-movies
```

Sao chép khối `[[d1_databases]]` mà Wrangler trả về vào `wrangler.toml`, giữ `binding = "DB"`, rồi thêm:

```toml
migrations_dir = "migrations"
```

Khởi tạo bảng:

```powershell
npx wrangler d1 migrations apply cinemax-movies --remote
```

## 2. Tạo tài khoản admin

Tên đăng nhập đã chọn là `Admin`:

```powershell
"Admin" | npx wrangler secret put ADMIN_USERNAME
```

Tạo mã SHA-256 từ mật khẩu (thay `MAT_KHAU_CUA_BAN`):

```powershell
[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes('MAT_KHAU_CUA_BAN'))).ToLower() | npx wrangler secret put ADMIN_PASSWORD_HASH
```

Tạo khóa phiên ngẫu nhiên:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48)) | npx wrangler secret put SESSION_SECRET
```

Không ghi mật khẩu hoặc các secret trên vào Git.

## 3. Bật khôi phục qua email

Trong Cloudflare Dashboard, bật **Email Routing** cho `cinemaxmx.com` và xác minh địa chỉ nhận `tuanlinhnguyen765@gmail.com`. Sau đó bỏ dấu chú thích ở khối `[[send_email]]` trong `wrangler.toml`.

Đặt địa chỉ khôi phục:

```powershell
"tuanlinhnguyen765@gmail.com" | npx wrangler secret put ADMIN_RECOVERY_EMAIL
```

Địa chỉ gửi phải thuộc tên miền đã bật Email Routing:

```powershell
"admin@cinemaxmx.com" | npx wrangler secret put ADMIN_EMAIL_FROM
```

Khi bấm **Quên mật khẩu?**, hệ thống gửi liên kết dùng một lần, hết hạn sau 30 phút. Hệ thống không thể và không nên gửi lại mật khẩu cũ.

## 4. Triển khai

```powershell
npx wrangler deploy
```

Sau đó mở `https://cinemaxmx.com/admin`, đăng nhập và bấm **Nhập dữ liệu phim cũ**. Nút này chỉ xuất hiện khi D1 chưa có phim và chỉ nhập được một lần.

Sau khi nhập, mọi thao tác thêm/sửa/xóa đều được lưu thẳng vào D1. Website, trang chi tiết và sitemap đọc dữ liệu mới tự động; không còn bước tải `movies.js`.

## Ghi chú bảo mật

- Phiên đăng nhập hết hạn sau 12 giờ.
- Cookie quản trị dùng `HttpOnly`, `Secure` và `SameSite=Strict`.
- Sau 10 lần sai từ cùng một IP trong 15 phút, đăng nhập sẽ tạm bị khóa.
- API thay đổi dữ liệu kiểm tra cùng nguồn để chống yêu cầu giả mạo.
