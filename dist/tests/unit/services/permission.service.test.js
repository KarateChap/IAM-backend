"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const permission_service_1 = require("../../../src/services/permission.service");
const user_model_1 = __importDefault(require("../../../src/models/user.model"));
const group_model_1 = require("../../../src/models/group.model");
const role_model_1 = require("../../../src/models/role.model");
const permission_model_1 = require("../../../src/models/permission.model");
const module_model_1 = require("../../../src/models/module.model");
const userGroup_model_1 = require("../../../src/models/userGroup.model");
const groupRole_model_1 = require("../../../src/models/groupRole.model");
const rolePermission_model_1 = require("../../../src/models/rolePermission.model");
const errors_1 = require("../../../src/utils/errors");
const sequelize_1 = require("sequelize");
// Mock models
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/role.model');
jest.mock('../../../src/models/permission.model');
jest.mock('../../../src/models/module.model');
jest.mock('../../../src/models/userGroup.model');
jest.mock('../../../src/models/groupRole.model');
jest.mock('../../../src/models/rolePermission.model');
const MockedUser = user_model_1.default;
const MockedGroup = group_model_1.Group;
const MockedRole = role_model_1.Role;
const MockedPermission = permission_model_1.Permission;
const MockedModule = module_model_1.Module;
const MockedUserGroup = userGroup_model_1.UserGroup;
const MockedGroupRole = groupRole_model_1.GroupRole;
const MockedRolePermission = rolePermission_model_1.RolePermission;
describe('PermissionService', () => {
    let permissionService;
    beforeEach(() => {
        permissionService = new permission_service_1.PermissionService();
        jest.clearAllMocks();
    });
    describe('getPermissions', () => {
        let mockModule;
        let mockPermission;
        beforeEach(() => {
            mockModule = {
                get: jest.fn().mockImplementation((key) => {
                    const data = { id: 1, name: 'Users' };
                    return data[key];
                }),
            };
            mockPermission = {
                get: jest.fn().mockImplementation((key) => {
                    const data = {
                        id: 1,
                        name: 'Users Create',
                        description: 'Create users',
                        action: 'create',
                        moduleId: 1,
                        createdAt: new Date('2023-01-01'),
                        updatedAt: new Date('2023-01-01'),
                    };
                    return data[key];
                }),
                module: mockModule,
            };
        });
        it('should return permissions with default filters', async () => {
            MockedPermission.findAndCountAll.mockResolvedValue({
                rows: [mockPermission],
                count: 1,
            });
            const result = await permissionService.getPermissions();
            expect(result.permissions).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.permissions[0]).toMatchObject({
                id: 1,
                name: 'Users Create',
                action: 'create',
                moduleId: 1,
            });
        });
        it('should apply search filter', async () => {
            MockedPermission.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
            await permissionService.getPermissions({ search: 'create' });
            expect(MockedPermission.findAndCountAll).toHaveBeenCalledWith({
                where: {
                    [sequelize_1.Op.or]: [
                        { name: { [sequelize_1.Op.like]: '%create%' } },
                        { description: { [sequelize_1.Op.like]: '%create%' } },
                    ],
                },
                include: expect.any(Array),
                limit: 50,
                offset: 0,
                order: [['createdAt', 'DESC']],
            });
        });
        it('should apply moduleId and action filters', async () => {
            MockedPermission.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });
            await permissionService.getPermissions({ moduleId: 1, action: 'create' });
            expect(MockedPermission.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
                where: { moduleId: 1, action: 'create' },
            }));
        });
    });
    describe('getPermissionById', () => {
        it('should return permission when found', async () => {
            const mockModule = {
                get: jest.fn().mockImplementation((key) => ({ id: 1, name: 'Users' }[key])),
            };
            const mockPermission = {
                get: jest.fn().mockImplementation((key) => {
                    const data = {
                        id: 1,
                        name: 'Users Create',
                        action: 'create',
                        moduleId: 1,
                        createdAt: new Date('2023-01-01'),
                        updatedAt: new Date('2023-01-01'),
                    };
                    return data[key];
                }),
                module: mockModule,
            };
            MockedPermission.findByPk.mockResolvedValue(mockPermission);
            const result = await permissionService.getPermissionById(1);
            expect(result.id).toBe(1);
            expect(result.name).toBe('Users Create');
            expect(result.module.name).toBe('Users');
        });
        it('should throw NotFoundError when permission not found', async () => {
            MockedPermission.findByPk.mockResolvedValue(null);
            await expect(permissionService.getPermissionById(999)).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('createPermission', () => {
        it('should create permission successfully', async () => {
            const permissionData = {
                name: 'Users Create',
                action: 'create',
                moduleId: 1,
            };
            MockedPermission.findOne.mockResolvedValue(null);
            MockedModule.findByPk.mockResolvedValue({ id: 1 });
            MockedPermission.create.mockResolvedValue({ id: 1 });
            jest.spyOn(permissionService, 'getPermissionById').mockResolvedValue({
                id: 1,
                name: 'Users Create',
                action: 'create',
                moduleId: 1,
                module: { id: 1, name: 'Users' },
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const result = await permissionService.createPermission(permissionData);
            expect(result.id).toBe(1);
            expect(MockedPermission.create).toHaveBeenCalledWith({
                ...permissionData,
                isActive: true,
            });
        });
        it('should throw ConflictError when permission already exists', async () => {
            MockedPermission.findOne.mockResolvedValue({ id: 1 });
            await expect(permissionService.createPermission({
                name: 'Users Create',
                action: 'create',
                moduleId: 1,
            })).rejects.toThrow(errors_1.ConflictError);
        });
        it('should throw NotFoundError when module not found', async () => {
            MockedPermission.findOne.mockResolvedValue(null);
            MockedModule.findByPk.mockResolvedValue(null);
            await expect(permissionService.createPermission({
                name: 'Users Create',
                action: 'create',
                moduleId: 999,
            })).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('updatePermission', () => {
        it('should update permission successfully', async () => {
            const mockPermission = {
                get: jest.fn().mockImplementation((key) => ({ name: 'Users Create', action: 'create', moduleId: 1 }[key])),
                update: jest.fn(),
            };
            MockedPermission.findByPk.mockResolvedValue(mockPermission);
            jest.spyOn(permissionService, 'getPermissionById').mockResolvedValue({
                id: 1,
                name: 'Users Create',
                action: 'create',
                moduleId: 1,
                module: { id: 1, name: 'Users' },
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await permissionService.updatePermission(1, { description: 'Updated' });
            expect(mockPermission.update).toHaveBeenCalledWith({ description: 'Updated' });
        });
        it('should throw NotFoundError when permission not found', async () => {
            MockedPermission.findByPk.mockResolvedValue(null);
            await expect(permissionService.updatePermission(999, {})).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('deletePermission', () => {
        it('should delete permission successfully', async () => {
            const mockPermission = { destroy: jest.fn() };
            MockedPermission.findByPk.mockResolvedValue(mockPermission);
            await permissionService.deletePermission(1);
            expect(mockPermission.destroy).toHaveBeenCalled();
        });
        it('should throw NotFoundError when permission not found', async () => {
            MockedPermission.findByPk.mockResolvedValue(null);
            await expect(permissionService.deletePermission(999)).rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('getUserPermissions', () => {
        it('should return permissions for user with groups', async () => {
            const mockUser = {
                groups: [{ get: () => 1 }],
            };
            const mockGroup = {
                get: jest.fn().mockImplementation((key) => {
                    return key === 'roles' ? [{ get: () => 1 }] : 1;
                }),
            };
            const mockRole = {
                permissions: [{ get: jest.fn().mockImplementation((key) => ({ id: 1, moduleId: 1, action: 'create' }[key])) }],
            };
            MockedUser.findByPk.mockResolvedValue(mockUser);
            MockedGroup.findAll.mockResolvedValue([mockGroup]);
            MockedRole.findAll.mockResolvedValue([mockRole]);
            const result = await permissionService.getUserPermissions(1);
            expect(Array.isArray(result)).toBe(true);
        });
        it('should return empty array when user has no groups', async () => {
            MockedUser.findByPk.mockResolvedValue({ groups: [] });
            const result = await permissionService.getUserPermissions(1);
            expect(result).toEqual([]);
        });
    });
    describe('checkUserPermission', () => {
        it('should return true when user has permission', async () => {
            const mockPermission = {
                get: jest.fn().mockImplementation((key) => ({ moduleId: 1, action: 'create' }[key])),
            };
            jest.spyOn(permissionService, 'getUserPermissions').mockResolvedValue([mockPermission]);
            const result = await permissionService.checkUserPermission(1, 1, 'create');
            expect(result.hasPermission).toBe(true);
        });
        it('should return false when user does not have permission', async () => {
            jest.spyOn(permissionService, 'getUserPermissions').mockResolvedValue([]);
            const result = await permissionService.checkUserPermission(1, 1, 'create');
            expect(result.hasPermission).toBe(false);
        });
    });
    describe('assignUserToGroup', () => {
        it('should assign user to group successfully', async () => {
            MockedUser.findByPk.mockResolvedValue({ id: 1 });
            MockedGroup.findByPk.mockResolvedValue({ id: 1 });
            MockedUserGroup.findOne.mockResolvedValue(null);
            MockedUserGroup.create.mockResolvedValue({});
            await permissionService.assignUserToGroup(1, 1);
            expect(MockedUserGroup.create).toHaveBeenCalledWith({ userId: 1, groupId: 1 });
        });
        it('should throw ConflictError when assignment already exists', async () => {
            MockedUser.findByPk.mockResolvedValue({ id: 1 });
            MockedGroup.findByPk.mockResolvedValue({ id: 1 });
            MockedUserGroup.findOne.mockResolvedValue({ userId: 1, groupId: 1 });
            await expect(permissionService.assignUserToGroup(1, 1)).rejects.toThrow(errors_1.ConflictError);
        });
    });
    describe('assignRoleToGroup', () => {
        it('should assign role to group successfully', async () => {
            MockedGroup.findByPk.mockResolvedValue({ id: 1 });
            MockedRole.findByPk.mockResolvedValue({ id: 1 });
            MockedGroupRole.findOne.mockResolvedValue(null);
            MockedGroupRole.create.mockResolvedValue({});
            await permissionService.assignRoleToGroup(1, 1);
            expect(MockedGroupRole.create).toHaveBeenCalledWith({ groupId: 1, roleId: 1 });
        });
        it('should throw ConflictError when assignment already exists', async () => {
            MockedGroup.findByPk.mockResolvedValue({ id: 1 });
            MockedRole.findByPk.mockResolvedValue({ id: 1 });
            MockedGroupRole.findOne.mockResolvedValue({ groupId: 1, roleId: 1 });
            await expect(permissionService.assignRoleToGroup(1, 1)).rejects.toThrow(errors_1.ConflictError);
        });
    });
    describe('assignPermissionToRole', () => {
        it('should assign permission to role successfully', async () => {
            MockedRole.findByPk.mockResolvedValue({ id: 1 });
            MockedPermission.findByPk.mockResolvedValue({ id: 1 });
            MockedRolePermission.findOne.mockResolvedValue(null);
            MockedRolePermission.create.mockResolvedValue({});
            await permissionService.assignPermissionToRole(1, 1);
            expect(MockedRolePermission.create).toHaveBeenCalledWith({ roleId: 1, permissionId: 1 });
        });
        it('should throw ConflictError when assignment already exists', async () => {
            MockedRole.findByPk.mockResolvedValue({ id: 1 });
            MockedPermission.findByPk.mockResolvedValue({ id: 1 });
            MockedRolePermission.findOne.mockResolvedValue({ roleId: 1, permissionId: 1 });
            await expect(permissionService.assignPermissionToRole(1, 1)).rejects.toThrow(errors_1.ConflictError);
        });
    });
});
