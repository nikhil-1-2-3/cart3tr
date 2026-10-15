import express from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/signup - Register new user
router.post('/signup', signup);

// POST /api/auth/login - Log in existing user
router.post('/login', login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', requireAuth, getMe);

export default router;
