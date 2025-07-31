import { Op } from 'sequelize';
import { Group } from '../models/group.model';
import { Role } from '../models/role.model';
import { GroupRole } from '../models/groupRole.model';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';

export interface AssignmentResult {
  assigned: number;
  skipped: number;
  details: Array<{
    roleId: number;
    roleName: string;
    status: 'assigned' | 'already_exists' | 'error';
    message?: string;
  }>;
}

export interface RemovalResult {
  removed: number;
  notFound: number;
  details: Array<{
    roleId: number;
    roleName: string;
    status: 'removed' | 'not_found' | 'error';
    message?: string;
  }>;
}

/**
 * GroupRole Service
 * Handles group-role relationship management and business logic
 */
export class GroupRoleService {
  /**
   * Assign roles to a group
   */
  async assignRolesToGroup(groupId: number, roleIds: number[]): Promise<AssignmentResult> {
    try {
      // Validate that the group exists
      const group = await Group.findByPk(groupId);
      if (!group) {
        throw new NotFoundError(`Group with ID ${groupId} not found`);
      }

      // Validate that roleIds is an array
      if (!Array.isArray(roleIds)) {
        throw new BadRequestError('roleIds must be an array of role IDs');
      }

      if (roleIds.length === 0) {
        throw new BadRequestError('At least one role ID must be provided');
      }

      // Validate that all roles exist
      const roles = await Role.findAll({
        where: {
          id: roleIds
        }
      });

      if (roles.length !== roleIds.length) {
        const foundRoleIds = roles.map(role => role.get('id'));
        const missingRoleIds = roleIds.filter(id => !foundRoleIds.includes(id));
        throw new NotFoundError(`Roles not found: ${missingRoleIds.join(', ')}`);
      }

      // Check for existing assignments
      const existingAssignments = await GroupRole.findAll({
        where: {
          groupId,
          roleId: roleIds
        }
      });

      const existingRoleIds = existingAssignments.map(assignment => assignment.get('roleId'));
      const newRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));

      // Create new assignments
      const assignmentPromises = newRoleIds.map(roleId =>
        GroupRole.create({
          groupId,
          roleId
        })
      );

      await Promise.all(assignmentPromises);

      // Prepare detailed result
      const details = roles.map(role => {
        const roleId = role.get('id') as number;
        const roleName = role.get('name') as string;
        
        if (existingRoleIds.includes(roleId)) {
          return {
            roleId,
            roleName,
            status: 'already_exists' as const,
            message: 'Role was already assigned to this group'
          };
        } else {
          return {
            roleId,
            roleName,
            status: 'assigned' as const,
            message: 'Role successfully assigned to group'
          };
        }
      });

      return {
        assigned: newRoleIds.length,
        skipped: existingRoleIds.length,
        details
      };

    } catch (error) {
      console.error('Error in assignRolesToGroup:', error);
      throw error;
    }
  }

  /**
   * Remove roles from a group
   */
  async removeRolesFromGroup(groupId: number, roleIds: number[]): Promise<RemovalResult> {
    try {
      // Validate that the group exists
      const group = await Group.findByPk(groupId);
      if (!group) {
        throw new NotFoundError(`Group with ID ${groupId} not found`);
      }

      // Validate that roleIds is an array
      if (!Array.isArray(roleIds)) {
        throw new BadRequestError('roleIds must be an array of role IDs');
      }

      if (roleIds.length === 0) {
        throw new BadRequestError('At least one role ID must be provided');
      }

      // Get role information for response details
      const roles = await Role.findAll({
        where: {
          id: roleIds
        }
      });

      // Find existing assignments
      const existingAssignments = await GroupRole.findAll({
        where: {
          groupId,
          roleId: roleIds
        }
      });

      const existingRoleIds = existingAssignments.map(assignment => assignment.get('roleId'));

      // Remove existing assignments
      const removedCount = await GroupRole.destroy({
        where: {
          groupId,
          roleId: existingRoleIds
        }
      });

      // Prepare detailed result
      const details = roleIds.map(roleId => {
        const role = roles.find(r => r.get('id') === roleId);
        const roleName = role ? role.get('name') as string : `Role ${roleId}`;
        
        if (existingRoleIds.includes(roleId)) {
          return {
            roleId,
            roleName,
            status: 'removed' as const,
            message: 'Role successfully removed from group'
          };
        } else {
          return {
            roleId,
            roleName,
            status: 'not_found' as const,
            message: 'Role was not assigned to this group'
          };
        }
      });

      return {
        removed: removedCount,
        notFound: roleIds.length - existingRoleIds.length,
        details
      };

    } catch (error) {
      console.error('Error in removeRolesFromGroup:', error);
      throw error;
    }
  }

  /**
   * Get all roles assigned to a group
   */
  async getGroupRoles(groupId: number): Promise<Role[]> {
    try {
      // Validate that the group exists
      const group = await Group.findByPk(groupId, {
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name', 'description', 'isActive']
          }
        ]
      });

      if (!group) {
        throw new NotFoundError(`Group with ID ${groupId} not found`);
      }

      return group.get('roles') as Role[] || [];

    } catch (error) {
      console.error('Error in getGroupRoles:', error);
      throw error;
    }
  }

  /**
   * Check if a group has a specific role
   */
  async groupHasRole(groupId: number, roleId: number): Promise<boolean> {
    try {
      const assignment = await GroupRole.findOne({
        where: {
          groupId,
          roleId
        }
      });

      return assignment !== null;

    } catch (error) {
      console.error('Error in groupHasRole:', error);
      throw error;
    }
  }

  /**
   * Get all groups that have a specific role
   */
  async getGroupsWithRole(roleId: number): Promise<Group[]> {
    try {
      // Validate that the role exists
      const role = await Role.findByPk(roleId);
      if (!role) {
        throw new NotFoundError(`Role with ID ${roleId} not found`);
      }

      const groups = await Group.findAll({
        include: [
          {
            model: Role,
            as: 'roles',
            where: { id: roleId },
            through: { attributes: [] },
            attributes: []
          }
        ],
        attributes: ['id', 'name', 'description', 'isActive']
      });

      return groups;

    } catch (error) {
      console.error('Error in getGroupsWithRole:', error);
      throw error;
    }
  }

  /**
   * Replace all roles for a group (remove existing and assign new ones)
   */
  async replaceGroupRoles(groupId: number, roleIds: number[]): Promise<AssignmentResult> {
    try {
      // Validate that the group exists
      const group = await Group.findByPk(groupId);
      if (!group) {
        throw new NotFoundError(`Group with ID ${groupId} not found`);
      }

      // Remove all existing role assignments for this group
      await GroupRole.destroy({
        where: { groupId }
      });

      // Assign new roles if provided
      if (roleIds.length > 0) {
        return await this.assignRolesToGroup(groupId, roleIds);
      } else {
        return {
          assigned: 0,
          skipped: 0,
          details: []
        };
      }

    } catch (error) {
      console.error('Error in replaceGroupRoles:', error);
      throw error;
    }
  }
}
