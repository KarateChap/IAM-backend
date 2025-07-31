"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const services_1 = require("../services");
const errors_1 = require("../utils/errors");
/**
 * Module Controller - Handles all CRUD operations for modules
 */
class ModuleController {
    /**
     * Get all modules with optional filtering
     * @param req Express request
     * @param res Express response
     * @param next Express next function
     */
    async getAll(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const validationErrors = errors.array().reduce((acc, curr) => {
                    let field = 'unknown';
                    if (typeof curr === 'object' && curr !== null && 'param' in curr) {
                        field = String(curr.param);
                    }
                    acc[field] = curr.msg;
                    return acc;
                }, {});
                throw new errors_1.ValidationError('Validation error', validationErrors);
            }
            const { search, limit = 10, offset = 0, sortBy = 'createdAt', order = 'DESC' } = req.query;
            const result = await services_1.moduleService.getModules({
                search: search,
                limit: Number(limit),
                offset: Number(offset),
                sortBy: sortBy,
                order: order
            });
            res.status(200).json({
                success: true,
                count: result.total,
                data: result.modules
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get a single module by ID
     * @param req Express request
     * @param res Express response
     * @param next Express next function
     */
    async getById(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const validationErrors = errors.array().reduce((acc, curr) => {
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
            const module = await services_1.moduleService.getModuleById(Number(id));
            res.status(200).json({
                success: true,
                data: module
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Create a new module
     * @param req Express request
     * @param res Express response
     * @param next Express next function
     */
    async create(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const validationErrors = errors.array().reduce((acc, curr) => {
                    let field = 'unknown';
                    if (typeof curr === 'object' && curr !== null && 'param' in curr) {
                        field = String(curr.param);
                    }
                    acc[field] = curr.msg;
                    return acc;
                }, {});
                throw new errors_1.ValidationError('Validation error', validationErrors);
            }
            const moduleInstance = await services_1.moduleService.createModule(req.body);
            // Log the creation
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Update an existing module
     * @param req Express request
     * @param res Express response
     * @param next Express next function
     */
    async update(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const validationErrors = errors.array().reduce((acc, curr) => {
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
            const moduleInstance = await services_1.moduleService.updateModule(Number(id), req.body);
            // Log the update
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
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
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Delete a module
     * @param req Express request
     * @param res Express response
     * @param next Express next function
     */
    async delete(req, res, next) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                const validationErrors = errors.array().reduce((acc, curr) => {
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
            // Get module info before deletion for audit log
            const moduleInstance = await services_1.moduleService.getModuleById(Number(id));
            await services_1.moduleService.deleteModule(Number(id));
            // Log the deletion
            await services_1.auditService.logEvent({
                userId: req.user?.id || 0,
                action: 'delete',
                resource: 'Module',
                resourceId: Number(id),
                details: { message: `Deleted module: ${moduleInstance.name}` }
            });
            res.status(200).json({
                success: true,
                message: 'Module deleted successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = ModuleController;
