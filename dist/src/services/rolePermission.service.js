"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionService = void 0;
const role_model_1 = require("../models/role.model");
const permission_model_1 = require("../models/permission.model");
const rolePermission_model_1 = require("../models/rolePermission.model");
const module_model_1 = require("../models/module.model");
const errors_1 = require("../utils/errors");
/**
 * RolePermission Service
 * Handles role-permission relationship management and business logic
 */
class RolePermissionService {
    /**
     * Assign permissions to a role
     */
    async assignPermissionsToRole(roleId, permissionIds) {
        try {
            // Validate that the role exists
            const role = await role_model_1.Role.findByPk(roleId);
            if (!role) {
                throw new errors_1.NotFoundError(`Role with ID ${roleId} not found`);
            }
            // Validate that permissionIds is an array
            if (!Array.isArray(permissionIds)) {
                throw new errors_1.BadRequestError('permissionIds must be an array of permission IDs');
            }
            if (permissionIds.length === 0) {
                throw new errors_1.BadRequestError('At least one permission ID must be provided');
            }
            // Validate that all permissions exist and get their details
            const permissions = await permission_model_1.Permission.findAll({
                where: {
                    id: permissionIds
                },
                include: [
                    {
                        model: module_model_1.Module,
                        as: 'module',
                        attributes: ['name']
                    }
                ]
            });
            if (permissions.length !== permissionIds.length) {
                const foundPermissionIds = permissions.map(permission => permission.get('id'));
                const missingPermissionIds = permissionIds.filter(id => !foundPermissionIds.includes(id));
                throw new errors_1.NotFoundError(`Permissions not found: ${missingPermissionIds.join(', ')}`);
            }
            // Check for existing assignments
            const existingAssignments = await rolePermission_model_1.RolePermission.findAll({
                where: {
                    roleId,
                    permissionId: permissionIds
                }
            });
            const existingPermissionIds = existingAssignments.map(assignment => assignment.get('permissionId'));
            const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));
            // Create new assignments
            const assignmentPromises = newPermissionIds.map(permissionId => rolePermission_model_1.RolePermission.create({
                roleId,
                permissionId
            }));
            await Promise.all(assignmentPromises);
            // Prepare detailed result
            const details = permissions.map(permission => {
                const permissionId = permission.get('id');
                const permissionAction = permission.get('action');
                const moduleName = permission.get('module')?.name || 'Unknown';
                if (existingPermissionIds.includes(permissionId)) {
                    return {
                        permissionId,
                        permissionAction,
                        moduleName,
                        status: 'already_exists',
                        message: 'Permission was already assigned to this role'
                    };
                }
                else {
                    return {
                        permissionId,
                        permissionAction,
                        moduleName,
                        status: 'assigned',
                        message: 'Permission successfully assigned to role'
                    };
                }
            });
            return {
                assigned: newPermissionIds.length,
                skipped: existingPermissionIds.length,
                details
            };
        }
        catch (error) {
            console.error('Error in assignPermissionsToRole:', error);
            throw error;
        }
    }
    /**
     * Remove permissions from a role
     */
    async removePermissionsFromRole(roleId, permissionIds) {
        try {
            // Validate that the role exists
            const role = await role_model_1.Role.findByPk(roleId);
            if (!role) {
                throw new errors_1.NotFoundError(`Role with ID ${roleId} not found`);
            }
            // Validate that permissionIds is an array
            if (!Array.isArray(permissionIds)) {
                throw new errors_1.BadRequestError('permissionIds must be an array of permission IDs');
            }
            if (permissionIds.length === 0) {
                throw new errors_1.BadRequestError('At least one permission ID must be provided');
            }
            // Get permission information for response details
            const permissions = await permission_model_1.Permission.findAll({
                where: {
                    id: permissionIds
                },
                include: [
                    {
                        model: module_model_1.Module,
                        as: 'module',
                        attributes: ['name']
                    }
                ]
            });
            // Find existing assignments
            const existingAssignments = await rolePermission_model_1.RolePermission.findAll({
                where: {
                    roleId,
                    permissionId: permissionIds
                }
            });
            const existingPermissionIds = existingAssignments.map(assignment => assignment.get('permissionId'));
            // Remove existing assignments
            const removedCount = await rolePermission_model_1.RolePermission.destroy({
                where: {
                    roleId,
                    permissionId: existingPermissionIds
                }
            });
            // Prepare detailed result
            const details = permissionIds.map(permissionId => {
                const permission = permissions.find(p => p.get('id') === permissionId);
                const permissionAction = permission ? permission.get('action') : 'unknown';
                const moduleName = permission ? permission.get('module')?.name || 'Unknown' : 'Unknown';
                if (existingPermissionIds.includes(permissionId)) {
                    return {
                        permissionId,
                        permissionAction,
                        moduleName,
                        status: 'removed',
                        message: 'Permission successfully removed from role'
                    };
                }
                else {
                    return {
                        permissionId,
                        permissionAction,
                        moduleName,
                        status: 'not_found',
                        message: 'Permission was not assigned to this role'
                    };
                }
            });
            return {
                removed: removedCount,
                notFound: permissionIds.length - existingPermissionIds.length,
                details
            };
        }
        catch (error) {
            console.error('Error in removePermissionsFromRole:', error);
            throw error;
        }
    }
    /**
     * Get all permissions assigned to a role
     */
    async getRolePermissions(roleId) {
        try {
            // Validate that the role exists
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
                                attributes: ['id', 'name', 'description']
                            }
                        ]
                    }
                ]
            });
            if (!role) {
                throw new errors_1.NotFoundError(`Role with ID ${roleId} not found`);
            }
            return role.get('permissions') || [];
        }
        catch (error) {
            console.error('Error in getRolePermissions:', error);
            throw error;
        }
    }
    /**
     * Check if a role has a specific permission
     */
    async roleHasPermission(roleId, permissionId) {
        try {
            const assignment = await rolePermission_model_1.RolePermission.findOne({
                where: {
                    roleId,
                    permissionId
                }
            });
            return assignment !== null;
        }
        catch (error) {
            console.error('Error in roleHasPermission:', error);
            throw error;
        }
    }
    /**
     * Get all roles that have a specific permission
     */
    async getRolesWithPermission(permissionId) {
        try {
            // Validate that the permission exists
            const permission = await permission_model_1.Permission.findByPk(permissionId);
            if (!permission) {
                throw new errors_1.NotFoundError(`Permission with ID ${permissionId} not found`);
            }
            const roles = await role_model_1.Role.findAll({
                include: [
                    {
                        model: permission_model_1.Permission,
                        as: 'permissions',
                        where: { id: permissionId },
                        through: { attributes: [] },
                        attributes: []
                    }
                ],
                attributes: ['id', 'name', 'description', 'isActive']
            });
            return roles;
        }
        catch (error) {
            console.error('Error in getRolesWithPermission:', error);
            throw error;
        }
    }
    /**
     * Replace all permissions for a role (remove existing and assign new ones)
     */
    async replaceRolePermissions(roleId, permissionIds) {
        try {
            // Validate that the role exists
            const role = await role_model_1.Role.findByPk(roleId);
            if (!role) {
                throw new errors_1.NotFoundError(`Role with ID ${roleId} not found`);
            }
            // Remove all existing permission assignments for this role
            await rolePermission_model_1.RolePermission.destroy({
                where: { roleId }
            });
            // Assign new permissions if provided
            if (permissionIds.length > 0) {
                return await this.assignPermissionsToRole(roleId, permissionIds);
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
            console.error('Error in replaceRolePermissions:', error);
            throw error;
        }
    }
    /**
     * Get permissions by module for a role
     */
    async getRolePermissionsByModule(roleId, moduleName) {
        try {
            const permissions = await permission_model_1.Permission.findAll({
                include: [
                    {
                        model: role_model_1.Role,
                        as: 'roles',
                        where: { id: roleId },
                        through: { attributes: [] },
                        attributes: []
                    },
                    {
                        model: module_model_1.Module,
                        as: 'module',
                        where: { name: moduleName },
                        attributes: ['id', 'name', 'description']
                    }
                ]
            });
            return permissions;
        }
        catch (error) {
            console.error('Error in getRolePermissionsByModule:', error);
            throw error;
        }
    }
}
exports.RolePermissionService = RolePermissionService;
