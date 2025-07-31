import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/middlewares/errorHandler.middleware';
import { 
  AppError, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError,
  ConflictError,
  InternalServerError 
} from '../../../src/utils/errors';
import { createMockRequest, createMockResponse, createMockNext } from '../../helpers/testUtils';

describe('ErrorHandler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let consoleSpy: jest.SpyInstance;
  let originalEnv: string | undefined;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
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
      const error = new ValidationError('Validation failed', validationDetails);

      // Act
      errorHandler(error, req as Request, res as Response, next);

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
      const error = new NotFoundError('User not found');

      // Act
      errorHandler(error, req as Request, res as Response, next);

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
      const error = new UnauthorizedError('Invalid credentials');

      // Act
      errorHandler(error, req as Request, res as Response, next);

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
      const error = new ConflictError('Email already exists');

      // Act
      errorHandler(error, req as Request, res as Response, next);

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
      const error = new InternalServerError('Database connection failed');

      // Act
      errorHandler(error, req as Request, res as Response, next);

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
      errorHandler(error, req as Request, res as Response, next);

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
      errorHandler(error, req as Request, res as Response, next);

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
      errorHandler(error, req as Request, res as Response, next);

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
      errorHandler(error as any, req as Request, res as Response, next);

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
      errorHandler(error as any, req as Request, res as Response, next);

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
      errorHandler(error as any, req as Request, res as Response, next);

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
      errorHandler(error as any, req as Request, res as Response, next);

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
      errorHandler(error as any, req as Request, res as Response, next);

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
      errorHandler(error, req as Request, res as Response, next);

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
      errorHandler(error, req as Request, res as Response, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: error.stack
        })
      );
    });

    it('should not include stack trace in production for non-operational errors', () => {
      // Arrange
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');

      // Act
      errorHandler(error, req as Request, res as Response, next);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong'
      });
    });
  });
});
