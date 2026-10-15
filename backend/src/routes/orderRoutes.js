import express from 'express';
import { createOrder, getOrderById, getMyOrders } from '../controllers/orderController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/orders/my-orders - fetch orders of logged in user
router.get('/my-orders', requireAuth, getMyOrders);

// POST /api/orders - place a new order (supports guest or authenticated user)
router.post('/', optionalAuth, createOrder);

// GET /api/orders/:id - retrieve order details
router.get('/:id', getOrderById);

export default router;
