"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_controller_1 = __importDefault(require("../controllers/role.controller"));
const role_validator_1 = require("../validators/role.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const roleController = new role_controller_1.default();
/**
 * @route   GET /api/roles
 * @desc    Get all roles with optional filtering
 * @access  Private
 */
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Roles', 'read'), roleController.getAll);
/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Private
 */
router.get('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Roles', 'read'), role_validator_1.getRoleValidation, roleController.getById);
/**
 * @route   POST /api/roles
 * @desc    Create a new role
 * @access  Private
 */
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Roles', 'create'), role_validator_1.createRoleValidation, roleController.create);
/**
 * @route   PUT /api/roles/:id
 * @desc    Update a role
 * @access  Private
 */
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Roles', 'update'), role_validator_1.updateRoleValidation, roleController.update);
/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete a role
 * @access  Private
 */
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Roles', 'delete'), role_validator_1.getRoleValidation, roleController.delete);
exports.default = router;
