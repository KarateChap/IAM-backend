"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const permission_controller_1 = __importDefault(require("../controllers/permission.controller"));
const permission_validator_1 = require("../validators/permission.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const permissionController = new permission_controller_1.default();
/**
 * @route   GET /api/permissions
 * @desc    Get all permissions with optional filtering
 * @access  Private
 */
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Permissions', 'read'), permissionController.getAll);
/**
 * @route   GET /api/permissions/:id
 * @desc    Get permission by ID
 * @access  Private
 */
router.get('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Permissions', 'read'), permission_validator_1.getPermissionValidation, permissionController.getById);
/**
 * @route   POST /api/permissions
 * @desc    Create a new permission
 * @access  Private
 */
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Permissions', 'create'), permission_validator_1.createPermissionValidation, permissionController.create);
/**
 * @route   PUT /api/permissions/:id
 * @desc    Update a permission
 * @access  Private
 */
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Permissions', 'update'), permission_validator_1.updatePermissionValidation, permissionController.update);
/**
 * @route   DELETE /api/permissions/:id
 * @desc    Delete a permission
 * @access  Private
 */
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.checkPermission)('Permissions', 'delete'), permission_validator_1.getPermissionValidation, permissionController.delete);
exports.default = router;
