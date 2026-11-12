# TÀI LIỆU HỆ THỐNG RESTful API — AURALIÈ HAUTE COUTURE
**Phiên bản:** API v1.0 Enterprise  
**Base URL:** `http://localhost:5000/api/v1`  
**Chuẩn phản hồi:** JSON (`Content-Type: application/json`)  

---

## 1. ĐỊNH DẠNG PHẢN HỒI CHUẨN (STANDARD RESPONSE)

### Thành công:
```json
{
  "status": "success",
  "message": "Thao tác thành công",
  "data": { ... }
}
```

### Thất bại:
```json
{
  "status": "error",
  "message": "Mô tả nguyên nhân lỗi"
}
```

---

## 2. DANH SÁCH ENDPOINTS CHI TIẾT

### 2.1 Authentication & Profile (`/auth`)
| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản hội viên mới |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập và nhận JWT token |
| `GET` | `/api/v1/auth/me` | Bearer Token | Lấy thông tin tài khoản đang đăng nhập |
| `PUT` | `/api/v1/auth/change-password` | Bearer Token | Cập nhật mật khẩu cá nhân |

### 2.2 Products & Catalog (`/products`, `/categories`)
| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/products` | Public | Lấy danh sách sản phẩm (hỗ trợ `category`, `search`, `tag`) |
| `GET` | `/api/v1/products/:id` | Public | Lấy chi tiết sản phẩm, gallery ảnh và biến thể (variants) |
| `POST` | `/api/v1/products` | **Admin only** | Thêm mới một sản phẩm vào kho |
| `DELETE` | `/api/v1/products/:id` | **Admin only** | Ẩn/xóa mềm sản phẩm (`is_active = 0`) |
| `GET` | `/api/v1/categories` | Public | Lấy danh mục sản phẩm kèm số lượng tồn kho |

### 2.3 Orders & Payments (`/orders`, `/sepay`)
| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/orders` | Optional Auth | Khởi tạo đơn hàng (hỗ trợ COD, VISA, VietQR SePay) |
| `GET` | `/api/v1/orders/:orderCode/payment-status` | Public | Polling kiểm tra trạng thái thanh toán theo thời gian thực |
| `GET` | `/api/v1/orders/track/:code` | Public | Tra cứu hành trình vận chuyển theo mã đơn hàng |
| `GET` | `/api/v1/sepay/config` | Public | Lấy thông tin tài khoản ngân hàng thụ hưởng VietQR |
| `POST` | `/api/v1/sepay/webhook` | Webhook API Key | Webhook nhận thông báo chuyển khoản tự động từ SePay |
| `POST` | `/api/v1/sepay/simulate-payment` | Public (Demo) | Giả lập khớp lệnh thanh toán dành cho báo cáo ĐATN |
| `GET` | `/api/v1/orders` | **Admin only** | Lấy toàn bộ danh sách đơn hàng |
| `PUT` | `/api/v1/orders/:id/status` | **Admin only** | Cập nhật trạng thái xử lý đơn hàng |

### 2.4 Reviews (`/reviews`)
| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/products/:id/reviews` | Public | Lấy danh sách đánh giá của sản phẩm |
| `POST` | `/api/v1/reviews` | Public | Gửi đánh giá và chấm điểm sao cho sản phẩm |
| `GET` | `/api/v1/admin/reviews` | **Admin only** | Danh sách tất cả đánh giá cần kiểm duyệt |
| `PUT` | `/api/v1/reviews/:id/approve` | **Admin only** | Phê duyệt đánh giá hiển thị công khai |
| `DELETE` | `/api/v1/reviews/:id` | **Admin only** | Xóa đánh giá vi phạm tiêu chuẩn cộng đồng |

### 2.5 Coupons (`/coupons`)
| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/coupons/apply` | Public | Kiểm tra và áp dụng mã giảm giá cho giỏ hàng |

### 2.6 Users & Customers (`/users`)
| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/users/profile` | Public / Token | Lấy hồ sơ tài khoản và lịch sử đơn hàng |
| `PUT` | `/api/v1/users/profile` | Public / Token | Cập nhật họ tên, số điện thoại, sổ địa chỉ |
| `GET` | `/api/v1/users/shipping-info` | Bearer Token | Lấy thông tin giao hàng của tài khoản |
| `GET` | `/api/v1/users` | **Admin only** | Lấy danh sách toàn bộ khách hàng và hạng VIP |

### 2.7 Wishlist (`/wishlist`)
| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/wishlist` | Bearer Token | Lấy danh sách sản phẩm yêu thích của tài khoản |
| `POST` | `/api/v1/wishlist` | Bearer Token | Thêm sản phẩm vào danh sách yêu thích |
| `DELETE` | `/api/v1/wishlist/:productId` | Bearer Token | Xóa sản phẩm khỏi danh sách yêu thích |

### 2.8 Inquiries (`/contact`, `/newsletter`)
| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/contact` | Public | Gửi yêu cầu tư vấn may đo và đặt lịch hẹn VIP |
| `POST` | `/api/v1/newsletter/subscribe` | Public | Đăng ký nhận bản tin thời trang qua email |

### 2.9 Admin Operations (`/admin`)
| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/v1/admin/stats` | **Admin only** | Thống kê tổng hợp doanh thu, đơn hàng, khách hàng, sao |
| `GET` | `/api/v1/admin/inventory/batches` | **Admin only** | Xem lịch sử các lô hàng nhập kho |
| `POST` | `/api/v1/admin/inventory/batch-import` | **Admin only** | Nhập kho hàng loạt theo lô hàng |

### 2.10 AI Styling & Vision (`/ai`)
| Phương thức | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| `POST` | `/api/v1/ai/chat` | Public | Gửi tin nhắn đến Trợ lý ảo AI Stylist Concierge |
| `POST` | `/api/v1/ai/search-image` | Public | Trích xuất đặc trưng kiểu dáng trang phục bằng Computer Vision |

