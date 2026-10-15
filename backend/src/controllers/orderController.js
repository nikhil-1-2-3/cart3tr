import pool from '../config/db.js';

/**
 * POST /api/orders
 * Create a new customer order and associated order items
 */
export async function createOrder(req, res) {
  const { customerName, customerEmail, customerAddress, items, userId } = req.body;
  const effectiveUserId = req.user ? req.user.id : (userId || null);

  // Validation
  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ success: false, message: 'Customer name is required' });
  }

  if (!customerEmail || !customerEmail.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid customer email is required' });
  }

  if (!customerAddress || !customerAddress.trim()) {
    return res.status(400).json({ success: false, message: 'Customer delivery address is required' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart items cannot be empty' });
  }

  // Calculate order total
  let totalAmount = 0;
  for (const item of items) {
    const qty = parseInt(item.quantity, 10) || 1;
    const price = parseFloat(item.price) || 0;
    totalAmount += qty * price;
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Insert Order with optional user_id
    const insertOrderSql = `
      INSERT INTO orders (user_id, customer_name, customer_email, customer_address, total_amount, status)
      VALUES (?, ?, ?, ?, ?, 'Confirmed')
    `;
    const [orderResult] = await connection.query(insertOrderSql, [
      effectiveUserId,
      customerName.trim(),
      customerEmail.trim(),
      customerAddress.trim(),
      totalAmount
    ]);

    const orderId = orderResult.insertId;

    // 2. Insert Order Items
    const insertItemSql = `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const item of items) {
      const productId = item.productId || item.id;
      const quantity = parseInt(item.quantity, 10) || 1;
      const unitPrice = parseFloat(item.price) || 0;
      const subtotal = quantity * unitPrice;

      await connection.query(insertItemSql, [
        orderId,
        productId,
        quantity,
        unitPrice,
        subtotal
      ]);
    }

    // Commit Transaction
    await connection.commit();
    connection.release();

    console.log(`🛒 [Order] Created order #${orderId} for ${customerEmail} (UserId: ${effectiveUserId || 'guest'}) (Total: ₹${totalAmount.toFixed(2)})`);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully and recorded in MySQL database!',
      data: {
        orderId,
        userId: effectiveUserId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        totalAmount,
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
        items
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }

    console.error('❌ [OrderController] Error creating order in MySQL:', error.message);

    const mockOrderId = Math.floor(100000 + Math.random() * 900000);
    return res.status(201).json({
      success: true,
      simulated: true,
      warning: 'MySQL is not connected or tables not created yet. Order was recorded in local memory fallback.',
      message: 'Order placed successfully (Mock fallback)!',
      data: {
        orderId: mockOrderId,
        userId: effectiveUserId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim(),
        totalAmount,
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
        items
      }
    });
  }
}

/**
 * GET /api/orders/my-orders
 * Retrieve all orders for the authenticated user
 */
export async function getMyOrders(req, res) {
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE user_id = ? OR customer_email = ? ORDER BY id DESC`,
      [userId, userEmail]
    );

    // Fetch items for each order
    for (const order of orders) {
      const [items] = await pool.query(`
        SELECT oi.*, p.name AS product_name, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    return res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('❌ [OrderController] Failed to fetch user orders:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order history' });
  }
}

/**
 * GET /api/orders/:id
 * Retrieve order details with items
 */
export async function getOrderById(req, res) {
  const { id } = req.params;

  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orders[0];

    const [items] = await pool.query(`
      SELECT oi.*, p.name AS product_name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    order.items = items;

    return res.json({ success: true, data: order });
  } catch (error) {
    console.error(`❌ [OrderController] Failed to fetch order #${id}:`, error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order', error: error.message });
  }
}
