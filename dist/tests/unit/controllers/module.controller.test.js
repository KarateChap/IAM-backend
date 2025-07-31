"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const module_controller_1 = __importDefault(require("../../../src/controllers/module.controller"));
const services_1 = require("../../../src/services");
// Mock dependencies
jest.mock('express-validator');
jest.mock('../../../src/services');
const mockValidationResult = express_validator_1.validationResult;
const mockModuleService = services_1.moduleService;
const mockAuditService = services_1.auditService;
describe('Module Controller', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
    let moduleController;
    beforeEach(() => {
        mockRequest = {
            params: { id: '1' },
            body: { name: 'Test Module', description: 'Test Description', isActive: true },
            query: {},
            user: { id: 1 }
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        moduleController = new module_controller_1.default();
        // Mock validation result as empty (no errors)
        mockValidationResult.mockReturnValue({
            isEmpty: jest.fn().mockReturnValue(true),
            array: jest.fn().mockReturnValue([])
        });
        jest.clearAllMocks();
    });
    describe('getAll', () => {
        it('should successfully get modules with default filters', async () => {
            const mockResult = {
                modules: [
                    {
                        id: 1,
                        name: 'Module 1',
                        description: 'Description 1',
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        permissions: [],
                        permissionCount: 0
                    },
                    {
                        id: 2,
                        name: 'Module 2',
                        description: 'Description 2',
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        permissions: [],
                        permissionCount: 0
                    }
                ],
                total: 2
            };
            mockModuleService.getModules.mockResolvedValue(mockResult);
            await moduleController.getAll(mockRequest, mockResponse, mockNext);
            expect(mockModuleService.getModules).toHaveBeenCalledWith({
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
                data: mockResult.modules
            });
        });
        it('should successfully get modules with custom filters', async () => {
            mockRequest.query = {
                search: 'test',
                limit: '5',
                offset: '10',
                sortBy: 'name',
                order: 'ASC'
            };
            const mockResult = {
                modules: [{
                        id: 1,
                        name: 'Test Module',
                        description: 'Test Description',
                        isActive: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        permissions: [],
                        permissionCount: 0
                    }],
                total: 1
            };
            mockModuleService.getModules.mockResolvedValue(mockResult);
            await moduleController.getAll(mockRequest, mockResponse, mockNext);
            expect(mockModuleService.getModules).toHaveBeenCalledWith({
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
                data: mockResult.modules
            });
        });
        it('should handle validation errors', async () => {
            const validationErrors = [{ param: 'limit', msg: 'Invalid limit' }];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(validationErrors)
            });
            await moduleController.getAll(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation error',
                errors: { limit: 'Invalid limit' }
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockModuleService.getModules.mockRejectedValue(error);
            await moduleController.getAll(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('getById', () => {
        it('should successfully get module by id', async () => {
            const mockModule = {
                id: 1,
                name: 'Test Module',
                description: 'Test Description',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                permissions: [],
                permissionCount: 0
            };
            mockModuleService.getModuleById.mockResolvedValue(mockModule);
            await moduleController.getById(mockRequest, mockResponse, mockNext);
            expect(mockModuleService.getModuleById).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockModule
            });
        });
        it('should handle validation errors', async () => {
            const validationErrors = [{ param: 'id', msg: 'Invalid ID' }];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(validationErrors)
            });
            await moduleController.getById(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation error',
                errors: { id: 'Invalid ID' }
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockModuleService.getModuleById.mockRejectedValue(error);
            await moduleController.getById(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('create', () => {
        it('should successfully create a module', async () => {
            const mockModule = {
                id: 1,
                name: 'Test Module',
                description: 'Test Description',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                permissions: [],
                permissionCount: 0
            };
            mockModuleService.createModule.mockResolvedValue(mockModule);
            mockAuditService.logEvent.mockResolvedValue(undefined);
            await moduleController.create(mockRequest, mockResponse, mockNext);
            expect(mockModuleService.createModule).toHaveBeenCalledWith({
                name: 'Test Module',
                description: 'Test Description',
                isActive: true
            });
            expect(mockAuditService.logEvent).toHaveBeenCalledWith({
                userId: 1,
                action: 'create',
                resource: 'Module',
                resourceId: 1,
                details: { message: 'Created module: Test Module' }
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Module created successfully',
                data: mockModule
            });
        });
        it('should handle validation errors', async () => {
            const validationErrors = [{ param: 'name', msg: 'Name is required' }];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(validationErrors)
            });
            await moduleController.create(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation error',
                errors: { name: 'Name is required' }
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockModuleService.createModule.mockRejectedValue(error);
            await moduleController.create(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
        it('should handle missing user in request', async () => {
            mockRequest.user = undefined;
            const mockModule = {
                id: 1,
                name: 'Test Module',
                description: 'Test Description',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                permissions: [],
                permissionCount: 0
            };
            mockModuleService.createModule.mockResolvedValue(mockModule);
            mockAuditService.logEvent.mockResolvedValue(undefined);
            await moduleController.create(mockRequest, mockResponse, mockNext);
            expect(mockAuditService.logEvent).toHaveBeenCalledWith({
                userId: 0,
                action: 'create',
                resource: 'Module',
                resourceId: 1,
                details: { message: 'Created module: Test Module' }
            });
        });
    });
    describe('update', () => {
        it('should successfully update a module', async () => {
            const mockModule = {
                id: 1,
                name: 'Updated Module',
                description: 'Updated Description',
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                permissions: [],
                permissionCount: 0
            };
            mockModuleService.updateModule.mockResolvedValue(mockModule);
            mockAuditService.logEvent.mockResolvedValue(undefined);
            mockRequest.body = { name: 'Updated Module', description: 'Updated Description', isActive: false };
            await moduleController.update(mockRequest, mockResponse, mockNext);
            expect(mockModuleService.updateModule).toHaveBeenCalledWith(1, {
                name: 'Updated Module',
                description: 'Updated Description',
                isActive: false
            });
            expect(mockAuditService.logEvent).toHaveBeenCalledWith({
                userId: 1,
                action: 'update',
                resource: 'Module',
                resourceId: 1,
                details: { message: 'Updated module: Updated Module' }
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Module updated successfully',
                data: mockModule
            });
        });
        it('should handle validation errors', async () => {
            const validationErrors = [{ param: 'name', msg: 'Name is required' }];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(validationErrors)
            });
            await moduleController.update(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation error',
                errors: { name: 'Name is required' }
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockModuleService.updateModule.mockRejectedValue(error);
            await moduleController.update(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
    describe('delete', () => {
        it('should successfully delete a module', async () => {
            const mockModule = {
                id: 1,
                name: 'Test Module',
                description: 'Test Description',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                permissions: [],
                permissionCount: 0
            };
            mockModuleService.getModuleById.mockResolvedValue(mockModule);
            mockModuleService.deleteModule.mockResolvedValue(undefined);
            mockAuditService.logEvent.mockResolvedValue(undefined);
            await moduleController.delete(mockRequest, mockResponse, mockNext);
            expect(mockModuleService.getModuleById).toHaveBeenCalledWith(1);
            expect(mockModuleService.deleteModule).toHaveBeenCalledWith(1);
            expect(mockAuditService.logEvent).toHaveBeenCalledWith({
                userId: 1,
                action: 'delete',
                resource: 'Module',
                resourceId: 1,
                details: { message: 'Deleted module: Test Module' }
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: 'Module deleted successfully'
            });
        });
        it('should handle validation errors', async () => {
            const validationErrors = [{ param: 'id', msg: 'Invalid ID' }];
            mockValidationResult.mockReturnValue({
                isEmpty: jest.fn().mockReturnValue(false),
                array: jest.fn().mockReturnValue(validationErrors)
            });
            await moduleController.delete(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation error',
                errors: { id: 'Invalid ID' }
            }));
        });
        it('should handle service errors', async () => {
            const error = new Error('Service error');
            mockModuleService.getModuleById.mockRejectedValue(error);
            await moduleController.delete(mockRequest, mockResponse, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
