import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { roleService, auditService } from '../services';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
} from '../utils/errors';

/**
 * Role Controller - Handles all CRUD operations for roles
 */
export default class RoleController {
  /**
   * Get all roles with optional filtering
   * @param req Express request
   * @param res Express response
   */
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, limit = 10, offset = 0, sortBy = 'createdAt', order = 'DESC' } = req.query;

      const result = await roleService.getRoles({
        search: search as string,
        limit: Number(limit),
        offset: Number(offset),
        sortBy: sortBy as string,
        order: order as 'ASC' | 'DESC'
      });

      res.status(200).json({
        success: true,
        count: result.total,
        data: result.roles,
      });
    } catch (error) {
      next(new InternalServerError('Failed to fetch roles'));
    }
  }

  /**
   * Get a single role by ID
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
      const role = await roleService.getRoleById(Number(id));

      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(new InternalServerError('Failed to fetch role'));
    }
  }

  /**
   * Create a new role
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

      const role = await roleService.createRole(req.body);
      
      // Log the creation
      await auditService.logEvent({
        userId: (req as any).user?.id || 0,
        action: 'create',
        resource: 'Role',
        resourceId: role.id,
        details: { message: `Created role: ${role.name}` }
      });

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role,
      });
    } catch (error) {
      next(new InternalServerError('Failed to create role'));
    }
  }

  /**
   * Update an existing role
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
      const role = await roleService.updateRole(Number(id), req.body);
      
      // Log the update
      await auditService.logEvent({
        userId: (req as any).user?.id || 0,
        action: 'update',
        resource: 'Role',
        resourceId: role.id,
        details: { message: `Updated role: ${role.name}`, changes: req.body }
      });

      res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: role,
      });
    } catch (error) {
      next(new InternalServerError('Failed to update role'));
    }
  }

  /**
   * Delete a role
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
      
      // Get role info before deletion for audit log
      const role = await roleService.getRoleById(Number(id));
      
      await roleService.hardDeleteRole(Number(id));
      
      // Log the deletion
      await auditService.logEvent({
        userId: (req as any).user?.id || 0,
        action: 'delete',
        resource: 'Role',
        resourceId: Number(id),
        details: { message: `Deleted role: ${role.name}` }
      });

      res.status(200).json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      next(new InternalServerError('Failed to delete role'));
    }
  }
}
