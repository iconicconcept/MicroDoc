import express from 'express';
import { query } from 'express-validator';
import {
  getUsers,
  getUserById,
  updateUserStatus,
  getUsersByRole
} from '../controllers/users.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole(['admin'])); // Only admins can access user management

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['clinician', 'microbiologist', 'lab_staff', 'admin'])
], handleValidationErrors, getUsers);

router.get('/role/:role', getUsersByRole);
router.get('/:id', getUserById);
router.patch('/:id/status', [
  body('isActive').isBoolean().withMessage('isActive must be a boolean')
], handleValidationErrors, updateUserStatus);

export default router;