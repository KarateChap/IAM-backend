import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import UserPermissionController from '../../../src/controllers/userPermission.controller';
import User from '../../../src/models/user.model';
import { Group } from '../../../src/models/group.model';
import { Role } from '../../../src/models/role.model';
import { Permission } from '../../../src/models/permission.model';
import { Module } from '../../../src/models/module.model';
import { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, BadRequestError, InternalServerError } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('express-validator');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/role.model');
jest.mock('../../../src/models/permission.model');
jest.mock('../../../src/models/module.model');

const mockValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;
const MockedUser = User as jest.Mocked<typeof User>;
const MockedGroup = Group as jest.Mocked<typeof Group>;
const MockedRole = Role as jest.Mocked<typeof Role>;
const MockedModule = Module as jest.Mocked<typeof Module>;

describe('UserPermission Controller', () => {
  let mockRequest: Partial<Request & { user?: any; userId?: number }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let userPermissionController: UserPermissionController;

  beforeEach(() => {
    mockRequest = {
      params: { id: '1' },
      body: { userId: 1, moduleId: 1, action: 'create' },
      query: {},
      user: { id: 1 },
      userId: 1
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    userPermissionController = new UserPermissionController();

    // Mock validation result as empty (no errors)
    mockValidationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    } as any);

    jest.clearAllMocks();
  });

  describe('getCurrentUserPermissions', () => {
    it('should successfully get current user permissions', async () => {
      const mockPermissions = [
        {
          get: jest.fn((key) => {
            const data = { id: 1, name: 'Test Permission', action: 'create', moduleId: 1 };
            return data[key as keyof typeof data];
          })
        },
        {
          get: jest.fn((key) => {
            const data = { id: 2, name: 'Test Permission 2', action: 'read', moduleId: 1 };
            return data[key as keyof typeof data];
          })
        }
      ];

      // Mock the private getUserPermissions method
      jest.spyOn(userPermissionController as any, 'getUserPermissions').mockResolvedValue(mockPermissions);

      await userPermissionController.getCurrentUserPermissions(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockPermissions
      });
    });

    it('should handle missing userId', async () => {
      mockRequest.userId = undefined;

      await userPermissionController.getCurrentUserPermissions(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated'
        })
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      jest.spyOn(userPermissionController as any, 'getUserPermissions').mockRejectedValue(error);

      await userPermissionController.getCurrentUserPermissions(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('simulateAction', () => {
    it('should successfully simulate user action with permission', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockModule = { id: 1, name: 'Test Module' };
      const mockPermissions = [
        {
          get: jest.fn((key) => {
            const data = { id: 1, name: 'Test Permission', action: 'create', moduleId: 1 };
            return data[key as keyof typeof data];
          })
        }
      ];

      MockedUser.findByPk.mockResolvedValue(mockUser as any);
      MockedModule.findByPk.mockResolvedValue(mockModule as any);
      jest.spyOn(userPermissionController as any, 'getUserPermissions').mockResolvedValue(mockPermissions);

      await userPermissionController.simulateAction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(MockedUser.findByPk).toHaveBeenCalledWith(1);
      expect(MockedModule.findByPk).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 1,
          moduleId: 1,
          moduleName: 'Test Module',
          action: 'create',
          hasPermission: true
        }
      });
    });

    it('should successfully simulate user action without permission', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockModule = { id: 1, name: 'Test Module' };
      const mockPermissions = [
        {
          get: jest.fn((key) => {
            const data = { id: 1, name: 'Test Permission', action: 'read', moduleId: 2 };
            return data[key as keyof typeof data];
          })
        }
      ];

      MockedUser.findByPk.mockResolvedValue(mockUser as any);
      MockedModule.findByPk.mockResolvedValue(mockModule as any);
      jest.spyOn(userPermissionController as any, 'getUserPermissions').mockResolvedValue(mockPermissions);

      await userPermissionController.simulateAction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 1,
          moduleId: 1,
          moduleName: 'Test Module',
          action: 'create',
          hasPermission: false
        }
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [{ param: 'userId', msg: 'User ID is required' }];
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      } as any);

      await userPermissionController.simulateAction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
          errors: { userId: 'User ID is required' }
        })
      );
    });

    it('should handle user not found', async () => {
      MockedUser.findByPk.mockResolvedValue(null);

      await userPermissionController.simulateAction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User with ID 1 not found'
        })
      );
    });

    it('should handle module not found', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      MockedUser.findByPk.mockResolvedValue(mockUser as any);
      MockedModule.findByPk.mockResolvedValue(null);

      await userPermissionController.simulateAction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Module with ID 1 not found'
        })
      );
    });

    it('should handle invalid action', async () => {
      const mockUser = { id: 1, username: 'testuser' };
      const mockModule = { id: 1, name: 'Test Module' };
      mockRequest.body.action = 'invalid';

      MockedUser.findByPk.mockResolvedValue(mockUser as any);
      MockedModule.findByPk.mockResolvedValue(mockModule as any);

      await userPermissionController.simulateAction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Action must be one of: create, read, update, delete'
        })
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      MockedUser.findByPk.mockRejectedValue(error);

      await userPermissionController.simulateAction(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('checkPermission', () => {
    it('should allow access when user has permission', async () => {
      const mockModule = { get: jest.fn(() => 1) };
      const mockPermissions = [
        {
          get: jest.fn((key) => {
            const data = { id: 1, name: 'Test Permission', action: 'create', moduleId: 1 };
            return data[key as keyof typeof data];
          })
        }
      ];

      MockedModule.findOne.mockResolvedValue(mockModule as any);
      jest.spyOn(userPermissionController as any, 'getUserPermissions').mockResolvedValue(mockPermissions);

      const middleware = userPermissionController.checkPermission('TestModule', 'create');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user lacks permission', async () => {
      const mockModule = { get: jest.fn(() => 1) };
      const mockPermissions = [
        {
          get: jest.fn((key) => {
            const data = { id: 1, name: 'Test Permission', action: 'read', moduleId: 2 };
            return data[key as keyof typeof data];
          })
        }
      ];

      MockedModule.findOne.mockResolvedValue(mockModule as any);
      jest.spyOn(userPermissionController as any, 'getUserPermissions').mockResolvedValue(mockPermissions);

      const middleware = userPermissionController.checkPermission('TestModule', 'create');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Permission denied: User does not have create permission for this resource'
        })
      );
    });

    it('should handle missing user', async () => {
      mockRequest.user = undefined;

      const middleware = userPermissionController.checkPermission('TestModule', 'create');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated'
        })
      );
    });

    it('should handle module not found', async () => {
      MockedModule.findOne.mockResolvedValue(null);

      const middleware = userPermissionController.checkPermission('TestModule', 'create');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Module TestModule not found'
        })
      );
    });

    it('should work with numeric module ID', async () => {
      const mockPermissions = [
        {
          get: jest.fn((key) => {
            const data = { id: 1, name: 'Test Permission', action: 'create', moduleId: 1 };
            return data[key as keyof typeof data];
          })
        }
      ];

      jest.spyOn(userPermissionController as any, 'getUserPermissions').mockResolvedValue(mockPermissions);

      const middleware = userPermissionController.checkPermission(1, 'create');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      MockedModule.findOne.mockRejectedValue(error);

      const middleware = userPermissionController.checkPermission('TestModule', 'create');
      await middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
