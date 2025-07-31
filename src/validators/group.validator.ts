import { body, param } from 'express-validator';

/**
 * Validation rules for creating a group
 */
export const createGroupValidation = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Group name must be between 3 and 50 characters'),
  
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
 * Validation rules for updating a group
 */
export const updateGroupValidation = [
  param('id')
    .notEmpty()
    .withMessage('Group ID is required'),
  
  body('name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Group name must be between 3 and 50 characters'),
  
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
 * Validation for getting or deleting a group by ID
 */
export const getGroupValidation = [
  param('id')
    .notEmpty()
    .withMessage('Group ID is required')
];
