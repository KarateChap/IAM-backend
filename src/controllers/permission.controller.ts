import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { permissionService, auditService } from '../services';
import { NotFoundError, ConflictError, ValidationError, InternalServerError } from '../utils/errors';

/**
 * Permission Controller - Handles all CRUD operations for permissions
 */
export default class PermissionController {
  /**
   * Get all permissions with optional filtering
   * @param req Express request
   * @param res Express response
   */
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        search,
        moduleId,
        action,
        limit = 10,
        offset = 0,
        sortBy = 'createdAt',
        order = 'DESC',
      } = req.query;

      const result = await permissionService.getPermissions({
        search: search as string,
        moduleId: moduleId ? Number(moduleId) : undefined,
        action: action as string,
        limit: Number(limit),
        offset: Number(offset),
        sortBy: sortBy as string,
        order: order as 'ASC' | 'DESC'
      });

      res.status(200).json({
        success: true,
        count: result.total,
        data: result.permissions,
      });
    } catch (error) {
      next(new InternalServerError('Failed to fetch permissions'));
    }
  }

  /**
   * Get a single permission by ID
   * @param req Express request
   * @param res Express response
   */
  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Format validation errors
        const validationErrors = errors.array().reduce((acc, curr) => {
          // Handle different validation error types safely
          let field: string = 'unknown';
          if (typeof curr === 'object' && curr !== null && 'param' in curr) {
            field = String(curr.param);
          }
          acc[field] = curr.msg;
          return acc;
        }, {} as Record<string, string>);
        
        throw new ValidationError('Validation error', validationErrors);
      }

      const { id } = req.params;
      const permission = await permissionService.getPermissionById(Number(id));

      res.status(200).json({
        success: true,
        data: permission,
      });
    } catch (error) {
      next(new InternalServerError('Failed to fetch permission'));
    }
  }

  /**
   * Create a new permission
   * @param req Express request
   * @param res Express response
   */
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Format validation errors
        const validationErrors = errors.array().reduce((acc, curr) => {
          // Handle different validation error types safely
          let field: string = 'unknown';
          if (typeof curr === 'object' && curr !== null && 'param' in curr) {
            field = String(curr.param);
          }
          acc[field] = curr.msg;
          return acc;
        }, {} as Record<string, string>);
        
        throw new ValidationError('Validation error', validationErrors);
      }

      const permission = await permissionService.createPermission(req.body);
      
      // Log the creation
      await auditService.logEvent({
        userId: (req as any).user?.id || 0,
        action: 'create',
        resource: 'Permission',
        resourceId: permission.id,
        details: { message: `Created permission: ${permission.name}` }
      });

      res.status(201).json({
        success: true,
        message: 'Permission created successfully',
        data: permission,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing permission
   * @param req Express request
   * @param res Express response
   */
  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Format validation errors
        const validationErrors = errors.array().reduce((acc, curr) => {
          // Handle different validation error types safely
          let field: string = 'unknown';
          if (typeof curr === 'object' && curr !== null && 'param' in curr) {
            field = String(curr.param);
          }
          acc[field] = curr.msg;
          return acc;
        }, {} as Record<string, string>);
        
        throw new ValidationError('Validation error', validationErrors);
      }

      const { id } = req.params;
      
      const permission = await permissionService.updatePermission(Number(id), req.body);
      
      // Log the update
      await auditService.logEvent({
        userId: (req as any).user?.id || 0,
        action: 'update',
        resource: 'Permission',
        resourceId: Number(id),
        details: { message: `Updated permission: ${permission.name}` }
      });

      res.status(200).json({
        success: true,
        message: 'Permission updated successfully',
        data: permission,
      });
    } catch (error) {
      next(new InternalServerError('Failed to update permission'));
    }
  }

  /**
   * Delete a permission
   * @param req Express request
   * @param res Express response
   */
  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Format validation errors
        const validationErrors = errors.array().reduce((acc, curr) => {
          // Handle different validation error types safely
          let field: string = 'unknown';
          if (typeof curr === 'object' && curr !== null && 'param' in curr) {
            field = String(curr.param);
          }
          acc[field] = curr.msg;
          return acc;
        }, {} as Record<string, string>);
        
        throw new ValidationError('Validation error', validationErrors);
      }

      const { id } = req.params;
      
      // Get permission info before deletion for audit log
      const permission = await permissionService.getPermissionById(Number(id));
      
      await permissionService.deletePermission(Number(id));
      
      // Log the deletion
      await auditService.logEvent({
        userId: (req as any).user?.id || 0,
        action: 'delete',
        resource: 'Permission',
        resourceId: Number(id),
        details: { message: `Deleted permission: ${permission.name}` }
      });

      res.status(200).json({
        success: true,
        message: 'Permission deleted successfully',
      });
    } catch (error) {
      next(new InternalServerError('Failed to delete permission'));
    }
  }
}
