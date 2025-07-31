import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import RoleController from '../../../src/controllers/role.controller';
import { roleService, auditService } from '../../../src/services';
import { ValidationError, InternalServerError } from '../../../src/utils/errors';

// Mock dependencies
jest.mock('express-validator');
jest.mock('../../../src/services');

const mockValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;
const mockRoleService = roleService as jest.Mocked<typeof roleService>;
const mockAuditService = auditService as jest.Mocked<typeof auditService>;

describe('Role Controller', () => {
  let mockRequest: Partial<Request & { user?: any }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let roleController: RoleController;

  beforeEach(() => {
    mockRequest = {
      params: { id: '1' },
      body: { name: 'Test Role', description: 'Test Description', isActive: true },
      query: {},
      user: { id: 1 }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    roleController = new RoleController();

    // Mock validation result as empty (no errors)
    mockValidationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    } as any);

    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should successfully get roles with default filters', async () => {
      const mockResult = {
        roles: [
          {
            id: 1,
            name: 'Role 1',
            description: 'Description 1',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [],
            groups: [],
            permissionCount: 0,
            groupCount: 0
          },
          {
            id: 2,
            name: 'Role 2',
            description: 'Description 2',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [],
            groups: [],
            permissionCount: 0,
            groupCount: 0
          }
        ],
        total: 2
      };

      mockRoleService.getRoles.mockResolvedValue(mockResult);

      await roleController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRoleService.getRoles).toHaveBeenCalledWith({
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
        data: mockResult.roles
      });
    });

    it('should successfully get roles with custom filters', async () => {
      mockRequest.query = {
        search: 'test',
        limit: '5',
        offset: '10',
        sortBy: 'name',
        order: 'ASC'
      };

      const mockResult = {
        roles: [{
          id: 1,
          name: 'Test Role',
          description: 'Test Description',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: [],
          groups: [],
          permissionCount: 0,
          groupCount: 0
        }],
        total: 1
      };

      mockRoleService.getRoles.mockResolvedValue(mockResult);

      await roleController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRoleService.getRoles).toHaveBeenCalledWith({
        search: 'test',
        limit: 5,
        offset: 10,
        sortBy: 'name',
        order: 'ASC'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockResult.roles
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockRoleService.getRoles.mockRejectedValue(error);

      await roleController.getAll(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to fetch roles'
        })
      );
    });
  });

  describe('getById', () => {
    it('should successfully get role by id', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'Test Description',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
        groups: [],
        permissionCount: 0,
        groupCount: 0
      };
      mockRoleService.getRoleById.mockResolvedValue(mockRole);

      await roleController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRoleService.getRoleById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockRole
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [{ param: 'id', msg: 'Invalid ID' }];
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      } as any);

      await roleController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to fetch role'
        })
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockRoleService.getRoleById.mockRejectedValue(error);

      await roleController.getById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to fetch role'
        })
      );
    });
  });

  describe('create', () => {
    it('should successfully create a role', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'Test Description',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
        groups: [],
        permissionCount: 0,
        groupCount: 0
      };
      mockRoleService.createRole.mockResolvedValue(mockRole);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await roleController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRoleService.createRole).toHaveBeenCalledWith({
        name: 'Test Role',
        description: 'Test Description',
        isActive: true
      });
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 1,
        action: 'create',
        resource: 'Role',
        resourceId: 1,
        details: { message: 'Created role: Test Role' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Role created successfully',
        data: mockRole
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [{ param: 'name', msg: 'Name is required' }];
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      } as any);

      await roleController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to create role'
        })
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockRoleService.createRole.mockRejectedValue(error);

      await roleController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to create role'
        })
      );
    });

    it('should handle missing user in request', async () => {
      mockRequest.user = undefined;
      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'Test Description',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
        groups: [],
        permissionCount: 0,
        groupCount: 0
      };
      mockRoleService.createRole.mockResolvedValue(mockRole);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await roleController.create(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 0,
        action: 'create',
        resource: 'Role',
        resourceId: 1,
        details: { message: 'Created role: Test Role' }
      });
    });
  });

  describe('update', () => {
    it('should successfully update a role', async () => {
      const mockRole = {
        id: 1,
        name: 'Updated Role',
        description: 'Updated Description',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
        groups: [],
        permissionCount: 0,
        groupCount: 0
      };
      mockRoleService.updateRole.mockResolvedValue(mockRole);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      mockRequest.body = { name: 'Updated Role', description: 'Updated Description', isActive: false };

      await roleController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRoleService.updateRole).toHaveBeenCalledWith(1, {
        name: 'Updated Role',
        description: 'Updated Description',
        isActive: false
      });
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 1,
        action: 'update',
        resource: 'Role',
        resourceId: 1,
        details: {
          message: 'Updated role: Updated Role',
          changes: { name: 'Updated Role', description: 'Updated Description', isActive: false }
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Role updated successfully',
        data: mockRole
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [{ param: 'name', msg: 'Name is required' }];
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      } as any);

      await roleController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to update role'
        })
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockRoleService.updateRole.mockRejectedValue(error);

      await roleController.update(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to update role'
        })
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete a role', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'Test Description',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
        groups: [],
        permissionCount: 0,
        groupCount: 0
      };
      mockRoleService.getRoleById.mockResolvedValue(mockRole);
      mockRoleService.hardDeleteRole.mockResolvedValue(undefined);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await roleController.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRoleService.getRoleById).toHaveBeenCalledWith(1);
      expect(mockRoleService.hardDeleteRole).toHaveBeenCalledWith(1);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        userId: 1,
        action: 'delete',
        resource: 'Role',
        resourceId: 1,
        details: { message: 'Deleted role: Test Role' }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Role deleted successfully'
      });
    });

    it('should handle validation errors', async () => {
      const validationErrors = [{ param: 'id', msg: 'Invalid ID' }];
      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors)
      } as any);

      await roleController.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to delete role'
        })
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockRoleService.getRoleById.mockRejectedValue(error);

      await roleController.delete(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to delete role'
        })
      );
    });
  });
});
