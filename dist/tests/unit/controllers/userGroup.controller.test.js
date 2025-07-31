"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("../../../src/utils/errors");
// Create a mock instance that will be returned by the constructor
const mockUserGroupServiceInstance = {
    assignUsersToGroup: jest.fn(),
    removeUsersFromGroup: jest.fn(),
    getGroupUsers: jest.fn(),
    getUserGroups: jest.fn(),
    userInGroup: jest.fn(),
    getActiveGroupUsers: jest.fn(),
    replaceGroupUsers: jest.fn()
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
// Mock UserGroupService class before importing the controller
jest.mock('../../../src/services/userGroup.service', () => ({
    UserGroupService: jest.fn().mockImplementation(() => mockUserGroupServiceInstance)
}));
// Import the controller functions AFTER setting up the mocks
const userGroup_controller_1 = require("../../../src/controllers/userGroup.controller");
describe('UserGroup Controller', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    beforeEach(() => {
        mockRequest = {
            params: { groupId: '1' },
            body: { userIds: [1, 2] },
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
        });
        jest.clearAllMocks();
    });
    describe('assignUsersToGroup', () => {
        it('should successfully assign users to group', async () => {
            const mockResult = {
                assigned: 2,
                skipped: 0,
                details: [
                    { userId: 1, username: 'user1', email: 'user1@test.com', status: 'assigned' },
                    { userId: 2, username: 'user2', email: 'user2@test.com', status: 'assigned' }
                ]
            };
            mockUserGroupServiceInstance.assignUsersToGroup.mockResolvedValue(mockResult);
            mockAuditService.logEvent.mockResolvedValue(undefined);
            await (0, userGroup_controller_1.assignUsersToGroup)(mockRequest, mockResponse, mockNext);
            expect(mockUserGroupServiceInstance.assignUsersToGroup).toHaveBeenCalledWith(1, [1, 2]);
            expect(mockAuditService.logEvent).toHaveBeenCalledWith({
                action: 'ASSIGN_USERS_TO_GROUP',
                userId: 1,
                resource: 'Group',
                resourceId: 1,
                details: {
                    assigned: 2,
                    skipped: 0,
                    userDetails: mockResult.details
                }
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Users assigned to group successfully',
                data: mockResult
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should handle validation errors', async () => {
            const mockErrors = [
                { path: 'userIds', param: 'userIds', msg: 'userIds is required' }
            ];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(mockErrors)
            });
            await (0, userGroup_controller_1.assignUsersToGroup)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(errors_1.ValidationError));
            expect(mockUserGroupServiceInstance.assignUsersToGroup).not.toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should handle service errors', async () => {
            const serviceError = new Error('Service error');
            mockUserGroupServiceInstance.assignUsersToGroup.mockRejectedValue(serviceError);
            await (0, userGroup_controller_1.assignUsersToGroup)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(serviceError);
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should handle missing user in request', async () => {
            mockRequest.user = undefined;
            const mockResult = {
                assigned: 2,
                skipped: 0,
                details: []
            };
            mockUserGroupServiceInstance.assignUsersToGroup.mockResolvedValue(mockResult);
            mockAuditService.logEvent.mockResolvedValue(undefined);
            await (0, userGroup_controller_1.assignUsersToGroup)(mockRequest, mockResponse, mockNext);
            expect(mockAuditService.logEvent).toHaveBeenCalledWith({
                action: 'ASSIGN_USERS_TO_GROUP',
                userId: undefined,
                resource: 'Group',
                resourceId: 1,
                details: {
                    assigned: 2,
                    skipped: 0,
                    userDetails: []
                }
            });
        });
    });
    describe('removeUsersFromGroup', () => {
        it('should successfully remove users from group', async () => {
            const mockResult = {
                removed: 2,
                notFound: 0,
                details: [
                    { userId: 1, username: 'user1', email: 'user1@test.com', status: 'removed' },
                    { userId: 2, username: 'user2', email: 'user2@test.com', status: 'removed' }
                ]
            };
            mockUserGroupServiceInstance.removeUsersFromGroup.mockResolvedValue(mockResult);
            mockAuditService.logEvent.mockResolvedValue(undefined);
            await (0, userGroup_controller_1.removeUsersFromGroup)(mockRequest, mockResponse, mockNext);
            expect(mockUserGroupServiceInstance.removeUsersFromGroup).toHaveBeenCalledWith(1, [1, 2]);
            expect(mockAuditService.logEvent).toHaveBeenCalledWith({
                action: 'REMOVE_USERS_FROM_GROUP',
                userId: 1,
                resource: 'Group',
                resourceId: 1,
                details: {
                    removed: 2,
                    notFound: 0,
                    userDetails: mockResult.details
                }
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Users removed from group successfully',
                data: mockResult
            });
        });
        it('should handle validation errors in removeUsersFromGroup', async () => {
            const mockErrors = [
                { path: 'userIds', param: 'userIds', msg: 'userIds is required' }
            ];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(mockErrors)
            });
            await (0, userGroup_controller_1.removeUsersFromGroup)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.any(errors_1.ValidationError));
            expect(mockUserGroupServiceInstance.removeUsersFromGroup).not.toHaveBeenCalled();
        });
        it('should handle service errors in removeUsersFromGroup', async () => {
            const serviceError = new Error('Service error');
            mockUserGroupServiceInstance.removeUsersFromGroup.mockRejectedValue(serviceError);
            await (0, userGroup_controller_1.removeUsersFromGroup)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(serviceError);
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
    describe('getGroupUsers', () => {
        it('should successfully get group users', async () => {
            const mockUsers = [
                { id: 1, username: 'user1', email: 'user1@test.com' },
                { id: 2, username: 'user2', email: 'user2@test.com' }
            ];
            mockUserGroupServiceInstance.getGroupUsers.mockResolvedValue(mockUsers);
            await (0, userGroup_controller_1.getGroupUsers)(mockRequest, mockResponse, mockNext);
            expect(mockUserGroupServiceInstance.getGroupUsers).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Group users retrieved successfully',
                data: {
                    groupId: 1,
                    users: mockUsers,
                    count: 2
                }
            });
        });
        it('should handle service errors in getGroupUsers', async () => {
            const serviceError = new Error('Service error');
            mockUserGroupServiceInstance.getGroupUsers.mockRejectedValue(serviceError);
            await (0, userGroup_controller_1.getGroupUsers)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(serviceError);
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should return empty users array', async () => {
            mockUserGroupServiceInstance.getGroupUsers.mockResolvedValue([]);
            await (0, userGroup_controller_1.getGroupUsers)(mockRequest, mockResponse, mockNext);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Group users retrieved successfully',
                data: {
                    groupId: 1,
                    users: [],
                    count: 0
                }
            });
        });
    });
    describe('getUserGroups', () => {
        it('should successfully get user groups', async () => {
            mockRequest.params = { userId: '1' };
            const mockGroups = [
                { id: 1, name: 'Group 1', description: 'Test Group 1' },
                { id: 2, name: 'Group 2', description: 'Test Group 2' }
            ];
            mockUserGroupServiceInstance.getUserGroups.mockResolvedValue(mockGroups);
            await (0, userGroup_controller_1.getUserGroups)(mockRequest, mockResponse, mockNext);
            expect(mockUserGroupServiceInstance.getUserGroups).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'User groups retrieved successfully',
                data: {
                    userId: 1,
                    groups: mockGroups,
                    count: 2
                }
            });
        });
        it('should handle service errors in getUserGroups', async () => {
            mockRequest.params = { userId: '1' };
            const serviceError = new Error('Service error');
            mockUserGroupServiceInstance.getUserGroups.mockRejectedValue(serviceError);
            await (0, userGroup_controller_1.getUserGroups)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(serviceError);
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should return empty groups array', async () => {
            mockRequest.params = { userId: '1' };
            mockUserGroupServiceInstance.getUserGroups.mockResolvedValue([]);
            await (0, userGroup_controller_1.getUserGroups)(mockRequest, mockResponse, mockNext);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'User groups retrieved successfully',
                data: {
                    userId: 1,
                    groups: [],
                    count: 0
                }
            });
        });
    });
    describe('Error handling', () => {
        it('should format validation errors correctly', async () => {
            const mockErrors = [
                { path: 'userIds', param: 'userIds', msg: 'userIds must be an array' },
                { param: 'groupId', msg: 'groupId must be a number' }
            ];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(mockErrors)
            });
            await (0, userGroup_controller_1.assignUsersToGroup)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation failed',
                errors: {
                    'userIds': 'userIds must be an array',
                    'groupId': 'groupId must be a number'
                }
            }));
        });
        it('should handle errors without path property', async () => {
            const mockErrors = [
                { param: 'userIds', msg: 'userIds is required' }
            ];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(mockErrors)
            });
            await (0, userGroup_controller_1.assignUsersToGroup)(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                errors: {
                    'userIds': 'userIds is required'
                }
            }));
        });
    });
});
