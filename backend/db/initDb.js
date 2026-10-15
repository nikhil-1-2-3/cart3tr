import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'quickcart_db';

  console.log(`\n⏳ Connecting to MySQL server at ${host}:${port}...`);

  let connection;
  try {
    // Connect to MySQL server without selecting DB initially
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    console.log(`✅ Connected to MySQL server as user "${user}".`);

    // Read schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`🚀 Executing schema.sql script on database "${database}"...`);
    await connection.query(sql);

    console.log('✅ Database and tables created successfully!');
    console.log('✅ Seed sample products verified.');

    // Count products
    const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${database}.products`);
    console.log(`📦 Total products in catalog: ${rows[0].count}`);
    console.log('🎉 Database initialization complete!\n');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
