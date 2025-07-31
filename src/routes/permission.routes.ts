import { Router } from 'express';
import PermissionController from '../controllers/permission.controller';
import { createPermissionValidation, updatePermissionValidation, getPermissionValidation } from '../validators/permission.validator';
import { requireAuth, checkPermission } from '../middlewares/auth.middleware';

const router = Router();
const permissionController = new PermissionController();

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions with optional filtering
 * @access  Private
 */
router.get('/', requireAuth, checkPermission('Permissions', 'read'), permissionController.getAll);

/**
 * @route   GET /api/permissions/:id
 * @desc    Get permission by ID
 * @access  Private
 */
router.get('/:id', requireAuth, checkPermission('Permissions', 'read'), getPermissionValidation, permissionController.getById);

/**
 * @route   POST /api/permissions
 * @desc    Create a new permission
 * @access  Private
 */
router.post('/', requireAuth, checkPermission('Permissions', 'create'), createPermissionValidation, permissionController.create);

/**
 * @route   PUT /api/permissions/:id
 * @desc    Update a permission
 * @access  Private
 */
router.put('/:id', requireAuth, checkPermission('Permissions', 'update'), updatePermissionValidation, permissionController.update);

/**
 * @route   DELETE /api/permissions/:id
 * @desc    Delete a permission
 * @access  Private
 */
router.delete('/:id', requireAuth, checkPermission('Permissions', 'delete'), getPermissionValidation, permissionController.delete);

export default router;
