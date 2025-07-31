import { RoleService, CreateRoleData, UpdateRoleData, RoleFilters } from '../../../src/services/role.service';
import { Role } from '../../../src/models/role.model';
import { Permission } from '../../../src/models/permission.model';
import { Group } from '../../../src/models/group.model';
import { Module } from '../../../src/models/module.model';
import { RolePermission } from '../../../src/models/rolePermission.model';
import { GroupRole } from '../../../src/models/groupRole.model';
import { NotFoundError, ConflictError, ValidationError } from '../../../src/utils/errors';
import { Op } from 'sequelize';

// Mock models
jest.mock('../../../src/models/role.model');
jest.mock('../../../src/models/permission.model');
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/module.model');
jest.mock('../../../src/models/rolePermission.model');
jest.mock('../../../src/models/groupRole.model');

const MockedRole = Role as jest.Mocked<typeof Role>;
const MockedPermission = Permission as jest.Mocked<typeof Permission>;
const MockedGroup = Group as jest.Mocked<typeof Group>;
const MockedModule = Module as jest.Mocked<typeof Module>;
const MockedRolePermission = RolePermission as jest.Mocked<typeof RolePermission>;
const MockedGroupRole = GroupRole as jest.Mocked<typeof GroupRole>;

describe('RoleService', () => {
  let roleService: RoleService;

  beforeEach(() => {
    roleService = new RoleService();
    jest.clearAllMocks();
  });

  describe('getRoles', () => {
    let mockRole: any;
    let mockPermission: any;
    let mockGroup: any;
    let mockModule: any;

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
            action: 'create',
            description: 'Create users',
          };
          return data[key];
        }),
        module: mockModule,
      };

      mockGroup = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
            id: 1,
            name: 'Administrators',
            description: 'Admin group',
          };
          return data[key];
        }),
      };

      mockRole = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
            id: 1,
            name: 'Admin',
            description: 'Administrator role',
            isActive: true,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
            permissions: [mockPermission],
            groups: [mockGroup],
          };
          return data[key];
        }),
      };
    });

    it('should return roles with default filters', async () => {
      MockedRole.findAndCountAll.mockResolvedValue({
        rows: [mockRole],
        count: 1,
      } as any);

      const result = await roleService.getRoles();

      expect(result.roles).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.roles[0]).toMatchObject({
        id: 1,
        name: 'Admin',
        description: 'Administrator role',
        isActive: true,
        permissionCount: 1,
        groupCount: 1,
      });
    });

    it('should apply search filter', async () => {
      MockedRole.findAndCountAll.mockResolvedValue({ rows: [], count: 0 } as any);

      await roleService.getRoles({ search: 'admin' });

      expect(MockedRole.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Op.or]: [
            { name: { [Op.like]: '%admin%' } },
            { description: { [Op.like]: '%admin%' } },
          ],
        },
        include: expect.any(Array),
        limit: 50,
        offset: 0,
        distinct: true,
        order: [['createdAt', 'DESC']],
      });
    });

    it('should apply isActive filter', async () => {
      MockedRole.findAndCountAll.mockResolvedValue({ rows: [], count: 0 } as any);

      await roleService.getRoles({ isActive: true });

      expect(MockedRole.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should apply hasPermissions filter', async () => {
      MockedRole.findAndCountAll.mockResolvedValue({ rows: [], count: 0 } as any);

      await roleService.getRoles({ hasPermissions: true });

      expect(MockedRole.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.arrayContaining([
            expect.objectContaining({
              model: Permission,
              required: true,
            }),
          ]),
        })
      );
    });

    it('should apply pagination and sorting', async () => {
      MockedRole.findAndCountAll.mockResolvedValue({ rows: [], count: 0 } as any);

      await roleService.getRoles({
        limit: 10,
        offset: 20,
        sortBy: 'name',
        order: 'ASC',
      });

      expect(MockedRole.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 20,
          order: [['name', 'ASC']],
        })
      );
    });
  });

  describe('getRoleById', () => {
    it('should return role when found', async () => {
      const mockRole = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
            id: 1,
            name: 'Admin',
            description: 'Administrator role',
            isActive: true,
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01'),
            permissions: [],
            groups: [],
          };
          return data[key];
        }),
      };

      MockedRole.findByPk.mockResolvedValue(mockRole as any);

      const result = await roleService.getRoleById(1);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Admin');
      expect(result.permissionCount).toBe(0);
      expect(result.groupCount).toBe(0);
    });

    it('should throw NotFoundError when role not found', async () => {
      MockedRole.findByPk.mockResolvedValue(null);

      await expect(roleService.getRoleById(999)).rejects.toThrow(NotFoundError);
      await expect(roleService.getRoleById(999)).rejects.toThrow('Role not found');
    });
  });

  describe('createRole', () => {
    it('should create role successfully', async () => {
      const roleData: CreateRoleData = {
        name: 'Admin',
        description: 'Administrator role',
        isActive: true,
      };

      const mockCreatedRole = {
        id: 1,
        name: 'Admin',
        description: 'Administrator role',
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      MockedRole.findOne.mockResolvedValue(null); // No existing role
      MockedRole.create.mockResolvedValue(mockCreatedRole as any);

      const result = await roleService.createRole(roleData);

      expect(result).toMatchObject({
        id: 1,
        name: 'Admin',
        description: 'Administrator role',
        isActive: true,
        permissions: [],
        groups: [],
        permissionCount: 0,
        groupCount: 0,
      });

      expect(MockedRole.create).toHaveBeenCalledWith({
        name: 'Admin',
        description: 'Administrator role',
        isActive: true,
      });
    });

    it('should throw ConflictError when role name already exists', async () => {
      const roleData: CreateRoleData = { name: 'Admin' };

      MockedRole.findOne.mockResolvedValue({ id: 1, name: 'Admin' } as any);

      await expect(roleService.createRole(roleData)).rejects.toThrow(ConflictError);
      await expect(roleService.createRole(roleData)).rejects.toThrow('Role name already exists');

      expect(MockedRole.create).not.toHaveBeenCalled();
    });

    it('should use default isActive value when not provided', async () => {
      const roleData: CreateRoleData = { name: 'Admin' };

      MockedRole.findOne.mockResolvedValue(null);
      MockedRole.create.mockResolvedValue({
        id: 1,
        name: 'Admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await roleService.createRole(roleData);

      expect(MockedRole.create).toHaveBeenCalledWith({
        name: 'Admin',
        isActive: true, // Default value
      });
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const updateData: UpdateRoleData = {
        description: 'Updated description',
        isActive: false,
      };

      const mockRole = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { name: 'Admin' };
          return data[key];
        }),
        update: jest.fn(),
      };

      MockedRole.findByPk.mockResolvedValue(mockRole as any);
      jest.spyOn(roleService, 'getRoleById').mockResolvedValue({
        id: 1,
        name: 'Admin',
        description: 'Updated description',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
        groups: [],
        permissionCount: 0,
        groupCount: 0,
      });

      const result = await roleService.updateRole(1, updateData);

      expect(mockRole.update).toHaveBeenCalledWith(updateData);
      expect(result.description).toBe('Updated description');
    });

    it('should throw NotFoundError when role not found', async () => {
      MockedRole.findByPk.mockResolvedValue(null);

      await expect(roleService.updateRole(999, {})).rejects.toThrow(NotFoundError);
      await expect(roleService.updateRole(999, {})).rejects.toThrow('Role not found');
    });

    it('should check for name conflicts when updating name', async () => {
      const updateData: UpdateRoleData = { name: 'New Name' };

      const mockRole = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { name: 'Old Name' };
          return data[key];
        }),
        update: jest.fn(),
      };

      MockedRole.findByPk.mockResolvedValue(mockRole as any);
      MockedRole.findOne.mockResolvedValue({ id: 2, name: 'New Name' } as any);

      await expect(roleService.updateRole(1, updateData)).rejects.toThrow(ConflictError);
      await expect(roleService.updateRole(1, updateData)).rejects.toThrow('Role name already exists');

      expect(MockedRole.findOne).toHaveBeenCalledWith({
        where: { name: 'New Name', id: { [Op.ne]: 1 } },
      });
    });
  });

  describe('deleteRole', () => {
    it('should soft delete role successfully', async () => {
      const mockRole = {
        update: jest.fn(),
      };

      MockedRole.findByPk.mockResolvedValue(mockRole as any);
      MockedGroupRole.count.mockResolvedValue(0); // No group assignments

      await roleService.deleteRole(1);

      expect(mockRole.update).toHaveBeenCalledWith({ isActive: false });
    });

    it('should throw NotFoundError when role not found', async () => {
      MockedRole.findByPk.mockResolvedValue(null);

      await expect(roleService.deleteRole(999)).rejects.toThrow(NotFoundError);
      await expect(roleService.deleteRole(999)).rejects.toThrow('Role not found');
    });

    it('should throw ValidationError when role is assigned to groups', async () => {
      const mockRole = { update: jest.fn() };

      MockedRole.findByPk.mockResolvedValue(mockRole as any);
      MockedGroupRole.count.mockResolvedValue(2); // Has group assignments

      await expect(roleService.deleteRole(1)).rejects.toThrow(ValidationError);
      await expect(roleService.deleteRole(1)).rejects.toThrow(
        'Cannot delete role assigned to groups. Remove from groups first.'
      );

      expect(mockRole.update).not.toHaveBeenCalled();
    });
  });

  describe('hardDeleteRole', () => {
    it('should hard delete role successfully', async () => {
      const mockRole = {
        destroy: jest.fn(),
      };

      MockedRole.findByPk.mockResolvedValue(mockRole as any);
      MockedRolePermission.destroy.mockResolvedValue(2 as any);
      MockedGroupRole.destroy.mockResolvedValue(1 as any);

      await roleService.hardDeleteRole(1);

      expect(MockedRolePermission.destroy).toHaveBeenCalledWith({ where: { roleId: 1 } });
      expect(MockedGroupRole.destroy).toHaveBeenCalledWith({ where: { roleId: 1 } });
      expect(mockRole.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundError when role not found', async () => {
      MockedRole.findByPk.mockResolvedValue(null);

      await expect(roleService.hardDeleteRole(999)).rejects.toThrow(NotFoundError);
      await expect(roleService.hardDeleteRole(999)).rejects.toThrow('Role not found');
    });
  });

  describe('assignPermissionsToRole', () => {
    it('should assign permissions to role successfully', async () => {
      const mockRole = { id: 1 };
      const mockPermissions = [
        { id: 1, isActive: true },
        { id: 2, isActive: true },
      ];

      MockedRole.findByPk.mockResolvedValue(mockRole as any);
      MockedPermission.findAll.mockResolvedValue(mockPermissions as any);
      MockedRolePermission.findAll.mockResolvedValue([]); // No existing assignments
      MockedRolePermission.bulkCreate.mockResolvedValue([] as any);

      const result = await roleService.assignPermissionsToRole(1, [1, 2]);

      expect(result).toEqual({ assigned: 2, skipped: 0 });
      expect(MockedRolePermission.bulkCreate).toHaveBeenCalledWith([
        { roleId: 1, permissionId: 1 },
        { roleId: 1, permissionId: 2 },
      ]);
    });

    it('should skip existing assignments', async () => {
      const mockRole = { id: 1 };
      const mockPermissions = [{ id: 1, isActive: true }];
      const existingAssignments = [{ get: () => 1 }];

      MockedRole.findByPk.mockResolvedValue(mockRole as any);
      MockedPermission.findAll.mockResolvedValue(mockPermissions as any);
      MockedRolePermission.findAll.mockResolvedValue(existingAssignments as any);

      const result = await roleService.assignPermissionsToRole(1, [1]);

      expect(result).toEqual({ assigned: 0, skipped: 1 });
      expect(MockedRolePermission.bulkCreate).not.toHaveBeenCalled();
    });

    it('should throw ValidationError when some permissions not found', async () => {
      const mockRole = { id: 1 };

      MockedRole.findByPk.mockResolvedValue(mockRole as any);
      MockedPermission.findAll.mockResolvedValue([]); // No permissions found

      await expect(roleService.assignPermissionsToRole(1, [1, 2])).rejects.toThrow(ValidationError);
      await expect(roleService.assignPermissionsToRole(1, [1, 2])).rejects.toThrow(
        'Some permissions not found or inactive'
      );
    });
  });

  describe('getRolesByPermission', () => {
    it('should return roles with specific permission', async () => {
      const mockPermission = { id: 1 };
      const mockRole = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
            id: 1,
            name: 'Admin',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [],
            groups: [],
          };
          return data[key];
        }),
      };

      MockedPermission.findByPk.mockResolvedValue(mockPermission as any);
      MockedRole.findAll.mockResolvedValue([mockRole] as any);

      const result = await roleService.getRolesByPermission(1);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should throw NotFoundError when permission not found', async () => {
      MockedPermission.findByPk.mockResolvedValue(null);

      await expect(roleService.getRolesByPermission(999)).rejects.toThrow(NotFoundError);
      await expect(roleService.getRolesByPermission(999)).rejects.toThrow('Permission not found');
    });
  });

  describe('cloneRole', () => {
    it('should clone role with permissions successfully', async () => {
      const sourceRole = {
        id: 1,
        name: 'Admin',
        permissions: [{ id: 1 }, { id: 2 }],
        groups: [],
        permissionCount: 2,
        groupCount: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newRole = {
        id: 2,
        name: 'Admin Clone',
        description: 'Clone of Admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
        groups: [],
        permissionCount: 0,
        groupCount: 0,
      };

      jest.spyOn(roleService, 'getRoleById')
        .mockResolvedValueOnce(sourceRole as any)
        .mockResolvedValueOnce({ ...newRole, permissions: sourceRole.permissions, permissionCount: 2 } as any);
      
      jest.spyOn(roleService, 'createRole').mockResolvedValue(newRole as any);
      jest.spyOn(roleService, 'assignPermissionsToRole').mockResolvedValue({ assigned: 2, skipped: 0 });

      const result = await roleService.cloneRole(1, 'Admin Clone');

      expect(result.name).toBe('Admin Clone');
      expect(result.permissionCount).toBe(2);
    });
  });

  describe('getRoleStatistics', () => {
    it('should return role statistics', async () => {
      MockedRole.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(6)  // withPermissions
        .mockResolvedValueOnce(4); // withGroups

      MockedRolePermission.count.mockResolvedValue(20); // permissionCounts
      MockedGroupRole.count.mockResolvedValue(15); // groupCounts

      const result = await roleService.getRoleStatistics();

      expect(result).toEqual({
        total: 10,
        active: 8,
        inactive: 2,
        withPermissions: 6,
        withoutPermissions: 4,
        withGroups: 4,
        withoutGroups: 6,
        averagePermissionsPerRole: 2,
        averageGroupsPerRole: 1.5,
      });
    });

    it('should handle zero roles', async () => {
      MockedRole.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // active
        .mockResolvedValueOnce(0) // withPermissions
        .mockResolvedValueOnce(0); // withGroups

      MockedRolePermission.count.mockResolvedValue(0);
      MockedGroupRole.count.mockResolvedValue(0);

      const result = await roleService.getRoleStatistics();

      expect(result.averagePermissionsPerRole).toBe(0);
      expect(result.averageGroupsPerRole).toBe(0);
    });
  });
});
