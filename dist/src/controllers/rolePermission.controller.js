"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRolePermissions = exports.removePermissionsFromRole = exports.assignPermissionsToRole = void 0;
const express_validator_1 = require("express-validator");
const rolePermission_service_1 = require("../services/rolePermission.service");
const errors_1 = require("../utils/errors");
const audit_service_1 = __importDefault(require("../services/audit.service"));
const rolePermissionService = new rolePermission_service_1.RolePermissionService();
/**
 * Assign permissions to a role
 */
const assignPermissionsToRole = async (req, res, next) => {
    try {
        // Validate input
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().reduce((acc, error) => {
                acc[error.path || error.param] = error.msg;
                return acc;
            }, {});
            return next(new errors_1.ValidationError('Validation failed', formattedErrors));
        }
        const roleId = parseInt(req.params.roleId);
        const { permissionIds } = req.body;
        // Use service to handle the assignment
        const result = await rolePermissionService.assignPermissionsToRole(roleId, permissionIds);
        // Log audit event
        await audit_service_1.default.logEvent({
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
    }
    catch (error) {
        console.error('Error in assignPermissionsToRole:', error);
        return next(error);
    }
};
exports.assignPermissionsToRole = assignPermissionsToRole;
/**
 * Remove permissions from a role
 */
const removePermissionsFromRole = async (req, res, next) => {
    try {
        // Validate input
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            const formattedErrors = errors.array().reduce((acc, error) => {
                acc[error.path || error.param] = error.msg;
                return acc;
            }, {});
            return next(new errors_1.ValidationError('Validation failed', formattedErrors));
        }
        const roleId = parseInt(req.params.roleId);
        const { permissionIds } = req.body;
        // Use service to handle the removal
        const result = await rolePermissionService.removePermissionsFromRole(roleId, permissionIds);
        // Log audit event
        await audit_service_1.default.logEvent({
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
    }
    catch (error) {
        console.error('Error in removePermissionsFromRole:', error);
        return next(error);
    }
};
exports.removePermissionsFromRole = removePermissionsFromRole;
/**
 * Get all permissions assigned to a role
 */
const getRolePermissions = async (req, res, next) => {
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
    }
    catch (error) {
        console.error('Error in getRolePermissions:', error);
        return next(error);
    }
};
exports.getRolePermissions = getRolePermissions;
