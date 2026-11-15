const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

function parseImage(imageData) {
  if (!imageData) return null;
  const invalid = message => Object.assign(new Error(message), { statusCode: 400 });
  if (typeof imageData !== 'string') throw invalid('Ảnh sản phẩm không hợp lệ.');
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(imageData);
  if (!match) throw invalid('Chỉ chấp nhận ảnh PNG, JPEG hoặc WebP.');
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw invalid('Ảnh phải có dung lượng không quá 2 MB.');
  const valid = match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : match[1] === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!valid) throw invalid('Nội dung ảnh không đúng định dạng đã chọn.');
  return { bytes, extension: match[1] === 'jpeg' ? 'jpg' : match[1] };
}
async function save(image) {
  const directory = path.resolve(__dirname, '../../../uploads/products');
  await fs.mkdir(directory, { recursive: true });
  const name = `${randomUUID()}.${image.extension}`;
  const file = path.join(directory, name);
  await fs.writeFile(file, image.bytes, { flag: 'wx' });
  return { file, url: `/uploads/products/${name}` };
}
async function remove(image) { if (image) await fs.unlink(image.file).catch(() => {}); }
module.exports = { parseImage, save, remove };
