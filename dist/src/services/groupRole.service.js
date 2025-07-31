"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupRoleService = void 0;
const group_model_1 = require("../models/group.model");
const role_model_1 = require("../models/role.model");
const groupRole_model_1 = require("../models/groupRole.model");
const errors_1 = require("../utils/errors");
/**
 * GroupRole Service
 * Handles group-role relationship management and business logic
 */
class GroupRoleService {
    /**
     * Assign roles to a group
     */
    async assignRolesToGroup(groupId, roleIds) {
        try {
            // Validate that the group exists
            const group = await group_model_1.Group.findByPk(groupId);
            if (!group) {
                throw new errors_1.NotFoundError(`Group with ID ${groupId} not found`);
            }
            // Validate that roleIds is an array
            if (!Array.isArray(roleIds)) {
                throw new errors_1.BadRequestError('roleIds must be an array of role IDs');
            }
            if (roleIds.length === 0) {
                throw new errors_1.BadRequestError('At least one role ID must be provided');
            }
            // Validate that all roles exist
            const roles = await role_model_1.Role.findAll({
                where: {
                    id: roleIds
                }
            });
            if (roles.length !== roleIds.length) {
                const foundRoleIds = roles.map(role => role.get('id'));
                const missingRoleIds = roleIds.filter(id => !foundRoleIds.includes(id));
                throw new errors_1.NotFoundError(`Roles not found: ${missingRoleIds.join(', ')}`);
            }
            // Check for existing assignments
            const existingAssignments = await groupRole_model_1.GroupRole.findAll({
                where: {
                    groupId,
                    roleId: roleIds
                }
            });
            const existingRoleIds = existingAssignments.map(assignment => assignment.get('roleId'));
            const newRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));
            // Create new assignments
            const assignmentPromises = newRoleIds.map(roleId => groupRole_model_1.GroupRole.create({
                groupId,
                roleId
            }));
            await Promise.all(assignmentPromises);
            // Prepare detailed result
            const details = roles.map(role => {
                const roleId = role.get('id');
                const roleName = role.get('name');
                if (existingRoleIds.includes(roleId)) {
                    return {
                        roleId,
                        roleName,
                        status: 'already_exists',
                        message: 'Role was already assigned to this group'
                    };
                }
                else {
                    return {
                        roleId,
                        roleName,
                        status: 'assigned',
                        message: 'Role successfully assigned to group'
                    };
                }
            });
            return {
                assigned: newRoleIds.length,
                skipped: existingRoleIds.length,
                details
            };
        }
        catch (error) {
            console.error('Error in assignRolesToGroup:', error);
            throw error;
        }
    }
    /**
     * Remove roles from a group
     */
    async removeRolesFromGroup(groupId, roleIds) {
        try {
            // Validate that the group exists
            const group = await group_model_1.Group.findByPk(groupId);
            if (!group) {
                throw new errors_1.NotFoundError(`Group with ID ${groupId} not found`);
            }
            // Validate that roleIds is an array
            if (!Array.isArray(roleIds)) {
                throw new errors_1.BadRequestError('roleIds must be an array of role IDs');
            }
            if (roleIds.length === 0) {
                throw new errors_1.BadRequestError('At least one role ID must be provided');
            }
            // Get role information for response details
            const roles = await role_model_1.Role.findAll({
                where: {
                    id: roleIds
                }
            });
            // Find existing assignments
            const existingAssignments = await groupRole_model_1.GroupRole.findAll({
                where: {
                    groupId,
                    roleId: roleIds
                }
            });
            const existingRoleIds = existingAssignments.map(assignment => assignment.get('roleId'));
            // Remove existing assignments
            const removedCount = await groupRole_model_1.GroupRole.destroy({
                where: {
                    groupId,
                    roleId: existingRoleIds
                }
            });
            // Prepare detailed result
            const details = roleIds.map(roleId => {
                const role = roles.find(r => r.get('id') === roleId);
                const roleName = role ? role.get('name') : `Role ${roleId}`;
                if (existingRoleIds.includes(roleId)) {
                    return {
                        roleId,
                        roleName,
                        status: 'removed',
                        message: 'Role successfully removed from group'
                    };
                }
                else {
                    return {
                        roleId,
                        roleName,
                        status: 'not_found',
                        message: 'Role was not assigned to this group'
                    };
                }
            });
            return {
                removed: removedCount,
                notFound: roleIds.length - existingRoleIds.length,
                details
            };
        }
        catch (error) {
            console.error('Error in removeRolesFromGroup:', error);
            throw error;
        }
    }
    /**
     * Get all roles assigned to a group
     */
    async getGroupRoles(groupId) {
        try {
            // Validate that the group exists
            const group = await group_model_1.Group.findByPk(groupId, {
                include: [
                    {
                        model: role_model_1.Role,
                        as: 'roles',
                        through: { attributes: [] },
                        attributes: ['id', 'name', 'description', 'isActive']
                    }
                ]
            });
            if (!group) {
                throw new errors_1.NotFoundError(`Group with ID ${groupId} not found`);
            }
            return group.get('roles') || [];
        }
        catch (error) {
            console.error('Error in getGroupRoles:', error);
            throw error;
        }
    }
    /**
     * Check if a group has a specific role
     */
    async groupHasRole(groupId, roleId) {
        try {
            const assignment = await groupRole_model_1.GroupRole.findOne({
                where: {
                    groupId,
                    roleId
                }
            });
            return assignment !== null;
        }
        catch (error) {
            console.error('Error in groupHasRole:', error);
            throw error;
        }
    }
    /**
     * Get all groups that have a specific role
     */
    async getGroupsWithRole(roleId) {
        try {
            // Validate that the role exists
            const role = await role_model_1.Role.findByPk(roleId);
            if (!role) {
                throw new errors_1.NotFoundError(`Role with ID ${roleId} not found`);
            }
            const groups = await group_model_1.Group.findAll({
                include: [
                    {
                        model: role_model_1.Role,
                        as: 'roles',
                        where: { id: roleId },
                        through: { attributes: [] },
                        attributes: []
                    }
                ],
                attributes: ['id', 'name', 'description', 'isActive']
            });
            return groups;
        }
        catch (error) {
            console.error('Error in getGroupsWithRole:', error);
            throw error;
        }
    }
    /**
     * Replace all roles for a group (remove existing and assign new ones)
     */
    async replaceGroupRoles(groupId, roleIds) {
        try {
            // Validate that the group exists
            const group = await group_model_1.Group.findByPk(groupId);
            if (!group) {
                throw new errors_1.NotFoundError(`Group with ID ${groupId} not found`);
            }
            // Remove all existing role assignments for this group
            await groupRole_model_1.GroupRole.destroy({
                where: { groupId }
            });
            // Assign new roles if provided
            if (roleIds.length > 0) {
                return await this.assignRolesToGroup(groupId, roleIds);
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
            console.error('Error in replaceGroupRoles:', error);
            throw error;
        }
    }
}
exports.GroupRoleService = GroupRoleService;
