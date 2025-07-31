import { body, param } from 'express-validator';

/**
 * Validation rules for assigning roles to a group
 */
export const assignRolesToGroupValidation = [
  param('groupId')
    .isInt()
    .withMessage('Group ID must be an integer'),
  
  body('roleIds')
    .isArray()
    .withMessage('roleIds must be an array of role IDs')
    .notEmpty()
    .withMessage('roleIds cannot be empty'),
  
  body('roleIds.*')
    .isInt()
    .withMessage('Each role ID must be an integer')
];

/**
 * Validation rules for removing a role from a group
 */
export const removeRoleFromGroupValidation = [
  param('groupId')
    .isInt()
    .withMessage('Group ID must be an integer'),
  
  param('roleId')
    .isInt()
    .withMessage('Role ID must be an integer')
];

/**
 * Validation rules for getting roles in a group
 */
export const getRolesInGroupValidation = [
  param('groupId')
    .isInt()
    .withMessage('Group ID must be an integer')
];

/**
 * Validation rules for getting groups for a role
 */
export const getRoleGroupsValidation = [
  param('roleId')
    .isInt()
    .withMessage('Role ID must be an integer')
];
