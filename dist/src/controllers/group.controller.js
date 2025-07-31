"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const services_1 = require("../services");
const errors_1 = require("../utils/errors");
/**
 * Group Controller - Handles all CRUD operations for groups
 */
class GroupController {
    /**
     * Get all groups with optional filtering
     * @param req Express request
     * @param res Express response
     */
    async getAll(req, res, next) {
        try {
            const { search, limit = 50, offset = 0, isActive, hasUsers, hasRoles, sortBy = 'createdAt', order = 'DESC' } = req.query;
            const filters = {
                search: search,
                limit: Number(limit),
                offset: Number(offset),
                isActive: isActive !== undefined ? isActive === 'true' : undefined,
                hasUsers: hasUsers !== undefined ? hasUsers === 'true' : undefined,
                hasRoles: hasRoles !== undefined ? hasRoles === 'true' : undefined,
                sortBy: sortBy,
                order: order
            };
            const result = await services_1.groupService.getGroups(filters);
            res.status(200).json({
                success: true,
                count: result.total,
                data: result.groups
            });
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to fetch groups'));
        }
    }
    /**
     * Get a single group by ID
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
            const group = await services_1.groupService.getGroupById(Number(id));
            res.status(200).json({
                success: true,
                data: group
            });
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to fetch group'));
        }
    }
    /**
     * Create a new group
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
            const { name, description, isActive } = req.body;
            const group = await services_1.groupService.createGroup({ name, description, isActive });
            // Log the creation event
            await services_1.auditService.logEvent({
                userId: req.user?.id,
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
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to create group'));
        }
    }
    /**
     * Update an existing group
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
            const { name, description, isActive } = req.body;
            const group = await services_1.groupService.updateGroup(Number(id), { name, description, isActive });
            // Log the update event
            await services_1.auditService.logEvent({
                userId: req.user?.id,
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
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to update group'));
        }
    }
    /**
     * Delete a group
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
            const groupId = Number(id);
            await services_1.groupService.deleteGroup(groupId);
            // Log the deletion event
            await services_1.auditService.logEvent({
                userId: req.user?.id,
                action: 'GROUP_DELETED',
                resource: 'groups',
                resourceId: groupId,
            });
            res.status(200).json({
                success: true,
                message: 'Group deleted successfully'
            });
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to delete group'));
        }
    }
    /**
     * Get group statistics
     * @param req Express request
     * @param res Express response
     */
    async getStatistics(req, res, next) {
        try {
            const statistics = await services_1.groupService.getGroupStatistics();
            res.status(200).json({
                success: true,
                data: statistics
            });
        }
        catch (error) {
            next(error instanceof Error ? error : new errors_1.InternalServerError('Failed to fetch group statistics'));
        }
    }
}
exports.default = GroupController;
