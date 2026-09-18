# Ảnh minh hoạ cho khung sản phẩm ở landing

Ba ô trong khung trình duyệt ở trang chủ (`pages/index.vue` → `shotTiles`).

## Đang dùng

| File | Người trong ảnh | Nhãn | Ghi chú |
|---|---|---|---|
| `tran-ha.jpg` | nữ, Á Đông | TRẦN HÀ | ô đang nói (viền xanh) |
| `daniel-reed.jpg` | nam, Âu | DANIEL REED | |
| `omar-haddad.jpg` | nam, đeo headset | OMAR HADDAD | |

Cả ba cắt sẵn 16:10 ở 880×550 từ ảnh gốc 4K–9K, nén mozjpeg q82 (38–66 KB/ảnh).
`<NuxtImg>` còn chuyển sang webp và sinh srcset lúc chạy, nên thực tế trình duyệt
tải khoảng 10–22 KB mỗi ô.

**Tên phải khớp khuôn mặt.** Ảnh hiện chỉ có một người Á Đông nên chỉ ô đó giữ tên
Việt; hai ô kia đặt tên quốc tế cho đúng người. Nếu đổi ảnh, nhớ đổi `name` theo.

## Thay ảnh khác

1. Cắt về **16:10, tối thiểu 880×550**, mặt nằm nửa trên (góc dưới trái có nhãn tên)
2. Bỏ file vào thư mục này
3. Sửa `photo` và `name` trong `shotTiles`

Để `photo: null` thì ô tự hiện bóng người mờ thay thế.

Đừng khai `sizes`/`width` lớn hơn chiều rộng ảnh gốc — IPX sẽ phóng to lên, vừa nặng
vừa mờ. Hiện trần là 440px, nhân `densities="x1 x2"` vừa đúng 880px.

Không cần tự chỉnh màu: class `.feed-photo` trong `assets/css/main.css` đã hạ bão hoà,
tối lại và ám xanh để ảnh nhập vào bảng màu deep space.

## Bản quyền — chưa xong, cần kiểm trước khi lên production

Ba ảnh này do chủ repo cung cấp, **tôi không xác minh được nguồn và giấy phép**.
Dùng mặt người nhận diện được để quảng bá sản phẩm thương mại cần **model release**,
không chỉ cần giấy phép ảnh. Nhìn bố cục và ánh sáng thì đây là ảnh stock thương mại —
hãy kiểm lại bạn đang giữ license loại nào và nó có kèm model release không.
