import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { moduleService, auditService } from '../services';
import { NotFoundError, BadRequestError, ConflictError, ValidationError, InternalServerError } from '../utils/errors';

/**
 * Module Controller - Handles all CRUD operations for modules
 */
export default class ModuleController {
  /**
   * Get all modules with optional filtering
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().reduce((acc, curr) => {
          let field: string = 'unknown';
          if (typeof curr === 'object' && curr !== null && 'param' in curr) {
            field = String(curr.param);
          }
          acc[field] = curr.msg;
          return acc;
        }, {} as Record<string, string>);
        
        throw new ValidationError('Validation error', validationErrors);
      }
      
      const { search, limit = 10, offset = 0, sortBy = 'createdAt', order = 'DESC' } = req.query;
      
      const result = await moduleService.getModules({
        search: search as string,
        limit: Number(limit),
        offset: Number(offset),
        sortBy: sortBy as string,
        order: order as 'ASC' | 'DESC'
      });

      res.status(200).json({
        success: true,
        count: result.total,
        data: result.modules
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single module by ID
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().reduce((acc, curr) => {
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
      const module = await moduleService.getModuleById(Number(id));

      res.status(200).json({
        success: true,
        data: module
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new module
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().reduce((acc, curr) => {
          let field: string = 'unknown';
          if (typeof curr === 'object' && curr !== null && 'param' in curr) {
            field = String(curr.param);
          }
          acc[field] = curr.msg;
          return acc;
        }, {} as Record<string, string>);
        
        throw new ValidationError('Validation error', validationErrors);
      }

      const moduleInstance = await moduleService.createModule(req.body);
      
      // Log the creation
      await auditService.logEvent({
        userId: (req as any).user?.id || 0,
        action: 'create',
        resource: 'Module',
        resourceId: moduleInstance.id,
        details: { message: `Created module: ${moduleInstance.name}` }
      });
      
      res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: moduleInstance
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing module
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().reduce((acc, curr) => {
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
      
      const moduleInstance = await moduleService.updateModule(Number(id), req.body);
      
      // Log the update
      await auditService.logEvent({
        userId: (req as any).user?.id || 0,
        action: 'update',
        resource: 'Module',
        resourceId: Number(id),
        details: { message: `Updated module: ${moduleInstance.name}` }
      });
      
      res.status(200).json({
        success: true,
        message: 'Module updated successfully',
        data: moduleInstance
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a module
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const validationErrors = errors.array().reduce((acc, curr) => {
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
      
      // Get module info before deletion for audit log
      const moduleInstance = await moduleService.getModuleById(Number(id));
      
      await moduleService.hardDeleteModule(Number(id));
      
      // Log the deletion
      await auditService.logEvent({
        userId: (req as any).user?.id || 0,
        action: 'delete',
        resource: 'Module',
        resourceId: Number(id),
        details: { message: `Deleted module: ${moduleInstance.name}` }
      });

      res.status(200).json({
        success: true,
        message: 'Module deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
