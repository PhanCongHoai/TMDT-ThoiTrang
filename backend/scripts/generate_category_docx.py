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

def build_category_report():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.8)
        
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("BÁO CÁO ĐỒ ÁN TỐT NGHIỆP | PHÂN HỆ QUẢN LÝ DANH MỤC")
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(128, 128, 128)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("AURALIÈ Haute Couture – Phân hệ Quản lý Danh mục (CRUD Categories)")
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

    run_main = p_title.add_run("BÁO CÁO ĐẶC TẢ & KẾT QUẢ KIỂM THỬ HỆ THỐNG\nPHÂN HỆ QUẢN LÝ DANH MỤC THỜI TRANG (CATEGORY MANAGEMENT)")
    run_main.font.name = "Times New Roman"
    run_main.font.size = Pt(16)
    run_main.font.bold = True
    run_main.font.color.rgb = RGBColor(27, 54, 93)

    p_meta = doc.add_paragraph()
    p_meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_meta.paragraph_format.space_after = Pt(16)
    run_desc = p_meta.add_run("Đồ án tốt nghiệp: Nền tảng Thương mại Điện tử Thời trang Cao cấp AURALIÈ Haute Couture\nChức năng kiểm thử: Thêm mới, Chỉnh sửa, Xóa, Ràng buộc khóa ngoại, Phân quyền Admin")
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

    # SECTION 1
    h1 = doc.add_heading(level=1)
    h1_run = h1.add_run("1. TỔNG QUAN PHÂN HỆ QUẢN LÝ DANH MỤC (CRUD CATEGORIES)")
    h1_run.font.name = "Times New Roman"
    h1_run.font.size = Pt(13.5)
    h1_run.font.bold = True
    h1_run.font.color.rgb = RGBColor(27, 54, 93)
    h1.paragraph_format.space_before = Pt(10)
    h1.paragraph_format.space_after = Pt(6)

    p1 = doc.add_paragraph()
    p1.paragraph_format.line_spacing = 1.25
    p1.paragraph_format.space_after = Pt(6)
    p1.add_run("Phân hệ Quản lý Danh mục cho phép người quản trị (Admin) chủ động mở rộng hoặc điều chỉnh các nhóm trang phục may đo của AURALIÈ. Hệ thống hỗ trợ sinh mã định danh (slug URL) tự động chuẩn SEO, kiểm tra tính duy nhất (Unique Constraint), bảo vệ phân quyền nghiêm ngặt với JWT Role Admin và kiểm soát ràng buộc toàn vẹn cơ sở dữ liệu để ngăn xóa nhầm các danh mục đang có sản phẩm kinh doanh.")

    # SECTION 2: BẢNG TEST CASES
    h2 = doc.add_heading(level=1)
    h2_run = h2.add_run("2. BẢNG ĐẶC TẢ CHI TIẾT 11 TEST CASES PHÂN HỆ QUẢN LÝ DANH MỤC")
    h2_run.font.name = "Times New Roman"
    h2_run.font.size = Pt(13.5)
    h2_run.font.bold = True
    h2_run.font.color.rgb = RGBColor(27, 54, 93)
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)

    headers = ["Mã TC", "Tên Ca Kiểm Thử", "Dữ Liệu Đầu Vào", "Kết Quả Mong Đợi", "Kết Quả Thực Tế", "Trạng Thái"]
    col_w = [Inches(1.1), Inches(1.5), Inches(1.3), Inches(1.5), Inches(1.5), Inches(0.7)]

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

    table = doc.add_table(rows=len(cat_cases) + 1, cols=6)
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

    for r_idx, c_data in enumerate(cat_cases):
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

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # SECTION 3: ĐIỂM SÁNG KỸ THUẬT
    h3 = doc.add_heading(level=1)
    h3_run = h3.add_run("3. CÁC ĐIỂM SÁNG KỸ THUẬT & TOÀN VẸN DỮ LIỆU")
    h3_run.font.name = "Times New Roman"
    h3_run.font.size = Pt(13.5)
    h3_run.font.bold = True
    h3_run.font.color.rgb = RGBColor(27, 54, 93)
    h3.paragraph_format.space_before = Pt(14)
    h3.paragraph_format.space_after = Pt(6)

    points = [
        ("Kiểm soát phân quyền Role-Based Access Control (RBAC):",
         "Các thao tác thay đổi danh mục (POST, PUT, DELETE) bắt buộc phải có JWT Token hợp lệ và quyền role === 'ADMIN'. Người dùng thông thường hoặc khách vãng lai bị chặn ngay từ lớp middleware với mã lỗi 401/403."),
        ("Bảo toàn tính toàn vẹn cơ sở dữ liệu (Referential Integrity Protection):",
         "Trước khi thực hiện lệnh DELETE, dịch vụ kiểm tra câu truy vấn SELECT COUNT(*) FROM products WHERE category_id = @id. Nếu danh mục đang chứa sản phẩm, hệ thống từ chối xóa và trả về thông báo giải thích cụ thể, ngăn ngừa lỗi mồ côi khóa ngoại (Orphaned Foreign Keys)."),
        ("Tự động chuẩn hóa Slug URL tiếng Việt (Auto-generate Slug):",
         "Hệ thống tự động loại bỏ dấu tiếng Việt, ký tự đặc biệt và thay khoảng trắng bằng dấu gạch ngang (VD: 'Thời Trang May Đo' -> 'thoi-trang-may-do'), giúp đường dẫn URL thân thiện chuẩn SEO và dùng cho bộ lọc trang chủ."),
        ("Đồng bộ dữ liệu thời gian thực sang Modal Sản Phẩm:",
         "Khi Admin tạo mới danh mục, giao diện tự động cập nhật lại thẻ dropdown <select id='add-prod-category'> mà không cần F5/tải lại trang.")
    ]

    for title, desc in points:
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.25
        p.paragraph_format.space_after = Pt(6)
        r_title = p.add_run(f"• {title} ")
        r_title.font.name = "Times New Roman"
        r_title.font.bold = True
        r_title.font.color.rgb = RGBColor(27, 54, 93)
        p.add_run(desc)

    # SECTION 4: TỔNG KẾT
    h4 = doc.add_heading(level=1)
    h4_run = h4.add_run("4. TỔNG KẾT THỰC NGHIỆM KIỂM THỬ DANH MỤC")
    h4_run.font.name = "Times New Roman"
    h4_run.font.size = Pt(13.5)
    h4_run.font.bold = True
    h4_run.font.color.rgb = RGBColor(27, 54, 93)
    h4.paragraph_format.space_before = Pt(14)
    h4.paragraph_format.space_after = Pt(6)

    sum_table = doc.add_table(rows=1, cols=1)
    sum_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = sum_table.rows[0].cells[0]
    c.width = Inches(6.8)
    set_cell_background(c, "EBF8EE")
    set_cell_margins(c, 100, 100, 150, 150)
    
    ps = c.paragraphs[0]
    ps.paragraph_format.line_spacing = 1.25
    r_sum_title = ps.add_run("TỔNG KẾT KIỂM THỬ: 11 / 11 TEST CASES ĐẠT (PASS 100%)\n")
    r_sum_title.font.name = "Times New Roman"
    r_sum_title.font.bold = True
    r_sum_title.font.size = Pt(12)
    r_sum_title.font.color.rgb = RGBColor(30, 126, 52)

    ps.add_run(
        "Toàn bộ 11 ca kiểm thử phân hệ Quản lý Danh mục (Thêm, Sửa, Xóa, Validation, RBAC và Khóa ngoại) "
        "đã hoàn thành đạt chuẩn tuyệt đối trên Microsoft SQL Server thật. "
        "Chức năng sẵn sàng phục vụ nghiệm thu đồ án tốt nghiệp."
    )

    out_path = os.path.abspath("c:/Users/ASUS/Documents/Demo/DATN/Bao_Cao_Kiem_Thu_Quan_Ly_Danh_Muc_AURALIE.docx")
    doc.save(out_path)
    print(f"SUCCESS: Saved Category Word report to: {out_path}")

if __name__ == "__main__":
    build_category_report()
