"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userPermission_controller_1 = __importDefault(require("../controllers/userPermission.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const userPermission_validator_1 = require("../validators/userPermission.validator");
const router = (0, express_1.Router)();
const userPermissionController = new userPermission_controller_1.default();
/**
 * @route GET /api/me/permissions
 * @desc Get all permissions for the current user
 * @access Private
 */
router.get('/me/permissions', auth_middleware_1.requireAuth, userPermissionController.getCurrentUserPermissions.bind(userPermissionController));
/**
 * @route POST /api/simulate-action
 * @desc Simulate whether a user can perform an action on a module
 * @access Private
 */
router.post('/simulate-action', auth_middleware_1.requireAuth, userPermission_validator_1.simulateActionValidation, userPermissionController.simulateAction.bind(userPermissionController));
exports.default = router;
