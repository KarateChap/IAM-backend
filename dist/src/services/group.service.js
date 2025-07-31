"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupService = void 0;
const sequelize_1 = require("sequelize");
const group_model_1 = require("../models/group.model");
const role_model_1 = require("../models/role.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const groupRole_model_1 = require("../models/groupRole.model");
const userGroup_model_1 = require("../models/userGroup.model");
const errors_1 = require("../utils/errors");
/**
 * Group Service
 * Handles group-related business logic and operations
 */
class GroupService {
    /**
     * Get all groups with optional filtering and pagination
     */
    async getGroups(filters = {}) {
        const { search, isActive, hasUsers, hasRoles, limit = 50, offset = 0, sortBy = 'createdAt', order = 'DESC' } = filters;
        // Build where conditions
        const whereConditions = {};
        if (search) {
            whereConditions[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.like]: `%${search}%` } },
                { description: { [sequelize_1.Op.like]: `%${search}%` } },
            ];
        }
        if (isActive !== undefined) {
            whereConditions.isActive = isActive;
        }
        // Build include conditions
        const includeConditions = [
            {
                model: role_model_1.Role,
                as: 'roles',
                through: { attributes: [] },
                required: hasRoles === true,
            },
            {
                model: user_model_1.default,
                as: 'users',
                through: { attributes: [] },
                required: hasUsers === true,
                attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
            },
        ];
        // Execute query
        const { rows: groups, count: total } = await group_model_1.Group.findAndCountAll({
            where: whereConditions,
            include: includeConditions,
            limit,
            offset,
            distinct: true,
            order: [[sortBy, order]],
        });
        // Transform results
        const transformedGroups = groups.map((group) => ({
            id: group.get('id'),
            name: group.get('name'),
            description: group.get('description'),
            isActive: group.get('isActive'),
            createdAt: group.get('createdAt'),
            updatedAt: group.get('updatedAt'),
            roles: (group.get('roles') || []).map((role) => ({
                id: role.get('id'),
                name: role.get('name'),
                description: role.get('description'),
            })),
            users: (group.get('users') || []).map((user) => ({
                id: user.get('id'),
                username: user.get('username'),
                email: user.get('email'),
                firstName: user.get('firstName'),
                lastName: user.get('lastName'),
            })),
            userCount: (group.get('users') || []).length,
            roleCount: (group.get('roles') || []).length,
        }));
        return { groups: transformedGroups, total };
    }
    /**
     * Get group by ID with full details
     */
    async getGroupById(id) {
        const group = await group_model_1.Group.findByPk(id, {
            include: [
                {
                    model: role_model_1.Role,
                    as: 'roles',
                    through: { attributes: [] },
                },
                {
                    model: user_model_1.default,
                    as: 'users',
                    through: { attributes: [] },
                    attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
                },
            ],
        });
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        return {
            id: group.get('id'),
            name: group.get('name'),
            description: group.get('description'),
            isActive: group.get('isActive'),
            createdAt: group.get('createdAt'),
            updatedAt: group.get('updatedAt'),
            roles: (group.get('roles') || []).map((role) => ({
                id: role.get('id'),
                name: role.get('name'),
                description: role.get('description'),
            })),
            users: (group.get('users') || []).map((user) => ({
                id: user.get('id'),
                username: user.get('username'),
                email: user.get('email'),
                firstName: user.get('firstName'),
                lastName: user.get('lastName'),
            })),
            userCount: (group.get('users') || []).length,
            roleCount: (group.get('roles') || []).length,
        };
    }
    /**
     * Create a new group
     */
    async createGroup(groupData) {
        const { name, description, isActive = true } = groupData;
        // Check for existing group with same name
        const existingGroup = await group_model_1.Group.findOne({ where: { name } });
        if (existingGroup) {
            throw new errors_1.ConflictError('Group name already exists');
        }
        // Create group
        const group = await group_model_1.Group.create({
            name,
            description,
            isActive,
        });
        // Return group with empty relationships
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            isActive: group.isActive,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            roles: [],
            users: [],
            userCount: 0,
            roleCount: 0,
        };
    }
    /**
     * Update group
     */
    async updateGroup(id, updateData) {
        const group = await group_model_1.Group.findByPk(id);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        // Check for name conflicts if updating name
        if (updateData.name && updateData.name !== group.get('name')) {
            const existingGroup = await group_model_1.Group.findOne({
                where: { name: updateData.name, id: { [sequelize_1.Op.ne]: id } },
            });
            if (existingGroup) {
                throw new errors_1.ConflictError('Group name already exists');
            }
        }
        // Update group
        await group.update(updateData);
        // Return updated group with details
        return this.getGroupById(id);
    }
    /**
     * Delete group (soft delete by setting isActive to false)
     */
    async deleteGroup(id) {
        const group = await group_model_1.Group.findByPk(id);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        // Check if group has users
        const userCount = await userGroup_model_1.UserGroup.count({ where: { groupId: id } });
        if (userCount > 0) {
            throw new errors_1.ValidationError('Cannot delete group with assigned users. Remove users first.');
        }
        // Soft delete by deactivating
        await group.update({ isActive: false });
    }
    /**
     * Hard delete group (permanently remove from database)
     */
    async hardDeleteGroup(id) {
        const group = await group_model_1.Group.findByPk(id);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        // Remove all relationships first
        await Promise.all([
            userGroup_model_1.UserGroup.destroy({ where: { groupId: id } }),
            groupRole_model_1.GroupRole.destroy({ where: { groupId: id } }),
        ]);
        // Hard delete group
        await group.destroy();
    }
    /**
     * Assign users to group (bulk operation)
     */
    async assignUsersToGroup(groupId, userIds) {
        // Verify group exists
        const group = await group_model_1.Group.findByPk(groupId);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        // Verify all users exist and are active
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
     * Remove users from group (bulk operation)
     */
    async removeUsersFromGroup(groupId, userIds) {
        const removedCount = await userGroup_model_1.UserGroup.destroy({
            where: { userId: userIds, groupId },
        });
        return { removed: removedCount };
    }
    /**
     * Assign roles to group (bulk operation)
     */
    async assignRolesToGroup(groupId, roleIds) {
        // Verify group exists
        const group = await group_model_1.Group.findByPk(groupId);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        // Verify all roles exist and are active
        const roles = await role_model_1.Role.findAll({
            where: { id: roleIds, isActive: true },
        });
        if (roles.length !== roleIds.length) {
            throw new errors_1.ValidationError('Some roles not found or inactive');
        }
        // Get existing assignments
        const existingAssignments = await groupRole_model_1.GroupRole.findAll({
            where: { roleId: roleIds, groupId },
        });
        const existingRoleIds = existingAssignments.map(assignment => assignment.get('roleId'));
        const newRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));
        // Create new assignments
        if (newRoleIds.length > 0) {
            const assignments = newRoleIds.map(roleId => ({ groupId, roleId }));
            await groupRole_model_1.GroupRole.bulkCreate(assignments);
        }
        return {
            assigned: newRoleIds.length,
            skipped: existingRoleIds.length,
        };
    }
    /**
     * Remove roles from group (bulk operation)
     */
    async removeRolesFromGroup(groupId, roleIds) {
        const removedCount = await groupRole_model_1.GroupRole.destroy({
            where: { roleId: roleIds, groupId },
        });
        return { removed: removedCount };
    }
    /**
     * Get group statistics
     */
    async getGroupStatistics() {
        const [total, active, withUsers, withRoles, userCounts, roleCounts] = await Promise.all([
            group_model_1.Group.count(),
            group_model_1.Group.count({ where: { isActive: true } }),
            group_model_1.Group.count({
                include: [
                    {
                        model: user_model_1.default,
                        as: 'users',
                        through: { attributes: [] },
                        required: true,
                    },
                ],
                distinct: true,
            }),
            group_model_1.Group.count({
                include: [
                    {
                        model: role_model_1.Role,
                        as: 'roles',
                        through: { attributes: [] },
                        required: true,
                    },
                ],
                distinct: true,
            }),
            userGroup_model_1.UserGroup.count(),
            groupRole_model_1.GroupRole.count(),
        ]);
        return {
            total,
            active,
            inactive: total - active,
            withUsers,
            withoutUsers: total - withUsers,
            withRoles,
            withoutRoles: total - withRoles,
            averageUsersPerGroup: total > 0 ? Math.round((userCounts / total) * 100) / 100 : 0,
            averageRolesPerGroup: total > 0 ? Math.round((roleCounts / total) * 100) / 100 : 0,
        };
    }
}
exports.GroupService = GroupService;
exports.default = new GroupService();
