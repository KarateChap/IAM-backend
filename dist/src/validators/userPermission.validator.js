"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateActionValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation rules for simulating a user action
 */
exports.simulateActionValidation = [
    (0, express_validator_1.body)('userId')
        .isInt()
        .withMessage('User ID must be an integer'),
    (0, express_validator_1.body)('moduleId')
        .isInt()
        .withMessage('Module ID must be an integer'),
    (0, express_validator_1.body)('action')
        .isString()
        .withMessage('Action must be a string')
        .isIn(['create', 'read', 'update', 'delete'])
        .withMessage('Action must be one of: create, read, update, delete')
];
