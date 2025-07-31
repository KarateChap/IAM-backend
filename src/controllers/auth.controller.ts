import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { authService, auditService } from '../services';
import {
  ValidationError,
  InternalServerError,
} from '../utils/errors';

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format validation errors
      const validationErrors = errors.array().reduce(
        (acc, curr) => {
          // Handle different validation error types safely
          let field: string = 'unknown';
          if (typeof curr === 'object' && curr !== null && 'param' in curr) {
            field = String(curr.param);
          }
          acc[field] = curr.msg;
          return acc;
        },
        {} as Record<string, string>
      );

      throw new ValidationError('Validation error', validationErrors);
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Use auth service to register user
    const result = await authService.registerUser({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    // Log the registration event
    await auditService.logEvent({
      userId: result.user.id,
      action: 'USER_REGISTERED',
      resource: 'users',
      resourceId: result.user.id,
      details: { username, email },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    next(
      error instanceof Error ? error : new InternalServerError('Server error during registration')
    );
  }
};

/**
 * Authenticate user and generate JWT
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format validation errors
      const validationErrors = errors.array().reduce(
        (acc, curr) => {
          // Handle different validation error types safely
          let field: string = 'unknown';
          if (typeof curr === 'object' && curr !== null && 'param' in curr) {
            field = String(curr.param);
          }
          acc[field] = curr.msg;
          return acc;
        },
        {} as Record<string, string>
      );

      throw new ValidationError('Validation error', validationErrors);
    }

    const { email, password } = req.body;

    // Use auth service to login user
    const result = await authService.loginUser({ email, password });

    // Log the login event
    await auditService.logEvent({
      userId: result.user.id,
      action: 'USER_LOGIN',
      resource: 'auth',
      details: { email },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (error) {
    next(error instanceof Error ? error : new InternalServerError('Server error during login'));
  }
};
