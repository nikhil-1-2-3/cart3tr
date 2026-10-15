-- =============================================================================
-- QuickCart Database Schema & Seed Data
-- Compatible with MySQL 8.0+ and Amazon RDS MySQL
-- =============================================================================

CREATE DATABASE IF NOT EXISTS quickcart_db;
USE quickcart_db;

-- -----------------------------------------------------------------------------
-- 1. Users Table (Authentication)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. Products Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(1000) NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  stock INT DEFAULT 50,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. Orders Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_address TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------------------
-- 3. Order Items Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- -----------------------------------------------------------------------------
-- 4. Seed 6 Sample Products (Inserted if table is empty)
-- -----------------------------------------------------------------------------
INSERT INTO products (name, description, price, image_url, category, stock, rating)
SELECT * FROM (
  SELECT 
    'Noise ColorFit Pro 5 Smartwatch' AS name,
    '1.85" AMOLED display with Bluetooth calling, 7-day battery life, heart-rate tracking, and 100+ sports modes.' AS description,
    2999.00 AS price,
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' AS image_url,
    'Electronics' AS category,
    45 AS stock,
    4.7 AS rating
  UNION ALL
  SELECT 
    'boAt Rockerz 450 Bluetooth Headphones',
    'Wireless on-ear headphones with 40mm dynamic drivers, up to 15 hours playback, and ultra-comfortable ear cushions.',
    1499.00,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    'Audio',
    60,
    4.5
  UNION ALL
  SELECT 
    'Wildcraft Casual Laptop Backpack 30L',
    'Durable water-resistant backpack featuring dedicated padded laptop sleeve, dual bottle holders, and ergonomic straps.',
    1299.00,
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    'Accessories',
    35,
    4.6
  UNION ALL
  SELECT 
    'Prestige Electric Kettle 1.5L',
    'Stainless steel rapid boil kettle with automatic safety shut-off, 360-degree swivel base, and ergonomic cool-touch handle.',
    899.00,
    'https://images.unsplash.com/photo-1594213114663-ddf4f24cf292?w=600&auto=format&fit=crop&q=80',
    'Appliances',
    80,
    4.3
  UNION ALL
  SELECT 
    'Portronics SoundDrum 10W Bluetooth Speaker',
    'Compact cylindrical speaker with rich 360-degree sound, punchy bass, IPX6 water resistance, and built-in FM tuner.',
    1199.00,
    'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
    'Audio',
    50,
    4.4
  UNION ALL
  SELECT 
    'Puma Men\'s Hydro Glide Running Shoes',
    'Engineered mesh upper with responsive EVA midsole cushioning for daily running, gym workouts, and all-day comfort.',
    2499.00,
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    'Footwear',
    25,
    4.8
) AS seed_data
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);
