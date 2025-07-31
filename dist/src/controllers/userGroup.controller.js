"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserGroups = exports.getGroupUsers = exports.removeUsersFromGroup = exports.assignUsersToGroup = void 0;
const express_validator_1 = require("express-validator");
const userGroup_service_1 = require("../services/userGroup.service");
const errors_1 = require("../utils/errors");
const audit_service_1 = __importDefault(require("../services/audit.service"));
const userGroupService = new userGroup_service_1.UserGroupService();
/**
 * Assign users to a group
 */
const assignUsersToGroup = async (req, res, next) => {
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
        const { userIds } = req.body;
        // Use service to handle the assignment
        const result = await userGroupService.assignUsersToGroup(groupId, userIds);
        // Log audit event
        await audit_service_1.default.logEvent({
            action: 'ASSIGN_USERS_TO_GROUP',
            userId: req.user?.id,
            resource: 'Group',
            resourceId: groupId,
            details: {
                assigned: result.assigned,
                skipped: result.skipped,
                userDetails: result.details
            }
        });
        res.status(200).json({
            success: true,
            message: 'Users assigned to group successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Error in assignUsersToGroup:', error);
        return next(error);
    }
};
exports.assignUsersToGroup = assignUsersToGroup;
/**
 * Remove users from a group
 */
const removeUsersFromGroup = async (req, res, next) => {
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
        const { userIds } = req.body;
        // Use service to handle the removal
        const result = await userGroupService.removeUsersFromGroup(groupId, userIds);
        // Log audit event
        await audit_service_1.default.logEvent({
            action: 'REMOVE_USERS_FROM_GROUP',
            userId: req.user?.id,
            resource: 'Group',
            resourceId: groupId,
            details: {
                removed: result.removed,
                notFound: result.notFound,
                userDetails: result.details
            }
        });
        res.status(200).json({
            success: true,
            message: 'Users removed from group successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Error in removeUsersFromGroup:', error);
        return next(error);
    }
};
exports.removeUsersFromGroup = removeUsersFromGroup;
/**
 * Get all users in a group
 */
const getGroupUsers = async (req, res, next) => {
    try {
        const groupId = parseInt(req.params.groupId);
        // Use service to get group users
        const users = await userGroupService.getGroupUsers(groupId);
        res.status(200).json({
            success: true,
            message: 'Group users retrieved successfully',
            data: {
                groupId,
                users,
                count: users.length
            }
        });
    }
    catch (error) {
        console.error('Error in getGroupUsers:', error);
        return next(error);
    }
};
exports.getGroupUsers = getGroupUsers;
/**
 * Get all groups that a user belongs to
 */
const getUserGroups = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);
        // Use service to get user groups
        const groups = await userGroupService.getUserGroups(userId);
        res.status(200).json({
            success: true,
            message: 'User groups retrieved successfully',
            data: {
                userId,
                groups,
                count: groups.length
            }
        });
    }
    catch (error) {
        console.error('Error in getUserGroups:', error);
        return next(error);
    }
};
exports.getUserGroups = getUserGroups;
