import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'quickcart_secret_key_aws_3tier_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token helper
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * POST /api/auth/signup
 * Register a new user account
 */
export async function signup(req, res) {
  const { name, email, password } = req.body;

  // Input validation
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Full name is required' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  try {
    // Check if email already registered
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into MySQL
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [cleanName, cleanEmail, hashedPassword]
    );

    const newUser = {
      id: result.insertId,
      name: cleanName,
      email: cleanEmail
    };

    const token = generateToken(newUser);

    console.log(`👤 [Auth] New user registered: ${cleanEmail} (ID: ${newUser.id})`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to QuickCart.',
      token,
      user: newUser
    });

  } catch (error) {
    console.error('❌ [AuthController] Signup error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to create account. Please ensure your database is accessible.',
      error: error.message
    });
  }
}

/**
 * POST /api/auth/login
 * Authenticate existing user with email and password
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Find user by email
    const [users] = await pool.query('SELECT id, name, email, password FROM users WHERE email = ?', [cleanEmail]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Verify password with bcrypt
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    const token = generateToken(userData);

    console.log(`🔐 [Auth] User logged in: ${cleanEmail} (ID: ${user.id})`);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: userData
    });

  } catch (error) {
    console.error('❌ [AuthController] Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please check server and database status.',
      error: error.message
    });
  }
}

/**
 * GET /api/auth/me
 * Fetch current authenticated user profile
 */
export async function getMe(req, res) {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    return res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('❌ [AuthController] getMe error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
  }
}
