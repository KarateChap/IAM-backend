import { body } from 'express-validator';

/**
 * Validation rules for simulating a user action
 */
export const simulateActionValidation = [
  body('userId')
    .isInt()
    .withMessage('User ID must be an integer'),
  
  body('moduleId')
    .isInt()
    .withMessage('Module ID must be an integer'),
  
  body('action')
    .isString()
    .withMessage('Action must be a string')
    .isIn(['create', 'read', 'update', 'delete'])
    .withMessage('Action must be one of: create, read, update, delete')
];
