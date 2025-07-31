import { Op } from 'sequelize';
import User from '../models/user.model';
import { Group } from '../models/group.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { Module } from '../models/module.model';
import { NotFoundError, BadRequestError } from '../utils/errors';

export interface PermissionCheckResult {
  userId: number;
  moduleId: number;
  moduleName: string;
  action: string;
  hasPermission: boolean;
}

export interface UserPermissionData {
  id: number;
  moduleId: number;
  moduleName: string;
  action: string;
  description: string;
  isActive: boolean;
}

/**
 * UserPermission Service
 * Handles user permission checking and permission-related business logic
 */
export class UserPermissionService {
  /**
   * Get all permissions for a specific user
   * Based on their group memberships and role assignments
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    console.log('Debug - getUserPermissions called with userId:', userId);
    
    try {
      // Step 1: Find user with groups
      const userWithGroups = await User.findByPk(userId, {
        include: [
          {
            model: Group,
            as: 'groups',
            through: { attributes: [] },
            include: [
              {
                model: Role,
                as: 'roles',
                through: { attributes: [] },
                include: [
                  {
                    model: Permission,
                    as: 'permissions',
                    through: { attributes: [] },
                    include: [
                      {
                        model: Module,
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
        throw new NotFoundError('User not found');
      }

      console.log('Debug - User found:', userWithGroups.get('id'));

      // Step 2: Extract all permissions from all roles in all groups
      const allPermissions: Permission[] = [];
      const groups = userWithGroups.get('groups') as Group[];
      
      console.log('Debug - User groups count:', groups?.length || 0);

      if (groups && groups.length > 0) {
        for (const group of groups) {
          console.log('Debug - Processing group:', group.get('id'), group.get('name'));
          const roles = group.get('roles') as Role[];
          
          if (roles && roles.length > 0) {
            for (const role of roles) {
              console.log('Debug - Processing role:', role.get('id'), role.get('name'));
              const permissions = role.get('permissions') as Permission[];
              
              if (permissions && permissions.length > 0) {
                allPermissions.push(...permissions);
                console.log('Debug - Added permissions count:', permissions.length);
              }
            }
          }
        }
      }

      // Step 3: Remove duplicates based on permission ID
      const uniquePermissions = allPermissions.filter((permission, index, self) =>
        index === self.findIndex(p => p.get('id') === permission.get('id'))
      );

      console.log('Debug - Total unique permissions:', uniquePermissions.length);
      return uniquePermissions;

    } catch (error) {
      console.error('Error in getUserPermissions:', error);
      throw error;
    }
  }

  /**
   * Check if a user has a specific permission
   */
  async checkUserPermission(userId: number, moduleName: string, action: string): Promise<boolean> {
    try {
      // Find the module by name
      const module = await Module.findOne({ where: { name: moduleName } });
      if (!module) {
        throw new NotFoundError(`Module '${moduleName}' not found`);
      }

      // Validate action type
      if (!['create', 'read', 'update', 'delete'].includes(action)) {
        throw new BadRequestError('Action must be one of: create, read, update, delete');
      }

      // Get user permissions
      const userPermissions = await this.getUserPermissions(userId);

      // Check if user has the specific permission
      const hasPermission = userPermissions.some(
        permission => permission.get('moduleId') === module.get('id') && permission.get('action') === action
      );

      return hasPermission;
    } catch (error) {
      console.error('Error in checkUserPermission:', error);
      throw error;
    }
  }

  /**
   * Simulate an action for a user (check if they can perform it)
   */
  async simulateUserAction(userId: number, moduleId: number, action: string): Promise<PermissionCheckResult> {
    try {
      // Validate user exists
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      // Validate module exists
      const module = await Module.findByPk(moduleId);
      if (!module) {
        throw new NotFoundError(`Module with ID ${moduleId} not found`);
      }

      // Validate action type
      if (!['create', 'read', 'update', 'delete'].includes(action)) {
        throw new BadRequestError('Action must be one of: create, read, update, delete');
      }

      // Get user permissions
      const userPermissions = await this.getUserPermissions(userId);

      // Check if user has the specific permission
      const hasPermission = userPermissions.some(
        permission => permission.get('moduleId') === Number(moduleId) && permission.get('action') === action
      );

      return {
        userId,
        moduleId,
        moduleName: module.get('name') as string,
        action,
        hasPermission,
      };
    } catch (error) {
      console.error('Error in simulateUserAction:', error);
      throw error;
    }
  }

  /**
   * Get formatted user permissions with module information
   */
  async getFormattedUserPermissions(userId: number): Promise<UserPermissionData[]> {
    try {
      const permissions = await this.getUserPermissions(userId);
      
      return permissions.map(permission => ({
        id: permission.get('id') as number,
        moduleId: permission.get('moduleId') as number,
        moduleName: (permission.get('module') as any)?.name || 'Unknown',
        action: permission.get('action') as string,
        description: permission.get('description') as string,
        isActive: permission.get('isActive') as boolean,
      }));
    } catch (error) {
      console.error('Error in getFormattedUserPermissions:', error);
      throw error;
    }
  }
}
