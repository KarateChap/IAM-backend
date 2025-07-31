import { body, param } from 'express-validator';

/**
 * Validation rules for assigning users to a group
 */
export const assignUsersToGroupValidation = [
  param('groupId')
    .isInt()
    .withMessage('Group ID must be an integer'),
  
  body('userIds')
    .isArray()
    .withMessage('userIds must be an array of user IDs')
    .notEmpty()
    .withMessage('userIds cannot be empty'),
  
  body('userIds.*')
    .isInt()
    .withMessage('Each user ID must be an integer')
];

/**
 * Validation rules for removing a user from a group
 */
export const removeUserFromGroupValidation = [
  param('groupId')
    .isInt()
    .withMessage('Group ID must be an integer'),
  
  param('userId')
    .isInt()
    .withMessage('User ID must be an integer')
];

/**
 * Validation rules for getting users in a group
 */
export const getUsersInGroupValidation = [
  param('groupId')
    .isInt()
    .withMessage('Group ID must be an integer')
];

/**
 * Validation rules for getting groups for a user
 */
export const getUserGroupsValidation = [
  param('userId')
    .isInt()
    .withMessage('User ID must be an integer')
];
