import express from 'express';
import { body, query } from 'express-validator';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientStats
} from '../controllers/patients.controller.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

const patientValidation = [
  body('patientId').notEmpty().trim().withMessage('Patient ID is required'),
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('age').isInt({ min: 0, max: 150 }).withMessage('Valid age is required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('contact').optional().trim(),
  body('address').optional().trim(),
  body('medicalHistory').optional().trim(),
  body('allergies').optional().isArray()
];

const updatePatientValidation = [
  body('patientId').optional().notEmpty().trim(),
  body('name').optional().notEmpty().trim(),
  body('age').optional().isInt({ min: 0, max: 150 }),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('contact').optional().trim(),
  body('address').optional().trim(),
  body('medicalHistory').optional().trim(),
  body('allergies').optional().isArray()
];

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim()
], handleValidationErrors, getPatients);

router.get('/search', [
  query('q').notEmpty().trim().withMessage('Search query is required')
], handleValidationErrors, searchPatients);

router.get('/stats', getPatientStats);
router.get('/:id', getPatientById);
router.post('/', patientValidation, handleValidationErrors, createPatient);
router.put('/:id', updatePatientValidation, handleValidationErrors, updatePatient);
router.delete('/:id', deletePatient);

export default router;