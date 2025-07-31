import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { Result, ValidationError as ExpressValidationError } from 'express-validator';

/**
 * Handle validation errors from express-validator
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  // Get validation result from request (requires setup in route handlers)
  const errors = req.body._validationErrors as Result<ExpressValidationError> | undefined;
  if (errors && !errors.isEmpty()) {
    const formattedErrors: Record<string, string> = {};
    errors.array().forEach(error => {
      // Handle different validation error types
      const field =
        'path' in error
          ? error.path
          : 'param' in error
            ? (error as any).param
            : 'location' in error
              ? `${(error as any).location}.${(error as any).path}`
              : 'unknown';

      formattedErrors[field] = error.msg;
    });

    return res.status(422).json({
      success: false,
      message: 'Validation error',
      errors: formattedErrors,
    });
  }
  next();
};

/**
 * Main error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Record<string, any> = {};
  let isOperational = false;

  // Check if this is our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;

    // Handle validation errors with details
    if ('errors' in err && typeof err.errors === 'object' && err.errors !== null) {
      errors = err.errors as Record<string, any>;
    }
  }

  // Handle mongoose validation errors (if using mongoose)
  if (err.name === 'ValidationError' && 'errors' in err) {
    statusCode = 422;
    message = 'Validation Error';

    // Format mongoose validation errors
    const mongooseErrors = err.errors;
    if (mongooseErrors && typeof mongooseErrors === 'object' && mongooseErrors !== null) {
      Object.entries(mongooseErrors as Record<string, { message: string }>).forEach(
        ([key, value]) => {
          errors[key] = value.message;
        }
      );
    }
  }

  // Handle duplicate key errors (if using a database)
  if ((err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate value error';

    // Extract duplicate key field
    const keyValue = (err as any).keyValue;
    if (keyValue) {
      errors = keyValue;
    }
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON format';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Production vs development error response
  const isProd = process.env.NODE_ENV === 'production';

  // In production, don't expose error stack for non-operational errors
  if (isProd && !isOperational) {
    return res.status(statusCode).json({
      success: false,
      message: 'Something went wrong',
    });
  }

  // Send error response with details
  res.status(statusCode).json({
    success: false,
    message,
    ...(Object.keys(errors).length > 0 ? { errors } : {}),
    ...(isProd ? {} : { stack: err.stack }),
  });
};

/**
 * Catch-all for unhandled routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(err);
};
