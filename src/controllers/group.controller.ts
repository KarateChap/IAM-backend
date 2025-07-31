import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { groupService, auditService } from '../services';
import { ValidationError, InternalServerError } from '../utils/errors';

/**
 * Group Controller - Handles all CRUD operations for groups
 */
export default class GroupController {
  /**
   * Get all groups with optional filtering
   * @param req Express request
   * @param res Express response
   */
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, limit = 50, offset = 0, isActive, hasUsers, hasRoles, sortBy = 'createdAt', order = 'DESC' } = req.query;
      
      const filters = {
        search: search as string,
        limit: Number(limit),
        offset: Number(offset),
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        hasUsers: hasUsers !== undefined ? hasUsers === 'true' : undefined,
        hasRoles: hasRoles !== undefined ? hasRoles === 'true' : undefined,
        sortBy: sortBy as string,
        order: order as 'ASC' | 'DESC'
      };

      const result = await groupService.getGroups(filters);

      res.status(200).json({
        success: true,
        count: result.total,
        data: result.groups
      });
    } catch (error) {
      next(error instanceof Error ? error : new InternalServerError('Failed to fetch groups'));
    }
  }

  /**
   * Get a single group by ID
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
      const group = await groupService.getGroupById(Number(id));

      res.status(200).json({
        success: true,
        data: group
      });
    } catch (error) {
      next(error instanceof Error ? error : new InternalServerError('Failed to fetch group'));
    }
  }

  /**
   * Create a new group
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

      const { name, description, isActive } = req.body;
      const group = await groupService.createGroup({ name, description, isActive });
      
      // Log the creation event
      await auditService.logEvent({
        userId: (req as any).user?.id,
        action: 'GROUP_CREATED',
        resource: 'groups',
        resourceId: group.id,
        details: { name, description },
      });
      
      res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: group
      });
    } catch (error) {
      next(error instanceof Error ? error : new InternalServerError('Failed to create group'));
    }
  }

  /**
   * Update an existing group
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
      const { name, description, isActive } = req.body;
      
      const group = await groupService.updateGroup(Number(id), { name, description, isActive });
      
      // Log the update event
      await auditService.logEvent({
        userId: (req as any).user?.id,
        action: 'GROUP_UPDATED',
        resource: 'groups',
        resourceId: group.id,
        details: { name, description, isActive },
      });
      
      res.status(200).json({
        success: true,
        message: 'Group updated successfully',
        data: group
      });
    } catch (error) {
      next(error instanceof Error ? error : new InternalServerError('Failed to update group'));
    }
  }

  /**
   * Delete a group
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
      const groupId = Number(id);
      
      await groupService.hardDeleteGroup(groupId);
      
      // Log the deletion event
      await auditService.logEvent({
        userId: (req as any).user?.id,
        action: 'GROUP_DELETED',
        resource: 'groups',
        resourceId: groupId,
      });

      res.status(200).json({
        success: true,
        message: 'Group deleted successfully'
      });
    } catch (error) {
      next(error instanceof Error ? error : new InternalServerError('Failed to delete group'));
    }
  }

  /**
   * Get group statistics
   * @param req Express request
   * @param res Express response
   */
  public async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const statistics = await groupService.getGroupStatistics();

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error instanceof Error ? error : new InternalServerError('Failed to fetch group statistics'));
    }
  }
}
