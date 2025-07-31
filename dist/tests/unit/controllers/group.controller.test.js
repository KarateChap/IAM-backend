"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const group_controller_1 = __importDefault(require("../../../src/controllers/group.controller"));
const services_1 = require("../../../src/services");
// Mock dependencies
jest.mock('express-validator');
jest.mock('../../../src/services');
const mockValidationResult = express_validator_1.validationResult;
const mockGroupService = services_1.groupService;
const mockAuditService = services_1.auditService;
describe('Group Controller', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    let groupController;
    beforeEach(() => {
        mockRequest = {
            params: { id: '1' },
            body: { name: 'Test Group', description: 'Test Description', isActive: true },
            query: {},
            user: { id: 1 }
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        groupController = new group_controller_1.default();
        // Mock validation result as empty (no errors)
        mockValidationResult.mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(true),
            array: jest.fn().mockReturnValue([])
        });
        jest.clearAllMocks();
    });
    describe('getAll', () => {
        it('should successfully get groups with default filters', async () => {
            const mockResult = {
                groups: [
                    {
                        id: 1,
                        name: 'Group 1',
                        description: 'Description 1',
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        roles: [],
                        users: [],
                        userCount: 0,
                        roleCount: 0
                    },
                    {
                        id: 2,
                        name: 'Group 2',
                        description: 'Description 2',
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        roles: [],
                        users: [],
                        userCount: 0,
                        roleCount: 0
                    }
                ],
                total: 2
            };
            mockGroupService.getGroups.mockResolvedValue(mockResult);
            await groupController.getAll(mockRequest, mockResponse, mockNext);
            expect(mockGroupService.getGroups).toHaveBeenCalledWith({
                search: undefined,
                limit: 50,
                offset: 0,
                isActive: undefined,
                hasUsers: undefined,
                hasRoles: undefined,
                sortBy: 'createdAt',
                order: 'DESC'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                data: mockResult.groups
            });
        });
        it('should successfully get groups with custom filters', async () => {
            mockRequest.query = {
                search: 'test',
                limit: '10',
                offset: '5',
                isActive: 'true',
                hasUsers: 'false',
                hasRoles: 'true',
                sortBy: 'name',
                order: 'ASC'
            };
            const mockResult = {
                groups: [{
                        id: 1,
                        name: 'Test Group',
                        description: 'Test Description',
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        roles: [],
                        users: [],
                        userCount: 0,
                        roleCount: 0
                    }],
                total: 1
            };
            mockGroupService.getGroups.mockResolvedValue(mockResult);
            await groupController.getAll(mockRequest, mockResponse, mockNext);
            expect(mockGroupService.getGroups).toHaveBeenCalledWith({
                search: 'test',
                limit: 10,
                offset: 5,
                isActive: true,
                hasUsers: false,
                hasRoles: true,
                sortBy: 'name',
                order: 'ASC'
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                count: 1,
                data: mockResult.groups
            });
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockGroupService.getGroups.mockRejectedValue(error);
            await groupController.getAll(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('getById', () => {
        it('should successfully get group by id', async () => {
            const mockGroup = {
                id: 1,
                name: 'Test Group',
                description: 'Test Description',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                roles: [],
                users: [],
                userCount: 0,
                roleCount: 0
            };
            mockGroupService.getGroupById.mockResolvedValue(mockGroup);
            await groupController.getById(mockRequest, mockResponse, mockNext);
            expect(mockGroupService.getGroupById).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockGroup
            });
        });
        it('should handle validation errors', async () => {
            const validationErrors = [{ param: 'id', msg: 'Invalid ID' }];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(validationErrors)
            });
            await groupController.getById(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation error',
                errors: { id: 'Invalid ID' }
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockGroupService.getGroupById.mockRejectedValue(error);
            await groupController.getById(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('create', () => {
        it('should successfully create a group', async () => {
            const mockGroup = {
                id: 1,
                name: 'Test Group',
                description: 'Test Description',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                roles: [],
                users: [],
                userCount: 0,
                roleCount: 0
            };
            mockGroupService.createGroup.mockResolvedValue(mockGroup);
            mockAuditService.logEvent.mockResolvedValue(undefined);
            await groupController.create(mockRequest, mockResponse, mockNext);
            expect(mockGroupService.createGroup).toHaveBeenCalledWith({
                name: 'Test Group',
                description: 'Test Description',
                isActive: true
            });
            expect(mockAuditService.logEvent).toHaveBeenCalledWith({
                userId: 1,
                action: 'GROUP_CREATED',
                resource: 'groups',
                resourceId: 1,
                details: { name: 'Test Group', description: 'Test Description' }
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Group created successfully',
                data: mockGroup
            });
        });
        it('should handle validation errors', async () => {
            const validationErrors = [{ param: 'name', msg: 'Name is required' }];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(validationErrors)
            });
            await groupController.create(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation error',
                errors: { name: 'Name is required' }
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockGroupService.createGroup.mockRejectedValue(error);
            await groupController.create(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('update', () => {
        it('should successfully update a group', async () => {
            const mockGroup = {
                id: 1,
                name: 'Updated Group',
                description: 'Updated Description',
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                roles: [],
                users: [],
                userCount: 0,
                roleCount: 0
            };
            mockGroupService.updateGroup.mockResolvedValue(mockGroup);
            mockAuditService.logEvent.mockResolvedValue(undefined);
            mockRequest.body = { name: 'Updated Group', description: 'Updated Description', isActive: false };
            await groupController.update(mockRequest, mockResponse, mockNext);
            expect(mockGroupService.updateGroup).toHaveBeenCalledWith(1, {
                name: 'Updated Group',
                description: 'Updated Description',
                isActive: false
            });
            expect(mockAuditService.logEvent).toHaveBeenCalledWith({
                userId: 1,
                action: 'GROUP_UPDATED',
                resource: 'groups',
                resourceId: 1,
                details: { name: 'Updated Group', description: 'Updated Description', isActive: false }
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Group updated successfully',
                data: mockGroup
            });
        });
        it('should handle validation errors', async () => {
            const validationErrors = [{ param: 'name', msg: 'Name is required' }];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(validationErrors)
            });
            await groupController.update(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation error',
                errors: { name: 'Name is required' }
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockGroupService.updateGroup.mockRejectedValue(error);
            await groupController.update(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('delete', () => {
        it('should successfully delete a group', async () => {
            mockGroupService.deleteGroup.mockResolvedValue(undefined);
            mockAuditService.logEvent.mockResolvedValue(undefined);
            await groupController.delete(mockRequest, mockResponse, mockNext);
            expect(mockGroupService.deleteGroup).toHaveBeenCalledWith(1);
            expect(mockAuditService.logEvent).toHaveBeenCalledWith({
                userId: 1,
                action: 'GROUP_DELETED',
                resource: 'groups',
                resourceId: 1
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Group deleted successfully'
            });
        });
        it('should handle validation errors', async () => {
            const validationErrors = [{ param: 'id', msg: 'Invalid ID' }];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(validationErrors)
            });
            await groupController.delete(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation error',
                errors: { id: 'Invalid ID' }
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockGroupService.deleteGroup.mockRejectedValue(error);
            await groupController.delete(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('getStatistics', () => {
        it('should successfully get group statistics', async () => {
            const mockStatistics = {
                total: 10,
                active: 8,
                inactive: 2,
                withUsers: 5,
                withoutUsers: 5,
                withRoles: 6,
                withoutRoles: 4,
                averageUsersPerGroup: 2.5,
                averageRolesPerGroup: 1.8
            };
            mockGroupService.getGroupStatistics.mockResolvedValue(mockStatistics);
            await groupController.getStatistics(mockRequest, mockResponse, mockNext);
            expect(mockGroupService.getGroupStatistics).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockStatistics
            });
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockGroupService.getGroupStatistics.mockRejectedValue(error);
            await groupController.getStatistics(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
