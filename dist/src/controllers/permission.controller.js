"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const services_1 = require("../services");
const errors_1 = require("../utils/errors");
/**
 * Permission Controller - Handles all CRUD operations for permissions
 */
class PermissionController {
    /**
     * Get all permissions with optional filtering
     * @param req Express request
     * @param res Express response
     */
    async getAll(req, res, next) {
        try {
            const { search, moduleId, action, limit = 10, offset = 0, sortBy = 'createdAt', order = 'DESC', } = req.query;
            const result = await services_1.permissionService.getPermissions({
                search: search,
                moduleId: moduleId ? Number(moduleId) : undefined,
                action: action,
                limit: Number(limit),
                offset: Number(offset),
                sortBy: sortBy,
                order: order
            });
            res.status(200).json({
                success: true,
                count: result.total,
                data: result.permissions,
            });
        }
        catch (error) {
            next(new errors_1.InternalServerError('Failed to fetch permissions'));
        }
    }
    /**
     * Get a single permission by ID
     * @param req Express request
     * @param res Express response
     */
    async getById(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                // Format validation errors
                const validationErrors = errors.array().reduce((acc, curr) => {
                    // Handle different validation error types safely
                    let field = 'unknown';
                    if (typeof curr === 'object' && curr !== null && 'param' in curr) {
                        field = String(curr.param);
                    }
                    acc[field] = curr.msg;
                    return acc;
                }, {});
                throw new errors_1.ValidationError('Validation error', validationErrors);
            }
            const { id } = req.params;
            const permission = await services_1.permissionService.getPermissionById(Number(id));
            res.status(200).json({
                success: true,
                data: permission,
            });
        }
        catch (error) {
            next(new errors_1.InternalServerError('Failed to fetch permission'));
        }
    }
    /**
     * Create a new permission
     * @param req Express request
     * @param res Express response
     */
    async create(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                // Format validation errors
                const validationErrors = errors.array().reduce((acc, curr) => {
                    // Handle different validation error types safely
                    let field = 'unknown';
                    if (typeof curr === 'object' && curr !== null && 'param' in curr) {
                        field = String(curr.param);
                    }
                    acc[field] = curr.msg;
                    return acc;
                }, {});
                throw new errors_1.ValidationError('Validation error', validationErrors);
            }
            const permission = await services_1.permissionService.createPermission(req.body);
            // Log the creation
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update an existing permission
     * @param req Express request
     * @param res Express response
     */
    async update(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                // Format validation errors
                const validationErrors = errors.array().reduce((acc, curr) => {
                    // Handle different validation error types safely
                    let field = 'unknown';
                    if (typeof curr === 'object' && curr !== null && 'param' in curr) {
                        field = String(curr.param);
                    }
                    acc[field] = curr.msg;
                    return acc;
                }, {});
                throw new errors_1.ValidationError('Validation error', validationErrors);
            }
            const { id } = req.params;
            const permission = await services_1.permissionService.updatePermission(Number(id), req.body);
            // Log the update
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
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
        }
        catch (error) {
            next(new errors_1.InternalServerError('Failed to update permission'));
        }
    }
    /**
     * Delete a permission
     * @param req Express request
     * @param res Express response
     */
    async delete(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                // Format validation errors
                const validationErrors = errors.array().reduce((acc, curr) => {
                    // Handle different validation error types safely
                    let field = 'unknown';
                    if (typeof curr === 'object' && curr !== null && 'param' in curr) {
                        field = String(curr.param);
                    }
                    acc[field] = curr.msg;
                    return acc;
                }, {});
                throw new errors_1.ValidationError('Validation error', validationErrors);
            }
            const { id } = req.params;
            // Get permission info before deletion for audit log
            const permission = await services_1.permissionService.getPermissionById(Number(id));
            await services_1.permissionService.deletePermission(Number(id));
            // Log the deletion
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
                action: 'delete',
                resource: 'Permission',
                resourceId: Number(id),
                details: { message: `Deleted permission: ${permission.name}` }
            });
            res.status(200).json({
                success: true,
                message: 'Permission deleted successfully',
            });
        }
        catch (error) {
            next(new errors_1.InternalServerError('Failed to delete permission'));
        }
    }
}
exports.default = PermissionController;
