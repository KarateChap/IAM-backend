"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rolePermission_controller_1 = require("../controllers/rolePermission.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rolePermission_validator_1 = require("../validators/rolePermission.validator");
const router = (0, express_1.Router)();
/**
 * @route POST /api/roles/:roleId/permissions
 * @desc Assign permissions to a role
 * @access Private
 */
router.post('/roles/:roleId/permissions', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Assignments', 'create'), rolePermission_validator_1.assignPermissionsToRoleValidation, rolePermission_controller_1.assignPermissionsToRole);
/**
 * @route DELETE /api/roles/:roleId/permissions/:permissionId
 * @desc Remove a permission from a role
 * @access Private
 */
router.delete('/roles/:roleId/permissions/:permissionId', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Assignments', 'delete'), rolePermission_validator_1.removePermissionFromRoleValidation, rolePermission_controller_1.removePermissionsFromRole);
/**
 * @route GET /api/roles/:roleId/permissions
 * @desc Get all permissions for a role
 * @access Private
 */
router.get('/roles/:roleId/permissions', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Assignments', 'read'), rolePermission_validator_1.getRolePermissionsValidation, rolePermission_controller_1.getRolePermissions);
exports.default = router;
