"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groupRole_controller_1 = require("../controllers/groupRole.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const groupRole_validator_1 = require("../validators/groupRole.validator");
const router = (0, express_1.Router)();
/**
 * @route POST /api/groups/:groupId/roles
 * @desc Assign roles to a group
 * @access Private
 */
router.post('/groups/:groupId/roles', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Assignments', 'create'), groupRole_validator_1.assignRolesToGroupValidation, groupRole_controller_1.assignRolesToGroup);
/**
 * @route DELETE /api/groups/:groupId/roles/:roleId
 * @desc Remove a role from a group
 * @access Private
 */
router.delete('/groups/:groupId/roles/:roleId', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Assignments', 'delete'), groupRole_validator_1.removeRoleFromGroupValidation, groupRole_controller_1.removeRolesFromGroup);
/**
 * @route GET /api/groups/:groupId/roles
 * @desc Get all roles in a group
 * @access Private
 */
router.get('/groups/:groupId/roles', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Assignments', 'read'), groupRole_validator_1.getRolesInGroupValidation, groupRole_controller_1.getGroupRoles);
exports.default = router;
