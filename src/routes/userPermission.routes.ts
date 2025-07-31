import { Router } from 'express';
import UserPermissionController from '../controllers/userPermission.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { simulateActionValidation } from '../validators/userPermission.validator';

const router = Router();
const userPermissionController = new UserPermissionController();

/**
 * @route GET /api/me/permissions
 * @desc Get all permissions for the current user
 * @access Private
 */
router.get(
  '/me/permissions',
  requireAuth,
  userPermissionController.getCurrentUserPermissions.bind(userPermissionController)
);

/**
 * @route POST /api/simulate-action
 * @desc Simulate whether a user can perform an action on a module
 * @access Private
 */
router.post(
  '/simulate-action',
  requireAuth,
  simulateActionValidation,
  userPermissionController.simulateAction.bind(userPermissionController)
);

export default router;
