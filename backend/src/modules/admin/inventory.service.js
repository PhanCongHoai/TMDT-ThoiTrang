const { sql, poolPromise, query } = require('../../config/db');
const { randomUUID } = require('node:crypto');
const error = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const integer = (value, min, max) => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;

function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw error('Dữ liệu điều chỉnh tồn kho không hợp lệ.');
  if (!integer(input.productId, 1, 2147483647)) throw error('Vui lòng chọn sản phẩm hợp lệ.');
  if (!['IMPORT','EXPORT'].includes(input.operation)) throw error('Vui lòng chọn Nhập kho hoặc Xuất kho.');
  if (!integer(input.quantity, 1, 2147483647)) throw error('Số lượng phải là số nguyên lớn hơn 0.');
  if (!integer(input.expectedStock, -2147483648, 2147483647)) throw error('Vui lòng tải lại tồn kho hiện tại trước khi điều chỉnh.');
  if (typeof input.size !== 'string' || !input.size.trim() || input.size.trim().length > 20) throw error('Kích thước là bắt buộc, tối đa 20 ký tự.');
  if (typeof input.color !== 'string' || !input.color.trim() || input.color.trim().length > 100) throw error('Màu sắc là bắt buộc, tối đa 100 ký tự.');
  if (input.reason !== undefined && (typeof input.reason !== 'string' || input.reason.length > 500)) throw error('Ghi chú tối đa 500 ký tự.');
  if (typeof input.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)) throw error('Mã yêu cầu không hợp lệ. Vui lòng mở lại bảng điều chỉnh.');
  return { productId:Number(input.productId), quantity:Number(input.quantity), expectedStock:Number(input.expectedStock), operation:input.operation, size:input.size.trim().normalize('NFC'), color:input.color.trim().normalize('NFC'), reason:(input.reason || '').trim(), requestId:input.requestId.toLowerCase() };
}

async function getVariants(productId) {
  if (!integer(productId, 1, 2147483647)) throw error('Mã sản phẩm không hợp lệ.');
  const product = await query('SELECT id, name FROM products WHERE id=@productId AND is_active=1', {productId:Number(productId)});
  if (!product.recordset.length) throw error('Sản phẩm không tồn tại hoặc đã ngừng bán.', 404);
  const variants = await query('SELECT id, size, color, COALESCE(stock_quantity,0) AS stock_quantity, sku FROM product_variants WHERE product_id=@productId ORDER BY size, color, id', {productId:Number(productId)});
  return { product:product.recordset[0], variants:variants.recordset };
}

async function adjust(input, actor) {
  if (!actor || actor.role !== 'ADMIN' || !integer(actor.id,1,2147483647)) throw error('Chỉ quản trị viên được điều chỉnh tồn kho.', 403);
  const data=validate(input);
  const batchCode=`STK-${data.requestId}`;
  const fingerprint=JSON.stringify([data.productId,data.size.toLowerCase(),data.color.toLowerCase(),data.operation,data.quantity,data.reason]);
  const transaction=new sql.Transaction(await poolPromise);
  await transaction.begin();
  try {
    const productResult=await new sql.Request(transaction).input('productId',sql.Int,data.productId)
      .query('SELECT id, name, base_price FROM products WITH (UPDLOCK, HOLDLOCK) WHERE id=@productId AND is_active=1');
    const product=productResult.recordset[0];
    if (!product) throw error('Sản phẩm không tồn tại hoặc đã ngừng bán.',404);
    const old=await new sql.Request(transaction).input('batchCode',sql.NVarChar(50),batchCode)
      .query('SELECT notes FROM inventory_imports WITH (UPDLOCK, HOLDLOCK) WHERE batch_code=@batchCode');
    if (old.recordset.length) {
      let record;
      try {record=JSON.parse(old.recordset[0].notes);} catch {throw error('Mã yêu cầu đã được sử dụng.',409);}
      if (record.fingerprint !== fingerprint || !record.result) throw error('Mã yêu cầu đã được sử dụng cho điều chỉnh khác.',409);
      await transaction.commit();
      return {...record.result, repeated:true};
    }
    const variantResult=await new sql.Request(transaction).input('productId',sql.Int,data.productId).input('size',sql.NVarChar(20),data.size).input('color',sql.NVarChar(100),data.color)
      .query('SELECT id, size, color, COALESCE(stock_quantity,0) AS stock_quantity FROM product_variants WITH (UPDLOCK, HOLDLOCK) WHERE product_id=@productId AND size=@size AND color=@color ORDER BY id');
    if (variantResult.recordset.length > 1) throw error('Biến thể này đang bị trùng dữ liệu. Vui lòng kiểm tra lại trước khi điều chỉnh.',409);
    let variant=variantResult.recordset[0];
    const before=variant ? Number(variant.stock_quantity) : 0;
    if (before !== data.expectedStock) throw error('Tồn kho vừa thay đổi. Vui lòng kiểm tra số tồn mới và xác nhận lại.',409);
    if (!variant && data.operation === 'EXPORT') throw error('Chưa có biến thể kích thước / màu sắc này để xuất kho.');
    const after=before + (data.operation === 'IMPORT' ? data.quantity : -data.quantity);
    if (after < 0) throw error(data.operation==='EXPORT' ? `Không đủ tồn kho để xuất. Hiện còn ${before} sản phẩm.` : 'Số tồn sau điều chỉnh không được âm.');
    if (after > 2147483647) throw error('Số lượng sau điều chỉnh vượt giới hạn cho phép.');
    if (!variant) {
      const created=await new sql.Request(transaction).input('productId',sql.Int,data.productId).input('size',sql.NVarChar(20),data.size).input('color',sql.NVarChar(100),data.color)
        .input('quantity',sql.Int,after).input('price',sql.Decimal(18,2),product.base_price).input('sku',sql.NVarChar(50),`INV-${randomUUID()}`)
        .query('INSERT INTO product_variants (product_id,size,color,stock_quantity,variant_price,sku) OUTPUT INSERTED.id VALUES (@productId,@size,@color,@quantity,@price,@sku)');
      variant={id:created.recordset[0].id,size:data.size,color:data.color};
    } else {
      const changed=await new sql.Request(transaction).input('variantId',sql.Int,variant.id).input('quantity',sql.Int,after).input('before',sql.Int,before)
        .query('UPDATE product_variants SET stock_quantity=@quantity WHERE id=@variantId AND COALESCE(stock_quantity,0)=@before');
      if (changed.rowsAffected[0] !== 1) throw error('Tồn kho vừa thay đổi. Vui lòng tải lại.',409);
    }
    const result={productId:data.productId,variantId:variant.id,productName:product.name,size:variant.size,color:variant.color,operation:data.operation,quantity:data.quantity,previousStock:before,stockQuantity:after,batchCode};
    await new sql.Request(transaction).input('batchCode',sql.NVarChar(50),batchCode).input('quantity',sql.Int,after-before).input('actor',sql.NVarChar(100),`Admin #${actor.id}`)
      .input('notes',sql.NVarChar(sql.MAX),JSON.stringify({fingerprint,result,reason:data.reason}))
      .query("INSERT INTO inventory_imports (batch_code,supplier_name,total_quantity,total_cost,imported_by,notes) VALUES (@batchCode,N'Điều chỉnh nội bộ',@quantity,0,@actor,@notes)");
    await transaction.commit();
    return result;
  } catch (cause) {await transaction.rollback().catch(()=>{});throw cause;}
}
module.exports={getVariants,adjust,validate};
