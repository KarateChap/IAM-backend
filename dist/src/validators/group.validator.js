"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupValidation = exports.updateGroupValidation = exports.createGroupValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation rules for creating a group
 */
exports.createGroupValidation = [
    (0, express_validator_1.body)('name')
        .isString()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Group name must be between 3 and 50 characters'),
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
 * Validation rules for updating a group
 */
exports.updateGroupValidation = [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('Group ID must be an integer'),
    (0, express_validator_1.body)('name')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Group name must be between 3 and 50 characters'),
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
 * Validation for getting or deleting a group by ID
 */
exports.getGroupValidation = [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('Group ID must be an integer')
];
