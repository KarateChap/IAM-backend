"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const group_model_1 = require("../models/group.model");
const role_model_1 = require("../models/role.model");
const permission_model_1 = require("../models/permission.model");
const module_model_1 = require("../models/module.model");
const userGroup_model_1 = require("../models/userGroup.model");
const groupRole_model_1 = require("../models/groupRole.model");
const rolePermission_model_1 = require("../models/rolePermission.model");
const errors_1 = require("../utils/errors");
const sequelize_1 = require("sequelize");
/**
 * Permission Service
 * Handles complex permission-related business logic and operations
 */
class PermissionService {
    /**
     * Get all permissions with optional filtering and pagination
     */
    async getPermissions(filters = {}) {
        const { search, moduleId, action, limit = 50, offset = 0, sortBy = 'createdAt', order = 'DESC' } = filters;
        // Build where conditions
        const whereConditions = {};
        if (search) {
            whereConditions[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.like]: `%${search}%` } },
                { description: { [sequelize_1.Op.like]: `%${search}%` } },
            ];
        }
        if (moduleId) {
            whereConditions.moduleId = moduleId;
        }
        if (action) {
            whereConditions.action = action;
        }
        const result = await permission_model_1.Permission.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: module_model_1.Module,
                    as: 'module',
                    attributes: ['id', 'name'],
                },
            ],
            limit,
            offset,
            order: [[sortBy, order]],
        });
        // Transform results
        const permissions = result.rows.map((permission) => ({
            id: permission.get('id'),
            name: permission.get('name'),
            description: permission.get('description'),
            action: permission.get('action'),
            moduleId: permission.get('moduleId'),
            module: {
                id: permission.module?.get('id'),
                name: permission.module?.get('name'),
            },
            createdAt: permission.get('createdAt'),
            updatedAt: permission.get('updatedAt'),
        }));
        return {
            permissions,
            total: result.count,
        };
    }
    /**
     * Get a permission by ID
     */
    async getPermissionById(id) {
        const permission = await permission_model_1.Permission.findByPk(id, {
            include: [
                {
                    model: module_model_1.Module,
                    as: 'module',
                    attributes: ['id', 'name'],
                },
            ],
        });
        if (!permission) {
            throw new errors_1.NotFoundError(`Permission with ID ${id} not found`);
        }
        return {
            id: permission.get('id'),
            name: permission.get('name'),
            description: permission.get('description'),
            action: permission.get('action'),
            moduleId: permission.get('moduleId'),
            module: {
                id: permission.module?.get('id'),
                name: permission.module?.get('name'),
            },
            createdAt: permission.get('createdAt'),
            updatedAt: permission.get('updatedAt'),
        };
    }
    /**
     * Create a new permission
     */
    async createPermission(data) {
        // Check if permission with same name and action already exists for this module
        const existingPermission = await permission_model_1.Permission.findOne({
            where: {
                name: data.name,
                action: data.action,
                moduleId: data.moduleId,
            },
        });
        if (existingPermission) {
            throw new errors_1.ConflictError('Permission with this name and action already exists for this module');
        }
        // Verify module exists
        const module = await module_model_1.Module.findByPk(data.moduleId);
        if (!module) {
            throw new errors_1.NotFoundError(`Module with ID ${data.moduleId} not found`);
        }
        const permission = await permission_model_1.Permission.create({ ...data, isActive: data.isActive ?? true });
        return this.getPermissionById(permission.id);
    }
    /**
     * Update a permission
     */
    async updatePermission(id, data) {
        const permission = await permission_model_1.Permission.findByPk(id);
        if (!permission) {
            throw new errors_1.NotFoundError(`Permission with ID ${id} not found`);
        }
        // If updating name, action, or moduleId, check for conflicts
        if (data.name || data.action || data.moduleId) {
            const existingPermission = await permission_model_1.Permission.findOne({
                where: {
                    name: data.name || permission.get('name'),
                    action: data.action || permission.get('action'),
                    moduleId: data.moduleId || permission.get('moduleId'),
                    id: { [sequelize_1.Op.ne]: id },
                },
            });
            if (existingPermission) {
                throw new errors_1.ConflictError('Permission with this name and action already exists for this module');
            }
        }
        // If updating moduleId, verify module exists
        if (data.moduleId) {
            const module = await module_model_1.Module.findByPk(data.moduleId);
            if (!module) {
                throw new errors_1.NotFoundError(`Module with ID ${data.moduleId} not found`);
            }
        }
        await permission.update(data);
        return this.getPermissionById(id);
    }
    /**
     * Delete a permission
     */
    async deletePermission(id) {
        const permission = await permission_model_1.Permission.findByPk(id);
        if (!permission) {
            throw new errors_1.NotFoundError(`Permission with ID ${id} not found`);
        }
        await permission.destroy();
    }
    /**
     * Get comprehensive user permissions with hierarchy details
     */
    async getUserPermissionSummary(userId) {
        // Step 1: Find user with groups
        const userWithGroups = await user_model_1.default.findByPk(userId, {
            include: [
                {
                    model: group_model_1.Group,
                    as: 'groups',
                    through: { attributes: [] },
                },
            ],
        });
        if (!userWithGroups) {
            throw new errors_1.NotFoundError('User not found');
        }
        if (!userWithGroups.groups || userWithGroups.groups.length === 0) {
            return {
                userId,
                username: userWithGroups.get('username'),
                email: userWithGroups.get('email'),
                groups: [],
                totalPermissions: 0,
                permissions: [],
            };
        }
        // Step 2: Get detailed group and role information
        const groupIds = userWithGroups.groups.map((group) => group.get('id'));
        const groupsWithRoles = await group_model_1.Group.findAll({
            where: { id: groupIds },
            include: [
                {
                    model: role_model_1.Role,
                    as: 'roles',
                    through: { attributes: [] },
                },
            ],
        });
        // Step 3: Get all permissions for user
        const permissions = await this.getUserPermissions(userId);
        // Step 4: Build summary with role details
        const groupSummary = await Promise.all(groupsWithRoles.map(async (group) => {
            const roles = group.get('roles') || [];
            const roleDetails = await Promise.all(roles.map(async (role) => {
                const rolePermissions = await this.getRolePermissions(role.get('id'));
                return {
                    id: role.get('id'),
                    name: role.get('name'),
                    permissionCount: rolePermissions.length,
                };
            }));
            return {
                id: group.get('id'),
                name: group.get('name'),
                roles: roleDetails,
            };
        }));
        return {
            userId,
            username: userWithGroups.get('username'),
            email: userWithGroups.get('email'),
            groups: groupSummary,
            totalPermissions: permissions.length,
            permissions,
        };
    }
    /**
     * Get all permissions for a specific user (simplified version)
     */
    async getUserPermissions(userId) {
        // Step 1: Find user with groups
        const userWithGroups = await user_model_1.default.findByPk(userId, {
            include: [
                {
                    model: group_model_1.Group,
                    as: 'groups',
                    through: { attributes: [] },
                },
            ],
        });
        if (!userWithGroups || !userWithGroups.groups || userWithGroups.groups.length === 0) {
            return [];
        }
        // Step 2: Get group IDs
        const groupIds = userWithGroups.groups.map((group) => group.get('id'));
        // Step 3: Find roles for these groups
        const groupsWithRoles = await group_model_1.Group.findAll({
            where: { id: groupIds },
            include: [
                {
                    model: role_model_1.Role,
                    as: 'roles',
                    through: { attributes: [] },
                },
            ],
        });
        // Step 4: Extract role IDs
        const roleIds = [];
        groupsWithRoles.forEach((group) => {
            const groupRoles = group.get('roles') || [];
            if (groupRoles && groupRoles.length > 0) {
                groupRoles.forEach((role) => {
                    roleIds.push(role.get('id'));
                });
            }
        });
        if (roleIds.length === 0) {
            return [];
        }
        // Step 5: Find permissions for these roles
        const rolesWithPermissions = await role_model_1.Role.findAll({
            where: { id: roleIds },
            include: [
                {
                    model: permission_model_1.Permission,
                    as: 'permissions',
                    through: { attributes: [] },
                    include: [
                        {
                            model: module_model_1.Module,
                            as: 'module',
                        },
                    ],
                },
            ],
        });
        // Step 6: Extract unique permissions
        const permissionsMap = new Map();
        rolesWithPermissions.forEach((role) => {
            if (role.permissions && role.permissions.length > 0) {
                role.permissions.forEach((permission) => {
                    permissionsMap.set(permission.get('id'), permission);
                });
            }
        });
        return Array.from(permissionsMap.values());
    }
    /**
     * Get all permissions for a specific role
     */
    async getRolePermissions(roleId) {
        const role = await role_model_1.Role.findByPk(roleId, {
            include: [
                {
                    model: permission_model_1.Permission,
                    as: 'permissions',
                    through: { attributes: [] },
                    include: [
                        {
                            model: module_model_1.Module,
                            as: 'module',
                        },
                    ],
                },
            ],
        });
        if (!role) {
            return [];
        }
        const permissions = role.get('permissions');
        return permissions || [];
    }
    /**
     * Check if user has specific permission
     */
    async checkUserPermission(userId, moduleId, action) {
        const userPermissions = await this.getUserPermissions(userId);
        const hasPermission = userPermissions.some(permission => permission.get('moduleId') === moduleId && permission.get('action') === action);
        return {
            userId,
            moduleId,
            action,
            hasPermission,
        };
    }
    /**
     * Check if user has permission by module name
     */
    async checkUserPermissionByModuleName(userId, moduleName, action) {
        const module = await module_model_1.Module.findOne({ where: { name: moduleName } });
        if (!module) {
            throw new errors_1.NotFoundError(`Module ${moduleName} not found`);
        }
        return this.checkUserPermission(userId, module.get('id'), action);
    }
    /**
     * Assign user to group
     */
    async assignUserToGroup(userId, groupId) {
        // Verify user exists
        const user = await user_model_1.default.findByPk(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        // Verify group exists
        const group = await group_model_1.Group.findByPk(groupId);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        // Check if assignment already exists
        const existingAssignment = await userGroup_model_1.UserGroup.findOne({
            where: { userId, groupId }
        });
        if (existingAssignment) {
            throw new errors_1.ConflictError('User is already assigned to this group');
        }
        // Create assignment
        await userGroup_model_1.UserGroup.create({ userId, groupId });
    }
    /**
     * Remove user from group
     */
    async removeUserFromGroup(userId, groupId) {
        const assignment = await userGroup_model_1.UserGroup.findOne({
            where: { userId, groupId }
        });
        if (!assignment) {
            throw new errors_1.NotFoundError('User is not assigned to this group');
        }
        await assignment.destroy();
    }
    /**
     * Assign role to group
     */
    async assignRoleToGroup(groupId, roleId) {
        // Verify group exists
        const group = await group_model_1.Group.findByPk(groupId);
        if (!group) {
            throw new errors_1.NotFoundError('Group not found');
        }
        // Verify role exists
        const role = await role_model_1.Role.findByPk(roleId);
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        // Check if assignment already exists
        const existingAssignment = await groupRole_model_1.GroupRole.findOne({
            where: { groupId, roleId }
        });
        if (existingAssignment) {
            throw new errors_1.ConflictError('Role is already assigned to this group');
        }
        // Create assignment
        await groupRole_model_1.GroupRole.create({ groupId, roleId });
    }
    /**
     * Remove role from group
     */
    async removeRoleFromGroup(groupId, roleId) {
        const assignment = await groupRole_model_1.GroupRole.findOne({
            where: { groupId, roleId }
        });
        if (!assignment) {
            throw new errors_1.NotFoundError('Role is not assigned to this group');
        }
        await assignment.destroy();
    }
    /**
     * Assign permission to role
     */
    async assignPermissionToRole(roleId, permissionId) {
        // Verify role exists
        const role = await role_model_1.Role.findByPk(roleId);
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        // Verify permission exists
        const permission = await permission_model_1.Permission.findByPk(permissionId);
        if (!permission) {
            throw new errors_1.NotFoundError('Permission not found');
        }
        // Check if assignment already exists
        const existingAssignment = await rolePermission_model_1.RolePermission.findOne({
            where: { roleId, permissionId }
        });
        if (existingAssignment) {
            throw new errors_1.ConflictError('Permission is already assigned to this role');
        }
        // Create assignment
        await rolePermission_model_1.RolePermission.create({ roleId, permissionId });
    }
    /**
     * Remove permission from role
     */
    async removePermissionFromRole(roleId, permissionId) {
        const assignment = await rolePermission_model_1.RolePermission.findOne({
            where: { roleId, permissionId }
        });
        if (!assignment) {
            throw new errors_1.NotFoundError('Permission is not assigned to this role');
        }
        await assignment.destroy();
    }
    /**
     * Get users by permission
     */
    async getUsersByPermission(moduleId, action) {
        // Find all roles that have this permission
        const rolesWithPermission = await role_model_1.Role.findAll({
            include: [
                {
                    model: permission_model_1.Permission,
                    as: 'permissions',
                    where: { moduleId, action },
                    through: { attributes: [] },
                },
            ],
        });
        if (rolesWithPermission.length === 0) {
            return [];
        }
        const roleIds = rolesWithPermission.map(role => role.get('id'));
        // Find all groups that have these roles
        const groupsWithRoles = await group_model_1.Group.findAll({
            include: [
                {
                    model: role_model_1.Role,
                    as: 'roles',
                    where: { id: roleIds },
                    through: { attributes: [] },
                },
            ],
        });
        if (groupsWithRoles.length === 0) {
            return [];
        }
        const groupIds = groupsWithRoles.map(group => group.get('id'));
        // Find all users in these groups
        const usersInGroups = await user_model_1.default.findAll({
            include: [
                {
                    model: group_model_1.Group,
                    as: 'groups',
                    where: { id: groupIds },
                    through: { attributes: [] },
                },
            ],
        });
        return usersInGroups;
    }
}
exports.PermissionService = PermissionService;
exports.default = new PermissionService();
