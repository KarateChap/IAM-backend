import { body, param } from 'express-validator';

/**
 * Validation rules for assigning permissions to a role
 */
export const assignPermissionsToRoleValidation = [
  param('roleId')
    .isInt()
    .withMessage('Role ID must be an integer'),
  
  body('permissionIds')
    .isArray()
    .withMessage('permissionIds must be an array of permission IDs')
    .notEmpty()
    .withMessage('permissionIds cannot be empty'),
  
  body('permissionIds.*')
    .isInt()
    .withMessage('Each permission ID must be an integer')
];

/**
 * Validation rules for removing a permission from a role
 */
export const removePermissionFromRoleValidation = [
  param('roleId')
    .isInt()
    .withMessage('Role ID must be an integer'),
  
  param('permissionId')
    .isInt()
    .withMessage('Permission ID must be an integer')
];

/**
 * Validation rules for getting permissions for a role
 */
export const getRolePermissionsValidation = [
  param('roleId')
    .isInt()
    .withMessage('Role ID must be an integer')
];

/**
 * Validation rules for getting roles for a permission
 */
export const getPermissionRolesValidation = [
  param('permissionId')
    .isInt()
    .withMessage('Permission ID must be an integer')
];
