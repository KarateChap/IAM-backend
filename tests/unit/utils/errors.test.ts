import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError
} from '../../../src/utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      // Act
      const error = new AppError('Test error', 500);

      // Assert
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should capture stack trace', () => {
      // Act
      const error = new AppError('Test error', 500);

      // Assert
      expect(error.stack).toBeDefined();
    });
  });

  describe('BadRequestError', () => {
    it('should create 400 error with default message', () => {
      // Act
      const error = new BadRequestError();

      // Assert
      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should create 400 error with custom message', () => {
      // Act
      const error = new BadRequestError('Custom bad request');

      // Assert
      expect(error.message).toBe('Custom bad request');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create 401 error with default message', () => {
      // Act
      const error = new UnauthorizedError();

      // Assert
      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    it('should create 401 error with custom message', () => {
      // Act
      const error = new UnauthorizedError('Invalid credentials');

      // Assert
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    it('should create 403 error with default message', () => {
      // Act
      const error = new ForbiddenError();

      // Assert
      expect(error.message).toBe('Forbidden access');
      expect(error.statusCode).toBe(403);
      expect(error.isOperational).toBe(true);
    });

    it('should create 403 error with custom message', () => {
      // Act
      const error = new ForbiddenError('Insufficient permissions');

      // Assert
      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create 404 error with default message', () => {
      // Act
      const error = new NotFoundError();

      // Assert
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should create 404 error with custom message', () => {
      // Act
      const error = new NotFoundError('User not found');

      // Assert
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should create 409 error with default message', () => {
      // Act
      const error = new ConflictError();

      // Assert
      expect(error.message).toBe('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.isOperational).toBe(true);
    });

    it('should create 409 error with custom message', () => {
      // Act
      const error = new ConflictError('Email already exists');

      // Assert
      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('ValidationError', () => {
    it('should create 422 error with message and details', () => {
      // Arrange
      const details = { email: 'Email is required', password: 'Password too short' };

      // Act
      const error = new ValidationError('Validation failed', details);

      // Assert
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.errors).toEqual(details);
      expect(error.isOperational).toBe(true);
    });

    it('should create validation error with default message', () => {
      // Act
      const error = new ValidationError();

      // Assert
      expect(error.message).toBe('Validation error');
      expect(error.statusCode).toBe(422);
      expect(error.errors).toEqual({});
    });
  });

  describe('InternalServerError', () => {
    it('should create 500 error with default message', () => {
      // Act
      const error = new InternalServerError();

      // Assert
      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should create 500 error with custom message', () => {
      // Act
      const error = new InternalServerError('Database connection failed');

      // Assert
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('Error inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      // Act
      const badRequest = new BadRequestError();
      const unauthorized = new UnauthorizedError();
      const notFound = new NotFoundError();

      // Assert
      expect(badRequest).toBeInstanceOf(AppError);
      expect(badRequest).toBeInstanceOf(Error);
      expect(unauthorized).toBeInstanceOf(AppError);
      expect(unauthorized).toBeInstanceOf(Error);
      expect(notFound).toBeInstanceOf(AppError);
      expect(notFound).toBeInstanceOf(Error);
    });
  });
});
