"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_middleware_1 = require("../../../src/middlewares/errorHandler.middleware");
const errors_1 = require("../../../src/utils/errors");
const testUtils_1 = require("../../helpers/testUtils");
describe('ErrorHandler Middleware', () => {
    let req;
    let res;
    let next;
    let consoleSpy;
    let originalEnv;
    beforeEach(() => {
        req = (0, testUtils_1.createMockRequest)();
        res = (0, testUtils_1.createMockResponse)();
        next = (0, testUtils_1.createMockNext)();
        consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'test'; // Ensure we're in test mode
    });
    afterEach(() => {
        consoleSpy.mockRestore();
        process.env.NODE_ENV = originalEnv;
    });
    describe('AppError handling', () => {
        it('should handle ValidationError correctly', () => {
            // Arrange
            const validationDetails = { email: 'Email is required', password: 'Password too short' };
            const error = new errors_1.ValidationError('Validation failed', validationDetails);
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(422);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: validationDetails,
                stack: expect.any(String)
            });
        });
        it('should handle NotFoundError correctly', () => {
            // Arrange
            const error = new errors_1.NotFoundError('User not found');
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found',
                stack: expect.any(String)
            });
        });
        it('should handle UnauthorizedError correctly', () => {
            // Arrange
            const error = new errors_1.UnauthorizedError('Invalid credentials');
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid credentials',
                stack: expect.any(String)
            });
        });
        it('should handle ConflictError correctly', () => {
            // Arrange
            const error = new errors_1.ConflictError('Email already exists');
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Email already exists',
                stack: expect.any(String)
            });
        });
        it('should handle InternalServerError correctly', () => {
            // Arrange
            const error = new errors_1.InternalServerError('Database connection failed');
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Database connection failed',
                stack: expect.any(String)
            });
        });
    });
    describe('Generic Error handling', () => {
        it('should handle generic Error as internal server error', () => {
            // Arrange
            const error = new Error('Something went wrong');
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal Server Error',
                stack: expect.any(String)
            });
        });
        it('should handle TypeError correctly', () => {
            // Arrange
            const error = new TypeError('Cannot read property of undefined');
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal Server Error',
                stack: expect.any(String)
            });
        });
        it('should handle ReferenceError correctly', () => {
            // Arrange
            const error = new ReferenceError('Variable is not defined');
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal Server Error',
                stack: expect.any(String)
            });
        });
    });
    describe('Sequelize Error handling', () => {
        it('should handle SequelizeValidationError as generic error', () => {
            // Arrange
            const error = {
                name: 'SequelizeValidationError',
                message: 'Validation error',
                errors: [
                    { path: 'email', message: 'Email must be unique' },
                    { path: 'username', message: 'Username is required' }
                ]
            };
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal Server Error',
                stack: undefined
            });
        });
        it('should handle SequelizeUniqueConstraintError as generic error', () => {
            // Arrange
            const error = {
                name: 'SequelizeUniqueConstraintError',
                message: 'Unique constraint error',
                errors: [
                    { path: 'email', message: 'Email must be unique' }
                ]
            };
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal Server Error',
                stack: undefined
            });
        });
        it('should handle SequelizeForeignKeyConstraintError as generic error', () => {
            // Arrange
            const error = {
                name: 'SequelizeForeignKeyConstraintError',
                message: 'Foreign key constraint error'
            };
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Internal Server Error',
                stack: undefined
            });
        });
    });
    describe('JWT Error handling', () => {
        it('should handle JsonWebTokenError', () => {
            // Arrange
            const error = {
                name: 'JsonWebTokenError',
                message: 'invalid token'
            };
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid token',
                stack: undefined
            });
        });
        it('should handle TokenExpiredError', () => {
            // Arrange
            const error = {
                name: 'TokenExpiredError',
                message: 'jwt expired'
            };
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Token expired',
                stack: undefined
            });
        });
    });
    describe('Error logging', () => {
        it('should log all errors to console', () => {
            // Arrange
            const error = new Error('Test error');
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(consoleSpy).toHaveBeenCalledWith('Error:', error);
        });
    });
    describe('Development vs Production', () => {
        it('should include stack trace in development', () => {
            // Arrange
            process.env.NODE_ENV = 'development';
            const error = new Error('Test error');
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                stack: error.stack
            }));
        });
        it('should not include stack trace in production for non-operational errors', () => {
            // Arrange
            process.env.NODE_ENV = 'production';
            const error = new Error('Test error');
            // Act
            (0, errorHandler_middleware_1.errorHandler)(error, req, res, next);
            // Assert
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Something went wrong'
            });
        });
    });
});
