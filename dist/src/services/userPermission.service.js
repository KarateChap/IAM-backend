"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPermissionService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const group_model_1 = require("../models/group.model");
const role_model_1 = require("../models/role.model");
const permission_model_1 = require("../models/permission.model");
const module_model_1 = require("../models/module.model");
const errors_1 = require("../utils/errors");
/**
 * UserPermission Service
 * Handles user permission checking and permission-related business logic
 */
class UserPermissionService {
    /**
     * Get all permissions for a specific user
     * Based on their group memberships and role assignments
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
                        include: [
                            {
                                model: role_model_1.Role,
                                as: 'roles',
                                through: { attributes: [] },
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
                            }
                        ]
                    }
                ]
            });
            if (!userWithGroups) {
                throw new errors_1.NotFoundError('User not found');
            }
            console.log('Debug - User found:', userWithGroups.get('id'));
            // Step 2: Extract all permissions from all roles in all groups
            const allPermissions = [];
            const groups = userWithGroups.get('groups');
            console.log('Debug - User groups count:', groups?.length || 0);
            if (groups && groups.length > 0) {
                for (const group of groups) {
                    console.log('Debug - Processing group:', group.get('id'), group.get('name'));
                    const roles = group.get('roles');
                    if (roles && roles.length > 0) {
                        for (const role of roles) {
                            console.log('Debug - Processing role:', role.get('id'), role.get('name'));
                            const permissions = role.get('permissions');
                            if (permissions && permissions.length > 0) {
                                allPermissions.push(...permissions);
                                console.log('Debug - Added permissions count:', permissions.length);
                            }
                        }
                    }
                }
            }
            // Step 3: Remove duplicates based on permission ID
            const uniquePermissions = allPermissions.filter((permission, index, self) => index === self.findIndex(p => p.get('id') === permission.get('id')));
            console.log('Debug - Total unique permissions:', uniquePermissions.length);
            return uniquePermissions;
        }
        catch (error) {
            console.error('Error in getUserPermissions:', error);
            throw error;
        }
    }
    /**
     * Check if a user has a specific permission
     */
    async checkUserPermission(userId, moduleName, action) {
        try {
            // Find the module by name
            const module = await module_model_1.Module.findOne({ where: { name: moduleName } });
            if (!module) {
                throw new errors_1.NotFoundError(`Module '${moduleName}' not found`);
            }
            // Validate action type
            if (!['create', 'read', 'update', 'delete'].includes(action)) {
                throw new errors_1.BadRequestError('Action must be one of: create, read, update, delete');
            }
            // Get user permissions
            const userPermissions = await this.getUserPermissions(userId);
            // Check if user has the specific permission
            const hasPermission = userPermissions.some(permission => permission.get('moduleId') === module.get('id') && permission.get('action') === action);
            return hasPermission;
        }
        catch (error) {
            console.error('Error in checkUserPermission:', error);
            throw error;
        }
    }
    /**
     * Simulate an action for a user (check if they can perform it)
     */
    async simulateUserAction(userId, moduleId, action) {
        try {
            // Validate user exists
            const user = await user_model_1.default.findByPk(userId);
            if (!user) {
                throw new errors_1.NotFoundError(`User with ID ${userId} not found`);
            }
            // Validate module exists
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
            return {
                userId,
                moduleId,
                moduleName: module.get('name'),
                action,
                hasPermission,
            };
        }
        catch (error) {
            console.error('Error in simulateUserAction:', error);
            throw error;
        }
    }
    /**
     * Get formatted user permissions with module information
     */
    async getFormattedUserPermissions(userId) {
        try {
            const permissions = await this.getUserPermissions(userId);
            return permissions.map(permission => ({
                id: permission.get('id'),
                moduleId: permission.get('moduleId'),
                moduleName: permission.get('module')?.name || 'Unknown',
                action: permission.get('action'),
                description: permission.get('description'),
                isActive: permission.get('isActive'),
            }));
        }
        catch (error) {
            console.error('Error in getFormattedUserPermissions:', error);
            throw error;
        }
    }
}
exports.UserPermissionService = UserPermissionService;
