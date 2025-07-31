"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionValidation = exports.updatePermissionValidation = exports.createPermissionValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation rules for creating a permission
 */
exports.createPermissionValidation = [
    (0, express_validator_1.body)('name')
        .isString()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Permission name must be between 3 and 50 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Description cannot exceed 255 characters'),
    (0, express_validator_1.body)('action')
        .isString()
        .trim()
        .isIn(['create', 'read', 'update', 'delete'])
        .withMessage('Action must be one of: create, read, update, delete'),
    (0, express_validator_1.body)('moduleId')
        .isInt()
        .withMessage('Module ID must be an integer'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value')
];
/**
 * Validation rules for updating a permission
 */
exports.updatePermissionValidation = [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('Permission ID must be an integer'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Permission name must be between 3 and 50 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Description cannot exceed 255 characters'),
    (0, express_validator_1.body)('action')
        .optional()
        .isString()
        .trim()
        .isIn(['create', 'read', 'update', 'delete'])
        .withMessage('Action must be one of: create, read, update, delete'),
    (0, express_validator_1.body)('moduleId')
        .optional()
        .isInt()
        .withMessage('Module ID must be an integer'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value')
];
/**
 * Validation for getting or deleting a permission by ID
 */
exports.getPermissionValidation = [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('Permission ID must be an integer')
];
