import { body, param } from 'express-validator';

/**
 * Validation rules for creating a module
 */
export const createModuleValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Module name must be between 3 and 50 characters'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters'),
  
  body('basePath')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Base path cannot exceed 255 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

/**
 * Validation rules for updating a module
 */
export const updateModuleValidation = [
  param('id')
    .isInt()
    .withMessage('Module ID must be an integer'),
  
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Module name must be between 3 and 50 characters'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description cannot exceed 255 characters'),
  
  body('basePath')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Base path cannot exceed 255 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

/**
 * Validation for getting or deleting a module by ID
 */
export const getModuleValidation = [
  param('id')
    .isInt()
    .withMessage('Module ID must be an integer')
];
