"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserGroupsValidation = exports.getUsersInGroupValidation = exports.removeUserFromGroupValidation = exports.assignUsersToGroupValidation = void 0;
const express_validator_1 = require("express-validator");
/**
 * Validation rules for assigning users to a group
 */
exports.assignUsersToGroupValidation = [
    (0, express_validator_1.param)('groupId')
        .isInt()
        .withMessage('Group ID must be an integer'),
    (0, express_validator_1.body)('userIds')
        .isArray()
        .withMessage('userIds must be an array of user IDs')
        .notEmpty()
        .withMessage('userIds cannot be empty'),
    (0, express_validator_1.body)('userIds.*')
        .isInt()
        .withMessage('Each user ID must be an integer')
];
/**
 * Validation rules for removing a user from a group
 */
exports.removeUserFromGroupValidation = [
    (0, express_validator_1.param)('groupId')
        .isInt()
        .withMessage('Group ID must be an integer'),
    (0, express_validator_1.param)('userId')
        .isInt()
        .withMessage('User ID must be an integer')
];
/**
 * Validation rules for getting users in a group
 */
exports.getUsersInGroupValidation = [
    (0, express_validator_1.param)('groupId')
        .isInt()
        .withMessage('Group ID must be an integer')
];
/**
 * Validation rules for getting groups for a user
 */
exports.getUserGroupsValidation = [
    (0, express_validator_1.param)('userId')
        .isInt()
        .withMessage('User ID must be an integer')
];
