import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testDbConnection } from './config/db.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
let dbStatus = { connected: false, message: 'Checking...' };

// Middleware
app.use(morgan('dev'));

// CORS configuration (enables frontend on Vercel or localhost)
const allowedOrigin = process.env.CLIENT_URL || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? '*' : [allowedOrigin, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Root endpoint with API directory
app.get('/', (req, res) => {
  res.json({
    app: 'QuickCart REST API',
    version: '1.0.0',
    status: 'Running',
    description: 'Designed for AWS 3-Tier Architecture (Vercel + EC2/ALB + Amazon RDS MySQL)',
    endpoints: {
      health: 'GET /api/health',
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      currentUser: 'GET /api/auth/me',
      products: 'GET /api/products',
      productById: 'GET /api/products/:id',
      createOrder: 'POST /api/orders',
      myOrders: 'GET /api/orders/my-orders',
      orderById: 'GET /api/orders/:id'
    }
  });
});

/**
 * Health check endpoint for AWS Application Load Balancer (ALB) and Docker
 * Target groups and health checks ping this endpoint periodically
 */
app.get('/api/health', async (req, res) => {
  // If not previously connected, attempt to verify connection
  if (!dbStatus.connected) {
    dbStatus = await testDbConnection();
  }

  res.status(200).json({
    status: 'ok',
    service: 'quickcart-backend',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.connected,
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'quickcart_db'
    }
  });
});

// Mount Resource Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Express Server with connection retry
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 QuickCart API Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`======================================================`);

  // Initial connection attempt with retry loop
  let retries = 5;
  while (retries > 0) {
    dbStatus = await testDbConnection();
    if (dbStatus.connected) break;
    retries--;
    if (retries > 0) {
      console.log(`⏳ Database not ready yet, retrying in 2 seconds... (${retries} attempts left)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
});
