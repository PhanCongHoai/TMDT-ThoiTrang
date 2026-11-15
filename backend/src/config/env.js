require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'auralie_super_secret_jwt_key_enterprise_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB: {
    user: process.env.DB_USER || 'auralie_user',
    password: process.env.DB_PASSWORD || 'AuraliePassword2026@',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    database: process.env.DB_NAME || 'AURALIE_FashionDB'
  },
  SEPAY: {
    bankCode: process.env.SEPAY_BANK_CODE || 'MBBank',
    bankShortName: process.env.SEPAY_BANK_SHORTNAME || 'MB',
    accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '0388888888',
    accountName: process.env.SEPAY_ACCOUNT_NAME || 'AURALIE HAUTE COUTURE',
    apiKey: process.env.SEPAY_API_KEY || ''
  }
};

