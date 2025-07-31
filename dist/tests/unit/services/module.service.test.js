"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const module_service_1 = require("../../../src/services/module.service");
const module_model_1 = require("../../../src/models/module.model");
const permission_model_1 = require("../../../src/models/permission.model");
const errors_1 = require("../../../src/utils/errors");
const sequelize_1 = require("sequelize");
// Mock models
jest.mock('../../../src/models/module.model');
jest.mock('../../../src/models/permission.model');
const MockedModule = module_model_1.Module;
const MockedPermission = permission_model_1.Permission;
describe('ModuleService', () => {
    let moduleService;
    beforeEach(() => {
        moduleService = new module_service_1.ModuleService();
        jest.clearAllMocks();
    });
    describe('getModules', () => {
        let mockPermission;
        let mockModule;
        beforeEach(() => {
            mockPermission = {
                get: jest.fn().mockImplementation((key) => {
                    const permData = {
                        id: 1,
                        name: 'Users Create',
                        action: 'create',
                        description: 'Create users',
                    };
                    return permData[key];
                }),
            };
            mockModule = {
                get: jest.fn().mockImplementation((key) => {
                    const data = {
                        id: 1,
                        name: 'Users',
                        description: 'User management module',
                        isActive: true,
                        createdAt: new Date('2023-01-01'),
                        updatedAt: new Date('2023-01-01'),
                        permissions: [mockPermission],
                    };
                    return data[key];
                }),
            };
        });
        it('should return modules with default filters', async () => {
            MockedModule.findAndCountAll.mockResolvedValue({
                rows: [mockModule],
                count: 1,
            });
            const result = await moduleService.getModules();
            expect(result).toEqual({
                modules: [
                    {
                        id: 1,
                        name: 'Users',
                        description: 'User management module',
                        isActive: true,
                        createdAt: new Date('2023-01-01'),
                        updatedAt: new Date('2023-01-01'),
                        permissions: [
                            {
                                id: 1,
                                name: 'Users Create',
                                action: 'create',
                                description: 'Create users',
                            },
                        ],
                        permissionCount: 1,
                    },
                ],
                total: 1,
            });
            expect(MockedModule.findAndCountAll).toHaveBeenCalledWith({
                where: {},
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                        required: false,
                    },
                ],
                limit: 50,
                offset: 0,
                distinct: true,
                order: [['createdAt', 'DESC']],
            });
        });
        it('should apply search filter', async () => {
            MockedModule.findAndCountAll.mockResolvedValue({
                rows: [mockModule],
                count: 1,
            });
            const filters = { search: 'user' };
            await moduleService.getModules(filters);
            expect(MockedModule.findAndCountAll).toHaveBeenCalledWith({
                where: {
                    [sequelize_1.Op.or]: [
                        { name: { [sequelize_1.Op.like]: '%user%' } },
                        { description: { [sequelize_1.Op.like]: '%user%' } },
                    ],
                },
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                        required: false,
                    },
                ],
                limit: 50,
                offset: 0,
                distinct: true,
                order: [['createdAt', 'DESC']],
            });
        });
        it('should apply isActive filter', async () => {
            MockedModule.findAndCountAll.mockResolvedValue({
                rows: [],
                count: 0,
            });
            const filters = { isActive: true };
            await moduleService.getModules(filters);
            expect(MockedModule.findAndCountAll).toHaveBeenCalledWith({
                where: { isActive: true },
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                        required: false,
                    },
                ],
                limit: 50,
                offset: 0,
                distinct: true,
                order: [['createdAt', 'DESC']],
            });
        });
        it('should apply hasPermissions filter', async () => {
            MockedModule.findAndCountAll.mockResolvedValue({
                rows: [],
                count: 0,
            });
            const filters = { hasPermissions: true };
            await moduleService.getModules(filters);
            expect(MockedModule.findAndCountAll).toHaveBeenCalledWith({
                where: {},
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                        required: true,
                    },
                ],
                limit: 50,
                offset: 0,
                distinct: true,
                order: [['createdAt', 'DESC']],
            });
        });
        it('should apply pagination and sorting', async () => {
            MockedModule.findAndCountAll.mockResolvedValue({
                rows: [],
                count: 0,
            });
            const filters = {
                limit: 10,
                offset: 20,
                sortBy: 'name',
                order: 'ASC',
            };
            await moduleService.getModules(filters);
            expect(MockedModule.findAndCountAll).toHaveBeenCalledWith({
                where: {},
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                        required: false,
                    },
                ],
                limit: 10,
                offset: 20,
                distinct: true,
                order: [['name', 'ASC']],
            });
        });
    });
    describe('getModuleById', () => {
        it('should return module when found', async () => {
            const mockModule = {
                get: jest.fn((key) => {
                    const data = {
                        id: 1,
                        name: 'Users',
                        description: 'User management module',
                        isActive: true,
                        createdAt: new Date('2023-01-01'),
                        updatedAt: new Date('2023-01-01'),
                        permissions: [],
                    };
                    return data[key];
                }),
            };
            MockedModule.findByPk.mockResolvedValue(mockModule);
            const result = await moduleService.getModuleById(1);
            expect(result).toEqual({
                id: 1,
                name: 'Users',
                description: 'User management module',
                isActive: true,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
                permissions: [],
                permissionCount: 0,
            });
            expect(MockedModule.findByPk).toHaveBeenCalledWith(1, {
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                    },
                ],
            });
        });
        it('should throw NotFoundError when module not found', async () => {
            MockedModule.findByPk.mockResolvedValue(null);
            await expect(moduleService.getModuleById(999)).rejects.toThrow(errors_1.NotFoundError);
            await expect(moduleService.getModuleById(999)).rejects.toThrow('Module not found');
        });
    });
    describe('getModuleByName', () => {
        it('should return module when found', async () => {
            const mockModule = {
                get: jest.fn((key) => {
                    const data = {
                        id: 1,
                        name: 'Users',
                        description: 'User management module',
                        isActive: true,
                        createdAt: new Date('2023-01-01'),
                        updatedAt: new Date('2023-01-01'),
                        permissions: [],
                    };
                    return data[key];
                }),
            };
            MockedModule.findOne.mockResolvedValue(mockModule);
            const result = await moduleService.getModuleByName('Users');
            expect(result).toEqual({
                id: 1,
                name: 'Users',
                description: 'User management module',
                isActive: true,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
                permissions: [],
                permissionCount: 0,
            });
            expect(MockedModule.findOne).toHaveBeenCalledWith({
                where: { name: 'Users' },
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                    },
                ],
            });
        });
        it('should throw NotFoundError when module not found', async () => {
            MockedModule.findOne.mockResolvedValue(null);
            await expect(moduleService.getModuleByName('NonExistent')).rejects.toThrow(errors_1.NotFoundError);
            await expect(moduleService.getModuleByName('NonExistent')).rejects.toThrow('Module not found');
        });
    });
    describe('createModule', () => {
        it('should create module successfully', async () => {
            const moduleData = {
                name: 'Users',
                description: 'User management module',
                isActive: true,
            };
            const mockCreatedModule = {
                id: 1,
                name: 'Users',
                description: 'User management module',
                isActive: true,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
            };
            MockedModule.findOne.mockResolvedValue(null); // No existing module
            MockedModule.create.mockResolvedValue(mockCreatedModule);
            const result = await moduleService.createModule(moduleData);
            expect(result).toEqual({
                id: 1,
                name: 'Users',
                description: 'User management module',
                isActive: true,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
                permissions: [],
                permissionCount: 0,
            });
            expect(MockedModule.findOne).toHaveBeenCalledWith({ where: { name: 'Users' } });
            expect(MockedModule.create).toHaveBeenCalledWith({
                name: 'Users',
                description: 'User management module',
                isActive: true,
            });
        });
        it('should throw ConflictError when module name already exists', async () => {
            const moduleData = {
                name: 'Users',
                description: 'User management module',
            };
            const existingModule = { id: 1, name: 'Users' };
            MockedModule.findOne.mockResolvedValue(existingModule);
            await expect(moduleService.createModule(moduleData)).rejects.toThrow(errors_1.ConflictError);
            await expect(moduleService.createModule(moduleData)).rejects.toThrow('Module name already exists');
            expect(MockedModule.create).not.toHaveBeenCalled();
        });
        it('should use default isActive value when not provided', async () => {
            const moduleData = {
                name: 'Users',
                description: 'User management module',
            };
            const mockCreatedModule = {
                id: 1,
                name: 'Users',
                description: 'User management module',
                isActive: true,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
            };
            MockedModule.findOne.mockResolvedValue(null);
            MockedModule.create.mockResolvedValue(mockCreatedModule);
            await moduleService.createModule(moduleData);
            expect(MockedModule.create).toHaveBeenCalledWith({
                name: 'Users',
                description: 'User management module',
                isActive: true, // Default value
            });
        });
    });
    describe('updateModule', () => {
        it('should update module successfully', async () => {
            const updateData = {
                description: 'Updated description',
                isActive: false,
            };
            const mockModule = {
                get: jest.fn((key) => {
                    const data = { id: 1, name: 'Users' };
                    return data[key];
                }),
                update: jest.fn(),
            };
            const mockUpdatedModule = {
                id: 1,
                name: 'Users',
                description: 'Updated description',
                isActive: false,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
                permissions: [],
                permissionCount: 0,
            };
            MockedModule.findByPk.mockResolvedValue(mockModule);
            jest.spyOn(moduleService, 'getModuleById').mockResolvedValue(mockUpdatedModule);
            const result = await moduleService.updateModule(1, updateData);
            expect(result).toEqual(mockUpdatedModule);
            expect(mockModule.update).toHaveBeenCalledWith(updateData);
            expect(moduleService.getModuleById).toHaveBeenCalledWith(1);
        });
        it('should throw NotFoundError when module not found', async () => {
            MockedModule.findByPk.mockResolvedValue(null);
            const updateData = { description: 'Updated' };
            await expect(moduleService.updateModule(999, updateData)).rejects.toThrow(errors_1.NotFoundError);
            await expect(moduleService.updateModule(999, updateData)).rejects.toThrow('Module not found');
        });
        it('should check for name conflicts when updating name', async () => {
            const updateData = { name: 'NewName' };
            const mockModule = {
                get: jest.fn((key) => {
                    const data = { id: 1, name: 'OldName' };
                    return data[key];
                }),
                update: jest.fn(),
            };
            const existingModule = { id: 2, name: 'NewName' };
            MockedModule.findByPk.mockResolvedValue(mockModule);
            MockedModule.findOne.mockResolvedValue(existingModule);
            await expect(moduleService.updateModule(1, updateData)).rejects.toThrow(errors_1.ConflictError);
            await expect(moduleService.updateModule(1, updateData)).rejects.toThrow('Module name already exists');
            expect(MockedModule.findOne).toHaveBeenCalledWith({
                where: { name: 'NewName', id: { [sequelize_1.Op.ne]: 1 } },
            });
        });
        it('should not check for conflicts when name is not changing', async () => {
            const updateData = { description: 'Updated' };
            const mockModule = {
                get: jest.fn((key) => {
                    const data = { id: 1, name: 'Users' };
                    return data[key];
                }),
                update: jest.fn(),
            };
            const mockUpdatedModule = {
                id: 1,
                name: 'Users',
                description: 'Updated',
                isActive: true,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-02'),
                permissions: [],
                permissionCount: 0,
            };
            MockedModule.findByPk.mockResolvedValue(mockModule);
            jest.spyOn(moduleService, 'getModuleById').mockResolvedValue(mockUpdatedModule);
            await moduleService.updateModule(1, updateData);
            expect(MockedModule.findOne).not.toHaveBeenCalled();
        });
    });
    describe('deleteModule', () => {
        it('should soft delete module successfully', async () => {
            const mockModule = {
                update: jest.fn(),
            };
            MockedModule.findByPk.mockResolvedValue(mockModule);
            MockedPermission.count.mockResolvedValue(0);
            await moduleService.deleteModule(1);
            expect(MockedPermission.count).toHaveBeenCalledWith({ where: { moduleId: 1 } });
            expect(mockModule.update).toHaveBeenCalledWith({ isActive: false });
        });
        it('should throw NotFoundError when module not found', async () => {
            MockedModule.findByPk.mockResolvedValue(null);
            await expect(moduleService.deleteModule(999)).rejects.toThrow(errors_1.NotFoundError);
            await expect(moduleService.deleteModule(999)).rejects.toThrow('Module not found');
        });
        it('should throw ValidationError when module has permissions', async () => {
            const mockModule = { update: jest.fn() };
            MockedModule.findByPk.mockResolvedValue(mockModule);
            MockedPermission.count.mockResolvedValue(5);
            await expect(moduleService.deleteModule(1)).rejects.toThrow(errors_1.ValidationError);
            await expect(moduleService.deleteModule(1)).rejects.toThrow('Cannot delete module with existing permissions. Delete permissions first.');
            expect(mockModule.update).not.toHaveBeenCalled();
        });
    });
    describe('hardDeleteModule', () => {
        it('should hard delete module successfully', async () => {
            const mockModule = {
                destroy: jest.fn(),
            };
            MockedModule.findByPk.mockResolvedValue(mockModule);
            MockedPermission.count.mockResolvedValue(0);
            await moduleService.hardDeleteModule(1);
            expect(MockedPermission.count).toHaveBeenCalledWith({ where: { moduleId: 1 } });
            expect(mockModule.destroy).toHaveBeenCalled();
        });
        it('should throw NotFoundError when module not found', async () => {
            MockedModule.findByPk.mockResolvedValue(null);
            await expect(moduleService.hardDeleteModule(999)).rejects.toThrow(errors_1.NotFoundError);
            await expect(moduleService.hardDeleteModule(999)).rejects.toThrow('Module not found');
        });
        it('should throw ValidationError when module has permissions', async () => {
            const mockModule = { destroy: jest.fn() };
            MockedModule.findByPk.mockResolvedValue(mockModule);
            MockedPermission.count.mockResolvedValue(3);
            await expect(moduleService.hardDeleteModule(1)).rejects.toThrow(errors_1.ValidationError);
            await expect(moduleService.hardDeleteModule(1)).rejects.toThrow('Cannot delete module with existing permissions. Delete permissions first.');
            expect(mockModule.destroy).not.toHaveBeenCalled();
        });
    });
    describe('createStandardPermissions', () => {
        it('should create standard CRUD permissions', async () => {
            const mockModule = {
                get: jest.fn(() => 'Users'),
            };
            const mockCreatedPermissions = [
                {
                    get: jest.fn((key) => {
                        const data = {
                            id: 1,
                            name: 'Users Create',
                            action: 'create',
                            description: 'Create users',
                        };
                        return data[key];
                    }),
                },
                {
                    get: jest.fn((key) => {
                        const data = {
                            id: 2,
                            name: 'Users Read',
                            action: 'read',
                            description: 'Read users',
                        };
                        return data[key];
                    }),
                },
            ];
            MockedModule.findByPk.mockResolvedValue(mockModule);
            MockedPermission.findAll.mockResolvedValue([]); // No existing permissions
            MockedPermission.bulkCreate.mockResolvedValue(mockCreatedPermissions);
            const result = await moduleService.createStandardPermissions(1);
            expect(result.created).toHaveLength(2);
            expect(result.created[0]).toEqual({
                id: 1,
                name: 'Users Create',
                action: 'create',
                description: 'Create users',
            });
            expect(MockedPermission.bulkCreate).toHaveBeenCalledWith([
                {
                    name: 'Users Create',
                    action: 'create',
                    description: 'Create users',
                    moduleId: 1,
                    isActive: true,
                },
                {
                    name: 'Users Read',
                    action: 'read',
                    description: 'Read users',
                    moduleId: 1,
                    isActive: true,
                },
                {
                    name: 'Users Update',
                    action: 'update',
                    description: 'Update users',
                    moduleId: 1,
                    isActive: true,
                },
                {
                    name: 'Users Delete',
                    action: 'delete',
                    description: 'Delete users',
                    moduleId: 1,
                    isActive: true,
                },
            ], { returning: true });
        });
        it('should skip existing permissions', async () => {
            const mockModule = {
                get: jest.fn(() => 'Users'),
            };
            const existingPermissions = [
                { get: jest.fn(() => 'create') },
                { get: jest.fn(() => 'read') },
            ];
            MockedModule.findByPk.mockResolvedValue(mockModule);
            MockedPermission.findAll.mockResolvedValue(existingPermissions);
            MockedPermission.bulkCreate.mockResolvedValue([]);
            const result = await moduleService.createStandardPermissions(1);
            expect(result.created).toHaveLength(0);
            expect(MockedPermission.findAll).toHaveBeenCalledWith({
                where: { moduleId: 1, action: ['create', 'read', 'update', 'delete'] },
            });
        });
        it('should throw NotFoundError when module not found', async () => {
            MockedModule.findByPk.mockResolvedValue(null);
            await expect(moduleService.createStandardPermissions(999)).rejects.toThrow(errors_1.NotFoundError);
            await expect(moduleService.createStandardPermissions(999)).rejects.toThrow('Module not found');
        });
    });
    describe('getModulesWithPermissionCounts', () => {
        it('should return modules with permission counts', async () => {
            const mockModules = [
                {
                    get: jest.fn((key) => {
                        const data = {
                            id: 1,
                            name: 'Users',
                            description: 'User management',
                            isActive: true,
                        };
                        return data[key];
                    }),
                    permissions: [
                        { get: jest.fn(() => true) }, // active permission
                        { get: jest.fn(() => false) }, // inactive permission
                    ],
                },
            ];
            MockedModule.findAll.mockResolvedValue(mockModules);
            const result = await moduleService.getModulesWithPermissionCounts();
            expect(result).toEqual([
                {
                    id: 1,
                    name: 'Users',
                    description: 'User management',
                    isActive: true,
                    permissionCount: 2,
                    activePermissionCount: 1,
                },
            ]);
            expect(MockedModule.findAll).toHaveBeenCalledWith({
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                        attributes: ['id', 'isActive'],
                    },
                ],
                order: [['name', 'ASC']],
            });
        });
    });
    describe('getModuleStatistics', () => {
        it('should return module statistics', async () => {
            MockedModule.count
                .mockResolvedValueOnce(10) // total
                .mockResolvedValueOnce(8) // active
                .mockResolvedValueOnce(6); // with permissions
            MockedPermission.count.mockResolvedValue(24); // total permissions
            const result = await moduleService.getModuleStatistics();
            expect(result).toEqual({
                total: 10,
                active: 8,
                inactive: 2,
                withPermissions: 6,
                withoutPermissions: 4,
                averagePermissionsPerModule: 2.4,
                totalPermissions: 24,
            });
        });
        it('should handle zero modules', async () => {
            MockedModule.count
                .mockResolvedValueOnce(0) // total
                .mockResolvedValueOnce(0) // active
                .mockResolvedValueOnce(0); // with permissions
            MockedPermission.count.mockResolvedValue(0);
            const result = await moduleService.getModuleStatistics();
            expect(result).toEqual({
                total: 0,
                active: 0,
                inactive: 0,
                withPermissions: 0,
                withoutPermissions: 0,
                averagePermissionsPerModule: 0,
                totalPermissions: 0,
            });
        });
    });
    describe('validateModuleName', () => {
        it('should validate correct module names', () => {
            const validNames = [
                'Users',
                'User Management',
                'User-Management',
                'User_Management',
                'Module123',
                'AB',
            ];
            validNames.forEach(name => {
                const result = moduleService.validateModuleName(name);
                expect(result.isValid).toBe(true);
                expect(result.errors).toHaveLength(0);
            });
        });
        it('should reject names that are too short', () => {
            const result = moduleService.validateModuleName('A');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Module name must be at least 2 characters long');
        });
        it('should reject names that are too long', () => {
            const longName = 'A'.repeat(51);
            const result = moduleService.validateModuleName(longName);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Module name must not exceed 50 characters');
        });
        it('should reject names with invalid characters', () => {
            const invalidNames = ['User@Module', 'User#Module', 'User$Module', 'User%Module'];
            invalidNames.forEach(name => {
                const result = moduleService.validateModuleName(name);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Module name can only contain letters, numbers, spaces, hyphens, and underscores');
            });
        });
        it('should reject names that do not start with a letter', () => {
            const invalidNames = ['123Module', '_Module', '-Module', ' Module'];
            invalidNames.forEach(name => {
                const result = moduleService.validateModuleName(name);
                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Module name must start with a letter');
            });
        });
        it('should return multiple errors for invalid names', () => {
            const result = moduleService.validateModuleName('1');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Module name must be at least 2 characters long');
            expect(result.errors).toContain('Module name must start with a letter');
        });
    });
});
