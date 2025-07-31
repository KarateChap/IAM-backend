import { Router } from 'express';
import { 
  assignRolesToGroup,
  removeRolesFromGroup,
  getGroupRoles
} from '../controllers/groupRole.controller';
import { requireAuth, checkPermission } from '../middlewares/auth.middleware';
import { 
  assignRolesToGroupValidation, 
  removeRoleFromGroupValidation, 
  getRolesInGroupValidation,
  getRoleGroupsValidation
} from '../validators/groupRole.validator';

const router = Router();

/**
 * @route POST /api/groups/:groupId/roles
 * @desc Assign roles to a group
 * @access Private
 */
router.post(
  '/groups/:groupId/roles',
  requireAuth,
  checkPermission('Assignments', 'create'),
  assignRolesToGroupValidation,
  assignRolesToGroup
);

/**
 * @route DELETE /api/groups/:groupId/roles/:roleId
 * @desc Remove a role from a group
 * @access Private
 */
router.delete(
  '/groups/:groupId/roles/:roleId',
  requireAuth,
  checkPermission('Assignments', 'delete'),
  removeRoleFromGroupValidation,
  removeRolesFromGroup
);

/**
 * @route GET /api/groups/:groupId/roles
 * @desc Get all roles in a group
 * @access Private
 */
router.get(
  '/groups/:groupId/roles',
  requireAuth,
  checkPermission('Assignments', 'read'),
  getRolesInGroupValidation,
  getGroupRoles
);

export default router;
