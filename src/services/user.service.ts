import { Op } from 'sequelize';
import User from '../models/user.model';
import { Group } from '../models/group.model';
import { UserGroup } from '../models/userGroup.model';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface UserWithGroups {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  groups: Array<{
    id: number;
    name: string;
    description?: string;
  }>;
}

export interface UserFilters {
  search?: string;
  isActive?: boolean;
  groupId?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * User Service
 * Handles user-related business logic and complex operations
 */
export class UserService {
  /**
   * Get all users with optional filtering and pagination
   */
  async getUsers(filters: UserFilters = {}): Promise<{ users: UserWithGroups[]; total: number }> {
    const { search, isActive, groupId, limit = 50, offset = 0, sortBy = 'createdAt', order = 'DESC' } = filters;

    // Build where conditions
    const whereConditions: any = {};

    if (search) {
      whereConditions[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }

    if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    // Build include conditions for groups
    const includeConditions: any = [
      {
        model: Group,
        as: 'groups',
        through: { attributes: [] },
        required: false, // LEFT JOIN
      },
    ];

    if (groupId) {
      includeConditions[0].where = { id: groupId };
      includeConditions[0].required = true; // INNER JOIN when filtering by group
    }

    // Execute query
    const { rows: users, count: total } = await User.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      limit,
      offset,
      distinct: true, // Important for correct count with includes
      order: [[sortBy, order]],
    });

    // Transform results
    const transformedUsers: UserWithGroups[] = users.map((user: any) => ({
      id: user.get('id'),
      username: user.get('username'),
      email: user.get('email'),
      firstName: user.get('firstName'),
      lastName: user.get('lastName'),
      isActive: user.get('isActive'),
      createdAt: user.get('createdAt'),
      updatedAt: user.get('updatedAt'),
      groups: (user.groups || []).map((group: any) => ({
        id: group.get('id'),
        name: group.get('name'),
        description: group.get('description'),
      })),
    }));

    return { users: transformedUsers, total };
  }

  /**
   * Get user by ID with groups
   */
  async getUserById(id: number): Promise<UserWithGroups> {
    const user = await User.findByPk(id, {
      include: [
        {
          model: Group,
          as: 'groups',
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.get('id'),
      username: user.get('username'),
      email: user.get('email'),
      firstName: user.get('firstName'),
      lastName: user.get('lastName'),
      isActive: user.get('isActive'),
      createdAt: user.get('createdAt'),
      updatedAt: user.get('updatedAt'),
      groups: (user.groups || []).map((group: any) => ({
        id: group.get('id'),
        name: group.get('name'),
        description: group.get('description'),
      })),
    };
  }

  /**
   * Create a new user
   */
  async createUser(userData: CreateUserData): Promise<UserWithGroups> {
    const { username, email, password, firstName, lastName, isActive = true } = userData;

    // Check for existing user
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.get('email') === email) {
        throw new ConflictError('Email already exists');
      }
      if (existingUser.get('username') === username) {
        throw new ConflictError('Username already exists');
      }
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by model hook
      firstName,
      lastName,
      isActive,
    });

    // Return user with empty groups array
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      groups: [],
    };
  }

  /**
   * Update user
   */
  async updateUser(id: number, updateData: UpdateUserData): Promise<UserWithGroups> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check for conflicts if updating username or email
    if (updateData.username || updateData.email) {
      const whereConditions: any = {
        id: { [Op.ne]: id }, // Exclude current user
      };

      const orConditions: any[] = [];
      if (updateData.username) {
        orConditions.push({ username: updateData.username });
      }
      if (updateData.email) {
        orConditions.push({ email: updateData.email });
      }

      if (orConditions.length > 0) {
        whereConditions[Op.or] = orConditions;

        const existingUser = await User.findOne({ where: whereConditions });
        if (existingUser) {
          if (updateData.email && existingUser.get('email') === updateData.email) {
            throw new ConflictError('Email already exists');
          }
          if (updateData.username && existingUser.get('username') === updateData.username) {
            throw new ConflictError('Username already exists');
          }
        }
      }
    }

    // Update user
    await user.update(updateData);

    // Return updated user with groups
    return this.getUserById(id);
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  async deleteUser(id: number): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Soft delete by deactivating
    await user.update({ isActive: false });
  }

  /**
   * Hard delete user (permanently remove from database)
   */
  async hardDeleteUser(id: number): Promise<void> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Remove all group associations first
    await UserGroup.destroy({ where: { userId: id } });

    // Hard delete user
    await user.destroy();
  }

  /**
   * Get users in a specific group
   */
  async getUsersByGroup(groupId: number): Promise<UserWithGroups[]> {
    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const users = await User.findAll({
      include: [
        {
          model: Group,
          as: 'groups',
          where: { id: groupId },
          through: { attributes: [] },
        },
      ],
    });

    return users.map((user: any) => ({
      id: user.get('id'),
      username: user.get('username'),
      email: user.get('email'),
      firstName: user.get('firstName'),
      lastName: user.get('lastName'),
      isActive: user.get('isActive'),
      createdAt: user.get('createdAt'),
      updatedAt: user.get('updatedAt'),
      groups: (user.groups || []).map((group: any) => ({
        id: group.get('id'),
        name: group.get('name'),
        description: group.get('description'),
      })),
    }));
  }

  /**
   * Bulk assign users to a group
   */
  async bulkAssignUsersToGroup(userIds: number[], groupId: number): Promise<{ assigned: number; skipped: number }> {
    // Verify group exists
    const group = await Group.findByPk(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify all users exist
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
   * Bulk remove users from a group
   */
  async bulkRemoveUsersFromGroup(userIds: number[], groupId: number): Promise<{ removed: number }> {
    const removedCount = await UserGroup.destroy({
      where: { userId: userIds, groupId },
    });

    return { removed: removedCount };
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withGroups: number;
    withoutGroups: number;
  }> {
    const [total, active, withGroups] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({
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
    ]);

    return {
      total,
      active,
      inactive: total - active,
      withGroups,
      withoutGroups: total - withGroups,
    };
  }
}

export default new UserService();
