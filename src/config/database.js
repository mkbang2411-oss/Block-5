require('dotenv').config();
const { Sequelize } = require('sequelize');

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('Thiếu DATABASE_URL trong file .env (xem .env.example)');
}

const isPostgres = /^postgres(ql)?:/.test(url);

// Supabase bắt buộc SSL
const options = { logging: false };
if (isPostgres) {
  options.dialect = 'postgres';
  options.dialectOptions = { ssl: { require: true, rejectUnauthorized: false } };
}

module.exports = new Sequelize(url, options);
