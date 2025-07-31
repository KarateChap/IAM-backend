"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionRolesValidation = exports.getRolePermissionsValidation = exports.removePermissionFromRoleValidation = exports.assignPermissionsToRoleValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation rules for assigning permissions to a role
 */
exports.assignPermissionsToRoleValidation = [
    (0, express_validator_1.param)('roleId')
        .isInt()
        .withMessage('Role ID must be an integer'),
    (0, express_validator_1.body)('permissionIds')
        .isArray()
        .withMessage('permissionIds must be an array of permission IDs')
        .notEmpty()
        .withMessage('permissionIds cannot be empty'),
    (0, express_validator_1.body)('permissionIds.*')
        .isInt()
        .withMessage('Each permission ID must be an integer')
];
/**
 * Validation rules for removing a permission from a role
 */
exports.removePermissionFromRoleValidation = [
    (0, express_validator_1.param)('roleId')
        .isInt()
        .withMessage('Role ID must be an integer'),
    (0, express_validator_1.param)('permissionId')
        .isInt()
        .withMessage('Permission ID must be an integer')
];
/**
 * Validation rules for getting permissions for a role
 */
exports.getRolePermissionsValidation = [
    (0, express_validator_1.param)('roleId')
        .isInt()
        .withMessage('Role ID must be an integer')
];
/**
 * Validation rules for getting roles for a permission
 */
exports.getPermissionRolesValidation = [
    (0, express_validator_1.param)('permissionId')
        .isInt()
        .withMessage('Permission ID must be an integer')
];
