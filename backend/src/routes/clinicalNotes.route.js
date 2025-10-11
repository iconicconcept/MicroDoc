import express from 'express';
import { body, query } from 'express-validator';
import {
  getClinicalNotes,
  getClinicalNoteById,
  createClinicalNote,
  updateClinicalNote,
  deleteClinicalNote,
  getNotesByPatient,
  generateSummary
} from '../controllers/clinicalNotes.controller.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

const noteValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('type').isIn(['clinical', 'lab', 'procedure']).withMessage('Valid type is required'),
  body('content').notEmpty().trim().withMessage('Content is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Valid priority is required'),
  body('transcript').optional().trim(),
  body('summary').optional().trim()
];

const updateNoteValidation = [
  body('type').optional().isIn(['clinical', 'lab', 'procedure']),
  body('content').optional().notEmpty().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('transcript').optional().trim(),
  body('summary').optional().trim()
];

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('patientId').optional().isMongoId(),
  query('type').optional().isIn(['clinical', 'lab', 'procedure'])
], handleValidationErrors, getClinicalNotes);

router.get('/patient/:patientId', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, getNotesByPatient);

router.get('/:id', getClinicalNoteById);
router.post('/', noteValidation, handleValidationErrors, createClinicalNote);
router.put('/:id', updateNoteValidation, handleValidationErrors, updateClinicalNote);
router.delete('/:id', deleteClinicalNote);
router.post('/:id/summary', generateSummary);

export default router;