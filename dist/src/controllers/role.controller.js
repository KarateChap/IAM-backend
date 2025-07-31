"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const services_1 = require("../services");
const errors_1 = require("../utils/errors");
/**
 * Role Controller - Handles all CRUD operations for roles
 */
class RoleController {
    /**
     * Get all roles with optional filtering
     * @param req Express request
     * @param res Express response
     */
    async getAll(req, res, next) {
        try {
            const { search, limit = 10, offset = 0, sortBy = 'createdAt', order = 'DESC' } = req.query;
            const result = await services_1.roleService.getRoles({
                search: search,
                limit: Number(limit),
                offset: Number(offset),
                sortBy: sortBy,
                order: order
            });
            res.status(200).json({
                success: true,
                count: result.total,
                data: result.roles,
            });
        }
        catch (error) {
            next(new errors_1.InternalServerError('Failed to fetch roles'));
        }
    }
    /**
     * Get a single role by ID
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
            const role = await services_1.roleService.getRoleById(Number(id));
            res.status(200).json({
                success: true,
                data: role,
            });
        }
        catch (error) {
            next(new errors_1.InternalServerError('Failed to fetch role'));
        }
    }
    /**
     * Create a new role
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
            const role = await services_1.roleService.createRole(req.body);
            // Log the creation
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
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
        }
        catch (error) {
            next(new errors_1.InternalServerError('Failed to create role'));
        }
    }
    /**
     * Update an existing role
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
            const role = await services_1.roleService.updateRole(Number(id), req.body);
            // Log the update
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
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
        }
        catch (error) {
            next(new errors_1.InternalServerError('Failed to update role'));
        }
    }
    /**
     * Delete a role
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
            // Get role info before deletion for audit log
            const role = await services_1.roleService.getRoleById(Number(id));
            await services_1.roleService.deleteRole(Number(id));
            // Log the deletion
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
                action: 'delete',
                resource: 'Role',
                resourceId: Number(id),
                details: { message: `Deleted role: ${role.name}` }
            });
            res.status(200).json({
                success: true,
                message: 'Role deleted successfully',
            });
        }
        catch (error) {
            next(new errors_1.InternalServerError('Failed to delete role'));
        }
    }
}
exports.default = RoleController;
