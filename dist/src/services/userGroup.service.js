"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserGroupService = void 0;
const user_model_1 = require("../models/user.model");
const group_model_1 = require("../models/group.model");
const userGroup_model_1 = require("../models/userGroup.model");
const errors_1 = require("../utils/errors");
/**
 * UserGroup Service
 * Handles user-group relationship management and business logic
 */
class UserGroupService {
    /**
     * Assign users to a group
     */
    async assignUsersToGroup(groupId, userIds) {
        try {
            // Validate that the group exists
            const group = await group_model_1.Group.findByPk(groupId);
            if (!group) {
                throw new errors_1.NotFoundError(`Group with ID ${groupId} not found`);
            }
            // Validate that userIds is an array
            if (!Array.isArray(userIds)) {
                throw new errors_1.BadRequestError('userIds must be an array of user IDs');
            }
            if (userIds.length === 0) {
                throw new errors_1.BadRequestError('At least one user ID must be provided');
            }
            // Validate that all users exist
            const users = await user_model_1.User.findAll({
                where: {
                    id: userIds
                },
                attributes: ['id', 'username', 'email', 'isActive']
            });
            if (users.length !== userIds.length) {
                const foundUserIds = users.map(user => user.get('id'));
                const missingUserIds = userIds.filter(id => !foundUserIds.includes(id));
                throw new errors_1.NotFoundError(`Users not found: ${missingUserIds.join(', ')}`);
            }
            // Check for inactive users
            const inactiveUsers = users.filter(user => !user.get('isActive'));
            if (inactiveUsers.length > 0) {
                const inactiveUserIds = inactiveUsers.map(user => user.get('id'));
                throw new errors_1.BadRequestError(`Cannot assign inactive users: ${inactiveUserIds.join(', ')}`);
            }
            // Check for existing assignments
            const existingAssignments = await userGroup_model_1.UserGroup.findAll({
                where: {
                    groupId,
                    userId: userIds
                }
            });
            const existingUserIds = existingAssignments.map(assignment => assignment.get('userId'));
            const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
            // Create new assignments
            const assignmentPromises = newUserIds.map(userId => userGroup_model_1.UserGroup.create({
                groupId,
                userId
            }));
            await Promise.all(assignmentPromises);
            // Prepare detailed result
            const details = users.map(user => {
                const userId = user.get('id');
                const username = user.get('username');
                const email = user.get('email');
                if (existingUserIds.includes(userId)) {
                    return {
                        userId,
                        username,
                        email,
                        status: 'already_exists',
                        message: 'User was already assigned to this group'
                    };
                }
                else {
                    return {
                        userId,
                        username,
                        email,
                        status: 'assigned',
                        message: 'User successfully assigned to group'
                    };
                }
            });
            return {
                assigned: newUserIds.length,
                skipped: existingUserIds.length,
                details
            };
        }
        catch (error) {
            console.error('Error in assignUsersToGroup:', error);
            throw error;
        }
    }
    /**
     * Remove users from a group
     */
    async removeUsersFromGroup(groupId, userIds) {
        try {
            // Validate that the group exists
            const group = await group_model_1.Group.findByPk(groupId);
            if (!group) {
                throw new errors_1.NotFoundError(`Group with ID ${groupId} not found`);
            }
            // Validate that userIds is an array
            if (!Array.isArray(userIds)) {
                throw new errors_1.BadRequestError('userIds must be an array of user IDs');
            }
            if (userIds.length === 0) {
                throw new errors_1.BadRequestError('At least one user ID must be provided');
            }
            // Get user information for response details
            const users = await user_model_1.User.findAll({
                where: {
                    id: userIds
                },
                attributes: ['id', 'username', 'email']
            });
            // Find existing assignments
            const existingAssignments = await userGroup_model_1.UserGroup.findAll({
                where: {
                    groupId,
                    userId: userIds
                }
            });
            const existingUserIds = existingAssignments.map(assignment => assignment.get('userId'));
            // Remove existing assignments
            const removedCount = await userGroup_model_1.UserGroup.destroy({
                where: {
                    groupId,
                    userId: existingUserIds
                }
            });
            // Prepare detailed result
            const details = userIds.map(userId => {
                const user = users.find(u => u.get('id') === userId);
                const username = user ? user.get('username') : `User ${userId}`;
                const email = user ? user.get('email') : 'unknown@example.com';
                if (existingUserIds.includes(userId)) {
                    return {
                        userId,
                        username,
                        email,
                        status: 'removed',
                        message: 'User successfully removed from group'
                    };
                }
                else {
                    return {
                        userId,
                        username,
                        email,
                        status: 'not_found',
                        message: 'User was not assigned to this group'
                    };
                }
            });
            return {
                removed: removedCount,
                notFound: userIds.length - existingUserIds.length,
                details
            };
        }
        catch (error) {
            console.error('Error in removeUsersFromGroup:', error);
            throw error;
        }
    }
    /**
     * Get all users in a group
     */
    async getGroupUsers(groupId) {
        try {
            // Validate that the group exists
            const group = await group_model_1.Group.findByPk(groupId, {
                include: [
                    {
                        model: user_model_1.User,
                        as: 'users',
                        through: { attributes: [] },
                        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'isActive', 'createdAt']
                    }
                ]
            });
            if (!group) {
                throw new errors_1.NotFoundError(`Group with ID ${groupId} not found`);
            }
            return group.get('users') || [];
        }
        catch (error) {
            console.error('Error in getGroupUsers:', error);
            throw error;
        }
    }
    /**
     * Check if a user is in a specific group
     */
    async userInGroup(userId, groupId) {
        try {
            const assignment = await userGroup_model_1.UserGroup.findOne({
                where: {
                    userId,
                    groupId
                }
            });
            return assignment !== null;
        }
        catch (error) {
            console.error('Error in userInGroup:', error);
            throw error;
        }
    }
    /**
     * Get all groups that a user belongs to
     */
    async getUserGroups(userId) {
        try {
            // Validate that the user exists
            const user = await user_model_1.User.findByPk(userId);
            if (!user) {
                throw new errors_1.NotFoundError(`User with ID ${userId} not found`);
            }
            const groups = await group_model_1.Group.findAll({
                include: [
                    {
                        model: user_model_1.User,
                        as: 'users',
                        where: { id: userId },
                        through: { attributes: [] },
                        attributes: []
                    }
                ],
                attributes: ['id', 'name', 'description', 'isActive']
            });
            return groups;
        }
        catch (error) {
            console.error('Error in getUserGroups:', error);
            throw error;
        }
    }
    /**
     * Replace all users in a group (remove existing and assign new ones)
     */
    async replaceGroupUsers(groupId, userIds) {
        try {
            // Validate that the group exists
            const group = await group_model_1.Group.findByPk(groupId);
            if (!group) {
                throw new errors_1.NotFoundError(`Group with ID ${groupId} not found`);
            }
            // Remove all existing user assignments for this group
            await userGroup_model_1.UserGroup.destroy({
                where: { groupId }
            });
            // Assign new users if provided
            if (userIds.length > 0) {
                return await this.assignUsersToGroup(groupId, userIds);
            }
            else {
                return {
                    assigned: 0,
                    skipped: 0,
                    details: []
                };
            }
        }
        catch (error) {
            console.error('Error in replaceGroupUsers:', error);
            throw error;
        }
    }
    /**
     * Get active users in a group
     */
    async getActiveGroupUsers(groupId) {
        try {
            const group = await group_model_1.Group.findByPk(groupId, {
                include: [
                    {
                        model: user_model_1.User,
                        as: 'users',
                        where: { isActive: true },
                        through: { attributes: [] },
                        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'isActive', 'createdAt']
                    }
                ]
            });
            if (!group) {
                throw new errors_1.NotFoundError(`Group with ID ${groupId} not found`);
            }
            return group.get('users') || [];
        }
        catch (error) {
            console.error('Error in getActiveGroupUsers:', error);
            throw error;
        }
    }
    /**
     * Get user count for a group
     */
    async getGroupUserCount(groupId) {
        try {
            const group = await group_model_1.Group.findByPk(groupId);
            if (!group) {
                throw new errors_1.NotFoundError(`Group with ID ${groupId} not found`);
            }
            const totalUsers = await userGroup_model_1.UserGroup.count({
                where: { groupId }
            });
            const activeUsers = await userGroup_model_1.UserGroup.count({
                where: { groupId },
                include: [
                    {
                        model: user_model_1.User,
                        where: { isActive: true },
                        attributes: []
                    }
                ]
            });
            return {
                total: totalUsers,
                active: activeUsers,
                inactive: totalUsers - activeUsers
            };
        }
        catch (error) {
            console.error('Error in getGroupUserCount:', error);
            throw error;
        }
    }
}
exports.UserGroupService = UserGroupService;
