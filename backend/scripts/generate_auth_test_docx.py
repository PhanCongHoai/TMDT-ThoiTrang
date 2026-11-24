import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}>'
                      f'<w:top w:w="{top}" w:type="dxa"/>'
                      f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
                      f'<w:left w:w="{left}" w:type="dxa"/>'
                      f'<w:right w:w="{right}" w:type="dxa"/>'
                      f'</w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3"):
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

def create_document():
    doc = Document()

    # Page Margins: Standard Thesis Margins (Top: 2cm, Bottom: 2cm, Left: 2.5cm, Right: 2cm)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.8)
        section.different_first_page_header_footer = False
        
        # Header & Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("BÁO CÁO ĐỒ ÁN TỐT NGHIỆP | PHÂN HỆ XÁC THỰC AURALIÈ")
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(128, 128, 128)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("AURALIÈ Haute Couture – Kịch bản và Kết quả kiểm thử chuẩn tốt nghiệp")
        frun.font.name = "Times New Roman"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(140, 140, 140)

    # Style definitions
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(11.5)
    normal_style.font.color.rgb = RGBColor(33, 37, 41)

    # Title Banner
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    run_sub = p_title.add_run("TRƯỜNG ĐẠI HỌC – KHOA CÔNG NGHỆ THÔNG TIN\n")
    run_sub.font.size = Pt(11)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(108, 117, 125)

    run_main = p_title.add_run("BÁO CÁO ĐẶC TẢ & KẾT QUẢ KIỂM THỬ HỆ THỐNG\nPHÂN HỆ XÁC THỰC VÀ BẢO MẬT TÀI KHOẢN (AUTHENTICATION)")
    run_main.font.size = Pt(16)
    run_main.font.bold = True
    run_main.font.color.rgb = RGBColor(27, 54, 93) # Deep Navy

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(18)
    run_desc = p_meta.add_run("Đồ án tốt nghiệp: Nền tảng Thương mại Điện tử Thời trang Cao cấp AURALIÈ Haute Couture\nChức năng kiểm thử: Đăng ký, Đăng nhập, Quên & Đặt lại mật khẩu")
    run_desc.font.size = Pt(10.5)
    run_desc.font.italic = True
    run_desc.font.color.rgb = RGBColor(73, 80, 87)

    # Divider Line
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(12)
    p_div_run = p_div.add_run("―" * 58)
    p_div_run.font.color.rgb = RGBColor(200, 200, 200)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # SECTION 1: MỤC TIÊU & PHẠM VI KIỂM THỬ
    h1 = doc.add_heading(level=1)
    h1_run = h1.add_run("1. TỔNG QUAN VÀ MÔI TRƯỜNG KIỂM THỬ")
    h1_run.font.name = "Times New Roman"
    h1_run.font.size = Pt(13.5)
    h1_run.font.bold = True
    h1_run.font.color.rgb = RGBColor(27, 54, 93)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)

    p1 = doc.add_paragraph()
    p1.paragraph_format.line_spacing = 1.25
    p1.paragraph_format.space_after = Pt(6)
    p1.add_run("Phân hệ Xác thực (Authentication Module) là cửa ngõ an ninh trọng yếu bảo vệ toàn bộ dữ liệu người dùng, phân quyền truy cập giữa khách hàng cá nhân và bộ phận quản trị viên. Mục tiêu kiểm thử là đánh giá tính đúng đắn về mặt nghiệp vụ, tính toàn vẹn dữ liệu, khả năng bắt lỗi hợp lệ hóa (Validation), và kiểm chứng khả năng phòng thủ trước các nguy cơ tấn công an toàn thông tin theo chuẩn OWASP.")

    # Thống kê môi trường (Table Info)
    env_table = doc.add_table(rows=5, cols=2)
    env_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(env_table, "B0C4DE")
    col_widths = [Inches(2.2), Inches(4.5)]
    
    env_data = [
        ("Cơ sở dữ liệu", "Microsoft SQL Server 2019+ (Database: AURALIE_FashionDB)"),
        ("Tầng Backend API", "Node.js v20+, Express.js REST API Architecture (Port: 5000)"),
        ("Tầng Frontend Client", "Vanilla ES6+, Fetch API, HTML5/CSS3, SessionStorage (Port: 3000)"),
        ("Thuật toán bảo mật", "Bcrypt (Cost 12), JSON Web Token (HS256), HMAC-SHA256, Rate Limiter"),
        ("Công cụ thực thi kiểm thử", "Tự động hóa với Node.js Verification Suite & DOM VM Simulation Engine")
    ]
    for row_idx, (k, v) in enumerate(env_data):
        row = env_table.rows[row_idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = col_widths[0], col_widths[1]
        set_cell_margins(c0, 60, 60, 100, 100)
        set_cell_margins(c1, 60, 60, 100, 100)
        set_cell_background(c0, "F0F4F8")
        set_cell_background(c1, "FAFCFD")
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(10.5)
        r0.font.color.rgb = RGBColor(27, 54, 93)

        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.size = Pt(10.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # SECTION 2: BẢNG ĐẶC TẢ CHI TIẾT TEST CASES
    h2 = doc.add_heading(level=1)
    h2_run = h2.add_run("2. BẢNG ĐẶC TẢ CHI TIẾT CÁC CA KIỂM THỬ (TEST CASE SPECIFICATION)")
    h2_run.font.name = "Times New Roman"
    h2_run.font.size = Pt(13.5)
    h2_run.font.bold = True
    h2_run.font.color.rgb = RGBColor(27, 54, 93)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)

    # Function to create standardized test case tables
    def build_test_table(cases, section_title):
        p_sec = doc.add_paragraph()
        p_sec.paragraph_format.space_before = Pt(8)
        p_sec.paragraph_format.space_after = Pt(4)
        run_sec = p_sec.add_run(section_title)
        run_sec.font.bold = True
        run_sec.font.size = Pt(11.5)
        run_sec.font.color.rgb = RGBColor(197, 160, 89) # Luxury Gold / Ochre

        headers = ["Mã TC", "Tên Ca Kiểm Thử", "Dữ Liệu Đầu Vào", "Kết Quả Mong Đợi", "Kết Quả Thực Tế", "Trạng Thái"]
        col_w = [Inches(1.1), Inches(1.5), Inches(1.3), Inches(1.5), Inches(1.5), Inches(0.7)]

        table = doc.add_table(rows=len(cases) + 1, cols=6)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table, "D0D7DE")

        # Header Row
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
            run.font.bold = True
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(255, 255, 255)

        # Data Rows
        for r_idx, c_data in enumerate(cases):
            row = table.rows[r_idx + 1]
            bg = "F9FBFD" if r_idx % 2 == 1 else "FFFFFF"
            for c_idx in range(6):
                cell = row.cells[c_idx]
                cell.width = col_w[c_idx]
                set_cell_background(cell, bg)
                set_cell_margins(cell, 70, 70, 60, 60)
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                p = cell.paragraphs[0]
                text_val = c_data[c_idx]
                
                if c_idx == 0: # Mã TC
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    r = p.add_run(text_val)
                    r.font.bold = True
                    r.font.size = Pt(9.5)
                    r.font.color.rgb = RGBColor(27, 54, 93)
                elif c_idx == 5: # Status
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                    r = p.add_run(text_val)
                    r.font.bold = True
                    r.font.size = Pt(10)
                    r.font.color.rgb = RGBColor(40, 167, 69) # Green PASS
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    r = p.add_run(text_val)
                    r.font.size = Pt(9)
                    if c_idx == 1:
                        r.font.bold = True

        doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 1. ĐĂNG KÝ
    register_cases = [
        ("TC_AUTH_01", "Đăng ký tài khoản mới thành công (Happy Path)", "Họ tên, email mới, password >= 6 ký tự, SĐT", "HTTP 201 Created. Thêm bản ghi vào users, hash bcrypt, hạng SILVER VIP, trả JWT", "HTTP 201 Created. Cấp User ID, mật khẩu được băm an toàn, cấp JWT 7 ngày", "PASS"),
        ("TC_AUTH_02", "Từ chối đăng ký khi Email đã tồn tại", "Email trùng với tài khoản đã có sẵn trong DB", "HTTP 409 Conflict. Thông báo: 'Email này đã được đăng ký. Vui lòng đăng nhập.'", "HTTP 409 Conflict. Chặn trùng email, giữ tính toàn vẹn dữ liệu", "PASS"),
        ("TC_AUTH_03", "Từ chối đăng ký khi Mật khẩu < 6 ký tự", "Mật khẩu chỉ gồm 3 ký tự (VD: '123')", "HTTP 400 Bad Request. Báo lỗi: 'Mật khẩu phải có ít nhất 6 ký tự.'", "HTTP 400 Bad Request. Middleware Validation chặn ngay lập tức", "PASS"),
        ("TC_AUTH_04", "Từ chối đăng ký khi Định dạng Email sai", "Email không có ký tự '@' hoặc thiếu tên miền", "HTTP 400 Bad Request. Báo lỗi regex: 'Định dạng email không hợp lệ.'", "HTTP 400 Bad Request. Regex RFC 5322 phát hiện và từ chối", "PASS"),
        ("TC_AUTH_05", "Từ chối đăng ký khi Bỏ trống Họ và Tên", "Trường fullName rỗng hoặc chỉ có khoảng trắng", "HTTP 400 Bad Request. Báo lỗi: 'Vui lòng nhập họ và tên hợp lệ.'", "HTTP 400 Bad Request. Chặn dữ liệu rỗng trước khi xử lý", "PASS")
    ]
    build_test_table(register_cases, "A. Phân hệ 1: Đăng ký tài khoản (User Registration)")

    # 2. ĐĂNG NHẬP
    login_cases = [
        ("TC_AUTH_06", "Đăng nhập thành công với thông tin hợp lệ", "Email và mật khẩu chính xác vừa tạo", "HTTP 200 OK. Trả về thông tin cá nhân và JWT Token (thời hạn 7 ngày)", "HTTP 200 OK. Trả về đúng User profile, Role CUSTOMER, JWT hợp lệ", "PASS"),
        ("TC_AUTH_07", "Từ chối đăng nhập khi Sai mật khẩu", "Email đúng, nhập mật khẩu sai", "HTTP 401 Unauthorized. Báo lỗi: 'Email hoặc mật khẩu không chính xác.'", "HTTP 401 Unauthorized. Bcrypt compare sai, không lộ chi tiết lỗi", "PASS"),
        ("TC_AUTH_08", "Từ chối đăng nhập khi Email không tồn tại", "Email chưa từng được đăng ký trong hệ thống", "HTTP 401 Unauthorized. Báo lỗi: 'Email hoặc mật khẩu không chính xác.'", "HTTP 401 Unauthorized. Chống dò quét danh sách tài khoản (Enumeration)", "PASS"),
        ("TC_AUTH_09", "Từ chối đăng nhập khi Bỏ trống thông tin", "Email = '', Password = ''", "HTTP 400 Bad Request. Báo lỗi: 'Vui lòng nhập email đăng nhập.'", "HTTP 400 Bad Request. Validation phát hiện thiếu trường", "PASS"),
        ("TC_AUTH_10", "Xác thực phiên làm việc qua API /me", "Đính kèm header Authorization: Bearer <token>", "HTTP 200 OK. Giải mã Token, trả về chính xác User ID, Email, Role", "HTTP 200 OK. Token toàn vẹn, xác nhận danh tính thành công", "PASS")
    ]
    build_test_table(login_cases, "B. Phân hệ 2: Đăng nhập & Xác thực phiên làm việc (Login & Session Authentication)")

    # 3. QUÊN MẬT KHẨU
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
    build_test_table(reset_cases, "C. Phân hệ 3: Quên và Đặt lại mật khẩu (Password Recovery & Reset Flow)")

    # SECTION 3: PHÂN TÍCH AN TOÀN BẢO MẬT
    h3 = doc.add_heading(level=1)
    h3_run = h3.add_run("3. PHÂN TÍCH GIẢI PHÁP KỸ THUẬT VÀ BẢO MẬT HỆ THỐNG")
    h3_run.font.name = "Times New Roman"
    h3_run.font.size = Pt(13.5)
    h3_run.font.bold = True
    h3_run.font.color.rgb = RGBColor(27, 54, 93)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)

    sec_points = [
        ("Cơ chế Token dùng một lần tự hủy (Stateless Single-Use Token with Dynamic HMAC):", 
         "Thay vì phải tốn tài nguyên lưu trữ danh sách Token đen (Blacklist Token) trong Database hoặc Redis, hệ thống ứng dụng công thức tính SigningKey động: SigningKey = HMAC-SHA256(JWT_SECRET, 'password-reset:' + user.password_hash). Khi người dùng đổi mật khẩu thành công, trường password_hash trong Database lập tức đổi sang chuỗi băm mới. Token reset cũ lập tức mất hiệu lực do chữ ký HMAC không còn trùng khớp, triệt tiêu hoàn toàn lỗ hổng Replay Attack."),
        ("Mã hóa mật khẩu an toàn chuẩn quân sự (Bcrypt Salt Cost = 12):", 
         "Mật khẩu của người dùng tuyệt đối không bao giờ được lưu trữ dưới dạng thô (plaintext). Với độ phức tạp Cost Factor 12, thuật toán Bcrypt tạo ra chi phí tính toán đủ lớn để làm tê liệt các cuộc tấn công dò mật khẩu tự động bằng bảng từ điển (Rainbow Tables) hoặc sử dụng dàn máy đào GPU."),
        ("Phòng chống rò quét tài khoản (Mitigate User Enumeration Attacks):", 
         "Khi phát sinh lỗi đăng nhập, hệ thống luôn trả về thông điệp trung lập 'Email hoặc mật khẩu không chính xác.' mà không phân tách rõ email sai hay mật khẩu sai. Điều này giúp ngăn chặn kẻ tấn công lợi dụng phản hồi để lập danh sách các tài khoản đang tồn tại trong hệ thống."),
        ("Bảo vệ chống Brute-Force & DoS với Express Rate Limiters:", 
         "Các route nhạy cảm (/login, /register, /forgot-password) đều được trang bị middleware giới hạn tần suất gọi API (Rate Limiting) trên mỗi địa chỉ IP. Khi phát hiện lưu lượng truy vấn bất thường vượt ngưỡng, hệ thống tự động khóa tạm thời và trả mã HTTP 429 Too Many Requests."),
        ("Lưu trữ phiên an toàn phía Frontend (SessionStorage & Auto-Purge):", 
         "Client chỉ lưu trữ JWT Token trong sessionStorage để tự động xóa sạch phiên làm việc khi người dùng đóng trình duyệt/tab, tránh rò rỉ token qua các tab lạ hoặc tấn công XSS kéo dài so với việc lưu ở localStorage thông thường.")
    ]

    for title, desc in sec_points:
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.25
        p.paragraph_format.space_after = Pt(6)
        r_title = p.add_run(f"• {title} ")
        r_title.font.bold = True
        r_title.font.color.rgb = RGBColor(27, 54, 93)
        p.add_run(desc)

    # SECTION 4: KẾT LUẬN & ĐÁNH GIÁ ĐỒ ÁN
    h4 = doc.add_heading(level=1)
    h4_run = h4.add_run("4. KẾT LUẬN VÀ ĐÁNH GIÁ TỔNG THỂ")
    h4_run.font.name = "Times New Roman"
    h4_run.font.size = Pt(13.5)
    h4_run.font.bold = True
    h4_run.font.color.rgb = RGBColor(27, 54, 93)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)

    # Summary Badge / Box
    sum_table = doc.add_table(rows=1, cols=1)
    sum_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = sum_table.rows[0].cells[0]
    c.width = Inches(6.8)
    set_cell_background(c, "EBF8EE") # Light Green Luxury Box
    set_cell_margins(c, 100, 100, 150, 150)
    
    ps = c.paragraphs[0]
    ps.paragraph_format.line_spacing = 1.25
    r_sum_title = ps.add_run("TỔNG KẾT THỰC NGHIỆM KIỂM THỬ: 18 / 18 TEST CASES ĐẠT (PASS 100%)\n")
    r_sum_title.font.bold = True
    r_sum_title.font.size = Pt(11.5)
    r_sum_title.font.color.rgb = RGBColor(30, 126, 52)

    ps.add_run(
        "Toàn bộ 18 kịch bản kiểm thử trên cả 3 phân hệ cốt lõi (Đăng ký tài khoản, Đăng nhập hệ thống, Quên & Đặt lại mật khẩu) "
        "đã được thực thi tự động và độc lập trên môi trường cơ sở dữ liệu Microsoft SQL Server thật. "
        "Không có bất kỳ trường hợp nào xảy ra lỗi crash máy chủ, lỗi xung đột dữ liệu hay vi phạm toàn vẹn bảo mật. "
        "Hệ thống đạt tiêu chuẩn chất lượng cao nhất, hoàn toàn đủ điều kiện nghiệm thu và trình bày trong báo cáo đồ án tốt nghiệp."
    )

    out_path = os.path.abspath("c:/Users/ASUS/Documents/Demo/DATN/Bao_Cao_Kiem_Thu_He_Thong_Xac_Thuc_AURALIE.docx")
    doc.save(out_path)
    print(f"SUCCESS: Saved Word report to: {out_path}")

if __name__ == "__main__":
    create_document()
