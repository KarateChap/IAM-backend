"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const userPermission_controller_1 = __importDefault(require("../../../src/controllers/userPermission.controller"));
const user_model_1 = __importDefault(require("../../../src/models/user.model"));
const group_model_1 = require("../../../src/models/group.model");
const role_model_1 = require("../../../src/models/role.model");
const module_model_1 = require("../../../src/models/module.model");
// Mock dependencies
jest.mock('express-validator');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/role.model');
jest.mock('../../../src/models/permission.model');
jest.mock('../../../src/models/module.model');
const mockValidationResult = express_validator_1.validationResult;
const MockedUser = user_model_1.default;
const MockedGroup = group_model_1.Group;
const MockedRole = role_model_1.Role;
const MockedModule = module_model_1.Module;
describe('UserPermission Controller', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    let userPermissionController;
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
        userPermissionController = new userPermission_controller_1.default();
        // Mock validation result as empty (no errors)
        mockValidationResult.mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(true),
            array: jest.fn().mockReturnValue([])
        });
        jest.clearAllMocks();
    });
    describe('getCurrentUserPermissions', () => {
        it('should successfully get current user permissions', async () => {
            const mockPermissions = [
                {
                    get: jest.fn((key) => {
                        const data = { id: 1, name: 'Test Permission', action: 'create', moduleId: 1 };
                        return data[key];
                    })
                },
                {
                    get: jest.fn((key) => {
                        const data = { id: 2, name: 'Test Permission 2', action: 'read', moduleId: 1 };
                        return data[key];
                    })
                }
            ];
            // Mock the private getUserPermissions method
            jest.spyOn(userPermissionController, 'getUserPermissions').mockResolvedValue(mockPermissions);
            await userPermissionController.getCurrentUserPermissions(mockRequest, mockResponse, mockNext);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                count: 2,
                data: mockPermissions
            });
        });
        it('should handle missing userId', async () => {
            mockRequest.userId = undefined;
            await userPermissionController.getCurrentUserPermissions(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User not authenticated'
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            jest.spyOn(userPermissionController, 'getUserPermissions').mockRejectedValue(error);
            await userPermissionController.getCurrentUserPermissions(mockRequest, mockResponse, mockNext);
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
                        return data[key];
                    })
                }
            ];
            MockedUser.findByPk.mockResolvedValue(mockUser);
            MockedModule.findByPk.mockResolvedValue(mockModule);
            jest.spyOn(userPermissionController, 'getUserPermissions').mockResolvedValue(mockPermissions);
            await userPermissionController.simulateAction(mockRequest, mockResponse, mockNext);
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
                        return data[key];
                    })
                }
            ];
            MockedUser.findByPk.mockResolvedValue(mockUser);
            MockedModule.findByPk.mockResolvedValue(mockModule);
            jest.spyOn(userPermissionController, 'getUserPermissions').mockResolvedValue(mockPermissions);
            await userPermissionController.simulateAction(mockRequest, mockResponse, mockNext);
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
            });
            await userPermissionController.simulateAction(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation error',
                errors: { userId: 'User ID is required' }
            }));
        });
        it('should handle user not found', async () => {
            MockedUser.findByPk.mockResolvedValue(null);
            await userPermissionController.simulateAction(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User with ID 1 not found'
            }));
        });
        it('should handle module not found', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            MockedUser.findByPk.mockResolvedValue(mockUser);
            MockedModule.findByPk.mockResolvedValue(null);
            await userPermissionController.simulateAction(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Module with ID 1 not found'
            }));
        });
        it('should handle invalid action', async () => {
            const mockUser = { id: 1, username: 'testuser' };
            const mockModule = { id: 1, name: 'Test Module' };
            mockRequest.body.action = 'invalid';
            MockedUser.findByPk.mockResolvedValue(mockUser);
            MockedModule.findByPk.mockResolvedValue(mockModule);
            await userPermissionController.simulateAction(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Action must be one of: create, read, update, delete'
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            MockedUser.findByPk.mockRejectedValue(error);
            await userPermissionController.simulateAction(mockRequest, mockResponse, mockNext);
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
                        return data[key];
                    })
                }
            ];
            MockedModule.findOne.mockResolvedValue(mockModule);
            jest.spyOn(userPermissionController, 'getUserPermissions').mockResolvedValue(mockPermissions);
            const middleware = userPermissionController.checkPermission('TestModule', 'create');
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should deny access when user lacks permission', async () => {
            const mockModule = { get: jest.fn(() => 1) };
            const mockPermissions = [
                {
                    get: jest.fn((key) => {
                        const data = { id: 1, name: 'Test Permission', action: 'read', moduleId: 2 };
                        return data[key];
                    })
                }
            ];
            MockedModule.findOne.mockResolvedValue(mockModule);
            jest.spyOn(userPermissionController, 'getUserPermissions').mockResolvedValue(mockPermissions);
            const middleware = userPermissionController.checkPermission('TestModule', 'create');
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Permission denied: User does not have create permission for this resource'
            }));
        });
        it('should handle missing user', async () => {
            mockRequest.user = undefined;
            const middleware = userPermissionController.checkPermission('TestModule', 'create');
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'User not authenticated'
            }));
        });
        it('should handle module not found', async () => {
            MockedModule.findOne.mockResolvedValue(null);
            const middleware = userPermissionController.checkPermission('TestModule', 'create');
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Module TestModule not found'
            }));
        });
        it('should work with numeric module ID', async () => {
            const mockPermissions = [
                {
                    get: jest.fn((key) => {
                        const data = { id: 1, name: 'Test Permission', action: 'create', moduleId: 1 };
                        return data[key];
                    })
                }
            ];
            jest.spyOn(userPermissionController, 'getUserPermissions').mockResolvedValue(mockPermissions);
            const middleware = userPermissionController.checkPermission(1, 'create');
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith();
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            MockedModule.findOne.mockRejectedValue(error);
            const middleware = userPermissionController.checkPermission('TestModule', 'create');
            await middleware(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
