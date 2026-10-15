import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Prepare connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quickcart_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Enable SSL if running against Amazon RDS with SSL required
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

// Create connection pool
export const pool = mysql.createPool(poolConfig);

/**
 * Test MySQL connection on startup
 */
export async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ [Database] Connected successfully to MySQL (${poolConfig.host}:${poolConfig.port}/${poolConfig.database})`);
    connection.release();
    return { connected: true, host: poolConfig.host, database: poolConfig.database };
  } catch (error) {
    console.error('❌ [Database] Connection failed:', error.message);
    console.error('👉 Make sure MySQL is running and your .env credentials match your MySQL/RDS instance.');
    return { connected: false, error: error.message, host: poolConfig.host };
  }
}

export default pool;
