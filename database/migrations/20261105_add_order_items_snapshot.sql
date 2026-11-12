-- ====================================================================
-- MIGRATION: BỔ SUNG SNAPSHOT LỊCH SỬ VÀO BẢNG order_items
-- Dự án: AURALIÈ Haute Couture
-- Mục đích: Lưu trữ bất biến (Immutable Snapshot) tên sản phẩm, SKU,
--           size và color tại thời điểm mua hàng, bảo đảm độc lập
--           khi sản phẩm gốc trong bảng products/product_variants bị sửa đổi.
-- Tính an toàn: Non-destructive, sử dụng ALTER TABLE ADD COLUMN NULL,
--               không làm mất dữ liệu hiện có.
-- ====================================================================

USE AURALIE_FashionDB;
GO

-- 1. Bổ sung các cột snapshot nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_items') AND name = 'product_name')
BEGIN
    ALTER TABLE order_items ADD product_name NVARCHAR(200) NULL;
    PRINT '[Migration] Đã thêm cột product_name vào order_items';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_items') AND name = 'sku')
BEGIN
    ALTER TABLE order_items ADD sku NVARCHAR(50) NULL;
    PRINT '[Migration] Đã thêm cột sku vào order_items';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_items') AND name = 'size')
BEGIN
    ALTER TABLE order_items ADD size NVARCHAR(20) NULL;
    PRINT '[Migration] Đã thêm cột size vào order_items';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_items') AND name = 'color')
BEGIN
    ALTER TABLE order_items ADD color NVARCHAR(100) NULL;
    PRINT '[Migration] Đã thêm cột color vào order_items';
END
GO

-- 2. Backfill dữ liệu lịch sử cho các đơn hàng cũ
UPDATE oi
SET oi.product_name = ISNULL(p.name, N'Sản Phẩm Haute Couture'),
    oi.sku = pv.sku,
    oi.size = ISNULL(pv.size, N'Tiêu chuẩn'),
    oi.color = ISNULL(pv.color, N'Mặc định')
FROM order_items oi
LEFT JOIN product_variants pv ON oi.variant_id = pv.id
LEFT JOIN products p ON pv.product_id = p.id
WHERE oi.product_name IS NULL;
GO

PRINT '[Migration] Đã hoàn tất backfill snapshot cho bảng order_items thành công!';
GO

