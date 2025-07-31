import { UserPermissionService, PermissionCheckResult, UserPermissionData } from '../../../src/services/userPermission.service';
import User from '../../../src/models/user.model';
import { Group } from '../../../src/models/group.model';
import { Role } from '../../../src/models/role.model';
import { Permission } from '../../../src/models/permission.model';
import { Module } from '../../../src/models/module.model';
import { NotFoundError, BadRequestError } from '../../../src/utils/errors';

// Mock models
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/role.model');
jest.mock('../../../src/models/permission.model');
jest.mock('../../../src/models/module.model');

const MockedUser = User as jest.Mocked<typeof User>;
const MockedGroup = Group as jest.Mocked<typeof Group>;
const MockedRole = Role as jest.Mocked<typeof Role>;
const MockedPermission = Permission as jest.Mocked<typeof Permission>;
const MockedModule = Module as jest.Mocked<typeof Module>;

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('UserPermissionService', () => {
  let userPermissionService: UserPermissionService;

  beforeEach(() => {
    userPermissionService = new UserPermissionService();
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should return permissions for user with groups and roles', async () => {
      const mockModule = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, name: 'Users', description: 'User management' };
          return data[key];
        }),
      };

      const mockPermission = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
            id: 1,
            moduleId: 1,
            action: 'create',
            description: 'Create users',
            isActive: true,
            module: mockModule,
          };
          return data[key];
        }),
      };

      const mockRole = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
            id: 1,
            name: 'Admin',
            permissions: [mockPermission],
          };
          return data[key];
        }),
      };

      const mockGroup = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
            id: 1,
            name: 'Administrators',
            roles: [mockRole],
          };
          return data[key];
        }),
      };

      const mockUser = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
            id: 1,
            groups: [mockGroup],
          };
          return data[key];
        }),
      };

      MockedUser.findByPk.mockResolvedValue(mockUser as any);

      const result = await userPermissionService.getUserPermissions(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockPermission);
      expect(MockedUser.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: Group,
            as: 'groups',
            through: { attributes: [] },
            include: [
              {
                model: Role,
                as: 'roles',
                through: { attributes: [] },
                include: [
                  {
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] },
                    include: [
                      {
                        model: Module,
                        as: 'module',
                        attributes: ['id', 'name', 'description'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    it('should return empty array when user has no groups', async () => {
      const mockUser = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, groups: [] };
          return data[key];
        }),
      };

      MockedUser.findByPk.mockResolvedValue(mockUser as any);

      const result = await userPermissionService.getUserPermissions(1);

      expect(result).toEqual([]);
    });

    it('should return empty array when groups have no roles', async () => {
      const mockGroup = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, name: 'Empty Group', roles: [] };
          return data[key];
        }),
      };

      const mockUser = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, groups: [mockGroup] };
          return data[key];
        }),
      };

      MockedUser.findByPk.mockResolvedValue(mockUser as any);

      const result = await userPermissionService.getUserPermissions(1);

      expect(result).toEqual([]);
    });

    it('should remove duplicate permissions', async () => {
      const mockModule = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, name: 'Users' };
          return data[key];
        }),
      };

      const mockPermission = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, moduleId: 1, action: 'create' };
          return data[key];
        }),
      };

      // Same permission in two different roles
      const mockRole1 = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, permissions: [mockPermission] };
          return data[key];
        }),
      };

      const mockRole2 = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 2, permissions: [mockPermission] };
          return data[key];
        }),
      };

      const mockGroup = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, roles: [mockRole1, mockRole2] };
          return data[key];
        }),
      };

      const mockUser = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, groups: [mockGroup] };
          return data[key];
        }),
      };

      MockedUser.findByPk.mockResolvedValue(mockUser as any);

      const result = await userPermissionService.getUserPermissions(1);

      expect(result).toHaveLength(1); // Should be deduplicated
    });

    it('should throw NotFoundError when user not found', async () => {
      MockedUser.findByPk.mockResolvedValue(null);

      await expect(userPermissionService.getUserPermissions(999)).rejects.toThrow(NotFoundError);
      await expect(userPermissionService.getUserPermissions(999)).rejects.toThrow('User not found');
    });
  });

  describe('checkUserPermission', () => {
    it('should return true when user has permission', async () => {
      const mockModule = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, name: 'Users' };
          return data[key];
        }),
      };

      const mockPermission = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { moduleId: 1, action: 'create' };
          return data[key];
        }),
      };

      MockedModule.findOne.mockResolvedValue(mockModule as any);
      jest.spyOn(userPermissionService, 'getUserPermissions').mockResolvedValue([mockPermission] as any);

      const result = await userPermissionService.checkUserPermission(1, 'Users', 'create');

      expect(result).toBe(true);
      expect(MockedModule.findOne).toHaveBeenCalledWith({ where: { name: 'Users' } });
    });

    it('should return false when user does not have permission', async () => {
      const mockModule = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, name: 'Users' };
          return data[key];
        }),
      };

      MockedModule.findOne.mockResolvedValue(mockModule as any);
      jest.spyOn(userPermissionService, 'getUserPermissions').mockResolvedValue([]);

      const result = await userPermissionService.checkUserPermission(1, 'Users', 'create');

      expect(result).toBe(false);
    });

    it('should throw NotFoundError when module not found', async () => {
      MockedModule.findOne.mockResolvedValue(null);

      await expect(userPermissionService.checkUserPermission(1, 'NonExistent', 'create')).rejects.toThrow(NotFoundError);
      await expect(userPermissionService.checkUserPermission(1, 'NonExistent', 'create')).rejects.toThrow(
        "Module 'NonExistent' not found"
      );
    });

    it('should throw BadRequestError for invalid action', async () => {
      const mockModule = { get: () => 1 };
      MockedModule.findOne.mockResolvedValue(mockModule as any);

      await expect(userPermissionService.checkUserPermission(1, 'Users', 'invalid')).rejects.toThrow(BadRequestError);
      await expect(userPermissionService.checkUserPermission(1, 'Users', 'invalid')).rejects.toThrow(
        'Action must be one of: create, read, update, delete'
      );
    });
  });

  describe('simulateUserAction', () => {
    it('should return permission check result when user has permission', async () => {
      const mockUser = { id: 1 };
      const mockModule = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, name: 'Users' };
          return data[key];
        }),
      };

      const mockPermission = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { moduleId: 1, action: 'create' };
          return data[key];
        }),
      };

      MockedUser.findByPk.mockResolvedValue(mockUser as any);
      MockedModule.findByPk.mockResolvedValue(mockModule as any);
      jest.spyOn(userPermissionService, 'getUserPermissions').mockResolvedValue([mockPermission] as any);

      const result = await userPermissionService.simulateUserAction(1, 1, 'create');

      expect(result).toEqual({
        userId: 1,
        moduleId: 1,
        moduleName: 'Users',
        action: 'create',
        hasPermission: true,
      });
    });

    it('should return permission check result when user does not have permission', async () => {
      const mockUser = { id: 1 };
      const mockModule = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = { id: 1, name: 'Users' };
          return data[key];
        }),
      };

      MockedUser.findByPk.mockResolvedValue(mockUser as any);
      MockedModule.findByPk.mockResolvedValue(mockModule as any);
      jest.spyOn(userPermissionService, 'getUserPermissions').mockResolvedValue([]);

      const result = await userPermissionService.simulateUserAction(1, 1, 'create');

      expect(result).toEqual({
        userId: 1,
        moduleId: 1,
        moduleName: 'Users',
        action: 'create',
        hasPermission: false,
      });
    });

    it('should throw NotFoundError when user not found', async () => {
      MockedUser.findByPk.mockResolvedValue(null);

      await expect(userPermissionService.simulateUserAction(999, 1, 'create')).rejects.toThrow(NotFoundError);
      await expect(userPermissionService.simulateUserAction(999, 1, 'create')).rejects.toThrow(
        'User with ID 999 not found'
      );
    });

    it('should throw NotFoundError when module not found', async () => {
      const mockUser = { id: 1 };

      MockedUser.findByPk.mockResolvedValue(mockUser as any);
      MockedModule.findByPk.mockResolvedValue(null);

      await expect(userPermissionService.simulateUserAction(1, 999, 'create')).rejects.toThrow(NotFoundError);
      await expect(userPermissionService.simulateUserAction(1, 999, 'create')).rejects.toThrow(
        'Module with ID 999 not found'
      );
    });

    it('should throw BadRequestError for invalid action', async () => {
      const mockUser = { id: 1 };
      const mockModule = { get: () => 'Users' };

      MockedUser.findByPk.mockResolvedValue(mockUser as any);
      MockedModule.findByPk.mockResolvedValue(mockModule as any);

      await expect(userPermissionService.simulateUserAction(1, 1, 'invalid')).rejects.toThrow(BadRequestError);
      await expect(userPermissionService.simulateUserAction(1, 1, 'invalid')).rejects.toThrow(
        'Action must be one of: create, read, update, delete'
      );
    });
  });

  describe('getFormattedUserPermissions', () => {
    it('should return formatted user permissions', async () => {
      const mockModule = {
        name: 'Users',
      };

      const mockPermission = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
            id: 1,
            moduleId: 1,
            action: 'create',
            description: 'Create users',
            isActive: true,
            module: mockModule,
          };
          return data[key];
        }),
      };

      jest.spyOn(userPermissionService, 'getUserPermissions').mockResolvedValue([mockPermission] as any);

      const result = await userPermissionService.getFormattedUserPermissions(1);

      expect(result).toEqual([
        {
          id: 1,
          moduleId: 1,
          moduleName: 'Users',
          action: 'create',
          description: 'Create users',
          isActive: true,
        },
      ]);
    });

    it('should handle permissions with missing module information', async () => {
      const mockPermission = {
        get: jest.fn().mockImplementation((key: string) => {
          const data: any = {
            id: 1,
            moduleId: 1,
            action: 'create',
            description: 'Create users',
            isActive: true,
            module: null,
          };
          return data[key];
        }),
      };

      jest.spyOn(userPermissionService, 'getUserPermissions').mockResolvedValue([mockPermission] as any);

      const result = await userPermissionService.getFormattedUserPermissions(1);

      expect(result[0].moduleName).toBe('Unknown');
    });

    it('should handle empty permissions array', async () => {
      jest.spyOn(userPermissionService, 'getUserPermissions').mockResolvedValue([]);

      const result = await userPermissionService.getFormattedUserPermissions(1);

      expect(result).toEqual([]);
    });
  });
});
