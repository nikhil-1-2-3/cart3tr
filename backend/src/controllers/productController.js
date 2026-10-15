import pool from '../config/db.js';

// Fallback seed products in case database is momentarily unreachable during setup
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: 'Noise ColorFit Pro 5 Smartwatch',
    description: '1.85" AMOLED display with Bluetooth calling, 7-day battery life, heart-rate tracking, and 100+ sports modes.',
    price: 2999.00,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    category: 'Electronics',
    stock: 45,
    rating: 4.7
  },
  {
    id: 2,
    name: 'boAt Rockerz 450 Bluetooth Headphones',
    description: 'Wireless on-ear headphones with 40mm dynamic drivers, up to 15 hours playback, and ultra-comfortable ear cushions.',
    price: 1499.00,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    category: 'Audio',
    stock: 60,
    rating: 4.5
  },
  {
    id: 3,
    name: 'Wildcraft Casual Laptop Backpack 30L',
    description: 'Durable water-resistant backpack featuring dedicated padded laptop sleeve, dual bottle holders, and ergonomic straps.',
    price: 1299.00,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    category: 'Accessories',
    stock: 35,
    rating: 4.6
  },
  {
    id: 4,
    name: 'Prestige Electric Kettle 1.5L',
    description: 'Stainless steel rapid boil kettle with automatic safety shut-off, 360-degree swivel base, and ergonomic cool-touch handle.',
    price: 899.00,
    image_url: 'https://images.unsplash.com/photo-1594213114663-ddf4f24cf292?w=600&auto=format&fit=crop&q=80',
    category: 'Appliances',
    stock: 80,
    rating: 4.3
  },
  {
    id: 5,
    name: 'Portronics SoundDrum 10W Bluetooth Speaker',
    description: 'Compact cylindrical speaker with rich 360-degree sound, punchy bass, IPX6 water resistance, and built-in FM tuner.',
    price: 1199.00,
    image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
    category: 'Audio',
    stock: 50,
    rating: 4.4
  },
  {
    id: 6,
    name: 'Puma Men\'s Hydro Glide Running Shoes',
    description: 'Engineered mesh upper with responsive EVA midsole cushioning for daily running, gym workouts, and all-day comfort.',
    price: 2499.00,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    category: 'Footwear',
    stock: 25,
    rating: 4.8
  }
];

/**
 * GET /api/products
 * Fetch all products or filter by search query
 */
export async function getProducts(req, res) {
  const { search } = req.query;

  try {
    let sql = 'SELECT * FROM products';
    const params = [];

    if (search && search.trim() !== '') {
      sql += ' WHERE name LIKE ? OR description LIKE ? OR category LIKE ?';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY id ASC';

    const [rows] = await pool.query(sql, params);

    // If database returned rows, return them
    if (rows && rows.length > 0) {
      return res.json({
        success: true,
        source: 'database',
        count: rows.length,
        data: rows
      });
    }

    // If database table is empty, return fallback data
    return res.json({
      success: true,
      source: 'fallback',
      count: FALLBACK_PRODUCTS.length,
      data: FALLBACK_PRODUCTS
    });
  } catch (error) {
    console.warn('⚠️ [ProductController] Database query failed, serving fallback products:', error.message);
    
    let filtered = FALLBACK_PRODUCTS;
    if (search && search.trim() !== '') {
      const q = search.toLowerCase();
      filtered = FALLBACK_PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }

    return res.json({
      success: true,
      source: 'fallback',
      warning: 'Could not connect to MySQL database. Showing fallback products. Please verify your database configuration.',
      count: filtered.length,
      data: filtered
    });
  }
}

/**
 * GET /api/products/:id
 * Fetch single product by ID
 */
export async function getProductById(req, res) {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.warn(`⚠️ [ProductController] Database query failed for ID ${id}:`, error.message);
    const fallback = FALLBACK_PRODUCTS.find(p => p.id === parseInt(id, 10));
    if (fallback) {
      return res.json({ success: true, source: 'fallback', data: fallback });
    }
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
}
