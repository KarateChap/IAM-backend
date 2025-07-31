import { body, param } from 'express-validator';

/**
 * Validation rules for creating a role
 */
export const createRoleValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Role name must be between 3 and 50 characters'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

/**
 * Validation rules for updating a role
 */
export const updateRoleValidation = [
  param('id')
    .isInt()
    .withMessage('Role ID must be an integer'),
  
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Role name must be between 3 and 50 characters'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

/**
 * Validation for getting or deleting a role by ID
 */
export const getRoleValidation = [
  param('id')
    .isInt()
    .withMessage('Role ID must be an integer')
];
