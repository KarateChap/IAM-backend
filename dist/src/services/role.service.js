"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const sequelize_1 = require("sequelize");
const role_model_1 = require("../models/role.model");
const permission_model_1 = require("../models/permission.model");
const group_model_1 = require("../models/group.model");
const module_model_1 = require("../models/module.model");
const rolePermission_model_1 = require("../models/rolePermission.model");
const groupRole_model_1 = require("../models/groupRole.model");
const errors_1 = require("../utils/errors");
/**
 * Role Service
 * Handles role-related business logic and operations
 */
class RoleService {
    /**
     * Get all roles with optional filtering and pagination
     */
    async getRoles(filters = {}) {
        const { search, isActive, hasPermissions, hasGroups, moduleId, limit = 50, offset = 0, sortBy = 'createdAt', order = 'DESC' } = filters;
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
                model: permission_model_1.Permission,
                as: 'permissions',
                through: { attributes: [] },
                required: hasPermissions === true,
                include: [
                    {
                        model: module_model_1.Module,
                        as: 'module',
                        ...(moduleId && { where: { id: moduleId } }),
                    },
                ],
            },
            {
                model: group_model_1.Group,
                as: 'groups',
                through: { attributes: [] },
                required: hasGroups === true,
            },
        ];
        // Execute query
        const { rows: roles, count: total } = await role_model_1.Role.findAndCountAll({
            where: whereConditions,
            include: includeConditions,
            limit,
            offset,
            distinct: true,
            order: [[sortBy, order]],
        });
        // Transform results
        const transformedRoles = roles.map((role) => ({
            id: role.get('id'),
            name: role.get('name'),
            description: role.get('description'),
            isActive: role.get('isActive'),
            createdAt: role.get('createdAt'),
            updatedAt: role.get('updatedAt'),
            permissions: (role.get('permissions') || []).map((permission) => ({
                id: permission.get('id'),
                name: permission.get('name'),
                action: permission.get('action'),
                description: permission.get('description'),
                module: {
                    id: permission.module?.get('id'),
                    name: permission.module?.get('name'),
                },
            })),
            groups: (role.get('groups') || []).map((group) => ({
                id: group.get('id'),
                name: group.get('name'),
                description: group.get('description'),
            })),
            permissionCount: (role.get('permissions') || []).length,
            groupCount: (role.get('groups') || []).length,
        }));
        return { roles: transformedRoles, total };
    }
    /**
     * Get role by ID with full details
     */
    async getRoleById(id) {
        const role = await role_model_1.Role.findByPk(id, {
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
                {
                    model: group_model_1.Group,
                    as: 'groups',
                    through: { attributes: [] },
                },
            ],
        });
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        return {
            id: role.get('id'),
            name: role.get('name'),
            description: role.get('description'),
            isActive: role.get('isActive'),
            createdAt: role.get('createdAt'),
            updatedAt: role.get('updatedAt'),
            permissions: (role.get('permissions') || []).map((permission) => ({
                id: permission.get('id'),
                name: permission.get('name'),
                action: permission.get('action'),
                description: permission.get('description'),
                module: {
                    id: permission.module?.get('id'),
                    name: permission.module?.get('name'),
                },
            })),
            groups: (role.get('groups') || []).map((group) => ({
                id: group.get('id'),
                name: group.get('name'),
                description: group.get('description'),
            })),
            permissionCount: (role.get('permissions') || []).length,
            groupCount: (role.get('groups') || []).length,
        };
    }
    /**
     * Create a new role
     */
    async createRole(roleData) {
        const { name, description, isActive = true } = roleData;
        // Check for existing role with same name
        const existingRole = await role_model_1.Role.findOne({ where: { name } });
        if (existingRole) {
            throw new errors_1.ConflictError('Role name already exists');
        }
        // Create role
        const role = await role_model_1.Role.create({
            name,
            description,
            isActive,
        });
        // Return role with empty relationships
        return {
            id: role.id,
            name: role.name,
            description: role.description,
            isActive: role.isActive,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
            permissions: [],
            groups: [],
            permissionCount: 0,
            groupCount: 0,
        };
    }
    /**
     * Update role
     */
    async updateRole(id, updateData) {
        const role = await role_model_1.Role.findByPk(id);
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        // Check for name conflicts if updating name
        if (updateData.name && updateData.name !== role.get('name')) {
            const existingRole = await role_model_1.Role.findOne({
                where: { name: updateData.name, id: { [sequelize_1.Op.ne]: id } },
            });
            if (existingRole) {
                throw new errors_1.ConflictError('Role name already exists');
            }
        }
        // Update role
        await role.update(updateData);
        // Return updated role with details
        return this.getRoleById(id);
    }
    /**
     * Delete role (soft delete by setting isActive to false)
     */
    async deleteRole(id) {
        const role = await role_model_1.Role.findByPk(id);
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        // Check if role is assigned to groups
        const groupCount = await groupRole_model_1.GroupRole.count({ where: { roleId: id } });
        if (groupCount > 0) {
            throw new errors_1.ValidationError('Cannot delete role assigned to groups. Remove from groups first.');
        }
        // Soft delete by deactivating
        await role.update({ isActive: false });
    }
    /**
     * Hard delete role (permanently remove from database)
     */
    async hardDeleteRole(id) {
        const role = await role_model_1.Role.findByPk(id);
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        // Remove all relationships first
        await Promise.all([
            rolePermission_model_1.RolePermission.destroy({ where: { roleId: id } }),
            groupRole_model_1.GroupRole.destroy({ where: { roleId: id } }),
        ]);
        // Hard delete role
        await role.destroy();
    }
    /**
     * Assign permissions to role (bulk operation)
     */
    async assignPermissionsToRole(roleId, permissionIds) {
        // Verify role exists
        const role = await role_model_1.Role.findByPk(roleId);
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        // Verify all permissions exist and are active
        const permissions = await permission_model_1.Permission.findAll({
            where: { id: permissionIds, isActive: true },
        });
        if (permissions.length !== permissionIds.length) {
            throw new errors_1.ValidationError('Some permissions not found or inactive');
        }
        // Get existing assignments
        const existingAssignments = await rolePermission_model_1.RolePermission.findAll({
            where: { permissionId: permissionIds, roleId },
        });
        const existingPermissionIds = existingAssignments.map(assignment => assignment.get('permissionId'));
        const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));
        // Create new assignments
        if (newPermissionIds.length > 0) {
            const assignments = newPermissionIds.map(permissionId => ({ roleId, permissionId }));
            await rolePermission_model_1.RolePermission.bulkCreate(assignments);
        }
        return {
            assigned: newPermissionIds.length,
            skipped: existingPermissionIds.length,
        };
    }
    /**
     * Remove permissions from role (bulk operation)
     */
    async removePermissionsFromRole(roleId, permissionIds) {
        const removedCount = await rolePermission_model_1.RolePermission.destroy({
            where: { permissionId: permissionIds, roleId },
        });
        return { removed: removedCount };
    }
    /**
     * Get roles by permission
     */
    async getRolesByPermission(permissionId) {
        const permission = await permission_model_1.Permission.findByPk(permissionId);
        if (!permission) {
            throw new errors_1.NotFoundError('Permission not found');
        }
        const roles = await role_model_1.Role.findAll({
            include: [
                {
                    model: permission_model_1.Permission,
                    as: 'permissions',
                    where: { id: permissionId },
                    through: { attributes: [] },
                    include: [
                        {
                            model: module_model_1.Module,
                            as: 'module',
                        },
                    ],
                },
                {
                    model: group_model_1.Group,
                    as: 'groups',
                    through: { attributes: [] },
                },
            ],
        });
        return roles.map((role) => ({
            id: role.get('id'),
            name: role.get('name'),
            description: role.get('description'),
            isActive: role.get('isActive'),
            createdAt: role.get('createdAt'),
            updatedAt: role.get('updatedAt'),
            permissions: (role.get('permissions') || []).map((permission) => ({
                id: permission.get('id'),
                name: permission.get('name'),
                action: permission.get('action'),
                description: permission.get('description'),
                module: {
                    id: permission.module?.get('id'),
                    name: permission.module?.get('name'),
                },
            })),
            groups: (role.get('groups') || []).map((group) => ({
                id: group.get('id'),
                name: group.get('name'),
                description: group.get('description'),
            })),
            permissionCount: (role.get('permissions') || []).length,
            groupCount: (role.get('groups') || []).length,
        }));
    }
    /**
     * Get roles by module
     */
    async getRolesByModule(moduleId) {
        const module = await module_model_1.Module.findByPk(moduleId);
        if (!module) {
            throw new errors_1.NotFoundError('Module not found');
        }
        const roles = await role_model_1.Role.findAll({
            include: [
                {
                    model: permission_model_1.Permission,
                    as: 'permissions',
                    through: { attributes: [] },
                    include: [
                        {
                            model: module_model_1.Module,
                            as: 'module',
                            where: { id: moduleId },
                        },
                    ],
                    required: true,
                },
                {
                    model: group_model_1.Group,
                    as: 'groups',
                    through: { attributes: [] },
                },
            ],
        });
        return roles.map((role) => ({
            id: role.get('id'),
            name: role.get('name'),
            description: role.get('description'),
            isActive: role.get('isActive'),
            createdAt: role.get('createdAt'),
            updatedAt: role.get('updatedAt'),
            permissions: (role.get('permissions') || []).map((permission) => ({
                id: permission.get('id'),
                name: permission.get('name'),
                action: permission.get('action'),
                description: permission.get('description'),
                module: {
                    id: permission.module?.get('id'),
                    name: permission.module?.get('name'),
                },
            })),
            groups: (role.get('groups') || []).map((group) => ({
                id: group.get('id'),
                name: group.get('name'),
                description: group.get('description'),
            })),
            permissionCount: (role.get('permissions') || []).length,
            groupCount: (role.get('groups') || []).length,
        }));
    }
    /**
     * Clone role with all permissions
     */
    async cloneRole(sourceRoleId, newRoleName, description) {
        const sourceRole = await this.getRoleById(sourceRoleId);
        // Create new role
        const newRole = await this.createRole({
            name: newRoleName,
            description: description || `Clone of ${sourceRole.name}`,
            isActive: true,
        });
        // Copy all permissions if source role has any
        if (sourceRole.permissions.length > 0) {
            const permissionIds = sourceRole.permissions.map(p => p.id);
            await this.assignPermissionsToRole(newRole.id, permissionIds);
        }
        // Return the new role with permissions
        return this.getRoleById(newRole.id);
    }
    /**
     * Get role statistics
     */
    async getRoleStatistics() {
        const [total, active, withPermissions, withGroups, permissionCounts, groupCounts] = await Promise.all([
            role_model_1.Role.count(),
            role_model_1.Role.count({ where: { isActive: true } }),
            role_model_1.Role.count({
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                        through: { attributes: [] },
                        required: true,
                    },
                ],
                distinct: true,
            }),
            role_model_1.Role.count({
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
            rolePermission_model_1.RolePermission.count(),
            groupRole_model_1.GroupRole.count(),
        ]);
        return {
            total,
            active,
            inactive: total - active,
            withPermissions,
            withoutPermissions: total - withPermissions,
            withGroups,
            withoutGroups: total - withGroups,
            averagePermissionsPerRole: total > 0 ? Math.round((permissionCounts / total) * 100) / 100 : 0,
            averageGroupsPerRole: total > 0 ? Math.round((groupCounts / total) * 100) / 100 : 0,
        };
    }
}
exports.RoleService = RoleService;
exports.default = new RoleService();
