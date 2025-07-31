import { Router } from 'express';
import { 
  assignPermissionsToRole,
  removePermissionsFromRole,
  getRolePermissions
} from '../controllers/rolePermission.controller';
import { requireAuth, checkPermission } from '../middlewares/auth.middleware';
import { 
  assignPermissionsToRoleValidation, 
  removePermissionFromRoleValidation, 
  getRolePermissionsValidation,
  getPermissionRolesValidation
} from '../validators/rolePermission.validator';

const router = Router();

/**
 * @route POST /api/roles/:roleId/permissions
 * @desc Assign permissions to a role
 * @access Private
 */
router.post(
  '/roles/:roleId/permissions',
  requireAuth,
  checkPermission('Assignments', 'create'),
  assignPermissionsToRoleValidation,
  assignPermissionsToRole
);

/**
 * @route DELETE /api/roles/:roleId/permissions/:permissionId
 * @desc Remove a permission from a role
 * @access Private
 */
router.delete(
  '/roles/:roleId/permissions/:permissionId',
  requireAuth,
  checkPermission('Assignments', 'delete'),
  removePermissionFromRoleValidation,
  removePermissionsFromRole
);

/**
 * @route GET /api/roles/:roleId/permissions
 * @desc Get all permissions for a role
 * @access Private
 */
router.get(
  '/roles/:roleId/permissions',
  requireAuth,
  checkPermission('Assignments', 'read'),
  getRolePermissionsValidation,
  getRolePermissions
);

export default router;
