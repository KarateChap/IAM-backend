import { Op } from 'sequelize';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { RolePermission } from '../models/rolePermission.model';
import { Module } from '../models/module.model';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';

export interface PermissionAssignmentResult {
  assigned: number;
  skipped: number;
  details: Array<{
    permissionId: number;
    permissionAction: string;
    moduleName: string;
    status: 'assigned' | 'already_exists' | 'error';
    message?: string;
  }>;
}

export interface PermissionRemovalResult {
  removed: number;
  notFound: number;
  details: Array<{
    permissionId: number;
    permissionAction: string;
    moduleName: string;
    status: 'removed' | 'not_found' | 'error';
    message?: string;
  }>;
}

/**
 * RolePermission Service
 * Handles role-permission relationship management and business logic
 */
export class RolePermissionService {
  /**
   * Assign permissions to a role
   */
  async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<PermissionAssignmentResult> {
    try {
      // Validate that the role exists
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new NotFoundError(`Role with ID ${roleId} not found`);
      }

      // Validate that permissionIds is an array
      if (!Array.isArray(permissionIds)) {
        throw new BadRequestError('permissionIds must be an array of permission IDs');
      }

      if (permissionIds.length === 0) {
        throw new BadRequestError('At least one permission ID must be provided');
      }

      // Validate that all permissions exist and get their details
      const permissions = await Permission.findAll({
        where: {
          id: permissionIds
        },
        include: [
          {
            model: Module,
            as: 'module',
            attributes: ['name']
          }
        ]
      });

      if (permissions.length !== permissionIds.length) {
        const foundPermissionIds = permissions.map(permission => permission.get('id'));
        const missingPermissionIds = permissionIds.filter(id => !foundPermissionIds.includes(id));
        throw new NotFoundError(`Permissions not found: ${missingPermissionIds.join(', ')}`);
      }

      // Check for existing assignments
      const existingAssignments = await RolePermission.findAll({
        where: {
          roleId,
          permissionId: permissionIds
        }
      });

      const existingPermissionIds = existingAssignments.map(assignment => assignment.get('permissionId'));
      const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));

      // Create new assignments
      const assignmentPromises = newPermissionIds.map(permissionId =>
        RolePermission.create({
          roleId,
          permissionId
        })
      );

      await Promise.all(assignmentPromises);

      // Prepare detailed result
      const details = permissions.map(permission => {
        const permissionId = permission.get('id') as number;
        const permissionAction = permission.get('action') as string;
        const moduleName = (permission.get('module') as any)?.name || 'Unknown';
        
        if (existingPermissionIds.includes(permissionId)) {
          return {
            permissionId,
            permissionAction,
            moduleName,
            status: 'already_exists' as const,
            message: 'Permission was already assigned to this role'
          };
        } else {
          return {
            permissionId,
            permissionAction,
            moduleName,
            status: 'assigned' as const,
            message: 'Permission successfully assigned to role'
          };
        }
      });

      return {
        assigned: newPermissionIds.length,
        skipped: existingPermissionIds.length,
        details
      };

    } catch (error) {
      console.error('Error in assignPermissionsToRole:', error);
      throw error;
    }
  }

  /**
   * Remove permissions from a role
   */
  async removePermissionsFromRole(roleId: number, permissionIds: number[]): Promise<PermissionRemovalResult> {
    try {
      // Validate that the role exists
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new NotFoundError(`Role with ID ${roleId} not found`);
      }

      // Validate that permissionIds is an array
      if (!Array.isArray(permissionIds)) {
        throw new BadRequestError('permissionIds must be an array of permission IDs');
      }

      if (permissionIds.length === 0) {
        throw new BadRequestError('At least one permission ID must be provided');
      }

      // Get permission information for response details
      const permissions = await Permission.findAll({
        where: {
          id: permissionIds
        },
        include: [
          {
            model: Module,
            as: 'module',
            attributes: ['name']
          }
        ]
      });

      // Find existing assignments
      const existingAssignments = await RolePermission.findAll({
        where: {
          roleId,
          permissionId: permissionIds
        }
      });

      const existingPermissionIds = existingAssignments.map(assignment => assignment.get('permissionId'));

      // Remove existing assignments
      const removedCount = await RolePermission.destroy({
        where: {
          roleId,
          permissionId: existingPermissionIds
        }
      });

      // Prepare detailed result
      const details = permissionIds.map(permissionId => {
        const permission = permissions.find(p => p.get('id') === permissionId);
        const permissionAction = permission ? permission.get('action') as string : 'unknown';
        const moduleName = permission ? (permission.get('module') as any)?.name || 'Unknown' : 'Unknown';
        
        if (existingPermissionIds.includes(permissionId)) {
          return {
            permissionId,
            permissionAction,
            moduleName,
            status: 'removed' as const,
            message: 'Permission successfully removed from role'
          };
        } else {
          return {
            permissionId,
            permissionAction,
            moduleName,
            status: 'not_found' as const,
            message: 'Permission was not assigned to this role'
          };
        }
      });

      return {
        removed: removedCount,
        notFound: permissionIds.length - existingPermissionIds.length,
        details
      };

    } catch (error) {
      console.error('Error in removePermissionsFromRole:', error);
      throw error;
    }
  }

  /**
   * Get all permissions assigned to a role
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
    try {
      // Validate that the role exists
      const role = await Role.findByPk(roleId, {
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
      });

      if (!role) {
        throw new NotFoundError(`Role with ID ${roleId} not found`);
      }

      return role.get('permissions') as Permission[] || [];

    } catch (error) {
      console.error('Error in getRolePermissions:', error);
      throw error;
    }
  }

  /**
   * Check if a role has a specific permission
   */
  async roleHasPermission(roleId: number, permissionId: number): Promise<boolean> {
    try {
      const assignment = await RolePermission.findOne({
        where: {
          roleId,
          permissionId
        }
      });

      return assignment !== null;

    } catch (error) {
      console.error('Error in roleHasPermission:', error);
      throw error;
    }
  }

  /**
   * Get all roles that have a specific permission
   */
  async getRolesWithPermission(permissionId: number): Promise<Role[]> {
    try {
      // Validate that the permission exists
      const permission = await Permission.findByPk(permissionId);
      if (!permission) {
        throw new NotFoundError(`Permission with ID ${permissionId} not found`);
      }

      const roles = await Role.findAll({
        include: [
          {
            model: Permission,
            as: 'permissions',
            where: { id: permissionId },
            through: { attributes: [] },
            attributes: []
          }
        ],
        attributes: ['id', 'name', 'description', 'isActive']
      });

      return roles;

    } catch (error) {
      console.error('Error in getRolesWithPermission:', error);
      throw error;
    }
  }

  /**
   * Replace all permissions for a role (remove existing and assign new ones)
   */
  async replaceRolePermissions(roleId: number, permissionIds: number[]): Promise<PermissionAssignmentResult> {
    try {
      // Validate that the role exists
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new NotFoundError(`Role with ID ${roleId} not found`);
      }

      // Remove all existing permission assignments for this role
      await RolePermission.destroy({
        where: { roleId }
      });

      // Assign new permissions if provided
      if (permissionIds.length > 0) {
        return await this.assignPermissionsToRole(roleId, permissionIds);
      } else {
        return {
          assigned: 0,
          skipped: 0,
          details: []
        };
      }

    } catch (error) {
      console.error('Error in replaceRolePermissions:', error);
      throw error;
    }
  }

  /**
   * Get permissions by module for a role
   */
  async getRolePermissionsByModule(roleId: number, moduleName: string): Promise<Permission[]> {
    try {
      const permissions = await Permission.findAll({
        include: [
          {
            model: Role,
            as: 'roles',
            where: { id: roleId },
            through: { attributes: [] },
            attributes: []
          },
          {
            model: Module,
            as: 'module',
            where: { name: moduleName },
            attributes: ['id', 'name', 'description']
          }
        ]
      });

      return permissions;

    } catch (error) {
      console.error('Error in getRolePermissionsByModule:', error);
      throw error;
    }
  }
}
