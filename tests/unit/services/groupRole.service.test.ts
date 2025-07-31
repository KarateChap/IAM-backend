import { GroupRoleService } from '../../../src/services/groupRole.service';
import { Group } from '../../../src/models/group.model';
import { Role } from '../../../src/models/role.model';
import { GroupRole } from '../../../src/models/groupRole.model';
import { NotFoundError, BadRequestError } from '../../../src/utils/errors';

// Mock the models
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/role.model');
jest.mock('../../../src/models/groupRole.model');

const MockedGroup = Group as jest.MockedClass<typeof Group>;
const MockedRole = Role as jest.MockedClass<typeof Role>;
const MockedGroupRole = GroupRole as jest.MockedClass<typeof GroupRole>;

describe('GroupRoleService', () => {
  let groupRoleService: GroupRoleService;

  beforeEach(() => {
    groupRoleService = new GroupRoleService();
    jest.clearAllMocks();
  });

  describe('assignRolesToGroup', () => {
    it('should successfully assign roles to a group', async () => {
      const groupId = 1;
      const roleIds = [1, 2];

      // Mock group exists
      const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
      MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);

      // Mock roles exist
      const mockRoles = [
        { get: jest.fn((key) => key === 'id' ? 1 : 'Role 1') },
        { get: jest.fn((key) => key === 'id' ? 2 : 'Role 2') }
      ];
      MockedRole.findAll = jest.fn().mockResolvedValue(mockRoles);

      // Mock no existing assignments
      MockedGroupRole.findAll = jest.fn().mockResolvedValue([]);

      // Mock successful creation
      MockedGroupRole.create = jest.fn().mockResolvedValue({});

      const result = await groupRoleService.assignRolesToGroup(groupId, roleIds);

      expect(result.assigned).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.details).toHaveLength(2);
      expect(result.details[0].status).toBe('assigned');
      expect(result.details[1].status).toBe('assigned');

      expect(MockedGroup.findByPk).toHaveBeenCalledWith(groupId);
      expect(MockedRole.findAll).toHaveBeenCalledWith({ where: { id: roleIds } });
      expect(MockedGroupRole.create).toHaveBeenCalledTimes(2);
    });

    it('should skip already assigned roles', async () => {
      const groupId = 1;
      const roleIds = [1, 2];

      // Mock group exists
      const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
      MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);

      // Mock roles exist
      const mockRoles = [
        { get: jest.fn((key) => key === 'id' ? 1 : 'Role 1') },
        { get: jest.fn((key) => key === 'id' ? 2 : 'Role 2') }
      ];
      MockedRole.findAll = jest.fn().mockResolvedValue(mockRoles);

      // Mock one existing assignment
      const mockExistingAssignment = { get: jest.fn().mockReturnValue(1) };
      MockedGroupRole.findAll = jest.fn().mockResolvedValue([mockExistingAssignment]);

      // Mock successful creation for new role
      MockedGroupRole.create = jest.fn().mockResolvedValue({});

      const result = await groupRoleService.assignRolesToGroup(groupId, roleIds);

      expect(result.assigned).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.details).toHaveLength(2);
      expect(result.details[0].status).toBe('already_exists');
      expect(result.details[1].status).toBe('assigned');

      expect(MockedGroupRole.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError if group does not exist', async () => {
      const groupId = 999;
      const roleIds = [1, 2];

      MockedGroup.findByPk = jest.fn().mockResolvedValue(null);

      await expect(groupRoleService.assignRolesToGroup(groupId, roleIds))
        .rejects.toThrow(NotFoundError);

      expect(MockedGroup.findByPk).toHaveBeenCalledWith(groupId);
    });

    it('should throw BadRequestError if roleIds is not an array', async () => {
      const groupId = 1;
      const roleIds = 'not-an-array' as any;

      // Mock group exists
      const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
      MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);

      await expect(groupRoleService.assignRolesToGroup(groupId, roleIds))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if roleIds is empty', async () => {
      const groupId = 1;
      const roleIds: number[] = [];

      // Mock group exists
      const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
      MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);

      await expect(groupRoleService.assignRolesToGroup(groupId, roleIds))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if some roles do not exist', async () => {
      const groupId = 1;
      const roleIds = [1, 2, 999];

      // Mock group exists
      const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
      MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);

      // Mock only 2 out of 3 roles exist
      const mockRoles = [
        { get: jest.fn((key) => key === 'id' ? 1 : 'Role 1') },
        { get: jest.fn((key) => key === 'id' ? 2 : 'Role 2') }
      ];
      MockedRole.findAll = jest.fn().mockResolvedValue(mockRoles);

      await expect(groupRoleService.assignRolesToGroup(groupId, roleIds))
        .rejects.toThrow(NotFoundError);

      expect(MockedRole.findAll).toHaveBeenCalledWith({ where: { id: roleIds } });
    });
  });

  describe('removeRolesFromGroup', () => {
    it('should successfully remove roles from a group', async () => {
      const groupId = 1;
      const roleIds = [1, 2];

      // Mock group exists
      const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
      MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);

      // Mock roles exist
      const mockRoles = [
        { get: jest.fn((key) => key === 'id' ? 1 : 'Role 1') },
        { get: jest.fn((key) => key === 'id' ? 2 : 'Role 2') }
      ];
      MockedRole.findAll = jest.fn().mockResolvedValue(mockRoles);

      // Mock existing assignments
      const mockExistingAssignments = [
        { get: jest.fn().mockReturnValue(1) },
        { get: jest.fn().mockReturnValue(2) }
      ];
      MockedGroupRole.findAll = jest.fn().mockResolvedValue(mockExistingAssignments);

      // Mock successful deletion
      MockedGroupRole.destroy = jest.fn().mockResolvedValue(2);

      const result = await groupRoleService.removeRolesFromGroup(groupId, roleIds);

      expect(result.removed).toBe(2);
      expect(result.notFound).toBe(0);
      expect(result.details).toHaveLength(2);
      expect(result.details[0].status).toBe('removed');
      expect(result.details[1].status).toBe('removed');

      expect(MockedGroupRole.destroy).toHaveBeenCalledWith({
        where: { groupId, roleId: [1, 2] }
      });
    });

    it('should handle roles not assigned to group', async () => {
      const groupId = 1;
      const roleIds = [1, 2];

      // Mock group exists
      const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
      MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);

      // Mock roles exist
      const mockRoles = [
        { get: jest.fn((key) => key === 'id' ? 1 : 'Role 1') },
        { get: jest.fn((key) => key === 'id' ? 2 : 'Role 2') }
      ];
      MockedRole.findAll = jest.fn().mockResolvedValue(mockRoles);

      // Mock no existing assignments
      MockedGroupRole.findAll = jest.fn().mockResolvedValue([]);

      // Mock no deletions
      MockedGroupRole.destroy = jest.fn().mockResolvedValue(0);

      const result = await groupRoleService.removeRolesFromGroup(groupId, roleIds);

      expect(result.removed).toBe(0);
      expect(result.notFound).toBe(2);
      expect(result.details).toHaveLength(2);
      expect(result.details[0].status).toBe('not_found');
      expect(result.details[1].status).toBe('not_found');
    });
  });

  describe('getGroupRoles', () => {
    it('should return roles for a group', async () => {
      const groupId = 1;

      const mockRoles = [
        { get: jest.fn((key) => key === 'name' ? 'Role 1' : 1) },
        { get: jest.fn((key) => key === 'name' ? 'Role 2' : 2) }
      ];

      const mockGroup = {
        get: jest.fn().mockReturnValue(mockRoles)
      };

      MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);

      const result = await groupRoleService.getGroupRoles(groupId);

      expect(result).toEqual(mockRoles);
      expect(MockedGroup.findByPk).toHaveBeenCalledWith(groupId, {
        include: [{
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          attributes: ['id', 'name', 'description', 'isActive']
        }]
      });
    });

    it('should throw NotFoundError if group does not exist', async () => {
      const groupId = 999;

      MockedGroup.findByPk = jest.fn().mockResolvedValue(null);

      await expect(groupRoleService.getGroupRoles(groupId))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('groupHasRole', () => {
    it('should return true if group has role', async () => {
      const groupId = 1;
      const roleId = 1;

      const mockAssignment = { get: jest.fn() };
      MockedGroupRole.findOne = jest.fn().mockResolvedValue(mockAssignment);

      const result = await groupRoleService.groupHasRole(groupId, roleId);

      expect(result).toBe(true);
      expect(MockedGroupRole.findOne).toHaveBeenCalledWith({
        where: { groupId, roleId }
      });
    });

    it('should return false if group does not have role', async () => {
      const groupId = 1;
      const roleId = 1;

      MockedGroupRole.findOne = jest.fn().mockResolvedValue(null);

      const result = await groupRoleService.groupHasRole(groupId, roleId);

      expect(result).toBe(false);
    });
  });

  describe('replaceGroupRoles', () => {
    it('should replace all roles for a group', async () => {
      const groupId = 1;
      const roleIds = [1, 2];

      // Mock group exists
      const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
      MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);

      // Mock destroy existing assignments
      MockedGroupRole.destroy = jest.fn().mockResolvedValue(3);

      // Mock roles exist
      const mockRoles = [
        { get: jest.fn((key) => key === 'id' ? 1 : 'Role 1') },
        { get: jest.fn((key) => key === 'id' ? 2 : 'Role 2') }
      ];
      MockedRole.findAll = jest.fn().mockResolvedValue(mockRoles);

      // Mock no existing assignments after deletion
      MockedGroupRole.findAll = jest.fn().mockResolvedValue([]);

      // Mock successful creation
      MockedGroupRole.create = jest.fn().mockResolvedValue({});

      const result = await groupRoleService.replaceGroupRoles(groupId, roleIds);

      expect(result.assigned).toBe(2);
      expect(result.skipped).toBe(0);

      // Should destroy existing assignments first
      expect(MockedGroupRole.destroy).toHaveBeenCalledWith({
        where: { groupId }
      });

      // Then assign new roles
      expect(MockedGroupRole.create).toHaveBeenCalledTimes(2);
    });

    it('should handle empty roleIds array', async () => {
      const groupId = 1;
      const roleIds: number[] = [];

      // Mock group exists
      const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
      MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);

      // Mock destroy existing assignments
      MockedGroupRole.destroy = jest.fn().mockResolvedValue(2);

      const result = await groupRoleService.replaceGroupRoles(groupId, roleIds);

      expect(result.assigned).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.details).toHaveLength(0);

      // Should still destroy existing assignments
      expect(MockedGroupRole.destroy).toHaveBeenCalledWith({
        where: { groupId }
      });
    });
  });
});
