"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = require("../../../src/services/user.service");
const user_model_1 = __importDefault(require("../../../src/models/user.model"));
const group_model_1 = require("../../../src/models/group.model");
const userGroup_model_1 = require("../../../src/models/userGroup.model");
const errors_1 = require("../../../src/utils/errors");
const mockData_1 = require("../../helpers/mockData");
// Mock dependencies
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/userGroup.model');
const MockedUser = user_model_1.default;
const MockedGroup = group_model_1.Group;
const MockedUserGroup = userGroup_model_1.UserGroup;
describe('UserService', () => {
    let userService;
    beforeEach(() => {
        userService = new user_service_1.UserService();
        jest.clearAllMocks();
    });
    describe('getUsers', () => {
        it('should return users with default filters', async () => {
            // Arrange
            const mockUsers = [{
                    ...mockData_1.mockUser,
                    get: jest.fn((key) => mockData_1.mockUser[key]),
                    groups: []
                }];
            const mockResult = { rows: mockUsers, count: 1 };
            MockedUser.findAndCountAll.mockResolvedValue(mockResult);
            // Act
            const result = await userService.getUsers({});
            // Assert
            expect(MockedUser.findAndCountAll).toHaveBeenCalledWith({
                where: {},
                include: [{
                        model: group_model_1.Group,
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
            const filters = { search: 'test' };
            const mockUsers = [{
                    ...mockData_1.mockUser,
                    get: jest.fn((key) => mockData_1.mockUser[key]),
                    groups: []
                }];
            const mockResult = { rows: mockUsers, count: 1 };
            MockedUser.findAndCountAll.mockResolvedValue(mockResult);
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
                        model: group_model_1.Group,
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
            const filters = { isActive: true };
            const mockUsers = [{
                    ...mockData_1.mockUser,
                    get: jest.fn((key) => mockData_1.mockUser[key]),
                    groups: []
                }];
            const mockResult = { rows: mockUsers, count: 1 };
            MockedUser.findAndCountAll.mockResolvedValue(mockResult);
            // Act
            const result = await userService.getUsers(filters);
            // Assert
            expect(MockedUser.findAndCountAll).toHaveBeenCalledWith({
                where: { isActive: true },
                include: [{
                        model: group_model_1.Group,
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
                ...mockData_1.mockUser,
                get: jest.fn((key) => mockData_1.mockUser[key]),
                groups: []
            };
            MockedUser.findByPk.mockResolvedValue(mockUserWithGroups);
            // Act
            const result = await userService.getUserById(1);
            // Assert
            expect(MockedUser.findByPk).toHaveBeenCalledWith(1, {
                include: [{
                        model: group_model_1.Group,
                        as: 'groups',
                        through: { attributes: [] }
                    }]
            });
            expect(result).toEqual({
                id: mockData_1.mockUser.id,
                username: mockData_1.mockUser.username,
                email: mockData_1.mockUser.email,
                firstName: mockData_1.mockUser.firstName,
                lastName: mockData_1.mockUser.lastName,
                isActive: mockData_1.mockUser.isActive,
                createdAt: mockData_1.mockUser.createdAt,
                updatedAt: mockData_1.mockUser.updatedAt,
                groups: []
            });
        });
        it('should throw NotFoundError when user not found', async () => {
            // Arrange
            MockedUser.findByPk.mockResolvedValue(null);
            // Act & Assert
            await expect(userService.getUserById(999))
                .rejects
                .toThrow(new errors_1.NotFoundError('User not found'));
        });
    });
    describe('createUser', () => {
        const validUserData = {
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123',
            firstName: 'New',
            lastName: 'User'
        };
        it('should create user successfully', async () => {
            // Arrange
            MockedUser.findOne.mockResolvedValue(null);
            MockedUser.create.mockResolvedValue(mockData_1.mockUser);
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
                id: mockData_1.mockUser.id,
                username: mockData_1.mockUser.username,
                email: mockData_1.mockUser.email,
                firstName: mockData_1.mockUser.firstName,
                lastName: mockData_1.mockUser.lastName,
                isActive: mockData_1.mockUser.isActive,
                createdAt: mockData_1.mockUser.createdAt,
                updatedAt: mockData_1.mockUser.updatedAt,
                groups: []
            });
        });
        it('should throw ConflictError if email already exists', async () => {
            // Arrange
            const existingUser = {
                ...mockData_1.mockUser,
                get: jest.fn((key) => key === 'email' ? validUserData.email : mockData_1.mockUser[key])
            };
            MockedUser.findOne.mockResolvedValue(existingUser);
            // Act & Assert
            await expect(userService.createUser(validUserData))
                .rejects
                .toThrow(new errors_1.ConflictError('Email already exists'));
        });
        it('should throw ConflictError if username already exists', async () => {
            // Arrange
            const existingUser = {
                ...mockData_1.mockUser,
                get: jest.fn((key) => {
                    if (key === 'email')
                        return 'different@example.com';
                    if (key === 'username')
                        return validUserData.username;
                    return mockData_1.mockUser[key];
                })
            };
            MockedUser.findOne.mockResolvedValue(existingUser);
            // Act & Assert
            await expect(userService.createUser(validUserData))
                .rejects
                .toThrow(new errors_1.ConflictError('Username already exists'));
        });
    });
    describe('updateUser', () => {
        const updateData = {
            firstName: 'Updated',
            lastName: 'Name'
        };
        it('should update user successfully', async () => {
            // Arrange
            const mockUserInstance = {
                ...mockData_1.mockUser,
                update: jest.fn().mockResolvedValue(true)
            };
            MockedUser.findByPk.mockResolvedValueOnce(mockUserInstance);
            // Mock the getUserById call that happens at the end of updateUser
            const updatedUserWithGroups = {
                ...mockData_1.mockUser,
                ...updateData,
                get: jest.fn((key) => {
                    const updated = { ...mockData_1.mockUser, ...updateData };
                    return updated[key];
                }),
                groups: []
            };
            MockedUser.findByPk.mockResolvedValueOnce(updatedUserWithGroups);
            // Act
            const result = await userService.updateUser(1, updateData);
            // Assert
            expect(MockedUser.findByPk).toHaveBeenCalledWith(1);
            expect(mockUserInstance.update).toHaveBeenCalledWith(updateData);
            expect(result).toEqual({
                id: mockData_1.mockUser.id,
                username: mockData_1.mockUser.username,
                email: mockData_1.mockUser.email,
                firstName: updateData.firstName,
                lastName: updateData.lastName,
                isActive: mockData_1.mockUser.isActive,
                createdAt: mockData_1.mockUser.createdAt,
                updatedAt: mockData_1.mockUser.updatedAt,
                groups: []
            });
        });
        it('should throw NotFoundError when user not found', async () => {
            // Arrange
            MockedUser.findByPk.mockResolvedValue(null);
            // Act & Assert
            await expect(userService.updateUser(999, updateData))
                .rejects
                .toThrow(new errors_1.NotFoundError('User not found'));
        });
    });
    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            // Arrange
            const mockUserInstance = {
                ...mockData_1.mockUser,
                update: jest.fn().mockResolvedValue(true)
            };
            MockedUser.findByPk.mockResolvedValue(mockUserInstance);
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
                .toThrow(new errors_1.NotFoundError('User not found'));
        });
    });
});
