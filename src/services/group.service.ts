import { Op } from 'sequelize';
import { Group } from '../models/group.model';
import { Role } from '../models/role.model';
import User from '../models/user.model';
import { GroupRole } from '../models/groupRole.model';
import { UserGroup } from '../models/userGroup.model';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

export interface CreateGroupData {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface GroupWithDetails {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    id: number;
    name: string;
    description?: string;
  }>;
  users: Array<{
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }>;
  userCount: number;
  roleCount: number;
}

export interface GroupFilters {
  search?: string;
  isActive?: boolean;
  hasUsers?: boolean;
  hasRoles?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Group Service
 * Handles group-related business logic and operations
 */
export class GroupService {
  /**
   * Get all groups with optional filtering and pagination
   */
  async getGroups(filters: GroupFilters = {}): Promise<{ groups: GroupWithDetails[]; total: number }> {
    const { search, isActive, hasUsers, hasRoles, limit = 50, offset = 0, sortBy = 'createdAt', order = 'DESC' } = filters;

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
        model: Role,
        as: 'roles',
        through: { attributes: [] },
        required: hasRoles === true,
      },
      {
        model: User,
        as: 'users',
        through: { attributes: [] },
        required: hasUsers === true,
        attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
      },
    ];

    // Execute query
    const { rows: groups, count: total } = await Group.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      limit,
      offset,
      distinct: true,
      order: [[sortBy, order]],
    });

    // Transform results
    const transformedGroups: GroupWithDetails[] = groups.map((group: any) => ({
      id: group.get('id'),
      name: group.get('name'),
      description: group.get('description'),
      isActive: group.get('isActive'),
      createdAt: group.get('createdAt'),
      updatedAt: group.get('updatedAt'),
      roles: ((group.get('roles') as any[]) || []).map((role: any) => ({
        id: role.get('id'),
        name: role.get('name'),
        description: role.get('description'),
      })),
      users: ((group.get('users') as any[]) || []).map((user: any) => ({
        id: user.get('id'),
        username: user.get('username'),
        email: user.get('email'),
        firstName: user.get('firstName'),
        lastName: user.get('lastName'),
      })),
      userCount: ((group.get('users') as any[]) || []).length,
      roleCount: ((group.get('roles') as any[]) || []).length,
    }));

    return { groups: transformedGroups, total };
  }

  /**
   * Get group by ID with full details
   */
  async getGroupById(id: number): Promise<GroupWithDetails> {
    const group = await Group.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        },
        {
          model: User,
          as: 'users',
          through: { attributes: [] },
          attributes: ['id', 'username', 'email', 'firstName', 'lastName'],
        },
      ],
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    return {
      id: group.get('id'),
      name: group.get('name'),
      description: group.get('description'),
      isActive: group.get('isActive'),
      createdAt: group.get('createdAt'),
      updatedAt: group.get('updatedAt'),
      roles: ((group.get('roles') as any[]) || []).map((role: any) => ({
        id: role.get('id'),
        name: role.get('name'),
        description: role.get('description'),
      })),
      users: ((group.get('users') as any[]) || []).map((user: any) => ({
        id: user.get('id'),
        username: user.get('username'),
        email: user.get('email'),
        firstName: user.get('firstName'),
        lastName: user.get('lastName'),
      })),
      userCount: ((group.get('users') as any[]) || []).length,
      roleCount: ((group.get('roles') as any[]) || []).length,
    };
  }

  /**
   * Create a new group
   */
  async createGroup(groupData: CreateGroupData): Promise<GroupWithDetails> {
    const { name, description, isActive = true } = groupData;

    // Check for existing group with same name
    const existingGroup = await Group.findOne({ where: { name } });
    if (existingGroup) {
      throw new ConflictError('Group name already exists');
    }

    // Create group
    const group = await Group.create({
      name,
      description,
      isActive,
    });

    // Return group with empty relationships
    return {
      id: group.get('id') as number,
      name: group.get('name') as string,
      description: group.get('description') as string,
      isActive: group.get('isActive') as boolean,
      createdAt: group.get('createdAt') as Date,
      updatedAt: group.get('updatedAt') as Date,
      roles: [],
      users: [],
      userCount: 0,
      roleCount: 0,
    };
  }

  /**
   * Update group
   */
  async updateGroup(id: number, updateData: UpdateGroupData): Promise<GroupWithDetails> {
    const group = await Group.findByPk(id);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check for name conflicts if updating name
    if (updateData.name && updateData.name !== group.get('name')) {
      const existingGroup = await Group.findOne({
        where: { name: updateData.name, id: { [Op.ne]: id } },
      });
      if (existingGroup) {
        throw new ConflictError('Group name already exists');
      }
    }

    // Update group
    await group.update(updateData);

    // Return updated group with details
    return this.getGroupById(id);
  }

  /**
   * Delete group (soft delete by setting isActive to false)
   */
  async deleteGroup(id: number): Promise<void> {
    const group = await Group.findByPk(id);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if group has users
    const userCount = await UserGroup.count({ where: { groupId: id } });
    if (userCount > 0) {
      throw new ValidationError('Cannot delete group with assigned users. Remove users first.');
    }

    // Soft delete by deactivating
    await group.update({ isActive: false });
  }

  /**
   * Hard delete group (permanently remove from database)
   */
  async hardDeleteGroup(id: number): Promise<void> {
    const group = await Group.findByPk(id);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Remove all relationships first
    await Promise.all([
      UserGroup.destroy({ where: { groupId: id } }),
      GroupRole.destroy({ where: { groupId: id } }),
    ]);

    // Hard delete group
    await group.destroy();
  }

  /**
   * Assign users to group (bulk operation)
   */
  async assignUsersToGroup(groupId: number, userIds: number[]): Promise<{ assigned: number; skipped: number }> {
    // Verify group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify all users exist and are active
    const users = await User.findAll({
      where: { id: userIds, isActive: true },
    });

    if (users.length !== userIds.length) {
      throw new ValidationError('Some users not found or inactive');
    }

    // Get existing assignments
    const existingAssignments = await UserGroup.findAll({
      where: { userId: userIds, groupId },
    });

    const existingUserIds = existingAssignments.map(assignment => assignment.get('userId'));
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    // Create new assignments
    if (newUserIds.length > 0) {
      const assignments = newUserIds.map(userId => ({ userId, groupId }));
      await UserGroup.bulkCreate(assignments);
    }

    return {
      assigned: newUserIds.length,
      skipped: existingUserIds.length,
    };
  }

  /**
   * Remove users from group (bulk operation)
   */
  async removeUsersFromGroup(groupId: number, userIds: number[]): Promise<{ removed: number }> {
    const removedCount = await UserGroup.destroy({
      where: { userId: userIds, groupId },
    });

    return { removed: removedCount };
  }

  /**
   * Assign roles to group (bulk operation)
   */
  async assignRolesToGroup(groupId: number, roleIds: number[]): Promise<{ assigned: number; skipped: number }> {
    // Verify group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify all roles exist and are active
    const roles = await Role.findAll({
      where: { id: roleIds, isActive: true },
    });

    if (roles.length !== roleIds.length) {
      throw new ValidationError('Some roles not found or inactive');
    }

    // Get existing assignments
    const existingAssignments = await GroupRole.findAll({
      where: { roleId: roleIds, groupId },
    });

    const existingRoleIds = existingAssignments.map(assignment => assignment.get('roleId'));
    const newRoleIds = roleIds.filter(id => !existingRoleIds.includes(id));

    // Create new assignments
    if (newRoleIds.length > 0) {
      const assignments = newRoleIds.map(roleId => ({ groupId, roleId }));
      await GroupRole.bulkCreate(assignments);
    }

    return {
      assigned: newRoleIds.length,
      skipped: existingRoleIds.length,
    };
  }

  /**
   * Remove roles from group (bulk operation)
   */
  async removeRolesFromGroup(groupId: number, roleIds: number[]): Promise<{ removed: number }> {
    const removedCount = await GroupRole.destroy({
      where: { roleId: roleIds, groupId },
    });

    return { removed: removedCount };
  }

  /**
   * Get group statistics
   */
  async getGroupStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withUsers: number;
    withoutUsers: number;
    withRoles: number;
    withoutRoles: number;
    averageUsersPerGroup: number;
    averageRolesPerGroup: number;
  }> {
    const [total, active, withUsers, withRoles, userCounts, roleCounts] = await Promise.all([
      Group.count(),
      Group.count({ where: { isActive: true } }),
      Group.count({
        include: [
          {
            model: User,
            as: 'users',
            through: { attributes: [] },
            required: true,
          },
        ],
        distinct: true,
      }),
      Group.count({
        include: [
          {
            model: Role,
            as: 'roles',
            through: { attributes: [] },
            required: true,
          },
        ],
        distinct: true,
      }),
      UserGroup.count(),
      GroupRole.count(),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      withUsers,
      withoutUsers: total - withUsers,
      withRoles,
      withoutRoles: total - withRoles,
      averageUsersPerGroup: total > 0 ? Math.round((userCounts / total) * 100) / 100 : 0,
      averageRolesPerGroup: total > 0 ? Math.round((roleCounts / total) * 100) / 100 : 0,
    };
  }
}

export default new GroupService();
