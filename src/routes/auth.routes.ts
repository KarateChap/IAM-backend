import express from 'express';
import * as authController from '../controllers/auth.controller';
import { registerValidation, loginValidation } from '../validators/auth.validator';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', loginValidation, authController.login);

// Debug routes removed - use dedicated debugging tools or add back if needed

export default router;
