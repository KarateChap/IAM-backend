"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleValidation = exports.updateRoleValidation = exports.createRoleValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation rules for creating a role
 */
exports.createRoleValidation = [
    (0, express_validator_1.body)('name')
        .isString()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Role name must be between 3 and 50 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Description cannot exceed 255 characters'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value')
];
/**
 * Validation rules for updating a role
 */
exports.updateRoleValidation = [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('Role ID must be an integer'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Role name must be between 3 and 50 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Description cannot exceed 255 characters'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value')
];
/**
 * Validation for getting or deleting a role by ID
 */
exports.getRoleValidation = [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('Role ID must be an integer')
];
