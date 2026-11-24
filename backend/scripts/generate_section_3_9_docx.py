import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}>'
                      f'<w:top w:w="{top}" w:type="dxa"/>'
                      f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
                      f'<w:left w:w="{left}" w:type="dxa"/>'
                      f'<w:right w:w="{right}" w:type="dxa"/>'
                      f'</w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="B0C4DE"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'<w:tblBorders {nsdecls("w")}>'
                        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
                        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
                        f'<w:left w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
                        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
                        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
                        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
                        f'</w:tblBorders>')
    tblPr.append(borders)

doc = Document()
for sec in doc.sections:
    sec.top_margin = Inches(0.8)
    sec.bottom_margin = Inches(0.8)
    sec.left_margin = Inches(0.8)
    sec.right_margin = Inches(0.8)

# Header
p_h = doc.add_paragraph()
r_h = p_h.add_run('3.9. Thiết kế chi tiết các bảng dữ liệu')
r_h.font.name = 'Times New Roman'
r_h.font.size = Pt(14)
r_h.font.bold = True
r_h.font.color.rgb = RGBColor(27, 54, 93)

p_intro = doc.add_paragraph()
r_intro = p_intro.add_run('Để thuận tiện cho việc quản trị, bảo trì và đối chiếu với mã nguồn thực tế, toàn bộ 32 bảng dữ liệu trong cơ sở dữ liệu AURALIE_FashionDB được phân loại thành 7 nhóm nghiệp vụ logic như tổng hợp trong Bảng 3.4:')
r_intro.font.name = 'Times New Roman'
r_intro.font.size = Pt(12)
p_intro.paragraph_format.line_spacing = 1.25

p_tb_title = doc.add_paragraph()
r_tb_title = p_tb_title.add_run('Bảng 3.4. Danh mục 32 bảng dữ liệu thực tế trong CSDL AURALIE_FashionDB theo 7 nhóm nghiệp vụ')
r_tb_title.font.name = 'Times New Roman'
r_tb_title.font.size = Pt(11)
r_tb_title.font.bold = True
r_tb_title.font.italic = True
p_tb_title.paragraph_format.space_before = Pt(6)
p_tb_title.paragraph_format.space_after = Pt(4)

headers = ['STT', 'Nhóm nghiệp vụ', 'Số bảng', 'Danh sách tên bảng thực tế trong SQL Server', 'Vai trò lưu trữ cốt lõi']
widths = [Inches(0.5), Inches(1.5), Inches(0.7), Inches(2.2), Inches(2.1)]

data = [
    ('1', 'Người dùng, Phân quyền & Phiên truy cập', '4', 'users, roles, user_sessions, user_search_history', 'Quản lý tài khoản, mật khẩu băm (bcrypt), vai trò (ADMIN/CUSTOMER), phiên đăng nhập và lịch sử từ khóa tìm kiếm của người dùng.'),
    ('2', 'Danh mục, Sản phẩm & Biến thể SKU', '5', 'categories, products, product_images, product_variants, wishlists', 'Quản lý phân loại danh mục, mẫu thiết kế, thư viện ảnh độc bản, số lượng tồn kho theo từng biến thể SKU (màu sắc/kích cỡ) và danh sách sản phẩm yêu thích.'),
    ('3', 'Đơn hàng, Khuyến mãi & Giỏ hàng bỏ quên', '5', 'orders, order_items, coupons, payment_transactions, abandoned_carts', 'Lưu trữ đơn hàng tổng, bản sao biến thể từng dòng sản phẩm, mã giảm giá, giao dịch đối soát ngân hàng SePay VietQR và dữ liệu giỏ hàng bị bỏ quên phục vụ chăm sóc khách hàng.'),
    ('4', 'Quản lý Nhập kho & Tồn kho', '2', 'inventory_imports, ProductInventorySnapshots', 'Quản lý phiếu nhập hàng theo lô, lưu lại ảnh chụp số lượng tồn kho (snapshots) theo từng thời điểm để phục vụ đối soát và phân tích biến động kho hàng.'),
    ('5', 'Nội dung, Tương tác & Đánh giá', '4', 'blogs, contact_inquiries, newsletter_subscribers, product_reviews', 'Quản lý bài viết tạp chí thời trang, biểu mẫu liên hệ của khách hàng, danh sách đăng ký nhận tin ưu đãi và các đánh giá/bình luận sản phẩm đã được kiểm duyệt.'),
    ('6', 'Thu thập Hành vi & Tracking sự kiện', '4', 'tracking_consents, user_events, product_interactions, user_behavior_daily', 'Quản lý quyền đồng ý theo dõi (Consent), thu thập chuỗi sự kiện người dùng (page_view, product_view, add_to_cart), bảng tương tác sản phẩm và tổng hợp hành vi theo ngày.'),
    ('7', 'AI Khuyến nghị, Chatbot & Dự báo nhu cầu', '8', 'ai_image_embeddings, ai_chat_sessions, ai_chat_messages, ProductDailyMetrics, ProductForecasts, MLModelVersions, MLTrainingLogs, MLMonitoringAlerts', 'Lưu trữ vector đặc trưng ảnh phục vụ Visual Search, lịch sử hội thoại trợ lý ảo AI Stylist, chuỗi chỉ số theo ngày, kết quả dự báo nhu cầu 7/14/30 ngày, sổ đăng ký phiên bản mô hình (LightGBM/XGBoost), nhật ký huấn luyện và cảnh báo tồn kho.')
]

table = doc.add_table(rows=len(data) + 1, cols=5)
table.alignment = WD_TABLE_ALIGNMENT.CENTER
set_table_borders(table)

# Header row
for i, h in enumerate(headers):
    cell = table.cell(0, i)
    cell.width = widths[i]
    set_cell_background(cell, '1B365D')
    set_cell_margins(cell, 120, 120, 100, 100)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(h)
    run.font.name = 'Times New Roman'
    run.font.bold = True
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(255, 255, 255)

for r_idx, row_data in enumerate(data):
    row = table.rows[r_idx + 1]
    bg = 'F9FBFC' if r_idx % 2 == 1 else 'FFFFFF'
    for c_idx, val in enumerate(row_data):
        cell = row.cells[c_idx]
        cell.width = widths[c_idx]
        set_cell_background(cell, bg)
        set_cell_margins(cell, 100, 100, 100, 100)
        p = cell.paragraphs[0]
        if c_idx in (0, 2):
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(val)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(9.5)
        if c_idx == 1:
            run.font.bold = True
            run.font.color.rgb = RGBColor(27, 54, 93)
        elif c_idx == 3:
            run.font.color.rgb = RGBColor(138, 109, 59)

# Additional analysis paragraphs
p_space = doc.add_paragraph()
p_space.paragraph_format.space_before = Pt(12)

p_head2 = doc.add_paragraph()
r_head2 = p_head2.add_run('Trong cấu trúc 32 bảng dữ liệu nêu trên, hệ thống tuân thủ nghiêm ngặt chuẩn hóa dữ liệu mức 3NF, đồng thời áp dụng kỹ thuật phi chuẩn hóa có kiểm soát tại các điểm tiếp giáp giao dịch nhằm tối ưu hiệu năng và bảo đảm tính toàn vẹn:')
r_head2.font.name = 'Times New Roman'
r_head2.font.size = Pt(12)
r_head2.font.italic = True
p_head2.paragraph_format.line_spacing = 1.25

points = [
    ('Mô hình Sản phẩm - Biến thể SKU (products & product_variants): ', 'Tách biệt hoàn toàn thông tin chung của thiết kế thời trang (tên, slug, mô tả, phom dáng, lót, phụ kiện) với các đơn vị lưu kho cụ thể theo màu sắc và kích cỡ. Mọi thao tác đặt mua hoặc nhập hàng đều tác động trực tiếp vào cột stock_quantity của bảng product_variants với ràng buộc CHECK (stock_quantity >= 0) để chống âm kho tuyệt đối.'),
    ('Bảo toàn lịch sử đơn hàng (orders & order_items): ', 'Mỗi dòng sản phẩm trong bảng order_items lưu trữ bản sao dữ liệu (snapshot) gồm: tên sản phẩm, mã SKU, màu sắc, kích cỡ và đơn giá tại chính xác thời điểm khách bấm mua. Thiết kế này giúp lịch sử mua sắm và báo cáo tài chính của cửa hàng không bao giờ bị biến dạng khi Admin chỉnh sửa giá hoặc cập nhật sản phẩm trong tương lai.'),
    ('Tính lũy đẳng đối soát thanh toán (payment_transactions): ', 'Cột mã tham chiếu giao dịch ngân hàng (transaction_code từ SePay VietQR) được gắn chỉ mục duy nhất UNIQUE. Khi cổng thanh toán gửi webhook lặp lại do độ trễ mạng, hệ thống tự động phát hiện mã đã tồn tại và bỏ qua, loại bỏ hoàn toàn nguy cơ cộng trùng tiền đơn hàng.'),
    ('Hạ tầng dữ liệu cho AI & Machine Learning: ', 'Các bảng ai_image_embeddings và user_events cung cấp vector đặc trưng và hành vi để hệ thống thực hiện tìm kiếm bằng hình ảnh và gợi ý sản phẩm cá nhân hóa. Đồng thời, dữ liệu bán hàng thực tế được làm mịn vào ProductDailyMetrics để huấn luyện các thuật toán LightGBM và XGBoost (quản lý qua MLModelVersions), sinh ra số liệu dự báo tương lai tại bảng ProductForecasts.')
]

for title, desc in points:
    p_pt = doc.add_paragraph(style='List Bullet')
    r_t = p_pt.add_run(title)
    r_t.font.name = 'Times New Roman'
    r_t.font.bold = True
    r_t.font.size = Pt(11)
    r_t.font.color.rgb = RGBColor(27, 54, 93)
    
    r_d = p_pt.add_run(desc)
    r_d.font.name = 'Times New Roman'
    r_d.font.size = Pt(11)
    p_pt.paragraph_format.line_spacing = 1.25

out_file = 'c:/Users/ASUS/Documents/Demo/DATN/Muc_3.9_Thiet_Ke_CSDL_AURALIE.docx'
doc.save(out_file)
print('SUCCESS: Created file at ' + out_file)
