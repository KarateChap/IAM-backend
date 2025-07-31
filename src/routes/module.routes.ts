import { Router } from 'express';
import ModuleController from '../controllers/module.controller';
import { createModuleValidation, updateModuleValidation, getModuleValidation } from '../validators/module.validator';
import { requireAuth, checkPermission } from '../middlewares/auth.middleware';

const router = Router();
const moduleController = new ModuleController();

/**
 * @route   GET /api/modules
 * @desc    Get all modules with optional filtering
 * @access  Private
 */
router.get('/', requireAuth, checkPermission('Modules', 'read'), moduleController.getAll);

/**
 * @route   GET /api/modules/:id
 * @desc    Get module by ID
 * @access  Private
 */
router.get('/:id', requireAuth, checkPermission('Modules', 'read'), getModuleValidation, moduleController.getById);

/**
 * @route   POST /api/modules
 * @desc    Create a new module
 * @access  Private
 */
router.post('/', requireAuth, checkPermission('Modules', 'create'), createModuleValidation, moduleController.create);

/**
 * @route   PUT /api/modules/:id
 * @desc    Update a module
 * @access  Private
 */
router.put('/:id', requireAuth, checkPermission('Modules', 'update'), updateModuleValidation, moduleController.update);

/**
 * @route   DELETE /api/modules/:id
 * @desc    Delete a module
 * @access  Private
 */
router.delete('/:id', requireAuth, checkPermission('Modules', 'delete'), getModuleValidation, moduleController.delete);

export default router;
