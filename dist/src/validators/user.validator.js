"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserValidation = exports.updateUserValidation = exports.createUserValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation rules for creating a user
 */
exports.createUserValidation = [
    (0, express_validator_1.body)('username')
        .isString()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Must be a valid email address'),
    (0, express_validator_1.body)('password')
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('firstName')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value'),
];
/**
 * Validation rules for updating a user
 */
exports.updateUserValidation = [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('User ID must be an integer'),
    (0, express_validator_1.body)('username')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters'),
    (0, express_validator_1.body)('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Must be a valid email address'),
    (0, express_validator_1.body)('password')
        .optional()
        .isString()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('firstName')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name must be between 1 and 50 characters'),
    (0, express_validator_1.body)('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value'),
];
/**
 * Validation for getting or deleting a user by ID
 */
exports.getUserValidation = [
    (0, express_validator_1.param)('id')
        .isInt()
        .withMessage('User ID must be an integer'),
];
