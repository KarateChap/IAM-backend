"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const services_1 = require("../services");
const errors_1 = require("../utils/errors");
/**
 * User Controller - Handles all CRUD operations for users
 */
class UserController {
    /**
     * Get all users with optional filtering
     * @param req Express request
     * @param res Express response
     */
    async getAll(req, res, next) {
        try {
            const { search, limit = 10, offset = 0, sortBy = 'createdAt', order = 'DESC' } = req.query;
            const result = await services_1.userService.getUsers({
                search: search,
                limit: Number(limit),
                offset: Number(offset),
                sortBy: sortBy,
                order: order
            });
            res.status(200).json({
                success: true,
                count: result.total,
                data: result.users
            });
        }
        catch (error) {
            next(new errors_1.InternalServerError('Failed to fetch users'));
        }
    }
    /**
     * Get a single user by ID
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
            const user = await services_1.userService.getUserById(Number(id));
            res.status(200).json({
                success: true,
                data: user
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create a new user
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
            const user = await services_1.userService.createUser(req.body);
            // Log the creation
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
                action: 'create',
                resource: 'User',
                resourceId: user.id,
                details: { username: user.username, email: user.email, message: `Created user: ${user.username}` }
            });
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: user
            });
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to create user'));
        }
    }
    /**
     * Update an existing user
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
            const user = await services_1.userService.updateUser(Number(id), req.body);
            // Log the update
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
                action: 'update',
                resource: 'User',
                resourceId: user.id,
                details: { message: `Updated user: ${user.username}`, changes: req.body }
            });
            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to update user'));
        }
    }
    /**
     * Delete a user
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
            // Get user info before deletion for audit log
            const user = await services_1.userService.getUserById(Number(id));
            await services_1.userService.deleteUser(Number(id));
            // Log the deletion
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
                action: 'delete',
                resource: 'User',
                resourceId: Number(id),
                details: { message: `Deleted user: ${user.username}` }
            });
            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to delete user'));
        }
    }
}
exports.default = UserController;
