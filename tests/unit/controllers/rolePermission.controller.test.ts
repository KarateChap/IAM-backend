import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../../src/utils/errors';

// Create a mock instance that will be returned by the constructor
const mockRolePermissionServiceInstance = {
  assignPermissionsToRole: jest.fn(),
  removePermissionsFromRole: jest.fn(),
  getRolePermissions: jest.fn(),
  roleHasPermission: jest.fn(),
  getRolesWithPermission: jest.fn(),
  replaceRolePermissions: jest.fn(),
  getRolePermissionsByModule: jest.fn()
};

// Mock express-validator
const mockValidationResult = jest.fn();
jest.mock('express-validator', () => ({
  validationResult: mockValidationResult
}));

// Mock the audit service directly
const mockAuditService = {
  logEvent: jest.fn()
};
jest.mock('../../../src/services/audit.service', () => mockAuditService);

// Mock RolePermissionService class before importing the controller
jest.mock('../../../src/services/rolePermission.service', () => ({
  RolePermissionService: jest.fn().mockImplementation(() => mockRolePermissionServiceInstance)
}));

// Import the controller functions AFTER setting up the mocks
import { assignPermissionsToRole, removePermissionsFromRole, getRolePermissions } from '../../../src/controllers/rolePermission.controller';

describe('RolePermission Controller', () => {
  let mockRequest: Partial<Request & { user?: any }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: { roleId: '1' },
      body: { permissionIds: [1, 2] },
      user: { id: 1 }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // Mock validation result as empty (no errors)
    mockValidationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    } as any);

    jest.clearAllMocks();
  });

  describe('assignPermissionsToRole', () => {
    it('should successfully assign permissions to role', async () => {
      const mockResult = {
        assigned: 2,
        skipped: 0,
        details: [{
          permissionId: 1,
          permissionAction: 'create',
          moduleName: 'Users',
          status: 'assigned' as const
        }]
      };

      mockRolePermissionServiceInstance.assignPermissionsToRole.mockResolvedValue(mockResult);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await assignPermissionsToRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRolePermissionServiceInstance.assignPermissionsToRole).toHaveBeenCalledWith(1, [1, 2]);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        action: 'ASSIGN_PERMISSIONS_TO_ROLE',
        userId: 1,
        resource: 'Role',
        resourceId: 1,
        details: {
          assigned: 2,
          skipped: 0,
          permissionDetails: mockResult.details
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Permissions assigned to role successfully',
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const mockErrors = [
        { path: 'permissionIds', param: 'permissionIds', msg: 'permissionIds is required' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      await assignPermissionsToRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ValidationError)
      );
      expect(mockRolePermissionServiceInstance.assignPermissionsToRole).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Service error');
      mockRolePermissionServiceInstance.assignPermissionsToRole.mockRejectedValue(serviceError);

      await assignPermissionsToRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle moduleId parameter', async () => {
      mockRequest.body = { permissionIds: [1, 2], moduleId: 3 };

      const mockResult = {
        assigned: 2,
        skipped: 0,
        details: []
      };

      mockRolePermissionServiceInstance.assignPermissionsToRole.mockResolvedValue(mockResult);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await assignPermissionsToRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRolePermissionServiceInstance.assignPermissionsToRole).toHaveBeenCalledWith(1, [1, 2]);
    });


  });

  describe('removePermissionsFromRole', () => {
    it('should successfully remove permissions from role', async () => {
      const mockResult = {
        removed: 2,
        notFound: 0,
        details: [
          { permissionId: 1, permissionAction: 'create', moduleName: 'Users', status: 'removed' as const },
          { permissionId: 2, permissionAction: 'read', moduleName: 'Users', status: 'removed' as const }
        ]
      };

      mockRolePermissionServiceInstance.removePermissionsFromRole.mockResolvedValue(mockResult);
      mockAuditService.logEvent.mockResolvedValue(undefined);

      await removePermissionsFromRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRolePermissionServiceInstance.removePermissionsFromRole).toHaveBeenCalledWith(1, [1, 2]);
      expect(mockAuditService.logEvent).toHaveBeenCalledWith({
        action: 'REMOVE_PERMISSIONS_FROM_ROLE',
        userId: 1,
        resource: 'Role',
        resourceId: 1,
        details: {
          removed: 2,
          notFound: 0,
          permissionDetails: mockResult.details
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Permissions removed from role successfully',
        data: mockResult
      });
    });

    it('should handle validation errors in removePermissionsFromRole', async () => {
      const mockErrors = [
        { path: 'permissionIds', param: 'permissionIds', msg: 'permissionIds is required' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      await removePermissionsFromRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ValidationError)
      );
      expect(mockRolePermissionServiceInstance.removePermissionsFromRole).not.toHaveBeenCalled();
    });

    it('should handle service errors in removePermissionsFromRole', async () => {
      const serviceError = new Error('Service error');
      mockRolePermissionServiceInstance.removePermissionsFromRole.mockRejectedValue(serviceError);

      await removePermissionsFromRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('getRolePermissions', () => {
    it('should successfully get role permissions', async () => {
      const mockPermissions = [
        { id: 1, name: 'Permission 1', action: 'create' },
        { id: 2, name: 'Permission 2', action: 'read' }
      ];

      mockRolePermissionServiceInstance.getRolePermissions.mockResolvedValue(mockPermissions as any);

      await getRolePermissions(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRolePermissionServiceInstance.getRolePermissions).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Role permissions retrieved successfully',
        data: {
          roleId: 1,
          permissions: mockPermissions,
          count: 2
        }
      });
    });

    it('should handle moduleId query parameter', async () => {
      mockRequest.query = { moduleId: '3' };

      const mockPermissions = [
        { id: 1, name: 'Permission 1', action: 'create' }
      ];

      mockRolePermissionServiceInstance.getRolePermissions.mockResolvedValue(mockPermissions as any);

      await getRolePermissions(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRolePermissionServiceInstance.getRolePermissions).toHaveBeenCalledWith(1);
    });

    it('should handle service errors in getRolePermissions', async () => {
      const serviceError = new Error('Service error');
      mockRolePermissionServiceInstance.getRolePermissions.mockRejectedValue(serviceError);

      await getRolePermissions(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return empty permissions array', async () => {
      mockRolePermissionServiceInstance.getRolePermissions.mockResolvedValue([]);

      await getRolePermissions(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Role permissions retrieved successfully',
        data: {
          roleId: 1,
          permissions: [],
          count: 0
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should format validation errors correctly', async () => {
      const mockErrors = [
        { path: 'permissionIds', param: 'permissionIds', msg: 'permissionIds must be an array' },
        { param: 'roleId', msg: 'roleId must be a number' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      await assignPermissionsToRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          errors: {
            'permissionIds': 'permissionIds must be an array',
            'roleId': 'roleId must be a number'
          }
        })
      );
    });

    it('should handle errors without path property', async () => {
      const mockErrors = [
        { param: 'permissionIds', msg: 'permissionIds is required' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      await assignPermissionsToRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: {
            'permissionIds': 'permissionIds is required'
          }
        })
      );
    });
  });
});
