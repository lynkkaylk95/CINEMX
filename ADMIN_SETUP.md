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

Tên đăng nhập:

```powershell
"admin" | npx wrangler secret put ADMIN_USERNAME
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

## 3. Triển khai

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
