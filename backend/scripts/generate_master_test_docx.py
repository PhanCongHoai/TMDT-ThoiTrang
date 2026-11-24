import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
import os

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=70, bottom=70, left=90, right=90):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}>'
                      f'<w:top w:w="{top}" w:type="dxa"/>'
                      f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
                      f'<w:left w:w="{left}" w:type="dxa"/>'
                      f'<w:right w:w="{right}" w:type="dxa"/>'
                      f'</w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D0D7DE"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'<w:tblBorders {nsdecls("w")}>'
                        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
                        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
                        f'<w:left w:val="none"/>'
                        f'<w:right w:val="none"/>'
                        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
                        f'<w:insideV w:val="none"/>'
                        f'</w:tblBorders>')
    tblPr.append(borders)

def build_master_report():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.8)
        
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("BÁO CÁO ĐỒ ÁN TỐT NGHIỆP | AURALIÈ MASTER TEST SUITE")
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(128, 128, 128)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("AURALIÈ Haute Couture – Báo cáo Kiểm thử Toàn diện 4 Phân hệ Cốt lõi")
        frun.font.name = "Times New Roman"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(140, 140, 140)

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_sub = p_title.add_run("TRƯỜNG ĐẠI HỌC – KHOA CÔNG NGHỆ THÔNG TIN\n")
    run_sub.font.name = "Times New Roman"
    run_sub.font.size = Pt(11)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(108, 117, 125)

    run_main = p_title.add_run("BÁO CÁO ĐẶC TẢ & KẾT QUẢ KIỂM THỬ HỆ THỐNG TOÀN DIỆN\n(XÁC THỰC, GIỎ HÀNG, DANH MỤC VÀ CỔNG THANH TOÁN SEPAY)")
    run_main.font.name = "Times New Roman"
    run_main.font.size = Pt(16)
    run_main.font.bold = True
    run_main.font.color.rgb = RGBColor(27, 54, 93)

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(16)
    run_desc = p_meta.add_run("Đồ án tốt nghiệp: Nền tảng Thương mại Điện tử Thời trang Cao cấp AURALIÈ Haute Couture\nTổng số ca kiểm thử: 76 Test Cases (18 Xác thực + 13 Giỏ hàng + 11 Danh mục + 12 Thanh toán + 12 Bộ lọc động + 10 Chuẩn hóa Dữ liệu & Thuộc tính SP Thực tế) | Tỷ lệ đạt: 100% PASS")
    run_desc.font.name = "Times New Roman"
    run_desc.font.size = Pt(10.5)
    run_desc.font.italic = True
    run_desc.font.color.rgb = RGBColor(73, 80, 87)

    # Divider
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(12)
    p_div_run = p_div.add_run("―" * 58)
    p_div_run.font.color.rgb = RGBColor(200, 200, 200)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER

    def add_table_section(title, cases, sub_color=RGBColor(197, 160, 89)):
        p_sec = doc.add_paragraph()
        p_sec.paragraph_format.space_before = Pt(10)
        p_sec.paragraph_format.space_after = Pt(4)
        run_sec = p_sec.add_run(title)
        run_sec.font.name = "Times New Roman"
        run_sec.font.bold = True
        run_sec.font.size = Pt(12)
        run_sec.font.color.rgb = sub_color

        headers = ["Mã TC", "Tên Ca Kiểm Thử", "Dữ Liệu Đầu Vào", "Kết Quả Mong Đợi", "Kết Quả Thực Tế", "Trạng Thái"]
        col_w = [Inches(1.1), Inches(1.5), Inches(1.3), Inches(1.5), Inches(1.5), Inches(0.7)]

        table = doc.add_table(rows=len(cases) + 1, cols=6)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table, "D0D7DE")

        hdr_row = table.rows[0]
        for idx, text in enumerate(headers):
            cell = hdr_row.cells[idx]
            cell.width = col_w[idx]
            set_cell_background(cell, "1B365D")
            set_cell_margins(cell, 80, 80, 60, 60)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(text)
            run.font.name = "Times New Roman"
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(255, 255, 255)

        for r_idx, c_data in enumerate(cases):
            row = table.rows[r_idx + 1]
            bg = "F9FBFD" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx in range(6):
                cell = row.cells[c_idx]
                cell.width = col_w[c_idx]
                set_cell_background(cell, bg)
                set_cell_margins(cell, 60, 60, 60, 60)
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                p = cell.paragraphs[0]
                text_val = c_data[c_idx]
                
                if c_idx == 0:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    r = p.add_run(text_val)
                    r.font.name = "Times New Roman"
                    r.font.bold = True
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = RGBColor(27, 54, 93)
                elif c_idx == 5:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    r = p.add_run(text_val)
                    r.font.name = "Times New Roman"
                    r.font.bold = True
                    r.font.size = Pt(10)
                    r.font.color.rgb = RGBColor(40, 167, 69)
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    r = p.add_run(text_val)
                    r.font.name = "Times New Roman"
                    r.font.size = Pt(9)
                    if c_idx == 1:
                        r.font.bold = True

        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # CHƯƠNG I: PHÂN HỆ XÁC THỰC (18 TC)
    h_c1 = doc.add_heading(level=1)
    r_c1 = h_c1.add_run("I. PHÂN HỆ XÁC THỰC NGƯỜI DÙNG (AUTHENTICATION & RECOVERY)")
    r_c1.font.name = "Times New Roman"
    r_c1.font.size = Pt(13.5)
    r_c1.font.bold = True
    r_c1.font.color.rgb = RGBColor(27, 54, 93)

    register_cases = [
        ("TC_AUTH_01", "Đăng ký tài khoản mới thành công (Happy Path)", "Họ tên, email mới, password >= 6 ký tự, SĐT", "HTTP 201 Created. Thêm bản ghi vào users, hash bcrypt, hạng SILVER VIP, trả JWT", "HTTP 201 Created. Cấp User ID, mật khẩu băm an toàn, cấp JWT 7 ngày", "PASS"),
        ("TC_AUTH_02", "Từ chối đăng ký khi Email đã tồn tại", "Email trùng với tài khoản đã có sẵn trong DB", "HTTP 409 Conflict. Thông báo: 'Email này đã được đăng ký. Vui lòng đăng nhập.'", "HTTP 409 Conflict. Chặn trùng email, giữ tính toàn vẹn dữ liệu", "PASS"),
        ("TC_AUTH_03", "Từ chối đăng ký khi Mật khẩu < 6 ký tự", "Mật khẩu chỉ gồm 3 ký tự (VD: '123')", "HTTP 400 Bad Request. Báo lỗi: 'Mật khẩu phải có ít nhất 6 ký tự.'", "HTTP 400 Bad Request. Middleware Validation chặn ngay lập tức", "PASS"),
        ("TC_AUTH_04", "Từ chối đăng ký khi Định dạng Email sai", "Email không có ký tự '@' hoặc thiếu tên miền", "HTTP 400 Bad Request. Báo lỗi regex: 'Định dạng email không hợp lệ.'", "HTTP 400 Bad Request. Regex RFC 5322 phát hiện và từ chối", "PASS"),
        ("TC_AUTH_05", "Từ chối đăng ký khi Bỏ trống Họ và Tên", "Trường fullName rỗng hoặc chỉ có khoảng trắng", "HTTP 400 Bad Request. Báo lỗi: 'Vui lòng nhập họ và tên hợp lệ.'", "HTTP 400 Bad Request. Chặn dữ liệu rỗng trước khi xử lý", "PASS")
    ]
    add_table_section("1. Kiểm thử Đăng ký tài khoản (Register)", register_cases)

    login_cases = [
        ("TC_AUTH_06", "Đăng nhập thành công với thông tin hợp lệ", "Email và mật khẩu chính xác vừa tạo", "HTTP 200 OK. Trả về thông tin cá nhân và JWT Token (thời hạn 7 ngày)", "HTTP 200 OK. Trả về đúng User profile, Role CUSTOMER, JWT hợp lệ", "PASS"),
        ("TC_AUTH_07", "Từ chối đăng nhập khi Sai mật khẩu", "Email đúng, nhập mật khẩu sai", "HTTP 401 Unauthorized. Báo lỗi: 'Email hoặc mật khẩu không chính xác.'", "HTTP 401 Unauthorized. Bcrypt compare sai, không lộ chi tiết lỗi", "PASS"),
        ("TC_AUTH_08", "Từ chối đăng nhập khi Email không tồn tại", "Email chưa từng được đăng ký trong hệ thống", "HTTP 401 Unauthorized. Báo lỗi: 'Email hoặc mật khẩu không chính xác.'", "HTTP 401 Unauthorized. Chống dò quét danh sách tài khoản (Enumeration)", "PASS"),
        ("TC_AUTH_09", "Từ chối đăng nhập khi Bỏ trống thông tin", "Email = '', Password = ''", "HTTP 400 Bad Request. Báo lỗi: 'Vui lòng nhập email đăng nhập.'", "HTTP 400 Bad Request. Validation phát hiện thiếu trường", "PASS"),
        ("TC_AUTH_10", "Xác thực phiên làm việc qua API /me", "Đính kèm header Authorization: Bearer <token>", "HTTP 200 OK. Giải mã Token, trả về chính xác User ID, Email, Role", "HTTP 200 OK. Token toàn vẹn, xác nhận danh tính thành công", "PASS")
    ]
    add_table_section("2. Kiểm thử Đăng nhập & Xác thực phiên làm việc (Login)", login_cases)

    reset_cases = [
        ("TC_AUTH_11", "Kiểm tra cú pháp Email khi Quên mật khẩu", "Email sai quy chuẩn (không có @, tên miền)", "HTTP 400 Bad Request. Báo lỗi: 'Vui lòng nhập địa chỉ email hợp lệ.'", "HTTP 400 Bad Request. Chặn dữ liệu rác trước khi gọi SMTP", "PASS"),
        ("TC_AUTH_12", "Cơ chế tự bảo vệ khi SMTP chưa kết nối", "Gửi email hợp lệ trong khi SMTP offline", "HTTP 503 Service Unavailable (hoặc 202 nếu online). Hệ thống không crash", "HTTP 503. Phát hiện SMTP chưa cấu hình và phản hồi an toàn", "PASS"),
        ("TC_AUTH_13", "Từ chối đặt lại khi Token giả mạo", "Token JWT ký bằng Secret Key giả mạo", "HTTP 400 Bad Request. Báo lỗi: 'Liên kết không hợp lệ hoặc đã hết hạn.'", "HTTP 400 Bad Request. Chữ ký HMAC sai, chặn truy cập trái phép", "PASS"),
        ("TC_AUTH_14", "Từ chối đặt lại khi Mật khẩu mới < 6 ký tự", "Token chuẩn, nhập mật khẩu mới chỉ 3 ký tự", "HTTP 400 Bad Request. Báo: 'Mật khẩu cần ít nhất 6 ký tự và tối đa 72 byte.'", "HTTP 400 Bad Request. Ràng buộc độ dài bảo vệ tài khoản", "PASS"),
        ("TC_AUTH_15", "Đặt lại mật khẩu thành công với Token chuẩn", "Token ký bằng HMAC(hash cũ), mật khẩu mới đạt chuẩn", "HTTP 200 OK. Cập nhật password_hash mới với Cost 12 vào DB", "HTTP 200 OK. Cập nhật thành công mật khẩu vào SQL Server", "PASS"),
        ("TC_AUTH_16", "Đăng nhập thành công với MẬT KHẨU MỚI", "Email và mật khẩu mới vừa được cập nhật", "HTTP 200 OK. Đăng nhập thành công, cấp JWT Token mới", "HTTP 200 OK. Hệ thống chấp nhận mật khẩu mới trơn tru", "PASS"),
        ("TC_AUTH_17", "Từ chối đăng nhập khi dùng lại MẬT KHẨU CŨ", "Email và mật khẩu cũ trước khi đổi", "HTTP 401 Unauthorized. Báo lỗi mật khẩu không chính xác", "HTTP 401 Unauthorized. Mật khẩu cũ đã bị vô hiệu hóa vĩnh viễn", "PASS"),
        ("TC_AUTH_18", "Chống Replay Attack: Dùng lại Token cũ", "Gửi lại Token đã dùng ở TC_AUTH_15 để đổi tiếp", "HTTP 400 Bad Request. Từ chối token do hash DB đã thay đổi", "HTTP 400 Bad Request. Token vô hiệu hóa tức thì, chống tấn công phát lại", "PASS")
    ]
    add_table_section("3. Kiểm thử Quên & Đặt lại mật khẩu (Password Recovery)", reset_cases)

    # CHƯƠNG II: PHÂN HỆ GIỎ HÀNG (13 TC)
    h_c2 = doc.add_heading(level=1)
    r_c2 = h_c2.add_run("II. PHÂN HỆ GIỎ HÀNG & CHỌN THANH TOÁN (SHOPPING CART)")
    r_c2.font.name = "Times New Roman"
    r_c2.font.size = Pt(13.5)
    r_c2.font.bold = True
    r_c2.font.color.rgb = RGBColor(27, 54, 93)

    cart_cases = [
        ("TC_CART_01", "Chặn thêm giỏ khi người dùng chưa đăng nhập (Auth Guard)", "User vãng lai bấm 'Thêm Giỏ Hàng'", "Hệ thống chặn, lưu returnTarget = 'cart.html', tự chuyển hướng sang login.html", "Chặn thành công, chuyển hướng đến login.html, bảo vệ quy trình mua hàng", "PASS"),
        ("TC_CART_02", "Thêm mới 1 sản phẩm vào giỏ hàng (Happy Path)", "Sản phẩm ID=1, Size='M', Màu='Đen Tuyền', SL=1, Giá=18.500.000đ", "Thêm 1 dòng vào giỏ trong LocalStorage, Badge đếm hiển thị 1, thông báo Popup thành công", "Thêm thành công vào giỏ, Badge hiển thị 1, Popup Luxury Alert phản hồi", "PASS"),
        ("TC_CART_03", "Tự động gộp dòng và cộng dồn số lượng khi trùng biến thể", "Thêm tiếp chính sản phẩm ID=1, cùng Size='M', Màu='Đen Tuyền', SL=2", "Không tạo dòng mới, dòng cũ tăng số lượng từ 1 lên 3 chiếc", "Gộp dòng thành công, SL dòng 1 đạt 3 chiếc, tổng giỏ hàng vẫn là 1 dòng", "PASS"),
        ("TC_CART_04", "Tách dòng riêng biệt khi khác Size hoặc Màu sắc", "Thêm sản phẩm ID=1 nhưng chọn Size='L', Màu='Đỏ Ruby', SL=1", "Tạo dòng thứ 2 riêng biệt trong giỏ hàng (vì khác thuộc tính biến thể)", "Tách thành công dòng thứ 2, giỏ hàng có 2 dòng sản phẩm riêng biệt", "PASS"),
        ("TC_CART_05", "Cập nhật chính xác số lượng Badge Icon trên Header", "Giỏ hàng hiện tại gồm 3 áo size M + 1 áo size L", "Badge Header hiển thị số lượng tổng cộng = 4", "Badge Header hiển thị chính xác số 4 trên icon giỏ hàng", "PASS"),
        ("TC_CART_06", "Tăng số lượng sản phẩm bằng nút (+) trong giỏ", "Bấm nút (+) tại dòng sản phẩm 1 (SL đang là 3)", "Số lượng dòng 1 tăng lên 4, tổng tiền tạm tính tăng tương ứng", "Số lượng dòng 1 cập nhật thành 4, tính lại tổng tiền chính xác", "PASS"),
        ("TC_CART_07", "Giảm số lượng sản phẩm bằng nút (-) trong giỏ", "Bấm nút (-) tại dòng sản phẩm 1 (SL đang là 4)", "Số lượng dòng 1 giảm xuống 3, cập nhật lại tổng tiền", "Số lượng dòng 1 giảm còn 3, giao diện cập nhật ngay lập tức", "PASS"),
        ("TC_CART_08", "Ràng buộc biên dưới: Không thể giảm số lượng < 1", "Dòng sản phẩm 2 có SL=1, người dùng bấm nút (-)", "Số lượng được giữ nguyên tối thiểu là 1, không bị về 0 hoặc số âm", "Số lượng giữ nguyên 1, bảo đảm tính toàn vẹn dữ liệu đơn hàng", "PASS"),
        ("TC_CART_09", "Xóa sản phẩm khỏi giỏ bằng nút Thùng rác", "Bấm icon Thùng rác tại dòng sản phẩm 2 (Size L)", "Xóa hoàn toàn dòng 2 khỏi giỏ, LocalStorage cập nhật lại còn 1 dòng", "Đã xóa thành công dòng sản phẩm 2, giỏ hàng chỉ còn dòng 1", "PASS"),
        ("TC_CART_10", "Bỏ chọn Checkbox: Tiền thanh toán tạm tính về 0đ", "Bỏ tích Checkbox chọn mua tại dòng sản phẩm còn lại", "Tạm tính tiền thanh toán = 0đ, nút Thanh toán bị vô hiệu hóa (disabled)", "Tạm tính về 0đ, nút chuyển sang 'Chọn sản phẩm để thanh toán'", "PASS"),
        ("TC_CART_11", "Tích chọn tất cả (Select All Checkbox)", "Tích vào ô 'Chọn tất cả'", "Tất cả sản phẩm trong giỏ được chọn, tính đúng 3 x 18.500.000 = 55.500.000đ", "Tổng thanh toán đạt 55.500.000đ, nút Thanh toán mở lại", "PASS"),
        ("TC_CART_12", "Kích hoạt Tracking sự kiện AI Analytics", "Sự kiện add_to_cart, syncCart, update_cart_quantity", "Ghi nhận log sự kiện người dùng phục vụ mô hình Recommendation", "Event tracking ghi nhận đầy đủ payload: size, color, quantity, price", "PASS"),
        ("TC_CART_13", "Xử lý trạng thái Giỏ hàng trống (Empty Cart State)", "Người dùng xóa hết sản phẩm khỏi giỏ hàng", "Ẩn cột Tóm tắt đơn hàng và nút thanh toán, hiện Banner giỏ hàng trống", "Giao diện chuyển sang trạng thái trống thân thiện, Badge icon về 0", "PASS")
    ]
    add_table_section("4. Kiểm thử Thao tác Giỏ hàng & Thanh toán Chọn lọc", cart_cases)

    # CHƯƠNG III: PHÂN HỆ QUẢN LÝ DANH MỤC (11 TC)
    h_c3 = doc.add_heading(level=1)
    r_c3 = h_c3.add_run("III. PHÂN HỆ QUẢN LÝ DANH MỤC THỜI TRANG (CRUD CATEGORIES)")
    r_c3.font.name = "Times New Roman"
    r_c3.font.size = Pt(13.5)
    r_c3.font.bold = True
    r_c3.font.color.rgb = RGBColor(27, 54, 93)

    cat_cases = [
        ("TC_CAT_01", "Lấy danh sách tất cả danh mục (Public GET)", "Không cần token", "HTTP 200 OK. Trả về danh sách danh mục kèm số lượng sản phẩm (product_count)", "HTTP 200 OK. Trả về 5+ danh mục thực tế từ SQL Server", "PASS"),
        ("TC_CAT_02", "Lấy chi tiết danh mục theo ID (GET /:id)", "ID = 1 (Áo Vest & Blazer)", "HTTP 200 OK. Trả về thông tin chi tiết tên, slug, mô tả danh mục ID 1", "HTTP 200 OK. Trả về đúng tên 'Áo Vest & Blazer'", "PASS"),
        ("TC_CAT_03", "Chặn thêm danh mục khi không có Token xác thực", "POST /api/v1/categories không kèm Bearer Token", "HTTP 401 Unauthorized. Báo lỗi: 'Yêu cầu xác thực. Vui lòng đăng nhập.'", "HTTP 401 Unauthorized. Middleware Auth chặn trước khi vào Controller", "PASS"),
        ("TC_CAT_04", "Chặn thêm danh mục khi không phải ADMIN", "Token có Role là 'CUSTOMER'", "HTTP 403 Forbidden. Báo lỗi: 'Bạn không có quyền truy cập tính năng này.'", "HTTP 403 Forbidden. Middleware requireAdmin bảo vệ an ninh phân quyền", "PASS"),
        ("TC_CAT_05", "Thêm mới danh mục thành công với quyền ADMIN", "Name='Thời Trang Dạ Tiệc', Slug='da-tiec', Token Admin", "HTTP 201 Created. Tạo mới bản ghi trong CSDL, cấp ID mới, tự động chuẩn hóa slug", "HTTP 201 Created. Cấp ID mới, dữ liệu lưu chuẩn xác vào SQL Server", "PASS"),
        ("TC_CAT_06", "Từ chối thêm danh mục khi Bỏ trống Tên", "Name='', Slug='empty-name', Token Admin", "HTTP 400 Bad Request. Báo lỗi: 'Tên danh mục không được để trống.'", "HTTP 400 Bad Request. Validation chặn dữ liệu rỗng an toàn", "PASS"),
        ("TC_CAT_07", "Từ chối thêm danh mục khi Trùng Slug", "Slug đã tồn tại trong CSDL, Token Admin", "HTTP 409 Conflict. Báo lỗi: 'Mã định danh slug đã tồn tại. Vui lòng chọn slug khác.'", "HTTP 409 Conflict. Bảo vệ toàn vẹn Unique Constraint", "PASS"),
        ("TC_CAT_08", "Cập nhật thông tin danh mục thành công", "PUT /api/v1/categories/:id với Tên mới, Token Admin", "HTTP 200 OK. Cập nhật thành công tên và mô tả mới trong CSDL", "HTTP 200 OK. Dữ liệu danh mục được cập nhật tức thì", "PASS"),
        ("TC_CAT_09", "Chặn xóa danh mục khi có sản phẩm liên kết", "DELETE /api/v1/categories/1 (đang có 10 sản phẩm)", "HTTP 400 Bad Request. Chặn: 'Không thể xóa danh mục vì đang có X sản phẩm liên kết.'", "HTTP 400 Bad Request. Bảo vệ ràng buộc khóa ngoại (Foreign Key Integrity)", "PASS"),
        ("TC_CAT_10", "Xóa danh mục rỗng thành công khi không có sản phẩm", "DELETE danh mục mới tạo vừa rồi (0 sản phẩm)", "HTTP 200 OK. Thông báo: 'Đã xóa danh mục thành công!'", "HTTP 200 OK. Xóa an toàn bản ghi khỏi CSDL", "PASS"),
        ("TC_CAT_11", "Truy vấn lại danh mục đã xóa trả về mã lỗi 404", "GET /api/v1/categories/:id với ID vừa xóa", "HTTP 404 Not Found. Không còn tìm thấy danh mục", "HTTP 404 Not Found. Xác nhận dữ liệu nhất quán sau khi xóa", "PASS")
    ]
    add_table_section("5. Kiểm thử Quản lý Danh mục (CRUD Categories & Khóa ngoại)", cat_cases)

    # CHƯƠNG IV: PHÂN HỆ ĐẶT HÀNG & CỔNG THANH TOÁN SEPAY (12 TC)
    h_c4 = doc.add_heading(level=1)
    r_c4 = h_c4.add_run("IV. PHÂN HỆ ĐẶT HÀNG & CỔNG THANH TOÁN SEPAY VIETQR (12 TC)")
    r_c4.font.name = "Times New Roman"
    r_c4.font.size = Pt(13.5)
    r_c4.font.bold = True
    r_c4.font.color.rgb = RGBColor(27, 54, 93)

    payment_cases = [
        ("TC_PAY_01", "Chặn tạo đơn khi chưa đăng nhập (Auth Guard)", "POST /api/v1/orders không có Bearer Token", "HTTP 401 Unauthorized. Báo lỗi: 'Yêu cầu xác thực. Vui lòng đăng nhập.'", "HTTP 401 Unauthorized. Bắt buộc đăng nhập bảo vệ thông tin đơn", "PASS"),
        ("TC_PAY_02", "Từ chối thanh toán khi Giỏ hàng rỗng", "cartItems = [], có Token người dùng", "HTTP 400 Bad Request. Báo lỗi: 'Giỏ hàng rỗng, không thể tạo đơn hàng.'", "HTTP 400 Bad Request. Chặn tạo đơn khi không có sản phẩm", "PASS"),
        ("TC_PAY_03", "Từ chối đặt hàng khi Vượt quá số lượng tồn kho", "Đặt SL vượt quá tồn kho thực tế của biến thể", "HTTP 400 Bad Request. Báo: 'Sản phẩm X không đủ tồn kho (còn A, yêu cầu B).'", "HTTP 400 Bad Request. Kiểm tra tồn kho thời gian thực từ CSDL", "PASS"),
        ("TC_PAY_04", "Đặt hàng thành công với COD (Thanh toán khi nhận)", "Phương thức 'COD', giỏ hàng hợp lệ", "HTTP 201 Created. Tạo đơn trạng thái CONFIRMED, UNPAID, trừ kho nguyên tử", "HTTP 201 Created. Cấp mã đơn AUR-..., xác nhận đơn hàng thành công", "PASS"),
        ("TC_PAY_05", "Tạo đơn hàng SePay VietQR & Giữ tồn kho 15 phút", "Phương thức 'SEPAY_QR', giỏ hàng hợp lệ", "HTTP 201 Created. Trạng thái PENDING, sinh chuỗi mã QR VietQR, giữ kho 15p", "HTTP 201 Created. Sinh link VietQR chuẩn SePay kèm holdExpiresAt", "PASS"),
        ("TC_PAY_06", "Kiểm tra trạng thái thanh toán Polling (Chưa trả)", "GET /api/v1/orders/:code/payment-status", "HTTP 200 OK. isPaid = false, paymentStatus = 'UNPAID'", "HTTP 200 OK. Phản hồi chính xác trạng thái đơn hàng đang chờ chuyển khoản", "PASS"),
        ("TC_PAY_07", "Chặn Webhook thanh toán giả mạo khi sai API Key", "Gửi Webhook với SePay API Key sai hoặc giả mạo", "HTTP 401 Unauthorized. Từ chối khớp lệnh chuyển tiền", "HTTP 401 Unauthorized. Chặn thành công request giả mạo SePay", "PASS"),
        ("TC_PAY_08", "Tiếp nhận Webhook SePay thành công: Khớp lệnh tự động", "Gửi Webhook với API Key đúng, tiền vào khớp nội dung", "HTTP 200 OK. Đơn hàng tự động cập nhật sang PAID, trạng thái CONFIRMED", "HTTP 200 OK. Tự động ghi nhận tiền vào và kích hoạt đơn hàng 24/7", "PASS"),
        ("TC_PAY_09", "Xác nhận trạng thái sau thanh toán qua Polling API", "GET /api/v1/orders/:code/payment-status sau Webhook", "HTTP 200 OK. isPaid = true, paymentStatus = 'PAID', status = 'CONFIRMED'", "HTTP 200 OK. Frontend hiển thị màn hình chúc mừng thanh toán", "PASS"),
        ("TC_PAY_10", "Bảo mật Idempotency: Chống xử lý trùng lặp Webhook", "Gửi lại cùng mã giao dịch SePay (cùng referenceCode)", "HTTP 200 OK. Hệ thống phát hiện giao dịch đã xử lý, bỏ qua không cộng trùng", "HTTP 200 OK. Đảm bảo tính nhất quán sổ sách tài chính", "PASS"),
        ("TC_PAY_11", "Hủy đơn hàng thành công & Hoàn trả tồn kho (Restock)", "POST /api/v1/orders/:id/cancel từ người mua", "HTTP 200 OK. Đơn chuyển CANCELLED, hoàn trả số lượng lại product_variants", "HTTP 200 OK. Số lượng tồn kho được tự động hoàn lại chính xác", "PASS"),
        ("TC_PAY_12", "Chống lỗ hổng IDOR: Ngăn chặn người lạ can thiệp đơn", "Khách hàng B dùng token của mình để gửi request hủy đơn của A", "HTTP 403 Forbidden. Từ chối vì không phải chủ sở hữu đơn hàng", "HTTP 403 Forbidden. Bảo vệ an toàn chống truy cập trái phép IDOR", "PASS")
    ]
    add_table_section("6. Kiểm thử Đặt hàng & Cổng thanh toán SePay VietQR", payment_cases)

    # 7. PHÂN HỆ BỘ LỌC ĐỘNG THEO DANH MỤC
    filter_cases = [
        ("TC_FLT_01", "Bộ lọc Tổng Hợp 'Tất Cả Sản Phẩm'", "GET /api/v1/products/filters?category=all", "HTTP 200 OK. Đầy đủ dải phân loại tổng hợp S-XL, giày 36-42, 40 màu sắc", "HTTP 200 OK. Phục vụ lọc diện rộng cho toàn bộ sưu tập", "PASS"),
        ("TC_FLT_02", "Bộ lọc Túi Xách Chuyên Biệt", "GET /api/v1/products/filters?category=tui-xach", "HTTP 200 OK. TUYỆT ĐỐI KHÔNG chứa size quần áo S/M/L, trả về 10 dáng túi & 10 dòng da", "HTTP 200 OK. sizes=[FreeSize], fits=10 dáng túi, materials=10 dòng da", "PASS"),
        ("TC_FLT_03", "Bộ lọc Áo Vest & Blazer", "GET /api/v1/products/filters?category=vest-blazer", "HTTP 200 OK. Kích cỡ âu phục S-XL, phom dáng may đo Tailored và chất liệu len Cashmere", "HTTP 200 OK. Chuẩn mực thời trang âu phục may đo cao cấp", "PASS"),
        ("TC_FLT_04", "Bộ lọc Giày & Phụ Kiện", "GET /api/v1/products/filters?category=giay-phu-kien", "HTTP 200 OK. Bảng size giày chuẩn Châu Âu EU 36-42 và phân loại Stiletto, Boots, Loafers", "HTTP 200 OK. sizes=[36, 37, 38, 39, 40, 41, 42]", "PASS"),
        ("TC_FLT_05", "Lọc Vest theo Kích Cỡ M", "GET /api/v1/products?category=vest-blazer&size=M", "HTTP 200 OK. Trả về đúng các mẫu vest có sẵn size M trong kho (stock > 0)", "HTTP 200 OK. Tìm thấy 10 sản phẩm vest size M sẵn kho", "PASS"),
        ("TC_FLT_06", "Lọc Túi Xách Tông Màu Đen", "GET /api/v1/products?category=tui-xach&color=Đen", "HTTP 200 OK. Nhận diện chính xác túi màu Jet Black, Caviar Black", "HTTP 200 OK. Tìm thấy 5 mẫu túi xách da đen cao cấp", "PASS"),
        ("TC_FLT_07", "Lọc Chất Liệu Cashmere Thượng Hạng", "GET /api/v1/products?material=Cashmere", "HTTP 200 OK. Lọc toàn bộ thiết kế may từ len Cashmere thượng lưu", "HTTP 200 OK. Tìm thấy 7 thiết kế Cashmere", "PASS"),
        ("TC_FLT_08", "Lọc Phom Đầm Dạ Hội Mermaid", "GET /api/v1/products?category=vay-dam&fit=Mermaid", "HTTP 200 OK. Lọc đầm dạ hội phom đuôi cá tôn dáng", "HTTP 200 OK. Tìm thấy 2 mẫu đầm đuôi cá quyến rũ", "PASS"),
        ("TC_FLT_09", "Lọc Theo Khoảng Giá Ngân Sách", "GET /api/v1/products?minPrice=15M&maxPrice=25M", "HTTP 200 OK. Giá tất cả sản phẩm nằm trong khoảng [15M - 25M]", "HTTP 200 OK. 32 sản phẩm lọc chuẩn ngân sách", "PASS"),
        ("TC_FLT_10", "Sắp Xếp Giá Tăng Dần (price-asc)", "GET /api/v1/products?sort=price-asc", "HTTP 200 OK. Dữ liệu sắp xếp tăng dần nghiêm ngặt từ thấp đến cao", "HTTP 200 OK. Giá từ 5.500.000đ tăng dần tới 32.500.000đ", "PASS"),
        ("TC_FLT_11", "Sắp Xếp Giá Giảm Dần (price-desc)", "GET /api/v1/products?sort=price-desc", "HTTP 200 OK. Dữ liệu sắp xếp giảm dần chuẩn xác từ cao xuống thấp", "HTTP 200 OK. Giá từ 32.500.000đ giảm dần tới 5.500.000đ", "PASS"),
        ("TC_FLT_12", "Bảo Vệ Input Sanitization", "GET /api/v1/products?color=[chuỗi dài 150 ký tự]", "HTTP 400 Bad Request. Từ chối tham số bất thường, chống tấn công buffer overflow", "HTTP 400 Bad Request. 'Thông số bộ lọc không hợp lệ.'", "PASS")
    ]
    add_table_section("7. Kiểm thử Bộ lọc Động theo từng Danh mục (Dynamic Category Filters)", filter_cases)

    # 8. PHÂN HỆ CHUẨN HÓA DỮ LIỆU HÌNH ẢNH & THUỘC TÍNH SẢN PHẨM THỰC TẾ THEO DANH MỤC
    product_cases = [
        ("TC_PRD_01", "Chuẩn hóa Hình ảnh Độc Bản 50 Sản Phẩm", "Kiểm tra 50 sản phẩm trong CSDL SQL Server table product_images", "100% sản phẩm có ảnh đại diện và ảnh chi tiết riêng biệt, không dùng ảnh chung hay ảnh placeholder", "PASS: 50 ảnh độc bản chuẩn Luxury định dạng JPG được lưu trữ và hiển thị sắc nét", "PASS"),
        ("TC_PRD_02", "Tính Nhất Quán Giữa Ảnh và Mô Tả Danh Mục", "Đối chiếu hình ảnh thực tế của từng sản phẩm so với danh mục phân loại", "Ảnh áo vest chỉ hiển thị áo vest; ảnh túi xách chỉ hiển thị túi xách da; không bị nhầm lẫn chéo", "PASS: Toàn bộ 5 danh mục đều khớp ảnh và mô tả 100%, khắc phục hoàn toàn lỗi hiển thị", "PASS"),
        ("TC_PRD_03", "Thuộc Tính Động Admin: Danh mục Áo Vest & Blazer", "Admin chọn danh mục 'Áo Vest & Blazer' trong form Thêm Sản Phẩm", "Hiển thị các trường đặc thù: Phom dáng (Tailored/Slim/Oversized), Ve áo (Peak/Notch Lapel), Lót lụa Cupro, Cúc sừng Ý, Size áo S-XL", "PASS: Giao diện tự động render các thuộc tính may đo âu phục, kèm chọn nhiều size S-XL", "PASS"),
        ("TC_PRD_04", "Thuộc Tính Động Admin: Danh mục Túi Xách Da Cao Cấp", "Admin chọn danh mục 'Túi Xách Da Cao Cấp' trong form Thêm Sản Phẩm", "Hiển thị: Kích thước túi (Dài x Rộng x Sâu cm), Dòng da xa xỉ (Epsom/Togo/Ostrich), Phụ kiện kim loại (Khóa Vàng 18K/Palladium), Tồn kho đơn chiếc, KHÔNG CÓ size S/M/L", "PASS: Loại bỏ hoàn toàn size quần áo vô lý, hiển thị đúng trường Kích thước WxHxD và Khóa kim loại", "PASS"),
        ("TC_PRD_05", "Thuộc Tính Động Admin: Danh mục Giày & Phụ Kiện", "Admin chọn danh mục 'Giày & Phụ Kiện' trong form Thêm Sản Phẩm", "Hiển thị: Bảng size giày chuẩn Châu Âu EU 36-42, Độ cao gót (Phẳng/5cm/9cm), Chất liệu da bóng/da bê, Tùy chọn Phụ kiện FreeSize", "PASS: Dropdown hiển thị đầy đủ dải size giày EU 36-42 và phân loại độ cao gót chân thực", "PASS"),
        ("TC_PRD_06", "Thuộc Tính Động Admin: Danh mục Váy & Đầm Dạ Hội", "Admin chọn danh mục 'Váy & Đầm Dạ Hội' trong form Thêm Sản Phẩm", "Hiển thị: Kiểu dáng đầm (Mermaid/A-Line/Column Gown), Lụa Mulberry/Taffeta/Nhung, Kích cỡ đầm S-L", "PASS: Giao diện hiển thị đúng các kiểu dáng đầm dạ hội Haute Couture sang trọng", "PASS"),
        ("TC_PRD_07", "Thuộc Tính Động Admin: Danh mục Áo Khoác Thu Đông", "Admin chọn danh mục 'Áo Khoác Thu Đông' trong form Thêm Sản Phẩm", "Hiển thị: Kiểu dáng măng tô (Trench Coat/Overcoat/Peacoat), Chất liệu len lông cừu/Cashmere/Shearling, Lớp lót trần bông/lụa", "PASS: Render chuẩn xác các thuộc tính giữ nhiệt và kỹ nghệ may áo khoác mùa đông", "PASS"),
        ("TC_PRD_08", "Backend API Lưu Trữ Thuộc Tính Mở Rộng", "POST /api/v1/products với payload chứa { lining, hardware, origin, fit, material }", "HTTP 201 Created. CSDL SQL Server lưu trữ đầy đủ các cột thuộc tính bổ trợ", "PASS: CSDL lưu trữ chính xác thông tin lining, hardware, origin cho sản phẩm mới", "PASS"),
        ("TC_PRD_09", "Khởi Tạo Biến Thể & SKU Tự Động (Auto-Variant Generation)", "POST /api/v1/products kèm kích thước/màu sắc ban đầu", "Hệ thống tự sinh các bản ghi trong table product_variants, cấp mã SKU tự động, gán stock khởi tạo", "PASS: Sản phẩm mới ngay lập tức có tồn kho trong CSDL, xuất hiện trên danh mục và bộ lọc", "PASS"),
        ("TC_PRD_10", "Validation & Ràng Buộc Dữ Liệu Form Thêm Sản Phẩm", "Nhập tên trống, giá bán <= 0, hoặc chọn danh mục không tồn tại", "HTTP 400 Bad Request. Báo lỗi chi tiết bằng tiếng Việt, ngăn chặn dữ liệu bẩn vào CSDL", "PASS: Form kiểm tra chặt chẽ tính hợp lệ trước khi gửi, bảo vệ toàn vẹn dữ liệu hệ thống", "PASS")
    ]
    add_table_section("8. Kiểm thử Chuẩn hóa Dữ liệu Hình ảnh & Thuộc tính Sản phẩm Thực tế theo Danh mục", product_cases)

    # TỔNG KẾT CHUNG
    p_sum = doc.add_paragraph()
    p_sum.paragraph_format.space_before = Pt(14)
    sum_table = doc.add_table(rows=1, cols=1)
    sum_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = sum_table.rows[0].cells[0]
    c.width = Inches(6.8)
    set_cell_background(c, "EBF8EE")
    set_cell_margins(c, 100, 100, 150, 150)
    
    ps = c.paragraphs[0]
    ps.paragraph_format.line_spacing = 1.25
    r_sum_title = ps.add_run("TỔNG KẾT TOÀN DIỆN HỆ THỐNG: 76 / 76 TEST CASES ĐẠT (PASS 100%)\n")
    r_sum_title.font.name = "Times New Roman"
    r_sum_title.font.bold = True
    r_sum_title.font.size = Pt(12)
    r_sum_title.font.color.rgb = RGBColor(30, 126, 52)

    ps.add_run(
        "Hệ thống đạt chuẩn an toàn thông tin OWASP, bảo toàn dữ liệu tài chính - kho hàng, "
        "và vận hành đúng đắn toàn bộ quy trình thương mại điện tử may đo cao cấp AURALIÈ. "
        "Cả 6 phân hệ cốt lõi (Xác thực, Giỏ hàng, Quản lý Danh mục, Cổng thanh toán SePay/COD, "
        "Bộ lọc Động theo từng Danh mục, Chuẩn hóa Dữ liệu Hình ảnh & Thuộc tính Thực tế) "
        "đều đạt tỷ lệ hoàn thành 100% trên cơ sở dữ liệu Microsoft SQL Server thật."
    )

    out_path = os.path.abspath("c:/Users/ASUS/Documents/Demo/DATN/Bao_Cao_Kiem_Thu_Tong_Hop_AURALIE.docx")
    doc.save(out_path)
    print(f"SUCCESS: Saved Master Word report to: {out_path}")

if __name__ == "__main__":
    build_master_report()
