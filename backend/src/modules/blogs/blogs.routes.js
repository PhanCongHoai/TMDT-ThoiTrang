const express = require('express');
const router = express.Router();
const { query } = require('../../config/db');
const ApiResponse = require('../../utils/response');

router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    let sqlQuery = `SELECT * FROM blogs`;
    const params = {};
    if (category && category !== 'all') {
      sqlQuery += ` WHERE category = @category`;
      params.category = category;
    }
    sqlQuery += ` ORDER BY id ASC`;

    const result = await query(sqlQuery, params);
    return ApiResponse.success(res, result.recordset, 'Lấy danh sách bài viết thành công', 200, {
      total: result.recordset.length
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

