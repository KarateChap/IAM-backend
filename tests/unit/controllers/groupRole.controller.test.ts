import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../../../src/utils/errors';

// Create mock instances first
const mockGroupRoleServiceInstance = {
  assignRolesToGroup: jest.fn(),
  removeRolesFromGroup: jest.fn(),
  getGroupRoles: jest.fn(),
  groupHasRole: jest.fn(),
  getGroupsWithRole: jest.fn(),
  replaceGroupRoles: jest.fn()
};

const mockAuditServiceInstance = {
  logEvent: jest.fn()
};

// Mock the services before importing the controller
jest.mock('../../../src/services/groupRole.service', () => ({
  GroupRoleService: jest.fn().mockImplementation(() => mockGroupRoleServiceInstance)
}));

jest.mock('../../../src/services/audit.service', () => mockAuditServiceInstance);

jest.mock('express-validator');

// Import controller functions AFTER mocks
import { assignRolesToGroup, removeRolesFromGroup, getGroupRoles } from '../../../src/controllers/groupRole.controller';

const mockValidationResult = validationResult as jest.MockedFunction<typeof validationResult>;

describe('GroupRole Controller', () => {
  let mockRequest: Partial<Request & { user?: any }>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      params: { groupId: '1' },
      body: { roleIds: [1, 2] },
      user: { id: 1 }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();

    // Mock validation result as empty (no errors)
    mockValidationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    } as any);
  });

  describe('assignRolesToGroup', () => {
    it('should successfully assign roles to group', async () => {
      const mockResult = {
        assigned: 2,
        skipped: 0,
        details: [
          { roleId: 1, roleName: 'Admin', status: 'assigned' },
          { roleId: 2, roleName: 'User', status: 'assigned' }
        ]
      };

      mockGroupRoleServiceInstance.assignRolesToGroup.mockResolvedValue(mockResult);
      mockAuditServiceInstance.logEvent.mockResolvedValue(undefined);

      await assignRolesToGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockGroupRoleServiceInstance.assignRolesToGroup).toHaveBeenCalledWith(1, [1, 2]);
      expect(mockAuditServiceInstance.logEvent).toHaveBeenCalledWith({
        action: 'ASSIGN_ROLES_TO_GROUP',
        userId: 1,
        resource: 'Group',
        resourceId: 1,
        details: {
          assigned: 2,
          skipped: 0,
          roleDetails: mockResult.details
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Roles assigned to group successfully',
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const mockErrors = [
        { path: 'roleIds', param: 'roleIds', msg: 'roleIds must be an array' },
        { param: 'groupId', msg: 'groupId must be a number' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      await assignRolesToGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockGroupRoleServiceInstance.assignRolesToGroup).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const serviceError = new Error('Service error');
      mockGroupRoleServiceInstance.assignRolesToGroup.mockRejectedValue(serviceError);

      await assignRolesToGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it('should handle empty assignment results', async () => {
      const mockResult = {
        assigned: 2,
        skipped: 0,
        details: []
      };

      mockGroupRoleServiceInstance.assignRolesToGroup.mockResolvedValue(mockResult);
      mockAuditServiceInstance.logEvent.mockResolvedValue(undefined);

      await assignRolesToGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuditServiceInstance.logEvent).toHaveBeenCalledWith({
        action: 'ASSIGN_ROLES_TO_GROUP',
        userId: 1,
        resource: 'Group',
        resourceId: 1,
        details: {
          assigned: 2,
          skipped: 0,
          roleDetails: []
        }
      });
    });
  });

  describe('removeRolesFromGroup', () => {
    it('should successfully remove roles from group', async () => {
      const mockResult = {
        removed: 2,
        details: [
          { roleId: 1, roleName: 'Admin', status: 'removed' },
          { roleId: 2, roleName: 'User', status: 'removed' }
        ]
      };

      mockGroupRoleServiceInstance.removeRolesFromGroup.mockResolvedValue(mockResult);
      mockAuditServiceInstance.logEvent.mockResolvedValue(undefined);

      await removeRolesFromGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockGroupRoleServiceInstance.removeRolesFromGroup).toHaveBeenCalledWith(1, [1, 2]);
      expect(mockAuditServiceInstance.logEvent).toHaveBeenCalledWith({
        action: 'REMOVE_ROLES_FROM_GROUP',
        userId: 1,
        resource: 'Group',
        resourceId: 1,
        details: {
          removed: 2,
          roleDetails: mockResult.details
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Roles removed from group successfully',
        data: mockResult
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation errors in removeRolesFromGroup', async () => {
      const mockErrors = [
        { path: 'roleIds', param: 'roleIds', msg: 'roleIds must be an array' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      await removeRolesFromGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(mockGroupRoleServiceInstance.removeRolesFromGroup).not.toHaveBeenCalled();
    });

    it('should handle service errors in removeRolesFromGroup', async () => {
      const serviceError = new Error('Service error');
      mockGroupRoleServiceInstance.removeRolesFromGroup.mockRejectedValue(serviceError);

      await removeRolesFromGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getGroupRoles', () => {
    it('should successfully get group roles', async () => {
      const mockRoles = [
        { id: 1, name: 'Admin', description: 'Administrator role' },
        { id: 2, name: 'User', description: 'Regular user role' }
      ];
      mockGroupRoleServiceInstance.getGroupRoles.mockResolvedValue(mockRoles);

      await getGroupRoles(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockGroupRoleServiceInstance.getGroupRoles).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Group roles retrieved successfully',
        data: {
          groupId: 1,
          roles: mockRoles,
          count: 2
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors in getGroupRoles', async () => {
      const serviceError = new Error('Service error');
      mockGroupRoleServiceInstance.getGroupRoles.mockRejectedValue(serviceError);

      await getGroupRoles(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it('should return empty roles array', async () => {
      mockGroupRoleServiceInstance.getGroupRoles.mockResolvedValue([]);

      await getGroupRoles(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Group roles retrieved successfully',
        data: {
          groupId: 1,
          roles: [],
          count: 0
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should format validation errors correctly', async () => {
      const mockErrors = [
        { path: 'roleIds', param: 'roleIds', msg: 'roleIds must be an array' },
        { param: 'groupId', msg: 'groupId must be a number' }
      ];

      mockValidationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors)
      } as any);

      await assignRolesToGroup(mockRequest as Request, mockResponse as Response, mockNext);

      const validationError = (mockNext as jest.MockedFunction<NextFunction>).mock.calls[0][0] as unknown as ValidationError;
      expect(validationError).toBeInstanceOf(ValidationError);
      expect(validationError.errors).toEqual({
        roleIds: 'roleIds must be an array',
        groupId: 'groupId must be a number'
      });
    });

    it('should handle missing user in request', async () => {
      mockRequest.user = undefined;

      await assignRolesToGroup(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuditServiceInstance.logEvent).not.toHaveBeenCalled();
    });
  });
});
