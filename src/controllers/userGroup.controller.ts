import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { UserGroupService } from '../services/userGroup.service';
import { ValidationError, InternalServerError } from '../utils/errors';
import auditService from '../services/audit.service';

const userGroupService = new UserGroupService();

/**
 * Assign users to a group
 */
export const assignUsersToGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().reduce((acc, error: any) => {
        acc[error.path || error.param] = error.msg;
        return acc;
      }, {} as Record<string, string>);
      return next(new ValidationError('Validation failed', formattedErrors));
    }

    const groupId = parseInt(req.params.groupId);
    const { userIds } = req.body;

    // Use service to handle the assignment
    const result = await userGroupService.assignUsersToGroup(groupId, userIds);

    // Log audit event
    await auditService.logEvent({
      action: 'ASSIGN_USERS_TO_GROUP',
      userId: req.user?.id,
      resource: 'Group',
      resourceId: groupId,
      details: {
        assigned: result.assigned,
        skipped: result.skipped,
        userDetails: result.details
      }
    });

    res.status(200).json({
      success: true,
      message: 'Users assigned to group successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in assignUsersToGroup:', error);
    return next(error);
  }
};

/**
 * Remove users from a group
 */
export const removeUsersFromGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().reduce((acc, error: any) => {
        acc[error.path || error.param] = error.msg;
        return acc;
      }, {} as Record<string, string>);
      return next(new ValidationError('Validation failed', formattedErrors));
    }

    const groupId = parseInt(req.params.groupId);
    const userId = parseInt(req.params.userId);

    // Use service to handle the removal
    const result = await userGroupService.removeUsersFromGroup(groupId, [userId]);

    // Log audit event
    await auditService.logEvent({
      action: 'REMOVE_USERS_FROM_GROUP',
      userId: req.user?.id,
      resource: 'Group',
      resourceId: groupId,
      details: {
        removed: result.removed,
        notFound: result.notFound,
        userDetails: result.details
      }
    });

    res.status(200).json({
      success: true,
      message: 'Users removed from group successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in removeUsersFromGroup:', error);
    return next(error);
  }
};

/**
 * Get all users in a group
 */
export const getGroupUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const groupId = parseInt(req.params.groupId);

    // Use service to get group users
    const users = await userGroupService.getGroupUsers(groupId);

    res.status(200).json({
      success: true,
      message: 'Group users retrieved successfully',
      data: {
        groupId,
        users,
        count: users.length
      }
    });

  } catch (error) {
    console.error('Error in getGroupUsers:', error);
    return next(error);
  }
};

/**
 * Get all groups that a user belongs to
 */
export const getUserGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);

    // Use service to get user groups
    const groups = await userGroupService.getUserGroups(userId);

    res.status(200).json({
      success: true,
      message: 'User groups retrieved successfully',
      data: {
        userId,
        groups,
        count: groups.length
      }
    });

  } catch (error) {
    console.error('Error in getUserGroups:', error);
    return next(error);
  }
};
