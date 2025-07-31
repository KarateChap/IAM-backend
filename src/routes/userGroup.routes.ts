import { Router } from 'express';
import { 
  assignUsersToGroup,
  removeUsersFromGroup,
  getGroupUsers,
  getUserGroups
} from '../controllers/userGroup.controller';
import { requireAuth, checkPermission } from '../middlewares/auth.middleware';
import { 
  assignUsersToGroupValidation, 
  removeUserFromGroupValidation, 
  getUsersInGroupValidation,
  getUserGroupsValidation
} from '../validators/userGroup.validator';

const router = Router();

/**
 * @route POST /api/groups/:groupId/users
 * @desc Assign users to a group
 * @access Private
 */
router.post(
  '/groups/:groupId/users',
  requireAuth,
  checkPermission('Assignments', 'create'),
  assignUsersToGroupValidation,
  assignUsersToGroup
);

/**
 * @route DELETE /api/groups/:groupId/users/:userId
 * @desc Remove a user from a group
 * @access Private
 */
router.delete(
  '/groups/:groupId/users/:userId',
  requireAuth,
  checkPermission('Assignments', 'delete'),
  removeUserFromGroupValidation,
  removeUsersFromGroup
);

/**
 * @route GET /api/groups/:groupId/users
 * @desc Get all users in a group
 * @access Private
 */
router.get(
  '/groups/:groupId/users',
  requireAuth,
  checkPermission('Assignments', 'read'),
  getUsersInGroupValidation,
  getGroupUsers
);

/**
 * @route GET /api/users/:userId/groups
 * @desc Get all groups a user belongs to
 * @access Private
 */
router.get(
  '/users/:userId/groups',
  requireAuth,
  checkPermission('Assignments', 'read'),
  getUserGroupsValidation,
  getUserGroups
);

export default router;
