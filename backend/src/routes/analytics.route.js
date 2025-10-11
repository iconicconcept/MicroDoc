import express from 'express';
import { query } from 'express-validator';
import {
  getDashboardStats,
  getClinicalAnalytics,
  getLabAnalytics
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/clinical', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors, getClinicalAnalytics);
router.get('/lab', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors, getLabAnalytics);

export default router;