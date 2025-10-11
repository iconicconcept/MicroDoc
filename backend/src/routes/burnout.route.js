import express from 'express';
import { body, query } from 'express-validator';
import {
  getBurnoutEntries,
  createBurnoutEntry,
  updateBurnoutEntry,
  deleteBurnoutEntry,
  getBurnoutAnalytics,
  getBurnoutTrends,
  getBurnoutRecommendations
} from '../controllers/burnout.controller.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

const burnoutEntryValidation = [
  body('hoursWorked').isInt({ min: 0, max: 24 }).withMessage('Hours worked must be between 0 and 24'),
  body('mood').isIn(['excellent', 'good', 'neutral', 'stressed', 'exhausted']).withMessage('Valid mood is required'),
  body('stressLevel').isInt({ min: 1, max: 5 }).withMessage('Stress level must be between 1 and 5'),
  body('notes').optional().trim(),
  body('date').optional().isISO8601().withMessage('Valid date is required')
];

const updateBurnoutEntryValidation = [
  body('hoursWorked').optional().isInt({ min: 0, max: 24 }),
  body('mood').optional().isIn(['excellent', 'good', 'neutral', 'stressed', 'exhausted']),
  body('stressLevel').optional().isInt({ min: 1, max: 5 }),
  body('notes').optional().trim(),
  body('date').optional().isISO8601()
];

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors, getBurnoutEntries);

router.get('/analytics', [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Valid period is required')
], handleValidationErrors, getBurnoutAnalytics);

router.get('/trends', [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], handleValidationErrors, getBurnoutTrends);

router.get('/recommendations', getBurnoutRecommendations);

router.post('/', burnoutEntryValidation, handleValidationErrors, createBurnoutEntry);
router.put('/:id', updateBurnoutEntryValidation, handleValidationErrors, updateBurnoutEntry);
router.delete('/:id', deleteBurnoutEntry);

export default router;