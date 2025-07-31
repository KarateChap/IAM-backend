import { Op } from 'sequelize';
import { Role } from '../models/role.model';
import { Permission } from '../models/permission.model';
import { Group } from '../models/group.model';
import { Module } from '../models/module.model';
import { RolePermission } from '../models/rolePermission.model';
import { GroupRole } from '../models/groupRole.model';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

export interface CreateRoleData {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface RoleWithDetails {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: Array<{
    id: number;
    name: string;
    action: string;
    description?: string;
    module: {
      id: number;
      name: string;
    };
  }>;
  groups: Array<{
    id: number;
    name: string;
    description?: string;
  }>;
  permissionCount: number;
  groupCount: number;
}

export interface RoleFilters {
  search?: string;
  isActive?: boolean;
  hasPermissions?: boolean;
  hasGroups?: boolean;
  moduleId?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Role Service
 * Handles role-related business logic and operations
 */
export class RoleService {
  /**
   * Get all roles with optional filtering and pagination
   */
  async getRoles(filters: RoleFilters = {}): Promise<{ roles: RoleWithDetails[]; total: number }> {
    const { search, isActive, hasPermissions, hasGroups, moduleId, limit = 50, offset = 0, sortBy = 'createdAt', order = 'DESC' } = filters;

    // Build where conditions
    const whereConditions: any = {};

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    // Build include conditions
    const includeConditions: any = [
      {
        model: Permission,
        as: 'permissions',
        through: { attributes: [] },
        required: hasPermissions === true,
        include: [
          {
            model: Module,
            as: 'module',
            ...(moduleId && { where: { id: moduleId } }),
          },
        ],
      },
      {
        model: Group,
        as: 'groups',
        through: { attributes: [] },
        required: hasGroups === true,
      },
    ];

    // Execute query
    const { rows: roles, count: total } = await Role.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      limit,
      offset,
      distinct: true,
      order: [[sortBy, order]],
    });

    // Transform results
    const transformedRoles: RoleWithDetails[] = roles.map((role: any) => ({
      id: role.get('id'),
      name: role.get('name'),
      description: role.get('description'),
      isActive: role.get('isActive'),
      createdAt: role.get('createdAt'),
      updatedAt: role.get('updatedAt'),
      permissions: ((role.get('permissions') as any[]) || []).map((permission: any) => ({
        id: permission.get('id'),
        name: permission.get('name'),
        action: permission.get('action'),
        description: permission.get('description'),
        module: {
          id: permission.module?.get('id'),
          name: permission.module?.get('name'),
        },
      })),
      groups: ((role.get('groups') as any[]) || []).map((group: any) => ({
        id: group.get('id'),
        name: group.get('name'),
        description: group.get('description'),
      })),
      permissionCount: ((role.get('permissions') as any[]) || []).length,
      groupCount: ((role.get('groups') as any[]) || []).length,
    }));

    return { roles: transformedRoles, total };
  }

  /**
   * Get role by ID with full details
   */
  async getRoleById(id: number): Promise<RoleWithDetails> {
    const role = await Role.findByPk(id, {
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
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return {
      id: role.get('id'),
      name: role.get('name'),
      description: role.get('description'),
      isActive: role.get('isActive'),
      createdAt: role.get('createdAt'),
      updatedAt: role.get('updatedAt'),
      permissions: ((role.get('permissions') as any[]) || []).map((permission: any) => ({
        id: permission.get('id'),
        name: permission.get('name'),
        action: permission.get('action'),
        description: permission.get('description'),
        module: {
          id: permission.module?.get('id'),
          name: permission.module?.get('name'),
        },
      })),
      groups: ((role.get('groups') as any[]) || []).map((group: any) => ({
        id: group.get('id'),
        name: group.get('name'),
        description: group.get('description'),
      })),
      permissionCount: ((role.get('permissions') as any[]) || []).length,
      groupCount: ((role.get('groups') as any[]) || []).length,
    };
  }

  /**
   * Create a new role
   */
  async createRole(roleData: CreateRoleData): Promise<RoleWithDetails> {
    const { name, description, isActive = true } = roleData;

    // Check for existing role with same name
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      throw new ConflictError('Role name already exists');
    }

    // Create role
    const role = await Role.create({
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
  async updateRole(id: number, updateData: UpdateRoleData): Promise<RoleWithDetails> {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check for name conflicts if updating name
    if (updateData.name && updateData.name !== role.get('name')) {
      const existingRole = await Role.findOne({
        where: { name: updateData.name, id: { [Op.ne]: id } },
      });
      if (existingRole) {
        throw new ConflictError('Role name already exists');
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
  async deleteRole(id: number): Promise<void> {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check if role is assigned to groups
    const groupCount = await GroupRole.count({ where: { roleId: id } });
    if (groupCount > 0) {
      throw new ValidationError('Cannot delete role assigned to groups. Remove from groups first.');
    }

    // Soft delete by deactivating
    await role.update({ isActive: false });
  }

  /**
   * Hard delete role (permanently remove from database)
   */
  async hardDeleteRole(id: number): Promise<void> {
    const role = await Role.findByPk(id);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Remove all relationships first
    await Promise.all([
      RolePermission.destroy({ where: { roleId: id } }),
      GroupRole.destroy({ where: { roleId: id } }),
    ]);

    // Hard delete role
    await role.destroy();
  }

  /**
   * Assign permissions to role (bulk operation)
   */
  async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<{ assigned: number; skipped: number }> {
    // Verify role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Verify all permissions exist and are active
    const permissions = await Permission.findAll({
      where: { id: permissionIds, isActive: true },
    });

    if (permissions.length !== permissionIds.length) {
      throw new ValidationError('Some permissions not found or inactive');
    }

    // Get existing assignments
    const existingAssignments = await RolePermission.findAll({
      where: { permissionId: permissionIds, roleId },
    });

    const existingPermissionIds = existingAssignments.map(assignment => assignment.get('permissionId'));
    const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));

    // Create new assignments
    if (newPermissionIds.length > 0) {
      const assignments = newPermissionIds.map(permissionId => ({ roleId, permissionId }));
      await RolePermission.bulkCreate(assignments);
    }

    return {
      assigned: newPermissionIds.length,
      skipped: existingPermissionIds.length,
    };
  }

  /**
   * Remove permissions from role (bulk operation)
   */
  async removePermissionsFromRole(roleId: number, permissionIds: number[]): Promise<{ removed: number }> {
    const removedCount = await RolePermission.destroy({
      where: { permissionId: permissionIds, roleId },
    });

    return { removed: removedCount };
  }

  /**
   * Get roles by permission
   */
  async getRolesByPermission(permissionId: number): Promise<RoleWithDetails[]> {
    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          where: { id: permissionId },
          through: { attributes: [] },
          include: [
            {
              model: Module,
              as: 'module',
            },
          ],
        },
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
        },
      ],
    });

    return roles.map((role: any) => ({
      id: role.get('id'),
      name: role.get('name'),
      description: role.get('description'),
      isActive: role.get('isActive'),
      createdAt: role.get('createdAt'),
      updatedAt: role.get('updatedAt'),
      permissions: ((role.get('permissions') as any[]) || []).map((permission: any) => ({
        id: permission.get('id'),
        name: permission.get('name'),
        action: permission.get('action'),
        description: permission.get('description'),
        module: {
          id: permission.module?.get('id'),
          name: permission.module?.get('name'),
        },
      })),
      groups: ((role.get('groups') as any[]) || []).map((group: any) => ({
        id: group.get('id'),
        name: group.get('name'),
        description: group.get('description'),
      })),
      permissionCount: ((role.get('permissions') as any[]) || []).length,
      groupCount: ((role.get('groups') as any[]) || []).length,
    }));
  }

  /**
   * Get roles by module
   */
  async getRolesByModule(moduleId: number): Promise<RoleWithDetails[]> {
    const module = await Module.findByPk(moduleId);
    if (!module) {
      throw new NotFoundError('Module not found');
    }

    const roles = await Role.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          include: [
            {
              model: Module,
              as: 'module',
              where: { id: moduleId },
            },
          ],
          required: true,
        },
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
        },
      ],
    });

    return roles.map((role: any) => ({
      id: role.get('id'),
      name: role.get('name'),
      description: role.get('description'),
      isActive: role.get('isActive'),
      createdAt: role.get('createdAt'),
      updatedAt: role.get('updatedAt'),
      permissions: ((role.get('permissions') as any[]) || []).map((permission: any) => ({
        id: permission.get('id'),
        name: permission.get('name'),
        action: permission.get('action'),
        description: permission.get('description'),
        module: {
          id: permission.module?.get('id'),
          name: permission.module?.get('name'),
        },
      })),
      groups: ((role.get('groups') as any[]) || []).map((group: any) => ({
        id: group.get('id'),
        name: group.get('name'),
        description: group.get('description'),
      })),
      permissionCount: ((role.get('permissions') as any[]) || []).length,
      groupCount: ((role.get('groups') as any[]) || []).length,
    }));
  }

  /**
   * Clone role with all permissions
   */
  async cloneRole(sourceRoleId: number, newRoleName: string, description?: string): Promise<RoleWithDetails> {
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
  async getRoleStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withPermissions: number;
    withoutPermissions: number;
    withGroups: number;
    withoutGroups: number;
    averagePermissionsPerRole: number;
    averageGroupsPerRole: number;
  }> {
    const [total, active, withPermissions, withGroups, permissionCounts, groupCounts] = await Promise.all([
      Role.count(),
      Role.count({ where: { isActive: true } }),
      Role.count({
        include: [
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] },
            required: true,
          },
        ],
        distinct: true,
      }),
      Role.count({
        include: [
          {
            model: Group,
            as: 'groups',
            through: { attributes: [] },
            required: true,
          },
        ],
        distinct: true,
      }),
      RolePermission.count(),
      GroupRole.count(),
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

export default new RoleService();
