import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { GroupRoleService } from '../services/groupRole.service';
import { ValidationError, InternalServerError } from '../utils/errors';
import auditService from '../services/audit.service';

const groupRoleService = new GroupRoleService();

/**
 * Assign roles to a group
 */
export const assignRolesToGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const { roleIds } = req.body;

    // Use service to handle the assignment
    const result = await groupRoleService.assignRolesToGroup(groupId, roleIds);

    // Log audit event
    await auditService.logEvent({
      action: 'ASSIGN_ROLES_TO_GROUP',
      userId: req.user?.id,
      resource: 'Group',
      resourceId: groupId,
      details: {
        assigned: result.assigned,
        skipped: result.skipped,
        roleDetails: result.details
      }
    });

    res.status(200).json({
      success: true,
      message: 'Roles assigned to group successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in assignRolesToGroup:', error);
    return next(error);
  }
};

/**
 * Remove roles from a group
 */
export const removeRolesFromGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const roleId = parseInt(req.params.roleId);

    // Use service to handle the removal
    const result = await groupRoleService.removeRolesFromGroup(groupId, [roleId]);

    // Log audit event
    await auditService.logEvent({
      action: 'REMOVE_ROLES_FROM_GROUP',
      userId: req.user?.id,
      resource: 'Group',
      resourceId: groupId,
      details: {
        removed: result.removed,
        notFound: result.notFound,
        roleDetails: result.details
      }
    });

    res.status(200).json({
      success: true,
      message: 'Roles removed from group successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in removeRolesFromGroup:', error);
    return next(error);
  }
};

/**
 * Get all roles assigned to a group
 */
export const getGroupRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const groupId = parseInt(req.params.groupId);

    // Use service to get group roles
    const roles = await groupRoleService.getGroupRoles(groupId);

    res.status(200).json({
      success: true,
      message: 'Group roles retrieved successfully',
      data: {
        groupId,
        roles,
        count: roles.length
      }
    });

  } catch (error) {
    console.error('Error in getGroupRoles:', error);
    return next(error);
  }
};
