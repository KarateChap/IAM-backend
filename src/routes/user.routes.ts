import { Router } from 'express';
import UserController from '../controllers/user.controller';
import { createUserValidation, updateUserValidation, getUserValidation } from '../validators/user.validator';
import { requireAuth, checkPermission } from '../middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

/**
 * @route   GET /api/users
 * @desc    Get all users with optional filtering
 * @access  Private (requires read permission on Users module)
 */
router.get('/', requireAuth, checkPermission('Users', 'read'), userController.getAll);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (requires read permission on Users module)
 */
router.get('/:id', requireAuth, checkPermission('Users', 'read'), getUserValidation, userController.getById);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private (requires create permission on Users module)
 */
router.post('/', requireAuth, checkPermission('Users', 'create'), createUserValidation, userController.create);

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user
 * @access  Private (requires update permission on Users module)
 */
router.put('/:id', requireAuth, checkPermission('Users', 'update'), updateUserValidation, userController.update);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private (requires delete permission on Users module)
 */
router.delete('/:id', requireAuth, checkPermission('Users', 'delete'), getUserValidation, userController.delete);

export default router;
