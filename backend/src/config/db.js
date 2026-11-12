const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  user: process.env.DB_USER || 'auralie_user',
  password: process.env.DB_PASSWORD || 'AuraliePassword2026@',
  server: (process.env.DB_SERVER === 'localhost' ? '127.0.0.1' : process.env.DB_SERVER) || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_NAME || 'AURALIE_FashionDB',
  options: {
    encrypt: false, // For local dev
    trustServerCertificate: true, // Self-signed certs
    enableArithAbort: true
  },
  pool: {
    max: 15,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('[Database] Kết nối thành công tới Microsoft SQL Server (AURALIE_FashionDB)');
    return pool;
  })
  .catch(err => {
    console.error('[Database] Lỗi kết nối CSDL:', err.message);
    return null;
  });

module.exports = {
  sql,
  poolPromise,
  query: async (queryString, inputs = {}) => {
    const pool = await poolPromise;
    if (!pool) throw new Error('Database connection failed');
    const request = pool.request();
    for (const [key, value] of Object.entries(inputs)) {
      request.input(key, value);
    }
    return request.query(queryString);
  }
};
