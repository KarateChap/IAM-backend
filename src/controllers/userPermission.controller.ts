import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/user.model';
import { Group } from '../models/group.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { Module } from '../models/module.model';
import { Op } from 'sequelize';
import {
  ValidationError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  InternalServerError,
} from '../utils/errors';

/**
 * UserPermission Controller - Handles fetching user permissions and simulating actions
 */
export default class UserPermissionController {
  /**
   * Get all permissions for the current user
   * Based on their group memberships, the roles assigned to those groups,
   * and the permissions assigned to those roles
   *
   * @route GET /me/permissions
   * @param req Express request
   * @param res Express response
   */
  public async getCurrentUserPermissions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // req.userId is set by the JWT auth middleware
      const userId = req.userId;
      console.log('Debug - userId from req:', userId);
      console.log('Debug - req.user:', req.user);

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const permissions = await this.getUserPermissions(userId);
      console.log('Debug - permissions found:', permissions.length);

      res.status(200).json({
        success: true,
        count: permissions.length,
        data: permissions,
      });
    } catch (error) {
      next(
        error instanceof Error ? error : new InternalServerError('Failed to fetch user permissions')
      );
    }
  }

  /**
   * Simulate whether a user can perform an action on a module
   *
   * @route POST /simulate-action
   * @param req Express request
   * @param res Express response
   */
  public async simulateAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Format validation errors
        const validationErrors = errors.array().reduce(
          (acc, curr) => {
            // Handle different validation error types safely
            let field: string = 'unknown';
            if (typeof curr === 'object' && curr !== null && 'param' in curr) {
              field = String(curr.param);
            }
            acc[field] = curr.msg;
            return acc;
          },
          {} as Record<string, string>
        );

        throw new ValidationError('Validation error', validationErrors);
      }

      const { userId, moduleId, action } = req.body;

      // Validate that the user exists
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      // Validate that the module exists
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
    } catch (error) {
      next(
        error instanceof Error ? error : new InternalServerError('Failed to simulate user action')
      );
    }
  }

  /**
   * Get all permissions for a specific user
   * Helper method used by both getCurrentUserPermissions and simulateAction
   *
   * @param userId User ID to get permissions for
   * @returns Array of permissions
   */
  private async getUserPermissions(userId: number): Promise<Permission[]> {
    console.log('Debug - getUserPermissions called with userId:', userId);
    
    try {
      // Step 1: Find user with groups
      const userWithGroups = await User.findByPk(userId, {
        include: [
          {
            model: Group,
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

      console.log('Debug - Groups found:', userWithGroups.groups.map((g: any) => ({ id: g.get('id'), name: g.get('name') })));

      // Step 2: Get all group IDs
      const groupIds = userWithGroups.groups.map((group: any) => group.get('id'));
      console.log('Debug - Group IDs:', groupIds);

      // Step 3: Find roles for these groups
      const groupsWithRoles = await Group.findAll({
        where: { id: groupIds },
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
          },
        ],
      });

      console.log('Debug - Step 3: Groups with roles found:', groupsWithRoles.length);
      
      // Step 4: Extract role IDs
      const roleIds: number[] = [];
      groupsWithRoles.forEach((group: any) => {
        if (group.roles && group.roles.length > 0) {
          group.roles.forEach((role: any) => {
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
      const rolesWithPermissions = await Role.findAll({
        where: { id: roleIds },
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] },
            include: [
              {
                model: Module,
                as: 'module',
              },
            ],
          },
        ],
      });

      console.log('Debug - Step 5: Roles with permissions found:', rolesWithPermissions.length);

      // Step 6: Extract unique permissions
      const permissionsMap = new Map();
      rolesWithPermissions.forEach((role: any) => {
        console.log(`Debug - Processing role ${role.get('name')} with ${role.permissions?.length || 0} permissions`);
        if (role.permissions && role.permissions.length > 0) {
          role.permissions.forEach((permission: any) => {
            console.log(`Debug - Adding permission: ${permission.get('name')} (ID: ${permission.get('id')})`);
            permissionsMap.set(permission.get('id'), permission);
          });
        }
      });

      const permissions = Array.from(permissionsMap.values());
      console.log('Debug - Final permissions count:', permissions.length);
      console.log('Debug - Final permissions:', permissions.map((p: any) => p.get('name')));

      return permissions;
    } catch (error) {
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
  public checkPermission(module: string | number, action: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // req.user is set by the JWT auth middleware
        const userId = req.user?.id;

        if (!userId) {
          return next(new UnauthorizedError('User not authenticated'));
        }

        let moduleId: number;

        // If module is a string (name), find the module ID
        if (typeof module === 'string') {
          const moduleObj = await Module.findOne({ where: { name: module } });
          if (!moduleObj) {
            return next(new NotFoundError(`Module ${module} not found`));
          }
          moduleId = moduleObj.get('id');
        } else {
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
        const hasPermission = userPermissions.some(
          permission => permission.get('moduleId') === moduleId && permission.get('action') === action
        );

        console.log('Final permission check result:', hasPermission);
        console.log('=== END PERMISSION CHECK DEBUG ===\n');

        if (!hasPermission) {
          return next(
            new ForbiddenError(
              `Permission denied: User does not have ${action} permission for this resource`
            )
          );
        }

        next();
      } catch (error) {
        next(
          error instanceof Error
            ? error
            : new InternalServerError('Server error while checking permissions')
        );
      }
    };
  }
}
