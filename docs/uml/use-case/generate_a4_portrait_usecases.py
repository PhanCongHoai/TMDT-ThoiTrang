# -*- coding: utf-8 -*-
"""
Reverse Engineering & Generation of 4 Academic A4 Portrait UML 2.x Use Case Diagrams
AURALIÈ Haute Couture E-Commerce System
Strict adherence to Black & White, A4 Portrait (210 x 297 mm), Large Typography
"""

import os
import subprocess

TARGET_DIR = r"c:\Users\ASUS\Documents\Demo\DATN\docs\uml\use-case"
os.makedirs(TARGET_DIR, exist_ok=True)

# ==============================================================================
# SVG UTILITIES (A4 Portrait 840 x 1188 px, 100% Monochrome Black & White)
# ==============================================================================

COMMON_SVG_DEFS = """
  <defs>
    <!-- Open Arrow for <<include>> and <<extend>> -->
    <marker id="open-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5" fill="none" stroke="#000000" stroke-width="1.8" />
    </marker>
    <!-- Solid Arrow for Associations if needed -->
    <marker id="solid-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <polygon points="0,2 8,5 0,8" fill="#000000" />
    </marker>
    <!-- Hollow Triangle for Generalization -->
    <marker id="gen-arr" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="11" markerHeight="11" orient="auto">
      <polygon points="1,2 12,7 1,12" fill="#FFFFFF" stroke="#000000" stroke-width="1.8" />
    </marker>
  </defs>
"""

def make_page_header(title, subtitle, page_num):
    return f"""
  <!-- PAGE HEADER -->
  <rect x="30" y="24" width="780" height="60" fill="#FFFFFF" stroke="#000000" stroke-width="2" />
  <text x="420" y="50" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#000000" text-anchor="middle">{title}</text>
  <text x="420" y="70" font-family="Arial, Helvetica, sans-serif" font-size="11.5" fill="#000000" text-anchor="middle">{subtitle}</text>
  <rect x="730" y="36" width="65" height="24" fill="#000000" />
  <text x="762" y="52" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="bold" fill="#FFFFFF" text-anchor="middle">TRANG {page_num}/4</text>
    """

def make_page_footer(sheet_name, page_num):
    return f"""
  <!-- PAGE FOOTER (ISO 5807 / UML 2.X MONOCHROME) -->
  <rect x="30" y="1120" width="780" height="42" fill="#FFFFFF" stroke="#000000" stroke-width="1.5" />
  <text x="45" y="1146" font-family="Arial, Helvetica, sans-serif" font-size="10.5" fill="#000000">
    <tspan font-weight="bold">Quy ước UML 2.x:</tspan> Người = Actor | Ellipse = Use Case | Nét liền = Association | ┈▷ = Generalization | ┈&gt; = Include / Extend
  </text>
  <text x="795" y="1146" font-family="Arial, Helvetica, sans-serif" font-size="10.5" font-weight="bold" fill="#000000" text-anchor="end">
    {sheet_name} • A4 Portrait
  </text>
    """

def actor_figure(cx, cy, name, role=""):
    return f"""
  <!-- ACTOR: {name} -->
  <g class="actor">
    <!-- Head -->
    <circle cx="{cx}" cy="{cy}" r="15" fill="#FFFFFF" stroke="#000000" stroke-width="2.2" />
    <!-- Body -->
    <line x1="{cx}" y1="{cy+15}" x2="{cx}" y2="{cy+52}" stroke="#000000" stroke-width="2.2" />
    <!-- Arms -->
    <line x1="{cx-28}" y1="{cy+30}" x2="{cx+28}" y2="{cy+30}" stroke="#000000" stroke-width="2.2" />
    <!-- Left Leg -->
    <line x1="{cx}" y1="{cy+52}" x2="{cx-20}" y2="{cy+88}" stroke="#000000" stroke-width="2.2" />
    <!-- Right Leg -->
    <line x1="{cx}" y1="{cy+52}" x2="{cx+20}" y2="{cy+88}" stroke="#000000" stroke-width="2.2" />
    <!-- Label -->
    <text x="{cx}" y="{cy+110}" font-family="Arial, Helvetica, sans-serif" font-size="13.5" font-weight="bold" fill="#000000" text-anchor="middle">{name}</text>
    {f'<text x="{cx}" y="{cy+127}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#000000" text-anchor="middle">{role}</text>' if role else ''}
  </g>
    """

def uc_ellipse(cx, cy, rx, ry, code, name, detail=""):
    return f"""
  <!-- USE CASE: {code} -->
  <g class="usecase">
    <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#FFFFFF" stroke="#000000" stroke-width="2.2" />
    <text x="{cx}" y="{cy - 6 if detail else cy + 4}" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="#000000" text-anchor="middle">{code}: {name}</text>
    {f'<text x="{cx}" y="{cy + 13}" font-family="Arial, Helvetica, sans-serif" font-size="10.5" fill="#000000" text-anchor="middle">{detail}</text>' if detail else ''}
  </g>
    """

# ==============================================================================
# DIAGRAM 1: UC_01_STOREFRONT_DISCOVERY
# 7 Use Cases on A4 Portrait: Catalog, Search, Quickview, SizeGuide, Reviews, Blog, AI
# ==============================================================================
svg_d1 = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 840 1188" xmlns="http://www.w3.org/2000/svg" width="840" height="1188">
  {COMMON_SVG_DEFS}
  <!-- White Background -->
  <rect width="840" height="1188" fill="#FFFFFF" />

  {make_page_header("AURALIÈ — UML USE CASE DIAGRAM (A4 DỌC)", "PHÂN HỆ 1: KHÁM PHÁ &amp; DUYỆT SẢN PHẨM (CATALOG &amp; DISCOVERY)", 1)}

  <!-- MAIN ACTOR (LEFT) -->
  {actor_figure(120, 480, "Khách Hàng", "(Guest / Vãng Lai)")}

  <!-- SYSTEM BOUNDARY -->
  <rect x="235" y="105" width="575" height="990" fill="#FFFFFF" stroke="#000000" stroke-width="2" />
  <rect x="235" y="105" width="575" height="34" fill="#000000" />
  <text x="250" y="128" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Phân Hệ: Khám Phá &amp; Duyệt Sản Phẩm</text>

  <!-- USE CASES -->
  {uc_ellipse(430, 200, 150, 34, "UC01", "Duyệt Danh Mục Sản Phẩm", "GET /api/v1/products")}
  {uc_ellipse(430, 340, 150, 34, "UC02", "Tìm Kiếm &amp; Lọc Nâng Cao", "Từ khóa, Size, Màu sắc, Giá")}
  {uc_ellipse(390, 500, 140, 36, "UC03", "Xem Chi Tiết Sản Phẩm", "Modal QuickView &amp; Thuộc tính")}
  
  <!-- UC04: Bảng size (Extension of UC03) -->
  {uc_ellipse(675, 500, 115, 34, "UC04", "Bảng Size May Đo", "Size riêng từng loại hàng")}
  
  {uc_ellipse(430, 660, 150, 34, "UC05", "Xem Đánh Giá &amp; Số Sao", "SQL Server Live Reviews")}
  {uc_ellipse(430, 800, 150, 34, "UC06", "Đọc Tạp Chí Thời Trang (Blog)", "Ấn phẩm Haute Couture Editorial")}
  {uc_ellipse(430, 940, 150, 34, "UC07", "Trò Chuyện Với AI Stylist", "POST /api/v1/ai/chat")}

  <!-- EXTEND: UC04 -> UC03 -->
  <line x1="560" y1="500" x2="530" y2="500" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4" marker-end="url(#open-arr)" />
  <text x="545" y="490" font-family="Arial, Helvetica, sans-serif" font-size="11.5" font-style="italic" fill="#000000" text-anchor="middle">«extend»</text>

  <!-- ASSOCIATIONS (SOLID LINES) -->
  <line x1="160" y1="480" x2="280" y2="200" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="490" x2="280" y2="340" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="500" x2="250" y2="500" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="510" x2="280" y2="660" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="520" x2="280" y2="800" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="530" x2="280" y2="940" stroke="#000000" stroke-width="1.8" />

  {make_page_footer("Sơ Đồ 1: Khám Phá &amp; Duyệt Sản Phẩm", 1)}
</svg>
"""

puml_d1 = """@startuml UC_01_STOREFRONT_DISCOVERY
skinparam monochrome true
skinparam shadowing false
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam arrowThickness 1.5
skinparam usecaseBorderThickness 2.0
skinparam rectangleBorderThickness 2.0
left to right direction

actor "Khách Hàng\\n(Guest / Vãng Lai)" as Guest

rectangle "Hệ Thống AURALIÈ: Khám Phá & Duyệt Sản Phẩm" {
  usecase "UC01: Duyệt Danh Mục Sản Phẩm\\n<size:10>GET /api/v1/products</size>" as UC01
  usecase "UC02: Tìm Kiếm & Lọc Nâng Cao\\n<size:10>Từ khóa, Size, Màu sắc, Giá</size>" as UC02
  usecase "UC03: Xem Chi Tiết Sản Phẩm\\n<size:10>Modal QuickView & Thuộc tính</size>" as UC03
  usecase "UC04: Tra Cứu Bảng Size May Đo\\n<size:10>Bảng size riêng từng loại hàng</size>" as UC04
  usecase "UC05: Xem Đánh Giá & Số Sao\\n<size:10>SQL Server Live Reviews</size>" as UC05
  usecase "UC06: Đọc Tạp Chí Thời Trang (Blog)\\n<size:10>Ấn phẩm Haute Couture</size>" as UC06
  usecase "UC07: Trò Chuyện Với AI Stylist\\n<size:10>POST /api/v1/ai/chat</size>" as UC07

  UC04 .> UC03 : <<extend>>
}

Guest --> UC01
Guest --> UC02
Guest --> UC03
Guest --> UC05
Guest --> UC06
Guest --> UC07
@enduml
"""

# ==============================================================================
# DIAGRAM 2: UC_02_CART_CHECKOUT
# 6 Use Cases + External Actor SePay: Cart, Checkout, Shipping, Coupon, QR, COD
# ==============================================================================
svg_d2 = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 840 1188" xmlns="http://www.w3.org/2000/svg" width="840" height="1188">
  {COMMON_SVG_DEFS}
  <rect width="840" height="1188" fill="#FFFFFF" />

  {make_page_header("AURALIÈ — UML USE CASE DIAGRAM (A4 DỌC)", "PHÂN HỆ 2: GIỎ HÀNG, ĐẶT HÀNG &amp; THANH TOÁN (CART &amp; CHECKOUT)", 2)}

  <!-- ACTORS -->
  {actor_figure(120, 360, "Khách Hàng", "(Customer / VIP)")}
  {actor_figure(740, 780, "Cổng SePay", "«Secondary System»")}

  <!-- SYSTEM BOUNDARY -->
  <rect x="225" y="105" width="465" height="990" fill="#FFFFFF" stroke="#000000" stroke-width="2" />
  <rect x="225" y="105" width="465" height="34" fill="#000000" />
  <text x="240" y="128" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Phân Hệ: Giỏ Hàng &amp; Đặt Hàng Thanh Toán</text>

  <!-- USE CASES -->
  {uc_ellipse(455, 200, 155, 34, "UC08", "Quản Lý Giỏ Hàng", "Thêm, chỉnh sửa số lượng, xóa")}
  {uc_ellipse(455, 380, 165, 38, "UC09", "Đặt Hàng &amp; Thanh Toán", "POST /api/v1/orders (Transaction)")}
  {uc_ellipse(455, 570, 155, 34, "UC10", "Xác Thực Thông Tin Giao", "Họ tên, SĐT, Địa chỉ, Hỏa tốc 2h")}

  <!-- EXTENSIONS OF UC09 -->
  {uc_ellipse(340, 760, 105, 30, "UC11", "Áp Dụng Coupon", "Mã giảm giá")}
  {uc_ellipse(560, 760, 115, 32, "UC12", "Thanh Toán QR", "VietQR SePay 24/7")}
  {uc_ellipse(455, 930, 140, 32, "UC13", "Thanh Toán COD", "Tiền mặt khi nhận")}

  <!-- RELATIONSHIPS -->
  <!-- Include UC09 -> UC10 -->
  <line x1="455" y1="418" x2="455" y2="536" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4" marker-end="url(#open-arr)" />
  <text x="470" y="475" font-family="Arial, Helvetica, sans-serif" font-size="11.5" font-style="italic" fill="#000000">«include»</text>

  <!-- Extend UC11 -> UC09 -->
  <line x1="360" y1="730" x2="425" y2="418" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4" marker-end="url(#open-arr)" />
  <text x="375" y="580" font-family="Arial, Helvetica, sans-serif" font-size="11.5" font-style="italic" fill="#000000" text-anchor="middle">«extend»</text>

  <!-- Extend UC12 -> UC09 -->
  <line x1="540" y1="728" x2="485" y2="418" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4" marker-end="url(#open-arr)" />
  <text x="535" y="580" font-family="Arial, Helvetica, sans-serif" font-size="11.5" font-style="italic" fill="#000000" text-anchor="middle">«extend»</text>

  <!-- Extend UC13 -> UC09 -->
  <path d="M 315 930 L 250 930 L 250 380 L 290 380" fill="none" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4" marker-end="url(#open-arr)" />
  <text x="240" y="650" font-family="Arial, Helvetica, sans-serif" font-size="11.5" font-style="italic" fill="#000000" text-anchor="end">«extend»</text>

  <!-- ASSOCIATIONS (SOLID LINES) -->
  <line x1="160" y1="350" x2="300" y2="200" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="370" x2="290" y2="380" stroke="#000000" stroke-width="1.8" />

  <!-- External SePay Webhook -> UC12 -->
  <line x1="680" y1="780" x2="675" y2="760" stroke="#000000" stroke-width="1.8" marker-end="url(#open-arr)" />
  <text x="735" y="745" font-family="Arial, Helvetica, sans-serif" font-size="10.5" font-style="italic" fill="#000000" text-anchor="middle">«Webhook»</text>

  {make_page_footer("Sơ Đồ 2: Giỏ Hàng &amp; Đặt Hàng Thanh Toán", 2)}
</svg>
"""

puml_d2 = """@startuml UC_02_CART_CHECKOUT
skinparam monochrome true
skinparam shadowing false
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam arrowThickness 1.5
skinparam usecaseBorderThickness 2.0
skinparam rectangleBorderThickness 2.0
left to right direction

actor "Khách Hàng\\n(Customer / VIP)" as Customer
actor "Cổng Thanh Toán SePay\\n<<Secondary System>>" as SePay

rectangle "Hệ Thống AURALIÈ: Giỏ Hàng & Thanh Toán" {
  usecase "UC08: Quản Lý Giỏ Hàng\\n<size:10>Thêm, sửa số lượng, xóa</size>" as UC08
  usecase "UC09: Đặt Hàng & Thanh Toán\\n<size:10>POST /api/v1/orders</size>" as UC09
  usecase "UC10: Xác Thực Thông Tin Giao\\n<size:10>Họ tên, SĐT, Địa chỉ, Hỏa tốc</size>" as UC10
  usecase "UC11: Áp Dụng Mã Ưu Đãi (Coupon)\\n<size:10>Kiểm tra chiết khấu</size>" as UC11
  usecase "UC12: Thanh Toán QR (SePay)\\n<size:10>VietQR Napas 24/7</size>" as UC12
  usecase "UC13: Thanh Toán Tiền Mặt (COD)\\n<size:10>Thanh toán khi nhận</size>" as UC13

  UC09 .> UC10 : <<include>>
  UC11 .> UC09 : <<extend>>
  UC12 .> UC09 : <<extend>>
  UC13 .> UC09 : <<extend>>
}

Customer --> UC08
Customer --> UC09
SePay --> UC12 : <<Webhook>>
@enduml
"""

# ==============================================================================
# DIAGRAM 3: UC_03_AUTH_INTERACTION
# 7 Use Cases on A4 Portrait: Register, Login, Forgot, Logout, Wishlist, Inquiry, Newsletter
# ==============================================================================
svg_d3 = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 840 1188" xmlns="http://www.w3.org/2000/svg" width="840" height="1188">
  {COMMON_SVG_DEFS}
  <rect width="840" height="1188" fill="#FFFFFF" />

  {make_page_header("AURALIÈ — UML USE CASE DIAGRAM (A4 DỌC)", "PHÂN HỆ 3: TÀI KHOẢN, YÊU THÍCH &amp; TƯƠNG TÁC (AUTH &amp; ENGAGEMENT)", 3)}

  <!-- ACTORS (LEFT) -->
  {actor_figure(120, 260, "Khách Hàng", "(Guest / Vãng Lai)")}

  <!-- GENERALIZATION ARROW: Customer inherits from Guest -->
  <line x1="120" y1="620" x2="120" y2="405" stroke="#000000" stroke-width="2" marker-end="url(#gen-arr)" />
  <text x="135" y="510" font-family="Arial, Helvetica, sans-serif" font-size="11" font-style="italic" fill="#000000">Kế thừa</text>

  {actor_figure(120, 630, "Khách Đã Đăng Nhập", "(Customer / VIP)")}

  <!-- SYSTEM BOUNDARY -->
  <rect x="235" y="105" width="575" height="990" fill="#FFFFFF" stroke="#000000" stroke-width="2" />
  <rect x="235" y="105" width="575" height="34" fill="#000000" />
  <text x="250" y="128" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Phân Hệ: Tài Khoản &amp; Tương Tác Hội Viên</text>

  <!-- USE CASES -->
  {uc_ellipse(480, 190, 155, 34, "UC17", "Đăng Ký Tài Khoản", "Bcrypt salt=12 • JWT Auth")}
  {uc_ellipse(480, 310, 155, 34, "UC18", "Đăng Nhập Hệ Thống", "Xác thực email &amp; mật khẩu")}
  {uc_ellipse(480, 430, 155, 34, "UC19", "Quên &amp; Đặt Lại Mật Khẩu", "Token xác nhận email")}
  {uc_ellipse(480, 560, 160, 34, "UC15", "Gửi Liên Hệ / Tư Vấn May Đo", "Form Bespoke Atelier Đồng Khởi")}
  {uc_ellipse(480, 690, 160, 34, "UC16", "Đăng Ký Nhận Bản Tin VIP", "Đặc quyền ra mắt BST mới")}
  
  <!-- Customer Exclusive -->
  {uc_ellipse(480, 830, 165, 36, "UC14", "Quản Lý Danh Sách Yêu Thích", "Wishlist tim đỏ • Đồng bộ CSDL")}
  {uc_ellipse(480, 960, 150, 32, "UC20", "Đăng Xuất", "Xóa JWT token khỏi phiên")}

  <!-- ASSOCIATIONS (GUEST - SOLID LINES) -->
  <line x1="160" y1="260" x2="325" y2="190" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="270" x2="325" y2="310" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="280" x2="325" y2="430" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="290" x2="320" y2="560" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="300" x2="320" y2="690" stroke="#000000" stroke-width="1.8" />

  <!-- ASSOCIATIONS (CUSTOMER - SOLID LINES) -->
  <line x1="160" y1="640" x2="315" y2="830" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="650" x2="330" y2="960" stroke="#000000" stroke-width="1.8" />

  {make_page_footer("Sơ Đồ 3: Tài Khoản &amp; Tương Tác Hội Viên", 3)}
</svg>
"""

puml_d3 = """@startuml UC_03_AUTH_INTERACTION
skinparam monochrome true
skinparam shadowing false
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam arrowThickness 1.5
skinparam usecaseBorderThickness 2.0
skinparam rectangleBorderThickness 2.0
left to right direction

actor "Khách Hàng\\n(Guest / Vãng Lai)" as Guest
actor "Khách Đã Đăng Nhập\\n(Customer / VIP)" as Customer

Customer --|> Guest

rectangle "Hệ Thống AURALIÈ: Tài Khoản & Tương Tác" {
  usecase "UC17: Đăng Ký Tài Khoản\\n<size:10>Bcrypt salt=12 • JWT</size>" as UC17
  usecase "UC18: Đăng Nhập Hệ Thống\\n<size:10>Xác thực email & mật khẩu</size>" as UC18
  usecase "UC19: Quên & Đặt Lại Mật Khẩu\\n<size:10>Token xác nhận</size>" as UC19
  usecase "UC15: Gửi Liên Hệ / Tư Vấn May Đo\\n<size:10>Form tư vấn Bespoke</size>" as UC15
  usecase "UC16: Đăng Ký Nhận Bản Tin VIP\\n<size:10>Newsletter độc quyền</size>" as UC16
  usecase "UC14: Quản Lý Danh Sách Yêu Thích\\n<size:10>Wishlist tim đỏ • Đồng bộ DB</size>" as UC14
  usecase "UC20: Đăng Xuất\\n<size:10>Hủy phiên làm việc</size>" as UC20
}

Guest --> UC17
Guest --> UC18
Guest --> UC19
Guest --> UC15
Guest --> UC16

Customer --> UC14
Customer --> UC20
@enduml
"""

# ==============================================================================
# DIAGRAM 4: UC_04_PROFILE_ORDERS
# 6 Use Cases on A4 Portrait: Profile, OrderHistory, CancelOrder, Reviews, VIPTier, Warranty
# ==============================================================================
svg_d4 = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 840 1188" xmlns="http://www.w3.org/2000/svg" width="840" height="1188">
  {COMMON_SVG_DEFS}
  <rect width="840" height="1188" fill="#FFFFFF" />

  {make_page_header("AURALIÈ — UML USE CASE DIAGRAM (A4 DỌC)", "PHÂN HỆ 4: HỒ SƠ CÁ NHÂN &amp; QUẢN LÝ ĐƠN HÀNG (PROFILE &amp; ORDERS)", 4)}

  <!-- ACTOR (LEFT) -->
  {actor_figure(120, 480, "Khách Hàng", "(Customer / VIP)")}

  <!-- SYSTEM BOUNDARY -->
  <rect x="235" y="105" width="575" height="990" fill="#FFFFFF" stroke="#000000" stroke-width="2" />
  <rect x="235" y="105" width="575" height="34" fill="#000000" />
  <text x="250" y="128" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">Phân Hệ: Hồ Sơ Cá Nhân &amp; Đơn Hàng</text>

  <!-- USE CASES -->
  {uc_ellipse(420, 200, 150, 34, "UC21", "Quản Lý Hồ Sơ Cá Nhân", "Họ tên, SĐT, Địa chỉ nhận hàng")}
  {uc_ellipse(390, 360, 140, 36, "UC22", "Tra Cứu Lịch Sử Đơn Hàng", "my-orders • Trạng thái đơn hàng")}
  
  <!-- UC23: Hủy đơn hàng (Extend UC22) -->
  {uc_ellipse(675, 360, 115, 34, "UC23", "Hủy Đơn Hàng", "Áp dụng đơn PENDING")}

  {uc_ellipse(420, 540, 155, 36, "UC24", "Viết Đánh Giá Sản Phẩm", "Đánh giá 1-5 sao sản phẩm đã mua")}
  {uc_ellipse(420, 720, 155, 36, "UC25", "Tra Cứu Điểm &amp; Hạng VIP", "Silver / Gold / Platinum / VIP")}
  {uc_ellipse(420, 900, 155, 36, "UC26", "Thẻ Bảo Hành Điện Tử", "Bảo hành phom dáng 12 tháng")}

  <!-- EXTEND: UC23 -> UC22 -->
  <line x1="560" y1="360" x2="530" y2="360" stroke="#000000" stroke-width="1.8" stroke-dasharray="6,4" marker-end="url(#open-arr)" />
  <text x="545" y="350" font-family="Arial, Helvetica, sans-serif" font-size="11.5" font-style="italic" fill="#000000" text-anchor="middle">«extend»</text>

  <!-- ASSOCIATIONS (SOLID LINES) -->
  <line x1="160" y1="460" x2="270" y2="200" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="480" x2="250" y2="360" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="500" x2="265" y2="540" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="510" x2="265" y2="720" stroke="#000000" stroke-width="1.8" />
  <line x1="160" y1="520" x2="265" y2="900" stroke="#000000" stroke-width="1.8" />

  {make_page_footer("Sơ Đồ 4: Hồ Sơ Cá Nhân &amp; Đơn Hàng", 4)}
</svg>
"""

puml_d4 = """@startuml UC_04_PROFILE_ORDERS
skinparam monochrome true
skinparam shadowing false
skinparam backgroundColor #FFFFFF
skinparam defaultFontName Arial
skinparam defaultFontSize 12
skinparam arrowThickness 1.5
skinparam usecaseBorderThickness 2.0
skinparam rectangleBorderThickness 2.0
left to right direction

actor "Khách Hàng\\n(Customer / VIP)" as Customer

rectangle "Hệ Thống AURALIÈ: Hồ Sơ Cá Nhân & Đơn Hàng" {
  usecase "UC21: Quản Lý Hồ Sơ Cá Nhân\\n<size:10>Họ tên, SĐT, Địa chỉ</size>" as UC21
  usecase "UC22: Tra Cứu Lịch Sử Đơn Hàng\\n<size:10>my-orders • Trạng thái đơn</size>" as UC22
  usecase "UC23: Hủy Đơn Hàng Chờ Xử Lý\\n<size:10>Áp dụng đơn PENDING</size>" as UC23
  usecase "UC24: Viết Đánh Giá Sản Phẩm Đã Mua\\n<size:10>Đánh giá 1-5 sao</size>" as UC24
  usecase "UC25: Tra Cứu Điểm & Hạng Hội Viên VIP\\n<size:10>Silver/Gold/Platinum/VIP</size>" as UC25
  usecase "UC26: Tra Cứu Thẻ Bảo Hành Điện Tử\\n<size:10>Bảo hành phom dáng 12 tháng</size>" as UC26

  UC23 .> UC22 : <<extend>>
}

Customer --> UC21
Customer --> UC22
Customer --> UC24
Customer --> UC25
Customer --> UC26
@enduml
"""

# ==============================================================================
# WRITE ALL 4 PUML AND SVG FILES
# ==============================================================================
diagrams = [
    ("UC_01_STOREFRONT_DISCOVERY", puml_d1, svg_d1),
    ("UC_02_CART_CHECKOUT", puml_d2, svg_d2),
    ("UC_03_AUTH_INTERACTION", puml_d3, svg_d3),
    ("UC_04_PROFILE_ORDERS", puml_d4, svg_d4),
]

for name, puml_str, svg_str in diagrams:
    puml_file = os.path.join(TARGET_DIR, f"{name}.puml")
    svg_file = os.path.join(TARGET_DIR, f"{name}.svg")
    with open(puml_file, "w", encoding="utf-8") as f:
        f.write(puml_str.strip())
    with open(svg_file, "w", encoding="utf-8") as f:
        f.write(svg_str.strip())
    print(f"Saved: {puml_file} & {svg_file}")

# ==============================================================================
# RENDER HIGH-RESOLUTION PNG FOR EACH A4 PORTRAIT DIAGRAM VIA EDGE HEADLESS
# ==============================================================================
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
png_files = []

for name, _, _ in diagrams:
    svg_file = os.path.join(TARGET_DIR, f"{name}.svg")
    png_file = os.path.join(TARGET_DIR, f"{name}.png")
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--window-size=1000,1350",
        f"--screenshot={png_file}",
        f"file:///{svg_file.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd, check=True)
    png_files.append(png_file)
    print(f"Rendered PNG: {png_file} (Size: {os.path.getsize(png_file)} bytes)")

# ==============================================================================
# GENERATE MASTER MULTI-PAGE HTML FOR ACCURATE A4 PORTRAIT PRINTING
# ==============================================================================
html_master = os.path.join(TARGET_DIR, "AURALIE_UML_USE_CASE_A4_PORTRAIT.html")
pdf_master = os.path.join(TARGET_DIR, "AURALIE_UML_USE_CASE_A4_PORTRAIT.pdf")
root_pdf = os.path.join(r"c:\Users\ASUS\Documents\Demo\DATN", "AURALIE_UML_USE_CASE_A4_PORTRAIT.pdf")

html_doc = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>AURALIÈ Haute Couture — UML 2.x Use Case Diagram (A4 Portrait)</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
    }
    .page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #FFFFFF;
      overflow: hidden;
    }
    .page svg {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
"""

for _, _, svg_str in diagrams:
    # strip xml header if present inside html
    svg_clean = svg_str.replace('<?xml version="1.0" encoding="UTF-8"?>', '')
    html_doc += f'  <div class="page">\n{svg_clean}\n  </div>\n'

html_doc += """</body>
</html>
"""

with open(html_master, "w", encoding="utf-8") as f:
    f.write(html_doc)
print(f"Saved Master HTML: {html_master}")

# Render Master Multi-Page PDF via Edge Headless
cmd_pdf = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_master}",
    f"file:///{html_master.replace(os.sep, '/')}"
]
subprocess.run(cmd_pdf, check=True)
import shutil
shutil.copyfile(pdf_master, root_pdf)
print(f"Generated A4 Portrait PDF: {pdf_master} (Size: {os.path.getsize(pdf_master)} bytes)")
print(f"Copied to root: {root_pdf}")

print("\n>>> ALL 4 A4 PORTRAIT UML ASSETS GENERATED SUCCESSFULLY! <<<")
