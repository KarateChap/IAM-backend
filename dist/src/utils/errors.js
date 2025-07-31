"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
/**
 * Base class for application errors
 */
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * 400 Bad Request - Invalid input
 */
class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
/**
 * 401 Unauthorized - Authentication failure
 */
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
/**
 * 403 Forbidden - Authorization failure
 */
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden access') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
/**
 * 404 Not Found - Resource not found
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
/**
 * 409 Conflict - Resource conflict
 */
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
/**
 * 422 Unprocessable Entity - Validation error
 */
class ValidationError extends AppError {
    errors;
    constructor(message = 'Validation error', errors = {}) {
        super(message, 422);
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
/**
 * 500 Internal Server Error - Unexpected server error
 */
class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500);
    }
}
exports.InternalServerError = InternalServerError;
