import express from 'express';
import { body, query } from 'express-validator';
import {
  getLabReports,
  getLabReportById,
  createLabReport,
  updateLabReport,
  deleteLabReport,
  getReportsByPatient,
  updateReportStatus,
  generateAISuggestions
} from '../controllers/labReports.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

const labReportValidation = [
  body('sampleId').notEmpty().trim().withMessage('Sample ID is required'),
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('testType').isIn(['gram_stain', 'culture_sensitivity', 'pcr', 'antigen', 'other']).withMessage('Valid test type is required'),
  body('results').notEmpty().trim().withMessage('Results are required'),
  body('findings').notEmpty().trim().withMessage('Findings are required'),
  body('pathogen').optional().trim(),
  body('antibioticSensitivity').optional().isArray(),
  body('status').optional().isIn(['pending', 'completed', 'cancelled'])
];

const updateLabReportValidation = [
  body('sampleId').optional().notEmpty().trim(),
  body('testType').optional().isIn(['gram_stain', 'culture_sensitivity', 'pcr', 'antigen', 'other']),
  body('results').optional().notEmpty().trim(),
  body('findings').optional().notEmpty().trim(),
  body('pathogen').optional().trim(),
  body('antibioticSensitivity').optional().isArray(),
  body('status').optional().isIn(['pending', 'completed', 'cancelled'])
];

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('patientId').optional().isMongoId(),
  query('status').optional().isIn(['pending', 'completed', 'cancelled']),
  query('testType').optional().isIn(['gram_stain', 'culture_sensitivity', 'pcr', 'antigen', 'other'])
], handleValidationErrors, getLabReports);

router.get('/patient/:patientId', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, getReportsByPatient);

router.get('/:id', getLabReportById);
router.post('/', requireRole(['microbiologist', 'admin']), labReportValidation, handleValidationErrors, createLabReport);
router.put('/:id', requireRole(['microbiologist', 'admin']), updateLabReportValidation, handleValidationErrors, updateLabReport);
router.delete('/:id', requireRole(['microbiologist', 'admin']), deleteLabReport);
router.patch('/:id/status', requireRole(['microbiologist', 'admin']), [
  body('status').isIn(['pending', 'completed', 'cancelled']).withMessage('Valid status is required')
], handleValidationErrors, updateReportStatus);
router.post('/:id/ai-suggestions', generateAISuggestions);

export default router;