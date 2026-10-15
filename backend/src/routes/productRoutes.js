import express from 'express';
import { getProducts, getProductById } from '../controllers/productController.js';

const router = express.Router();

// GET /api/products - list all products or filter with ?search=
router.get('/', getProducts);

// GET /api/products/:id - fetch single product
router.get('/:id', getProductById);

export default router;
