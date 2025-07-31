import { body, param } from 'express-validator';

/**
 * Validation rules for creating a permission
 */
export const createPermissionValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Permission name must be between 3 and 50 characters'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters'),
  
  body('action')
    .isString()
    .trim()
    .isIn(['create', 'read', 'update', 'delete'])
    .withMessage('Action must be one of: create, read, update, delete'),
  
  body('moduleId')
    .isInt()
    .withMessage('Module ID must be an integer'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

/**
 * Validation rules for updating a permission
 */
export const updatePermissionValidation = [
  param('id')
    .isInt()
    .withMessage('Permission ID must be an integer'),
  
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Permission name must be between 3 and 50 characters'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters'),
  
  body('action')
    .optional()
    .isString()
    .trim()
    .isIn(['create', 'read', 'update', 'delete'])
    .withMessage('Action must be one of: create, read, update, delete'),
  
  body('moduleId')
    .optional()
    .isInt()
    .withMessage('Module ID must be an integer'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

/**
 * Validation for getting or deleting a permission by ID
 */
export const getPermissionValidation = [
  param('id')
    .isInt()
    .withMessage('Permission ID must be an integer')
];
