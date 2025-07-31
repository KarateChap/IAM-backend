import { UserService, CreateUserData, UpdateUserData, UserFilters } from '../../../src/services/user.service';
import User from '../../../src/models/user.model';
import { Group } from '../../../src/models/group.model';
import { UserGroup } from '../../../src/models/userGroup.model';
import { NotFoundError, ConflictError } from '../../../src/utils/errors';
import { mockUser, mockGroup } from '../../helpers/mockData';

// Mock dependencies
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/userGroup.model');

const MockedUser = User as jest.Mocked<typeof User>;
const MockedGroup = Group as jest.Mocked<typeof Group>;
const MockedUserGroup = UserGroup as jest.Mocked<typeof UserGroup>;

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return users with default filters', async () => {
      // Arrange
      const mockUsers = [{
        ...mockUser,
        get: jest.fn((key) => mockUser[key as keyof typeof mockUser]),
        groups: []
      }];
      const mockResult = { rows: mockUsers, count: 1 };
      MockedUser.findAndCountAll.mockResolvedValue(mockResult as any);

      // Act
      const result = await userService.getUsers({});

      // Assert
      expect(MockedUser.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        include: [{
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          required: false
        }],
        limit: 50,
        offset: 0,
        distinct: true,
        order: [['createdAt', 'DESC']]
      });
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply search filter', async () => {
      // Arrange
      const filters: UserFilters = { search: 'test' };
      const mockUsers = [{
        ...mockUser,
        get: jest.fn((key) => mockUser[key as keyof typeof mockUser]),
        groups: []
      }];
      const mockResult = { rows: mockUsers, count: 1 };
      MockedUser.findAndCountAll.mockResolvedValue(mockResult as any);

      // Act
      const result = await userService.getUsers(filters);

      // Assert
      expect(MockedUser.findAndCountAll).toHaveBeenCalledWith({
        where: {
          [Symbol.for('or')]: [
            { username: { [Symbol.for('like')]: '%test%' } },
            { email: { [Symbol.for('like')]: '%test%' } },
            { firstName: { [Symbol.for('like')]: '%test%' } },
            { lastName: { [Symbol.for('like')]: '%test%' } }
          ]
        },
        include: [{
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          required: false
        }],
        limit: 50,
        offset: 0,
        distinct: true,
        order: [['createdAt', 'DESC']]
      });
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should apply isActive filter', async () => {
      // Arrange
      const filters: UserFilters = { isActive: true };
      const mockUsers = [{
        ...mockUser,
        get: jest.fn((key) => mockUser[key as keyof typeof mockUser]),
        groups: []
      }];
      const mockResult = { rows: mockUsers, count: 1 };
      MockedUser.findAndCountAll.mockResolvedValue(mockResult as any);

      // Act
      const result = await userService.getUsers(filters);

      // Assert
      expect(MockedUser.findAndCountAll).toHaveBeenCalledWith({
        where: { isActive: true },
        include: [{
          model: Group,
          as: 'groups',
          through: { attributes: [] },
          required: false
        }],
        limit: 50,
        offset: 0,
        distinct: true,
        order: [['createdAt', 'DESC']]
      });
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      // Arrange
      const mockUserWithGroups = {
        ...mockUser,
        get: jest.fn((key) => mockUser[key as keyof typeof mockUser]),
        groups: []
      };
      MockedUser.findByPk.mockResolvedValue(mockUserWithGroups as any);

      // Act
      const result = await userService.getUserById(1);

      // Assert
      expect(MockedUser.findByPk).toHaveBeenCalledWith(1, {
        include: [{
          model: Group,
          as: 'groups',
          through: { attributes: [] }
        }]
      });
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        groups: []
      });
    });

    it('should throw NotFoundError when user not found', async () => {
      // Arrange
      MockedUser.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById(999))
        .rejects
        .toThrow(new NotFoundError('User not found'));
    });
  });

  describe('createUser', () => {
    const validUserData: CreateUserData = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User'
    };

    it('should create user successfully', async () => {
      // Arrange
      MockedUser.findOne.mockResolvedValue(null);
      MockedUser.create.mockResolvedValue(mockUser as any);

      // Act
      const result = await userService.createUser(validUserData);

      // Assert
      expect(MockedUser.findOne).toHaveBeenCalledWith({
        where: {
          [Symbol.for('or')]: [
            { email: validUserData.email },
            { username: validUserData.username }
          ]
        }
      });
      expect(MockedUser.create).toHaveBeenCalledWith({
        username: validUserData.username,
        email: validUserData.email,
        password: validUserData.password,
        firstName: validUserData.firstName,
        lastName: validUserData.lastName,
        isActive: true
      });
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        groups: []
      });
    });

    it('should throw ConflictError if email already exists', async () => {
      // Arrange
      const existingUser = {
        ...mockUser,
        get: jest.fn((key) => key === 'email' ? validUserData.email : mockUser[key as keyof typeof mockUser])
      };
      MockedUser.findOne.mockResolvedValue(existingUser as any);

      // Act & Assert
      await expect(userService.createUser(validUserData))
        .rejects
        .toThrow(new ConflictError('Email already exists'));
    });

    it('should throw ConflictError if username already exists', async () => {
      // Arrange
      const existingUser = {
        ...mockUser,
        get: jest.fn((key) => {
          if (key === 'email') return 'different@example.com';
          if (key === 'username') return validUserData.username;
          return mockUser[key as keyof typeof mockUser];
        })
      };
      MockedUser.findOne.mockResolvedValue(existingUser as any);

      // Act & Assert
      await expect(userService.createUser(validUserData))
        .rejects
        .toThrow(new ConflictError('Username already exists'));
    });
  });

  describe('updateUser', () => {
    const updateData: UpdateUserData = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    it('should update user successfully', async () => {
      // Arrange
      const mockUserInstance = {
        ...mockUser,
        update: jest.fn().mockResolvedValue(true)
      };
      MockedUser.findByPk.mockResolvedValueOnce(mockUserInstance as any);
      
      // Mock the getUserById call that happens at the end of updateUser
      const updatedUserWithGroups = {
        ...mockUser,
        ...updateData,
        get: jest.fn((key) => {
          const updated = { ...mockUser, ...updateData };
          return updated[key as keyof typeof updated];
        }),
        groups: []
      };
      MockedUser.findByPk.mockResolvedValueOnce(updatedUserWithGroups as any);

      // Act
      const result = await userService.updateUser(1, updateData);

      // Assert
      expect(MockedUser.findByPk).toHaveBeenCalledWith(1);
      expect(mockUserInstance.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        groups: []
      });
    });

    it('should throw NotFoundError when user not found', async () => {
      // Arrange
      MockedUser.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateUser(999, updateData))
        .rejects
        .toThrow(new NotFoundError('User not found'));
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      const mockUserInstance = {
        ...mockUser,
        update: jest.fn().mockResolvedValue(true)
      };
      MockedUser.findByPk.mockResolvedValue(mockUserInstance as any);

      // Act
      const result = await userService.deleteUser(1);

      // Assert
      expect(MockedUser.findByPk).toHaveBeenCalledWith(1);
      expect(mockUserInstance.update).toHaveBeenCalledWith({ isActive: false });
      expect(result).toBeUndefined(); // deleteUser returns void
    });

    it('should throw NotFoundError when user not found', async () => {
      // Arrange
      MockedUser.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.deleteUser(999))
        .rejects
        .toThrow(new NotFoundError('User not found'));
    });
  });
});
