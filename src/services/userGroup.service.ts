import { Op } from 'sequelize';
import { User } from '../models/user.model';
import { Group } from '../models/group.model';
import { UserGroup } from '../models/userGroup.model';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';

export interface UserAssignmentResult {
  assigned: number;
  skipped: number;
  details: Array<{
    userId: number;
    username: string;
    email: string;
    status: 'assigned' | 'already_exists' | 'error';
    message?: string;
  }>;
}

export interface UserRemovalResult {
  removed: number;
  notFound: number;
  details: Array<{
    userId: number;
    username: string;
    email: string;
    status: 'removed' | 'not_found' | 'error';
    message?: string;
  }>;
}

/**
 * UserGroup Service
 * Handles user-group relationship management and business logic
 */
export class UserGroupService {
  /**
   * Assign users to a group
   */
  async assignUsersToGroup(groupId: number, userIds: number[]): Promise<UserAssignmentResult> {
    try {
      // Validate that the group exists
      const group = await Group.findByPk(groupId);
      if (!group) {
        throw new NotFoundError(`Group with ID ${groupId} not found`);
      }

      // Validate that userIds is an array
      if (!Array.isArray(userIds)) {
        throw new BadRequestError('userIds must be an array of user IDs');
      }

      if (userIds.length === 0) {
        throw new BadRequestError('At least one user ID must be provided');
      }

      // Validate that all users exist
      const users = await User.findAll({
        where: {
          id: userIds
        },
        attributes: ['id', 'username', 'email', 'isActive']
      });

      if (users.length !== userIds.length) {
        const foundUserIds = users.map(user => user.get('id'));
        const missingUserIds = userIds.filter(id => !foundUserIds.includes(id));
        throw new NotFoundError(`Users not found: ${missingUserIds.join(', ')}`);
      }

      // Check for inactive users
      const inactiveUsers = users.filter(user => !user.get('isActive'));
      if (inactiveUsers.length > 0) {
        const inactiveUserIds = inactiveUsers.map(user => user.get('id'));
        throw new BadRequestError(`Cannot assign inactive users: ${inactiveUserIds.join(', ')}`);
      }

      // Check for existing assignments
      const existingAssignments = await UserGroup.findAll({
        where: {
          groupId,
          userId: userIds
        }
      });

      const existingUserIds = existingAssignments.map(assignment => assignment.get('userId'));
      const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

      // Create new assignments
      const assignmentPromises = newUserIds.map(userId =>
        UserGroup.create({
          groupId,
          userId
        })
      );

      await Promise.all(assignmentPromises);

      // Prepare detailed result
      const details = users.map(user => {
        const userId = user.get('id') as number;
        const username = user.get('username') as string;
        const email = user.get('email') as string;
        
        if (existingUserIds.includes(userId)) {
          return {
            userId,
            username,
            email,
            status: 'already_exists' as const,
            message: 'User was already assigned to this group'
          };
        } else {
          return {
            userId,
            username,
            email,
            status: 'assigned' as const,
            message: 'User successfully assigned to group'
          };
        }
      });

      return {
        assigned: newUserIds.length,
        skipped: existingUserIds.length,
        details
      };

    } catch (error) {
      console.error('Error in assignUsersToGroup:', error);
      throw error;
    }
  }

  /**
   * Remove users from a group
   */
  async removeUsersFromGroup(groupId: number, userIds: number[]): Promise<UserRemovalResult> {
    try {
      // Validate that the group exists
      const group = await Group.findByPk(groupId);
      if (!group) {
        throw new NotFoundError(`Group with ID ${groupId} not found`);
      }

      // Validate that userIds is an array
      if (!Array.isArray(userIds)) {
        throw new BadRequestError('userIds must be an array of user IDs');
      }

      if (userIds.length === 0) {
        throw new BadRequestError('At least one user ID must be provided');
      }

      // Get user information for response details
      const users = await User.findAll({
        where: {
          id: userIds
        },
        attributes: ['id', 'username', 'email']
      });

      // Find existing assignments
      const existingAssignments = await UserGroup.findAll({
        where: {
          groupId,
          userId: userIds
        }
      });

      const existingUserIds = existingAssignments.map(assignment => assignment.get('userId'));

      // Remove existing assignments
      const removedCount = await UserGroup.destroy({
        where: {
          groupId,
          userId: existingUserIds
        }
      });

      // Prepare detailed result
      const details = userIds.map(userId => {
        const user = users.find(u => u.get('id') === userId);
        const username = user ? user.get('username') as string : `User ${userId}`;
        const email = user ? user.get('email') as string : 'unknown@example.com';
        
        if (existingUserIds.includes(userId)) {
          return {
            userId,
            username,
            email,
            status: 'removed' as const,
            message: 'User successfully removed from group'
          };
        } else {
          return {
            userId,
            username,
            email,
            status: 'not_found' as const,
            message: 'User was not assigned to this group'
          };
        }
      });

      return {
        removed: removedCount,
        notFound: userIds.length - existingUserIds.length,
        details
      };

    } catch (error) {
      console.error('Error in removeUsersFromGroup:', error);
      throw error;
    }
  }

  /**
   * Get all users in a group
   */
  async getGroupUsers(groupId: number): Promise<User[]> {
    try {
      // Validate that the group exists
      const group = await Group.findByPk(groupId, {
        include: [
          {
            model: User,
            as: 'users',
            through: { attributes: [] },
            attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'isActive', 'createdAt']
          }
        ]
      });

      if (!group) {
        throw new NotFoundError(`Group with ID ${groupId} not found`);
      }

      return group.get('users') as User[] || [];

    } catch (error) {
      console.error('Error in getGroupUsers:', error);
      throw error;
    }
  }

  /**
   * Check if a user is in a specific group
   */
  async userInGroup(userId: number, groupId: number): Promise<boolean> {
    try {
      const assignment = await UserGroup.findOne({
        where: {
          userId,
          groupId
        }
      });

      return assignment !== null;

    } catch (error) {
      console.error('Error in userInGroup:', error);
      throw error;
    }
  }

  /**
   * Get all groups that a user belongs to
   */
  async getUserGroups(userId: number): Promise<Group[]> {
    try {
      // Validate that the user exists
      const user = await User.findByPk(userId);
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }

      const groups = await Group.findAll({
        include: [
          {
            model: User,
            as: 'users',
            where: { id: userId },
            through: { attributes: [] },
            attributes: []
          }
        ],
        attributes: ['id', 'name', 'description', 'isActive']
      });

      return groups;

    } catch (error) {
      console.error('Error in getUserGroups:', error);
      throw error;
    }
  }

  /**
   * Replace all users in a group (remove existing and assign new ones)
   */
  async replaceGroupUsers(groupId: number, userIds: number[]): Promise<UserAssignmentResult> {
    try {
      // Validate that the group exists
      const group = await Group.findByPk(groupId);
      if (!group) {
        throw new NotFoundError(`Group with ID ${groupId} not found`);
      }

      // Remove all existing user assignments for this group
      await UserGroup.destroy({
        where: { groupId }
      });

      // Assign new users if provided
      if (userIds.length > 0) {
        return await this.assignUsersToGroup(groupId, userIds);
      } else {
        return {
          assigned: 0,
          skipped: 0,
          details: []
        };
      }

    } catch (error) {
      console.error('Error in replaceGroupUsers:', error);
      throw error;
    }
  }

  /**
   * Get active users in a group
   */
  async getActiveGroupUsers(groupId: number): Promise<User[]> {
    try {
      const group = await Group.findByPk(groupId, {
        include: [
          {
            model: User,
            as: 'users',
            where: { isActive: true },
            through: { attributes: [] },
            attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'isActive', 'createdAt']
          }
        ]
      });

      if (!group) {
        throw new NotFoundError(`Group with ID ${groupId} not found`);
      }

      return group.get('users') as User[] || [];

    } catch (error) {
      console.error('Error in getActiveGroupUsers:', error);
      throw error;
    }
  }

  /**
   * Get user count for a group
   */
  async getGroupUserCount(groupId: number): Promise<{ total: number; active: number; inactive: number }> {
    try {
      const group = await Group.findByPk(groupId);
      if (!group) {
        throw new NotFoundError(`Group with ID ${groupId} not found`);
      }

      const totalUsers = await UserGroup.count({
        where: { groupId }
      });

      const activeUsers = await UserGroup.count({
        where: { groupId },
        include: [
          {
            model: User,
            where: { isActive: true },
            attributes: []
          }
        ]
      });

      return {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      };

    } catch (error) {
      console.error('Error in getGroupUserCount:', error);
      throw error;
    }
  }
}
