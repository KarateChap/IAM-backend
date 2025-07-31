"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rolePermission_service_1 = require("../../../src/services/rolePermission.service");
const role_model_1 = require("../../../src/models/role.model");
const permission_model_1 = require("../../../src/models/permission.model");
const rolePermission_model_1 = require("../../../src/models/rolePermission.model");
const module_model_1 = require("../../../src/models/module.model");
const errors_1 = require("../../../src/utils/errors");
// Mock the models
jest.mock('../../../src/models/role.model');
jest.mock('../../../src/models/permission.model');
jest.mock('../../../src/models/rolePermission.model');
jest.mock('../../../src/models/module.model');
const MockedRole = role_model_1.Role;
const MockedPermission = permission_model_1.Permission;
const MockedRolePermission = rolePermission_model_1.RolePermission;
const MockedModule = module_model_1.Module;
describe('RolePermissionService', () => {
    let rolePermissionService;
    beforeEach(() => {
        rolePermissionService = new rolePermission_service_1.RolePermissionService();
        jest.clearAllMocks();
    });
    describe('assignPermissionsToRole', () => {
        it('should successfully assign permissions to a role', async () => {
            const roleId = 1;
            const permissionIds = [1, 2];
            // Mock role exists
            const mockRole = { get: jest.fn().mockReturnValue('Test Role') };
            MockedRole.findByPk = jest.fn().mockResolvedValue(mockRole);
            // Mock permissions exist
            const mockPermissions = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'action')
                            return 'create';
                        if (key === 'module')
                            return { name: 'Users' };
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'action')
                            return 'read';
                        if (key === 'module')
                            return { name: 'Groups' };
                        return null;
                    })
                }
            ];
            MockedPermission.findAll = jest.fn().mockResolvedValue(mockPermissions);
            // Mock no existing assignments
            MockedRolePermission.findAll = jest.fn().mockResolvedValue([]);
            // Mock successful creation
            MockedRolePermission.create = jest.fn().mockResolvedValue({});
            const result = await rolePermissionService.assignPermissionsToRole(roleId, permissionIds);
            expect(result.assigned).toBe(2);
            expect(result.skipped).toBe(0);
            expect(result.details).toHaveLength(2);
            expect(result.details[0].status).toBe('assigned');
            expect(result.details[0].permissionAction).toBe('create');
            expect(result.details[0].moduleName).toBe('Users');
            expect(MockedRole.findByPk).toHaveBeenCalledWith(roleId);
            expect(MockedPermission.findAll).toHaveBeenCalledWith({
                where: { id: permissionIds },
                include: [{
                        model: module_model_1.Module,
                        as: 'module',
                        attributes: ['name']
                    }]
            });
            expect(MockedRolePermission.create).toHaveBeenCalledTimes(2);
        });
        it('should skip already assigned permissions', async () => {
            const roleId = 1;
            const permissionIds = [1, 2];
            // Mock role exists
            const mockRole = { get: jest.fn().mockReturnValue('Test Role') };
            MockedRole.findByPk = jest.fn().mockResolvedValue(mockRole);
            // Mock permissions exist
            const mockPermissions = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'action')
                            return 'create';
                        if (key === 'module')
                            return { name: 'Users' };
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'action')
                            return 'read';
                        if (key === 'module')
                            return { name: 'Groups' };
                        return null;
                    })
                }
            ];
            MockedPermission.findAll = jest.fn().mockResolvedValue(mockPermissions);
            // Mock one existing assignment
            const mockExistingAssignment = { get: jest.fn().mockReturnValue(1) };
            MockedRolePermission.findAll = jest.fn().mockResolvedValue([mockExistingAssignment]);
            // Mock successful creation for new permission
            MockedRolePermission.create = jest.fn().mockResolvedValue({});
            const result = await rolePermissionService.assignPermissionsToRole(roleId, permissionIds);
            expect(result.assigned).toBe(1);
            expect(result.skipped).toBe(1);
            expect(result.details).toHaveLength(2);
            expect(result.details[0].status).toBe('already_exists');
            expect(result.details[1].status).toBe('assigned');
            expect(MockedRolePermission.create).toHaveBeenCalledTimes(1);
        });
        it('should throw NotFoundError if role does not exist', async () => {
            const roleId = 999;
            const permissionIds = [1, 2];
            MockedRole.findByPk = jest.fn().mockResolvedValue(null);
            await expect(rolePermissionService.assignPermissionsToRole(roleId, permissionIds))
                .rejects.toThrow(errors_1.NotFoundError);
            expect(MockedRole.findByPk).toHaveBeenCalledWith(roleId);
        });
        it('should throw BadRequestError if permissionIds is not an array', async () => {
            const roleId = 1;
            const permissionIds = 'not-an-array';
            // Mock role exists
            const mockRole = { get: jest.fn().mockReturnValue('Test Role') };
            MockedRole.findByPk = jest.fn().mockResolvedValue(mockRole);
            await expect(rolePermissionService.assignPermissionsToRole(roleId, permissionIds))
                .rejects.toThrow(errors_1.BadRequestError);
        });
        it('should throw NotFoundError if some permissions do not exist', async () => {
            const roleId = 1;
            const permissionIds = [1, 2, 999];
            // Mock role exists
            const mockRole = { get: jest.fn().mockReturnValue('Test Role') };
            MockedRole.findByPk = jest.fn().mockResolvedValue(mockRole);
            // Mock only 2 out of 3 permissions exist
            const mockPermissions = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'action')
                            return 'create';
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'action')
                            return 'read';
                        return null;
                    })
                }
            ];
            MockedPermission.findAll = jest.fn().mockResolvedValue(mockPermissions);
            await expect(rolePermissionService.assignPermissionsToRole(roleId, permissionIds))
                .rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('removePermissionsFromRole', () => {
        it('should successfully remove permissions from a role', async () => {
            const roleId = 1;
            const permissionIds = [1, 2];
            // Mock role exists
            const mockRole = { get: jest.fn().mockReturnValue('Test Role') };
            MockedRole.findByPk = jest.fn().mockResolvedValue(mockRole);
            // Mock permissions exist
            const mockPermissions = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'action')
                            return 'create';
                        if (key === 'module')
                            return { name: 'Users' };
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'action')
                            return 'read';
                        if (key === 'module')
                            return { name: 'Groups' };
                        return null;
                    })
                }
            ];
            MockedPermission.findAll = jest.fn().mockResolvedValue(mockPermissions);
            // Mock existing assignments
            const mockExistingAssignments = [
                { get: jest.fn().mockReturnValue(1) },
                { get: jest.fn().mockReturnValue(2) }
            ];
            MockedRolePermission.findAll = jest.fn().mockResolvedValue(mockExistingAssignments);
            // Mock successful deletion
            MockedRolePermission.destroy = jest.fn().mockResolvedValue(2);
            const result = await rolePermissionService.removePermissionsFromRole(roleId, permissionIds);
            expect(result.removed).toBe(2);
            expect(result.notFound).toBe(0);
            expect(result.details).toHaveLength(2);
            expect(result.details[0].status).toBe('removed');
            expect(result.details[1].status).toBe('removed');
            expect(MockedRolePermission.destroy).toHaveBeenCalledWith({
                where: { roleId, permissionId: [1, 2] }
            });
        });
    });
    describe('getRolePermissions', () => {
        it('should return permissions for a role', async () => {
            const roleId = 1;
            const mockPermissions = [
                {
                    get: jest.fn((key) => {
                        if (key === 'action')
                            return 'create';
                        if (key === 'module')
                            return { name: 'Users' };
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'action')
                            return 'read';
                        if (key === 'module')
                            return { name: 'Groups' };
                        return null;
                    })
                }
            ];
            const mockRole = {
                get: jest.fn().mockReturnValue(mockPermissions)
            };
            MockedRole.findByPk = jest.fn().mockResolvedValue(mockRole);
            const result = await rolePermissionService.getRolePermissions(roleId);
            expect(result).toEqual(mockPermissions);
            expect(MockedRole.findByPk).toHaveBeenCalledWith(roleId, {
                include: [{
                        model: permission_model_1.Permission,
                        as: 'permissions',
                        through: { attributes: [] },
                        include: [{
                                model: module_model_1.Module,
                                as: 'module',
                                attributes: ['id', 'name', 'description']
                            }]
                    }]
            });
        });
        it('should throw NotFoundError if role does not exist', async () => {
            const roleId = 999;
            MockedRole.findByPk = jest.fn().mockResolvedValue(null);
            await expect(rolePermissionService.getRolePermissions(roleId))
                .rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('roleHasPermission', () => {
        it('should return true if role has permission', async () => {
            const roleId = 1;
            const permissionId = 1;
            const mockAssignment = { get: jest.fn() };
            MockedRolePermission.findOne = jest.fn().mockResolvedValue(mockAssignment);
            const result = await rolePermissionService.roleHasPermission(roleId, permissionId);
            expect(result).toBe(true);
            expect(MockedRolePermission.findOne).toHaveBeenCalledWith({
                where: { roleId, permissionId }
            });
        });
        it('should return false if role does not have permission', async () => {
            const roleId = 1;
            const permissionId = 1;
            MockedRolePermission.findOne = jest.fn().mockResolvedValue(null);
            const result = await rolePermissionService.roleHasPermission(roleId, permissionId);
            expect(result).toBe(false);
        });
    });
    describe('getRolePermissionsByModule', () => {
        it('should return permissions for a role filtered by module', async () => {
            const roleId = 1;
            const moduleName = 'Users';
            const mockPermissions = [
                {
                    get: jest.fn((key) => {
                        if (key === 'action')
                            return 'create';
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'action')
                            return 'read';
                        return null;
                    })
                }
            ];
            MockedPermission.findAll = jest.fn().mockResolvedValue(mockPermissions);
            const result = await rolePermissionService.getRolePermissionsByModule(roleId, moduleName);
            expect(result).toEqual(mockPermissions);
            expect(MockedPermission.findAll).toHaveBeenCalledWith({
                include: [
                    {
                        model: role_model_1.Role,
                        as: 'roles',
                        where: { id: roleId },
                        through: { attributes: [] },
                        attributes: []
                    },
                    {
                        model: module_model_1.Module,
                        as: 'module',
                        where: { name: moduleName },
                        attributes: ['id', 'name', 'description']
                    }
                ]
            });
        });
    });
    describe('replaceRolePermissions', () => {
        it('should replace all permissions for a role', async () => {
            const roleId = 1;
            const permissionIds = [1, 2];
            // Mock role exists
            const mockRole = { get: jest.fn().mockReturnValue('Test Role') };
            MockedRole.findByPk = jest.fn().mockResolvedValue(mockRole);
            // Mock destroy existing assignments
            MockedRolePermission.destroy = jest.fn().mockResolvedValue(3);
            // Mock permissions exist
            const mockPermissions = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'action')
                            return 'create';
                        if (key === 'module')
                            return { name: 'Users' };
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'action')
                            return 'read';
                        if (key === 'module')
                            return { name: 'Groups' };
                        return null;
                    })
                }
            ];
            MockedPermission.findAll = jest.fn().mockResolvedValue(mockPermissions);
            // Mock no existing assignments after deletion
            MockedRolePermission.findAll = jest.fn().mockResolvedValue([]);
            // Mock successful creation
            MockedRolePermission.create = jest.fn().mockResolvedValue({});
            const result = await rolePermissionService.replaceRolePermissions(roleId, permissionIds);
            expect(result.assigned).toBe(2);
            expect(result.skipped).toBe(0);
            // Should destroy existing assignments first
            expect(MockedRolePermission.destroy).toHaveBeenCalledWith({
                where: { roleId }
            });
            // Then assign new permissions
            expect(MockedRolePermission.create).toHaveBeenCalledTimes(2);
        });
    });
});
