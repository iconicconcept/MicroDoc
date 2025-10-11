import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  refresh,
  updateProfile,
  changePassword,
  logout
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('role').isIn(['clinician', 'microbiologist', 'lab_staff', 'admin']).withMessage('Valid role is required'),
  body('department').notEmpty().trim().withMessage('Department is required'),
  body('hospital').notEmpty().trim().withMessage('Hospital is required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required')
];

const updateProfileValidation = [
  body('name').optional().notEmpty().trim().withMessage('Name cannot be empty'),
  body('department').optional().notEmpty().trim().withMessage('Department cannot be empty'),
  body('hospital').optional().notEmpty().trim().withMessage('Hospital cannot be empty')
];

const changePasswordValidation = [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

router.post('/register',registerValidation, handleValidationErrors, register);
router.post('/login', loginValidation, handleValidationErrors, login);
router.post("/refresh", refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfileValidation, handleValidationErrors, updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, handleValidationErrors, changePassword);

export default router;