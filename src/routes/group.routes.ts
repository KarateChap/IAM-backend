import { Router } from 'express';
import GroupController from '../controllers/group.controller';
import { createGroupValidation, updateGroupValidation, getGroupValidation } from '../validators/group.validator';
import { requireAuth, checkPermission } from '../middlewares/auth.middleware';

const router = Router();
const groupController = new GroupController();

/**
 * @route   GET /api/groups
 * @desc    Get all groups with optional filtering
 * @access  Private (requires read permission on Groups module)
 */
router.get('/', requireAuth, checkPermission('Groups', 'read'), groupController.getAll);

/**
 * @route   GET /api/groups/statistics
 * @desc    Get group statistics
 * @access  Private (requires read permission on Groups module)
 */
router.get('/statistics', requireAuth, checkPermission('Groups', 'read'), groupController.getStatistics);

/**
 * @route   GET /api/groups/:id
 * @desc    Get group by ID
 * @access  Private (requires read permission on Groups module)
 */
router.get('/:id', requireAuth, checkPermission('Groups', 'read'), getGroupValidation, groupController.getById);

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private (requires create permission on Groups module)
 */
router.post('/', requireAuth, checkPermission('Groups', 'create'), createGroupValidation, groupController.create);

/**
 * @route   PUT /api/groups/:id
 * @desc    Update a group
 * @access  Private (requires update permission on Groups module)
 */
router.put('/:id', requireAuth, checkPermission('Groups', 'update'), updateGroupValidation, groupController.update);

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete a group
 * @access  Private (requires delete permission on Groups module)
 */
router.delete('/:id', requireAuth, checkPermission('Groups', 'delete'), getGroupValidation, groupController.delete);

export default router;
