import { GroupService, CreateGroupData, UpdateGroupData, GroupWithDetails } from '../../../src/services/group.service';
import { Group } from '../../../src/models/group.model';
import User from '../../../src/models/user.model';
import { Role } from '../../../src/models/role.model';
import { GroupRole } from '../../../src/models/groupRole.model';
import { UserGroup } from '../../../src/models/userGroup.model';
import { NotFoundError, ConflictError, ValidationError } from '../../../src/utils/errors';
import { mockGroup, mockUser, mockRole } from '../../helpers/mockData';

// Mock dependencies
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/role.model');
jest.mock('../../../src/models/groupRole.model');
jest.mock('../../../src/models/userGroup.model');

const MockedGroup = Group as jest.Mocked<typeof Group>;
const MockedUser = User as jest.Mocked<typeof User>;
const MockedRole = Role as jest.Mocked<typeof Role>;
const MockedGroupRole = GroupRole as jest.Mocked<typeof GroupRole>;
const MockedUserGroup = UserGroup as jest.Mocked<typeof UserGroup>;

describe('GroupService', () => {
  let groupService: GroupService;

  beforeEach(() => {
    groupService = new GroupService();
    jest.clearAllMocks();
  });

  describe('getGroups', () => {
    it('should return groups with default filters', async () => {
      // Arrange
      const mockGroupWithDetails = {
        ...mockGroup,
        get: jest.fn((key) => (mockGroup as any)[key]),
        users: [],
        roles: [],
        userCount: 0,
        roleCount: 0
      };
      MockedGroup.findAndCountAll.mockResolvedValue({
        rows: [mockGroupWithDetails],
        count: 1
      } as any);

      // Act
      const result = await groupService.getGroups({});

      // Assert
      expect(MockedGroup.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            required: false
          },
          {
            model: User,
            as: 'users',
            through: { attributes: [] },
            required: false,
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ],
        limit: 50,
        offset: 0,
        order: [['createdAt', 'DESC']],
        distinct: true
      });
      expect(result.groups).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply search filter', async () => {
      // Arrange
      const mockGroupWithDetails = {
        ...mockGroup,
        get: jest.fn((key) => (mockGroup as any)[key]),
        users: [],
        roles: [],
        userCount: 0,
        roleCount: 0
      };
      MockedGroup.findAndCountAll.mockResolvedValue({
        rows: [mockGroupWithDetails],
        count: 1
      } as any);

      // Act
      const result = await groupService.getGroups({ search: 'test' });

      // Assert
      expect(MockedGroup.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Symbol.for('or')]: [
            { name: { [Symbol.for('like')]: '%test%' } },
            { description: { [Symbol.for('like')]: '%test%' } }
          ]
        },
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            required: false
          },
          {
            model: User,
            as: 'users',
            through: { attributes: [] },
            required: false,
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ],
        limit: 50,
        offset: 0,
        order: [['createdAt', 'DESC']],
        distinct: true
      });
      expect(result.groups).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply isActive filter', async () => {
      // Arrange
      const mockGroupWithDetails = {
        ...mockGroup,
        get: jest.fn((key) => (mockGroup as any)[key]),
        users: [],
        roles: [],
        userCount: 0,
        roleCount: 0
      };
      MockedGroup.findAndCountAll.mockResolvedValue({
        rows: [mockGroupWithDetails],
        count: 1
      } as any);

      // Act
      const result = await groupService.getGroups({ isActive: true });

      // Assert
      expect(MockedGroup.findAndCountAll).toHaveBeenCalledWith({
        where: {
          isActive: true
        },
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            required: false
          },
          {
            model: User,
            as: 'users',
            through: { attributes: [] },
            required: false,
            attributes: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        ],
        limit: 50,
        offset: 0,
        order: [['createdAt', 'DESC']],
        distinct: true
      });
      expect(result.groups).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getGroupById', () => {
    it('should return group when found', async () => {
      // Arrange
      const mockGroupWithDetails = {
        ...mockGroup,
        get: jest.fn((key) => (mockGroup as any)[key]),
        users: [],
        roles: [],
        userCount: 0,
        roleCount: 0
      };
      MockedGroup.findByPk.mockResolvedValue(mockGroupWithDetails as any);

      // Act
      const result = await groupService.getGroupById(1);

      // Assert
      expect(MockedGroup.findByPk).toHaveBeenCalledWith(1, {
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] }
          },
          {
            model: User,
            as: 'users',
            attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
            through: { attributes: [] }
          }
        ]
      });
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Group');
    });

    it('should throw NotFoundError when group not found', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(groupService.getGroupById(999))
        .rejects
        .toThrow(new NotFoundError('Group not found'));
    });
  });

  describe('createGroup', () => {
    const createData: CreateGroupData = {
      name: 'Test Group',
      description: 'A test group'
    };

    it('should create group successfully', async () => {
      // Arrange
      const mockGroupWithDetails = {
        ...mockGroup,
        get: jest.fn((key) => (mockGroup as any)[key]),
        users: [],
        roles: [],
        userCount: 0,
        roleCount: 0
      };
      MockedGroup.findOne.mockResolvedValue(null);
      MockedGroup.create.mockResolvedValue(mockGroup as any);
      MockedGroup.findByPk.mockResolvedValue(mockGroupWithDetails as any);

      // Act
      const result = await groupService.createGroup(createData);

      // Assert
      expect(MockedGroup.findOne).toHaveBeenCalledWith({
        where: { name: createData.name }
      });
      expect(MockedGroup.create).toHaveBeenCalledWith({
        name: createData.name,
        description: createData.description,
        isActive: true
      });
      expect(result.id).toBe(1);
      expect(result.name).toBe('Test Group');
      expect(result.users).toEqual([]);
      expect(result.roles).toEqual([]);
    });

    it('should throw ConflictError if group name already exists', async () => {
      // Arrange
      MockedGroup.findOne.mockResolvedValue(mockGroup as any);

      // Act & Assert
      await expect(groupService.createGroup(createData))
        .rejects
        .toThrow(new ConflictError('Group name already exists'));
    });
  });

  describe('updateGroup', () => {
    const updateData: UpdateGroupData = {
      name: 'Updated Group',
      description: 'Updated description'
    };

    it('should update group successfully', async () => {
      // Arrange
      const mockGroupWithDetails = {
        ...mockGroup,
        get: jest.fn((key) => (mockGroup as any)[key]),
        users: [],
        roles: [],
        userCount: 0,
        roleCount: 0,
        update: jest.fn().mockResolvedValue(mockGroup)
      };
      MockedGroup.findByPk.mockResolvedValue(mockGroupWithDetails as any);
      MockedGroup.findOne.mockResolvedValue(null);

      // Act
      const result = await groupService.updateGroup(1, updateData);

      // Assert
      expect(MockedGroup.findByPk).toHaveBeenCalledWith(1);
      expect(MockedGroup.findOne).toHaveBeenCalledWith({
        where: {
          name: updateData.name,
          id: { [Symbol.for('ne')]: 1 }
        }
      });
      expect(mockGroupWithDetails.update).toHaveBeenCalledWith(updateData);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundError when group not found', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(groupService.updateGroup(999, updateData))
        .rejects
        .toThrow(new NotFoundError('Group not found'));
    });

    it('should throw ConflictError if name already exists', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(mockGroup as any);
      const existingGroup = { ...mockGroup, id: 2 };
      MockedGroup.findOne.mockResolvedValue(existingGroup as any);

      // Act & Assert
      await expect(groupService.updateGroup(1, updateData))
        .rejects
        .toThrow(new ConflictError('Group name already exists'));
    });
  });

  describe('deleteGroup', () => {
    it('should delete group successfully', async () => {
      // Arrange
      const mockGroupWithUpdate = {
        ...mockGroup,
        get: jest.fn((key) => (mockGroup as any)[key]),
        update: jest.fn().mockResolvedValue(undefined)
      };
      MockedGroup.findByPk.mockResolvedValue(mockGroupWithUpdate as any);
      MockedUserGroup.count.mockResolvedValue(0);

      // Act
      await groupService.deleteGroup(1);

      // Assert
      expect(MockedGroup.findByPk).toHaveBeenCalledWith(1);
      expect(MockedUserGroup.count).toHaveBeenCalledWith({ where: { groupId: 1 } });
      expect(mockGroupWithUpdate.update).toHaveBeenCalledWith({ isActive: false });
    });

    it('should throw NotFoundError when group not found', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(groupService.deleteGroup(999))
        .rejects
        .toThrow(new NotFoundError('Group not found'));
    });

    it('should throw ValidationError when group has users', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(mockGroup as any);
      MockedUserGroup.count.mockResolvedValue(1);

      // Act & Assert
      await expect(groupService.deleteGroup(1))
        .rejects
        .toThrow(new ValidationError('Cannot delete group with assigned users. Remove users first.'));
    });
  });

  describe('assignUsersToGroup', () => {
    it('should assign users to group successfully', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(mockGroup as any);
      MockedUser.findAll.mockResolvedValue([mockUser] as any);
      MockedUserGroup.findAll.mockResolvedValue([]);
      MockedUserGroup.bulkCreate.mockResolvedValue([{ userId: 1, groupId: 1 }] as any);

      // Act
      const result = await groupService.assignUsersToGroup(1, [1]);

      // Assert
      expect(MockedGroup.findByPk).toHaveBeenCalledWith(1);
      expect(MockedUser.findAll).toHaveBeenCalledWith({
        where: { id: [1], isActive: true }
      });
      expect(MockedUserGroup.findAll).toHaveBeenCalledWith({
        where: { userId: [1], groupId: 1 }
      });
      expect(MockedUserGroup.bulkCreate).toHaveBeenCalledWith([
        { userId: 1, groupId: 1 }
      ]);
      expect(result).toEqual({ assigned: 1, skipped: 0 });
    });

    it('should throw NotFoundError when group not found', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(groupService.assignUsersToGroup(999, [1]))
        .rejects
        .toThrow(new NotFoundError('Group not found'));
    });

    it('should throw ValidationError when users not found', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(mockGroup as any);
      MockedUser.findAll.mockResolvedValue([]);

      // Act & Assert
      await expect(groupService.assignUsersToGroup(1, [999]))
        .rejects
        .toThrow(new ValidationError('Some users not found or inactive'));
    });

    it('should skip already assigned users', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(mockGroup as any);
      MockedUser.findAll.mockResolvedValue([mockUser] as any);
      MockedUserGroup.findAll.mockResolvedValue([{ get: jest.fn().mockReturnValue(1) }] as any);

      // Act
      const result = await groupService.assignUsersToGroup(1, [1]);

      // Assert
      expect(result).toEqual({ assigned: 0, skipped: 1 });
    });
  });

  describe('assignRolesToGroup', () => {
    it('should assign roles to group successfully', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(mockGroup as any);
      MockedRole.findAll.mockResolvedValue([mockRole] as any);
      MockedGroupRole.findAll.mockResolvedValue([]);
      MockedGroupRole.bulkCreate.mockResolvedValue([{ groupId: 1, roleId: 1 }] as any);

      // Act
      const result = await groupService.assignRolesToGroup(1, [1]);

      // Assert
      expect(MockedGroup.findByPk).toHaveBeenCalledWith(1);
      expect(MockedRole.findAll).toHaveBeenCalledWith({
        where: { id: [1], isActive: true }
      });
      expect(MockedGroupRole.findAll).toHaveBeenCalledWith({
        where: { roleId: [1], groupId: 1 }
      });
      expect(result).toEqual({ assigned: 1, skipped: 0 });
    });

    it('should throw NotFoundError when group not found', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(groupService.assignRolesToGroup(999, [1]))
        .rejects
        .toThrow(new NotFoundError('Group not found'));
    });

    it('should throw ValidationError when role not found', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(mockGroup as any);
      MockedRole.findAll.mockResolvedValue([]);

      // Act & Assert
      await expect(groupService.assignRolesToGroup(1, [999]))
        .rejects
        .toThrow(new ValidationError('Some roles not found or inactive'));
    });

    it('should skip already assigned roles', async () => {
      // Arrange
      MockedGroup.findByPk.mockResolvedValue(mockGroup as any);
      MockedRole.findAll.mockResolvedValue([mockRole] as any);
      MockedGroupRole.findAll.mockResolvedValue([{ get: jest.fn().mockReturnValue(1) }] as any);

      // Act
      const result = await groupService.assignRolesToGroup(1, [1]);

      // Assert
      expect(result).toEqual({ assigned: 0, skipped: 1 });
    });
  });
});
