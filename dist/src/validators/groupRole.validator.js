"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleGroupsValidation = exports.getRolesInGroupValidation = exports.removeRoleFromGroupValidation = exports.assignRolesToGroupValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation rules for assigning roles to a group
 */
exports.assignRolesToGroupValidation = [
    (0, express_validator_1.param)('groupId')
        .isInt()
        .withMessage('Group ID must be an integer'),
    (0, express_validator_1.body)('roleIds')
        .isArray()
        .withMessage('roleIds must be an array of role IDs')
        .notEmpty()
        .withMessage('roleIds cannot be empty'),
    (0, express_validator_1.body)('roleIds.*')
        .isInt()
        .withMessage('Each role ID must be an integer')
];
/**
 * Validation rules for removing a role from a group
 */
exports.removeRoleFromGroupValidation = [
    (0, express_validator_1.param)('groupId')
        .isInt()
        .withMessage('Group ID must be an integer'),
    (0, express_validator_1.param)('roleId')
        .isInt()
        .withMessage('Role ID must be an integer')
];
/**
 * Validation rules for getting roles in a group
 */
exports.getRolesInGroupValidation = [
    (0, express_validator_1.param)('groupId')
        .isInt()
        .withMessage('Group ID must be an integer')
];
/**
 * Validation rules for getting groups for a role
 */
exports.getRoleGroupsValidation = [
    (0, express_validator_1.param)('roleId')
        .isInt()
        .withMessage('Role ID must be an integer')
];
