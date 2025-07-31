import { PermissionService, PermissionFilters, PermissionWithModule } from '../../../src/services/permission.service';
import User from '../../../src/models/user.model';
import { Group } from '../../../src/models/group.model';
import { Role } from '../../../src/models/role.model';
import { Permission } from '../../../src/models/permission.model';
import { Module } from '../../../src/models/module.model';
import { UserGroup } from '../../../src/models/userGroup.model';
import { GroupRole } from '../../../src/models/groupRole.model';
import { RolePermission } from '../../../src/models/rolePermission.model';
import { NotFoundError, ConflictError } from '../../../src/utils/errors';
import { Op } from 'sequelize';

// Mock models
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/role.model');
jest.mock('../../../src/models/permission.model');
jest.mock('../../../src/models/module.model');
jest.mock('../../../src/models/userGroup.model');
jest.mock('../../../src/models/groupRole.model');
jest.mock('../../../src/models/rolePermission.model');

const MockedUser = User as jest.Mocked<typeof User>;
const MockedGroup = Group as jest.Mocked<typeof Group>;
const MockedRole = Role as jest.Mocked<typeof Role>;
const MockedPermission = Permission as jest.Mocked<typeof Permission>;
const MockedModule = Module as jest.Mocked<typeof Module>;
const MockedUserGroup = UserGroup as jest.Mocked<typeof UserGroup>;
const MockedGroupRole = GroupRole as jest.Mocked<typeof GroupRole>;
const MockedRolePermission = RolePermission as jest.Mocked<typeof RolePermission>;

describe('PermissionService', () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    permissionService = new PermissionService();
    jest.clearAllMocks();
  });

  describe('getPermissions', () => {
    let mockModule: any;
    let mockPermission: any;

    beforeEach(() => {
      mockModule = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, name: 'Users' };
          return data[key];
        }),
      };

      mockPermission = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
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
      } as any);

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
      MockedPermission.findAndCountAll.mockResolvedValue({ rows: [], count: 0 } as any);

      await permissionService.getPermissions({ search: 'create' });

      expect(MockedPermission.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { name: { [Op.like]: '%create%' } },
            { description: { [Op.like]: '%create%' } },
          ],
        },
        include: expect.any(Array),
        limit: 50,
        offset: 0,
        order: [['createdAt', 'DESC']],
      });
    });

    it('should apply moduleId and action filters', async () => {
      MockedPermission.findAndCountAll.mockResolvedValue({ rows: [], count: 0 } as any);

      await permissionService.getPermissions({ moduleId: 1, action: 'create' });

      expect(MockedPermission.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { moduleId: 1, action: 'create' },
        })
      );
    });
  });

  describe('getPermissionById', () => {
    it('should return permission when found', async () => {
      const mockModule = {
        get: jest.fn().mockImplementation((key: string) => ({ id: 1, name: 'Users' }[key])),
      };

      const mockPermission = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
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

      MockedPermission.findByPk.mockResolvedValue(mockPermission as any);

      const result = await permissionService.getPermissionById(1);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Users Create');
      expect(result.module.name).toBe('Users');
    });

    it('should throw NotFoundError when permission not found', async () => {
      MockedPermission.findByPk.mockResolvedValue(null);

      await expect(permissionService.getPermissionById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createPermission', () => {
    it('should create permission successfully', async () => {
      const permissionData = {
        name: 'Users Create',
        action: 'create' as const,
        moduleId: 1,
      };

      MockedPermission.findOne.mockResolvedValue(null);
      MockedModule.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedPermission.create.mockResolvedValue({ id: 1 } as any);
      
      jest.spyOn(permissionService, 'getPermissionById').mockResolvedValue({
        id: 1,
        name: 'Users Create',
        action: 'create',
        moduleId: 1,
        isActive: true,
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
      MockedPermission.findOne.mockResolvedValue({ id: 1 } as any);

      await expect(permissionService.createPermission({
        name: 'Users Create',
        action: 'create',
        moduleId: 1,
      })).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError when module not found', async () => {
      MockedPermission.findOne.mockResolvedValue(null);
      MockedModule.findByPk.mockResolvedValue(null);

      await expect(permissionService.createPermission({
        name: 'Users Create',
        action: 'create',
        moduleId: 999,
      })).rejects.toThrow(NotFoundError);
    });
  });

  describe('updatePermission', () => {
    it('should update permission successfully', async () => {
      const mockPermission = {
        get: jest.fn().mockImplementation((key: string) => ({ name: 'Users Create', action: 'create', moduleId: 1 }[key])),
        update: jest.fn(),
      };

      MockedPermission.findByPk.mockResolvedValue(mockPermission as any);
      jest.spyOn(permissionService, 'getPermissionById').mockResolvedValue({
        id: 1,
        name: 'Users Create',
        action: 'create',
        moduleId: 1,
        isActive: true,
        module: { id: 1, name: 'Users' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await permissionService.updatePermission(1, { description: 'Updated' });

      expect(mockPermission.update).toHaveBeenCalledWith({ description: 'Updated' });
    });

    it('should throw NotFoundError when permission not found', async () => {
      MockedPermission.findByPk.mockResolvedValue(null);

      await expect(permissionService.updatePermission(999, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('deletePermission', () => {
    it('should delete permission successfully', async () => {
      const mockPermission = { destroy: jest.fn() };
      MockedPermission.findByPk.mockResolvedValue(mockPermission as any);

      await permissionService.deletePermission(1);

      expect(mockPermission.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundError when permission not found', async () => {
      MockedPermission.findByPk.mockResolvedValue(null);

      await expect(permissionService.deletePermission(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserPermissions', () => {
    it('should return permissions for user with groups', async () => {
      const mockUser = {
        groups: [{ get: () => 1 }],
      };

      const mockGroup = {
        get: jest.fn().mockImplementation((key: string) => {
          return key === 'roles' ? [{ get: () => 1 }] : 1;
        }),
      };

      const mockRole = {
        permissions: [{ get: jest.fn().mockImplementation((key: string) => ({ id: 1, moduleId: 1, action: 'create' }[key])) }],
      };

      MockedUser.findByPk.mockResolvedValue(mockUser as any);
      MockedGroup.findAll.mockResolvedValue([mockGroup] as any);
      MockedRole.findAll.mockResolvedValue([mockRole] as any);

      const result = await permissionService.getUserPermissions(1);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when user has no groups', async () => {
      MockedUser.findByPk.mockResolvedValue({ groups: [] } as any);

      const result = await permissionService.getUserPermissions(1);

      expect(result).toEqual([]);
    });
  });

  describe('checkUserPermission', () => {
    it('should return true when user has permission', async () => {
      const mockPermission = {
        get: jest.fn().mockImplementation((key: string) => ({ moduleId: 1, action: 'create' }[key])),
      };

      jest.spyOn(permissionService, 'getUserPermissions').mockResolvedValue([mockPermission] as any);

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
      MockedUser.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedGroup.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedUserGroup.findOne.mockResolvedValue(null);
      MockedUserGroup.create.mockResolvedValue({} as any);

      await permissionService.assignUserToGroup(1, 1);

      expect(MockedUserGroup.create).toHaveBeenCalledWith({ userId: 1, groupId: 1 });
    });

    it('should throw ConflictError when assignment already exists', async () => {
      MockedUser.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedGroup.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedUserGroup.findOne.mockResolvedValue({ userId: 1, groupId: 1 } as any);

      await expect(permissionService.assignUserToGroup(1, 1)).rejects.toThrow(ConflictError);
    });
  });

  describe('assignRoleToGroup', () => {
    it('should assign role to group successfully', async () => {
      MockedGroup.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedRole.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedGroupRole.findOne.mockResolvedValue(null);
      MockedGroupRole.create.mockResolvedValue({} as any);

      await permissionService.assignRoleToGroup(1, 1);

      expect(MockedGroupRole.create).toHaveBeenCalledWith({ groupId: 1, roleId: 1 });
    });

    it('should throw ConflictError when assignment already exists', async () => {
      MockedGroup.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedRole.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedGroupRole.findOne.mockResolvedValue({ groupId: 1, roleId: 1 } as any);

      await expect(permissionService.assignRoleToGroup(1, 1)).rejects.toThrow(ConflictError);
    });
  });

  describe('assignPermissionToRole', () => {
    it('should assign permission to role successfully', async () => {
      MockedRole.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedPermission.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedRolePermission.findOne.mockResolvedValue(null);
      MockedRolePermission.create.mockResolvedValue({} as any);

      await permissionService.assignPermissionToRole(1, 1);

      expect(MockedRolePermission.create).toHaveBeenCalledWith({ roleId: 1, permissionId: 1 });
    });

    it('should throw ConflictError when assignment already exists', async () => {
      MockedRole.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedPermission.findByPk.mockResolvedValue({ id: 1 } as any);
      MockedRolePermission.findOne.mockResolvedValue({ roleId: 1, permissionId: 1 } as any);

      await expect(permissionService.assignPermissionToRole(1, 1)).rejects.toThrow(ConflictError);
    });
  });
});
