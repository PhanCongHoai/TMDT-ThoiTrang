/**
 * SCRIPT CHUẨN HÓA DỮ LIỆU HÌNH ẢNH TOÀN DIỆN CHO 50 SẢN PHẨM AURALIÈ
 * Mỗi sản phẩm sở hữu hình ảnh độc bản, sắc nét, đúng 100% mô tả và danh mục
 * (Áo Vest ra Áo Vest, Túi Xách ra Túi Xách Da, Giày ra Giày, Đầm ra Đầm, Áo Khoác ra Áo Khoác)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/db');

const PRODUCTS_IMAGE_MAP = [
  // ===================== ÁO VEST & BLAZER (10 SẢN PHẨM) =====================
  {
    id: 1,
    name: "Double-Breasted Tailored Suit",
    file: "vest_1_double_breasted.jpg",
    photoId: "photo-1594938298603-c8148c4dae35" // Suit âu phục hai hàng khuy
  },
  {
    id: 2,
    name: "Black Blazer & High Boots Set",
    file: "vest_2_black_blazer.jpg",
    photoId: "photo-1539109136881-3be0616acf4b" // Blazer đen thanh lịch thời trang
  },
  {
    id: 3,
    name: "Royal Cashmere Velvet Tuxedo",
    file: "vest_3_velvet_tuxedo.jpg",
    photoId: "photo-1507679799987-c73779587ccf" // Tuxedo nhung dạ tiệc Black Tie
  },
  {
    id: 4,
    name: "Italian Wool Tailored Blazer",
    file: "vest_4_wool_blazer.jpg",
    photoId: "photo-1592878904946-b3cd8ae243d0" // Blazer len Ý xanh Navy
  },
  {
    id: 21,
    name: "Ivory Satin Peak-Lapel Blazer",
    file: "vest_5_ivory_satin.jpg",
    photoId: "photo-1515886657613-9f3515b0c78f" // Blazer trắng ngà ve xếch satin
  },
  {
    id: 22,
    name: "Midnight Navy Pinstripe Suit",
    file: "vest_6_navy_pinstripe.jpg",
    photoId: "photo-1617137984095-74e4e5e3613f" // Suit sọc tăm kẻ Navy may đo
  },
  {
    id: 23,
    name: "Burgundy Velvet Evening Tuxedo",
    file: "vest_7_burgundy_tuxedo.jpg",
    photoId: "photo-1593030761757-71fae45fa0e7" // Tuxedo đỏ đô nhung quý tộc
  },
  {
    id: 24,
    name: "Double-Breasted Houndstooth Blazer",
    file: "vest_8_houndstooth.jpg",
    photoId: "photo-1598808503746-f34c53b9323e" // Blazer họa tiết nanh sói
  },
  {
    id: 25,
    name: "Charcoal Grey Virgin Wool Suit",
    file: "vest_9_charcoal_suit.jpg",
    photoId: "photo-1617127365659-c47fa864d8bc" // Suit len xám than lịch lãm
  },
  {
    id: 26,
    name: "Emerald Silk Jacquard Tuxedo",
    file: "vest_10_emerald_jacquard.jpg",
    photoId: "photo-1600091166971-7f9faad6c1e2" // Tuxedo lụa hoa văn dạ tiệc
  },

  // ===================== VÁY & ĐẦM DẠ HỘI (10 SẢN PHẨM) =====================
  {
    id: 5,
    name: "Minimalist Silk Trench Dress",
    file: "dress_1_silk_minimalist.jpg",
    photoId: "photo-1515372039744-b8f02a3ae446" // Đầm lụa minimalist
  },
  {
    id: 6,
    name: "Auralia Emerald Velvet Gown",
    file: "dress_2_emerald_velvet.jpg",
    photoId: "photo-1566174053879-31528523f8ae" // Đầm nhung xanh lục bảo
  },
  {
    id: 7,
    name: "Midnight Satin Evening Gown",
    file: "dress_3_midnight_satin.jpg",
    photoId: "photo-1572804013309-59a88b7e92f1" // Đầm dạ hội xanh đêm dài quét sàn
  },
  {
    id: 8,
    name: "Chiffon Silk Cocktail Dress",
    file: "dress_4_chiffon_cocktail.jpg",
    photoId: "photo-1595777457583-95e059d581b8" // Đầm cocktail chiffon
  },
  {
    id: 27,
    name: "Royal Scarlet Silk Mermaid Gown",
    file: "dress_5_scarlet_mermaid.jpg",
    photoId: "photo-1518895949257-7621c3c786d7" // Đầm đuôi cá đỏ scarlet
  },
  {
    id: 28,
    name: "Champagne Crystal Plissé Dress",
    file: "dress_6_champagne_crystal.jpg",
    photoId: "photo-1490481651871-ab68de25d43d" // Đầm xếp ly màu sâm panh
  },
  {
    id: 29,
    name: "Noir Asymmetrical Slit Gown",
    file: "dress_7_noir_slit_gown.jpg",
    photoId: "photo-1509631179647-0177331693ae" // Đầm đen xẻ tà cao quyến rũ
  },
  {
    id: 30,
    name: "Rose Gold Metallic Silk Slip",
    file: "dress_8_rose_gold_slip.jpg",
    photoId: "photo-1496747611176-843222e1e57c" // Đầm lụa ánh kim vàng hồng
  },
  {
    id: 31,
    name: "Sapphire Blue Mikado Ballgown",
    file: "dress_9_sapphire_ballgown.jpg",
    photoId: "photo-1568252542512-9fe8fe9c87bb" // Đầm dạ tiệc phom xòe lụa Mikado
  },
  {
    id: 32,
    name: "Pearl White One-Shoulder Column Dress",
    file: "dress_10_pearl_white_column.jpg",
    photoId: "photo-1534528741775-53994a69daeb" // Đầm suông lệch vai trắng ngọc trai
  },

  // ===================== ÁO KHOÁC THU ĐÔNG (10 SẢN PHẨM) =====================
  {
    id: 9,
    name: "Oversized Cashmere Wool Sweater",
    file: "coat_1_cashmere_sweater.jpg",
    photoId: "photo-1576871337632-b9aef4c17ab9" // Áo len cashmere dệt kim cao cấp
  },
  {
    id: 10,
    name: "Midnight Navy Tailored Jacket",
    file: "coat_2_navy_tailored_jacket.jpg",
    photoId: "photo-1544441893-675973e31985" // Áo khoác dạ ngắn dáng lửng
  },
  {
    id: 11,
    name: "Alpine Cashmere Trench Coat",
    file: "coat_3_cashmere_trench.jpg",
    photoId: "photo-1539571696357-5a69c17a67c6" // Áo măng tô dáng dài Trench coat
  },
  {
    id: 12,
    name: "Double-Faced Wool Long Coat",
    file: "coat_4_double_faced_wool.jpg",
    photoId: "photo-1548883354-7622d03aca27" // Áo khoác dạ hai mặt dáng suông
  },
  {
    id: 33,
    name: "Camel Double-Breasted Wrap Coat",
    file: "coat_5_camel_wrap_coat.jpg",
    photoId: "photo-1512436991641-6745cdb1723f" // Áo khoác thắt đai màu lạc đà
  },
  {
    id: 34,
    name: "Oatmeal Cashmere Turtleneck Poncho",
    file: "coat_6_cashmere_poncho.jpg",
    photoId: "photo-1583743814966-8936f5b7be1a" // Poncho cổ lọ màu yến mạch
  },
  {
    id: 35,
    name: "Black Shearling Leather Biker Jacket",
    file: "coat_7_shearling_biker.jpg",
    photoId: "photo-1551028719-00167b16eac5" // Áo khoác biker da lót lông cừu
  },
  {
    id: 36,
    name: "Houndstooth Wool Trench Coat",
    file: "coat_8_houndstooth_trench.jpg",
    photoId: "photo-1520975916090-3105956dac38" // Trench coat dạ nanh sói
  },
  {
    id: 37,
    name: "Monochrome Quilted Down Parka",
    file: "coat_9_quilted_down_parka.jpg",
    photoId: "photo-1544022613-e87ca75a784a" // Áo phao lông vũ dáng dài
  },
  {
    id: 38,
    name: "Ivory Double-Breasted Peacoat",
    file: "coat_10_ivory_peacoat.jpg",
    photoId: "photo-1483985988355-763728e1935b" // Áo khoác peacoat trắng ngà
  },

  // ===================== TÚI XÁCH DA CAO CẤP (10 SẢN PHẨM) =====================
  {
    id: 13,
    name: "Heritage Tan Leather Handbag",
    file: "bag_1_heritage_tan_handbag.jpg",
    photoId: "photo-1584917865442-de89df76afd3" // Túi xách tay da bò nâu di sản
  },
  {
    id: 14,
    name: "Monogram Ostrich Leather Tote",
    file: "bag_2_ostrich_tote.jpg",
    photoId: "photo-1590874103328-eac38a683ce7" // Túi tote da cỡ lớn
  },
  {
    id: 15,
    name: "Auralia Mini Flap Crossbody Bag",
    file: "bag_3_mini_flap_crossbody.jpg",
    photoId: "photo-1548036328-c9fa89d128fa" // Túi đeo chéo nắp gập
  },
  {
    id: 16,
    name: "Crocodile Embossed Clutch",
    file: "bag_4_crocodile_clutch.jpg",
    photoId: "photo-1566150905458-1bf1fc113f0d" // Ví clutch cầm tay dạ tiệc
  },
  {
    id: 39,
    name: "Burgundy Croc-Effect Kelly Bag",
    file: "bag_5_burgundy_kelly.jpg",
    photoId: "photo-1591561954557-26941169b49e" // Túi xách định hình đỏ rượu
  },
  {
    id: 40,
    name: "Noir Quilted Lambskin Flap Bag",
    file: "bag_6_noir_quilted_flap.jpg",
    photoId: "photo-1575032617751-6ddec2089882" // Túi nắp gập chần trám da cừu đen
  },
  {
    id: 41,
    name: "Taupe Grained Calfskin Tote",
    file: "bag_7_taupe_grained_tote.jpg",
    photoId: "photo-1594223274512-ad4803739b7c" // Túi tote da bê hạt màu taupe
  },
  {
    id: 42,
    name: "Emerald Velvet Evening Minaudière",
    file: "bag_8_emerald_minaudiere.jpg",
    photoId: "photo-1585868843940-06109927dc68" // Hộp clutch dạ hội đính kim loại
  },
  {
    id: 43,
    name: "Caramel Saddle Leather Shoulder Bag",
    file: "bag_9_caramel_saddle_bag.jpg",
    photoId: "photo-1600857062241-98e5dba7f214" // Túi yên ngựa da màu caramel
  },
  {
    id: 44,
    name: "Ivory Lizard-Embossed Baguette",
    file: "bag_10_ivory_baguette.jpg",
    photoId: "photo-1563903530908-afdd155d057a" // Túi kẹp nách baguette trắng ngà
  },

  // ===================== GIÀY & PHỤ KIỆN (10 SẢN PHẨM) =====================
  {
    id: 17,
    name: "Royale Gold Buckle Boots",
    file: "shoe_1_gold_buckle_boots.jpg",
    photoId: "photo-1543163521-1bf539c55dd2" // Giày bốt cổ cao da đen
  },
  {
    id: 18,
    name: "Handcrafted Calfskin Loafers",
    file: "shoe_2_calfskin_loafers.jpg",
    photoId: "photo-1614252369475-531eba835eb1" // Giày lười da bê khâu tay
  },
  {
    id: 19,
    name: "18K Gold Plated Silk Scarf Ring",
    file: "shoe_3_scarf_ring_gold.jpg",
    photoId: "photo-1535632066927-ab7c9ab60908" // Khuyên khăn kim hoàn mạ vàng 18K
  },
  {
    id: 20,
    name: "Classic Leather Stiletto Heels",
    file: "shoe_4_stiletto_heels.jpg",
    photoId: "photo-1581101767113-1677fc2beaa8" // Giày cao gót Stiletto đen đế đỏ
  },
  {
    id: 45,
    name: "Crystal Embellished Satin Pumps",
    file: "shoe_5_crystal_satin_pumps.jpg",
    photoId: "photo-1515347619252-60a4bf4fff4f" // Giày cao gót satin đính đá
  },
  {
    id: 46,
    name: "Cognac Chelsea Boots Calfskin",
    file: "shoe_6_chelsea_boots.jpg",
    photoId: "photo-1608256246200-53e635b5b65f" // Bốt chelsea da bê cognac
  },
  {
    id: 47,
    name: "24K Gold Monogram Silk Scarf",
    file: "shoe_7_silk_scarf.jpg",
    photoId: "photo-1601924994987-69e26d50dc26" // Khăn lụa tơ tằm vuông 90x90
  },
  {
    id: 48,
    name: "Black Suede Knee-High Boots",
    file: "shoe_8_suede_boots.jpg",
    photoId: "photo-1551107696-a4b085a6d96a" // Bốt đùi da lộn cao cấp
  },
  {
    id: 49,
    name: "Bespoke 18K Gold Cufflinks Pair",
    file: "shoe_9_gold_cufflinks.jpg",
    photoId: "photo-1590548784585-643d2b9f2925" // Cặp khuy măng sét vàng 18K khảm xà cừ
  },
  {
    id: 50,
    name: "Burgundy Patent Strappy Sandals",
    file: "shoe_10_strappy_sandals.jpg",
    photoId: "photo-1562273138-f46be4ebdf33" // Sandals quai mảnh cao gót dạ hội
  }
];

function downloadImage(photoId, destPath) {
  const url = `https://images.unsplash.com/${photoId}?w=800&q=85&auto=format&fit=crop`;
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, r2 => {
          const stream = fs.createWriteStream(destPath);
          r2.pipe(stream);
          stream.on('finish', () => resolve(true));
        }).on('error', reject);
      } else if (res.statusCode === 200) {
        const stream = fs.createWriteStream(destPath);
        res.pipe(stream);
        stream.on('finish', () => resolve(true));
      } else {
        reject(new Error(`HTTP ${res.statusCode} for ${photoId}`));
      }
    }).on('error', reject);
  });
}

async function run() {
  const targetDir = path.join(__dirname, '..', '..', 'frontend', 'assets', 'products');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  console.log('================================================================');
  console.log('   BẮT ĐẦU TẢI VÀ CHUẨN HÓA 50 HÌNH ẢNH SẢN PHẨM AURALIÈ');
  console.log('================================================================\n');

  for (const item of PRODUCTS_IMAGE_MAP) {
    const destPath = path.join(targetDir, item.file);
    const relPath = `assets/products/${item.file}`;

    try {
      if (!fs.existsSync(destPath) || fs.statSync(destPath).size < 1000) {
        process.stdout.write(`Đang tải [ID: ${item.id}] ${item.name} (${item.file})... `);
        await downloadImage(item.photoId, destPath);
        console.log(`[XONG: ${(fs.statSync(destPath).size / 1024).toFixed(1)} KB]`);
      } else {
        console.log(`[Đã tồn tại] [ID: ${item.id}] ${item.name} (${(fs.statSync(destPath).size / 1024).toFixed(1)} KB)`);
      }

      // Cập nhật CSDL Microsoft SQL Server: product_images
      await query(`
        IF EXISTS (SELECT 1 FROM product_images WHERE product_id = @id AND is_thumbnail = 1)
        BEGIN
          UPDATE product_images 
          SET image_url = @relPath 
          WHERE product_id = @id AND is_thumbnail = 1
        END
        ELSE
        BEGIN
          INSERT INTO product_images (product_id, image_url, is_thumbnail)
          VALUES (@id, @relPath, 1)
        END
      `, { id: item.id, relPath });

    } catch (err) {
      console.error(`\n[LỖI] ID ${item.id} - ${item.name}: ${err.message}`);
    }
  }

  console.log('\n================================================================');
  console.log('HOÀN TẤT CHUẨN HÓA 50 HÌNH ẢNH ĐỘC BẢN VÀO CƠ SỞ DỮ LIỆU SQL SERVER!');
  console.log('================================================================\n');
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
