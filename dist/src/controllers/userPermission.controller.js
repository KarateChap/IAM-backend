"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const user_model_1 = __importDefault(require("../models/user.model"));
const group_model_1 = require("../models/group.model");
const role_model_1 = require("../models/role.model");
const permission_model_1 = require("../models/permission.model");
const module_model_1 = require("../models/module.model");
const errors_1 = require("../utils/errors");
/**
 * UserPermission Controller - Handles fetching user permissions and simulating actions
 */
class UserPermissionController {
    /**
     * Get all permissions for the current user
     * Based on their group memberships, the roles assigned to those groups,
     * and the permissions assigned to those roles
     *
     * @route GET /me/permissions
     * @param req Express request
     * @param res Express response
     */
    async getCurrentUserPermissions(req, res, next) {
        try {
            // req.userId is set by the JWT auth middleware
            const userId = req.userId;
            console.log('Debug - userId from req:', userId);
            console.log('Debug - req.user:', req.user);
            if (!userId) {
                throw new errors_1.UnauthorizedError('User not authenticated');
            }
            const permissions = await this.getUserPermissions(userId);
            console.log('Debug - permissions found:', permissions.length);
            res.status(200).json({
                success: true,
                count: permissions.length,
                data: permissions,
            });
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to fetch user permissions'));
        }
    }
    /**
     * Simulate whether a user can perform an action on a module
     *
     * @route POST /simulate-action
     * @param req Express request
     * @param res Express response
     */
    async simulateAction(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                // Format validation errors
                const validationErrors = errors.array().reduce((acc, curr) => {
                    // Handle different validation error types safely
                    let field = 'unknown';
                    if (typeof curr === 'object' && curr !== null && 'param' in curr) {
                        field = String(curr.param);
                    }
                    acc[field] = curr.msg;
                    return acc;
                }, {});
                throw new errors_1.ValidationError('Validation error', validationErrors);
            }
            const { userId, moduleId, action } = req.body;
            // Validate that the user exists
            const user = await user_model_1.default.findByPk(userId);
            if (!user) {
                throw new errors_1.NotFoundError(`User with ID ${userId} not found`);
            }
            // Validate that the module exists
            const module = await module_model_1.Module.findByPk(moduleId);
            if (!module) {
                throw new errors_1.NotFoundError(`Module with ID ${moduleId} not found`);
            }
            // Validate action type
            if (!['create', 'read', 'update', 'delete'].includes(action)) {
                throw new errors_1.BadRequestError('Action must be one of: create, read, update, delete');
            }
            // Get user permissions
            const userPermissions = await this.getUserPermissions(userId);
            // Check if user has the specific permission
            const hasPermission = userPermissions.some(permission => permission.get('moduleId') === Number(moduleId) && permission.get('action') === action);
            res.status(200).json({
                success: true,
                data: {
                    userId,
                    moduleId,
                    moduleName: module.name,
                    action,
                    hasPermission,
                },
            });
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to simulate user action'));
        }
    }
    /**
     * Get all permissions for a specific user
     * Helper method used by both getCurrentUserPermissions and simulateAction
     *
     * @param userId User ID to get permissions for
     * @returns Array of permissions
     */
    async getUserPermissions(userId) {
        console.log('Debug - getUserPermissions called with userId:', userId);
        try {
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
            console.log('Debug - Step 1: User with groups found:', !!userWithGroups);
            if (!userWithGroups || !userWithGroups.groups || userWithGroups.groups.length === 0) {
                console.log('Debug - No user or groups found');
                return [];
            }
            console.log('Debug - Groups found:', userWithGroups.groups.map((g) => ({ id: g.get('id'), name: g.get('name') })));
            // Step 2: Get all group IDs
            const groupIds = userWithGroups.groups.map((group) => group.get('id'));
            console.log('Debug - Group IDs:', groupIds);
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
            console.log('Debug - Step 3: Groups with roles found:', groupsWithRoles.length);
            // Step 4: Extract role IDs
            const roleIds = [];
            groupsWithRoles.forEach((group) => {
                if (group.roles && group.roles.length > 0) {
                    group.roles.forEach((role) => {
                        console.log('Debug - Found role:', { id: role.get('id'), name: role.get('name') });
                        roleIds.push(role.get('id'));
                    });
                }
            });
            console.log('Debug - Role IDs:', roleIds);
            if (roleIds.length === 0) {
                console.log('Debug - No roles found');
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
            console.log('Debug - Step 5: Roles with permissions found:', rolesWithPermissions.length);
            // Step 6: Extract unique permissions
            const permissionsMap = new Map();
            rolesWithPermissions.forEach((role) => {
                console.log(`Debug - Processing role ${role.get('name')} with ${role.permissions?.length || 0} permissions`);
                if (role.permissions && role.permissions.length > 0) {
                    role.permissions.forEach((permission) => {
                        console.log(`Debug - Adding permission: ${permission.get('name')} (ID: ${permission.get('id')})`);
                        permissionsMap.set(permission.get('id'), permission);
                    });
                }
            });
            const permissions = Array.from(permissionsMap.values());
            console.log('Debug - Final permissions count:', permissions.length);
            console.log('Debug - Final permissions:', permissions.map((p) => p.get('name')));
            return permissions;
        }
        catch (error) {
            console.error('Debug - Error in getUserPermissions:', error);
            return [];
        }
    }
    /**
     * Check if a user has a specific permission
     * This is used as middleware to protect routes
     *
     * @param module Module name or ID
     * @param action Action type: create, read, update, delete
     * @returns Middleware function
     */
    checkPermission(module, action) {
        return async (req, res, next) => {
            try {
                // req.user is set by the JWT auth middleware
                const userId = req.user?.id;
                if (!userId) {
                    return next(new errors_1.UnauthorizedError('User not authenticated'));
                }
                let moduleId;
                // If module is a string (name), find the module ID
                if (typeof module === 'string') {
                    const moduleObj = await module_model_1.Module.findOne({ where: { name: module } });
                    if (!moduleObj) {
                        return next(new errors_1.NotFoundError(`Module ${module} not found`));
                    }
                    moduleId = moduleObj.get('id');
                }
                else {
                    moduleId = module;
                }
                // Get user permissions
                const userPermissions = await this.getUserPermissions(userId);
                console.log('\n=== PERMISSION CHECK DEBUG ===');
                console.log('Checking permission for:');
                console.log('- Module:', module, '(type:', typeof module, ')');
                console.log('- ModuleId resolved to:', moduleId, '(type:', typeof moduleId, ')');
                console.log('- Action:', action, '(type:', typeof action, ')');
                console.log('\nUser permissions:');
                userPermissions.forEach((perm, index) => {
                    console.log(`  ${index + 1}. Permission ID: ${perm.get('id')}`);
                    console.log(`     Name: ${perm.get('name')}`);
                    console.log(`     ModuleId: ${perm.get('moduleId')} (type: ${typeof perm.get('moduleId')})`);
                    console.log(`     Action: ${perm.get('action')} (type: ${typeof perm.get('action')})`);
                    console.log(`     Matches moduleId? ${perm.get('moduleId') === moduleId}`);
                    console.log(`     Matches action? ${perm.get('action') === action}`);
                    console.log(`     Both match? ${perm.get('moduleId') === moduleId && perm.get('action') === action}`);
                    console.log('');
                });
                // Check if user has the specific permission
                const hasPermission = userPermissions.some(permission => permission.get('moduleId') === moduleId && permission.get('action') === action);
                console.log('Final permission check result:', hasPermission);
                console.log('=== END PERMISSION CHECK DEBUG ===\n');
                if (!hasPermission) {
                    return next(new errors_1.ForbiddenError(`Permission denied: User does not have ${action} permission for this resource`));
                }
                next();
            }
            catch (error) {
                next(error instanceof Error
                    ? error
                    : new errors_1.InternalServerError('Server error while checking permissions'));
            }
        };
    }
}
exports.default = UserPermissionController;
