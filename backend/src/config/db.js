const mysql = require('mysql2/promise');

let pool = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function settings() {
  const name = process.env.DB_NAME || 'jesko_bmw_store';
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error('DB_NAME may only contain letters, numbers and underscores');
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name,
  };
}

async function connectDatabase(retries = 5, delayMs = 3000) {
  const s = settings();
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const boot = await mysql.createConnection({ host: s.host, port: s.port, user: s.user, password: s.password });
      await boot.query(
        `CREATE DATABASE IF NOT EXISTS \`${s.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await boot.end();

      pool = mysql.createPool({
        host: s.host,
        port: s.port,
        user: s.user,
        password: s.password,
        database: s.name,
        waitForConnections: true,
        connectionLimit: 10,
        decimalNumbers: true,
        charset: 'utf8mb4',
      });
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      console.log(`✅ MySQL database connected successfully -> ${s.host}:${s.port}/${s.name}`);
      return pool;
    } catch (err) {
      lastError = err;
      console.log(`⏳ Database connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) await sleep(delayMs);
    }
  }
  throw lastError;
}

function getPool() {
  if (!pool) throw new Error('Database is not connected yet');
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

module.exports = { connectDatabase, getPool, query };
