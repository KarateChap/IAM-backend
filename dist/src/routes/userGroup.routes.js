"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userGroup_controller_1 = require("../controllers/userGroup.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const userGroup_validator_1 = require("../validators/userGroup.validator");
const router = (0, express_1.Router)();
/**
 * @route POST /api/groups/:groupId/users
 * @desc Assign users to a group
 * @access Private
 */
router.post('/groups/:groupId/users', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Assignments', 'create'), userGroup_validator_1.assignUsersToGroupValidation, userGroup_controller_1.assignUsersToGroup);
/**
 * @route DELETE /api/groups/:groupId/users/:userId
 * @desc Remove a user from a group
 * @access Private
 */
router.delete('/groups/:groupId/users/:userId', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Assignments', 'delete'), userGroup_validator_1.removeUserFromGroupValidation, userGroup_controller_1.removeUsersFromGroup);
/**
 * @route GET /api/groups/:groupId/users
 * @desc Get all users in a group
 * @access Private
 */
router.get('/groups/:groupId/users', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Assignments', 'read'), userGroup_validator_1.getUsersInGroupValidation, userGroup_controller_1.getGroupUsers);
/**
 * @route GET /api/users/:userId/groups
 * @desc Get all groups a user belongs to
 * @access Private
 */
router.get('/users/:userId/groups', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Assignments', 'read'), userGroup_validator_1.getUserGroupsValidation, userGroup_controller_1.getUserGroups);
exports.default = router;
