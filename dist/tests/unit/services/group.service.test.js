"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const group_service_1 = require("../../../src/services/group.service");
const group_model_1 = require("../../../src/models/group.model");
const user_model_1 = __importDefault(require("../../../src/models/user.model"));
const role_model_1 = require("../../../src/models/role.model");
const groupRole_model_1 = require("../../../src/models/groupRole.model");
const userGroup_model_1 = require("../../../src/models/userGroup.model");
const errors_1 = require("../../../src/utils/errors");
const mockData_1 = require("../../helpers/mockData");
// Mock dependencies
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/role.model');
jest.mock('../../../src/models/groupRole.model');
jest.mock('../../../src/models/userGroup.model');
const MockedGroup = group_model_1.Group;
const MockedUser = user_model_1.default;
const MockedRole = role_model_1.Role;
const MockedGroupRole = groupRole_model_1.GroupRole;
const MockedUserGroup = userGroup_model_1.UserGroup;
describe('GroupService', () => {
    let groupService;
    beforeEach(() => {
        groupService = new group_service_1.GroupService();
        jest.clearAllMocks();
    });
    describe('getGroups', () => {
        it('should return groups with default filters', async () => {
            // Arrange
            const mockGroupWithDetails = {
                ...mockData_1.mockGroup,
                get: jest.fn((key) => mockData_1.mockGroup[key]),
                users: [],
                roles: [],
                userCount: 0,
                roleCount: 0
            };
            MockedGroup.findAndCountAll.mockResolvedValue({
                rows: [mockGroupWithDetails],
                count: 1
            });
            // Act
            const result = await groupService.getGroups({});
            // Assert
            expect(MockedGroup.findAndCountAll).toHaveBeenCalledWith({
                where: {},
                include: [
                    {
                        model: role_model_1.Role,
                        as: 'roles',
                        through: { attributes: [] },
                        required: false
                    },
                    {
                        model: user_model_1.default,
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
                ...mockData_1.mockGroup,
                get: jest.fn((key) => mockData_1.mockGroup[key]),
                users: [],
                roles: [],
                userCount: 0,
                roleCount: 0
            };
            MockedGroup.findAndCountAll.mockResolvedValue({
                rows: [mockGroupWithDetails],
                count: 1
            });
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
                        model: role_model_1.Role,
                        as: 'roles',
                        through: { attributes: [] },
                        required: false
                    },
                    {
                        model: user_model_1.default,
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
                ...mockData_1.mockGroup,
                get: jest.fn((key) => mockData_1.mockGroup[key]),
                users: [],
                roles: [],
                userCount: 0,
                roleCount: 0
            };
            MockedGroup.findAndCountAll.mockResolvedValue({
                rows: [mockGroupWithDetails],
                count: 1
            });
            // Act
            const result = await groupService.getGroups({ isActive: true });
            // Assert
            expect(MockedGroup.findAndCountAll).toHaveBeenCalledWith({
                where: {
                    isActive: true
                },
                include: [
                    {
                        model: role_model_1.Role,
                        as: 'roles',
                        through: { attributes: [] },
                        required: false
                    },
                    {
                        model: user_model_1.default,
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
                ...mockData_1.mockGroup,
                get: jest.fn((key) => mockData_1.mockGroup[key]),
                users: [],
                roles: [],
                userCount: 0,
                roleCount: 0
            };
            MockedGroup.findByPk.mockResolvedValue(mockGroupWithDetails);
            // Act
            const result = await groupService.getGroupById(1);
            // Assert
            expect(MockedGroup.findByPk).toHaveBeenCalledWith(1, {
                include: [
                    {
                        model: role_model_1.Role,
                        as: 'roles',
                        through: { attributes: [] }
                    },
                    {
                        model: user_model_1.default,
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
                .toThrow(new errors_1.NotFoundError('Group not found'));
        });
    });
    describe('createGroup', () => {
        const createData = {
            name: 'Test Group',
            description: 'A test group'
        };
        it('should create group successfully', async () => {
            // Arrange
            const mockGroupWithDetails = {
                ...mockData_1.mockGroup,
                get: jest.fn((key) => mockData_1.mockGroup[key]),
                users: [],
                roles: [],
                userCount: 0,
                roleCount: 0
            };
            MockedGroup.findOne.mockResolvedValue(null);
            MockedGroup.create.mockResolvedValue(mockData_1.mockGroup);
            MockedGroup.findByPk.mockResolvedValue(mockGroupWithDetails);
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
            MockedGroup.findOne.mockResolvedValue(mockData_1.mockGroup);
            // Act & Assert
            await expect(groupService.createGroup(createData))
                .rejects
                .toThrow(new errors_1.ConflictError('Group name already exists'));
        });
    });
    describe('updateGroup', () => {
        const updateData = {
            name: 'Updated Group',
            description: 'Updated description'
        };
        it('should update group successfully', async () => {
            // Arrange
            const mockGroupWithDetails = {
                ...mockData_1.mockGroup,
                get: jest.fn((key) => mockData_1.mockGroup[key]),
                users: [],
                roles: [],
                userCount: 0,
                roleCount: 0,
                update: jest.fn().mockResolvedValue(mockData_1.mockGroup)
            };
            MockedGroup.findByPk.mockResolvedValue(mockGroupWithDetails);
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
                .toThrow(new errors_1.NotFoundError('Group not found'));
        });
        it('should throw ConflictError if name already exists', async () => {
            // Arrange
            MockedGroup.findByPk.mockResolvedValue(mockData_1.mockGroup);
            const existingGroup = { ...mockData_1.mockGroup, id: 2 };
            MockedGroup.findOne.mockResolvedValue(existingGroup);
            // Act & Assert
            await expect(groupService.updateGroup(1, updateData))
                .rejects
                .toThrow(new errors_1.ConflictError('Group name already exists'));
        });
    });
    describe('deleteGroup', () => {
        it('should delete group successfully', async () => {
            // Arrange
            const mockGroupWithUpdate = {
                ...mockData_1.mockGroup,
                get: jest.fn((key) => mockData_1.mockGroup[key]),
                update: jest.fn().mockResolvedValue(undefined)
            };
            MockedGroup.findByPk.mockResolvedValue(mockGroupWithUpdate);
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
                .toThrow(new errors_1.NotFoundError('Group not found'));
        });
        it('should throw ValidationError when group has users', async () => {
            // Arrange
            MockedGroup.findByPk.mockResolvedValue(mockData_1.mockGroup);
            MockedUserGroup.count.mockResolvedValue(1);
            // Act & Assert
            await expect(groupService.deleteGroup(1))
                .rejects
                .toThrow(new errors_1.ValidationError('Cannot delete group with assigned users. Remove users first.'));
        });
    });
    describe('assignUsersToGroup', () => {
        it('should assign users to group successfully', async () => {
            // Arrange
            MockedGroup.findByPk.mockResolvedValue(mockData_1.mockGroup);
            MockedUser.findAll.mockResolvedValue([mockData_1.mockUser]);
            MockedUserGroup.findAll.mockResolvedValue([]);
            MockedUserGroup.bulkCreate.mockResolvedValue([{ userId: 1, groupId: 1 }]);
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
                .toThrow(new errors_1.NotFoundError('Group not found'));
        });
        it('should throw ValidationError when users not found', async () => {
            // Arrange
            MockedGroup.findByPk.mockResolvedValue(mockData_1.mockGroup);
            MockedUser.findAll.mockResolvedValue([]);
            // Act & Assert
            await expect(groupService.assignUsersToGroup(1, [999]))
                .rejects
                .toThrow(new errors_1.ValidationError('Some users not found or inactive'));
        });
        it('should skip already assigned users', async () => {
            // Arrange
            MockedGroup.findByPk.mockResolvedValue(mockData_1.mockGroup);
            MockedUser.findAll.mockResolvedValue([mockData_1.mockUser]);
            MockedUserGroup.findAll.mockResolvedValue([{ get: jest.fn().mockReturnValue(1) }]);
            // Act
            const result = await groupService.assignUsersToGroup(1, [1]);
            // Assert
            expect(result).toEqual({ assigned: 0, skipped: 1 });
        });
    });
    describe('assignRolesToGroup', () => {
        it('should assign roles to group successfully', async () => {
            // Arrange
            MockedGroup.findByPk.mockResolvedValue(mockData_1.mockGroup);
            MockedRole.findAll.mockResolvedValue([mockData_1.mockRole]);
            MockedGroupRole.findAll.mockResolvedValue([]);
            MockedGroupRole.bulkCreate.mockResolvedValue([{ groupId: 1, roleId: 1 }]);
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
                .toThrow(new errors_1.NotFoundError('Group not found'));
        });
        it('should throw ValidationError when role not found', async () => {
            // Arrange
            MockedGroup.findByPk.mockResolvedValue(mockData_1.mockGroup);
            MockedRole.findAll.mockResolvedValue([]);
            // Act & Assert
            await expect(groupService.assignRolesToGroup(1, [999]))
                .rejects
                .toThrow(new errors_1.ValidationError('Some roles not found or inactive'));
        });
        it('should skip already assigned roles', async () => {
            // Arrange
            MockedGroup.findByPk.mockResolvedValue(mockData_1.mockGroup);
            MockedRole.findAll.mockResolvedValue([mockData_1.mockRole]);
            MockedGroupRole.findAll.mockResolvedValue([{ get: jest.fn().mockReturnValue(1) }]);
            // Act
            const result = await groupService.assignRolesToGroup(1, [1]);
            // Assert
            expect(result).toEqual({ assigned: 0, skipped: 1 });
        });
    });
});
