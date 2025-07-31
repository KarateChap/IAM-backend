import User from '../models/user.model';
import { Group } from '../models/group.model';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { Module } from '../models/module.model';
import { UserGroup } from '../models/userGroup.model';
import { GroupRole } from '../models/groupRole.model';
import { RolePermission } from '../models/rolePermission.model';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { Op } from 'sequelize';

export interface PermissionFilters {
  search?: string;
  moduleId?: number;
  action?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface PermissionWithModule {
  id: number;
  name: string;
  description?: string;
  action: 'create' | 'read' | 'update' | 'delete';
  moduleId: number;
  isActive: boolean;
  module: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionCheck {
  userId: number;
  moduleId: number;
  action: string;
  hasPermission: boolean;
}

export interface UserPermissionSummary {
  userId: number;
  username: string;
  email: string;
  groups: Array<{
    id: number;
    name: string;
    roles: Array<{
      id: number;
      name: string;
      permissionCount: number;
    }>;
  }>;
  totalPermissions: number;
  permissions: Permission[];
}

/**
 * Permission Service
 * Handles complex permission-related business logic and operations
 */
export class PermissionService {
  /**
   * Get all permissions with optional filtering and pagination
   */
  async getPermissions(filters: PermissionFilters = {}): Promise<{ permissions: PermissionWithModule[]; total: number }> {
    const { search, moduleId, action, limit = 50, offset = 0, sortBy = 'createdAt', order = 'DESC' } = filters;

    // Build where conditions
    const whereConditions: any = {};

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (moduleId) {
      whereConditions.moduleId = moduleId;
    }

    if (action) {
      whereConditions.action = action;
    }

    const result = await Permission.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'name'],
        },
      ],
      limit,
      offset,
      order: [[sortBy, order]],
    });

    // Transform results
    const permissions = result.rows.map((permission: any) => ({
      id: permission.get('id'),
      name: permission.get('name'),
      description: permission.get('description'),
      action: permission.get('action'),
      moduleId: permission.get('moduleId'),
      isActive: permission.get('isActive'),
      module: {
        id: (permission as any).module?.get('id'),
        name: (permission as any).module?.get('name'),
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
  async getPermissionById(id: number): Promise<PermissionWithModule> {
    const permission = await Permission.findByPk(id, {
      include: [
        {
          model: Module,
          as: 'module',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!permission) {
      throw new NotFoundError(`Permission with ID ${id} not found`);
    }

    return {
      id: permission.get('id'),
      name: permission.get('name'),
      description: permission.get('description'),
      action: permission.get('action'),
      moduleId: permission.get('moduleId'),
      isActive: permission.get('isActive'),
      module: {
        id: (permission as any).module?.get('id'),
        name: (permission as any).module?.get('name'),
      },
      createdAt: permission.get('createdAt'),
      updatedAt: permission.get('updatedAt'),
    };
  }

  /**
   * Create a new permission
   */
  async createPermission(data: { name: string; description?: string; action: 'create' | 'read' | 'update' | 'delete'; moduleId: number; isActive?: boolean }): Promise<PermissionWithModule> {
    // Check if permission with same name and action already exists for this module
    const existingPermission = await Permission.findOne({
      where: {
        name: data.name,
        action: data.action,
        moduleId: data.moduleId,
      },
    });

    if (existingPermission) {
      throw new ConflictError('Permission with this name and action already exists for this module');
    }

    // Verify module exists
    const module = await Module.findByPk(data.moduleId);
    if (!module) {
      throw new NotFoundError(`Module with ID ${data.moduleId} not found`);
    }

    const permission = await Permission.create({ ...data, isActive: data.isActive ?? true });
    return this.getPermissionById(permission.id);
  }

  /**
   * Update a permission
   */
  async updatePermission(id: number, data: Partial<{ name: string; description?: string; action: 'create' | 'read' | 'update' | 'delete'; moduleId: number; isActive: boolean }>): Promise<PermissionWithModule> {
    const permission = await Permission.findByPk(id);
    if (!permission) {
      throw new NotFoundError(`Permission with ID ${id} not found`);
    }

    // If updating name, action, or moduleId, check for conflicts
    if (data.name || data.action || data.moduleId) {
      const existingPermission = await Permission.findOne({
        where: {
          name: data.name || permission.get('name'),
          action: data.action || permission.get('action'),
          moduleId: data.moduleId || permission.get('moduleId'),
          id: { [Op.ne]: id },
        },
      });

      if (existingPermission) {
        throw new ConflictError('Permission with this name and action already exists for this module');
      }
    }

    // If updating moduleId, verify module exists
    if (data.moduleId) {
      const module = await Module.findByPk(data.moduleId);
      if (!module) {
        throw new NotFoundError(`Module with ID ${data.moduleId} not found`);
      }
    }

    await permission.update(data);
    return this.getPermissionById(id);
  }

  /**
   * Delete a permission
   */
  async deletePermission(id: number): Promise<void> {
    const permission = await Permission.findByPk(id);
    if (!permission) {
      throw new NotFoundError(`Permission with ID ${id} not found`);
    }

    // Remove all role-permission relationships first
    await RolePermission.destroy({ where: { permissionId: id } });

    // Hard delete permission
    await permission.destroy();
  }

  /**
   * Get comprehensive user permissions with hierarchy details
   */
  async getUserPermissionSummary(userId: number): Promise<UserPermissionSummary> {
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

    if (!userWithGroups) {
      throw new NotFoundError('User not found');
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
    const groupIds = userWithGroups.groups.map((group: any) => group.get('id'));
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

    // Step 3: Get all permissions for user
    const permissions = await this.getUserPermissions(userId);

    // Step 4: Build summary with role details
    const groupSummary = await Promise.all(
      groupsWithRoles.map(async (group: any) => {
        const roles = (group.get('roles') as any[]) || [];
        const roleDetails = await Promise.all(
          roles.map(async (role: any) => {
            const rolePermissions = await this.getRolePermissions(role.get('id'));
            return {
              id: role.get('id'),
              name: role.get('name'),
              permissionCount: rolePermissions.length,
            };
          })
        );

        return {
          id: group.get('id'),
          name: group.get('name'),
          roles: roleDetails,
        };
      })
    );

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
  async getUserPermissions(userId: number): Promise<Permission[]> {
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

    if (!userWithGroups || !userWithGroups.groups || userWithGroups.groups.length === 0) {
      return [];
    }

    // Step 2: Get group IDs
    const groupIds = userWithGroups.groups.map((group: any) => group.get('id'));

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

    // Step 4: Extract role IDs
    const roleIds: number[] = [];
    groupsWithRoles.forEach((group: any) => {
      const groupRoles = (group.get('roles') as any[]) || [];
      if (groupRoles && groupRoles.length > 0) {
        groupRoles.forEach((role: any) => {
          roleIds.push(role.get('id'));
        });
      }
    });

    if (roleIds.length === 0) {
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

    // Step 6: Extract unique permissions
    const permissionsMap = new Map();
    rolesWithPermissions.forEach((role: any) => {
      if (role.permissions && role.permissions.length > 0) {
        role.permissions.forEach((permission: any) => {
          permissionsMap.set(permission.get('id'), permission);
        });
      }
    });

    return Array.from(permissionsMap.values());
  }

  /**
   * Get all permissions for a specific role
   */
  async getRolePermissions(roleId: number): Promise<Permission[]> {
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
            },
          ],
        },
      ],
    });

    if (!role) {
      return [];
    }

    const permissions = role.get('permissions') as any[];
    return permissions || [];
  }

  /**
   * Check if user has specific permission
   */
  async checkUserPermission(userId: number, moduleId: number, action: string): Promise<PermissionCheck> {
    const userPermissions = await this.getUserPermissions(userId);

    const hasPermission = userPermissions.some(
      permission => permission.get('moduleId') === moduleId && permission.get('action') === action
    );

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
  async checkUserPermissionByModuleName(userId: number, moduleName: string, action: string): Promise<PermissionCheck> {
    const module = await Module.findOne({ where: { name: moduleName } });
    if (!module) {
      throw new NotFoundError(`Module ${moduleName} not found`);
    }

    return this.checkUserPermission(userId, module.get('id'), action);
  }

  /**
   * Assign user to group
   */
  async assignUserToGroup(userId: number, groupId: number): Promise<void> {
    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if assignment already exists
    const existingAssignment = await UserGroup.findOne({
      where: { userId, groupId }
    });

    if (existingAssignment) {
      throw new ConflictError('User is already assigned to this group');
    }

    // Create assignment
    await UserGroup.create({ userId, groupId });
  }

  /**
   * Remove user from group
   */
  async removeUserFromGroup(userId: number, groupId: number): Promise<void> {
    const assignment = await UserGroup.findOne({
      where: { userId, groupId }
    });

    if (!assignment) {
      throw new NotFoundError('User is not assigned to this group');
    }

    await assignment.destroy();
  }

  /**
   * Assign role to group
   */
  async assignRoleToGroup(groupId: number, roleId: number): Promise<void> {
    // Verify group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check if assignment already exists
    const existingAssignment = await GroupRole.findOne({
      where: { groupId, roleId }
    });

    if (existingAssignment) {
      throw new ConflictError('Role is already assigned to this group');
    }

    // Create assignment
    await GroupRole.create({ groupId, roleId });
  }

  /**
   * Remove role from group
   */
  async removeRoleFromGroup(groupId: number, roleId: number): Promise<void> {
    const assignment = await GroupRole.findOne({
      where: { groupId, roleId }
    });

    if (!assignment) {
      throw new NotFoundError('Role is not assigned to this group');
    }

    await assignment.destroy();
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    // Verify role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Verify permission exists
    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    // Check if assignment already exists
    const existingAssignment = await RolePermission.findOne({
      where: { roleId, permissionId }
    });

    if (existingAssignment) {
      throw new ConflictError('Permission is already assigned to this role');
    }

    // Create assignment
    await RolePermission.create({ roleId, permissionId });
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    const assignment = await RolePermission.findOne({
      where: { roleId, permissionId }
    });

    if (!assignment) {
      throw new NotFoundError('Permission is not assigned to this role');
    }

    await assignment.destroy();
  }

  /**
   * Get users by permission
   */
  async getUsersByPermission(moduleId: number, action: string): Promise<User[]> {
    // Find all roles that have this permission
    const rolesWithPermission = await Role.findAll({
      include: [
        {
          model: Permission,
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
    const groupsWithRoles = await Group.findAll({
      include: [
        {
          model: Role,
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
    const usersInGroups = await User.findAll({
      include: [
        {
          model: Group,
          as: 'groups',
          where: { id: groupIds },
          through: { attributes: [] },
        },
      ],
    });

    return usersInGroups;
  }
}

export default new PermissionService();
