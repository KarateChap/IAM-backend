"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const sequelize_1 = require("sequelize");
const user_model_1 = __importDefault(require("../models/user.model"));
const group_model_1 = require("../models/group.model");
const userGroup_model_1 = require("../models/userGroup.model");
const errors_1 = require("../utils/errors");
/**
 * User Service
 * Handles user-related business logic and complex operations
 */
class UserService {
    /**
     * Get all users with optional filtering and pagination
     */
    async getUsers(filters = {}) {
        const { search, isActive, groupId, limit = 50, offset = 0, sortBy = 'createdAt', order = 'DESC' } = filters;
        // Build where conditions
        const whereConditions = {};
        if (search) {
            whereConditions[sequelize_1.Op.or] = [
                { username: { [sequelize_1.Op.like]: `%${search}%` } },
                { email: { [sequelize_1.Op.like]: `%${search}%` } },
                { firstName: { [sequelize_1.Op.like]: `%${search}%` } },
                { lastName: { [sequelize_1.Op.like]: `%${search}%` } },
            ];
        }
        if (isActive !== undefined) {
            whereConditions.isActive = isActive;
        }
        // Build include conditions for groups
        const includeConditions = [
            {
                model: group_model_1.Group,
                as: 'groups',
                through: { attributes: [] },
                required: false, // LEFT JOIN
            },
        ];
        if (groupId) {
            includeConditions[0].where = { id: groupId };
            includeConditions[0].required = true; // INNER JOIN when filtering by group
        }
        // Execute query
        const { rows: users, count: total } = await user_model_1.default.findAndCountAll({
            where: whereConditions,
            include: includeConditions,
            limit,
            offset,
            distinct: true, // Important for correct count with includes
            order: [[sortBy, order]],
        });
        // Transform results
        const transformedUsers = users.map((user) => ({
            id: user.get('id'),
            username: user.get('username'),
            email: user.get('email'),
            firstName: user.get('firstName'),
            lastName: user.get('lastName'),
            isActive: user.get('isActive'),
            createdAt: user.get('createdAt'),
            updatedAt: user.get('updatedAt'),
            groups: (user.groups || []).map((group) => ({
                id: group.get('id'),
                name: group.get('name'),
                description: group.get('description'),
            })),
        }));
        return { users: transformedUsers, total };
    }
    /**
     * Get user by ID with groups
     */
    async getUserById(id) {
        const user = await user_model_1.default.findByPk(id, {
            include: [
                {
                    model: group_model_1.Group,
                    as: 'groups',
                    through: { attributes: [] },
                },
            ],
        });
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        return {
            id: user.get('id'),
            username: user.get('username'),
            email: user.get('email'),
            firstName: user.get('firstName'),
            lastName: user.get('lastName'),
            isActive: user.get('isActive'),
            createdAt: user.get('createdAt'),
            updatedAt: user.get('updatedAt'),
            groups: (user.groups || []).map((group) => ({
                id: group.get('id'),
                name: group.get('name'),
                description: group.get('description'),
            })),
        };
    }
    /**
     * Create a new user
     */
    async createUser(userData) {
        const { username, email, password, firstName, lastName, isActive = true } = userData;
        // Check for existing user
        const existingUser = await user_model_1.default.findOne({
            where: {
                [sequelize_1.Op.or]: [{ email }, { username }],
            },
        });
        if (existingUser) {
            if (existingUser.get('email') === email) {
                throw new errors_1.ConflictError('Email already exists');
            }
            if (existingUser.get('username') === username) {
                throw new errors_1.ConflictError('Username already exists');
            }
        }
        // Create user
        const user = await user_model_1.default.create({
            username,
            email,
            password, // Will be hashed by model hook
            firstName,
            lastName,
            isActive,
        });
        // Return user with empty groups array
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            groups: [],
        };
    }
    /**
     * Update user
     */
    async updateUser(id, updateData) {
        const user = await user_model_1.default.findByPk(id);
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        // Check for conflicts if updating username or email
        if (updateData.username || updateData.email) {
            const whereConditions = {
                id: { [sequelize_1.Op.ne]: id }, // Exclude current user
            };
            const orConditions = [];
            if (updateData.username) {
                orConditions.push({ username: updateData.username });
            }
            if (updateData.email) {
                orConditions.push({ email: updateData.email });
            }
            if (orConditions.length > 0) {
                whereConditions[sequelize_1.Op.or] = orConditions;
                const existingUser = await user_model_1.default.findOne({ where: whereConditions });
                if (existingUser) {
                    if (updateData.email && existingUser.get('email') === updateData.email) {
                        throw new errors_1.ConflictError('Email already exists');
                    }
                    if (updateData.username && existingUser.get('username') === updateData.username) {
                        throw new errors_1.ConflictError('Username already exists');
                    }
                }
            }
        }
        // Update user
        await user.update(updateData);
        // Return updated user with groups
        return this.getUserById(id);
    }
    /**
     * Delete user (soft delete by setting isActive to false)
     */
    async deleteUser(id) {
        const user = await user_model_1.default.findByPk(id);
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        // Soft delete by deactivating
        await user.update({ isActive: false });
    }
    /**
     * Hard delete user (permanently remove from database)
     */
    async hardDeleteUser(id) {
        const user = await user_model_1.default.findByPk(id);
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        // Remove all group associations first
        await userGroup_model_1.UserGroup.destroy({ where: { userId: id } });
        // Hard delete user
        await user.destroy();
    }
    /**
     * Get users in a specific group
     */
    async getUsersByGroup(groupId) {
        const group = await group_model_1.Group.findByPk(groupId);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        const users = await user_model_1.default.findAll({
            include: [
                {
                    model: group_model_1.Group,
                    as: 'groups',
                    where: { id: groupId },
                    through: { attributes: [] },
                },
            ],
        });
        return users.map((user) => ({
            id: user.get('id'),
            username: user.get('username'),
            email: user.get('email'),
            firstName: user.get('firstName'),
            lastName: user.get('lastName'),
            isActive: user.get('isActive'),
            createdAt: user.get('createdAt'),
            updatedAt: user.get('updatedAt'),
            groups: (user.groups || []).map((group) => ({
                id: group.get('id'),
                name: group.get('name'),
                description: group.get('description'),
            })),
        }));
    }
    /**
     * Bulk assign users to a group
     */
    async bulkAssignUsersToGroup(userIds, groupId) {
        // Verify group exists
        const group = await group_model_1.Group.findByPk(groupId);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        // Verify all users exist
        const users = await user_model_1.default.findAll({
            where: { id: userIds, isActive: true },
        });
        if (users.length !== userIds.length) {
            throw new errors_1.ValidationError('Some users not found or inactive');
        }
        // Get existing assignments
        const existingAssignments = await userGroup_model_1.UserGroup.findAll({
            where: { userId: userIds, groupId },
        });
        const existingUserIds = existingAssignments.map(assignment => assignment.get('userId'));
        const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
        // Create new assignments
        if (newUserIds.length > 0) {
            const assignments = newUserIds.map(userId => ({ userId, groupId }));
            await userGroup_model_1.UserGroup.bulkCreate(assignments);
        }
        return {
            assigned: newUserIds.length,
            skipped: existingUserIds.length,
        };
    }
    /**
     * Bulk remove users from a group
     */
    async bulkRemoveUsersFromGroup(userIds, groupId) {
        const removedCount = await userGroup_model_1.UserGroup.destroy({
            where: { userId: userIds, groupId },
        });
        return { removed: removedCount };
    }
    /**
     * Get user statistics
     */
    async getUserStatistics() {
        const [total, active, withGroups] = await Promise.all([
            user_model_1.default.count(),
            user_model_1.default.count({ where: { isActive: true } }),
            user_model_1.default.count({
                include: [
                    {
                        model: group_model_1.Group,
                        as: 'groups',
                        through: { attributes: [] },
                        required: true,
                    },
                ],
                distinct: true,
            }),
        ]);
        return {
            total,
            active,
            inactive: total - active,
            withGroups,
            withoutGroups: total - withGroups,
        };
    }
}
exports.UserService = UserService;
exports.default = new UserService();
