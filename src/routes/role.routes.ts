import { Router } from 'express';
import RoleController from '../controllers/role.controller';
import { createRoleValidation, updateRoleValidation, getRoleValidation } from '../validators/role.validator';
import { requireAuth, checkPermission } from '../middlewares/auth.middleware';

const router = Router();
const roleController = new RoleController();

/**
 * @route   GET /api/roles
 * @desc    Get all roles with optional filtering
 * @access  Private
 */
router.get('/', requireAuth, checkPermission('Roles', 'read'), roleController.getAll);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Private
 */
router.get('/:id', requireAuth, checkPermission('Roles', 'read'), getRoleValidation, roleController.getById);

/**
 * @route   POST /api/roles
 * @desc    Create a new role
 * @access  Private
 */
router.post('/', requireAuth, checkPermission('Roles', 'create'), createRoleValidation, roleController.create);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update a role
 * @access  Private
 */
router.put('/:id', requireAuth, checkPermission('Roles', 'update'), updateRoleValidation, roleController.update);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete a role
 * @access  Private
 */
router.delete('/:id', requireAuth, checkPermission('Roles', 'delete'), getRoleValidation, roleController.delete);

export default router;
