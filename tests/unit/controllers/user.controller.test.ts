import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import UserController from '../../../src/controllers/user.controller';
import { userService, auditService } from '../../../src/services';
import { ValidationError, InternalServerError } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('express-validator');
jest.mock('../../../src/services');

const mockValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;
const mockUserService = userService as jest.Mocked<typeof userService>;
const mockAuditService = auditService as jest.Mocked<typeof auditService>;

describe('User Controller', () => {
  let mockRequest: Partial<Request & { user?: any }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let userController: UserController;

  beforeEach(() => {
    mockRequest = {
      params: { id: '1' },
      body: { username: 'testuser', email: 'test@example.com' },
      query: {},
      user: { id: 1 }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    userController = new UserController();

    // Mock validation result as empty (no errors)
    mockValidationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    } as any);

    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should successfully get users', async () => {
      const mockResult = {
        users: [
          { id: 1, username: 'user1', email: 'user1@test.com' },
          { id: 2, username: 'user2', email: 'user2@test.com' }
        ],
        total: 2
      };

      mockUserService.getUsers.mockResolvedValue(mockResult as any);

      await userController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getUsers).toHaveBeenCalledWith({
        search: undefined,
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        order: 'DESC'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockResult.users
      });
    });

    it('should handle service errors', async () => {
      mockUserService.getUsers.mockRejectedValue(new Error('Service error'));

      await userController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(InternalServerError));
    });

    it('should handle invalid query parameters', async () => {
      mockRequest.query = { limit: 'invalid' };
      const mockResult = { users: [], total: 0 };
      mockUserService.getUsers.mockResolvedValue(mockResult as any);

      await userController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getUsers).toHaveBeenCalledWith({
        search: undefined,
        limit: NaN,
        offset: 0,
        sortBy: 'createdAt',
        order: 'DESC'
      });
    });

    it('should handle query filters', async () => {
      mockRequest.query = { search: 'test', sortBy: 'username', order: 'asc', limit: '5', offset: '10' };

      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@test.com' }
      ];

      mockUserService.getUsers.mockResolvedValue(mockUsers as any);

      await userController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getUsers).toHaveBeenCalledWith({
        search: 'test',
        limit: 5,
        offset: 10,
        sortBy: 'username',
        order: 'asc'
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Service error');
      mockUserService.getUsers.mockRejectedValue(serviceError);

      await userController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(InternalServerError));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should successfully get user by id', async () => {
      const mockUser = { id: 1, username: 'user1', email: 'user1@test.com' };

      mockUserService.getUserById.mockResolvedValue(mockUser as any);

      await userController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('User not found');
      mockUserService.getUserById.mockRejectedValue(serviceError);

      await userController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should successfully create user', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      mockRequest.body = userData;

      const mockUser = { 
        id: 1, 
        username: 'newuser', 
        email: 'newuser@test.com'
      };
      mockUserService.createUser.mockResolvedValue(mockUser as any);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await userController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 1,
        action: 'create',
        resource: 'User',
        resourceId: 1,
        details: {
          username: 'newuser',
          email: 'newuser@test.com',
          message: 'Created user: newuser'
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully',
        data: mockUser
      });
    });

    it('should handle validation errors', async () => {
      const mockErrors = [
        { path: 'username', param: 'username', msg: 'Username is required' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      await userController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ValidationError)
      );
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Service error');
      mockUserService.createUser.mockRejectedValue(serviceError);

      await userController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should successfully update user', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@test.com'
      };

      mockRequest.body = updateData;

      const mockUser = { id: 1, ...updateData };
      mockUserService.updateUser.mockResolvedValue(mockUser as any);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await userController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.updateUser).toHaveBeenCalledWith(1, updateData);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 1,
        action: 'update',
        resource: 'User',
        resourceId: 1,
        details: {
          message: 'Updated user: updateduser',
          changes: updateData
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User updated successfully',
        data: mockUser
      });
    });

    it('should handle validation errors', async () => {
      const mockErrors = [
        { path: 'email', param: 'email', msg: 'Invalid email format' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      await userController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ValidationError)
      );
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Service error');
      mockUserService.updateUser.mockRejectedValue(serviceError);

      await userController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should successfully delete user', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      mockUserService.getUserById.mockResolvedValue(mockUser as any);
      mockUserService.deleteUser.mockResolvedValue(undefined);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await userController.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockUserService.deleteUser).toHaveBeenCalledWith(1);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 1,
        action: 'delete',
        resource: 'User',
        resourceId: 1,
        details: {
          message: 'Deleted user: testuser'
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deleted successfully'
      });
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Service error');
      mockUserService.deleteUser.mockRejectedValue(serviceError);

      await userController.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
