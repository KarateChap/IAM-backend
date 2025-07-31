"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupRoles = exports.removeRolesFromGroup = exports.assignRolesToGroup = void 0;
const express_validator_1 = require("express-validator");
const groupRole_service_1 = require("../services/groupRole.service");
const errors_1 = require("../utils/errors");
const audit_service_1 = __importDefault(require("../services/audit.service"));
const groupRoleService = new groupRole_service_1.GroupRoleService();
/**
 * Assign roles to a group
 */
const assignRolesToGroup = async (req, res, next) => {
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
        const groupId = parseInt(req.params.groupId);
        const { roleIds } = req.body;
        // Use service to handle the assignment
        const result = await groupRoleService.assignRolesToGroup(groupId, roleIds);
        // Log audit event
        await audit_service_1.default.logEvent({
            action: 'ASSIGN_ROLES_TO_GROUP',
            userId: req.user?.id,
            resource: 'Group',
            resourceId: groupId,
            details: {
                assigned: result.assigned,
                skipped: result.skipped,
                roleDetails: result.details
            }
        });
        res.status(200).json({
            success: true,
            message: 'Roles assigned to group successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Error in assignRolesToGroup:', error);
        return next(error);
    }
};
exports.assignRolesToGroup = assignRolesToGroup;
/**
 * Remove roles from a group
 */
const removeRolesFromGroup = async (req, res, next) => {
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
        const groupId = parseInt(req.params.groupId);
        const { roleIds } = req.body;
        // Use service to handle the removal
        const result = await groupRoleService.removeRolesFromGroup(groupId, roleIds);
        // Log audit event
        await audit_service_1.default.logEvent({
            action: 'REMOVE_ROLES_FROM_GROUP',
            userId: req.user?.id,
            resource: 'Group',
            resourceId: groupId,
            details: {
                removed: result.removed,
                notFound: result.notFound,
                roleDetails: result.details
            }
        });
        res.status(200).json({
            success: true,
            message: 'Roles removed from group successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Error in removeRolesFromGroup:', error);
        return next(error);
    }
};
exports.removeRolesFromGroup = removeRolesFromGroup;
/**
 * Get all roles assigned to a group
 */
const getGroupRoles = async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.groupId);
        // Use service to get group roles
        const roles = await groupRoleService.getGroupRoles(groupId);
        res.status(200).json({
            success: true,
            message: 'Group roles retrieved successfully',
            data: {
                groupId,
                roles,
                count: roles.length
            }
        });
    }
    catch (error) {
        console.error('Error in getGroupRoles:', error);
        return next(error);
    }
};
exports.getGroupRoles = getGroupRoles;
