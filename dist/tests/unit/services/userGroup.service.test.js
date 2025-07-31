"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const userGroup_service_1 = require("../../../src/services/userGroup.service");
const user_model_1 = require("../../../src/models/user.model");
const group_model_1 = require("../../../src/models/group.model");
const userGroup_model_1 = require("../../../src/models/userGroup.model");
const errors_1 = require("../../../src/utils/errors");
// Mock the models
jest.mock('../../../src/models/user.model');
jest.mock('../../../src/models/group.model');
jest.mock('../../../src/models/userGroup.model');
const MockedUser = user_model_1.User;
const MockedGroup = group_model_1.Group;
const MockedUserGroup = userGroup_model_1.UserGroup;
describe('UserGroupService', () => {
    let userGroupService;
    beforeEach(() => {
        userGroupService = new userGroup_service_1.UserGroupService();
        jest.clearAllMocks();
    });
    describe('assignUsersToGroup', () => {
        it('should successfully assign users to a group', async () => {
            const groupId = 1;
            const userIds = [1, 2];
            // Mock group exists
            const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            // Mock users exist and are active
            const mockUsers = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'username')
                            return 'user1';
                        if (key === 'email')
                            return 'user1@test.com';
                        if (key === 'isActive')
                            return true;
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'username')
                            return 'user2';
                        if (key === 'email')
                            return 'user2@test.com';
                        if (key === 'isActive')
                            return true;
                        return null;
                    })
                }
            ];
            MockedUser.findAll = jest.fn().mockResolvedValue(mockUsers);
            // Mock no existing assignments
            MockedUserGroup.findAll = jest.fn().mockResolvedValue([]);
            // Mock successful creation
            MockedUserGroup.create = jest.fn().mockResolvedValue({});
            const result = await userGroupService.assignUsersToGroup(groupId, userIds);
            expect(result.assigned).toBe(2);
            expect(result.skipped).toBe(0);
            expect(result.details).toHaveLength(2);
            expect(result.details[0].status).toBe('assigned');
            expect(result.details[0].username).toBe('user1');
            expect(result.details[0].email).toBe('user1@test.com');
            expect(MockedGroup.findByPk).toHaveBeenCalledWith(groupId);
            expect(MockedUser.findAll).toHaveBeenCalledWith({
                where: { id: userIds },
                attributes: ['id', 'username', 'email', 'isActive']
            });
            expect(MockedUserGroup.create).toHaveBeenCalledTimes(2);
        });
        it('should skip already assigned users', async () => {
            const groupId = 1;
            const userIds = [1, 2];
            // Mock group exists
            const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            // Mock users exist and are active
            const mockUsers = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'username')
                            return 'user1';
                        if (key === 'email')
                            return 'user1@test.com';
                        if (key === 'isActive')
                            return true;
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'username')
                            return 'user2';
                        if (key === 'email')
                            return 'user2@test.com';
                        if (key === 'isActive')
                            return true;
                        return null;
                    })
                }
            ];
            MockedUser.findAll = jest.fn().mockResolvedValue(mockUsers);
            // Mock one existing assignment
            const mockExistingAssignment = { get: jest.fn().mockReturnValue(1) };
            MockedUserGroup.findAll = jest.fn().mockResolvedValue([mockExistingAssignment]);
            // Mock successful creation for new user
            MockedUserGroup.create = jest.fn().mockResolvedValue({});
            const result = await userGroupService.assignUsersToGroup(groupId, userIds);
            expect(result.assigned).toBe(1);
            expect(result.skipped).toBe(1);
            expect(result.details).toHaveLength(2);
            expect(result.details[0].status).toBe('already_exists');
            expect(result.details[1].status).toBe('assigned');
            expect(MockedUserGroup.create).toHaveBeenCalledTimes(1);
        });
        it('should throw NotFoundError if group does not exist', async () => {
            const groupId = 999;
            const userIds = [1, 2];
            MockedGroup.findByPk = jest.fn().mockResolvedValue(null);
            await expect(userGroupService.assignUsersToGroup(groupId, userIds))
                .rejects.toThrow(errors_1.NotFoundError);
            expect(MockedGroup.findByPk).toHaveBeenCalledWith(groupId);
        });
        it('should throw BadRequestError if userIds is not an array', async () => {
            const groupId = 1;
            const userIds = 'not-an-array';
            // Mock group exists
            const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            await expect(userGroupService.assignUsersToGroup(groupId, userIds))
                .rejects.toThrow(errors_1.BadRequestError);
        });
        it('should throw BadRequestError if userIds is empty', async () => {
            const groupId = 1;
            const userIds = [];
            // Mock group exists
            const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            await expect(userGroupService.assignUsersToGroup(groupId, userIds))
                .rejects.toThrow(errors_1.BadRequestError);
        });
        it('should throw NotFoundError if some users do not exist', async () => {
            const groupId = 1;
            const userIds = [1, 2, 999];
            // Mock group exists
            const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            // Mock only 2 out of 3 users exist
            const mockUsers = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'isActive')
                            return true;
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'isActive')
                            return true;
                        return null;
                    })
                }
            ];
            MockedUser.findAll = jest.fn().mockResolvedValue(mockUsers);
            await expect(userGroupService.assignUsersToGroup(groupId, userIds))
                .rejects.toThrow(errors_1.NotFoundError);
            expect(MockedUser.findAll).toHaveBeenCalledWith({
                where: { id: userIds },
                attributes: ['id', 'username', 'email', 'isActive']
            });
        });
        it('should throw BadRequestError if trying to assign inactive users', async () => {
            const groupId = 1;
            const userIds = [1, 2];
            // Mock group exists
            const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            // Mock users exist but one is inactive
            const mockUsers = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'isActive')
                            return true;
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'isActive')
                            return false;
                        return null;
                    })
                }
            ];
            MockedUser.findAll = jest.fn().mockResolvedValue(mockUsers);
            await expect(userGroupService.assignUsersToGroup(groupId, userIds))
                .rejects.toThrow(errors_1.BadRequestError);
        });
    });
    describe('removeUsersFromGroup', () => {
        it('should successfully remove users from a group', async () => {
            const groupId = 1;
            const userIds = [1, 2];
            // Mock group exists
            const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            // Mock users exist
            const mockUsers = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'username')
                            return 'user1';
                        if (key === 'email')
                            return 'user1@test.com';
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'username')
                            return 'user2';
                        if (key === 'email')
                            return 'user2@test.com';
                        return null;
                    })
                }
            ];
            MockedUser.findAll = jest.fn().mockResolvedValue(mockUsers);
            // Mock existing assignments
            const mockExistingAssignments = [
                { get: jest.fn().mockReturnValue(1) },
                { get: jest.fn().mockReturnValue(2) }
            ];
            MockedUserGroup.findAll = jest.fn().mockResolvedValue(mockExistingAssignments);
            // Mock successful deletion
            MockedUserGroup.destroy = jest.fn().mockResolvedValue(2);
            const result = await userGroupService.removeUsersFromGroup(groupId, userIds);
            expect(result.removed).toBe(2);
            expect(result.notFound).toBe(0);
            expect(result.details).toHaveLength(2);
            expect(result.details[0].status).toBe('removed');
            expect(result.details[1].status).toBe('removed');
            expect(MockedUserGroup.destroy).toHaveBeenCalledWith({
                where: { groupId, userId: [1, 2] }
            });
        });
        it('should handle users not assigned to group', async () => {
            const groupId = 1;
            const userIds = [1, 2];
            // Mock group exists
            const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            // Mock users exist
            const mockUsers = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'username')
                            return 'user1';
                        if (key === 'email')
                            return 'user1@test.com';
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'username')
                            return 'user2';
                        if (key === 'email')
                            return 'user2@test.com';
                        return null;
                    })
                }
            ];
            MockedUser.findAll = jest.fn().mockResolvedValue(mockUsers);
            // Mock no existing assignments
            MockedUserGroup.findAll = jest.fn().mockResolvedValue([]);
            // Mock no deletions
            MockedUserGroup.destroy = jest.fn().mockResolvedValue(0);
            const result = await userGroupService.removeUsersFromGroup(groupId, userIds);
            expect(result.removed).toBe(0);
            expect(result.notFound).toBe(2);
            expect(result.details).toHaveLength(2);
            expect(result.details[0].status).toBe('not_found');
            expect(result.details[1].status).toBe('not_found');
        });
    });
    describe('getGroupUsers', () => {
        it('should return users for a group', async () => {
            const groupId = 1;
            const mockUsers = [
                {
                    get: jest.fn((key) => {
                        if (key === 'username')
                            return 'user1';
                        if (key === 'email')
                            return 'user1@test.com';
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'username')
                            return 'user2';
                        if (key === 'email')
                            return 'user2@test.com';
                        return null;
                    })
                }
            ];
            const mockGroup = {
                get: jest.fn().mockReturnValue(mockUsers)
            };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            const result = await userGroupService.getGroupUsers(groupId);
            expect(result).toEqual(mockUsers);
            expect(MockedGroup.findByPk).toHaveBeenCalledWith(groupId, {
                include: [{
                        model: user_model_1.User,
                        as: 'users',
                        through: { attributes: [] },
                        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'isActive', 'createdAt']
                    }]
            });
        });
        it('should throw NotFoundError if group does not exist', async () => {
            const groupId = 999;
            MockedGroup.findByPk = jest.fn().mockResolvedValue(null);
            await expect(userGroupService.getGroupUsers(groupId))
                .rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('getUserGroups', () => {
        it('should return groups for a user', async () => {
            const userId = 1;
            // Mock user exists
            const mockUser = { get: jest.fn().mockReturnValue('Test User') };
            MockedUser.findByPk = jest.fn().mockResolvedValue(mockUser);
            const mockGroups = [
                {
                    get: jest.fn((key) => {
                        if (key === 'name')
                            return 'Group 1';
                        if (key === 'description')
                            return 'Test Group 1';
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'name')
                            return 'Group 2';
                        if (key === 'description')
                            return 'Test Group 2';
                        return null;
                    })
                }
            ];
            MockedGroup.findAll = jest.fn().mockResolvedValue(mockGroups);
            const result = await userGroupService.getUserGroups(userId);
            expect(result).toEqual(mockGroups);
            expect(MockedUser.findByPk).toHaveBeenCalledWith(userId);
            expect(MockedGroup.findAll).toHaveBeenCalledWith({
                include: [{
                        model: user_model_1.User,
                        as: 'users',
                        where: { id: userId },
                        through: { attributes: [] },
                        attributes: []
                    }],
                attributes: ['id', 'name', 'description', 'isActive']
            });
        });
        it('should throw NotFoundError if user does not exist', async () => {
            const userId = 999;
            MockedUser.findByPk = jest.fn().mockResolvedValue(null);
            await expect(userGroupService.getUserGroups(userId))
                .rejects.toThrow(errors_1.NotFoundError);
        });
    });
    describe('userInGroup', () => {
        it('should return true if user is in group', async () => {
            const userId = 1;
            const groupId = 1;
            const mockAssignment = { get: jest.fn() };
            MockedUserGroup.findOne = jest.fn().mockResolvedValue(mockAssignment);
            const result = await userGroupService.userInGroup(userId, groupId);
            expect(result).toBe(true);
            expect(MockedUserGroup.findOne).toHaveBeenCalledWith({
                where: { userId, groupId }
            });
        });
        it('should return false if user is not in group', async () => {
            const userId = 1;
            const groupId = 1;
            MockedUserGroup.findOne = jest.fn().mockResolvedValue(null);
            const result = await userGroupService.userInGroup(userId, groupId);
            expect(result).toBe(false);
        });
    });
    describe('getActiveGroupUsers', () => {
        it('should return only active users for a group', async () => {
            const groupId = 1;
            const mockActiveUsers = [
                {
                    get: jest.fn((key) => {
                        if (key === 'username')
                            return 'activeuser1';
                        if (key === 'isActive')
                            return true;
                        return null;
                    })
                }
            ];
            const mockGroup = {
                get: jest.fn().mockReturnValue(mockActiveUsers)
            };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            const result = await userGroupService.getActiveGroupUsers(groupId);
            expect(result).toEqual(mockActiveUsers);
            expect(MockedGroup.findByPk).toHaveBeenCalledWith(groupId, {
                include: [{
                        model: user_model_1.User,
                        as: 'users',
                        where: { isActive: true },
                        through: { attributes: [] },
                        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'isActive', 'createdAt']
                    }]
            });
        });
    });
    describe('replaceGroupUsers', () => {
        it('should replace all users for a group', async () => {
            const groupId = 1;
            const userIds = [1, 2];
            // Mock group exists
            const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            // Mock destroy existing assignments
            MockedUserGroup.destroy = jest.fn().mockResolvedValue(3);
            // Mock users exist and are active
            const mockUsers = [
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 1;
                        if (key === 'username')
                            return 'user1';
                        if (key === 'email')
                            return 'user1@test.com';
                        if (key === 'isActive')
                            return true;
                        return null;
                    })
                },
                {
                    get: jest.fn((key) => {
                        if (key === 'id')
                            return 2;
                        if (key === 'username')
                            return 'user2';
                        if (key === 'email')
                            return 'user2@test.com';
                        if (key === 'isActive')
                            return true;
                        return null;
                    })
                }
            ];
            MockedUser.findAll = jest.fn().mockResolvedValue(mockUsers);
            // Mock no existing assignments after deletion
            MockedUserGroup.findAll = jest.fn().mockResolvedValue([]);
            // Mock successful creation
            MockedUserGroup.create = jest.fn().mockResolvedValue({});
            const result = await userGroupService.replaceGroupUsers(groupId, userIds);
            expect(result.assigned).toBe(2);
            expect(result.skipped).toBe(0);
            // Should destroy existing assignments first
            expect(MockedUserGroup.destroy).toHaveBeenCalledWith({
                where: { groupId }
            });
            // Then assign new users
            expect(MockedUserGroup.create).toHaveBeenCalledTimes(2);
        });
        it('should handle empty userIds array', async () => {
            const groupId = 1;
            const userIds = [];
            // Mock group exists
            const mockGroup = { get: jest.fn().mockReturnValue('Test Group') };
            MockedGroup.findByPk = jest.fn().mockResolvedValue(mockGroup);
            // Mock destroy existing assignments
            MockedUserGroup.destroy = jest.fn().mockResolvedValue(2);
            const result = await userGroupService.replaceGroupUsers(groupId, userIds);
            expect(result.assigned).toBe(0);
            expect(result.skipped).toBe(0);
            expect(result.details).toHaveLength(0);
            // Should still destroy existing assignments
            expect(MockedUserGroup.destroy).toHaveBeenCalledWith({
                where: { groupId }
            });
        });
    });
});
