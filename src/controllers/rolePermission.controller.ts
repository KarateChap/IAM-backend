import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { RolePermissionService } from '../services/rolePermission.service';
import { ValidationError, InternalServerError } from '../utils/errors';
import auditService from '../services/audit.service';

const rolePermissionService = new RolePermissionService();

/**
 * Assign permissions to a role
 */
export const assignPermissionsToRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const roleId = parseInt(req.params.roleId);
    const { permissionIds } = req.body;

    // Use service to handle the assignment
    const result = await rolePermissionService.assignPermissionsToRole(roleId, permissionIds);

    // Log audit event
    await auditService.logEvent({
      action: 'ASSIGN_PERMISSIONS_TO_ROLE',
      userId: req.user?.id,
      resource: 'Role',
      resourceId: roleId,
      details: {
        assigned: result.assigned,
        skipped: result.skipped,
        permissionDetails: result.details
      }
    });

    res.status(200).json({
      success: true,
      message: 'Permissions assigned to role successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in assignPermissionsToRole:', error);
    return next(error);
  }
};

/**
 * Remove permissions from a role
 */
export const removePermissionsFromRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const roleId = parseInt(req.params.roleId);
    const { permissionIds } = req.body;

    // Use service to handle the removal
    const result = await rolePermissionService.removePermissionsFromRole(roleId, permissionIds);

    // Log audit event
    await auditService.logEvent({
      action: 'REMOVE_PERMISSIONS_FROM_ROLE',
      userId: req.user?.id,
      resource: 'Role',
      resourceId: roleId,
      details: {
        removed: result.removed,
        notFound: result.notFound,
        permissionDetails: result.details
      }
    });

    res.status(200).json({
      success: true,
      message: 'Permissions removed from role successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in removePermissionsFromRole:', error);
    return next(error);
  }
};

/**
 * Get all permissions assigned to a role
 */
export const getRolePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roleId = parseInt(req.params.roleId);

    // Use service to get role permissions
    const permissions = await rolePermissionService.getRolePermissions(roleId);

    res.status(200).json({
      success: true,
      message: 'Role permissions retrieved successfully',
      data: {
        roleId,
        permissions,
        count: permissions.length
      }
    });

  } catch (error) {
    console.error('Error in getRolePermissions:', error);
    return next(error);
  }
};
