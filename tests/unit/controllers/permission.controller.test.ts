import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import PermissionController from '../../../src/controllers/permission.controller';
import { permissionService, auditService } from '../../../src/services';
import { ValidationError, InternalServerError } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('express-validator');
jest.mock('../../../src/services');

const mockValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;
const mockPermissionService = permissionService as jest.Mocked<typeof permissionService>;
const mockAuditService = auditService as jest.Mocked<typeof auditService>;

describe('Permission Controller', () => {
  let mockRequest: Partial<Request & { user?: any }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let permissionController: PermissionController;

  beforeEach(() => {
    mockRequest = {
      params: { id: '1' },
      body: { name: 'Test Permission', description: 'Test Description', action: 'create', moduleId: 1 },
      query: {},
      user: { id: 1 }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    permissionController = new PermissionController();

    // Mock validation result as empty (no errors)
    mockValidationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    } as any);

    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should successfully get permissions with default filters', async () => {
      const mockResult = {
        permissions: [
          {
            id: 1,
            name: 'Permission 1',
            description: 'Description 1',
            action: 'create' as const,
            moduleId: 1,
            isActive: true,
            module: { id: 1, name: 'Module 1' },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 2,
            name: 'Permission 2',
            description: 'Description 2',
            action: 'read' as const,
            moduleId: 1,
            isActive: true,
            module: { id: 1, name: 'Module 1' },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        total: 2
      };

      mockPermissionService.getPermissions.mockResolvedValue(mockResult);

      await permissionController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockPermissionService.getPermissions).toHaveBeenCalledWith({
        search: undefined,
        moduleId: undefined,
        action: undefined,
        limit: 10,
        offset: 0,
        sortBy: 'createdAt',
        order: 'DESC'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockResult.permissions
      });
    });

    it('should successfully get permissions with custom filters', async () => {
      mockRequest.query = {
        search: 'test',
        moduleId: '1',
        action: 'create',
        limit: '5',
        offset: '10',
        sortBy: 'name',
        order: 'ASC'
      };

      const mockResult = {
        permissions: [{
          id: 1,
          name: 'Test Permission',
          description: 'Test Description',
          action: 'create' as const,
          moduleId: 1,
          isActive: true,
          module: { id: 1, name: 'Module 1' },
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        total: 1
      };

      mockPermissionService.getPermissions.mockResolvedValue(mockResult);

      await permissionController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockPermissionService.getPermissions).toHaveBeenCalledWith({
        search: 'test',
        moduleId: 1,
        action: 'create',
        limit: 5,
        offset: 10,
        sortBy: 'name',
        order: 'ASC'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockResult.permissions
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockPermissionService.getPermissions.mockRejectedValue(error);

      await permissionController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to fetch permissions'
        })
      );
    });
  });

  describe('getById', () => {
    it('should successfully get permission by id', async () => {
      const mockPermission = {
        id: 1,
        name: 'Test Permission',
        description: 'Test Description',
        action: 'create' as const,
        moduleId: 1,
        isActive: true,
        module: { id: 1, name: 'Module 1' },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPermissionService.getPermissionById.mockResolvedValue(mockPermission);

      await permissionController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockPermissionService.getPermissionById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPermission
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [{ param: 'id', msg: 'Invalid ID' }];
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      } as any);

      await permissionController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to fetch permission'
        })
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockPermissionService.getPermissionById.mockRejectedValue(error);

      await permissionController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to fetch permission'
        })
      );
    });
  });

  describe('create', () => {
    it('should successfully create a permission', async () => {
      const mockPermission = {
        id: 1,
        name: 'Test Permission',
        description: 'Test Description',
        action: 'create' as const,
        moduleId: 1,
        isActive: true,
        module: { id: 1, name: 'Module 1' },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPermissionService.createPermission.mockResolvedValue(mockPermission);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await permissionController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockPermissionService.createPermission).toHaveBeenCalledWith({
        name: 'Test Permission',
        description: 'Test Description',
        action: 'create',
        moduleId: 1
      });
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 1,
        action: 'create',
        resource: 'Permission',
        resourceId: 1,
        details: { message: 'Created permission: Test Permission' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Permission created successfully',
        data: mockPermission
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [{ param: 'name', msg: 'Name is required' }];
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      } as any);

      await permissionController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
          errors: { name: 'Name is required' }
        })
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockPermissionService.createPermission.mockRejectedValue(error);

      await permissionController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle missing user in request', async () => {
      mockRequest.user = undefined;
      const mockPermission = {
        id: 1,
        name: 'Test Permission',
        description: 'Test Description',
        action: 'create' as const,
        moduleId: 1,
        isActive: true,
        module: { id: 1, name: 'Module 1' },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPermissionService.createPermission.mockResolvedValue(mockPermission);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await permissionController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 0,
        action: 'create',
        resource: 'Permission',
        resourceId: 1,
        details: { message: 'Created permission: Test Permission' }
      });
    });
  });

  describe('update', () => {
    it('should successfully update a permission', async () => {
      const mockPermission = {
        id: 1,
        name: 'Updated Permission',
        description: 'Updated Description',
        action: 'update' as const,
        moduleId: 1,
        isActive: true,
        module: { id: 1, name: 'Module 1' },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPermissionService.updatePermission.mockResolvedValue(mockPermission);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      mockRequest.body = { name: 'Updated Permission', description: 'Updated Description', action: 'update' };

      await permissionController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockPermissionService.updatePermission).toHaveBeenCalledWith(1, {
        name: 'Updated Permission',
        description: 'Updated Description',
        action: 'update'
      });
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 1,
        action: 'update',
        resource: 'Permission',
        resourceId: 1,
        details: { message: 'Updated permission: Updated Permission' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Permission updated successfully',
        data: mockPermission
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [{ param: 'name', msg: 'Name is required' }];
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      } as any);

      await permissionController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to update permission'
        })
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockPermissionService.updatePermission.mockRejectedValue(error);

      await permissionController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to update permission'
        })
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete a permission', async () => {
      const mockPermission = {
        id: 1,
        name: 'Test Permission',
        description: 'Test Description',
        action: 'create' as const,
        moduleId: 1,
        isActive: true,
        module: { id: 1, name: 'Module 1' },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPermissionService.getPermissionById.mockResolvedValue(mockPermission);
      mockPermissionService.deletePermission.mockResolvedValue(undefined);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await permissionController.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockPermissionService.getPermissionById).toHaveBeenCalledWith(1);
      expect(mockPermissionService.deletePermission).toHaveBeenCalledWith(1);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 1,
        action: 'delete',
        resource: 'Permission',
        resourceId: 1,
        details: { message: 'Deleted permission: Test Permission' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Permission deleted successfully'
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [{ param: 'id', msg: 'Invalid ID' }];
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      } as any);

      await permissionController.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to delete permission'
        })
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockPermissionService.getPermissionById.mockRejectedValue(error);

      await permissionController.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to delete permission'
        })
      );
    });
  });
});
