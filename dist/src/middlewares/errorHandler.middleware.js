"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.handleValidationErrors = void 0;
const errors_1 = require("../utils/errors");
/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
    // Get validation result from request (requires setup in route handlers)
    const errors = req.body._validationErrors;
    if (errors && !errors.isEmpty()) {
        const formattedErrors = {};
        errors.array().forEach(error => {
            // Handle different validation error types
            const field = 'path' in error
                ? error.path
                : 'param' in error
                    ? error.param
                    : 'location' in error
                        ? `${error.location}.${error.path}`
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
exports.handleValidationErrors = handleValidationErrors;
/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    // Default error response
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors = {};
    let isOperational = false;
    // Check if this is our custom AppError
    if (err instanceof errors_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        isOperational = err.isOperational;
        // Handle validation errors with details
        if ('errors' in err && typeof err.errors === 'object' && err.errors !== null) {
            errors = err.errors;
        }
    }
    // Handle mongoose validation errors (if using mongoose)
    if (err.name === 'ValidationError' && 'errors' in err) {
        statusCode = 422;
        message = 'Validation Error';
        // Format mongoose validation errors
        const mongooseErrors = err.errors;
        if (mongooseErrors && typeof mongooseErrors === 'object' && mongooseErrors !== null) {
            Object.entries(mongooseErrors).forEach(([key, value]) => {
                errors[key] = value.message;
            });
        }
    }
    // Handle duplicate key errors (if using a database)
    if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate value error';
        // Extract duplicate key field
        const keyValue = err.keyValue;
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
exports.errorHandler = errorHandler;
/**
 * Catch-all for unhandled routes
 */
const notFoundHandler = (req, res, next) => {
    const err = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(err);
};
exports.notFoundHandler = notFoundHandler;
